"""Admin endpoints — health, metrics, routing info, cache management, OCR status."""

from __future__ import annotations

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from api.schemas.responses import HealthResponse, RoutingInfoResponse
from services.orchestrator import get_routing_info
from ocr.smart_ocr_selector import get_engine_status as ocr_status
from caching.cache_manager import CacheManager

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


@router.delete("/cache")
async def cache_clear():
    """Clear all cache tiers."""
    cm = get_cache_manager()
    cm.clear()
    return {"success": True, "message": "Cache cleared"}
