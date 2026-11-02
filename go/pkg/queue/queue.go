package queue

import "sync"

type Queue struct {
	mu    sync.Mutex
	items []string
}

func NewQueue() *Queue {
	return &Queue{items: make([]string, 0)}
}

func (q *Queue) Enqueue(item string) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.items = append(q.items, item)
}

func (q *Queue) Dequeue() string {
	q.mu.Lock()
	defer q.mu.Unlock()
	if len(q.items) == 0 {
		return ""
	}

	item := q.items[0]
	q.items = q.items[1:]
	return item
}

func (q *Queue) Len() int {
	q.mu.Lock()
	defer q.mu.Unlock()
	return len(q.items)
}
