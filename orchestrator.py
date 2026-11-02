"""Multi-engine orchestration coordinator.

The orchestrator ties together routing, the fallback chain, result
merging, analysis enrichment, and caching to provide a single entry
point for PDF extraction.
"""

from __future__ import annotations

from pathlib import Path
from typing import BinaryIO

from api.schemas.document import ExtractionResult, AnalysisInfo, PageContent
from services.intelligent_router import route, ENGINE_REGISTRY
from services.fallback_chain import run_chain
from services.result_merger import merge_results

try:
    from ocr.smart_ocr_selector import select_engine
except Exception:  # pragma: no cover
    select_engine = None


class OrchestratorError(Exception):
    """Raised when orchestration fails across all engines."""


def _enrich_with_analysis(result: ExtractionResult) -> ExtractionResult:
    """Enrich an extraction result with document analysis.

    Runs ML classification and entity extraction on the full text.
    """
    from analysis.ml_classifier import classify
    from analysis.entity_extractor import extract_entities

    if not result.full_text.strip():
        return result

    classification = classify(result.full_text)
    entities = extract_entities(result.full_text)

    result.analysis = AnalysisInfo(
        document_type=classification.document_type,
        classification_confidence=classification.confidence,
        persons=entities.persons,
        organizations=entities.organizations,
        dates=entities.dates,
        monetary_amounts=entities.monetary_amounts,
        emails=entities.emails,
        phones=entities.phones,
    )
    return result


def _read_bytes(source: str | Path | bytes | BinaryIO) -> bytes:
    """Normalize a source into PDF bytes for OCR rendering."""
    if isinstance(source, (str, Path)):
        return Path(source).read_bytes()
    if isinstance(source, bytes):
        return source
    if hasattr(source, "read"):
        return source.read()
    raise TypeError(f"Unsupported source type: {type(source)}")


def _run_ocr_fallback(
    source: str | Path | bytes | BinaryIO,
    result: ExtractionResult,
    filename: str = "document.pdf",
) -> ExtractionResult:
    """Render scanned PDFs as images and OCR them when the text layer is empty."""
    if result is None:
        return result

    has_text = bool(result.full_text.strip()) or any(page.text.strip() for page in result.pages)
    if has_text:
        return result

    if select_engine is None:
        return result

    engine_name = select_engine({"has_text": False, "is_scanned": True})
    if not engine_name:
        return result

    try:
        import fitz

        source_bytes = _read_bytes(source)
        document = fitz.open(stream=source_bytes, filetype="pdf")
        pages: list[PageContent] = []
        errors: list[str] = []

        for page_index, page in enumerate(document, start=1):
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image_bytes = pix.tobytes("png")

            if engine_name == "easyocr":
                from easyocr_engine import extract_text_from_image
                text = extract_text_from_image(image_bytes)
            elif engine_name == "tesseract":
                from tesseract_engine import extract_text_from_image
                text = extract_text_from_image(image_bytes)
            elif engine_name == "paddleocr":
                from paddleocr_engine import extract_text_from_image
                text = extract_text_from_image(image_bytes)
            else:
                text = ""

            cleaned = text.strip()
            if not cleaned:
                cleaned = ""
            pages.append(PageContent(page_number=page_index, text=cleaned))

        document.close()

        if not pages:
            return result

        result.pages = pages
        result.full_text = "\n".join(page.text for page in pages)
        result.metadata.engine_name = f"ocr:{engine_name}"
        result.metadata.engine_version = f"{engine_name}-fallback"
        result.metadata.page_count = len(pages)
        result.metadata.errors.extend(errors)
        return result
    except Exception:
        return result


def extract(
    source: str | Path | bytes | BinaryIO,
    filename: str = "document.pdf",
    merge: bool = False,
    analyze: bool = True,
) -> ExtractionResult:
    """Orchestrate PDF extraction with intelligent routing and fallback.

    Args:
        source: PDF file path, bytes, or file-like object.
        filename: Label for the source file.
        merge: If True, run primary + first fallback and merge results.
        analyze: If True, enrich result with document classification and entity extraction.

    Returns:
        ExtractionResult from the best available engine.

    Raises:
        OrchestratorError: If all engines fail.
    """
    decision = route(source)
    chain = [decision.primary_engine] + decision.fallback_engines

    if merge and len(chain) >= 2:
        results: list[ExtractionResult] = []
        for engine_name in chain[:2]:
            engine_fn = ENGINE_REGISTRY.get(engine_name)
            if engine_fn is None:
                continue
            try:
                result = engine_fn(source, filename=filename)
                if result and result.pages:
                    results.append(result)
            except Exception:
                continue

        if results:
            merged = merge_results(results, filename=filename)
            merged = _run_ocr_fallback(source, merged, filename=filename)
            if analyze:
                merged = _enrich_with_analysis(merged)
            return merged

    # Standard fallback chain
    try:
        result = run_chain(source, chain, filename=filename)
    except Exception as exc:
        raise OrchestratorError(f"Extraction failed: {exc}") from exc

    result = _run_ocr_fallback(source, result, filename=filename)

    if analyze:
        result = _enrich_with_analysis(result)

    return result


def get_routing_info(source: str | Path | bytes | BinaryIO) -> dict:
    """Return routing analysis without performing extraction.

    Useful for debugging and admin endpoints.
    """
    decision = route(source)
    return {
        "pdf_type": decision.pdf_type.value,
        "primary_engine": decision.primary_engine,
        "fallback_engines": decision.fallback_engines,
        "reason": decision.reason,
    }
