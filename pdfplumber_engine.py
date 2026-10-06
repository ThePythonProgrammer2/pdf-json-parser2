"""Primary extraction engine using pdfplumber.

Extracts structured text and tables from PDF files page-by-page.
Returns results conforming to the ExtractionResult Pydantic model.
"""

from __future__ import annotations

import io
import time
from pathlib import Path
from typing import BinaryIO

import pdfplumber

from api.schemas.document import (
    EngineMetadata,
    ExtractedTable,
    ExtractionResult,
    PageContent,
)

ENGINE_NAME = "pdfplumber"
ENGINE_VERSION = "0.1.0"


class PdfplumberEngineError(Exception):
    """Raised when the pdfplumber engine fails to process a PDF."""


def _open_pdf(source: str | Path | bytes | BinaryIO) -> pdfplumber.PDF:
    """Open a PDF from a file path, raw bytes, or file-like object."""
    if isinstance(source, (str, Path)):
        return pdfplumber.open(str(source))
    if isinstance(source, bytes):
        return pdfplumber.open(io.BytesIO(source))
    # File-like object — read bytes so pdfplumber can seek
    raw = source.read()
    return pdfplumber.open(io.BytesIO(raw))


def _extract_tables_from_page(
    page: pdfplumber.page.Page, page_number: int
) -> list[ExtractedTable]:
    """Extract all tables from a single page into ExtractedTable models."""
    tables: list[ExtractedTable] = []
    try:
        raw_tables = page.extract_tables() or []
    except Exception:
        return tables

    for idx, raw in enumerate(raw_tables):
        if not raw:
            continue
        # First row is treated as headers if it looks like one
        headers: list[str] = []
        rows: list[list] = []

        if len(raw) > 1:
            headers = [str(cell or "").strip() for cell in raw[0]]
            rows = [list(row) for row in raw[1:]]
        else:
            rows = [list(row) for row in raw]

        tables.append(
            ExtractedTable(
                page_number=page_number,
                table_index=idx,
                headers=headers,
                rows=rows,
                row_count=len(rows),
                col_count=len(headers) if headers else (len(rows[0]) if rows else 0),
            )
        )
    return tables


def extract(source: str | Path | bytes | BinaryIO, filename: str = "document.pdf") -> ExtractionResult:
    """Extract structured content from a PDF.

    Args:
        source: File path, raw bytes, or file-like object pointing to a PDF.
        filename: Label for the source file (used in metadata, not for I/O).

    Returns:
        ExtractionResult with per-page text, tables, and engine metadata.

    Raises:
        PdfplumberEngineError: If the PDF cannot be opened or parsed.
    """
    start = time.perf_counter()
    errors: list[str] = []
    pages: list[PageContent] = []
    total_tables = 0

    try:
        pdf = _open_pdf(source)
    except Exception as exc:
        raise PdfplumberEngineError(f"Failed to open PDF: {exc}") from exc

    try:
        for i, page in enumerate(pdf.pages, start=1):
            page_text = ""
            try:
                page_text = page.extract_text() or ""
            except Exception as exc:
                errors.append(f"Page {i} text extraction error: {exc}")

            page_tables = _extract_tables_from_page(page, i)
            total_tables += len(page_tables)

            pages.append(
                PageContent(
                    page_number=i,
                    text=page_text,
                    tables=page_tables,
                    width=float(page.width) if page.width else None,
                    height=float(page.height) if page.height else None,
                )
            )
    finally:
        pdf.close()

    elapsed_ms = (time.perf_counter() - start) * 1000
    full_text = "\n".join(p.text for p in pages)

    metadata = EngineMetadata(
        engine_name=ENGINE_NAME,
        engine_version=ENGINE_VERSION,
        processing_time_ms=round(elapsed_ms, 2),
        page_count=len(pages),
        tables_extracted=total_tables,
        errors=errors,
    )

    return ExtractionResult(
        source_filename=filename,
        pages=pages,
        full_text=full_text,
        metadata=metadata,
    )
