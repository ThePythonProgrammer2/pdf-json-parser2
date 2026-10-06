"""Synchronous PDF extraction endpoints."""

from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import JSONResponse

from api.schemas.document import ExtractionResult
from api.schemas.responses import SuccessResponse
from api.schemas.validation import validate_pdf_filename, validate_file_size
from services.orchestrator import extract as orchestrate_extract, OrchestratorError
from api.routes.admin_routes import get_cache_manager

router = APIRouter(prefix="/api/v1", tags=["extraction"])


@router.post("/parse-document", response_model=SuccessResponse)
async def parse_document(
    file: UploadFile = File(..., description="PDF file to parse"),
    merge: bool = Query(False, description="Merge results from multiple engines"),
):
    """Parse a single PDF document synchronously.

    Upload a PDF and receive structured JSON with extracted text,
    tables, and metadata. The orchestrator automatically selects
    the best engine for the PDF type.
    """
    try:
        filename = validate_pdf_filename(file.filename or "document.pdf")
    except ValueError as exc:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
        )
    content = await file.read()
    try:
        validate_file_size(len(content))
    except ValueError as exc:
        return JSONResponse(
            status_code=413,
            content={"success": False, "error": {"code": "FILE_TOO_LARGE", "message": str(exc)}},
        )

    # Check cache
    cm = get_cache_manager()
    cache_key = cm.make_key(content, filename)
    cached = cm.get(cache_key)
    if cached is not None:
        cached_result = ExtractionResult.model_validate(cached)
        cached_result.cached = True
        return SuccessResponse(success=True, data=cached_result, cached=True)

    try:
        result: ExtractionResult = orchestrate_extract(content, filename=filename, merge=merge)
    except OrchestratorError as exc:
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "UNPROCESSABLE_CONTENT",
                    "message": str(exc),
                },
            },
        )

    # Store in cache
    cm.set(cache_key, result.model_dump())

    return SuccessResponse(success=True, data=result, cached=False)


@router.post("/parse-document/raw")
async def parse_document_raw(
    file: UploadFile = File(..., description="PDF file to parse"),
    engine: str = Query("auto", description="Engine name or 'auto' for routing"),
):
    """Parse a PDF and return raw ExtractionResult JSON without wrapper."""
    try:
        filename = validate_pdf_filename(file.filename or "document.pdf")
    except ValueError as exc:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "VALIDATION_ERROR", "message": str(exc)}},
        )
    content = await file.read()
    try:
        validate_file_size(len(content))
    except ValueError as exc:
        return JSONResponse(
            status_code=413,
            content={"success": False, "error": {"code": "FILE_TOO_LARGE", "message": str(exc)}},
        )

    # Check cache
    cm = get_cache_manager()
    cache_key = cm.make_key(content, filename)
    cached = cm.get(cache_key)
    if cached is not None:
        cached_result = ExtractionResult.model_validate(cached)
        cached_result.cached = True
        return cached_result.model_dump()

    try:
        result = orchestrate_extract(content, filename=filename)
    except OrchestratorError as exc:
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {"code": "UNPROCESSABLE_CONTENT", "message": str(exc)},
            },
        )

    cm.set(cache_key, result.model_dump())

    return result.model_dump()
