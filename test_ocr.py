"""Tests for the OCR layer — smart selector and engine availability checks."""

from __future__ import annotations

from ocr.smart_ocr_selector import (
    select_engine,
    list_available_engines,
    get_engine_status,
)
from ocr.tesseract_engine import is_available as tesseract_available
from ocr.easyocr_engine import is_available as easyocr_available
from ocr.paddleocr_engine import is_available as paddleocr_available


class TestOcrAvailability:
    def test_tesseract_availability_check(self):
        result = tesseract_available()
        assert isinstance(result, bool)

    def test_easyocr_availability_check(self):
        result = easyocr_available()
        assert isinstance(result, bool)

    def test_paddleocr_availability_check(self):
        result = paddleocr_available()
        assert isinstance(result, bool)


class TestSmartOcrSelector:
    def test_list_available_engines_returns_list(self):
        engines = list_available_engines()
        assert isinstance(engines, list)

    def test_select_engine_returns_str_or_none(self):
        result = select_engine()
        assert result is None or isinstance(result, str)

    def test_select_engine_with_multilingual(self):
        result = select_engine(multilingual=True)
        assert result is None or isinstance(result, str)

    def test_select_engine_prefer_speed(self):
        result = select_engine(prefer_speed=True)
        assert result is None or isinstance(result, str)

    def test_select_engine_low_quality(self):
        result = select_engine(image_quality="low")
        assert result is None or isinstance(result, str)

    def test_get_engine_status(self):
        status = get_engine_status()
        assert isinstance(status, list)
        assert len(status) == 3
        for entry in status:
            assert "name" in entry
            assert "available" in entry
            assert "strengths" in entry
