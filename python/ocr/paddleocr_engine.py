"""Blueprint-aligned OCR import wrapper."""

from ocr.paddleocr_engine import *

__all__ = ["PaddleOCREngine", "extract_text", "is_available"]
