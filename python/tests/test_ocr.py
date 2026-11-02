"""Phase 3 OCR tests for the blueprint package."""

from ocr.smart_ocr_selector import get_engine_status, list_available_engines, select_engine
from ocr.vision_llm_client import VisionLLMClient


def test_list_available_engines_returns_list():
    engines = list_available_engines()
    assert isinstance(engines, list)


def test_get_engine_status_returns_status_list():
    status = get_engine_status()
    assert isinstance(status, list)
    assert len(status) == 3
    assert all("name" in entry for entry in status)


def test_select_engine_returns_name():
    engine = select_engine({"has_text": False, "is_scanned": True})
    assert engine is None or isinstance(engine, str)


def test_select_engine_prefers_easyocr_for_scanned_docs():
    engine = select_engine({"has_text": False, "is_scanned": True, "prefer_speed": False})
    assert engine == "easyocr"


def test_vision_llm_client_falls_back_without_raising():
    client = VisionLLMClient(model="demo-model")
    result = client.parse(b"Invoice subtotal 100 tax 10 total 110")
    assert isinstance(result, dict)
    assert result.get("source") in {"vision_llm_fallback", "llm"}
