"""Multi-engine orchestration coordinator.

The orchestrator ties together routing, the fallback chain, result
merging, analysis enrichment, and caching to provide a single entry
point for PDF extraction.
"""

from __future__ import annotations

from pathlib import Path
from typing import BinaryIO

from api.schemas.document import ExtractionResult, AnalysisInfo
from services.intelligent_router import route, ENGINE_REGISTRY
from services.fallback_chain import run_chain
from services.result_merger import merge_results


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
            if analyze:
                merged = _enrich_with_analysis(merged)
            return merged

    # Standard fallback chain
    try:
        result = run_chain(source, chain, filename=filename)
    except Exception as exc:
        raise OrchestratorError(f"Extraction failed: {exc}") from exc

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
