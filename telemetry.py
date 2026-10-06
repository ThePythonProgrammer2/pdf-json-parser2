"""OpenTelemetry tracing middleware (stub for Phase 2).

Provides request tracing hooks. Full OTel exporter setup is deferred
to a later phase — this middleware adds trace headers.
"""

from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class TelemetryMiddleware(BaseHTTPMiddleware):
    """Adds telemetry headers to responses.

    Full OpenTelemetry integration (spans, exporters) will be added
    in a later phase. This middleware currently propagates trace IDs.
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Propagate or generate a trace ID
        trace_id = request.headers.get("X-Trace-ID", "")
        if trace_id:
            response.headers["X-Trace-ID"] = trace_id

        return response
