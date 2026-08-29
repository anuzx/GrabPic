import asyncio
import logging
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.schemas.requests import (
    ProcessPhotosRequest,
    ProcessPhotosResponse,
    SearchFaceResponse,
)
from src.services.face_service import (
    close_client,
    extract_embeddings,
    process_single_photo,
)
from src.services.vector_store import (
    close_pool,
    ensure_table,
    fetch_photo_urls,
    insert_embeddings,
    search_similar_faces,
)
from src.worker.worker import start_worker

logger = logging.getLogger("ai-service")

MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB
SEARCH_FACE_TIMEOUT = 10
PROCESS_CONCURRENCY = 10
WORKER_MAX_RESTARTS = 5
WORKER_RESTART_BACKOFF = 10  # seconds, doubles each restart


def verify_api_key(request: Request) -> None:
    if not settings.api_key:
        return
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = auth_header[7:]
    if token != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_table()
    worker_task: asyncio.Task[None] | None = None
    restart_count = 0

    if settings.redis_url:
        worker_task = asyncio.create_task(start_worker())
        worker_task.add_done_callback(
            lambda t: _on_worker_done(t, nonlocal_ref := {"count": restart_count})
        )

    def _on_worker_done(task: asyncio.Task[None], nonlocal_ref: dict) -> None:
        if task.cancelled():
            return
        exc = task.exception()
        if exc:
            nonlocal_ref["count"] += 1
            if nonlocal_ref["count"] <= WORKER_MAX_RESTARTS:
                delay = WORKER_RESTART_BACKOFF * (2 ** (nonlocal_ref["count"] - 1))
                logger.critical(
                    "Worker task crashed (restart %d/%d in %ds): %s",
                    nonlocal_ref["count"],
                    WORKER_MAX_RESTARTS,
                    delay,
                    exc,
                )
                asyncio.get_event_loop().call_later(
                    delay,
                    lambda: asyncio.ensure_future(_restart_worker(nonlocal_ref)),
                )
            else:
                logger.critical(
                    "Worker task crashed %d times, giving up: %s",
                    nonlocal_ref["count"],
                    exc,
                )

    async def _restart_worker(nonlocal_ref: dict) -> None:
        nonlocal worker_task
        worker_task = asyncio.create_task(start_worker())
        worker_task.add_done_callback(
            lambda t: _on_worker_done(t, nonlocal_ref)
        )

    yield

    if worker_task is not None:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
    await close_client()
    await close_pool()
    logger.info("Cleanup complete")


app = FastAPI(title="GrabPic AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    checks = {"status": "healthy"}
    try:
        from src.services.vector_store import get_pool

        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        checks["database"] = "ok"
    except Exception as e:
        checks["status"] = "degraded"
        checks["database"] = str(e)
    return JSONResponse(
        content=checks,
        status_code=200 if checks["status"] == "healthy" else 503,
    )


@app.post("/process-photos", response_model=ProcessPhotosResponse)
async def process_photos(req: ProcessPhotosRequest, request: Request):
    verify_api_key(request)

    logger.info("Processing %d photos for event %s", len(req.photoIds), req.eventId)
    url_map = await fetch_photo_urls(req.photoIds)
    if not url_map:
        raise HTTPException(status_code=404, detail="No photos found")

    sem = asyncio.Semaphore(PROCESS_CONCURRENCY)
    total_faces = 0
    processed = 0
    failed_ids: list[str] = []
    lock = asyncio.Lock()

    async def _process_one(photo_id: str) -> None:
        nonlocal total_faces, processed
        url = url_map.get(photo_id)
        if not url:
            logger.warning("No URL for photo %s, skipping", photo_id)
            return
        async with sem:
            try:
                embeddings = await process_single_photo(url)
                if embeddings:
                    await insert_embeddings(photo_id, req.eventId, embeddings)
                    async with lock:
                        total_faces += len(embeddings)
                async with lock:
                    processed += 1
            except Exception as e:
                logger.error("Failed to process photo %s: %s", photo_id, e)
                async with lock:
                    failed_ids.append(photo_id)

    await asyncio.gather(*[_process_one(pid) for pid in req.photoIds])

    return ProcessPhotosResponse(
        processed=processed,
        total_faces=total_faces,
        failed=len(failed_ids),
        failed_photo_ids=failed_ids,
    )


async def _do_face_search(event_id: str, img: np.ndarray) -> SearchFaceResponse:
    embeddings = await extract_embeddings(img)
    if not embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the uploaded photo")

    query_emb = embeddings[0]
    results = await search_similar_faces(event_id, query_emb)

    photo_ids = [r.photo_id for r in results]
    return SearchFaceResponse(photoIds=photo_ids)


@app.post("/search-face", response_model=SearchFaceResponse)
async def search_face(request: Request, eventId: str = Query(...)):
    verify_api_key(request)

    content_type = request.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Content-Type must be an image")

    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="Image data is required")
    if len(body) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large (max 20MB)")

    buf = np.frombuffer(body, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Failed to decode image")

    try:
        return await asyncio.wait_for(_do_face_search(eventId, img), timeout=SEARCH_FACE_TIMEOUT)
    except asyncio.TimeoutError:
        logger.warning("Face search timed out for event %s", eventId)
        raise HTTPException(status_code=504, detail="Face search timed out")
