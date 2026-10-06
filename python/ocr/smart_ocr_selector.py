"""Blueprint-aligned OCR import wrapper."""

from ocr.smart_ocr_selector import *

__all__ = ["select_engine", "list_available_engines", "get_engine_status"]
