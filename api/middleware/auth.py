from auth import *


def validate_api_key(provided_key: str | None, expected_key: str | None) -> bool:
    """Return whether the provided API key matches the configured secret."""
    if not expected_key:
        return True
    return bool(provided_key) and provided_key == expected_key


__all__ = ["AuthMiddleware", "validate_api_key"]
