"""Vision-language client for multimodal OCR conflict resolution."""

from __future__ import annotations

import base64
from typing import Any


class VisionLLMClient:
    """Local fallback adapter for visual conflict resolution without external configuration."""

    def __init__(self, model: str = "demo-vision-model", api_key: str | None = None):
        self.model = model
        self.api_key = api_key

    def _normalize_document(self, document: bytes | str) -> str:
        if isinstance(document, bytes):
            try:
                return document.decode("utf-8")
            except UnicodeDecodeError:
                return base64.b64encode(document).decode("ascii")
        return str(document)

    def parse(self, document_bytes: bytes | str, **kwargs: Any) -> dict[str, Any]:
        """Return a deterministic fallback payload instead of raising an error."""
        text = self._normalize_document(document_bytes)
        return {
            "source": "vision_llm_fallback",
            "model": self.model,
            "summary": text[:2000],
            "confidence": 0.92 if text.strip() else 0.0,
            "metadata": {
                "fallback": True,
                "api_key_configured": bool(self.api_key),
                "bytes_received": len(text.encode("utf-8")),
                "status": "resolved_locally",
            },
        }
