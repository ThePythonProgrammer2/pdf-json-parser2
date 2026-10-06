"""Pydantic models for structured PDF extraction output."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class EngineMetadata(BaseModel):
    """Metadata about the extraction engine and processing run."""

    engine_name: str = Field(..., description="Name of the extraction engine used")
    engine_version: str = Field(..., description="Version string of the engine")
    processing_time_ms: float = Field(
        ..., description="Time spent extracting in milliseconds"
    )
    page_count: int = Field(..., description="Number of pages processed")
    tables_extracted: int = Field(
        0, description="Number of tables found across all pages"
    )
    errors: list[str] = Field(
        default_factory=list, description="Non-fatal errors encountered during extraction"
    )


class ExtractedTable(BaseModel):
    """A single table extracted from a PDF page."""

    page_number: int = Field(..., description="1-based page number where the table was found")
    table_index: int = Field(
        ..., description="0-based index of the table within the page"
    )
    headers: list[str] = Field(
        default_factory=list, description="Column header labels (empty if none detected)"
    )
    rows: list[list[Any]] = Field(
        default_factory=list, description="Table rows, each a list of cell values"
    )
    row_count: int = Field(0, description="Number of data rows (excluding headers)")
    col_count: int = Field(0, description="Number of columns")


class PageContent(BaseModel):
    """Textual and tabular content from a single PDF page."""

    page_number: int = Field(..., description="1-based page number")
    text: str = Field("", description="Raw extracted text for the page")
    tables: list[ExtractedTable] = Field(
        default_factory=list, description="Tables found on this page"
    )
    width: float | None = Field(None, description="Page width in PDF points")
    height: float | None = Field(None, description="Page height in PDF points")


class AnalysisInfo(BaseModel):
    """Document analysis results (classification, entities, layout)."""

    document_type: str = Field("unknown", description="Classified document type")
    classification_confidence: float = Field(0.0, description="Classification confidence 0-1")
    persons: list[str] = Field(default_factory=list, description="Extracted person names")
    organizations: list[str] = Field(default_factory=list, description="Extracted organizations")
    dates: list[str] = Field(default_factory=list, description="Extracted dates")
    monetary_amounts: list[str] = Field(default_factory=list, description="Extracted monetary amounts")
    emails: list[str] = Field(default_factory=list, description="Extracted email addresses")
    phones: list[str] = Field(default_factory=list, description="Extracted phone numbers")


class ExtractionResult(BaseModel):
    """Top-level result returned by every extraction engine."""

    source_filename: str = Field(..., description="Original filename or label")
    pages: list[PageContent] = Field(
        default_factory=list, description="Extracted content per page"
    )
    full_text: str = Field("", description="Concatenated text from all pages")
    metadata: EngineMetadata = Field(
        ..., description="Engine metadata and processing stats"
    )
    analysis: AnalysisInfo | None = Field(
        None, description="Optional document analysis (classification, entities)"
    )
    cached: bool = Field(False, description="Whether this result came from cache")
