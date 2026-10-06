"""Unit tests for the pikepdf recovery engine."""

from __future__ import annotations

from pathlib import Path

import pytest

from engines.pikepdf_engine import PikepdfEngineError, extract
from api.schemas.document import ExtractionResult

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def invoice_pdf_bytes() -> bytes:
    path = FIXTURES_DIR / "invoice.pdf"
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path.read_bytes()


class TestPikepdfEngine:
    def test_extract_from_bytes(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes, filename="invoice.pdf")
        assert isinstance(result, ExtractionResult)
        assert result.source_filename == "invoice.pdf"

    def test_metadata_populated(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes)
        meta = result.metadata
        assert meta.engine_name == "pikepdf"
        assert meta.page_count >= 1

    def test_invalid_input_raises(self):
        with pytest.raises(PikepdfEngineError):
            extract(b"not a pdf")

    def test_no_tables_extracted(self, invoice_pdf_bytes: bytes):
        result = extract(invoice_pdf_bytes)
        for page in result.pages:
            assert page.tables == []
