"""FastAPI main application for the PDF extraction service.

Entry point for the Python extraction API. Wires together all routes
and middleware.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI

from api.routes import sync_routes, async_routes, batch_routes, admin_routes
from api.middleware.error_handler import ErrorHandlerMiddleware
from api.middleware.request_logger import RequestLoggerMiddleware
from api.middleware.rate_limiter import RateLimiterMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title="pdf-json-parser2-premium",
    description="Enterprise multi-engine PDF-to-JSON extraction service",
    version="0.2.0",
)

# App state configuration
app.state.auth_enabled = False  # Set to True and configure api_key to enable auth
app.state.api_key = None
app.state.rate_limit_rpm = 60  # Requests per minute per IP

# Middleware (order matters — outermost first)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(RequestLoggerMiddleware)

# Routes
app.include_router(admin_routes.router)
app.include_router(sync_routes.router)
app.include_router(async_routes.router)
app.include_router(batch_routes.router)


@app.get("/")
async def root():
    return {
        "service": "pdf-json-parser2-premium",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
