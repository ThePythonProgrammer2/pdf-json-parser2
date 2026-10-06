"""Lightweight fallback extraction engine using pypdf.

Provides basic text extraction when heavier engines are unavailable.
Does not extract tables — designed as a last-resort parser.
"""

from __future__ import annotations

import io
import time
from pathlib import Path

from pypdf import PdfReader

from api.schemas.document import (
    EngineMetadata,
    ExtractionResult,
    PageContent,
)

ENGINE_NAME = "pypdf"
ENGINE_VERSION = "0.1.0"


class PypdfEngineError(Exception):
    """Raised when the pypdf engine fails to process a PDF."""


def _create_reader(source: str | Path | bytes) -> PdfReader:
    if isinstance(source, (str, Path)):
        return PdfReader(str(source))
    if isinstance(source, bytes):
        return PdfReader(io.BytesIO(source))
    raise TypeError(f"Unsupported source type: {type(source)}")


def extract(source: str | Path | bytes, filename: str = "document.pdf") -> ExtractionResult:
    """Extract text using pypdf (no table support).

    Args:
        source: File path or raw bytes of a PDF.
        filename: Label for the source file.

    Returns:
        ExtractionResult with per-page text (no tables).

    Raises:
        PypdfEngineError: If the PDF cannot be opened or parsed.
    """
    start = time.perf_counter()
    errors: list[str] = []
    pages: list[PageContent] = []

    try:
        reader = _create_reader(source)
    except Exception as exc:
        raise PypdfEngineError(f"Failed to open PDF: {exc}") from exc

    try:
        for i, page in enumerate(reader.pages, start=1):
            page_text = ""
            try:
                page_text = page.extract_text() or ""
            except Exception as exc:
                errors.append(f"Page {i} text extraction error: {exc}")

            # pypdf doesn't provide page dimensions directly in all versions
            width = None
            height = None
            try:
                mediabox = page.mediabox
                width = float(mediabox.width)
                height = float(mediabox.height)
            except Exception:
                pass

            pages.append(
                PageContent(
                    page_number=i,
                    text=page_text,
                    tables=[],
                    width=width,
                    height=height,
                )
            )
    except Exception as exc:
        raise PypdfEngineError(f"Failed to read PDF pages: {exc}") from exc

    elapsed_ms = (time.perf_counter() - start) * 1000
    full_text = "\n".join(p.text for p in pages)

    metadata = EngineMetadata(
        engine_name=ENGINE_NAME,
        engine_version=ENGINE_VERSION,
        processing_time_ms=round(elapsed_ms, 2),
        page_count=len(pages),
        tables_extracted=0,
        errors=errors,
    )

    return ExtractionResult(
        source_filename=filename,
        pages=pages,
        full_text=full_text,
        metadata=metadata,
    )
