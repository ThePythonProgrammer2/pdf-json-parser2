"""Batch processing endpoints for bulk PDF extraction."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from api.schemas.document import ExtractionResult
from api.schemas.responses import SuccessResponse
from api.schemas.validation import validate_pdf_filename, validate_file_size
from services.orchestrator import extract as orchestrate_extract, OrchestratorError

router = APIRouter(prefix="/api/v1/batch", tags=["batch-extraction"])


@router.post("/parse-documents")
async def parse_documents(
    files: list[UploadFile] = File(..., description="PDF files to parse (max 20)"),
):
    """Parse multiple PDF documents in a single request.

    Accepts up to 20 files and processes them concurrently.
    Returns a list of results — one per file, preserving order.
    """
    if len(files) > 20:
        return JSONResponse(
            status_code=413,
            content={
                "success": False,
                "error": {
                    "code": "FILE_TOO_LARGE",
                    "message": "Maximum 20 files per batch request",
                },
            },
        )

    async def process_one(f: UploadFile) -> dict:
        filename = validate_pdf_filename(f.filename or "document.pdf")
        try:
            content = await f.read()
            validate_file_size(len(content))
            result = orchestrate_extract(content, filename=filename)
            return {"success": True, "filename": filename, "data": result.model_dump()}
        except OrchestratorError as exc:
            return {"success": False, "filename": filename, "error": {"code": "UNPROCESSABLE_CONTENT", "message": str(exc)}}
        except Exception as exc:
            return {"success": False, "filename": filename, "error": {"code": "VALIDATION_ERROR", "message": str(exc)}}

    results = await asyncio.gather(*[process_one(f) for f in files])

    succeeded = sum(1 for r in results if r["success"])
    return {
        "success": True,
        "total": len(results),
        "succeeded": succeeded,
        "failed": len(results) - succeeded,
        "results": results,
    }
