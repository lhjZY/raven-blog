---
author: Raven
lang: en
pubDatetime: 2026-10-10T00:00:00+08:00
title: "OAuth Callbacks and Hash Routing: Why Can't the Router Read the Parameters?"
draft: false
featured: false
tags:
  - oauth
  - vue
  - routing
  - javascript
hideEditPost: true
timezone: Asia/Shanghai
description: Distinguish OAuth callback queries from Vue hash-route parameters using example URLs, and examine initialization order, ordinary callback endpoints, and the boundaries of authorization-code and state handling.
---

<!-- Source: the original WeChat test-account setup note. Real domains and parameters have been replaced. Provider callback behavior, mobile browsers, and the complete login flow remain unverified. -->

The page URL clearly contains `code`, yet the route component cannot read it. First check which part of the URL contains the parameter: the query before `#` and the route query after `#` are interpreted by different code.

All addresses and parameters below are fictional. This article examines how authorization-code callbacks interact with hash routing; it does not imply that every OAuth service returns the same URL format.

## A Question Mark Can Belong to Different Parts of the URL

Suppose an existing application receives:

```text
https://example.com/?code=demo-code&state=demo-state#/event
```

The browser separates it into:

```text
origin   https://example.com
pathname /
search   ?code=demo-code&state=demo-state
hash     #/event
```

The browser's `search` is the URL query, while `hash` is the fragment including its `#` prefix. They can be read separately. See [MDN: Location.search](https://developer.mozilla.org/en-US/docs/Web/API/Location/search) and [Location.hash](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash).

Vue Router's hash mode treats the content after `#` as the route address. The current route is therefore `/event`, with an empty route query. `route.query.code` does not automatically look in `window.location.search` for missing parameters. See the URL format in the [Vue Router documentation](https://router.vuejs.org/guide/essentials/history-mode.html#hash-mode).

Only in the following address does `code` belong to the hash route's own query:

```text
https://example.com/#/event?code=demo-code&state=demo-state
```

You can read the outer layer directly in the browser:

```js
const outerParams = new URLSearchParams(window.location.search);
const code = outerParams.get("code");
```

This reads the query before `#`. It does not use the same source as Vue Router's `route.query`.

## Establish an Ordinary Callback Endpoint First

The OAuth authorization-code flow adds `code` to the callback URI's query. The standard also requires the callback URI to exclude a fragment. Consequently, the following address should not be treated as a general-purpose `redirect_uri` just to accommodate hash routing:

```text
https://example.com/#/event
```

Use an ordinary callback endpoint, for example:

```text
https://example.com/oauth/callback
```

Read `search` there, process the authorization result, and then enter the application route. The query response location and fragment restriction appear in [RFC 6749, section 4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) and [section 3.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2), respectively.

In a real integration, the server must serve the callback page, and its address must meet the provider's configuration requirements. The server exchanges the authorization code according to the provider's protocol; any required application secret belongs on the server. With providers such as WeChat, tokens obtained through web authorization must also be distinguished from tokens used for other server APIs.

The destination after login can come from authorization-request context stored on the server. Even when `state` associates a destination with the request, use a random value to look up trusted context instead of accepting an arbitrary external URL as a redirect target.

## Move Parameters Only When an Existing Hash Page Needs Compatibility

If an existing application already receives `?code=…#/event` at a hash-route entry point, and its components expect to read the value from `route.query`, a compatibility conversion can run before router initialization.

This changes the parameter's location; it does not validate login. It applies only to URLs with an existing `#/…` route and an outer `code` parameter. An ordinary callback page does not need to move its parameters into a hash first.

```js
function normalizeOAuthHashUrl(href) {
  const url = new URL(href);
  const code = url.searchParams.get("code");

  if (!code || !url.hash.startsWith("#/")) {
    return null;
  }

  const anchorIndex = url.hash.indexOf("#", 1);
  const routeAddress = anchorIndex === -1 ? url.hash : url.hash.slice(0, anchorIndex);
  const routeAnchor = anchorIndex === -1 ? "" : url.hash.slice(anchorIndex);
  const questionIndex = routeAddress.indexOf("?");
  const hashPath = questionIndex === -1 ? routeAddress : routeAddress.slice(0, questionIndex);
  const hashSearch = questionIndex === -1 ? "" : routeAddress.slice(questionIndex + 1);
  const hashParams = new URLSearchParams(hashSearch);
  const state = url.searchParams.get("state");

  hashParams.set("code", code);
  if (state !== null) {
    hashParams.set("state", state);
  } else {
    // Without an outer state, discard any stale state in the route query.
    hashParams.delete("state");
  }

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.hash = `${hashPath}?${hashParams.toString()}${routeAnchor}`;
  return url.href;
}
```

