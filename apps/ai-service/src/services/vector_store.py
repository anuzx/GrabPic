import asyncio
import logging

import asyncpg
import numpy as np
from src.config import settings
from src.models.face import SearchResult

logger = logging.getLogger("vector_store")

_pool: asyncpg.Pool | None = None
_pool_lock = asyncio.Lock()
_reset_lock = asyncio.Lock()


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool
    async with _pool_lock:
        if _pool is not None:
            return _pool
        _pool = await asyncpg.create_pool(
            settings.database_url, min_size=2, max_size=10
        )
        return _pool


async def _reset_pool() -> None:
    global _pool
    async with _reset_lock:
        if _pool is not None:
            try:
                await _pool.close()
            except Exception:
                pass
            _pool = None
            logger.warning("Connection pool closed and reset")


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Connection pool closed")


async def ensure_table() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
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
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT id, url FROM "Photo" WHERE id = ANY($1::text[])',
                photo_ids,
            )
        return {row["id"]: row["url"] for row in rows}
    except asyncpg.PostgresError:
        await _reset_pool()
        raise


async def delete_embeddings_by_photo_ids(photo_ids: list[str]) -> None:
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM face_embeddings WHERE photo_id = ANY($1::text[])",
                photo_ids,
            )
    except asyncpg.PostgresError:
        await _reset_pool()
        raise


async def insert_embeddings(
    photo_id: str,
    event_id: str,
    embeddings: list[np.ndarray],
    user_id: str | None = None,
) -> None:
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.executemany(
                    """
                    INSERT INTO face_embeddings (photo_id, event_id, user_id, embedding)
                    VALUES ($1, $2, $3, $4::text::vector)
                    """,
                    [
                        (photo_id, event_id, user_id, str(emb.tolist()))
                        for emb in embeddings
                    ],
                )
    except asyncpg.PostgresError:
        await _reset_pool()
        raise


async def search_similar_faces(
    event_id: str,
    query_embedding: np.ndarray,
    limit: int = 20,
    threshold: float = 0.3,
) -> list[SearchResult]:
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT photo_id, 1 - (embedding <=> $1::text::vector) AS similarity
                FROM face_embeddings
                WHERE event_id = $2
                  AND 1 - (embedding <=> $1::text::vector) >= $3
                ORDER BY embedding <=> $1::text::vector
                LIMIT $4
                """,
                str(query_embedding.tolist()),
                event_id,
                threshold,
                limit,
            )
        return [
            SearchResult(photo_id=r["photo_id"], similarity=float(r["similarity"]))
            for r in rows
        ]
    except asyncpg.PostgresError:
        await _reset_pool()
        raise
