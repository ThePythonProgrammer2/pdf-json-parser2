"""Simple layout segmentation for invoices and similar structured documents."""

from __future__ import annotations

import re
from typing import Any


def segment_layout(text: str) -> dict[str, Any]:
    """Split document text into header/body/footer blocks based on finance keywords."""
    if not text:
        return {"header": "", "body": "", "footer": ""}

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    footer_keywords = ("subtotal", "tax", "total", "balance due", "grand total")
    footer_lines: list[str] = []
    body_lines: list[str] = []

    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in footer_keywords):
            footer_lines.append(line)
        else:
            body_lines.append(line)

    header_lines = []
    if body_lines and len(body_lines) > 10:
        # Keep the first 10 lines as header context when available.
        header_lines = body_lines[:10]
        body_lines = body_lines[10:]

    return {
        "header": "\n".join(header_lines),
        "body": "\n".join(body_lines),
        "footer": "\n".join(footer_lines),
    }


def extract_footer_section(text: str) -> str:
    """Return only the finance summary/footer area of a document."""
    return segment_layout(text)["footer"]
