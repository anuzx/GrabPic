import asyncpg
import numpy as np
from src.config import settings
from src.models.face import SearchResult

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url, min_size=2, max_size=10
        )
    return _pool


async def ensure_table():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS face_embeddings (
                id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                photo_id  TEXT NOT NULL,
                event_id  TEXT NOT NULL,
                user_id   TEXT,
                embedding vector(512) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_fe_event ON face_embeddings(event_id)"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_fe_photo ON face_embeddings(photo_id)"
        )


async def fetch_photo_urls(photo_ids: list[str]) -> dict[str, str]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            'SELECT id, url FROM "Photo" WHERE id = ANY($1::text[])',
            photo_ids,
        )
    return {row["id"]: row["url"] for row in rows}


async def delete_embeddings_by_photo_ids(photo_ids: list[str]):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM face_embeddings WHERE photo_id = ANY($1::text[])",
            photo_ids,
        )


async def insert_embeddings(
    photo_id: str,
    event_id: str,
    embeddings: list[np.ndarray],
    user_id: str | None = None,
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        for emb in embeddings:
            await conn.execute(
                """
                INSERT INTO face_embeddings (photo_id, event_id, user_id, embedding)
                VALUES ($1, $2, $3, $4::vector)
                """,
                photo_id,
                event_id,
                user_id,
                emb.tolist(),
            )


async def search_similar_faces(
    event_id: str,
    query_embedding: np.ndarray,
    limit: int = 20,
    threshold: float = 0.3,
) -> list[SearchResult]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT photo_id, 1 - (embedding <=> $1::vector) AS similarity
            FROM face_embeddings
            WHERE event_id = $2
              AND 1 - (embedding <=> $1::vector) >= $3
            ORDER BY embedding <=> $1::vector
            LIMIT $4
            """,
            query_embedding.tolist(),
            event_id,
            threshold,
            limit,
        )
    return [
        SearchResult(photo_id=r["photo_id"], similarity=float(r["similarity"]))
        for r in rows
    ]
