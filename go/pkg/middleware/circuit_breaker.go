package middleware

import (
	"sync"
	"time"
)

type CircuitState string

const (
	Closed   CircuitState = "closed"
	Open     CircuitState = "open"
	HalfOpen CircuitState = "half_open"
)

type CircuitBreaker struct {
	mu            sync.Mutex
	state         CircuitState
	failureCount  int
	threshold     int
	cooldown      time.Duration
	openedAt      time.Time
	lastFailureAt time.Time
}

func NewCircuitBreaker(threshold int, cooldown time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:     Closed,
		threshold: threshold,
		cooldown:  cooldown,
	}
}

func (c *CircuitBreaker) Allow() bool {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.state == Open {
		if time.Since(c.openedAt) >= c.cooldown {
			c.state = HalfOpen
			return true
		}
		return false
	}

	return true
}

func (c *CircuitBreaker) RecordSuccess() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.failureCount = 0
	c.state = Closed
}

func (c *CircuitBreaker) RecordFailure() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.failureCount++
	c.lastFailureAt = time.Now().UTC()
	if c.failureCount >= c.threshold {
		c.state = Open
		c.openedAt = time.Now().UTC()
	}
}

func (c *CircuitBreaker) State() CircuitState {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.state
}
