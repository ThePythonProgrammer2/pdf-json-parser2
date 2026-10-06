"""Smart OCR selector that picks the best available OCR engine.

Checks which OCR libraries are installed and selects the best one
based on image quality heuristics and language requirements.
"""

from __future__ import annotations

from dataclasses import dataclass

from ocr.tesseract_engine import is_available as tesseract_available
from ocr.easyocr_engine import is_available as easyocr_available
from ocr.paddleocr_engine import is_available as paddleocr_available


@dataclass
class OcrEngineInfo:
    """Information about an OCR engine."""

    name: str
    available: bool
    strengths: list[str]
    languages: int


# Engine capabilities catalog
_ENGINE_INFO = {
    "tesseract": OcrEngineInfo(
        name="tesseract",
        available=tesseract_available(),
        strengths=["fast", "industry standard", "100+ languages"],
        languages=100,
    ),
    "easyocr": OcrEngineInfo(
        name="easyocr",
        available=easyocr_available(),
        strengths=["deep learning", "multilingual", "handwriting"],
        languages=80,
    ),
    "paddleocr": OcrEngineInfo(
        name="paddleocr",
        available=paddleocr_available(),
        strengths=["fast parallel", "table recognition", "high accuracy"],
        languages=20,
    ),
}


def list_available_engines() -> list[OcrEngineInfo]:
    """Return all available OCR engines sorted by priority."""
    available = [info for info in _ENGINE_INFO.values() if info.available]
    # Priority: paddleocr (fastest+accurate) > easyocr (deep learning) > tesseract (fallback)
    priority = {"paddleocr": 0, "easyocr": 1, "tesseract": 2}
    available.sort(key=lambda e: priority.get(e.name, 99))
    return available


def select_engine(
    image_quality: str = "unknown",
    multilingual: bool = False,
    prefer_speed: bool = False,
) -> str | None:
    """Select the best OCR engine based on requirements.

    Args:
        image_quality: "high", "medium", "low", or "unknown".
        multilingual: Whether multilingual support is needed.
        prefer_speed: Whether to prioritize speed over accuracy.

    Returns:
        Engine name string, or None if no engines are available.
    """
    available = list_available_engines()
    if not available:
        return None

    if multilingual:
        # EasyOCR has the best multilingual support
        for engine in available:
            if engine.name == "easyocr":
                return "easyocr"

    if prefer_speed:
        # PaddleOCR is the fastest
        for engine in available:
            if engine.name == "paddleocr":
                return "paddleocr"

    if image_quality == "low":
        # Deep learning models handle low quality better
        for engine in available:
            if engine.name == "easyocr":
                return "easyocr"

    # Default: return highest priority available engine
    return available[0].name if available else None


def get_engine_status() -> list[dict]:
    """Return status of all OCR engines for admin/health endpoints."""
    return [
        {
            "name": info.name,
            "available": info.available,
            "strengths": info.strengths,
        }
        for info in _ENGINE_INFO.values()
    ]
