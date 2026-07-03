import asyncio
import json
import logging

import redis.asyncio as aioredis

from src.config import settings
from src.services.face_service import process_single_photo
from src.services.vector_store import fetch_photo_urls, insert_embeddings

logger = logging.getLogger("worker")

STREAM_KEY = "photo:process"
GROUP_NAME = "photo-workers"
CONSUMER_NAME = "ai-worker-1"


async def start_worker():
    if not settings.redis_url:
        logger.info("REDIS_URL not set, worker disabled")
        return

    r = aioredis.from_url(settings.redis_url)

    try:
        await r.xgroup_create(STREAM_KEY, GROUP_NAME, id="0", mkstream=True)
    except aioredis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise

    logger.info("Worker listening on stream '%s'", STREAM_KEY)

    while True:
        try:
            results = await r.xreadgroup(
                GROUP_NAME,
                CONSUMER_NAME,
                {STREAM_KEY: ">"},
                count=1,
                block=5000,
            )
            if not results:
                continue

            for stream_name, entries in results:
                for entry_id, data in entries:
                    await process_entry(data)
                    await r.xack(STREAM_KEY, GROUP_NAME, entry_id)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Worker error: %s", e)
            await asyncio.sleep(1)


async def process_entry(data: dict):
    event_id = data.get(b"eventId", b"").decode()
    photo_ids_raw = data.get(b"photoIds", b"[]").decode()
    photo_ids: list[str] = json.loads(photo_ids_raw)

    logger.info("Processing %d photos for event %s", len(photo_ids), event_id)

    url_map = await fetch_photo_urls(photo_ids)
    for pid in photo_ids:
        url = url_map.get(pid)
        if not url:
            logger.warning("No URL for photo %s, skipping", pid)
            continue
        try:
            embeddings = await process_single_photo(url)
            if embeddings:
                await insert_embeddings(pid, event_id, embeddings)
        except Exception as e:
            logger.error("Worker: failed photo %s: %s", pid, e)
