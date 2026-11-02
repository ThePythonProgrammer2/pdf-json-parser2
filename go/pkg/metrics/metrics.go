package metrics

import (
	"fmt"
	"sync"
	"time"
)

type Snapshot struct {
	Requests  int64 `json:"requests"`
	Queued    int64 `json:"queued"`
	Processed int64 `json:"processed"`
	StartedAt string `json:"started_at"`
}

type Metrics struct {
	mu        sync.RWMutex
	requests  int64
	queued    int64
	processed int64
	startedAt time.Time
}

func NewMetrics() *Metrics {
	return &Metrics{startedAt: time.Now().UTC()}
}

func (m *Metrics) RecordRequest() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.requests++
}

func (m *Metrics) RecordQueued() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.queued++
}

func (m *Metrics) RecordProcessed() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.processed++
}

func (m *Metrics) Snapshot() Snapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return Snapshot{
		Requests:  m.requests,
		Queued:    m.queued,
		Processed: m.processed,
		StartedAt: m.startedAt.Format(time.RFC3339),
	}
}

func (m *Metrics) PrometheusText() string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return fmt.Sprintf(
		"# HELP pdf_parser_requests_total Total number of accepted requests.\n# TYPE pdf_parser_requests_total counter\npdf_parser_requests_total %d\n# HELP pdf_parser_queue_depth Current queue depth.\n# TYPE pdf_parser_queue_depth gauge\npdf_parser_queue_depth %d\n# HELP pdf_parser_processed_total Total processed jobs.\n# TYPE pdf_parser_processed_total counter\npdf_parser_processed_total %d\n",
		m.requests,
		m.queued,
		m.processed,
	)
}
