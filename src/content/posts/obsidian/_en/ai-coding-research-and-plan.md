---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00+08:00
title: Before Asking AI to Code, Finish the Research and Plan
draft: false
featured: false
tags: [ai, development-workflow, planning, code-review]
hideEditPost: true
timezone: Asia/Shanghai
description: A workflow for AI-assisted development that separates research, planning, document annotations, implementation, and verification while preserving your own understanding.
---

<!-- Editorial note: Reorganized and rewritten from the AI workflow and coding principles notes. The source notes may contain third-party excerpts or translations; original authors, links, and attribution still need checking. Do not present this as unqualified original personal experience. -->

AI generates code quickly enough to take a development task from a single sentence straight to a large diff. The difficult part is often not syntax. It is whether the AI found the right module, understood the existing constraints, and changed the intended behavior.

This article outlines a collaboration method that separates research, planning, and implementation. It is a synthesis of workflow notes, not an efficiency benchmark. First-person accounts in those notes are not treated as verified personal experience.

## Leave evidence that can be checked during research

Asking AI to "understand the entire project" is too broad. Research should follow the current problem: which entry points trigger the behavior, how data flows, where permissions are checked, who handles failures, and what existing tests actually establish.

Consider a fictional task: adding cursor pagination to a list. Research needs to cover API parameters, ordering rules, database queries, client pagination state, and callers. Reading only the list component cannot establish whether records with identical sort values will repeat or whether other callers still depend on page numbers.

You can keep the findings in `research.md`, putting evidence beside each conclusion:

```text
Question: Where does the current list calculate the next page?
Confirmed: The API returns a page number; the client appends results;
           the server determines ordering.
Evidence: Relevant files, call relationships, tests, and observations.
Unconfirmed: Whether concurrent inserts can cause records to be missed.
```

The filename is only an example. What matters is separating observed facts, inferences that need testing, and missing information. "I did not see retry code" and "the system does not retry" are different conclusions. A consumer, gateway, or SDK may handle retries elsewhere.

A research document does not become more useful simply by getting longer. A relevant call chain, data shapes, and unresolved questions help more than a file-by-file retelling. For a small change, record these directly in the task instead of mechanically adding another document.

## Turn the requirement into a bounded change

Research explains how the system works now. The plan explains how this task should change it.

A reviewable plan connects the goal, change scope, and verification. For cursor pagination, it should identify the sort fields that make up the cursor, API changes, clients that need updating, treatment of old parameters, and checks for duplicates and omissions.

One useful order is:

1. Describe the desired behavior with a concrete input and output.
2. List the entry points, data handling, callers, and tests that must change.
3. Explain the important tradeoffs and why the existing implementation cannot directly meet the requirement.
4. Identify compatibility, authorization, failure, and rollback constraints.
5. Give each behavior a check that distinguishes a correct result from an incorrect one.

Small code snippets can make a discussion more concrete, but a plan does not need a complete implementation in advance. The more code it contains, the easier it becomes to confuse "a lot has been generated" with "the design is settled." Do not add a whole-module cleanup, dependency upgrade, or future feature unless the current goal requires it.

## Put annotations beside the assumptions

Chat works well for quick feedback. Document annotations work well for constraints that will affect later implementation.

If a plan proposes adding client retries, an annotation might say: "The task consumer already retries and handles idempotency. Confirm how failures propagate before adding another retry layer." It identifies the problem, explains why it matters, and points to the missing evidence.

Another plan may assign access scope to individual records when the business actually shares collections. Correct the domain model and data flow, then recheck the API and UI. Renaming one field cannot repair a misunderstanding in the model.

After each revision, confirm that constraints have become part of the plan itself, rather than a final sentence saying "handled." If a change affects other sections, update the desired behavior, file list, and verification together. Repeated annotations should reduce unresolved decisions, not accumulate stronger prompts.

When the task explicitly limits the work to research or planning, keep that boundary until implementation is authorized. The boundary must come from the actual task agreement; it should not become a reason to repeatedly seek confirmation after implementation has already been authorized.

## Measure implementation by completed behavior

Once the plan is stable, divide it into a few verifiable tasks. Connect each task to an outcome, such as "return a next-page cursor and verify stable pagination with duplicate sort values," rather than simply "modify three files."

Implementation feedback can often be shorter because the shared context already exists. "This logic is in the wrong application entry point" or "a caller was missed" directs a specific correction. For visual problems, provide the actual location, dimensions, reproduction steps, or screenshot instead of only saying "it looks wrong."

Record the verification used when a task is complete. Type checking establishes whether type constraints hold. Behavioral tests cover specified scenarios. Browser or real-environment checks establish another layer of evidence. Passing one kind of check does not automatically prove every other layer.

New facts can change the plan during implementation. Research may have missed an external caller, or real data may violate an assumption. Update the affected scope before continuing; do not finish a design that is no longer correct just to preserve the initial checklist.

## Keep your own ability to understand the change

Even with research and a plan, a risky pattern remains possible: paste an error into AI, accept a patch, see checks pass, and immediately move to the next round.

After an important change, try explaining it without the generated description: how input becomes output, which layer validates it, how a failure ends, and why the test catches the original problem. If you cannot explain those points, read the relevant code and documentation or check a small example.

Practicing does not have to mean "never use AI." Read an error and write down possible causes before asking AI for evidence. After it offers an explanation, design a counterexample that could disprove it. Or make one small change yourself and compare the result.

The purpose is not to prove who writes faster. It is to preserve the submitter's ability to judge the change. Plans record reasons and tests record behavior, but people still need to understand the code.

## Connect the workflow with a concrete task description

Instead of making the wording more forceful, make the scope, phase, and output more specific:

```text
Goal: Add stable cursor pagination to the order list.
Current phase: Research and planning; do not implement yet.
Read the API, query, client state, and relevant callers first.
Record confirmed facts, evidence, and questions that need verification.
Then propose the change scope and compatibility approach.
Explain key tradeoffs and checks for duplicates, omissions, and access scope.
```

This description does not guarantee that AI will find every problem. It gives the work a path that can be checked: establish the facts, decide the change, and test the design against actual results. Move to the next phase when important assumptions have been addressed, not just when the document looks complete.
