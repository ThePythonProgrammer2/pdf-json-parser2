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
    image_quality: str | dict = "unknown",
    multilingual: bool = False,
    prefer_speed: bool = False,
) -> str | None:
    """Select the best OCR engine based on requirements.

    Accepts the legacy keyword arguments as well as a lightweight dict context
    from newer phase-3 wrappers (for example, {"has_text": False, "is_scanned": True}).
    """
    context = {}
    if isinstance(image_quality, dict):
        context = image_quality
        image_quality = "low" if context.get("is_scanned") or not context.get("has_text", True) else "unknown"
        multilingual = bool(context.get("multilingual", multilingual))
        prefer_speed = bool(context.get("prefer_speed", prefer_speed))

    available = list_available_engines()
    if not available:
        return None

    if multilingual:
        for engine in available:
            if engine.name == "easyocr":
                return "easyocr"

    if prefer_speed:
        for engine in available:
            if engine.name == "paddleocr":
                return "paddleocr"

    if image_quality == "low":
        for engine in available:
            if engine.name == "easyocr":
                return "easyocr"

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
