from __future__ import annotations

from collections import deque
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any, Deque
import uuid


class UsageTracker:
    """Simple in-memory usage accounting for API monetization."""

    def __init__(self, retention_days: int = 1):
        self.retention_days = retention_days
        self._events: Deque[dict[str, Any]] = deque()
        self._lock = Lock()

    def record(self, *, route: str, method: str, ip: str | None = None, api_key: str | None = None) -> None:
        event = {
            "time": datetime.now(timezone.utc),
            "route": route,
            "method": method,
            "ip": ip or "unknown",
            "api_key": api_key[:8] if api_key else None,
        }
        with self._lock:
            self._events.append(event)
            cutoff = datetime.now(timezone.utc) - timedelta(days=self.retention_days)
            while self._events and self._events[0]["time"] < cutoff:
                self._events.popleft()

    def summary(self) -> dict[str, Any]:
        with self._lock:
            events = list(self._events)

        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=self.retention_days)
        recent = [event for event in events if event["time"] >= cutoff]

        return {
            "requests_total": len(events),
            "requests_24h": len(recent),
            "unique_ips": len({event["ip"] for event in events}),
            "unique_keys": len({event["api_key"] for event in events if event["api_key"]}),
        }


class JobStore:
    """Tracks async processing jobs for billing and operational monitoring."""

    def __init__(self):
        self._jobs: dict[str, dict[str, Any]] = {}
        self._lock = Lock()

    def create(self, *, filename: str, route: str, status: str = "queued") -> str:
        job_id = uuid.uuid4().hex
        payload = {
            "job_id": job_id,
            "filename": filename,
            "route": route,
            "status": status,
            "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        with self._lock:
            self._jobs[job_id] = payload
        return job_id

    def update(self, job_id: str, *, status: str | None = None, **kwargs: Any) -> dict[str, Any] | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            if status is not None:
                job["status"] = status
            for key, value in kwargs.items():
                job[key] = value
            return dict(job)

    def get(self, job_id: str) -> dict[str, Any] | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None


_usage_tracker = UsageTracker()
_job_store = JobStore()

PLAN_CATALOG = {
    "starter": {
        "name": "starter",
        "quota_limit": 1000,
        "price": 29,
        "currency": "USD",
        "features": ["standard extraction api", "basic queue access"],
    },
    "pro": {
        "name": "pro",
        "quota_limit": 10000,
        "price": 149,
        "currency": "USD",
        "features": ["priority queue", "webhooks", "advanced analytics"],
    },
    "enterprise": {
        "name": "enterprise",
        "quota_limit": 100000,
        "price": 499,
        "currency": "USD",
        "features": ["slas", "multi-tenant", "dedicated support"],
    },
}


def get_usage_tracker() -> UsageTracker:
    return _usage_tracker


def get_job_store() -> JobStore:
    return _job_store


def get_plan_catalog() -> dict[str, dict[str, Any]]:
    return {name: dict(plan) for name, plan in PLAN_CATALOG.items()}
