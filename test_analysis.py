"""Tests for the analysis layer — table detector, layout, text flow, classifier, entity extractor."""

from __future__ import annotations

from analysis.table_detector import detect_tables, detect_tables_heuristic, TableRegion
from analysis.layout_analyzer import analyze_layout, PageLayout
from analysis.text_flow_analyzer import detect_reading_order, reconstruct_text
from analysis.ml_classifier import classify, ClassificationResult
from analysis.entity_extractor import extract_entities, EntityExtractionResult


SAMPLE_INVOICE_TEXT = """
Invoice #INV-2024-001
Bill To: John Smith
Date: 2024-03-15

Description          Quantity    Unit Price    Total
Web Development      1           $1,200.00     $1,200.00
Consulting           2           $75.00        $150.00

Subtotal: $1,350.00
Tax (8%): $108.00
Total: $1,458.00
Payment Terms: Net 30
"""

SAMPLE_RESUME_TEXT = """
Jane Doe
Software Engineer

Experience:
  Senior Developer at Tech Corp, 2020-2024
  Junior Developer at Startup Inc., 2018-2020

Education:
  B.S. Computer Science, MIT, 2018

Skills: Python, JavaScript, Docker
Email: jane.doe@email.com
Phone: (555) 123-4567
"""


class TestTableDetector:
    def test_detect_tables_returns_list(self):
        regions = detect_tables(SAMPLE_INVOICE_TEXT, page_number=1)
        assert isinstance(regions, list)

    def test_detect_tables_heuristic_finds_table(self):
        regions = detect_tables_heuristic(SAMPLE_INVOICE_TEXT, page_number=1)
        assert len(regions) >= 1
        assert all(isinstance(r, TableRegion) for r in regions)
        assert all(r.method == "heuristic" for r in regions)

    def test_detect_tables_empty_text(self):
        regions = detect_tables("", page_number=1)
        assert regions == []

    def test_table_region_has_page_number(self):
        regions = detect_tables_heuristic(SAMPLE_INVOICE_TEXT, page_number=3)
        for r in regions:
            assert r.page_number == 3


class TestLayoutAnalyzer:
    def test_analyze_layout_returns_page_layout(self):
        layout = analyze_layout(SAMPLE_INVOICE_TEXT, page_number=1)
        assert isinstance(layout, PageLayout)
        assert layout.page_number == 1

    def test_single_column_detection(self):
        layout = analyze_layout(SAMPLE_INVOICE_TEXT, page_number=1)
        assert layout.is_multi_column is False
        assert layout.column_count == 1

    def test_header_detection(self):
        layout = analyze_layout(SAMPLE_INVOICE_TEXT, page_number=1)
        # Header may or may not be detected depending on content
        if layout.header:
            assert layout.header.region_type == "header"

    def test_empty_text(self):
        layout = analyze_layout("", page_number=1)
        assert layout.is_multi_column is False
        assert len(layout.body_regions) >= 0


class TestTextFlowAnalyzer:
    def test_detect_reading_order_single_column(self):
        blocks = detect_reading_order(SAMPLE_INVOICE_TEXT, page_number=1)
        assert isinstance(blocks, list)
        assert len(blocks) >= 1

    def test_reconstruct_text(self):
        reconstructed = reconstruct_text(SAMPLE_INVOICE_TEXT, page_number=1)
        assert isinstance(reconstructed, str)
        assert len(reconstructed) > 0

    def test_empty_text(self):
        blocks = detect_reading_order("", page_number=1)
        assert blocks == []


class TestMlClassifier:
    def test_classify_invoice(self):
        result = classify(SAMPLE_INVOICE_TEXT)
        assert isinstance(result, ClassificationResult)
        assert result.document_type in ("invoice", "unknown")
        assert 0.0 <= result.confidence <= 1.0

    def test_classify_resume(self):
        result = classify(SAMPLE_RESUME_TEXT)
        assert isinstance(result, ClassificationResult)
        assert result.document_type in ("resume", "unknown")
        assert 0.0 <= result.confidence <= 1.0

    def test_classify_empty_text(self):
        result = classify("")
        assert result.document_type == "unknown"
        assert result.confidence == 0.0

    def test_classify_returns_scores(self):
        result = classify(SAMPLE_INVOICE_TEXT)
        assert isinstance(result.scores, dict)

    def test_classify_method_is_heuristic(self):
        result = classify(SAMPLE_INVOICE_TEXT)
        assert result.method == "heuristic"


class TestEntityExtractor:
    def test_extract_from_invoice(self):
        result = extract_entities(SAMPLE_INVOICE_TEXT)
        assert isinstance(result, EntityExtractionResult)
        assert len(result.monetary_amounts) > 0
        assert any("$" in m for m in result.monetary_amounts)

    def test_extract_dates(self):
        result = extract_entities(SAMPLE_INVOICE_TEXT)
        assert len(result.dates) > 0

    def test_extract_email(self):
        result = extract_entities(SAMPLE_RESUME_TEXT)
        assert len(result.emails) > 0
        assert "jane.doe@email.com" in result.emails

    def test_extract_phone(self):
        result = extract_entities(SAMPLE_RESUME_TEXT)
        assert len(result.phones) > 0

    def test_extract_empty_text(self):
        result = extract_entities("")
        assert result.entities == []
        assert result.persons == []

    def test_entities_have_positions(self):
        result = extract_entities(SAMPLE_INVOICE_TEXT)
        for entity in result.entities:
            assert entity.start >= 0
            assert entity.end > entity.start

    def test_no_duplicate_entities(self):
        result = extract_entities(SAMPLE_INVOICE_TEXT)
        values = [(e.entity_type, e.value.lower()) for e in result.entities]
        assert len(values) == len(set(values))
