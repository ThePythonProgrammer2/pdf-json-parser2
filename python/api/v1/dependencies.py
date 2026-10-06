"""Blueprint-aligned API dependency wrappers."""

from api.middleware.auth import validate_api_key
from rate_limiter import RateLimiterMiddleware


def require_api_key(api_key: str | None, expected: str | None) -> bool:
    """Validate the provided API key against the configured secret."""
    return validate_api_key(api_key, expected)


__all__ = ["require_api_key", "RateLimiterMiddleware", "validate_api_key"]
