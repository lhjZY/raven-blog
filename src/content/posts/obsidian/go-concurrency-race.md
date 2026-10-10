---
author: Raven
lang: zh
pubDatetime: 2026-10-10T00:00:00+08:00
title: Go 并发结果为什么每次不同：从共享计数到竞态检测
draft: false
featured: false
tags:
  - go
  - concurrency
hideEditPost: true
timezone: Asia/Shanghai
description: 从字母计数与余额增减两个例子说明 Go 的共享数据竞争，区分 WaitGroup 等待与 Mutex 互斥，并介绍 race 检测。
---

<!-- 原笔记：programLanguage/GO/7、并发.md。发布前核对原教程出处，在本地验证反例与互斥版本的 race 报告；未沿用原文无法复核的计数结果。 -->

给一个函数调用加上 `go`，就能让它在新的 goroutine 中执行。但如果多个 goroutine 同时修改一份数据，并发执行也可能让结果失去可靠性。

原笔记用字母频率统计和余额增减说明这个问题。这里保留两种情境，重点看共享数据的读写，而不比较未经验证的运行速度或具体输出。

## 从共享字母计数开始

字母计数例子读取 RFC 文本，对每个英文字母累计次数。多个任务接收同一个 `frequency` 切片，核心逻辑如下；`body` 表示已经读取成功的文本：

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

切片传参不会复制底层数组。多个任务修改同一个字母的计数时，就会访问同一处数据。`frequency[cIndex] += 1` 也不能理解为一个天然不可分割的操作：它需要读出旧值、计算新值，再写回。

例如两个任务都读到 10，分别加一后又都写回 11，两个增量就只留下了一个。这解释了共享计数缺少同步时可能出现的丢失更新。实际带有数据竞争的程序没有可靠的结果保证，不能根据某一次输出推导它始终会少多少。

原下载例子还使用 `time.Sleep` 等待任务完成。固定等待几秒不能保证所有任务已经完成；而 `main` 返回时，程序会结束。下载场景也必须处理请求失败、响应状态、超时和正文读取错误，不能直接忽略错误后读取响应。这些因素会干扰计数比较，因此下面用不依赖网络的余额例子观察共享读写。

## 两个 goroutine 修改同一份余额

初始余额为 100。一个任务重复加 10，另一个任务重复减 10，次数相同。若所有修改都被正确保留，最终值应为 100。

下面是**故意保留数据竞争的反例**，不要用于业务逻辑：

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

这里把原笔记中的固定 `Sleep` 换成了 `WaitGroup`，以确保最后读取余额前，两个任务都已经结束。`runtime.Gosched` 让当前 goroutine 主动让出处理器，但它不会让余额操作变得安全。

`WaitGroup` 解决的是等待完成，不能让两个任务中的 `money += 10` 和 `money -= 10` 互斥。两者仍然可能在读写共享余额时互相覆盖。

这种没有适当同步的并发访问属于数据竞争，Go 官方文档说明见 [Data Race Detector](https://go.dev/doc/articles/race_detector)。即使某次碰巧打印出 100，也不能据此认定程序正确。

## 用 race 检测定位冲突

将反例保存为 `race.go`，可在支持 race 检测的 Go 环境中执行：

```sh
go run -race race.go
```

检测器发现冲突时，会报告发生读写的代码位置和相关 goroutine 的调用栈。它只能发现本次运行实际经过的代码路径中的竞争；一次没有报告，不等于覆盖了所有情况。这里没有记录实际执行所得的报告。

## 用互斥锁保护读、改、写

保留同样的余额增减逻辑，可以用 `sync.Mutex` 保护整个修改过程：

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

两个任务使用同一把锁，锁覆盖了余额的整个读改写过程。最后的读取发生在 `wg.Wait()` 返回之后，此时两个任务都已结束。按照这段同步逻辑，最终值应为 100；这是预期结果，不是本文记录的实测输出。

`WaitGroup` 与 `Mutex` 的作用分别是等待任务结束、保护共享数据。它们的具体同步约定见 [Go sync 包文档](https://pkg.go.dev/sync)。字母计数也遵循同一个原则：凡是并发修改同一份计数，都需要统一的同步策略，不能只延长等待时间。
