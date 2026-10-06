"""Merge results from multiple extraction engines.

Combines the best parts of multiple engine outputs — for example,
using text from one engine and tables from another.
"""

from __future__ import annotations

from api.schemas.document import (
    EngineMetadata,
    ExtractedTable,
    ExtractionResult,
    PageContent,
)


def _pick_best_page(
    pages_by_engine: dict[str, PageContent],
) -> PageContent:
    """Select the best page content from multiple engine results.

    Prefers pages with the most text; breaks ties by table count.
    """
    best = None
    best_score = -1

    for engine_name, page in pages_by_engine.items():
        text_score = len(page.text.strip())
        table_score = len(page.tables) * 100  # Weight tables heavily
        score = text_score + table_score

        if score > best_score:
            best_score = score
            best = page

    return best or list(pages_by_engine.values())[0]


def merge_results(
    results: list[ExtractionResult],
    filename: str = "document.pdf",
) -> ExtractionResult:
    """Merge multiple ExtractionResults into a single best-of result.

    For each page number, picks the engine that produced the most content.
    Concatenates the winning pages into the final result.

    Args:
        results: List of ExtractionResult from different engines.
        filename: Label for the merged result.

    Returns:
        A single ExtractionResult with the best content per page.
    """
    if not results:
        raise ValueError("Cannot merge empty results list")
    if len(results) == 1:
        return results[0]

    # Group pages by page number across all results
    pages_by_number: dict[int, dict[str, PageContent]] = {}
    engine_names: list[str] = []

    for result in results:
        engine_name = result.metadata.engine_name
        engine_names.append(engine_name)
        for page in result.pages:
            if page.page_number not in pages_by_number:
                pages_by_number[page.page_number] = {}
            pages_by_number[page.page_number][engine_name] = page

    # Pick the best page from each page number
    merged_pages: list[PageContent] = []
    total_tables = 0

    for page_num in sorted(pages_by_number.keys()):
        best_page = _pick_best_page(pages_by_number[page_num])
        merged_pages.append(best_page)
        total_tables += len(best_page.tables)

    full_text = "\n".join(p.text for p in merged_pages)

    # Build merged metadata
    all_errors: list[str] = []
    total_time = 0.0
    for r in results:
        all_errors.extend(r.metadata.errors)
        total_time += r.metadata.processing_time_ms

    metadata = EngineMetadata(
        engine_name="merged",
        engine_version="0.1.0",
        processing_time_ms=round(total_time, 2),
        page_count=len(merged_pages),
        tables_extracted=total_tables,
        errors=all_errors,
    )

    return ExtractionResult(
        source_filename=filename,
        pages=merged_pages,
        full_text=full_text,
        metadata=metadata,
    )