Using `URL` preserves other outer parameters, unlike directly concatenating `origin + pathname + hash`. For example:

```text
Input:
https://example.com/?lang=zh&code=demo-code&state=demo-state#/event?page=2

Output:
https://example.com/?lang=zh#/event?page=2&code=demo-code&state=demo-state
```

Read the parameter named `code` directly instead of checking the string with `includes("code=")`. Other parameter names or values can otherwise cause false matches.

A hash route can also contain its own anchor, such as `#/event?page=2#section`. The function separates the anchor starting at the second `#`, processes the route query, and restores the anchor at the end. This prevents authorization parameters from being appended inside the anchor or the anchor from being encoded into existing parameter values.

This example assumes each OAuth parameter occurs once. A production endpoint should reject ambiguous duplicate `code` or `state` parameters and handle error callbacks according to its requirements. A URL conversion function is not a complete authorization handler.

## Initialization Order Determines What the Router Reads First

The original note uses `window.location.replace()` to navigate again. When retaining that approach, stop application initialization on the current page after initiating the navigation:

```js
const normalizedUrl = normalizeOAuthHashUrl(window.location.href);

if (normalizedUrl !== null) {
  window.location.replace(normalizedUrl);
} else {
  // Use the project's existing createApp, setupStore, router, and App definitions.
  const app = createApp(App);
  setupStore(app);
  app.use(router);
  app.mount("#app");
}
```

For this example, which removes the outer query, the sequence is:

```text
First load: ?code=demo-code&state=demo-state#/event
    ↓
Read the outer query and generate a new URL
    ↓
location.replace() navigates; do not initialize Vue on this load
    ↓
Next load: #/event?code=demo-code&state=demo-state
    ↓
The outer query no longer contains code; conversion returns null
    ↓
Initialize the application; the router reads the query inside the hash
```

`Location.replace()` replaces the current page's history entry, so the original entry is not retained as an extra step. See [MDN: Location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace). Distinguish it from `history.replaceState()`, which changes history without navigating to another page and requires a corresponding adjustment to initialization order.

## Check the Conversion with Fictional URLs

These assertions test only pure URL conversion. They do not contact an authorization provider or send network requests. Run them in the same JavaScript environment as the function above:

```js
console.assert(
  normalizeOAuthHashUrl("https://example.com/?code=demo-code&state=demo-state#/event") ===
    "https://example.com/#/event?code=demo-code&state=demo-state",
);

console.assert(
  normalizeOAuthHashUrl(
    "https://example.com/?lang=zh&code=demo-code&state=demo-state#/event?page=2",
  ) === "https://example.com/?lang=zh#/event?page=2&code=demo-code&state=demo-state",
);

console.assert(
  normalizeOAuthHashUrl("https://example.com/#/event?code=demo-code&state=demo-state") === null,
);

console.assert(
  normalizeOAuthHashUrl("https://example.com/?code=demo-code#/event?state=old-state") ===
    "https://example.com/#/event?code=demo-code",
);

console.assert(
  normalizeOAuthHashUrl("https://example.com/oauth/callback?code=demo-code&state=demo-state") ===
    null,
);

console.assert(
  normalizeOAuthHashUrl("https://example.com/?code=demo-code#/event#section") ===
    "https://example.com/#/event?code=demo-code#section",
);

console.assert(
  normalizeOAuthHashUrl(
    "https://example.com/?lang=zh&code=demo-code&state=demo-state#/event?page=2#section",
  ) === "https://example.com/?lang=zh#/event?page=2&code=demo-code&state=demo-state#section",
);
```

The first case checks basic conversion; the second checks preservation of existing parameters; the third checks that conversion is not repeated; the fourth checks that stale `state` is not inherited; the fifth shows that ordinary callback endpoints are outside this compatibility logic. The last two check preservation of route anchors.

## Reading the Parameters Does Not Complete Authorization

Moving `code` into the route only resolves where to read it. The authorization handler must still:

1. Verify that the callback matches the authorization request previously initiated, including the appropriate `state` validation.
2. Exchange the code on the server and handle expiration, reuse, authorization denial, and request failures.
3. Establish the application's own login state before entering the destination page.
4. Remove authorization parameters from the URL after processing to prevent repeated exchanges on refresh and keep them out of analytics logs.

Authorization codes must be short-lived and single-use; clients also need protection against cross-site request forgery at the callback. See [RFC 6749, section 4.1.2](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) and [section 10.12](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12).

When diagnosing this failure, inspect the browser's `search`, `hash`, and the router's `query` separately, then trace initialization order. Move parameters only after confirming that they occupy the wrong layer for the reader. Reading the outer query at an ordinary callback endpoint is often sufficient.
