"""Phase 3 analysis tests for the blueprint package."""

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


def test_detect_tables_returns_list():
    regions = detect_tables(SAMPLE_INVOICE_TEXT, page_number=1)
    assert isinstance(regions, list)


def test_detect_tables_heuristic_finds_table():
    regions = detect_tables_heuristic(SAMPLE_INVOICE_TEXT, page_number=1)
    assert len(regions) >= 1
    assert all(isinstance(r, TableRegion) for r in regions)


def test_analyze_layout_returns_page_layout():
    layout = analyze_layout(SAMPLE_INVOICE_TEXT, page_number=1)
    assert isinstance(layout, PageLayout)


def test_detect_reading_order_single_column():
    blocks = detect_reading_order(SAMPLE_INVOICE_TEXT, page_number=1)
    assert isinstance(blocks, list)
    assert len(blocks) >= 1


def test_classify_invoice():
    result = classify(SAMPLE_INVOICE_TEXT)
    assert isinstance(result, ClassificationResult)
    assert result.document_type in {"invoice", "unknown"}


def test_extract_entities_invoice():
    result = extract_entities(SAMPLE_INVOICE_TEXT)
    assert isinstance(result, EntityExtractionResult)
    assert len(result.monetary_amounts) > 0


def test_extract_email_from_resume():
    result = extract_entities(SAMPLE_RESUME_TEXT)
    assert "jane.doe@email.com" in result.emails


def test_reconstruct_text():
    text = reconstruct_text(SAMPLE_INVOICE_TEXT, page_number=1)
    assert isinstance(text, str)
    assert len(text) > 0
