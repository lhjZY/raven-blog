---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00+08:00
title: "Why Go Concurrency Results Vary: Shared Counters and Race Detection"
draft: false
featured: false
tags: [go, concurrency]
hideEditPost: true
timezone: Asia/Shanghai
description: Letter counting and balance updates illustrate shared-data races in Go, the difference between WaitGroup and Mutex, and race detection.
---

<!-- Source: Go concurrency learning notes. Check the original tutorial attribution and verify race reports for the unsafe and synchronized versions locally. Unverifiable numeric outputs from the original notes are not repeated. -->

Adding `go` before a function call runs it in a new goroutine. But when several goroutines modify the same data, concurrency can also make the result unreliable.

The original notes illustrate this with letter-frequency counting and balance updates. Both settings are retained here to focus on shared reads and writes, rather than comparing unverified execution speeds or outputs.

## Start with a shared letter counter

The counting example reads RFC text and counts English letters. Several tasks receive the same `frequency` slice. Its core loop is shown below, with `body` representing text that has already been read successfully:

```go
const allLetters = "abcdefghijklmnopqrstuvwxyz"

for _, b := range body {
	c := strings.ToLower(string(b))
	cIndex := strings.Index(allLetters, c)
	if cIndex >= 0 {
		frequency[cIndex] += 1
	}
}
```

Passing a slice does not copy its backing array. Tasks updating the count for the same letter therefore access the same data. `frequency[cIndex] += 1` is not inherently indivisible: it reads the old value, calculates a new value, and writes it back.

If two tasks both read 10 and then each writes 11, only one of the two increments survives. This illustrates lost updates without synchronization. A real program with a data race has no dependable result guarantee; one observed output cannot establish how much it will always undercount.

The original download example also waits with `time.Sleep`. Waiting a fixed number of seconds does not guarantee completion, and the program exits when `main` returns. Downloading requires handling request failures, response status, timeouts, and body-read errors rather than ignoring errors and using the response anyway. These factors complicate counter comparisons, so the balance example below avoids network dependencies.

## Two goroutines change one balance

The balance starts at 100. One task repeatedly adds 10, while another subtracts 10 the same number of times. If every update is preserved, the final value should be 100.

The following is an **intentionally racy counterexample**, not business logic:

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	money := 100
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		for i := 0; i < 1000000; i++ {
			money += 10
			runtime.Gosched()
		}
	}()

	go func() {
		defer wg.Done()
		for i := 0; i < 1000000; i++ {
			money -= 10
			runtime.Gosched()
		}
	}()

	wg.Wait()
	fmt.Println("Money:", money)
}
```

This replaces the notes' fixed `Sleep` with `WaitGroup`, ensuring both tasks have finished before the final read. `runtime.Gosched` yields the processor from the current goroutine, but it does not make balance updates safe.

`WaitGroup` handles completion, not mutual exclusion between `money += 10` and `money -= 10`. The two tasks can still overwrite each other's shared reads and writes.

Concurrent access without appropriate synchronization is a data race; see Go's [Data Race Detector documentation](https://go.dev/doc/articles/race_detector). Even if one run happens to print 100, that does not establish correctness.

## Locate conflicting accesses with race detection

Save the counterexample as `race.go` and run it in a Go environment that supports race detection:

```sh
go run -race race.go
```

When the detector finds a conflict, it reports the read and write locations and the related goroutine stacks. It can detect only races on paths actually exercised in that run. A run without a report is not proof that every path has been covered. This article records no report from an actual execution.

## Protect the whole read-modify-write operation with a mutex

Keep the same additions and subtractions, but use `sync.Mutex` to protect each complete update:

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	money := 100
	var mu sync.Mutex
	var wg sync.WaitGroup

	change := func(delta int) {
		defer wg.Done()
		for i := 0; i < 1000000; i++ {
			mu.Lock()
			money += delta
			mu.Unlock()
		}
	}

	wg.Add(2)
	go change(10)
	go change(-10)
	wg.Wait()
	fmt.Println("Money:", money)
}
```

Both tasks use the same lock, covering the entire read-modify-write operation. The final read occurs after `wg.Wait()` returns, when both tasks have finished. Under this synchronization, the expected final value is 100. That is a predicted result, not measured output recorded here.

`WaitGroup` waits for tasks to finish; `Mutex` protects shared data. Their synchronization contracts are documented in the [Go sync package](https://pkg.go.dev/sync). Letter counting follows the same principle: concurrent changes to one counter need a consistent synchronization strategy, not a longer sleep.
