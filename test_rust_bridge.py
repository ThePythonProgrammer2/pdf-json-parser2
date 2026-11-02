from rust_bridge import clean_text, is_rust_available, validate_totals


def test_rust_bridge_clean_text_and_totals() -> None:
    assert is_rust_available() is True
    assert clean_text("  Hello   world  ") == "Hello world"
    assert validate_totals([10.0, 20.0], 2.0, 32.0) is True
