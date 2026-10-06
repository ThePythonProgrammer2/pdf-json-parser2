"""Blueprint-aligned service import wrapper for routing."""

from services.intelligent_router import *

__all__ = [
    "PdfType",
    "RouteDecision",
    "ENGINE_REGISTRY",
    "classify",
    "route",
]
