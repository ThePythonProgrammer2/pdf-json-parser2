"""Blueprint-aligned wrapper around the cache strategy helpers."""

from caching.cache_strategies import *

__all__ = [
    "EvictionPolicy",
    "CacheEntryMeta",
    "should_evict_lru",
    "should_evict_lfu",
    "should_evict_ttl",
    "compute_smart_score",
    "select_eviction_candidates",
]
