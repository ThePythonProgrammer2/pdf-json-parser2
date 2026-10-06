"""Tesseract OCR engine for extracting text from images.

Wraps pytesseract (which calls the Tesseract binary). If the library
or binary is not installed, the engine reports as unavailable and
raises OcrNotAvailableError on use.
"""

from __future__ import annotations

import io
from pathlib import Path

ENGINE_NAME = "tesseract"
ENGINE_VERSION = "0.1.0"


class OcrNotAvailableError(Exception):
    """Raised when the OCR backend is not installed."""


class TesseractEngineError(Exception):
    """Raised when Tesseract OCR fails to process an image."""


def is_available() -> bool:
    """Check if pytesseract and the Tesseract binary are installed."""
    try:
        import pytesseract  # noqa: F401
        import shutil
        return shutil.which("tesseract") is not None
    except ImportError:
        return False


def extract_text_from_image(image_bytes: bytes, lang: str = "eng") -> str:
    """Extract text from a PNG/JPEG image using Tesseract.

    Args:
        image_bytes: Raw bytes of the image file.
        lang: Tesseract language code (e.g. "eng", "fra", "deu").

    Returns:
        Extracted text string.

    Raises:
        OcrNotAvailableError: If pytesseract or Tesseract is not installed.
        TesseractEngineError: If OCR processing fails.
    """
    if not is_available():
        raise OcrNotAvailableError(
            "Tesseract OCR is not available. Install pytesseract and the tesseract binary."
        )

    import pytesseract
    from PIL import Image

    try:
        image = Image.open(io.BytesIO(image_bytes))
        return pytesseract.image_to_string(image, lang=lang)
    except Exception as exc:
        raise TesseractEngineError(f"Tesseract OCR failed: {exc}") from exc


def extract_text_from_images(image_bytes_list: list[bytes], lang: str = "eng") -> list[str]:
    """Extract text from multiple images.

    Args:
        image_bytes_list: List of raw image byte arrays.
        lang: Tesseract language code.

    Returns:
        List of extracted text strings, one per image.
    """
    if not is_available():
        raise OcrNotAvailableError("Tesseract OCR is not available.")

    results: list[str] = []
    for img_bytes in image_bytes_list:
        try:
            text = extract_text_from_image(img_bytes, lang=lang)
            results.append(text)
        except TesseractEngineError as exc:
            results.append(f"[OCR error: {exc}]")
    return results
