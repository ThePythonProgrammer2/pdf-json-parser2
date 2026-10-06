from telemetry import *


def trace_request(request) -> str:
    """Return an existing or generated trace ID for the request."""
    return request.headers.get("X-Trace-ID") or "trace-local"


__all__ = ["TelemetryMiddleware", "trace_request"]
