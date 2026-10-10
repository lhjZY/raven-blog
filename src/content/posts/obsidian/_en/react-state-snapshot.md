---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00+08:00
title: Why Do Three Consecutive setState Calls Only Increment Once?
draft: false
featured: false
tags: [react, javascript]
hideEditPost: true
timezone: Asia/Shanghai
description: A counter example explains React state snapshots, update queues, batching, and why functional updates can accumulate three increments.
---

<!-- Source: React interaction learning notes. Verify both counter interactions in a real React environment before treating them as measured results; no execution results are recorded here. -->

Why does calling `setNumber(number + 1)` three times in one click handler increase a counter by only 1? The explanation requires both the state value from the current render and React's handling of the update queue.

## Start with a counter

`useState` provides a state variable and a setter that requests an update. The following example starts at 0. The button says "+3," and the handler really does call the setter three times:

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

Under React's update rules, the value after the first click is 1. All three lines read `number` from the same render.

## Each render has its own state snapshot

When React renders a function component, it calls the component function. The returned JSX, event handlers, and local variables correspond to that render's state.

During the first render, `number` is 0. Calling `setNumber` requests a later update; it does not change `number` inside the event handler that is currently executing. Think of the three lines as:

```js
setNumber(0 + 1);
setNumber(0 + 1);
setNumber(0 + 1);
```

Each asks React to set the state to 1. None reads a new state value submitted by the preceding line. The next render receives the new state; on the next click, the corresponding handler has `number` equal to 1.

See React's official explanation of [state as a snapshot](https://react.dev/learn/state-as-a-snapshot).

## Pass updater functions to accumulate increments

When the next state depends on the previous state, the functional form from the learning notes is more appropriate. Replace the button's handler with:

```jsx
onClick={() => {
  setNumber(n => n + 1);
  setNumber(n => n + 1);
  setNumber(n => n + 1);
}}
```

Now the setter receives updater functions. When React processes the queue, it passes each update's result into the next. Starting from 0, the calculation is:

| Queued updater      | Input | Return value |
| ------------------- | ----- | ------------ |
| First `n => n + 1`  | 0     | 1            |
| Second `n => n + 1` | 1     | 2            |
| Third `n => n + 1`  | 2     | 3            |

The final state is 3. Updater functions should only calculate and return a value; do not send requests or perform other side effects inside them. React's [update-queue tutorial](https://react.dev/learn/queueing-a-series-of-state-updates) describes this behavior.

## Incrementing once and batching are different questions

In this event handler, React batches state updates, normally updating the UI after the handler's code has finished. This avoids unnecessary UI updates for intermediate states.

Batching does not mean that React processes only one updater. All three functional updates are still calculated in sequence, producing 3. The ordinary value form produces 1 because it submits the same target value three times.

So "consecutive setter calls only update once" is misleading. More precisely, the current event handler reads one state snapshot, while a setter can receive either a target value or a function that calculates a new value from the preceding state.

This counter is adapted from learning notes whose example comes from React's official tutorial. It is not a retrospective about a failure in a personal project.
