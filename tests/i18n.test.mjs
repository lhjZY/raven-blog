import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";

const dist = new URL("../dist/", import.meta.url);
const base = "";

test("Pages retain their locale and language switches resolve without requiring translations", () => {
  const pages = readdirSync(dist, { recursive: true }).filter((path) => path.endsWith(".html"));
  assert.ok(pages.length > 30, "Build both languages before running this check");

  for (const page of pages) {
    const locale = page.startsWith("zh/") ? "zh" : "en";
    const otherLocale = locale === "zh" ? "en" : "zh";
    const html = readFileSync(new URL(page, dist), "utf8");
    assert.match(html, new RegExp(`<html\\b[^>]*lang="${locale}"`), page);
    const languageLink = html.match(new RegExp(`<a\\b[^>]*hreflang="${otherLocale}"[^>]*>`))?.[0];
    assert.ok(languageLink, `Missing language switch on ${page}`);
    assert.match(languageLink, /data-astro-reload/, page);
    const languageHref = languageLink.match(/href="([^"]+)"/)?.[1];
    assert.ok(languageHref, `Missing language destination on ${page}`);
    const destination = decodeURI(new URL(languageHref, "https://liuhuanjun.top").pathname).replace(
      /^\/|\/$/g,
      "",
    );
    assert.equal(destination.startsWith("zh/") || destination === "zh", otherLocale === "zh", page);
    assert.ok(
      existsSync(new URL(`${destination || "."}/index.html`, dist)) ||
        existsSync(new URL(`${destination}.html`, dist)),
      `Broken language switch ${languageHref} on ${page}`,
    );

    for (const [, href] of html.matchAll(/href="([^"#?]+)(?:[?#][^"]*)?"/g)) {
      if (!href.startsWith(`${base}/zh/`)) continue;
      const path = new URL(href, "http://localhost").pathname.slice(base.length).replace(/\/$/, "");
      assert.ok(
        existsSync(new URL(`${path.slice(1)}/index.html`, dist)) ||
          existsSync(new URL(path.slice(1), dist)),
        `Broken Chinese link ${href} on ${page}`,
      );
    }
  }
});

