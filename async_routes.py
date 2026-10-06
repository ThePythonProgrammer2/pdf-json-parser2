"""Asynchronous/streaming PDF extraction endpoints."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import StreamingResponse

from api.schemas.document import ExtractionResult
from api.schemas.validation import validate_pdf_filename, validate_file_size
from services.orchestrator import extract as orchestrate_extract, OrchestratorError

router = APIRouter(prefix="/api/v1/async", tags=["async-extraction"])


@router.post("/parse-document")
async def parse_document_async(
    file: UploadFile = File(..., description="PDF file to parse"),
    merge: bool = Query(False, description="Merge results from multiple engines"),
):
    """Parse a PDF asynchronously with streaming progress updates.

    Returns a streaming response with JSON lines: first a progress
    event, then the final result.
    """
    filename = validate_pdf_filename(file.filename or "document.pdf")
    content = await file.read()
    validate_file_size(len(content))

    async def stream():
        yield json.dumps({"event": "started", "filename": filename}) + "\n"
        yield json.dumps({"event": "processing", "engine": "auto"}) + "\n"

        try:
            # Run extraction in a thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, orchestrate_extract, content, filename, merge
            )
            yield json.dumps({
                "event": "complete",
                "data": result.model_dump(),
            }) + "\n"
        except OrchestratorError as exc:
            yield json.dumps({
                "event": "error",
                "error": {"code": "UNPROCESSABLE_CONTENT", "message": str(exc)},
            }) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")
