"""Text flow analyzer for reading order detection.

Determines the correct reading order of text blocks, especially
important for multi-column PDFs where naive top-to-bottom reading
mixes columns.
"""

from __future__ import annotations

from analysis.layout_analyzer import PageLayout, analyze_layout


def detect_reading_order(text: str, page_number: int = 1) -> list[str]:
    """Detect the correct reading order of text blocks.

    For single-column layouts, returns text as-is.
    For multi-column layouts, attempts to separate and order columns.

    Args:
        text: Page text content.
        page_number: Page number for context.

    Returns:
        Ordered list of text blocks in reading order.
    """
    layout = analyze_layout(text, page_number)

    if not layout.is_multi_column:
        # Single column — return body text as single block
        return [region.text for region in layout.body_regions if region.text.strip()]

    # Multi-column: try to split into left and right columns
    # by analyzing whitespace gaps in each line
    lines = text.split("\n")
    left_lines: list[str] = []
    right_lines: list[str] = []

    for line in lines:
        if not line.strip():
            continue

        # Find the midpoint gap
        stripped = line.rstrip()
        # Look for a gap of 5+ spaces in the middle half of the line
        mid = len(stripped) // 2
        left_half = stripped[:mid]
        right_half = stripped[mid:]

        # Check if there's a large gap near the middle
        import re
        gap_match = re.search(r" {5,}", stripped)

        if gap_match:
            gap_pos = gap_match.start()
            left_lines.append(stripped[:gap_pos].strip())
            right_lines.append(stripped[gap_match.end():].strip())
        else:
            # No gap — assign to left column
            left_lines.append(stripped.strip())

    blocks: list[str] = []
    left_text = "\n".join(l for l in left_lines if l)
    right_text = "\n".join(l for l in right_lines if l)

    if left_text:
        blocks.append(left_text)
    if right_text:
        blocks.append(right_text)

    return blocks if blocks else [text]


def reconstruct_text(text: str, page_number: int = 1) -> str:
    """Reconstruct page text in correct reading order.

    Args:
        text: Raw page text (possibly in wrong order).
        page_number: Page number for context.

    Returns:
        Text in correct reading order.
    """
    blocks = detect_reading_order(text, page_number)
    return "\n\n".join(blocks)
