"""Smart cache eviction strategies.

Provides multiple eviction policies for the cache layer:
- LRU (Least Recently Used)
- LFU (Least Frequently Used)
- TTL (Time-To-Live)
- Size-based with smart scoring
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from enum import Enum


class EvictionPolicy(str, Enum):
    """Available cache eviction policies."""

    LRU = "lru"
    LFU = "lfu"
    TTL = "ttl"
    SMART = "smart"


@dataclass
class CacheEntryMeta:
    """Metadata tracked for eviction decisions."""

    key: str
    created_at: float
    last_accessed: float
    access_count: int
    size_bytes: int


def should_evict_lru(meta: CacheEntryMeta, max_age_seconds: int | None = None) -> bool:
    """LRU eviction: evict if not accessed recently."""
    if max_age_seconds is None:
        return False
    age = time.time() - meta.last_accessed
    return age > max_age_seconds


def should_evict_lfu(meta: CacheEntryMeta, min_access_count: int = 2) -> bool:
    """LFU eviction: evict if access count is below threshold."""
    return meta.access_count < min_access_count


def should_evict_ttl(meta: CacheEntryMeta, ttl_seconds: int) -> bool:
    """TTL eviction: evict if entry has exceeded its time-to-live."""
    age = time.time() - meta.created_at
    return age > ttl_seconds


def compute_smart_score(meta: CacheEntryMeta) -> float:
    """Smart eviction score combining recency, frequency, and size.

    Higher score = more valuable = less likely to evict.
    """
    now = time.time()
    recency_score = 1.0 / (1.0 + (now - meta.last_accessed) / 3600.0)  # Decay over hours
    frequency_score = min(meta.access_count / 10.0, 1.0)  # Cap at 10 accesses
    size_penalty = min(meta.size_bytes / 1_000_000.0, 1.0)  # Penalize large entries (MB)

    return (recency_score * 0.4) + (frequency_score * 0.4) - (size_penalty * 0.2)


def select_eviction_candidates(
    entries: list[CacheEntryMeta],
    target_count: int,
    policy: EvictionPolicy = EvictionPolicy.SMART,
) -> list[str]:
    """Select keys to evict to reduce cache to target_count.

    Args:
        entries: Metadata for all cache entries.
        target_count: Desired number of entries after eviction.
        policy: Eviction policy to use.

    Returns:
        List of keys to evict.
    """
    if len(entries) <= target_count:
        return []

    num_to_evict = len(entries) - target_count

    if policy == EvictionPolicy.LRU:
        # Sort by last_accessed ascending (oldest first)
        sorted_entries = sorted(entries, key=lambda e: e.last_accessed)
        return [e.key for e in sorted_entries[:num_to_evict]]

    if policy == EvictionPolicy.LFU:
        # Sort by access_count ascending (least used first)
        sorted_entries = sorted(entries, key=lambda e: e.access_count)
        return [e.key for e in sorted_entries[:num_to_evict]]

    if policy == EvictionPolicy.TTL:
        # Sort by created_at ascending (oldest first)
        sorted_entries = sorted(entries, key=lambda e: e.created_at)
        return [e.key for e in sorted_entries[:num_to_evict]]

    # SMART: sort by score ascending (lowest score = evict first)
    scored = [(compute_smart_score(e), e) for e in entries]
    scored.sort(key=lambda x: x[0])
    return [e.key for _, e in scored[:num_to_evict]]
