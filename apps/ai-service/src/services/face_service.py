import asyncio
import concurrent.futures
import logging
from typing import Any

import cv2
import numpy as np
import httpx
from deepface import DeepFace

logger = logging.getLogger("face_service")

_model: Any = None
_model_load_failed: bool = False
_init_lock: asyncio.Lock = asyncio.Lock()

_client: httpx.AsyncClient | None = None
_inference_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

MODEL_NAME = "Facenet512"
DETECTOR_BACKEND = "retinaface"


MODEL_INIT_TIMEOUT = 15
INFERENCE_TIMEOUT = 8


async def get_model() -> Any:
    global _model, _model_load_failed
    if _model_load_failed:
        raise RuntimeError("DeepFace model failed to load previously")
    if _model is not None:
        return _model
    async with _init_lock:
        if _model_load_failed:
            raise RuntimeError("DeepFace model failed to load previously")
        if _model is not None:
            return _model
        loop = asyncio.get_running_loop()
        try:
            _model = await asyncio.wait_for(
                loop.run_in_executor(
                    _inference_executor, lambda: DeepFace.build_model(MODEL_NAME)
                ),
                timeout=MODEL_INIT_TIMEOUT,
            )
        except Exception:
            _model_load_failed = True
            raise
    return _model


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=30)
    return _client


async def close_client() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        _client = None
        logger.info("httpx client closed")


async def download_image(url: str) -> np.ndarray:
    client = await _get_client()
    resp = await client.get(url)
    resp.raise_for_status()
    buf = np.frombuffer(resp.content, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Failed to decode image from {url}")
    return img


async def extract_embeddings(image: np.ndarray) -> list[np.ndarray]:
    model = await get_model()
    loop = asyncio.get_running_loop()
    try:
        objs = await asyncio.wait_for(
            loop.run_in_executor(
                _inference_executor,
                lambda: DeepFace.represent(
                    img_path=image,
                    model_name=MODEL_NAME,
                    enforce_detection=True,
                    detector_backend=DETECTOR_BACKEND,
                    l2_normalize=True,
                ),
            ),
            timeout=INFERENCE_TIMEOUT,
        )
        return [np.array(obj["embedding"], dtype=np.float32) for obj in objs]  # pyright: ignore[reportCallIssue, reportArgumentType]
    except asyncio.TimeoutError:
        raise TimeoutError(f"Face embedding extraction timed out after {INFERENCE_TIMEOUT}s")
    except ValueError as e:
        if "Face could not be detected" in str(e):
            return []
        raise e


async def process_single_photo(url: str) -> list[np.ndarray]:
    img = await download_image(url)
    return await extract_embeddings(img)
