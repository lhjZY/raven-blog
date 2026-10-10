---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00+08:00
title: Why Do PostgreSQL Auto-Generated IDs Conflict After a Data Import?
draft: false
featured: false
tags: [postgresql, sql]
hideEditPost: true
timezone: Asia/Shanghai
description: Explain sequence drift after importing explicit IDs, compare ALTER SEQUENCE RESTART with setval, and cover empty tables, concurrency, and rollback.
---

<!-- Source: SQL troubleshooting notes. Reproduce the import, duplicate-key failure, and repair in a test database before treating them as verified results. The original staff example is retained; no database changes were executed. -->

After importing records with explicit IDs, later inserts can fail with a duplicate primary key even when they do not specify an ID. Establish whether the conflict concerns the auto-generated column and whether its sequence is still at a position from before the import.

## The largest ID and the sequence are separate states

A PostgreSQL `serial` column uses an associated sequence to generate default values. Inserting an explicit ID does not call the sequence or automatically move it to that ID.

The table's largest ID might therefore be 100 while the next sequence value still falls within existing data. A duplicate-key conflict occurs only when the generated value already exists. Imports do not necessarily cause this problem: a restore process that includes the proper sequence state may have synchronized it already.

The example keeps the notes' `staff` table, assuming it is in the `public` schema, contains records, and its `id` uses an ascending sequence with an increment of 1. Before changing it, confirm that the failing constraint is on `id` and pause related writes and sequence calls.

## Identify the table state and actual sequence

Find the largest existing ID:

```sql
SELECT MAX(id) FROM public.staff;
```

Do not guess the sequence name from naming conventions. Ask for the sequence actually associated with the column:

```sql
SELECT pg_get_serial_sequence('public.staff', 'id');
```

This function supports identity columns too. If it returns `NULL`, inspect the column's default and sequence association before applying a reset. See PostgreSQL's [system information functions](https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-CATALOG-TABLE).

If the sequence is `public.staff_id_seq`, inspect its state:

```sql
SELECT last_value, is_called FROM public.staff_id_seq;
```

Use `MAX(id)` and `is_called` together to determine whether it is behind. If it is already ahead, do not move it backward just to match the table's largest ID. Sequence caching and calls from other sessions affect the investigation; handle this in a maintenance setting without concurrent sequence calls.

## Option one: specify the next value

If the largest ID is confirmed to be 100 and the sequence is behind, make the next call start at 101:

```sql
ALTER SEQUENCE public.staff_id_seq RESTART WITH 101;
```

This sets the value returned by the next call. `RESTART WITH` differs from `START WITH`, which changes the starting configuration. `RESTART` is transactional and blocks concurrent calls on the same sequence. See the official [ALTER SEQUENCE documentation](https://www.postgresql.org/docs/current/sql-altersequence.html).

## Option two: set the current value to the largest ID

The notes also use `setval`:

```sql
SELECT setval(
  'public.staff_id_seq',
  (SELECT MAX(id) FROM public.staff),
  true
);
```

The third argument, `true`, means the value has already been used. With an increment of 1, setting it to 100 causes the next `nextval` to advance and return 101.

Omitting the third argument has the same effect as passing `true`. The following is therefore equivalent, not a different repair:

```sql
SELECT setval('public.staff_id_seq', (SELECT MAX(id) FROM public.staff));
```

With a third argument of `false`, the next call returns the supplied value itself. For example, the next value after `setval('public.staff_id_seq', 101, false)` is also 101. See the official [sequence functions documentation](https://www.postgresql.org/docs/current/functions-sequence.html).

Choose one of these approaches; there is no need to execute both in succession.

## Execution boundaries and verification

The `MAX(id)` examples assume a nonempty table. An empty table returns `NULL`; handle it separately using the sequence's actual starting value instead of assuming it always starts at 1.

Reading a maximum and resetting a sequence is not automatically safe against concurrent writes. Other sessions inserting rows or using cached numbers can invalidate the observed state. This SQL is not a universal script to run at any time while writes continue.

Rollback behavior also differs. A `setval` change is immediately visible to other transactions and is not undone by transaction rollback, unlike `ALTER SEQUENCE ... RESTART`. Gaps are normal: sequences do not guarantee a gapless series of numbers.

After an adjustment, use a normal insert that omits `id` in a test environment to verify that the generated value avoids existing records. Then recheck the application's originally failing insert path. None of those operations was executed for this article, and the original troubleshooting snippets are not presented as a verified repair.
