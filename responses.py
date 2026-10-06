"""Unified response types for the PDF extraction API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from api.schemas.document import ExtractionResult


class ErrorResponse(BaseModel):
    """Standard error response following the unified format."""

    success: bool = Field(False, description="Always false for error responses")
    error: ErrorDetail = Field(..., description="Error details")


class ErrorDetail(BaseModel):
    """Detailed error information."""

    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: dict[str, Any] | None = Field(None, description="Additional context")


class SuccessResponse(BaseModel):
    """Standard success response wrapper."""

    success: bool = Field(True, description="Always true for successful responses")
    data: ExtractionResult = Field(..., description="Extraction result")
    cached: bool = Field(False, description="Whether the result came from cache")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field("ok", description="Service health status")
    version: str = Field(..., description="API version")
    engines: list[str] = Field(..., description="Available extraction engines")


class RoutingInfoResponse(BaseModel):
    """Response showing how a PDF would be routed."""

    success: bool = Field(True)
    data: dict[str, Any] = Field(..., description="Routing analysis")
