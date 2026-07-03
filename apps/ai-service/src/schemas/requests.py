from pydantic import BaseModel


class ProcessPhotosRequest(BaseModel):
    eventId: str
    photoIds: list[str]


class SearchFaceRequest(BaseModel):
    eventId: str
    facePhotoUrl: str


class ProcessPhotosResponse(BaseModel):
    processed: int
    total_faces: int


class SearchFaceResponse(BaseModel):
    photoIds: list[str]
