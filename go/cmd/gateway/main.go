package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"pdf-json-parser2-premium/pkg/metrics"
	queuepkg "pdf-json-parser2-premium/pkg/queue"
)

type jobRequest struct {
	ID      string `json:"id"`
	Payload string `json:"payload"`
}

type jobResponse struct {
	Accepted bool   `json:"accepted"`
	JobID    string `json:"job_id"`
	QueueLen int    `json:"queue_len"`
}

var (
	jobs = queuepkg.NewQueue()
	m    = metrics.NewMetrics()
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "text/plain") || strings.Contains(accept, "application/openmetrics-text") {
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		_, _ = w.Write([]byte(m.PrometheusText()))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status": "ok",
		"queue_length": jobs.Len(),
		"metrics":      m.Snapshot(),
	})
}

func submitHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req jobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("job-%d", time.Now().UnixNano())
	}

	m.RecordRequest()
	m.RecordQueued()
	jobs.Enqueue(req.ID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(jobResponse{
		Accepted: true,
		JobID:    req.ID,
		QueueLen: jobs.Len(),
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", healthHandler)
	mux.HandleFunc("/metrics", metricsHandler)
	mux.HandleFunc("/submit", submitHandler)

	log.Println("gateway listening on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
