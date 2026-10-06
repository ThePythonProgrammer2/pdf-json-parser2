"""Layout analyzer for column, header, and footer separation.

Analyzes the spatial structure of PDF pages to identify multi-column
layouts, headers, footers, and body text regions.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class LayoutRegion:
    """A detected layout region on a page."""

    region_type: str  # "header", "footer", "body", "column_left", "column_right"
    text: str
    page_number: int
    line_start: int
    line_end: int


@dataclass
class PageLayout:
    """Analyzed layout of a single page."""

    page_number: int
    is_multi_column: bool
    column_count: int
    header: LayoutRegion | None
    footer: LayoutRegion | None
    body_regions: list[LayoutRegion] = field(default_factory=list)


def _detect_columns(text: str) -> tuple[bool, int]:
    """Detect if text has a multi-column layout.

    Uses whitespace gap analysis: if lines consistently have a large
    gap in the middle, it suggests two columns.

    Returns:
        (is_multi_column, column_count)
    """
    lines = [l for l in text.split("\n") if l.strip()]
    if len(lines) < 5:
        return False, 1

    # Check for large internal gaps in lines
    gap_lines = 0
    for line in lines:
        # Find the largest internal whitespace gap
        gaps = re.findall(r" {5,}", line)
        if gaps:
            gap_lines += 1

    # If more than 40% of lines have large gaps, likely multi-column
    ratio = gap_lines / len(lines)
    if ratio > 0.4:
        return True, 2

    return False, 1


def _detect_header(lines: list[str], page_number: int) -> LayoutRegion | None:
    """Detect a header region (first 1-2 lines if short)."""
    if not lines:
        return None

    header_lines: list[str] = []
    for line in lines[:3]:
        stripped = line.strip()
        # Headers tend to be short and may contain page numbers
        if len(stripped) < 80 and (stripped.isdigit() or len(stripped) < 30):
            header_lines.append(line)
        else:
            break

    if header_lines and len(header_lines) <= 2:
        return LayoutRegion(
            region_type="header",
            text="\n".join(header_lines),
            page_number=page_number,
            line_start=0,
            line_end=len(header_lines) - 1,
        )
    return None


def _detect_footer(lines: list[str], page_number: int) -> LayoutRegion | None:
    """Detect a footer region (last 1-2 lines if short)."""
    if not lines:
        return None

    footer_lines: list[str] = []
    for line in reversed(lines[-3:]):
        stripped = line.strip()
        if len(stripped) < 80 and (stripped.isdigit() or "page" in stripped.lower() or len(stripped) < 30):
            footer_lines.insert(0, line)
        else:
            break

    if footer_lines and len(footer_lines) <= 2:
        return LayoutRegion(
            region_type="footer",
            text="\n".join(footer_lines),
            page_number=page_number,
            line_start=len(lines) - len(footer_lines),
            line_end=len(lines) - 1,
        )
    return None


def analyze_layout(text: str, page_number: int = 1) -> PageLayout:
    """Analyze the layout of a single page.

    Args:
        text: Page text content.
        page_number: Page number being analyzed.

    Returns:
        PageLayout with detected regions and structure info.
    """
    lines = text.split("\n")
    non_empty = [l for l in lines if l.strip()]

    is_multi_col, col_count = _detect_columns(text)
    header = _detect_header(non_empty, page_number)
    footer = _detect_footer(non_empty, page_number)

    # Determine body region bounds
    body_start = 0
    body_end = len(non_empty)

    if header:
        body_start = header.line_end + 1
    if footer:
        body_end = len(non_empty) - len(footer.text.split("\n"))

    body_text = "\n".join(non_empty[body_start:body_end]) if body_end > body_start else ""

    body_regions: list[LayoutRegion] = []
    if is_multi_col:
        body_regions.append(
            LayoutRegion(
                region_type="column_left",
                text=body_text,
                page_number=page_number,
                line_start=body_start,
                line_end=body_end - 1,
            )
        )
    else:
        body_regions.append(
            LayoutRegion(
                region_type="body",
                text=body_text,
                page_number=page_number,
                line_start=body_start,
                line_end=body_end - 1,
            )
        )

    return PageLayout(
        page_number=page_number,
        is_multi_column=is_multi_col,
        column_count=col_count,
        header=header,
        footer=footer,
        body_regions=body_regions,
    )
