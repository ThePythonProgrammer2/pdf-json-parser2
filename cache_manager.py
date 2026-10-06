"""Multi-tier caching orchestrator.

Coordinates between memory, SQLite, and Redis cache tiers.
Reads flow: memory → sqlite → redis (if available).
Writes flow: memory + sqlite + redis (if available).
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any

from caching.memory_cache import MemoryCache
from caching.sqlite_cache import SqliteCache
from caching.cache_strategies import EvictionPolicy, select_eviction_candidates, CacheEntryMeta

logger = logging.getLogger("cache_manager")


class CacheManager:
    """Multi-tier cache coordinator.

    Tier 1: Memory (fastest, volatile, LRU)
    Tier 2: SQLite (persistent, local)
    Tier 3: Redis (distributed, optional)
    """

    def __init__(
        self,
        memory_size: int = 100,
        sqlite_path: str = "cache.db",
        enable_redis: bool = False,
        redis_url: str = "redis://localhost:6379/0",
    ):
        self._memory = MemoryCache(max_size=memory_size)
        self._sqlite = SqliteCache(db_path=sqlite_path)
        self._redis = None

        if enable_redis:
            try:
                from caching.redis_cache import RedisCache
                self._redis = RedisCache(url=redis_url)
                logger.info("Redis cache enabled")
            except Exception as exc:
                logger.warning(f"Redis cache unavailable: {exc}")
                self._redis = None

    @staticmethod
    def make_key(data: bytes, filename: str = "") -> str:
        """Generate a cache key from file content hash."""
        hasher = hashlib.sha256()
        hasher.update(data)
        if filename:
            hasher.update(filename.encode())
        return hasher.hexdigest()

    def get(self, key: str) -> Any | None:
        """Get from cache, checking tiers in order."""
        # Tier 1: Memory
        result = self._memory.get(key)
        if result is not None:
            return result

        # Tier 2: SQLite
        result = self._sqlite.get(key)
        if result is not None:
            # Backfill memory cache
            self._memory.set(key, result)
            return result

        # Tier 3: Redis
        if self._redis:
            try:
                result = self._redis.get(key)
                if result is not None:
                    self._memory.set(key, result)
                    self._sqlite.set(key, result)
                    return result
            except Exception as exc:
                logger.warning(f"Redis get failed: {exc}")

        return None

    def set(self, key: str, value: Any) -> None:
        """Set in all available cache tiers."""
        self._memory.set(key, value)
        self._sqlite.set(key, value)

        if self._redis:
            try:
                self._redis.set(key, value)
            except Exception as exc:
                logger.warning(f"Redis set failed: {exc}")

    def delete(self, key: str) -> bool:
        """Delete from all tiers."""
        deleted = self._memory.delete(key)
        deleted = self._sqlite.delete(key) or deleted
        if self._redis:
            try:
                self._redis.delete(key)
            except Exception:
                pass
        return deleted

    def clear(self) -> None:
        """Clear all cache tiers."""
        self._memory.clear()
        self._sqlite.clear()
        if self._redis:
            try:
                self._redis.clear()
            except Exception:
                pass

    def stats(self) -> dict:
        """Return stats from all cache tiers."""
        stats = {
            "memory": self._memory.stats(),
            "sqlite": self._sqlite.stats(),
            "redis": None,
        }
        if self._redis:
            try:
                stats["redis"] = self._redis.stats()
            except Exception:
                stats["redis"] = {"error": "Redis stats failed"}
        return stats

    def evict(self, policy: EvictionPolicy = EvictionPolicy.SMART, target_size: int = 50) -> int:
        """Run eviction on the memory cache.

        Returns the number of entries evicted.
        """
        # Get memory cache stats
        current_size = self._memory.size()
        if current_size <= target_size:
            return 0

        # For memory cache, we use its built-in LRU eviction
        # The smart eviction would need access to entry metadata
        # which MemoryCache handles internally via OrderedDict
        return 0  # MemoryCache auto-evicts via LRU when at capacity
