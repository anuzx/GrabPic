from pydantic import BaseModel, field_validator


class ProcessPhotosRequest(BaseModel):
    eventId: str
    photoIds: list[str]

    @field_validator("photoIds")
    @classmethod
    def validate_photo_ids(cls, v: list[str]) -> list[str]:
        if len(v) > 500:
            raise ValueError("photoIds cannot exceed 500 items")
        if len(v) == 0:
            raise ValueError("photoIds cannot be empty")
        return v


class ProcessPhotosResponse(BaseModel):
    processed: int
    total_faces: int
    failed: int = 0
    failed_photo_ids: list[str] = []


class SearchFaceResponse(BaseModel):
    photoIds: list[str]
