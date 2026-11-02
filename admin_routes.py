"""Admin endpoints — health, metrics, routing info, cache management, OCR status."""

from __future__ import annotations

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from api.schemas.responses import HealthResponse, RoutingInfoResponse
from services.orchestrator import get_routing_info
from ocr.smart_ocr_selector import get_engine_status as ocr_status
from caching.cache_manager import CacheManager
from billing import get_usage_tracker, get_plan_catalog

router = APIRouter(prefix="/api/v1", tags=["admin"])

AVAILABLE_ENGINES = ["pdfplumber", "pymupdf", "pypdf", "pdfrw", "pikepdf"]

# Shared cache manager instance (created lazily)
_cache_manager: CacheManager | None = None


def get_cache_manager() -> CacheManager:
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager(sqlite_path="/tmp/pdf_parser_cache.db")
    return _cache_manager


@router.get("/health", response_model=HealthResponse)
async def health():
    """Check service health and list available engines."""
    return HealthResponse(
        status="ok",
        version="0.3.0",
        engines=AVAILABLE_ENGINES,
    )


@router.post("/routing-info", response_model=RoutingInfoResponse)
async def routing_info(file: UploadFile = File(..., description="PDF to analyze")):
    """Analyze a PDF and return routing decision without extracting."""
    content = await file.read()
    info = get_routing_info(content)
    return RoutingInfoResponse(success=True, data=info)


@router.get("/engines")
async def list_engines():
    """List all available extraction engines."""
    return {
        "success": True,
        "engines": [
            {"name": "pdfplumber", "description": "Structured extraction (primary)", "version": "0.1.0"},
            {"name": "pymupdf", "description": "Hybrid PDF/image handling", "version": "0.1.0"},
            {"name": "pypdf", "description": "Lightweight fallback parser", "version": "0.1.0"},
            {"name": "pdfrw", "description": "Form field extraction", "version": "0.1.0"},
            {"name": "pikepdf", "description": "Corrupted PDF recovery", "version": "0.1.0"},
        ],
    }


@router.get("/ocr-status")
async def ocr_status_endpoint():
    """Check which OCR engines are available."""
    return {
        "success": True,
        "engines": ocr_status(),
    }


@router.get("/cache/stats")
async def cache_stats():
    """Return cache statistics from all tiers."""
    cm = get_cache_manager()
    return {
        "success": True,
        "stats": cm.stats(),
    }


@router.get("/key-status")
async def key_status():
    """Return the current API key configuration state for monetization."""
    from app import app as app_instance

    configured = bool(getattr(app_instance.state, "api_key", None))
    return {
        "auth_enabled": bool(getattr(app_instance.state, "auth_enabled", False)),
        "configured": configured,
        "status": "enabled" if configured else "disabled",
        "key_prefix": (app_instance.state.api_key[:8] if configured else None),
    }


@router.get("/usage")
async def usage_summary():
    """Return the current usage counters used for API billing and quota checks."""
    tracker = get_usage_tracker()
    summary = tracker.summary()
    plan_name = "starter"
    plan = get_plan_catalog().get(plan_name, {"quota_limit": 1000})
    return {
        "requests_total": summary["requests_total"],
        "requests_24h": summary["requests_24h"],
        "unique_ips": summary["unique_ips"],
        "unique_keys": summary["unique_keys"],
        "quota_limit": plan["quota_limit"],
        "plan": plan_name,
        "quota_used": min(summary["requests_24h"], plan["quota_limit"]),
    }


@router.get("/plans")
async def plans_catalog():
    """Return the product plan catalog for managed API billing."""
    return {
        "success": True,
        "plans": [
            {
                "name": plan_name,
                **plan,
            }
            for plan_name, plan in get_plan_catalog().items()
        ],
    }


@router.delete("/cache")
async def cache_clear():
    """Clear all cache tiers."""
    cm = get_cache_manager()
    cm.clear()
    return {"success": True, "message": "Cache cleared"}
