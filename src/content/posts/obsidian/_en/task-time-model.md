---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00+08:00
title: "Time in Task Systems: Instants, Local Time, and All-Day Tasks"
draft: false
featured: false
tags: [time, domain-modeling, backend, design-notes]
hideEditPost: true
timezone: Asia/Shanghai
description: Distinguish instants, local clock time, and all-day dates when designing task storage, time-zone handling, calendar queries, and reminders.
---

A task's time may look like a date picker, but it can mean several different things. "The meeting starts at 9 a.m. Beijing time," "run at 7 a.m. wherever I am," and "organize notes on Saturday" cannot all use the same conversion rule.

This design note brings together time fundamentals and a proposed task-system model. It discusses modeling choices and verification conditions. The examples are not a task system that has been implemented or validated in production.

## Ask what should remain unchanged

Three questions help identify the meaning: should the task shift when the user travels to another time zone? Does it represent a specific instant or a recurring clock time? Did the user specify a time of day at all?

| User input                                            | Meaning to preserve       | Information the model needs                              |
| ----------------------------------------------------- | ------------------------- | -------------------------------------------------------- |
| Meet at 9 a.m. Beijing time on October 10             | The same instant          | An instant, and the original time zone if needed         |
| Run at 7 a.m. local time every day, wherever I travel | 7 a.m. on the local clock | Local time, recurrence, and a time-zone-following policy |
| Organize notes all day on October 10                  | A calendar date           | A date or date range                                     |

These categories are first a product agreement. Database fields should express that agreement; their names alone should not decide what the user's input means.

## Instants support consistent comparison

A meeting happens once. `2026-10-10T09:00:00+08:00` and `2026-10-10T01:00:00Z` represent the same instant. After the user travels abroad, the displayed hour changes, but the meeting has not been rescheduled.

Normalize this kind of value to a UTC instant. The API should explicitly accept strings with an offset or timestamps with a declared unit. One side must not interpret the same number as seconds while the other uses milliseconds.

PostgreSQL's `timestamp with time zone`, or `timestamptz`, converts input to UTC for storage and displays it using the session time zone. It **does not preserve the original time-zone name**. If editing must always use the meeting organizer's zone, store that identifier separately. The [PostgreSQL date/time documentation](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-INPUT-TIMESTAMPS) explains this distinction.

UTC gives instants a common representation. It does not answer the product question of whether a task should move when the user travels.

## Local time needs a policy for whose zone it follows

"7 a.m. local time every day" preserves a clock time. Seven in Beijing and seven in another city can correspond to different UTC instants.

A sketch of the model might be:

```json
{
  "kind": "local-time",
  "localTime": "07:00:00",
  "repeat": "daily",
  "timezoneMode": "follow-user"
}
```

`follow-user` is still not a complete rule. Does it use the user's manually selected zone or the device's detected zone? If devices disagree, who generates the reminder? When the user changes zones, how is the next reminder recalculated? Settle those questions before scheduling.

"Meet at 9 a.m. New York time every weekday" is a different requirement. It is tied to a region's clock, rather than a participant's location. Retain the regional time-zone identifier and recurrence rule, then resolve each occurrence to an instant. [RFC 5545's date-time definition](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.3.5) distinguishes floating time, UTC time, and local time with a time-zone reference.

A fixed offset describes a particular conversion; a regional zone also supplies rules that vary with the date. For long-running recurrence, keep the regional identifier and decide how to handle local times that do not exist or occur twice. Do not simply add 24 hours to the previous instant.

## Model all-day tasks as dates first

"Organize notes on October 10" specifies no instant. Storing it as midnight in one zone and applying ordinary time-zone conversion can display it as the previous day elsewhere. The conversion is mathematically correct, but the model added meaning the user did not choose.

For tasks arranged by calendar day, use a date range:

```json
{
  "kind": "all-day",
  "startDate": "2026-10-10",
  "endDateExclusive": "2026-10-11"
}
```

This includes October 10 and excludes the end date. Multi-day tasks can use the same rule without inventing a "last instant" such as `23:59:59.999`. iCalendar all-day events use date values and an exclusive end boundary. It is a useful reference, not a requirement to implement all of iCalendar. See [RFC 5545's event definition](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.6.1).

A date carries no time zone, but "notify me when the all-day task starts" still needs one. Make reminder interpretation a separate policy, based on the task's regional zone or the user's selected zone. Whether travel preserves the date label or the task is bound to a particular region's business day is also a business decision.

## Today and this month define calendar windows

To query a user's timed tasks for today, find the start of that day and the next day in the user's zone, then convert both boundaries to UTC. Do not use the server's calendar date or assume every local day lasts exactly 24 hours. Daylight-saving changes can alter its elapsed duration. [PostgreSQL's interval documentation](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-INTERVAL-INPUT) also explains the difference between calendar days and fixed hours.

For tasks whose start instant falls within a window, use a half-open interval:

```sql
WHERE starts_at >= :window_start
  AND starts_at < :window_end
```

A month view may need a different meaning: an event started last month but has not yet ended. To find ongoing events that overlap the window, use:

```sql
WHERE starts_at < :window_end
  AND ends_at > :window_start
```

These conditions answer different questions. They sketch nonzero-duration events and omit access scope, null handling, and cancellation constraints. Instantaneous tasks, all-day dates, and recurrence each need their own query rules.

## Organize APIs and tests around meaning

If the API supplies only `startTime`, `endTime`, and `isAllDay`, callers may still have to guess: what does a string without an offset mean? Is the all-day end date included? Does changing the user's zone alter the task?

Use `kind` to distinguish inputs, with required fields for each kind. An instant input must identify one instant. A local-time input needs an interpretation rule. An all-day input needs clear date boundaries. Handle invalid dates, unknown zones, and ambiguous times at the boundary instead of silently turning them into another valid task.

At minimum, verify:

1. Changing the display zone of an instant does not change its stored value or reminder instant.
2. Local-time tasks recalculate reminders according to the declared policy when the zone changes.
3. All-day tasks retain their agreed calendar dates across zones.
4. Repeated or missing times near daylight-saving transitions follow the chosen policy.
5. Events spanning months appear in the right calendar windows, without duplicate boundary classification.
6. Invalid zones and timestamp-unit errors produce understandable errors.

These are verification targets; no corresponding implementation was run for this article. Start implementation by deciding what meaning the user wants to preserve, then choose storage, queries, and reminders for each kind.
