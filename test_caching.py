"""Tests for the caching layer — memory cache, SQLite cache, cache strategies, cache manager."""

from __future__ import annotations

import os
import tempfile
import time

import pytest

from caching.memory_cache import MemoryCache
from caching.sqlite_cache import SqliteCache
from caching.cache_strategies import (
    EvictionPolicy,
    CacheEntryMeta,
    select_eviction_candidates,
    compute_smart_score,
    should_evict_lru,
    should_evict_lfu,
    should_evict_ttl,
)
from caching.cache_manager import CacheManager


class TestMemoryCache:
    def test_set_and_get(self):
        cache = MemoryCache(max_size=10)
        cache.set("key1", {"data": "value"})
        assert cache.get("key1") == {"data": "value"}

    def test_get_missing_returns_none(self):
        cache = MemoryCache()
        assert cache.get("nonexistent") is None

    def test_lru_eviction(self):
        cache = MemoryCache(max_size=3)
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)
        cache.set("d", 4)  # Should evict "a"
        assert cache.get("a") is None
        assert cache.get("b") == 2
        assert cache.get("d") == 4

    def test_delete(self):
        cache = MemoryCache()
        cache.set("key", "value")
        assert cache.delete("key") is True
        assert cache.get("key") is None
        assert cache.delete("key") is False

    def test_clear(self):
        cache = MemoryCache()
        cache.set("a", 1)
        cache.set("b", 2)
        cache.clear()
        assert cache.size() == 0

    def test_stats(self):
        cache = MemoryCache()
        cache.set("a", 1)
        cache.get("a")  # hit
        cache.get("b")  # miss
        stats = cache.stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["size"] == 1
        assert 0 < stats["hit_rate"] <= 1.0


class TestSqliteCache:
    @pytest.fixture
    def cache(self):
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        cache = SqliteCache(db_path=db_path)
        yield cache
        os.unlink(db_path)

    def test_set_and_get(self, cache: SqliteCache):
        cache.set("key1", {"data": "value"})
        assert cache.get("key1") == {"data": "value"}

    def test_get_missing_returns_none(self, cache: SqliteCache):
        assert cache.get("nonexistent") is None

    def test_delete(self, cache: SqliteCache):
        cache.set("key", "value")
        assert cache.delete("key") is True
        assert cache.get("key") is None

    def test_clear(self, cache: SqliteCache):
        cache.set("a", 1)
        cache.set("b", 2)
        cache.clear()
        assert cache.size() == 0

    def test_size(self, cache: SqliteCache):
        cache.set("a", 1)
        cache.set("b", 2)
        assert cache.size() == 2

    def test_stats(self, cache: SqliteCache):
        cache.set("a", 1)
        cache.get("a")
        stats = cache.stats()
        assert stats["size"] == 1
        assert stats["total_hits"] >= 1

    def test_persistence_across_instances(self):
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        try:
            cache1 = SqliteCache(db_path=db_path)
            cache1.set("persistent_key", {"value": 42})

            cache2 = SqliteCache(db_path=db_path)
            assert cache2.get("persistent_key") == {"value": 42}
        finally:
            os.unlink(db_path)


