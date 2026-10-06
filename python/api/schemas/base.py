from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, ValidationInfo, field_validator


def normalize_float(value: Any) -> float | Any:
    """Round floating-point values to a stable two-decimal precision."""
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return round(float(value), 2)
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return value
        try:
            return round(float(stripped), 2)
        except ValueError:
            return value
    return value


class BaseSchema(BaseModel):
    """Base schema model with normalized float handling."""

    model_config = ConfigDict(validate_assignment=True, extra="ignore")

    @field_validator("*", mode="before")
    @classmethod
    def normalize_precision(cls, value: Any, info: ValidationInfo) -> Any:
        """Ensure IEEE 754 float artifacts are rounded to two decimal places."""
        if value is None or isinstance(value, bool):
            return value
        if isinstance(value, (int, float, str)):
            field_name = info.field_name or ""
            if field_name.lower() in {
                "confidence",
                "score",
                "processing_time_ms",
                "width",
                "height",
                "total",
                "amount",
                "subtotal",
                "tax",
                "balance",
            } or isinstance(value, (float, str)):
                return normalize_float(value)
        return value
