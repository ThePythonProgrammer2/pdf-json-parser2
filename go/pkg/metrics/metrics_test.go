package metrics

import "testing"

func TestMetricsSnapshotAndPrometheusOutput(t *testing.T) {
	m := NewMetrics()
	m.RecordRequest()
	m.RecordQueued()
	m.RecordProcessed()

	snap := m.Snapshot()
	if snap.Requests != 1 || snap.Queued != 1 || snap.Processed != 1 {
		t.Fatalf("unexpected snapshot: %+v", snap)
	}

	text := m.PrometheusText()
	if len(text) == 0 {
		t.Fatalf("expected prometheus text output, got empty string")
	}
	if !contains(text, "pdf_parser_requests_total 1") {
		t.Fatalf("expected request total in prometheus output, got %q", text)
	}
}

func contains(s, needle string) bool {
	return len(needle) == 0 || (len(s) >= len(needle) && (func() bool {
		for i := 0; i <= len(s)-len(needle); i++ {
			if s[i:i+len(needle)] == needle {
				return true
			}
		}
		return false
	})())
}