class TestCacheStrategies:
    def test_should_evict_lru_old_entry(self):
        meta = CacheEntryMeta(
            key="old",
            created_at=time.time() - 3600,
            last_accessed=time.time() - 3600,
            access_count=5,
            size_bytes=100,
        )
        assert should_evict_lru(meta, max_age_seconds=1800) is True

    def test_should_evict_lru_recent_entry(self):
        meta = CacheEntryMeta(
            key="recent",
            created_at=time.time(),
            last_accessed=time.time(),
            access_count=5,
            size_bytes=100,
        )
        assert should_evict_lru(meta, max_age_seconds=3600) is False

    def test_should_evict_lfu_low_access(self):
        meta = CacheEntryMeta(
            key="rare",
            created_at=time.time(),
            last_accessed=time.time(),
            access_count=1,
            size_bytes=100,
        )
        assert should_evict_lfu(meta, min_access_count=3) is True

    def test_should_evict_lfu_high_access(self):
        meta = CacheEntryMeta(
            key="frequent",
            created_at=time.time(),
            last_accessed=time.time(),
            access_count=10,
            size_bytes=100,
        )
        assert should_evict_lfu(meta, min_access_count=3) is False

    def test_should_evict_ttl_expired(self):
        meta = CacheEntryMeta(
            key="expired",
            created_at=time.time() - 3600,
            last_accessed=time.time(),
            access_count=5,
            size_bytes=100,
        )
        assert should_evict_ttl(meta, ttl_seconds=1800) is True

    def test_compute_smart_score(self):
        meta = CacheEntryMeta(
            key="test",
            created_at=time.time(),
            last_accessed=time.time(),
            access_count=5,
            size_bytes=1000,
        )
        score = compute_smart_score(meta)
        assert isinstance(score, float)

    def test_select_eviction_candidates_lru(self):
        now = time.time()
        entries = [
            CacheEntryMeta("a", now - 100, now - 100, 5, 100),
            CacheEntryMeta("b", now - 50, now - 50, 3, 100),
            CacheEntryMeta("c", now - 10, now - 10, 1, 100),
        ]
        candidates = select_eviction_candidates(entries, target_count=1, policy=EvictionPolicy.LRU)
        assert "a" in candidates

    def test_select_eviction_candidates_smart(self):
        now = time.time()
        entries = [
            CacheEntryMeta("old_rare", now - 3600, now - 3600, 1, 100),
            CacheEntryMeta("new_frequent", now, now, 10, 100),
            CacheEntryMeta("mid", now - 1800, now - 900, 3, 100),
        ]
        candidates = select_eviction_candidates(entries, target_count=1, policy=EvictionPolicy.SMART)
        # 3 entries, target 1 → 2 candidates to evict
        assert len(candidates) == 2
        # "new_frequent" should be kept (highest score), so not in eviction list
        assert "new_frequent" not in candidates

    def test_no_eviction_needed(self):
        entries = [CacheEntryMeta("a", time.time(), time.time(), 1, 100)]
        candidates = select_eviction_candidates(entries, target_count=5)
        assert candidates == []


class TestCacheManager:
    @pytest.fixture
    def cache_manager(self):
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        cm = CacheManager(sqlite_path=db_path)
        yield cm
        os.unlink(db_path)

    def test_make_key_consistent(self):
        key1 = CacheManager.make_key(b"test data", "file.pdf")
        key2 = CacheManager.make_key(b"test data", "file.pdf")
        assert key1 == key2

    def test_make_key_different_data(self):
        key1 = CacheManager.make_key(b"data1", "file.pdf")
        key2 = CacheManager.make_key(b"data2", "file.pdf")
        assert key1 != key2

    def test_set_and_get(self, cache_manager: CacheManager):
        cache_manager.set("key1", {"result": "test"})
        assert cache_manager.get("key1") == {"result": "test"}

    def test_memory_backfill_from_sqlite(self, cache_manager: CacheManager):
        cache_manager.set("key1", {"data": "value"})
        # Clear memory but not sqlite
        cache_manager._memory.clear()
        # Get should find in sqlite and backfill memory
        result = cache_manager.get("key1")
        assert result == {"data": "value"}
        assert cache_manager._memory.get("key1") is not None

    def test_delete(self, cache_manager: CacheManager):
        cache_manager.set("key1", "value")
        assert cache_manager.delete("key1") is True
        assert cache_manager.get("key1") is None

    def test_clear(self, cache_manager: CacheManager):
        cache_manager.set("a", 1)
        cache_manager.set("b", 2)
        cache_manager.clear()
        assert cache_manager.get("a") is None
        assert cache_manager.get("b") is None

    def test_stats(self, cache_manager: CacheManager):
        cache_manager.set("a", 1)
        stats = cache_manager.stats()
        assert "memory" in stats
        assert "sqlite" in stats
        assert "redis" in stats
