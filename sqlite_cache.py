"""Persistent local cache using SQLite.

Stores extraction results in a SQLite database for persistence across
restarts. Uses JSON serialization for stored values.
"""

from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any


class SqliteCache:
    """SQLite-backed persistent cache."""

    def __init__(self, db_path: str | Path = "cache.db"):
        self._db_path = str(db_path)
        self._lock = threading.Lock()
        self._init_db()

    def _init_db(self) -> None:
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cache_entries (
                    cache_key TEXT PRIMARY KEY,
                    cache_value TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    accessed_at REAL NOT NULL,
                    hit_count INTEGER DEFAULT 0
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_created_at
                ON cache_entries(created_at)
            """)
            conn.commit()
            conn.close()

    def get(self, key: str) -> Any | None:
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.execute(
                "SELECT cache_value FROM cache_entries WHERE cache_key = ?",
                (key,),
            )
            row = cursor.fetchone()
            if row:
                conn.execute(
                    "UPDATE cache_entries SET accessed_at = ?, hit_count = hit_count + 1 WHERE cache_key = ?",
                    (time.time(), key),
                )
                conn.commit()
                conn.close()
                return json.loads(row[0])
            conn.close()
            return None

    def set(self, key: str, value: Any) -> None:
        serialized = json.dumps(value, default=str)
        now = time.time()
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            conn.execute(
                """INSERT OR REPLACE INTO cache_entries
                   (cache_key, cache_value, created_at, accessed_at, hit_count)
                   VALUES (?, ?, ?, ?, 0)""",
                (key, serialized, now, now),
            )
            conn.commit()
            conn.close()

    def delete(self, key: str) -> bool:
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.execute(
                "DELETE FROM cache_entries WHERE cache_key = ?", (key,)
            )
            conn.commit()
            deleted = cursor.rowcount > 0
            conn.close()
            return deleted

    def clear(self) -> None:
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            conn.execute("DELETE FROM cache_entries")
            conn.commit()
            conn.close()

    def size(self) -> int:
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.execute("SELECT COUNT(*) FROM cache_entries")
            count = cursor.fetchone()[0]
            conn.close()
            return count

    def evict_older_than(self, max_age_seconds: int) -> int:
        """Delete entries older than the given age. Returns count deleted."""
        cutoff = time.time() - max_age_seconds
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.execute(
                "DELETE FROM cache_entries WHERE created_at < ?", (cutoff,)
            )
            conn.commit()
            deleted = cursor.rowcount
            conn.close()
            return deleted

    def stats(self) -> dict:
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.execute("SELECT COUNT(*) FROM cache_entries")
            count = cursor.fetchone()[0]
            cursor = conn.execute("SELECT SUM(hit_count) FROM cache_entries")
            total_hits = cursor.fetchone()[0] or 0
            conn.close()
        return {
            "size": count,
            "total_hits": total_hits,
            "db_path": self._db_path,
        }
