"""Form field extraction engine using pdfrw.

Specialized for extracting AcroForm fields from PDF forms.
Returns form field names and values in the page text.
"""

from __future__ import annotations

import io
import time
from pathlib import Path
from typing import Any

from pdfrw import PdfReader as PdfrwReader
from pdfrw.objects import PdfDict, PdfArray, PdfName

from api.schemas.document import (
    EngineMetadata,
    ExtractedTable,
    ExtractionResult,
    PageContent,
)

ENGINE_NAME = "pdfrw"
ENGINE_VERSION = "0.1.0"

# pdfrw annotation type names for form fields
_ANNOT_FIELD_NAMES = {
    "/Tx": "text",
    "/Btn": "button",
    "/Ch": "choice",
}


class PdfrwEngineError(Exception):
    """Raised when the pdfrw engine fails to process a PDF."""


def _open_pdf(source: str | Path | bytes) -> PdfrwReader:
    if isinstance(source, (str, Path)):
        return PdfrwReader(str(source))
    if isinstance(source, bytes):
        return PdfrwReader(io.BytesIO(source))
    raise TypeError(f"Unsupported source type: {type(source)}")


def _get_field_value(field: PdfDict) -> str:
    """Extract the value from a form field."""
    # /V is the field value in AcroForm
    value = field.get(PdfName("V"))
    if value is None:
        return ""
    if isinstance(value, PdfArray):
        return ", ".join(str(v) for v in value)
    # pdfrw returns PdfName for choice fields
    if hasattr(value, "decode"):
        return value.decode("utf-8", errors="replace")
    return str(value)


def _get_field_name(field: PdfDict) -> str:
    """Extract the name from a form field."""
    name = field.get(PdfName("T"))
    if name is None:
        return ""
    if hasattr(name, "decode"):
        return name.decode("utf-8", errors="replace")
    return str(name)


def _collect_form_fields(reader: PdfrwReader) -> dict[str, str]:
    """Walk the AcroForm tree and collect field name → value pairs."""
    fields: dict[str, str] = {}

    if not reader.Root or not reader.Root.AcroForm:
        return fields

    def walk(field_list: PdfArray, parent_name: str = "") -> None:
        for field in field_list:
            name = _get_field_name(field)
            full_name = f"{parent_name}.{name}" if parent_name else name

            # Check for children (nested fields)
            kids = field.get(PdfName("Kids"))
            if kids and not field.get(PdfName("V")):
                walk(kids, full_name)
            else:
                value = _get_field_value(field)
                if full_name and value:
                    fields[full_name] = value

    form_fields = reader.Root.AcroForm.get(PdfName("Fields"))
    if form_fields:
        walk(form_fields)

    return fields


def extract(source: str | Path | bytes, filename: str = "document.pdf") -> ExtractionResult:
    """Extract form fields and basic page info using pdfrw.

    Args:
        source: File path or raw bytes of a PDF.
        filename: Label for the source file.

    Returns:
        ExtractionResult with form fields rendered as text lines.

    Raises:
        PdfrwEngineError: If the PDF cannot be opened or parsed.
    """
    start = time.perf_counter()
    errors: list[str] = []
    pages: list[PageContent] = []

    try:
        reader = _open_pdf(source)
    except Exception as exc:
        raise PdfrwEngineError(f"Failed to open PDF: {exc}") from exc

    if not reader.Root:
        raise PdfrwEngineError("Invalid PDF: no Root dictionary")

    # Collect form fields
    form_fields: dict[str, str] = {}
    try:
        form_fields = _collect_form_fields(reader)
    except Exception as exc:
        errors.append(f"Form field extraction error: {exc}")

    # Build pages — pdfrw doesn't have text extraction, so we report
    # page count and include form field summary on page 1
    page_count = len(reader.pages) if reader.pages else 0

    for i in range(1, page_count + 1):
        page_text = ""
        if i == 1 and form_fields:
            lines = ["[Form Fields]"]
            for name, value in sorted(form_fields.items()):
                lines.append(f"{name}: {value}")
            page_text = "\n".join(lines)
        elif i == 1:
            page_text = "[No form fields detected]"

        pages.append(
            PageContent(
                page_number=i,
                text=page_text,
                tables=[],
                width=None,
                height=None,
            )
        )

    elapsed_ms = (time.perf_counter() - start) * 1000
    full_text = "\n".join(p.text for p in pages)

    metadata = EngineMetadata(
        engine_name=ENGINE_NAME,
        engine_version=ENGINE_VERSION,
        processing_time_ms=round(elapsed_ms, 2),
        page_count=page_count,
        tables_extracted=0,
        errors=errors,
    )

    return ExtractionResult(
        source_filename=filename,
        pages=pages,
        full_text=full_text,
        metadata=metadata,
    )
