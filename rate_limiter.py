"""Token bucket rate limiting middleware."""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Simple in-memory token bucket rate limiter.

    Limits requests per client IP. Configurable via app.state:
    - rate_limit_rpm: requests per minute (default 60)
    """

    async def dispatch(self, request: Request, call_next):
        rate_rpm = getattr(request.app.state, "rate_limit_rpm", 60) if hasattr(request.app, "state") else 60

        if rate_rpm <= 0:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        if not hasattr(request.app.state, "_rate_buckets"):
            request.app.state._rate_buckets = defaultdict(list)

        buckets = request.app.state._rate_buckets
        timestamps = buckets[client_ip]

        # Remove timestamps older than 1 minute
        cutoff = now - 60
        buckets[client_ip] = [t for t in timestamps if t > cutoff]
        timestamps = buckets[client_ip]

        if len(timestamps) >= rate_rpm:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: {rate_rpm} requests/minute",
            )

        timestamps.append(now)
        return await call_next(request)
