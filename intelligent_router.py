"""Intelligent router that selects the best extraction engine per PDF.

Examines the PDF to determine its characteristics (text layer presence,
form fields, corruption) and routes to the most appropriate engine.
"""

from __future__ import annotations

import io
from enum import Enum
from pathlib import Path
from typing import BinaryIO

import pdfplumber

from engines import (
    pdfplumber_engine,
    pymupdf_engine,
    pypdf_engine,
    pdfrw_engine,
    pikepdf_engine,
)


class PdfType(str, Enum):
    """Classification of PDF document type."""

    TEXT_BASED = "text_based"
    SCANNED_IMAGE = "scanned_image"
    FORM_PDF = "form_pdf"
    CORRUPTED = "corrupted"
    UNKNOWN = "unknown"


class RouteDecision:
    """Result of routing analysis — which engine and why."""

    def __init__(self, pdf_type: PdfType, primary_engine: str, fallback_engines: list[str], reason: str):
        self.pdf_type = pdf_type
        self.primary_engine = primary_engine
        self.fallback_engines = fallback_engines
        self.reason = reason

    def __repr__(self) -> str:
        return f"RouteDecision(type={self.pdf_type}, primary={self.primary_engine}, fallbacks={self.fallback_engines})"


def _read_bytes(source: str | Path | bytes | BinaryIO) -> bytes:
    """Normalize source to bytes for inspection."""
    if isinstance(source, (str, Path)):
        with open(source, "rb") as f:
            return f.read()
    if isinstance(source, bytes):
        return source
    return source.read()


def _has_text_layer(data: bytes) -> bool:
    """Check if the PDF has extractable text on at least one page."""
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages[:3]:  # Check first 3 pages
                text = page.extract_text() or ""
                if text.strip():
                    return True
        return False
    except Exception:
        return False


def _has_form_fields(data: bytes) -> bool:
    """Check if the PDF contains AcroForm fields."""
    try:
        from pdfrw import PdfReader as PdfrwReader
        reader = PdfrwReader(io.BytesIO(data))
        if reader.Root and reader.Root.AcroForm:
            fields = reader.Root.AcroForm.get("/Fields")
            if fields and len(fields) > 0:
                return True
    except Exception:
        pass
    return False


def _is_corrupted(data: bytes) -> bool:
    """Check if the PDF appears corrupted by testing basic parseability."""
    try:
        import pikepdf
        pikepdf.open(io.BytesIO(data))
        return False
    except Exception:
        return True


def classify(source: str | Path | bytes | BinaryIO) -> PdfType:
    """Classify a PDF into one of the PdfType categories."""
    try:
        data = _read_bytes(source)
    except Exception:
        return PdfType.UNKNOWN

    if _is_corrupted(data):
        return PdfType.CORRUPTED

    if _has_form_fields(data):
        return PdfType.FORM_PDF

    if _has_text_layer(data):
        return PdfType.TEXT_BASED

    # No text and not corrupted → likely scanned image
    return PdfType.SCANNED_IMAGE


def route(source: str | Path | bytes | BinaryIO) -> RouteDecision:
    """Analyze a PDF and return a routing decision.

    Args:
        source: PDF file path, bytes, or file-like object.

    Returns:
        RouteDecision with the recommended primary engine and fallbacks.
    """
    pdf_type = classify(source)

    if pdf_type == PdfType.CORRUPTED:
        return RouteDecision(
            pdf_type=pdf_type,
            primary_engine="pikepdf",
            fallback_engines=["pdfplumber"],
            reason="PDF appears corrupted — pikepdf can attempt recovery",
        )

    if pdf_type == PdfType.FORM_PDF:
        return RouteDecision(
            pdf_type=pdf_type,
            primary_engine="pdfrw",
            fallback_engines=["pdfplumber", "pypdf"],
            reason="PDF contains AcroForm fields — pdfrw specializes in form extraction",
        )

    if pdf_type == PdfType.SCANNED_IMAGE:
        return RouteDecision(
            pdf_type=pdf_type,
            primary_engine="pymupdf",
            fallback_engines=["pdfplumber", "pypdf"],
            reason="No text layer detected — PyMuPDF handles image-based PDFs",
        )

    if pdf_type == PdfType.TEXT_BASED:
        return RouteDecision(
            pdf_type=pdf_type,
            primary_engine="pdfplumber",
            fallback_engines=["pymupdf", "pypdf"],
            reason="Text layer present — pdfplumber provides best structured extraction",
        )

    return RouteDecision(
        pdf_type=PdfType.UNKNOWN,
        primary_engine="pdfplumber",
        fallback_engines=["pymupdf", "pypdf"],
        reason="Unknown PDF type — defaulting to pdfplumber",
    )


# Engine registry — maps engine name to extract function
ENGINE_REGISTRY = {
    "pdfplumber": pdfplumber_engine.extract,
    "pymupdf": pymupdf_engine.extract,
    "pypdf": pypdf_engine.extract,
    "pdfrw": pdfrw_engine.extract,
    "pikepdf": pikepdf_engine.extract,
}
