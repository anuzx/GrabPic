from datetime import datetime
from pydantic import BaseModel


class FaceEmbeddingRecord(BaseModel):
    id: str
    photo_id: str
    event_id: str
    user_id: str | None = None
    created_at: datetime


class SearchResult(BaseModel):
    photo_id: str
    similarity: float
