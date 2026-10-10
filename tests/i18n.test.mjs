import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";

const dist = new URL("../dist/", import.meta.url);
const base = "/raven-blog";

test("Chinese pages retain their locale and have matching English pages", () => {
  const pages = readdirSync(new URL("zh/", dist), { recursive: true }).filter((path) =>
    path.endsWith(".html"),
  );
  assert.ok(pages.length > 30, "Build both languages before running this check");

  for (const page of pages) {
    const html = readFileSync(new URL(`zh/${page}`, dist), "utf8");
    assert.match(html, /<html\b[^>]*lang="zh"/, page);
    const languageLink = html.match(/<a\b[^>]*hreflang="en"[^>]*>/)?.[0];
    assert.ok(languageLink, `Missing English switch on ${page}`);
    assert.match(languageLink, /data-astro-reload/, page);
    const englishPage = page === "404/index.html" ? "404.html" : page;
    assert.ok(existsSync(new URL(englishPage, dist)), `Missing English page for ${page}`);

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
  assert.ok(home.includes(`href="${base}/zh/rss.xml"`));
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
  assert.doesNotMatch(rss, /<link>[^<]+\/raven-blog\/posts\//);
  const index = JSON.parse(readFileSync(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
  assert.deepEqual(Object.keys(index.languages).sort(), ["en", "zh"]);
});

test("Migrated posts have complete English counterparts and stay in their locale", () => {
  const source = new URL("../src/content/posts/obsidian/", import.meta.url);
  const files = readdirSync(source).filter((file) => file.endsWith(".md"));
  assert.equal(files.length, 8);
  assert.deepEqual(readdirSync(new URL("_en/", source)).sort(), files.sort());

  for (const file of files) {
    const chinese = parseFrontmatter(readFileSync(new URL(file, source), "utf8"));
    const english = parseFrontmatter(readFileSync(new URL(`_en/${file}`, source), "utf8"));
    assert.equal(chinese.frontmatter.lang, "zh", file);
    assert.equal(english.frontmatter.lang, "en", file);
    assert.equal(english.frontmatter.draft, false, file);
    assert.equal(chinese.frontmatter.draft, false, file);
    assert.deepEqual(english.frontmatter.tags, chinese.frontmatter.tags, file);
    assert.deepEqual(english.frontmatter.pubDatetime, chinese.frontmatter.pubDatetime, file);
    assert.doesNotMatch(english.content, /\p{Script=Han}/u, file);

    // Text diagrams and comments are translated; executable examples keep their behavior.
    const examples = [chinese, english].map(({ content }) =>
      [...content.matchAll(/```(c|go|js|jsx|sql|yaml|json|bash|sh)\n([\s\S]*?)```/g)].map(
        ([, language, code]) => [
          language,
          code
            .split("\n")
            .filter((line) => !line.trim().startsWith("//"))
            .map((line) => line.trim())
            .filter(Boolean)
            .join("\n"),
        ],
      ),
    );
    assert.deepEqual(examples[1], examples[0], `Changed executable example in ${file}`);

    const slug = file.replace(/\.md$/, "");
    for (const [locale, own, other] of [
      ["en", english, chinese],
      ["zh", chinese, english],
    ]) {
      const prefix = locale === "zh" ? "zh/" : "";
      const html = readFileSync(new URL(`${prefix}posts/obsidian/${slug}/index.html`, dist), "utf8")
        .replaceAll("&amp;", "&")
        .replaceAll("&#39;", "'")
        .replaceAll("&apos;", "'")
        .replaceAll("&quot;", '"');
      const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].trim();
      assert.equal(heading, own.frontmatter.title, `${locale}/${slug}`);
      assert.ok(
        !html.includes(other.frontmatter.title),
        `Wrong-language post on ${locale}/${slug}`,
      );
      if (locale === "en") {
        const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
        assert.ok(article, slug);
        assert.doesNotMatch(article, /\p{Script=Han}/u, slug);
      }
      const switchTag = html.match(/<a\b[^>]*hreflang="(?:en|zh)"[^>]*>/)?.[0];
      const counterpart = locale === "en" ? `${base}/zh/` : `${base}/`;
      assert.ok(switchTag?.includes(`href="${counterpart}posts/obsidian/${slug}`), slug);

      const postPages = readdirSync(new URL(`${prefix}posts/`, dist), { recursive: true }).filter(
        (path) => /^(?:\d+\/)?index\.html$/.test(path),
      );
      const surfaces = [
        `${prefix}index.html`,
        `${prefix}archives/index.html`,
        `${prefix}rss.xml`,
        `${prefix}tags/${own.frontmatter.tags[0]}/index.html`,
        ...postPages.map((page) => `${prefix}posts/${page}`),
      ].map((path) =>
        readFileSync(new URL(path, dist), "utf8")
          .replaceAll("&amp;", "&")
          .replaceAll("&#39;", "'")
          .replaceAll("&apos;", "'")
          .replaceAll("&quot;", '"'),
      );
      for (const surface of surfaces) {
        assert.ok(
          !surface.includes(other.frontmatter.title),
          `Mixed languages on ${locale}/${slug}`,
        );
      }
      for (const surface of surfaces.slice(1, 4)) {
        assert.ok(surface.includes(own.frontmatter.title), `Missing ${locale}/${slug}`);
      }
      const listings = surfaces.slice(4).join("\n");
      assert.equal(listings.split(own.frontmatter.title).length - 1, 1, `${locale}/${slug}`);
      const feed = surfaces[2];
      assert.equal(feed.split(`<title>${own.frontmatter.title}</title>`).length - 1, 1, slug);
    }
  }

  const index = JSON.parse(readFileSync(new URL("pagefind/pagefind-entry.json", dist), "utf8"));
  assert.equal(index.languages.en.page_count, index.languages.zh.page_count);
});

test("GitHub Pages links and assets stay under the repository base and resolve", () => {
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
