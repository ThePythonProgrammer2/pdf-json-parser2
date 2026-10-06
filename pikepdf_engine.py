"""Corrupted PDF recovery engine using pikepdf.

Attempts to repair damaged PDFs and extract basic structure.
Can recover PDFs with broken xref tables, truncated streams, etc.
"""

from __future__ import annotations

import io
import time
from pathlib import Path

import pikepdf

from api.schemas.document import (
    EngineMetadata,
    ExtractionResult,
    PageContent,
)

ENGINE_NAME = "pikepdf"
ENGINE_VERSION = "0.1.0"


class PikepdfEngineError(Exception):
    """Raised when the pikepdf engine fails to process a PDF."""


def _open_pdf(source: str | Path | bytes) -> pikepdf.Pdf:
    if isinstance(source, (str, Path)):
        return pikepdf.open(str(source))
    if isinstance(source, bytes):
        return pikepdf.open(io.BytesIO(source))
    raise TypeError(f"Unsupported source type: {type(source)}")


def extract(source: str | Path | bytes, filename: str = "document.pdf") -> ExtractionResult:
    """Attempt to recover and extract basic info from a damaged PDF.

    Uses pikepdf's repair capabilities. Does not extract text —
    focuses on recovering page count and document structure.

    Args:
        source: File path or raw bytes of a PDF.
        filename: Label for the source file.

    Returns:
        ExtractionResult with page count and recovery status.

    Raises:
        PikepdfEngineError: If the PDF cannot be recovered.
    """
    start = time.perf_counter()
    errors: list[str] = []
    pages: list[PageContent] = []
    recovered = False

    try:
        # pikepdf automatically attempts repair on open
        pdf = _open_pdf(source)
    except Exception as exc:
        raise PikepdfEngineError(f"Failed to recover PDF: {exc}") from exc

    try:
        page_count = len(pdf.pages)

        # Try to detect if recovery happened by checking for warnings
        # pikepdf doesn't expose this directly, so we check doc structure
        if pdf.docinfo is None:
            recovered = True
            errors.append("Document info dictionary was missing (recovered)")

        for i in range(1, page_count + 1):
            page_text = ""
            if i == 1:
                if recovered:
                    page_text = "[Recovered PDF — structure only, no text layer]"
                else:
                    page_text = "[PDF opened successfully — pikepdf provides structure recovery only]"

            # Try to get page dimensions
            width = None
            height = None
            try:
                page = pdf.pages[i - 1]
                mediabox = page.get("/MediaBox")
                if mediabox and len(mediabox) >= 4:
                    width = float(mediabox[2]) - float(mediabox[0])
                    height = float(mediabox[3]) - float(mediabox[1])
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
    finally:
        pdf.close()

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
