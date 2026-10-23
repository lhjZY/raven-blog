---
author: Raven
lang: zh
pubDatetime: 2026-10-10T00:00:00.000+08:00
title: OAuth 回调遇到 hash 路由：参数为什么读不到？
draft: false
featured: false
tags:
  - oauth
  - vue
  - routing
  - javascript
hideEditPost: true
timezone: Asia/Shanghai
description: 用示例 URL 区分 OAuth 回调的 query 与 Vue hash 路由参数，说明初始化前的兼容处理、普通回调入口，以及授权码和 state 的处理边界。
---

<!-- 来源：网络/微信测试号搭建.md。真实域名与参数已替换；待核验：具体平台回调行为、移动端浏览器及实际登录闭环。 -->

页面地址里明明有 `code`，路由组件却读不到它。遇到这个问题，先看参数位于 URL 的哪个部分：`#` 前面的 query，和 `#` 后面的路由 query，由不同的代码解释。

下面统一使用虚构地址与参数。讨论的是授权码回调与 hash 路由的衔接，不代表所有 OAuth 服务都返回相同形式的地址。

## 同一个问号，可以属于不同部分

假设一个现有应用入口收到这样的 URL：

```text
https://example.com/?code=demo-code&state=demo-state#/event
```

浏览器把它拆成：

```text
origin   https://example.com
pathname /
search   ?code=demo-code&state=demo-state
hash     #/event
```

浏览器的 `search` 表示 URL 查询部分，`hash` 表示带 `#` 前缀的片段部分，可以分别读取。参见 [MDN：Location.search](https://developer.mozilla.org/en-US/docs/Web/API/Location/search) 与 [Location.hash](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash)。

Vue Router 的 hash 模式把 `#` 后面的内容当作路由地址。因此当前路由是 `/event`，路由自身的 query 为空。`route.query.code` 不会自动去 `window.location.search` 中补找参数。hash 模式的 URL 形式见 [Vue Router 官方文档](https://router.vuejs.org/guide/essentials/history-mode.html#hash-mode)。

如果地址变成下面这样，`code` 才位于 hash 路由自己的 query 中：

```text
https://example.com/#/event?code=demo-code&state=demo-state
```

可以在浏览器中直接区分这两层：

```js
const outerParams = new URLSearchParams(window.location.search);
const code = outerParams.get("code");
```

这段代码读取的是 `#` 前面的 query，与 Vue Router 的 `route.query` 不是同一个来源。

## 先确定正常的回调入口

OAuth 授权码流程会把 `code` 加到回调 URI 的 query 中。标准还规定，回调 URI 不应包含 fragment。因此，不能为了迎合 hash 路由，就把下面这种地址当作通用的 `redirect_uri`：

```text
https://example.com/#/event
```

应使用普通回调入口，例如：

```text
https://example.com/oauth/callback
```

在该入口读取 `search`，处理授权结果，再进入业务路由。query 响应位置和 fragment 限制分别见 [RFC 6749 第 4.1.2 节](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) 与 [第 3.1.2 节](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1.2)。

实际接入时，还需要确保服务器能返回回调页面，并遵守平台自己的回调地址配置要求。授权码由服务端按平台协议换取授权结果；需要的应用密钥应留在服务端。使用微信等平台时，网页授权获得的 token 和其他服务端接口使用的 token 也不能混为一谈。

业务跳转目标可以由服务端保存的授权请求上下文决定。即使用 `state` 关联目标，也应通过随机值查找受信任的上下文，而不是把任意外部 URL 直接当作跳转地址。

## 现有 hash 页面需要兼容时，如何迁移参数

如果现有应用已经在一个 hash 路由入口收到 `?code=…#/event`，并且后续组件约定从 `route.query` 读取它，可以在路由初始化前做一次兼容迁移。

这一步只改变参数位置，不完成登录验证。它适用于已有 `#/…` 路由且外层确实有 `code` 的 URL；普通 callback 页面无需先把参数搬进 hash。

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
    // 外层没有 state 时，不沿用 hash 中可能残留的旧值。
    hashParams.delete("state");
  }

  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.hash = `${hashPath}?${hashParams.toString()}${routeAnchor}`;
  return url.href;
}
```

相比直接拼接 `origin + pathname + hash`，使用 `URL` 可以保留其他外层参数。例如：

```text
输入：
https://example.com/?lang=zh&code=demo-code&state=demo-state#/event?page=2

