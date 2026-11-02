package main

import (
	"fmt"
	"log"
	"time"

	queuepkg "pdf-json-parser2-premium/pkg/queue"
)

func worker(id int, jobs *queuepkg.Queue) {
	for {
		job := jobs.Dequeue()
		if job == "" {
			time.Sleep(100 * time.Millisecond)
			continue
		}
		log.Printf("worker %d processed %s", id, job)
	}
}

func main() {
	jobs := queuepkg.NewQueue()
	for i := 1; i <= 4; i++ {
		go worker(i, jobs)
	}

	for i := 1; i <= 8; i++ {
		jobs.Enqueue(fmt.Sprintf("job-%d", i))
	}

	select {}
}
