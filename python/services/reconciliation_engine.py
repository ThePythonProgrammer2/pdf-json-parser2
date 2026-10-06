"""Financial reconciliation helpers for document validation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ReconciliationResult:
    """Represents the balance between distributed line items and the document total."""

    computed_total: float
    tax_amount: float
    grand_total: float
    difference: float
    is_balanced: bool
    confidence: float
    notes: list[str] = field(default_factory=list)


def reconcile_totals(
    line_items: list[dict[str, Any]] | None,
    tax_amount: float | int = 0.0,
    grand_total: float | int = 0.0,
) -> ReconciliationResult:
    """Compute whether line items + tax match the grand total within a small tolerance."""
    items = line_items or []
    computed_total = 0.0

    for item in items:
        if isinstance(item, dict):
            value = item.get("total_price")
            if value is None:
                value = item.get("price", 0)
            computed_total += float(value or 0)

    tax = float(tax_amount or 0.0)
    total = float(grand_total or 0.0)
    difference = abs((computed_total + tax) - total)
    is_balanced = difference <= 0.01
    confidence = 0.99 if is_balanced else max(0.0, 0.5 - (difference / 10.0))

    notes: list[str] = []
    if not is_balanced:
        notes.append("financial totals do not reconcile within tolerance")
    else:
        notes.append("financial totals reconcile within tolerance")

    return ReconciliationResult(
        computed_total=round(computed_total, 2),
        tax_amount=round(tax, 2),
        grand_total=round(total, 2),
        difference=round(difference, 2),
        is_balanced=is_balanced,
        confidence=round(confidence, 2),
        notes=notes,
    )


def validate_reconciliation(
    line_items: list[dict[str, Any]] | None,
    tax_amount: float | int = 0.0,
    grand_total: float | int = 0.0,
) -> bool:
    """Return True when a financial extraction is internally consistent."""
    return reconcile_totals(line_items, tax_amount, grand_total).is_balanced
