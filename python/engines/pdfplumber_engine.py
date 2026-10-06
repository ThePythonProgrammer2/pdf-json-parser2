from __future__ import annotations

import io
import time
from pathlib import Path
from typing import BinaryIO, Iterable

import pdfplumber

from python.api.schemas.common import EngineMetadata, ExtractionResult, ExtractedTable, PageContent

ENGINE_NAME = "pdfplumber"
ENGINE_VERSION = "0.1.0"


class PdfplumberEngineError(Exception):
    """Raised when the pdfplumber engine cannot parse the source PDF."""


def _open_pdf(source: str | Path | bytes | BinaryIO | io.BytesIO) -> pdfplumber.PDF:
    """Open a PDF from a file path, raw bytes, or file-like object."""
    if isinstance(source, (str, Path)):
        return pdfplumber.open(str(source))
    if isinstance(source, bytes):
        return pdfplumber.open(io.BytesIO(source))
    if hasattr(source, "read"):
        raw = source.read()
        if isinstance(raw, str):
            raw = raw.encode("utf-8")
        return pdfplumber.open(io.BytesIO(raw))
    raise PdfplumberEngineError("Unsupported source type for PDF extraction.")


def _extract_tables_from_page(page: pdfplumber.page.Page, page_number: int) -> list[ExtractedTable]:
    """Convert pdfplumber raw table data into a clean schema array."""
    tables: list[ExtractedTable] = []
    try:
        raw_tables = page.extract_tables() or []
    except Exception:
        return tables

    for index, raw in enumerate(raw_tables):
        if not raw:
            continue
        rows: list[list] = [list(row) for row in raw[1:]] if len(raw) > 1 else [list(row) for row in raw]
        headers = [str(cell or "").strip() for cell in raw[0]] if len(raw) > 0 else []
        tables.append(
            ExtractedTable(
                page_number=page_number,
                table_index=index,
                headers=headers,
                rows=rows,
                row_count=len(rows),
                col_count=len(headers) if headers else (len(rows[0]) if rows else 0),
            )
        )
    return tables


def extract(source: str | Path | bytes | BinaryIO | io.BytesIO, filename: str = "document.pdf") -> ExtractionResult:
    """Extract structured text and tables from a PDF source."""
    start = time.perf_counter()
    errors: list[str] = []
    pages: list[PageContent] = []
    total_tables = 0

    try:
        pdf = _open_pdf(source)
    except Exception as exc:  # pragma: no cover - simple guard
        raise PdfplumberEngineError(f"Failed to open PDF: {exc}") from exc

    try:
        for page_number, page in enumerate(pdf.pages, start=1):
            page_text = ""
            try:
                page_text = page.extract_text() or ""
            except Exception as exc:
                errors.append(f"Page {page_number} text extraction error: {exc}")

            page_tables = _extract_tables_from_page(page, page_number)
            total_tables += len(page_tables)
            pages.append(
                PageContent(
                    page_number=page_number,
                    text=page_text,
                    tables=page_tables,
                    width=float(page.width) if getattr(page, "width", None) else None,
                    height=float(page.height) if getattr(page, "height", None) else None,
                )
            )
    finally:
        try:
            pdf.close()
        except Exception:
            pass

    metadata = EngineMetadata(
        engine_name=ENGINE_NAME,
        engine_version=ENGINE_VERSION,
        processing_time_ms=round((time.perf_counter() - start) * 1000, 2),
        page_count=len(pages),
        tables_extracted=total_tables,
        errors=errors,
        confidence=1.0,
    )

    return ExtractionResult(
        source_filename=filename,
        pages=pages,
        full_text="\n".join(page.text for page in pages),
        metadata=metadata,
        confidence=1.0,
    )
