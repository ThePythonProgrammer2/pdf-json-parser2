"""Asynchronous/streaming PDF extraction endpoints."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import StreamingResponse

from api.schemas.document import ExtractionResult
from api.schemas.validation import validate_pdf_filename, validate_file_size
from services.orchestrator import extract as orchestrate_extract, OrchestratorError
from billing import get_job_store

router = APIRouter(prefix="/api/v1/async", tags=["async-extraction"])


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Return status for a previously submitted async extraction job."""
    job = get_job_store().get(job_id)
    if job is None:
        return {"job_id": job_id, "status": "not_found"}
    return job


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
    job_store = get_job_store()
    job_id = job_store.create(filename=filename, route="/api/v1/async/parse-document")

    async def stream():
        job_store.update(job_id, status="queued")
        yield json.dumps({"event": "started", "job_id": job_id, "filename": filename, "status": "queued"}) + "\n"
        job_store.update(job_id, status="processing", engine="auto")
        yield json.dumps({"event": "processing", "job_id": job_id, "engine": "auto", "status": "processing"}) + "\n"

        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, orchestrate_extract, content, filename, merge
            )
            job_store.update(job_id, status="complete", data=result.model_dump())
            yield json.dumps({
                "event": "complete",
                "job_id": job_id,
                "status": "complete",
                "data": result.model_dump(),
            }) + "\n"
        except OrchestratorError as exc:
            job_store.update(job_id, status="error", error={"code": "UNPROCESSABLE_CONTENT", "message": str(exc)})
            yield json.dumps({
                "event": "error",
                "job_id": job_id,
                "status": "error",
                "error": {"code": "UNPROCESSABLE_CONTENT", "message": str(exc)},
            }) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")
