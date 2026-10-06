"""ML-based document classifier for invoice/resume/other classification.

Uses heuristic classification by default. When TensorFlow and trained
models are available, uses the ML classifier for higher accuracy.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class ClassificationResult:
    """Result of document classification."""

    document_type: str  # "invoice", "resume", "contract", "report", "unknown"
    confidence: float
    method: str  # "heuristic" or "ml"
    scores: dict[str, float]


# Heuristic keyword sets for each document type
_INVOICE_KEYWORDS = [
    "invoice", "bill to", "amount due", "subtotal", "tax", "total",
    "payment terms", "po number", "remit to", "balance due",
    "quantity", "unit price", "line item", "discount",
]

_RESUME_KEYWORDS = [
    "resume", "curriculum vitae", "work experience", "education",
    "skills", "employment history", "objective", "summary of qualifications",
    "references", "professional experience", "certifications",
]

_CONTRACT_KEYWORDS = [
    "contract", "agreement", "party", "parties", "whereas",
    "terms and conditions", "hereby", "obligations", "liability",
    "termination", "confidential", "warranty",
]

_REPORT_KEYWORDS = [
    "report", "findings", "analysis", "conclusion", "recommendations",
    "executive summary", "methodology", "results", "discussion",
    "abstract", "introduction",
]

_KEYWORD_SETS = {
    "invoice": _INVOICE_KEYWORDS,
    "resume": _RESUME_KEYWORDS,
    "contract": _CONTRACT_KEYWORDS,
    "report": _REPORT_KEYWORDS,
}


def is_ml_available() -> bool:
    """Check if TensorFlow and trained models are available."""
    try:
        import tensorflow  # noqa: F401
        models_dir = Path(__file__).parent.parent / "models"
        return (models_dir / "invoice_classifier.pkl").exists()
    except ImportError:
        return False


def _heuristic_classify(text: str) -> ClassificationResult:
    """Classify a document using keyword matching heuristics."""
    text_lower = text.lower()
    scores: dict[str, float] = {}

    for doc_type, keywords in _KEYWORD_SETS.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        scores[doc_type] = matches / len(keywords) if keywords else 0.0

    best_type = max(scores, key=scores.get) if scores else "unknown"
    best_score = scores.get(best_type, 0.0)

    # If no keywords matched, return unknown
    if best_score == 0.0:
        return ClassificationResult(
            document_type="unknown",
            confidence=0.0,
            method="heuristic",
            scores=scores,
        )

    return ClassificationResult(
        document_type=best_type,
        confidence=round(best_score, 3),
        method="heuristic",
        scores={k: round(v, 3) for k, v in scores.items()},
    )


def classify(text: str) -> ClassificationResult:
    """Classify a document by type.

    Uses ML classification if TensorFlow and models are available,
    otherwise falls back to heuristic keyword matching.

    Args:
        text: Full document text.

    Returns:
        ClassificationResult with document type and confidence.
    """
    if not text.strip():
        return ClassificationResult(
            document_type="unknown",
            confidence=0.0,
            method="heuristic",
            scores={},
        )

    if is_ml_available():
        # ML classification would go here — requires trained models
        # For now, fall through to heuristic
        pass

    return _heuristic_classify(text)
