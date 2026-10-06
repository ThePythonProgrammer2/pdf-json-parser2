"""Unit tests for the pdfplumber extraction engine."""

from __future__ import annotations

from pathlib import Path

import pytest

from engines.pdfplumber_engine import (
    PdfplumberEngineError,
    extract,
)
from api.schemas.document import ExtractionResult, PageContent, ExtractedTable

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def invoice_pdf_path() -> Path:
    """Path to the test invoice fixture."""
    path = FIXTURES_DIR / "invoice.pdf"
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path


@pytest.fixture
def invoice_pdf_bytes(invoice_pdf_path: Path) -> bytes:
    """Raw bytes of the test invoice fixture."""
    return invoice_pdf_path.read_bytes()


class TestPdfplumberEngine:
    """Tests covering the pdfplumber engine's extract function."""

    def test_extract_from_path_returns_extraction_result(self, invoice_pdf_path: Path):
        """Extracting from a file path returns a valid ExtractionResult."""
        result = extract(invoice_pdf_path, filename="invoice.pdf")

        assert isinstance(result, ExtractionResult)
        assert result.source_filename == "invoice.pdf"

    def test_extract_from_bytes_returns_extraction_result(self, invoice_pdf_bytes: bytes):
        """Extracting from raw bytes returns a valid ExtractionResult."""
        result = extract(invoice_pdf_bytes, filename="invoice.pdf")

        assert isinstance(result, ExtractionResult)
        assert result.source_filename == "invoice.pdf"

    def test_metadata_populated_correctly(self, invoice_pdf_path: Path):
        """Engine metadata contains expected fields."""
        result = extract(invoice_pdf_path)

        meta = result.metadata
        assert meta.engine_name == "pdfplumber"
        assert meta.engine_version != ""
        assert meta.processing_time_ms >= 0
        assert meta.page_count >= 1
        assert meta.tables_extracted >= 0

    def test_pages_contain_text(self, invoice_pdf_path: Path):
        """Each page in the result has text content."""
        result = extract(invoice_pdf_path)

        assert len(result.pages) >= 1
        for page in result.pages:
            assert isinstance(page, PageContent)
            assert page.page_number >= 1
        # At least one page should have non-empty text
        assert any(p.text.strip() for p in result.pages)

    def test_full_text_concatenates_pages(self, invoice_pdf_path: Path):
        """full_text contains text from all pages."""
        result = extract(invoice_pdf_path)

        for page in result.pages:
            if page.text.strip():
                assert page.text.strip() in result.full_text

    def test_tables_are_extracted_table_instances(self, invoice_pdf_path: Path):
        """Any extracted tables are valid ExtractedTable models."""
        result = extract(invoice_pdf_path)

        for page in result.pages:
            for table in page.tables:
                assert isinstance(table, ExtractedTable)
                assert table.page_number == page.page_number
                assert table.row_count == len(table.rows)
                assert table.col_count >= 0

    def test_invalid_input_raises_error(self):
        """Passing garbage bytes raises PdfplumberEngineError."""
        with pytest.raises(PdfplumberEngineError):
            extract(b"not a real pdf", filename="bad.pdf")

    def test_page_dimensions_populated(self, invoice_pdf_path: Path):
        """Page width and height are extracted when available."""
        result = extract(invoice_pdf_path)

        for page in result.pages:
            if page.width is not None:
                assert page.width > 0
            if page.height is not None:
                assert page.height > 0

    def test_no_errors_on_valid_pdf(self, invoice_pdf_path: Path):
        """A valid PDF produces no extraction errors in metadata."""
        result = extract(invoice_pdf_path)

        assert result.metadata.errors == []
