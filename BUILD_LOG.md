# BUILD LOG

## Phase 1: Foundation scaffold and extraction engine

Status: complete for this turn.

### Included
- Created the required Python project structure under `python/` and added `.gitkeep` markers for the core directories.
- Added `python/requirements.txt` with the base extraction dependencies.
- Added `python/pyproject.toml` with project metadata and pytest configuration.
- Implemented `python/engines/pdfplumber_engine.py` to open file paths, raw bytes, and file-like PDF streams.
- Added schema models in `python/api/schemas/base.py` and `python/api/schemas/common.py` with float normalization to two decimal places.
- Added `python/tests/test_pdfplumber_engine.py` to validate stream parsing and precision stability.

### Milestones ahead
- Phase 2 will expand routing, orchestration, and API-layer integration.
- Phase 3 will add OCR, analysis, and caching capabilities.

> Execution is intentionally stopped at the approved Phase 1 boundary until direct confirmation to continue to Phase 2.
- Handles single-column (passthrough) and multi-column (split by gap)

**`ml_classifier.py`** — Document classification (invoice/resume/contract/report)
- `classify()` uses keyword-based heuristic classification by default
- `is_ml_available()` checks for TensorFlow + trained model weights
- Returns `ClassificationResult` with document type, confidence, and per-type scores

**`entity_extractor.py`** — Named Entity Recognition
- `extract_entities()` extracts persons, organizations, dates, monetary amounts, emails, phones
- Regex-based patterns for each entity type
- `is_nlp_available()` checks for spaCy (would enhance person/org detection)
- Returns `EntityExtractionResult` with categorized entity lists
- Deduplicates entities by (type, value)

#### 3. Caching Layer (`python/caching/`)

**`memory_cache.py`** — Thread-safe LRU in-memory cache
- `MemoryCache` with configurable max size
- LRU eviction via `OrderedDict`
- Tracks hits, misses, and hit rate
- Thread-safe with `threading.Lock`

**`sqlite_cache.py`** — Persistent local cache via SQLite
- `SqliteCache` stores entries as JSON with created_at, accessed_at, hit_count
- `evict_older_than()` for TTL-based eviction
- Persistent across restarts
- Thread-safe with lock

**`redis_cache.py`** — Distributed cache via Redis
- `RedisCache` with configurable URL and TTL
- `is_available()` checks for redis-py
- JSON serialization with `setex` for TTL support

**`cache_strategies.py`** — Smart eviction policies
- `EvictionPolicy` enum: LRU, LFU, TTL, SMART
- `select_eviction_candidates()` picks keys to evict based on policy
- `compute_smart_score()` combines recency, frequency, and size for smart eviction
- Individual `should_evict_*` functions for each policy

**`cache_manager.py`** — Multi-tier caching orchestrator
- `CacheManager` coordinates memory → SQLite → Redis tiers
- `make_key()` generates SHA-256 hash from file content + filename
- Reads flow: memory → SQLite → Redis (with backfill to upper tiers)
- Writes flow: all available tiers simultaneously
- `stats()` returns stats from all tiers
- Shared instance via `get_cache_manager()` in admin routes

#### 4. Integration

**Orchestrator enhanced:**
- `extract()` now accepts `analyze=True` parameter
- When enabled, enriches results with `AnalysisInfo` (document type, entities)
- `_enrich_with_analysis()` runs ML classifier + entity extractor on full text

**Sync routes enhanced:**
- Both `/parse-document` and `/parse-document/raw` now check cache before extraction
- Results stored in cache after successful extraction
- `cached: true` flag set on cache hits

**Admin routes enhanced:**
- `GET /api/v1/ocr-status` — shows which OCR engines are available
- `GET /api/v1/cache/stats` — returns cache statistics from all tiers
- `DELETE /api/v1/cache` — clears all cache tiers

**Document schema enhanced:**
- Added `AnalysisInfo` model with document type, confidence, and entity lists
- `ExtractionResult` now includes optional `analysis` field
- `ExtractionResult` now includes `cached` boolean field

#### 5. Tests

- `test_ocr.py` — 9 tests (availability checks, smart selector, engine status)
- `test_analysis.py` — 27 tests (table detector, layout, text flow, classifier, entity extractor)
- `test_caching.py` — 25 tests (memory cache, SQLite cache, cache strategies, cache manager)

**Total: 115 Python tests, all passing**

---

### Files Created in Phase 3

| File | Purpose |
|------|---------|
| `python/ocr/__init__.py` | OCR package init |
| `python/ocr/tesseract_engine.py` | Tesseract OCR engine |
| `python/ocr/easyocr_engine.py` | EasyOCR deep learning engine |
| `python/ocr/paddleocr_engine.py` | PaddleOCR fast parallel engine |
| `python/ocr/smart_ocr_selector.py` | Intelligent OCR engine selection |
| `python/analysis/__init__.py` | Analysis package init |
| `python/analysis/table_detector.py` | Table region detection |
| `python/analysis/layout_analyzer.py` | Column/header/footer detection |
| `python/analysis/text_flow_analyzer.py` | Reading order detection |
| `python/analysis/ml_classifier.py` | Document type classification |
| `python/analysis/entity_extractor.py` | Named entity extraction |
| `python/caching/__init__.py` | Caching package init |
| `python/caching/memory_cache.py` | LRU in-memory cache |
| `python/caching/sqlite_cache.py` | SQLite persistent cache |
| `python/caching/redis_cache.py` | Redis distributed cache |
| `python/caching/cache_strategies.py` | Eviction policies |
| `python/caching/cache_manager.py` | Multi-tier cache orchestrator |
| `python/tests/test_ocr.py` | OCR layer tests (9) |
| `python/tests/test_analysis.py` | Analysis layer tests (27) |
| `python/tests/test_caching.py` | Caching layer tests (25) |

### Files Modified in Phase 3

| File | Changes |
|------|---------|
| `python/api/schemas/document.py` | Added `AnalysisInfo` model, `analysis` and `cached` fields on `ExtractionResult` |
| `python/services/orchestrator.py` | Added `analyze` parameter, `_enrich_with_analysis()` function |
| `python/api/routes/sync_routes.py` | Integrated cache check/store on both parse endpoints |
| `python/api/routes/admin_routes.py` | Added OCR status, cache stats, cache clear endpoints |

---

### Test Results

**Python:** 115 passed in 3.05s
**Node.js:** 14 passed (existing app unaffected)

---

## Phase 4: Planned Next Steps

1. **Rust Performance Layer**
   - SIMD text processing, parallel layout detection, high-speed table parsing
   - PyO3 Python bindings for seamless Python integration

2. **Go Gateway**
   - High-performance HTTP gateway with gRPC to Python backend
   - Circuit breaker, worker pool, Prometheus metrics collection

3. **Frontend**
   - React-based UI with drag-drop upload, syntax-highlighted JSON viewer
   - Real-time metrics panel, cache status dashboard, batch processor UI

4. **Infrastructure**
   - Docker Compose for full stack orchestration
   - Kubernetes manifests with HPA autoscaling
   - Prometheus/Grafana/Jaeger/Loki monitoring stack

5. **ML Model Training**
   - Train invoice/resume classifiers on larger datasets
   - Train YOLO table detector on PDF page images

6. **OCR Integration with Orchestrator**
   - When OCR engines become available, integrate with PyMuPDF for scanned PDF handling
   - Render pages as images and run OCR when no text layer is detected

---

> **STOP**: Awaiting user confirmation before proceeding to Phase 4.
