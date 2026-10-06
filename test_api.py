"""Tests for the FastAPI application endpoints."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.app import app

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def invoice_pdf_bytes() -> bytes:
    path = FIXTURES_DIR / "invoice.pdf"
    if not path.exists():
        pytest.skip(f"Fixture not found: {path}")
    return path.read_bytes()


class TestAdminRoutes:
    def test_health(self, client: TestClient):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "engines" in data
        assert "pdfplumber" in data["engines"]

    def test_list_engines(self, client: TestClient):
        response = client.get("/api/v1/engines")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["engines"]) == 5

    def test_root(self, client: TestClient):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "pdf-json-parser2-premium"


class TestSyncRoutes:
    def test_parse_document(self, client: TestClient, invoice_pdf_bytes: bytes):
        response = client.post(
            "/api/v1/parse-document",
            files={"file": ("invoice.pdf", invoice_pdf_bytes, "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert data["data"]["metadata"]["page_count"] >= 1

    def test_parse_document_raw(self, client: TestClient, invoice_pdf_bytes: bytes):
        response = client.post(
            "/api/v1/parse-document/raw",
            files={"file": ("invoice.pdf", invoice_pdf_bytes, "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "metadata" in data
        assert "pages" in data

    def test_parse_invalid_file(self, client: TestClient):
        response = client.post(
            "/api/v1/parse-document",
            files={"file": ("bad.pdf", b"not a pdf", "application/pdf")},
        )
        assert response.status_code in (200, 422)

    def test_parse_non_pdf_rejected(self, client: TestClient):
        response = client.post(
            "/api/v1/parse-document",
            files={"file": ("test.txt", b"hello", "text/plain")},
        )
        assert response.status_code == 422  # Pydantic validation error for filename


class TestBatchRoutes:
    def test_batch_parse(self, client: TestClient, invoice_pdf_bytes: bytes):
        response = client.post(
            "/api/v1/batch/parse-documents",
            files=[
                ("files", ("invoice.pdf", invoice_pdf_bytes, "application/pdf")),
                ("files", ("invoice2.pdf", invoice_pdf_bytes, "application/pdf")),
            ],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["succeeded"] == 2

    def test_batch_too_many_files(self, client: TestClient, invoice_pdf_bytes: bytes):
        files = [("files", (f"f{i}.pdf", invoice_pdf_bytes, "application/pdf")) for i in range(21)]
        response = client.post("/api/v1/batch/parse-documents", files=files)
        assert response.status_code == 413


class TestRoutingInfo:
    def test_routing_info(self, client: TestClient, invoice_pdf_bytes: bytes):
        response = client.post(
            "/api/v1/routing-info",
            files={"file": ("invoice.pdf", invoice_pdf_bytes, "application/pdf")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert data["data"]["pdf_type"] in ("text_based", "scanned_image", "form_pdf", "corrupted", "unknown")
