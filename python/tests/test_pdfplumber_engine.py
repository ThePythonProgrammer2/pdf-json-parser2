from __future__ import annotations

import io
from pathlib import Path

from python.api.schemas.common import EngineMetadata, ExtractionResult, PageContent
from python.engines.pdfplumber_engine import extract


FIXTURE_PATH = Path(__file__).resolve().parents[2] / "invoice.pdf"


def test_extract_reads_mock_stream_into_immutable_schema_objects() -> None:
    payload = FIXTURE_PATH.read_bytes()

    result = extract(io.BytesIO(payload), filename="invoice.pdf")

    assert isinstance(result, ExtractionResult)
    assert result.source_filename == "invoice.pdf"
    assert result.metadata.engine_name == "pdfplumber"
    assert isinstance(result.pages, list)
    assert result.pages and all(isinstance(page, PageContent) for page in result.pages)
    assert any(page.text.strip() for page in result.pages)
    assert isinstance(result.metadata, EngineMetadata)
    assert result.metadata.processing_time_ms >= 0
    assert result.metadata.processing_time_ms == round(result.metadata.processing_time_ms, 2)


def test_float_fields_are_rounded_to_two_decimal_places() -> None:
    from python.api.schemas.base import normalize_float

    assert normalize_float(0.9000000000000001) == 0.9
    assert normalize_float("0.9000000000000001") == 0.9
    assert normalize_float(1.234567) == 1.23


def test_extraction_result_serializes_clean_float_values() -> None:
    result = extract(io.BytesIO(FIXTURE_PATH.read_bytes()), filename="invoice.pdf")
    assert result.metadata.processing_time_ms == round(result.metadata.processing_time_ms, 2)
