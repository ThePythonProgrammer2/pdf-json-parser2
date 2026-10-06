"""Custom validators for PDF extraction API."""

from __future__ import annotations

from pydantic import field_validator


def validate_pdf_filename(filename: str) -> str:
    """Ensure the filename has a .pdf extension."""
    if not filename:
        return "document.pdf"
    if not filename.lower().endswith(".pdf"):
        raise ValueError("Filename must end with .pdf")
    return filename


def validate_file_size(size_bytes: int, max_mb: int = 50) -> int:
    """Ensure uploaded file is within size limits."""
    max_bytes = max_mb * 1024 * 1024
    if size_bytes <= 0:
        raise ValueError("File size must be positive")
    if size_bytes > max_bytes:
        raise ValueError(f"File size exceeds {max_mb}MB limit")
    return size_bytes
