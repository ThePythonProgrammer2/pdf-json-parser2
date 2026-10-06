from __future__ import annotations

from typing import Any

from pydantic import Field

from .base import BaseSchema


class ExtractedTable(BaseSchema):
    page_number: int = Field(default=1, gt=0)
    table_index: int = Field(default=0, ge=0)
    headers: list[str] = Field(default_factory=list)
    rows: list[list[Any]] = Field(default_factory=list)
    row_count: int = Field(default=0, ge=0)
    col_count: int = Field(default=0, ge=0)


class PageContent(BaseSchema):
    page_number: int = Field(default=1, gt=0)
    text: str = ""
    tables: list[ExtractedTable] = Field(default_factory=list)
    width: float | None = Field(default=None)
    height: float | None = Field(default=None)


class EngineMetadata(BaseSchema):
    engine_name: str
    engine_version: str
    processing_time_ms: float = Field(default=0.0, ge=0.0)
    page_count: int = Field(default=0, ge=0)
    tables_extracted: int = Field(default=0, ge=0)
    errors: list[str] = Field(default_factory=list)
    confidence: float | None = Field(default=1.0, ge=0.0, le=1.0)


class ExtractionResult(BaseSchema):
    source_filename: str
    pages: list[PageContent] = Field(default_factory=list)
    full_text: str = ""
    metadata: EngineMetadata
    confidence: float | None = Field(default=1.0, ge=0.0, le=1.0)
