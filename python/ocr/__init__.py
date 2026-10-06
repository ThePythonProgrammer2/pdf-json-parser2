"""Blueprint-aligned OCR package."""

from ocr.smart_ocr_selector import *
from ocr.paddleocr_engine import *
from .vision_llm_client import *

__all__ = [
    "select_engine",
    "list_available_engines",
    "get_engine_status",
    "PaddleOCRWrapper",
    "VisionLLMClient",
]
