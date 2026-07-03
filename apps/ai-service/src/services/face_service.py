import cv2
import numpy as np
import httpx
from insightface.app import FaceAnalysis

_model: FaceAnalysis | None = None


def get_model() -> FaceAnalysis:
    global _model
    if _model is None:
        app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=-1)
        _model = app
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


def extract_embeddings(image: np.ndarray) -> list[np.ndarray]:
    model = get_model()
    faces = model.get(image)
    return [face.normed_embedding for face in faces]


async def process_single_photo(url: str) -> list[np.ndarray]:
    img = await download_image(url)
    return extract_embeddings(img)
