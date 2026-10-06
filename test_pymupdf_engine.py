"""Unit tests for the PyMuPDF extraction engine."""

from __future__ import annotations

from pathlib import Path

import pytest

from engines.pymupdf_engine import PymupdfEngineError, extract
from api.schemas.document import ExtractionResult, PageContent

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def invoice_pdf_bytes() -> bytes:
    path = FIXTURES_DIR / "invoice.pdf"
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path.read_bytes()


class TestPymupdfEngine:
    def test_extract_from_bytes(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes, filename="invoice.pdf")
        assert isinstance(result, ExtractionResult)
        assert result.source_filename == "invoice.pdf"

    def test_metadata_populated(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes)
        meta = result.metadata
        assert meta.engine_name == "pymupdf"
        assert meta.processing_time_ms >= 0
        assert meta.page_count >= 1

    def test_pages_have_text(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes)
        assert len(result.pages) >= 1
        assert any(p.text.strip() for p in result.pages)

    def test_invalid_input_raises(self):
        with pytest.raises(PymupdfEngineError):
            extract(b"not a pdf")

    def test_page_dimensions(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes)
        for page in result.pages:
            if page.width is not None:
                assert page.width > 0
            if page.height is not None:
                assert page.height > 0
