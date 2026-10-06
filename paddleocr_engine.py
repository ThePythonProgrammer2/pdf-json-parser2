"""PaddleOCR engine for fast parallel OCR.

Uses the paddleocr library which provides high-speed OCR with
table recognition support. If the library is not installed,
the engine reports as unavailable.
"""

from __future__ import annotations

ENGINE_NAME = "paddleocr"
ENGINE_VERSION = "0.1.0"

_engine_cache: dict[str, object] = {}


class OcrNotAvailableError(Exception):
    """Raised when the OCR backend is not installed."""


class PaddleOcrEngineError(Exception):
    """Raised when PaddleOCR fails to process an image."""


def is_available() -> bool:
    """Check if paddleocr is installed."""
    try:
        import paddleocr  # noqa: F401
        return True
    except ImportError:
        return False


def _get_engine(lang: str = "en") -> object:
    """Get or create a PaddleOCR engine instance."""
    if lang not in _engine_cache:
        from paddleocr import PaddleOCR
        _engine_cache[lang] = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    return _engine_cache[lang]


def extract_text_from_image(image_bytes: bytes, lang: str = "en") -> str:
    """Extract text from an image using PaddleOCR.

    Args:
        image_bytes: Raw bytes of the image file.
        lang: PaddleOCR language code (e.g. "en", "ch", "french").

    Returns:
        Extracted text string.

    Raises:
        OcrNotAvailableError: If paddleocr is not installed.
        PaddleOcrEngineError: If OCR processing fails.
    """
    if not is_available():
        raise OcrNotAvailableError(
            "PaddleOCR is not available. Install paddleocr to use this engine."
        )

    try:
        import tempfile
        import os

        engine = _get_engine(lang)

        # PaddleOCR requires a file path, so write to a temp file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            result = engine.ocr(tmp_path, cls=True)
        finally:
            os.unlink(tmp_path)

        # result is a list of pages, each a list of (bbox, (text, confidence))
        if not result or not result[0]:
            return ""

        text_lines = [line[1][0] for line in result[0]]
        return "\n".join(text_lines)
    except Exception as exc:
        raise PaddleOcrEngineError(f"PaddleOCR failed: {exc}") from exc
