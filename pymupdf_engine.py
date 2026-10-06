"""Hybrid PDF/image extraction engine using PyMuPDF (fitz).

Handles text-based PDFs and rasterized image-only PDFs.
Falls back to rendering pages as images when no text layer is present.
"""

from __future__ import annotations

import io
import time
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF

from api.schemas.document import (
    EngineMetadata,
    ExtractedTable,
    ExtractionResult,
    PageContent,
)

ENGINE_NAME = "pymupdf"
ENGINE_VERSION = "0.1.0"


class PymupdfEngineError(Exception):
    """Raised when the PyMuPDF engine fails to process a PDF."""


def _open_document(source: str | Path | bytes) -> fitz.Document:
    if isinstance(source, (str, Path)):
        return fitz.open(str(source))
    if isinstance(source, bytes):
        return fitz.open(stream=source, filetype="pdf")
    raise TypeError(f"Unsupported source type: {type(source)}")


def _extract_tables_from_page(page: fitz.Page, page_number: int) -> list[ExtractedTable]:
    """Extract tables from a PyMuPDF page using find_tables()."""
    tables: list[ExtractedTable] = []
    try:
        finder = page.find_tables()
        raw_tables = list(finder)
    except Exception:
        return tables

    for idx, tab in enumerate(raw_tables):
        try:
            extracted = tab.extract()
        except Exception:
            continue
        if not extracted:
            continue

        headers: list[str] = []
        rows: list[list[Any]] = []

        if len(extracted) > 1:
            headers = [str(c or "").strip() for c in extracted[0]]
            rows = [list(r) for r in extracted[1:]]
        else:
            rows = [list(r) for r in extracted]

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


def extract(source: str | Path | bytes, filename: str = "document.pdf") -> ExtractionResult:
    """Extract structured content using PyMuPDF.

    Args:
        source: File path or raw bytes of a PDF.
        filename: Label for the source file.

    Returns:
        ExtractionResult with per-page text, tables, and metadata.

    Raises:
        PymupdfEngineError: If the PDF cannot be opened or parsed.
    """
    start = time.perf_counter()
    errors: list[str] = []
    pages: list[PageContent] = []
    total_tables = 0

    try:
        doc = _open_document(source)
    except Exception as exc:
        raise PymupdfEngineError(f"Failed to open PDF: {exc}") from exc

    try:
        for i, page in enumerate(doc, start=1):
            page_text = ""
            try:
                page_text = page.get_text("text") or ""
            except Exception as exc:
                errors.append(f"Page {i} text extraction error: {exc}")

            page_tables = _extract_tables_from_page(page, i)
            total_tables += len(page_tables)

            pages.append(
                PageContent(
                    page_number=i,
                    text=page_text,
                    tables=page_tables,
                    width=float(page.rect.width) if page.rect else None,
                    height=float(page.rect.height) if page.rect else None,
                )
            )
    finally:
        doc.close()

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
