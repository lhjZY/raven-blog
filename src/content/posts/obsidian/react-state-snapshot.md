---
author: Raven
lang: zh
pubDatetime: 2026-10-10T00:00:00.000+08:00
title: 连续调用三次 setState，为什么只加了一次？
draft: false
featured: false
tags:
  - react
  - javascript
hideEditPost: true
timezone: Asia/Shanghai
description: 用计数器说明 React state 的渲染快照、更新队列与批处理，以及函数式更新为什么能连续累加。
---

<!-- 原笔记：framework/React/React 交互.md。发布前在实际 React 环境验证两种计数器的交互；本文未记录运行结果。 -->

在一个点击事件里连续调用三次 `setNumber(number + 1)`，计数器为什么只增加了 1？要解释这个现象，需要同时看清当前渲染的 state 值，以及 React 如何处理更新队列。

## 先看一个计数器

`useState` 为组件提供保存状态的变量，以及请求更新状态的 setter。下面的例子从 0 开始，按钮名是“+3”，处理函数也确实调用了三次 setter：

```jsx
import { useState } from "react";

export default function Counter() {
  const [number, setNumber] = useState(0);

  return (
    <>
      <h1>{number}</h1>
      <button
        onClick={() => {
          setNumber(number + 1);
          setNumber(number + 1);
          setNumber(number + 1);
        }}
      >
        +3
      </button>
    </>
  );
}
```

按照 React 的更新规则，第一次点击后的值是 1。原因是这三行都读取了同一次渲染中的 `number`。

## 每次渲染都有自己的 state 快照

React 渲染函数组件时，会调用组件函数。组件返回的 JSX、事件处理函数和局部变量，都对应这次渲染的 state。

第一次渲染中，`number` 是 0。调用 `setNumber` 会请求后续更新，却不会把正在执行的事件处理函数里的 `number` 改成新值。因此，这三行可以理解成：

```js
setNumber(0 + 1);
setNumber(0 + 1);
setNumber(0 + 1);
```

它们分别要求将状态设为 1，没有任何一行读取到前一行提交的新值。下一次渲染拿到的才是新的 state；下一次点击时，事件处理函数对应的 `number` 就是 1。

这种“快照”含义见 [React 官方说明](https://react.dev/learn/state-as-a-snapshot)。

## 要连续累加，就传入更新函数

如果下一次状态依赖上一次状态，原笔记中的函数式写法更合适。将按钮的处理函数替换为：

```jsx
onClick={() => {
  setNumber(n => n + 1);
  setNumber(n => n + 1);
  setNumber(n => n + 1);
}}
```

这里传给 setter 的是更新函数。React 处理队列时，将前一个更新的结果作为下一个更新的输入。初始值为 0 时，计算过程是：

| 队列中的更新        | 输入值 | 返回值 |
| ------------------- | ------ | ------ |
| 第一次 `n => n + 1` | 0      | 1      |
| 第二次 `n => n + 1` | 1      | 2      |
| 第三次 `n => n + 1` | 2      | 3      |

最终状态因此是 3。更新函数应只计算并返回新值，不要在里面发送请求或执行其他副作用。这些更新队列的行为见 [React 官方教程](https://react.dev/learn/queueing-a-series-of-state-updates)。

## “只加一次”和批处理是两个问题

在上面的事件处理中，React 会批量处理状态更新，通常在事件处理代码执行完之后再更新界面。这减少了中间状态带来的重复界面更新。

但批处理不意味着只执行一个更新。函数式写法里的三个更新仍会按顺序计算，最后得到 3。普通写法只得到 1，是因为它向队列提交了三次相同的目标值。

所以不能把现象概括成“连续调用 setter 只会更新一次”。更准确的说法是：当前事件处理函数读取同一份 state 快照，而 setter 可以接收一个目标值，也可以接收基于前一个状态计算的更新函数。

本文计数器根据原学习笔记整理，示例思路来自 React 官方教程，不代表一次个人项目故障复盘。
