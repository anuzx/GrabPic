import asyncio
import json
import logging
import time

import redis.asyncio as aioredis

from src.config import settings
from src.services.face_service import process_single_photo
from src.services.vector_store import (
    fetch_photo_urls,
    insert_embeddings,
    delete_embeddings_by_photo_ids,
)

logger = logging.getLogger("worker")

STREAM_KEY = "photo:process"
GROUP_NAME = "photo-workers"
CONSUMER_NAME = "ai-worker-1"
DEAD_STREAM_KEY = "photo:process:dead"
RETRY_REDIS_PREFIX = "retry:photo:"
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2
DEAD_LETTER_POLL_INTERVAL = 300


async def start_worker():
    if not settings.redis_url:
        logger.info("REDIS_URL not set, worker disabled")
        return

    r: aioredis.Redis = aioredis.from_url(settings.redis_url, socket_timeout=10.0)

    try:
        await r.xgroup_create(STREAM_KEY, GROUP_NAME, id="0", mkstream=True)
    except aioredis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise

    await claim_pending_messages(r)

    asyncio.create_task(reprocess_dead_letters(r))

    logger.info("Worker listening on stream '%s'", STREAM_KEY)

    while True:
        try:
            results = await r.xreadgroup(
                GROUP_NAME,
                CONSUMER_NAME,
                {STREAM_KEY: ">"},
                count=1,
                block=1000,
            )
            if not results:
                continue

            for _stream_name, entries in results:
                for entry_id_bytes, data in entries:
                    eid = (
                        entry_id_bytes.decode()
                        if isinstance(entry_id_bytes, bytes)
                        else str(entry_id_bytes)
                    )
                    success = await process_with_retry(r, eid, data)
                    await r.xack(STREAM_KEY, GROUP_NAME, entry_id_bytes)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Worker error: %s", e)
            await asyncio.sleep(1)


async def process_entry(data: dict[bytes, bytes]):
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


def _parse_photo_ids(data: dict[bytes, bytes]) -> list[str]:
    raw = data.get(b"photoIds", b"[]")
    if isinstance(raw, bytes):
        raw = raw.decode()
    return json.loads(raw)


async def process_with_retry(r: aioredis.Redis, entry_id: str, data: dict[bytes, bytes]) -> bool:
    retry_key = f"{RETRY_REDIS_PREFIX}{entry_id}"

    retry_count_raw = await r.get(retry_key)
    retry_count = int(retry_count_raw) if retry_count_raw else 0

    for attempt in range(retry_count + 1, MAX_RETRIES + 1):
        try:
            photo_ids = _parse_photo_ids(data)
            if attempt > 1:
                await delete_embeddings_by_photo_ids(photo_ids)

            await process_entry(data)
            await r.delete(retry_key)
            return True
        except Exception as e:
            await r.set(retry_key, str(attempt), ex=86400)

            if attempt < MAX_RETRIES:
                backoff = RETRY_BACKOFF_BASE ** (attempt - retry_count)
                logger.warning(
                    "Attempt %d/%d failed for stream entry %s, retrying in %ds: %s",
                    attempt, MAX_RETRIES, entry_id, backoff, e,
                )
                await asyncio.sleep(backoff)
            else:
                logger.critical(
                    "All %d attempts failed for stream entry %s: %s",
                    MAX_RETRIES, entry_id, e,
                )
                await r.xadd(DEAD_STREAM_KEY, {
                    b"eventId": data.get(b"eventId", b""),
                    b"photoIds": data.get(b"photoIds", b"[]"),
                    b"failedAt": str(time.time()).encode(),
                    b"reason": str(e).encode(),
                })
                await r.delete(retry_key)
                return False

    return False


async def claim_pending_messages(r: aioredis.Redis):
    try:
        summary = await r.xpending(STREAM_KEY, GROUP_NAME)
        if not isinstance(summary, dict):
            return
        pending_count = summary.get("pending", 0)
        if not pending_count:
            return

        details = await r.xpending(STREAM_KEY, GROUP_NAME, "-", "+", 100)
        if not details:
            return

        entry_ids: list[str] = []
        for entry in details:
            if isinstance(entry, (list, tuple)) and len(entry) > 0:
                eid = entry[0]
                if isinstance(eid, bytes):
                    entry_ids.append(eid.decode())
                elif eid is not None:
                    entry_ids.append(str(eid))

        if entry_ids:
            claimed = await r.xclaim(
                STREAM_KEY, GROUP_NAME, CONSUMER_NAME, 60000, entry_ids,
            )
            logger.info("Claimed %d pending messages for reprocessing", len(claimed))
    except Exception as e:
        logger.warning("Failed to claim pending messages: %s", e)


async def reprocess_dead_letters(r: aioredis.Redis):
    await asyncio.sleep(DEAD_LETTER_POLL_INTERVAL)

    while True:
        try:
            length = await r.xlen(DEAD_STREAM_KEY)
            if length == 0:
                await asyncio.sleep(DEAD_LETTER_POLL_INTERVAL)
                continue

            entries = await r.xrange(DEAD_STREAM_KEY, "-", "+", count=10)
            for entry_id, data in entries or []:
                if entry_id is None or not data:
                    continue
                await r.xadd(STREAM_KEY, data)
                await r.xdel(DEAD_STREAM_KEY, entry_id)
                eid_str = (
                    entry_id.decode()
                    if isinstance(entry_id, bytes)
                    else str(entry_id)
                )
                logger.info("Re-queued dead letter %s", eid_str)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error("Dead letter reprocess error: %s", e)

        await asyncio.sleep(DEAD_LETTER_POLL_INTERVAL)