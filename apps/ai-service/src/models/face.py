from pydantic import BaseModel


class SearchResult(BaseModel):
    photo_id: str
    similarity: float