输出：
https://example.com/?lang=zh#/event?page=2&code=demo-code&state=demo-state
```

检查条件也应直接读取名为 `code` 的参数，而不是用字符串 `includes("code=")` 判断，否则其他参数的名称或内容可能造成误判。

hash 路由自身还可能带有锚点，例如 `#/event?page=2#section`。代码先拆出第二个 `#` 开始的锚点，再处理路由 query，最后将锚点放回末尾，避免把授权参数拼进锚点，或把锚点编码进原有参数。

此示例假设 OAuth 参数各出现一次。生产入口应拒绝重复的 `code`、`state` 等歧义输入，并按实际业务约定处理错误回调，不应把 URL 迁移函数当作完整授权处理器。

## 初始化顺序决定了路由第一次读到什么

原笔记使用 `window.location.replace()` 重新导航。保持这个方案时，首次导航发生后应停止当前页面的应用初始化：

```js
const normalizedUrl = normalizeOAuthHashUrl(window.location.href);

if (normalizedUrl !== null) {
  window.location.replace(normalizedUrl);
} else {
  // createApp、setupStore、router 和 App 使用项目现有定义。
  const app = createApp(App);
  setupStore(app);
  app.use(router);
  app.mount("#app");
}
```

对于本文把外层 query 移除的例子，执行顺序是：

```text
首次加载：?code=demo-code&state=demo-state#/event
    ↓
读取外层 query，生成新的 URL
    ↓
location.replace() 导航到新地址，本次不初始化 Vue
    ↓
再次加载：#/event?code=demo-code&state=demo-state
    ↓
外层不再含 code，迁移函数返回 null
    ↓
初始化应用，路由读取 hash 内的 query
```

`Location.replace()` 会替换当前历史记录中的页面，因而不会额外保留转换前的入口；相关行为见 [MDN：Location.replace](https://developer.mozilla.org/en-US/docs/Web/API/Location/replace)。不要把它与只修改历史记录的 `history.replaceState()` 混淆：后者不导航到新页面，使用时需要相应调整初始化顺序。

## 用虚构 URL 检查迁移逻辑

下面的断言只检查纯 URL 转换，不调用授权平台，也不发送网络请求。可以与前面的函数放在同一个 JavaScript 环境中执行：

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

第一个例子检查基础迁移，第二个检查原有参数保留，第三个检查不会重复转换，第四个检查不会继承旧 `state`，第五个说明普通回调入口不属于这段兼容逻辑，最后两个检查路由锚点是否保留。

## 参数读到了，授权流程还没有结束

将 `code` 搬到路由里，只解决“从哪里读取”的问题。后续仍需由实际授权处理逻辑完成以下步骤：

1. 验证回调与之前发起的授权请求相匹配，包括相应的 `state` 校验。
2. 在服务端交换授权码，处理过期、已使用、拒绝授权和请求失败。
3. 建立应用自己的登录状态，再进入业务页面。
4. 处理完后移除 URL 中的授权参数，避免刷新时重复交换，也避免将它们写入分析日志。

授权码应短期有效且不可重复使用；客户端还需要防范回调中的跨站请求伪造。对应要求见 [RFC 6749 第 4.1.2 节](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1.2) 与 [第 10.12 节](https://www.rfc-editor.org/rfc/rfc6749.html#section-10.12)。

排查这类故障时，先分别检查浏览器 `search`、`hash` 和路由 `query`，再追踪初始化顺序。只有确认参数确实位于错误的读取层，才需要做位置迁移；普通回调入口直接读取外层 query 往往已经足够。
