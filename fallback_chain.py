"""Cascading fallback chain for PDF extraction.

Tries engines in order until one succeeds. If the primary engine fails,
falls back to the next in the chain.
"""

from __future__ import annotations

from pathlib import Path
from typing import BinaryIO

from api.schemas.document import ExtractionResult
from services.intelligent_router import ENGINE_REGISTRY


class FallbackChainError(Exception):
    """Raised when all engines in the fallback chain fail."""


def run_chain(
    source: str | Path | bytes | BinaryIO,
    engine_names: list[str],
    filename: str = "document.pdf",
) -> ExtractionResult:
    """Try engines in order, returning the first successful result.

    Args:
        source: PDF file path, bytes, or file-like object.
        engine_names: Ordered list of engine names to try.
        filename: Label for the source file.

    Returns:
        ExtractionResult from the first engine that succeeds.

    Raises:
        FallbackChainError: If every engine in the chain fails.
    """
    if not engine_names:
        raise FallbackChainError("No engines specified in fallback chain")

    failures: list[str] = []

    for name in engine_names:
        engine_fn = ENGINE_REGISTRY.get(name)
        if engine_fn is None:
            failures.append(f"{name}: engine not found in registry")
            continue

        try:
            result = engine_fn(source, filename=filename)
            if result and result.pages:
                return result
            failures.append(f"{name}: returned empty result")
        except Exception as exc:
            failures.append(f"{name}: {exc}")

    raise FallbackChainError(
        f"All engines failed: {'; '.join(failures)}"
    )
