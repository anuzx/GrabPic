import asyncio
from typing import Any

import cv2
import numpy as np
import httpx
from deepface import DeepFace

_model: Any = None
_init_lock: asyncio.Lock = asyncio.Lock()

MODEL_NAME = "Facenet512"
DETECTOR_BACKEND = "retinaface"


async def get_model() -> Any:
    global _model
    if _model is not None:
        return _model
    async with _init_lock:
        if _model is not None:
            return _model
        loop = asyncio.get_running_loop()
        # Build the model using run_in_executor to avoid blocking the event loop
        _model = await loop.run_in_executor(
            None, lambda: DeepFace.build_model(MODEL_NAME)
        )
    return _model


async def download_image(url: str) -> np.ndarray:
    async with httpx.AsyncClient(timeout=30) as client:
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
        # Run represent in an executor to avoid blocking the main event loop
        objs = await loop.run_in_executor(
            None,
            lambda: DeepFace.represent(
                img_path=image,
                model_name=MODEL_NAME,
                enforce_detection=True,
                detector_backend=DETECTOR_BACKEND,
                l2_normalize=True,
            ),
        )
        # DeepFace returns a list of dictionaries, extract the L2 normalized embedding list and convert to np.ndarray
        return [np.array(obj["embedding"], dtype=np.float32) for obj in objs]
    except ValueError as e:
        # If no face is detected, DeepFace raises a ValueError.
        # We catch this and return an empty list of embeddings, matching original behavior.
        if "Face could not be detected" in str(e):
            return []
        raise e


async def process_single_photo(url: str) -> list[np.ndarray]:
    img = await download_image(url)
    return await extract_embeddings(img)
