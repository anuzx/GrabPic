from src.services.face_service import (
    close_client,
    download_image,
    extract_embeddings,
    get_model,
    process_single_photo,
)
from src.services.vector_store import (
    close_pool,
    delete_embeddings_by_photo_ids,
    ensure_table,
    fetch_photo_urls,
    get_pool,
    insert_embeddings,
    search_similar_faces,
)

__all__ = [
    "close_client",
    "download_image",
    "extract_embeddings",
    "get_model",
    "process_single_photo",
    "close_pool",
    "delete_embeddings_by_photo_ids",
    "ensure_table",
    "fetch_photo_urls",
    "get_pool",
    "insert_embeddings",
    "search_similar_faces",
]
