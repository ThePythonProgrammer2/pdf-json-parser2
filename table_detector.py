"""Table detection using heuristic and (optionally) YOLO-based methods.

Detects table regions in PDF pages by analyzing whitespace patterns,
line structures, and cell alignment. Falls back to heuristic detection
when ML models are unavailable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class TableRegion:
    """A detected table region on a page."""

    page_number: int
    x0: float
    y0: float
    x1: float
    y1: float
    confidence: float
    method: str  # "heuristic" or "yolo"


class TableDetectorError(Exception):
    """Raised when table detection fails."""


def is_yolo_available() -> bool:
    """Check if YOLO model weights are available."""
    try:
        import torch  # noqa: F401
        from pathlib import Path
        model_path = Path(__file__).parent.parent / "models" / "table_detector.pt"
        return model_path.exists()
    except ImportError:
        return False


def detect_tables_heuristic(text: str, page_number: int = 1) -> list[TableRegion]:
    """Detect potential tables using text-based heuristics.

    Looks for patterns that suggest tabular data:
    - Multiple consecutive lines with consistent column separators
    - Lines with repeated delimiters (|, \t, multiple spaces)

    Args:
        text: Page text content.
        page_number: Page number for the region.

    Returns:
        List of detected table regions (coordinates are approximate).
    """
    if not text.strip():
        return []

    lines = text.split("\n")
    regions: list[TableRegion] = []
    in_table = False
    table_start = 0
    table_lines: list[str] = []

    for i, line in enumerate(lines):
        # Heuristic: lines with 2+ delimiters suggest table rows
        delimiter_count = (
            line.count("|") + line.count("\t") +
            len(re.findall(r"  {3,}", line))
        )
        is_table_row = delimiter_count >= 2

        if is_table_row and not in_table:
            in_table = True
            table_start = i
            table_lines = [line]
        elif is_table_row and in_table:
            table_lines.append(line)
        elif not is_table_row and in_table:
            # End of table — only count if we found at least 2 rows
            if len(table_lines) >= 2:
                regions.append(
                    TableRegion(
                        page_number=page_number,
                        x0=0.0,
                        y0=float(table_start),
                        x1=100.0,
                        y1=float(i - 1),
                        confidence=0.7,
                        method="heuristic",
                    )
                )
            in_table = False
            table_lines = []

    # Handle table at end of page
    if in_table and len(table_lines) >= 2:
        regions.append(
            TableRegion(
                page_number=page_number,
                x0=0.0,
                y0=float(table_start),
                x1=100.0,
                y1=float(len(lines) - 1),
                confidence=0.7,
                method="heuristic",
            )
        )

    return regions


def detect_tables(text: str, page_number: int = 1) -> list[TableRegion]:
    """Detect tables using the best available method.

    Falls back to heuristic detection if YOLO is unavailable.

    Args:
        text: Page text content.
        page_number: Page number for detected regions.

    Returns:
        List of detected table regions.
    """
    if is_yolo_available():
        # YOLO detection would go here — requires rendered page images
        # For now, fall through to heuristic
        pass

    return detect_tables_heuristic(text, page_number)
