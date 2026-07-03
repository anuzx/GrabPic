import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from src.config import settings
from src.schemas.requests import (
    ProcessPhotosRequest,
    SearchFaceRequest,
    ProcessPhotosResponse,
    SearchFaceResponse,
)
from src.services.face_service import process_single_photo, extract_embeddings, download_image
from src.services.vector_store import ensure_table, fetch_photo_urls, insert_embeddings, search_similar_faces
from src.worker.worker import start_worker

logger = logging.getLogger("ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_table()
    worker_task = None
    if settings.redis_url:
        worker_task = asyncio.create_task(start_worker())
    yield
    if worker_task:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="GrabPic AI Service", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/process-photos", response_model=ProcessPhotosResponse)
async def process_photos(req: ProcessPhotosRequest):
    if not req.photoIds:
        raise HTTPException(status_code=400, detail="photoIds cannot be empty")

    logger.info("Processing %d photos for event %s", len(req.photoIds), req.eventId)
    url_map = await fetch_photo_urls(req.photoIds)
    if not url_map:
        raise HTTPException(status_code=404, detail="No photos found")

    total_faces = 0
    processed = 0

    for photo_id in req.photoIds:
        url = url_map.get(photo_id)
        if not url:
            logger.warning("No URL for photo %s, skipping", photo_id)
            continue
        try:
            embeddings = await process_single_photo(url)
            if embeddings:
                await insert_embeddings(photo_id, req.eventId, embeddings)
                total_faces += len(embeddings)
            processed += 1
        except Exception as e:
            logger.error("Failed to process photo %s: %s", photo_id, e)

    return ProcessPhotosResponse(processed=processed, total_faces=total_faces)


@app.post("/search-face", response_model=SearchFaceResponse)
async def search_face(req: SearchFaceRequest):
    try:
        img = await download_image(req.facePhotoUrl)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to download face photo: {e}")

    embeddings = extract_embeddings(img)
    if not embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the uploaded photo")

    query_emb = embeddings[0]
    results = await search_similar_faces(req.eventId, query_emb)

    photo_ids = [r["photo_id"] for r in results]
    return SearchFaceResponse(photoIds=photo_ids)
