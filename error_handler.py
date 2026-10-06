"""Unified error handling middleware."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Catches unhandled exceptions and returns unified error responses."""

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            status_code = getattr(exc, "status_code", 500)
            detail = getattr(exc, "detail", str(exc))

            # Don't leak internal details on 500 errors
            if status_code == 500:
                detail = "An unexpected server error occurred"

            return JSONResponse(
                status_code=status_code,
                content={
                    "success": False,
                    "error": {
                        "code": _error_code(status_code),
                        "message": detail,
                    },
                },
            )


def _error_code(status: int) -> str:
    """Map HTTP status codes to machine-readable error codes."""
    codes = {
        400: "VALIDATION_ERROR",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        413: "FILE_TOO_LARGE",
        422: "UNPROCESSABLE_CONTENT",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
    }
    return codes.get(status, "UNKNOWN_ERROR")