test("Chinese pagination, dates, feeds and search indexes use the correct locale", () => {
  const home = readFileSync(new URL("zh/index.html", dist), "utf8");
  const feedUrl = home.match(/<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/)?.[1];
  assert.ok(feedUrl, "The RSS feed remains discoverable without a visible icon");
  assert.equal(new URL(feedUrl).pathname, `${base}/zh/rss.xml`);
  const posts = readFileSync(new URL("zh/posts/index.html", dist), "utf8");
  assert.match(posts, new RegExp(`href="${base}/zh/posts/2/?"`));
  const post = readFileSync(
    new URL("zh/posts/dynamic-og-image-generation-in-astropaper-blog-posts/index.html", dist),
    "utf8",
  );
  assert.match(post, /2026年6月3日/);
  const tags = readFileSync(new URL("zh/tags/docs/index.html", dist), "utf8");
  assert.match(tags, new RegExp(`href="${base}/zh/tags/docs/2/?"`));
  const rss = readFileSync(new URL("zh/rss.xml", dist), "utf8");
  assert.match(rss, /<link>[^<]+\/zh\/posts\//);
  assert.doesNotMatch(rss, /<link>https:\/\/liuhuanjun\.top\/posts\//);
  const index = JSON.parse(readFileSync(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
  assert.deepEqual(Object.keys(index.languages).sort(), ["en", "zh"]);
});

test("Personal articles publish independently and stay in their locale", () => {
  const source = new URL("../src/content/posts/obsidian/", import.meta.url);
  const files = readdirSync(source, { recursive: true }).filter((file) => file.endsWith(".md"));

  for (const file of files) {
    const { frontmatter } = parseFrontmatter(readFileSync(new URL(file, source), "utf8"));
    const locale = frontmatter.lang;
    assert.ok(["en", "zh"].includes(locale), file);
    const prefix = locale === "zh" ? "zh/" : "";
    const slug = file.replace(/^_en\//, "").replace(/\.md$/, "");
    const postPath = `${prefix}posts/obsidian/${slug}`;
    const postPage = new URL(`${postPath}/index.html`, dist);
    const feed = readFileSync(new URL(`${prefix}rss.xml`, dist), "utf8");

    if (frontmatter.draft) {
      assert.ok(!existsSync(postPage), `Draft published: ${file}`);
      assert.ok(!feed.includes(`/${postPath}/</link>`), `Draft in feed: ${file}`);
      continue;
    }
    if (new Date(frontmatter.pubDatetime).getTime() > Date.now()) continue;

    const html = readFileSync(postPage, "utf8")
      .replaceAll("&amp;", "&")
      .replaceAll("&#39;", "'")
      .replaceAll("&apos;", "'")
      .replaceAll("&quot;", '\"')
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">");
    const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].trim();
    assert.equal(heading, frontmatter.title, file);
    assert.ok(
      feed.includes(`/${postPath}/</link>`) || feed.includes(`/${postPath}</link>`),
      `Missing feed entry: ${file}`,
    );

    const counterpart = locale === "en" ? "zh/" : "";
    const hasTranslation = existsSync(
      new URL(`${counterpart}posts/obsidian/${slug}/index.html`, dist),
    );
    const switchTag = html.match(/<a\b[^>]*hreflang="(?:en|zh)"[^>]*>/)?.[0];
    const destination = hasTranslation
      ? `/${counterpart}posts/obsidian/${slug}`
      : `/${counterpart}posts/`;
    assert.ok(switchTag?.includes(`href="${destination}`), file);
  }

  const index = JSON.parse(readFileSync(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
  const pages = readdirSync(dist, { recursive: true }).filter((path) => path.endsWith(".html"));
  for (const locale of ["en", "zh"]) {
    const articles = pages.filter((path) => {
      const pageLocale = path.startsWith("zh/") ? "zh" : "en";
      return (
        pageLocale === locale &&
        readFileSync(new URL(path, dist), "utf8").includes("data-pagefind-body")
      );
    });
    assert.equal(
      index.languages[locale].page_count,
      articles.length,
      `Search index count for ${locale}`,
    );
  }
});

test("Custom-domain links and assets resolve from the site root", () => {
  const pages = readdirSync(dist, { recursive: true }).filter((path) => path.endsWith(".html"));
  for (const page of pages) {
    const html = readFileSync(new URL(page, dist), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(canonical, page);
    if (page === "index.html" || new URL(canonical).origin === "https://liuhuanjun.top") {
      assert.ok(canonical.startsWith(`https://liuhuanjun.top${base}/`), page);
    }
    const pageUrl = new URL(page, `https://liuhuanjun.top${base}/`);
    for (const [, href] of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
      const url = new URL(href, pageUrl);
      if (url.origin !== "https://liuhuanjun.top") continue;
      assert.ok(!url.pathname.startsWith("/raven-blog/"), `${page}: ${href}`);
      assert.ok(url.pathname === base || url.pathname.startsWith(`${base}/`), `${page}: ${href}`);
      const path = decodeURI(url.pathname.slice(base.length)).replace(/^\/|\/$/g, "");
      assert.ok(
        existsSync(new URL(path || "index.html", dist)) ||
          existsSync(new URL(`${path}/index.html`, dist)) ||
          existsSync(new URL(`${path}.html`, dist)),
        `Missing resource ${href} on ${page}`,
      );
    }
  }
  for (const locale of ["", "zh/"]) {
    const search = readFileSync(new URL(`${locale}search/index.html`, dist), "utf8");
    assert.ok(search.includes(`data-bundle-path="${base}/pagefind/"`));
    const feed = readFileSync(new URL(`${locale}rss.xml`, dist), "utf8");
    for (const [, link] of feed.matchAll(/<link>([^<]+)<\/link>/g)) {
      assert.ok(link.startsWith(`https://liuhuanjun.top${base}/${locale}`), link);
    }
  }
});
