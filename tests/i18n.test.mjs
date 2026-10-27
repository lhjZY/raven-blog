import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";

const dist = new URL("../dist/", import.meta.url);
const base = "";

test("Pages retain their locale and language switches resolve without requiring translations", () => {
  const pages = readdirSync(dist, { recursive: true }).filter((path) => path.endsWith(".html"));
  for (const prefix of ["", "zh/"]) {
    for (const path of [
      "index.html",
      "posts/index.html",
      "tags/index.html",
      "about/index.html",
      "search/index.html",
    ]) {
      assert.ok(pages.includes(`${prefix}${path}`), `Missing required page: ${prefix}${path}`);
    }
  }

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

test("Pagination, dates and feeds match the published content in each locale", () => {
  const pages = readdirSync(dist, { recursive: true }).filter((path) => path.endsWith(".html"));

  for (const locale of ["en", "zh"]) {
    const prefix = locale === "zh" ? "zh/" : "";
    const home = readFileSync(new URL(`${prefix}index.html`, dist), "utf8");
    const feedUrl = home.match(/<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/)?.[1];
    assert.ok(feedUrl, `Missing RSS discovery link for ${locale}`);
    assert.equal(new URL(feedUrl).pathname, `${base}/${prefix}rss.xml`);

    const articles = [];
    for (const page of pages) {
      if ((page.startsWith("zh/") ? "zh" : "en") !== locale) continue;
      const html = readFileSync(new URL(page, dist), "utf8");
      if (html.includes("data-pagefind-body")) {
        articles.push(`/${page.replace(/\/index\.html$/, "")}`);
        const date = html.match(/<time\b[^>]*datetime="([^"]+)"[^>]*>\s*([^<]+)<\/time>/);
        assert.ok(date, `Missing article date: ${page}`);
        assert.ok(Number.isFinite(Date.parse(date[1])), `Invalid article date: ${page}`);
        assert.match(
          date[2].trim(),
          locale === "zh" ? /^\d{4}年\d{1,2}月\d{1,2}日$/ : /^\d{1,2} [A-Z][a-z]{2}, \d{4}$/,
          page,
        );
      }

      const listing = page.slice(prefix.length).match(
        /^(posts|tags\/[^/]+)(?:\/(\d+))?\/index\.html$/,
      );
      if (!listing) continue;
      const [, section, number] = listing;
      const currentPage = Number(number ?? 1);
      const nextPage = `${prefix}${section}/${currentPage + 1}/index.html`;
      const nextHref = `${base}/${prefix}${section}/${currentPage + 1}`;
      const links = Array.from(html.matchAll(/href="([^"]+)"/g), ([, href]) =>
        decodeURI(href).replace(/\/$/, ""),
      );
      assert.equal(links.includes(nextHref), pages.includes(nextPage), `Next page link: ${page}`);
      if (currentPage > 1) {
        const previousHref = `${base}/${prefix}${section}${currentPage === 2 ? "" : `/${currentPage - 1}`}`;
        assert.ok(links.includes(previousHref), `Missing previous page link: ${page}`);
      }
    }

    const rss = readFileSync(new URL(`${prefix}rss.xml`, dist), "utf8");
    const entries = Array.from(
      rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g),
      ([, link]) => decodeURI(new URL(link).pathname).replace(/\/$/, ""),
    );
    assert.deepEqual(entries.sort(), articles.sort(), `RSS entries for ${locale}`);
  }
});

test("Personal articles publish independently and stay in their locale", () => {
  const source = new URL("../src/content/posts/obsidian/", import.meta.url);
  // This legacy folder is optional; new CMS articles can live elsewhere.
  const files = existsSync(source)
    ? readdirSync(source, { recursive: true }).filter((file) => file.endsWith(".md"))
    : [];

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
});

test("Search indexes match article pages and support an empty blog", () => {
  const index = JSON.parse(readFileSync(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
  const pages = readdirSync(dist, { recursive: true })
    .filter((path) => path.endsWith(".html"))
    .map((path) => ({
      locale: path.startsWith("zh/") ? "zh" : "en",
      html: readFileSync(new URL(path, dist), "utf8"),
    }));
  const articles = pages.filter(({ html }) => html.includes("data-pagefind-body"));
  // Pagefind falls back to <body> only when no page defines data-pagefind-body.
  const indexedPages = articles.length > 0 ? articles : pages;
  const expectedCounts = {};
  for (const { locale } of indexedPages) {
    expectedCounts[locale] = (expectedCounts[locale] ?? 0) + 1;
  }
  const actualCounts = Object.fromEntries(
    Object.entries(index.languages).map(([locale, data]) => [locale, data.page_count]),
  );
  assert.deepEqual(actualCounts, expectedCounts);
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
