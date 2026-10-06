"""Vision-language client placeholder for multimodal OCR conflict resolution."""

from __future__ import annotations


class VisionLLMClient:
    """Thin adapter around a future multimodal parsing backend."""

    def __init__(self, model: str = "gpt-4o-mini", api_key: str | None = None):
        self.model = model
        self.api_key = api_key

    def parse(self, document_bytes: bytes | str, **kwargs):
        """Raise a clear, intentional error until the backend is configured."""
        raise NotImplementedError(
            "Vision LLM parsing is not configured in this environment; use OCR fallback processing."
        )
