"""Phase 3 OCR tests for the blueprint package."""

from ocr.smart_ocr_selector import get_engine_status, list_available_engines, select_engine


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
