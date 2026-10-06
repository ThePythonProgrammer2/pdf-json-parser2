"""Structured request logging middleware."""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("pdf_parser")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Logs each request with a unique ID, method, path, and duration."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        # Attach request_id to request state for downstream use
        request.state.request_id = request_id

        response = await call_next(request)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"→ {response.status_code} ({elapsed_ms}ms)"
        )

        response.headers["X-Request-ID"] = request_id
        return response
