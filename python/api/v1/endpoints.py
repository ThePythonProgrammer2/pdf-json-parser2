"""Blueprint-aligned API endpoints wrapper."""

from api.routes.sync_routes import *
from api.routes.async_routes import *
from api.routes.batch_routes import *
from api.routes.admin_routes import *

__all__ = [
    "extract_document",
    "health_check",
    "parse_pdf",
    "upload_document",
    "process_batch",
    "admin_status",
]
