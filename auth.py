"""Authentication middleware — API key and JWT validation."""

from __future__ import annotations

from fastapi import Request, HTTPException
from fastapi.security import APIKeyHeader
from starlette.middleware.base import BaseHTTPMiddleware

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


class AuthMiddleware(BaseHTTPMiddleware):
    """Validates API key on protected routes.

    Public routes (health, docs) bypass auth. All /api/v1/parse
    routes require an API key when AUTH_ENABLED=true.
    """

    PUBLIC_PATHS = {"/", "/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next):
        auth_enabled = request.app.state.auth_enabled if hasattr(request.app, "state") else False

        if not auth_enabled:
            return await call_next(request)

        path = request.url.path
        if path in self.PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/api/v1/health"):
            return await call_next(request)

        api_key = request.headers.get("X-API-Key")
        expected_key = request.app.state.api_key if hasattr(request.app, "state") else None

        if not api_key:
            raise HTTPException(status_code=401, detail="Missing X-API-Key header")
        if expected_key and api_key != expected_key:
            raise HTTPException(status_code=403, detail="Invalid API key")

        return await call_next(request)
