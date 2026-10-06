"""Tests for the orchestration layer: intelligent router, fallback chain, result merger, and orchestrator.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from services.intelligent_router import route, classify, PdfType, RouteDecision
from services.fallback_chain import run_chain, FallbackChainError
from services.result_merger import merge_results
from services.orchestrator import extract as orchestrate_extract, get_routing_info, OrchestratorError
from engines.pdfplumber_engine import extract as pdfplumber_extract
from engines.pymupdf_engine import extract as pymupdf_extract
from api.schemas.document import ExtractionResult, EngineMetadata, PageContent

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def invoice_pdf_bytes() -> bytes:
    path = FIXTURES_DIR / "invoice.pdf"
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path.read_bytes()


class TestIntelligentRouter:
    def test_classify_returns_pdf_type(self, invoice_pdf_bytes: bytes):
        result = classify(invoice_pdf_bytes)
        assert isinstance(result, PdfType)

    def test_classify_text_pdf(self, invoice_pdf_bytes: bytes):
        """The invoice fixture has a text layer."""
        result = classify(invoice_pdf_bytes)
        assert result == PdfType.TEXT_BASED

    def test_route_returns_decision(self, invoice_pdf_bytes: bytes):
        decision = route(invoice_pdf_bytes)
        assert isinstance(decision, RouteDecision)
        assert decision.primary_engine in ("pdfplumber", "pymupdf", "pypdf", "pdfrw", "pikepdf")
        assert len(decision.fallback_engines) >= 1
        assert decision.reason

    def test_route_text_pdf_prefers_pdfplumber(self, invoice_pdf_bytes: bytes):
        decision = route(invoice_pdf_bytes)
        assert decision.primary_engine == "pdfplumber"

    def test_route_corrupted_pdf(self):
        decision = route(b"not a real pdf at all")
        assert decision.pdf_type == PdfType.CORRUPTED
        assert decision.primary_engine == "pikepdf"


class TestFallbackChain:
    def test_chain_succeeds_with_pdfplumber(self, invoice_pdf_bytes: bytes):
        result = run_chain(invoice_pdf_bytes, ["pdfplumber", "pypdf"], filename="invoice.pdf")
        assert isinstance(result, ExtractionResult)
        assert result.metadata.engine_name == "pdfplumber"

    def test_chain_falls_back_to_pypdf(self, invoice_pdf_bytes: bytes):
        """If pdfplumber is listed but fails, pypdf should succeed."""
        result = run_chain(invoice_pdf_bytes, ["pypdf"], filename="invoice.pdf")
        assert result.metadata.engine_name == "pypdf"

    def test_chain_all_fail_raises(self):
        with pytest.raises(FallbackChainError):
            run_chain(b"garbage", ["pdfplumber", "pypdf", "pymupdf"])

    def test_chain_empty_list_raises(self):
        with pytest.raises(FallbackChainError):
            run_chain(b"x", [])

    def test_chain_unknown_engine_skipped(self, invoice_pdf_bytes: bytes):
        """Unknown engines are skipped, real ones still work."""
        result = run_chain(invoice_pdf_bytes, ["nonexistent", "pdfplumber"])
        assert result.metadata.engine_name == "pdfplumber"


class TestResultMerger:
    def test_merge_single_result_returns_as_is(self, invoice_pdf_bytes: bytes):
        result = pdfplumber_extract(invoice_pdf_bytes)
        merged = merge_results([result])
        assert merged.metadata.engine_name == "pdfplumber"

    def test_merge_two_results_picks_best_pages(self, invoice_pdf_bytes: bytes):
        r1 = pdfplumber_extract(invoice_pdf_bytes)
        r2 = pymupdf_extract(invoice_pdf_bytes)
        merged = merge_results([r1, r2])
        assert merged.metadata.engine_name == "merged"
        assert merged.metadata.page_count == r1.metadata.page_count

    def test_merge_empty_raises(self):
        with pytest.raises(ValueError):
            merge_results([])


class TestOrchestrator:
    def test_extract_returns_result(self, invoice_pdf_bytes: bytes):
        result = orchestrate_extract(invoice_pdf_bytes, filename="invoice.pdf")
        assert isinstance(result, ExtractionResult)
        assert result.metadata.page_count >= 1

    def test_extract_with_merge(self, invoice_pdf_bytes: bytes):
        result = orchestrate_extract(invoice_pdf_bytes, filename="invoice.pdf", merge=True)
        assert isinstance(result, ExtractionResult)

    def test_get_routing_info(self, invoice_pdf_bytes: bytes):
        info = get_routing_info(invoice_pdf_bytes)
        assert "pdf_type" in info
        assert "primary_engine" in info
        assert "fallback_engines" in info
        assert "reason" in info

    def test_extract_garbage_raises(self):
        with pytest.raises(OrchestratorError):
            orchestrate_extract(b"garbage data")
