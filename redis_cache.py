"""Distributed cache using Redis.

Stores extraction results in Redis for multi-instance deployments.
If redis is not installed, the engine reports as unavailable.
"""

from __future__ import annotations

import json
from typing import Any

ENGINE_NAME = "redis"
ENGINE_VERSION = "0.1.0"


class RedisCacheError(Exception):
    """Raised when Redis cache operations fail."""


def is_available() -> bool:
    """Check if redis-py is installed."""
    try:
        import redis  # noqa: F401
        return True
    except ImportError:
        return False


class RedisCache:
    """Redis-backed distributed cache."""

    def __init__(self, url: str = "redis://localhost:6379/0", ttl: int = 3600):
        self._url = url
        self._ttl = ttl
        self._client = None

        if not is_available():
            raise RedisCacheError(
                "Redis is not available. Install redis package to use RedisCache."
            )

        import redis
        self._client = redis.from_url(url, decode_responses=True)

    def get(self, key: str) -> Any | None:
        try:
            data = self._client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as exc:
            raise RedisCacheError(f"Redis get failed: {exc}") from exc

    def set(self, key: str, value: Any) -> None:
        try:
            serialized = json.dumps(value, default=str)
            self._client.setex(key, self._ttl, serialized)
        except Exception as exc:
            raise RedisCacheError(f"Redis set failed: {exc}") from exc

    def delete(self, key: str) -> bool:
        try:
            return bool(self._client.delete(key))
        except Exception as exc:
            raise RedisCacheError(f"Redis delete failed: {exc}") from exc

    def clear(self) -> None:
        try:
            self._client.flushdb()
        except Exception as exc:
            raise RedisCacheError(f"Redis clear failed: {exc}") from exc

    def size(self) -> int:
        try:
            return int(self._client.dbsize())
        except Exception as exc:
            raise RedisCacheError(f"Redis size failed: {exc}") from exc

    def stats(self) -> dict:
        return {
            "size": self.size(),
            "ttl": self._ttl,
            "url": self._url,
        }
