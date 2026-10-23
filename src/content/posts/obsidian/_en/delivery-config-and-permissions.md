---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00.000+08:00
title: "Hiding a Page Is Not Enough: Delivery Configuration and Account Permissions"
draft: false
featured: false
tags: [architecture, authorization, feature-flags]
hideEditPost: true
timezone: Asia/Shanghai
description: A fictional order system illustrates how delivery configuration, account permissions, and data scope work together across pages, metrics, sharing, and verification.
---

One business system often needs to be delivered in several versions. One includes only the order list; another adds analytics. Some versions expose every metric, while others include only a subset. Meanwhile, administrators, members, and visitors in the same version have different abilities.

It is easy to squeeze both sets of rules into one check: hide the menu when permission is missing. The menu becomes cleaner, but metrics, export buttons, direct URLs, and backend endpoints may still follow different rules.

This article turns the structural questions in modularization notes into a design discussion. The order system, roles, and configuration keys below are fictional. The examples do not correspond to a verified implementation.

## Configuration and permissions answer different questions

Imagine an order system with a basic edition and an analytics edition. The basic edition has no order trends page; the analytics edition includes one. In the analytics edition, members can view their assigned orders, while administrators can view and export orders in the current organization.

Delivery configuration answers: **Which capabilities does this version include?** Account permissions answer: **Which capabilities may this identity use?** Data scope further constrains: **Which records may this operation affect?**

The three can be expressed conceptually:

```text
An operation is allowed when the delivered capability is enabled
                        AND the account has the operation's permission
                        AND the target records are within its allowed scope.
```

This decomposes the business rule; it is not complete authorization code. Page visibility also depends on context, while the server must authorize the request and its specific target objects. Access to the order list does not imply access to any arbitrary order. The [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request) calls for checking permissions on every request and checking access to specific objects.

When delivery configuration disables trend analysis, an organization administrator cannot make it reappear merely by being an administrator. Their permissions apply within the delivered capabilities. If maintenance staff need a special entry point, define that identity and access path separately instead of embedding a "bypass everything" branch in normal business pages.

## Distinguish how pages can be configured

Not every page is suited to individual metric switches. Start by separating four relationships between pages and their content:

| Page type                    | Fictional example        | What can vary                                                 |
| ---------------------------- | ------------------------ | ------------------------------------------------------------- |
| Shared foundational page     | Login, personal settings | Keep the entry point; authorize operations by identity        |
| Fixed page, optional content | Order list               | Keep the page; configure metrics such as late-order count     |
| Optional page and content    | Order trends             | Disable the page, or select its metrics when enabled          |
| Optional page as a whole     | Monthly summary report   | Enable or disable the complete page, preserving its structure |

The classification makes variation explicit. Disabling the late-order count should not remove the whole order list. Disabling the monthly report does not require individually switching off each paragraph.

It also affects empty states. If the trends page is enabled but all its metrics are disabled, decide whether to reject the configuration, hide the empty page, or show an explicit empty state. Handle that choice consistently in configuration rules so navigation, home cards, and page content do not each make their own assumptions.

## A metric usually affects several places

The late-order count may appear in a list, chart, detail card, alert configuration, and export. Adding a switch only to the chart can leave the label visible, the field in exports, or the alert still running.

A capability registry can record these relationships. It helps check the affected scope without replacing all business logic:

```yaml
metric:late-orders:
  placements:
    - orders.column
    - trends.chart
    - order-detail.card
    - export.field
  linkedAlert: alert:late-orders
  dependentPage: page:trends
```

In this sketch, `placements` lists consumers of the metric, `linkedAlert` records its alert relationship, and `dependentPage` identifies a related page. Implementation still needs a dependency direction: disabling a page can disable its chart, but must not accidentally disable independent uses of the same metric in the order list.

When adding a metric, developers should be able to explain where it appears, which permissions constrain it, and whether it triggers background behavior. Then "disable this metric" has a defined scope instead of depending on a project-wide search from memory.

## Verify build composition, UI assembly, and API authorization separately

Configuration can choose modules at build time or capabilities at runtime. The choice depends on delivery and how frequently configuration changes. Either approach needs three distinct checks:

1. Does the build contain the expected pages and modules?
2. Does the current account see the correct entry points, metrics, and operations?
3. Does the server reject unauthorized requests and constrain the returned data?

A menu disappearing after a page is disabled proves only a UI change. Check direct URLs, home shortcuts, saved bookmarks, sharing entry points, and endpoint behavior too. Even if a page module is absent from a build, independently verify the server endpoints that remain reachable.

The client can check capabilities early to avoid pointless requests and explain unavailable operations. The server must decide from trusted identity and configuration, not accept a browser's claim that it has permission.

## Shared access needs its own authorization context

Suppose an administrator shares a monthly report with an external visitor. The visitor should not inherit the administrator's order-editing permission or gain access to every report in the organization.

The sharing grant can be limited to one report, read-only access, an expiration time, and whether downloading is allowed. Creating a share also requires checking whether this delivery includes sharing and whether the current account may share this particular report.

When the link is opened, the server checks again that the share is valid, the target matches, and the operation is within the grant. The administrator who originally owned the page does not determine the visitor's permissions. Expiration, revocation, and changes to the original account's permissions need explicit product rules before implementation.

## Put configuration and roles in the same verification matrix

Clicking through pages one by one can test only whether a switch works. Crossing delivery configuration with account permissions is more useful:

| Delivered capability | Account permission | Expected verification                                                         |
| -------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Disabled             | Granted            | No business entry point; related requests rejected according to product rules |
| Enabled              | Missing            | No restricted operation entry point; direct requests rejected                 |
| Enabled              | Granted            | Capability available; results still constrained by data scope                 |
| Disabled             | Missing            | Neither page nor dependent content leaks into the UI                          |

Add another layer for metrics: after disabling one, verify consistency across lists, charts, exports, thresholds, and alerts. For sharing, add anonymous visitors, visitors with expired links, and visitors attempting to access another object.

The matrix describes what should be verified, not checks already completed. It separates "the menu is gone" from "authorization is correct" and makes a configuration change's impact easier to review.

As delivery variants grow, there is no need to immediately copy a page set for each version. First make capability, identity, and data-scope rules explicit. Then check that they work together across pages, endpoints, and shared access. That gives modularization a maintainable boundary.
