"""EasyOCR engine for deep learning-based multilingual OCR.

Uses the easyocr library which supports 80+ languages. If the library
is not installed, the engine reports as unavailable.
"""

from __future__ import annotations

import io

ENGINE_NAME = "easyocr"
ENGINE_VERSION = "0.1.0"

# Cache the reader instance to avoid re-loading the model
_reader_cache: dict[str, object] = {}


class OcrNotAvailableError(Exception):
    """Raised when the OCR backend is not installed."""


class EasyOcrEngineError(Exception):
    """Raised when EasyOCR fails to process an image."""


def is_available() -> bool:
    """Check if easyocr is installed."""
    try:
        import easyocr  # noqa: F401
        return True
    except ImportError:
        return False


def _get_reader(langs: list[str]) -> object:
    """Get or create an EasyOCR reader for the given languages."""
    key = ",".join(sorted(langs))
    if key not in _reader_cache:
        import easyocr
        _reader_cache[key] = easyocr.Reader(langs, verbose=False)
    return _reader_cache[key]


def extract_text_from_image(image_bytes: bytes, langs: list[str] | None = None) -> str:
    """Extract text from an image using EasyOCR.

    Args:
        image_bytes: Raw bytes of the image file.
        langs: List of language codes (e.g. ["en", "fr"]). Defaults to English.

    Returns:
        Extracted text string.

    Raises:
        OcrNotAvailableError: If easyocr is not installed.
        EasyOcrEngineError: If OCR processing fails.
    """
    if not is_available():
        raise OcrNotAvailableError(
            "EasyOCR is not available. Install easyocr to use this engine."
        )

    if langs is None:
        langs = ["en"]

    try:
        reader = _get_reader(langs)
        results = reader.readtext(image_bytes)
        # results is a list of (bbox, text, confidence) tuples
        text_lines = [item[1] for item in results]
        return "\n".join(text_lines)
    except Exception as exc:
        raise EasyOcrEngineError(f"EasyOCR failed: {exc}") from exc
