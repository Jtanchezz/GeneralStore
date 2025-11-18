from collections.abc import AsyncGenerator

import redis.asyncio as redis

from .config import get_settings

settings = get_settings()

_session_store = redis.from_url(settings.session_redis_url, decode_responses=True)
_cache_store = redis.from_url(settings.cache_redis_url, decode_responses=True)


def session_store() -> redis.Redis:
    return _session_store


def cache_store() -> redis.Redis:
    return _cache_store


async def get_session_store() -> AsyncGenerator[redis.Redis, None]:
    yield session_store()


async def get_cache_store() -> AsyncGenerator[redis.Redis, None]:
    yield cache_store()


async def close_redis() -> None:
    await _session_store.close()
    await _cache_store.close()
