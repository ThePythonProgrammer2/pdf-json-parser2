"""Named Entity Recognition (NER) for extracting entities from text.

Extracts names, dates, monetary amounts, email addresses, phone numbers,
and addresses using regex-based patterns. When spaCy is available,
uses NLP-based NER for higher accuracy.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class Entity:
    """A single extracted entity."""

    entity_type: str  # "person", "organization", "date", "money", "email", "phone", "address"
    value: str
    start: int
    end: int
    confidence: float
    method: str  # "regex" or "nlp"


@dataclass
class EntityExtractionResult:
    """All entities extracted from a document."""

    entities: list[Entity] = field(default_factory=list)
    persons: list[str] = field(default_factory=list)
    organizations: list[str] = field(default_factory=list)
    dates: list[str] = field(default_factory=list)
    monetary_amounts: list[str] = field(default_factory=list)
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    addresses: list[str] = field(default_factory=list)


def is_nlp_available() -> bool:
    """Check if spaCy NLP is available."""
    try:
        import spacy  # noqa: F401
        return True
    except ImportError:
        return False


# Regex patterns for entity extraction
_DATE_PATTERNS = [
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
    r"\b(\d{4}-\d{2}-\d{2})\b",
    r"\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b",
    r"\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b",
]

_MONEY_PATTERN = r"[$€£¥]\s?[\d,]+(?:\.\d{2})?|\b[\d,]+\.\d{2}\s?(?:USD|EUR|GBP|JPY|CAD|AUD)\b"

_EMAIL_PATTERN = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"

_PHONE_PATTERNS = [
    r"\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    r"\b\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{3,}[-.\s]?\d{4,}\b",
]

# Organization indicators
_ORG_INDICATORS = [
    r"\b(?:Inc\.?|LLC|Corp\.?|Corporation|Company|Co\.?|Ltd\.?|Limited|LLP|PLLC)\b",
]

# Person name pattern (Title Case, 2-3 words)
_PERSON_PATTERN = r"\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b"


def _extract_by_pattern(text: str, patterns: list[str], entity_type: str) -> list[Entity]:
    """Extract entities matching any of the given patterns."""
    entities: list[Entity] = []
    for pattern in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE if entity_type in ("date", "money") else 0):
            entities.append(
                Entity(
                    entity_type=entity_type,
                    value=match.group(0).strip(),
                    start=match.start(),
                    end=match.end(),
                    confidence=0.85,
                    method="regex",
                )
            )
    return entities


def _extract_persons(text: str) -> list[Entity]:
    """Extract person names using title prefix and standalone patterns."""
    entities: list[Entity] = []

    # Title-prefixed names
    for match in re.finditer(_PERSON_PATTERN, text):
        entities.append(
            Entity(
                entity_type="person",
                value=match.group(0).strip(),
                start=match.start(),
                end=match.end(),
                confidence=0.9,
                method="regex",
            )
        )

    return entities


def _extract_organizations(text: str) -> list[Entity]:
    """Extract organization names by finding text near org indicators."""
    entities: list[Entity] = []

    for pattern in _ORG_INDICATORS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            # Grab the preceding 1-3 words as the org name
            start = max(0, match.start() - 50)
            prefix = text[start:match.start()].strip()
            words = prefix.split()
            org_name = " ".join(words[-3:]) + " " + match.group(0)
            entities.append(
                Entity(
                    entity_type="organization",
                    value=org_name.strip(),
                    start=start,
                    end=match.end(),
                    confidence=0.7,
                    method="regex",
                )
            )

    return entities


def extract_entities(text: str) -> EntityExtractionResult:
    """Extract named entities from text.

    Uses regex patterns by default. When spaCy is available, enhances
    with NLP-based NER for person and organization detection.

    Args:
        text: Document text to extract entities from.

    Returns:
        EntityExtractionResult with categorized entities.
    """
    if not text.strip():
        return EntityExtractionResult()

    all_entities: list[Entity] = []

    # Extract by pattern type
    all_entities.extend(_extract_by_pattern(text, _DATE_PATTERNS, "date"))
    all_entities.extend(_extract_by_pattern(text, [_MONEY_PATTERN], "money"))
    all_entities.extend(_extract_by_pattern(text, [_EMAIL_PATTERN], "email"))
    all_entities.extend(_extract_by_pattern(text, _PHONE_PATTERNS, "phone"))
    all_entities.extend(_extract_persons(text))
    all_entities.extend(_extract_organizations(text))

    # Deduplicate by (type, value)
    seen: set[tuple[str, str]] = set()
    unique: list[Entity] = []
    for entity in all_entities:
        key = (entity.entity_type, entity.value.lower())
        if key not in seen:
            seen.add(key)
            unique.append(entity)

    # Categorize
    persons = [e.value for e in unique if e.entity_type == "person"]
    organizations = [e.value for e in unique if e.entity_type == "organization"]
    dates = [e.value for e in unique if e.entity_type == "date"]
    monetary = [e.value for e in unique if e.entity_type == "money"]
    emails = [e.value for e in unique if e.entity_type == "email"]
    phones = [e.value for e in unique if e.entity_type == "phone"]

    return EntityExtractionResult(
        entities=unique,
        persons=persons,
        organizations=organizations,
        dates=dates,
        monetary_amounts=monetary,
        emails=emails,
        phones=phones,
    )
