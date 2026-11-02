package queue

import "testing"

func TestQueueRoundTrip(t *testing.T) {
	q := NewQueue()
	q.Enqueue("job-1")
	q.Enqueue("job-2")

	if got := q.Dequeue(); got != "job-1" {
		t.Fatalf("expected first job to be job-1, got %q", got)
	}

	if got := q.Dequeue(); got != "job-2" {
		t.Fatalf("expected second job to be job-2, got %q", got)
	}

	if q.Len() != 0 {
		t.Fatalf("expected queue to be empty after draining, got length %d", q.Len())
	}
}
