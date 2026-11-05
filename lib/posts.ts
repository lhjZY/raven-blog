import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import type { ArtName } from "@/components/art/PostArt";
import type { Locale } from "./i18n";
import type { DraftMeta, PostMeta, Tag } from "./post-meta";

export { formatDate, type DraftMeta, type PostMeta, type Tag } from "./post-meta";

export interface Post extends DraftMeta {
  html: string;
  /** The h2 sections, for the table of contents. */
  headings: { id: string; text: string }[];
}

// Chinese posts sit in content/posts, their English versions under content/posts/en with the same slug.
const root = path.join(process.cwd(), "content/posts");
const directory = (locale: Locale) => (locale === "en" ? path.join(root, "en") : root);

/** Published posts in one language, newest first. */
export function getPosts(locale: Locale): PostMeta[] {
  return list(locale, false).map(({ outline: _outline, ...meta }) => meta);
}

/** Unfinished posts in one language, newest first. They live under 手稿, not in the blog. */
export function getDrafts(locale: Locale): DraftMeta[] {
  return list(locale, true);
}

function list(locale: Locale, drafts: boolean): DraftMeta[] {
  if (!fs.existsSync(directory(locale))) return [];
  return fs
    .readdirSync(directory(locale))
    .filter((file) => file.endsWith(".md"))
    .map((file) => readPost(locale, file.replace(/\.md$/, "")))
    .filter((post) => post.draft === drafts)
    .map(({ html: _html, headings: _headings, ...meta }) => meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(locale: Locale, slug: string): Post {
  return readPost(locale, slug);
}

function readPost(locale: Locale, slug: string): Post {
  const source = fs.readFileSync(path.join(directory(locale), `${slug}.md`), "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${slug}.md has no front matter`);
  const fields = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }),
  );
  const body = match[2];
  const { html, headings } = render(body);
  return {
    slug,
    title: fields.title,
    description: fields.description,
    date: fields.date,
    tag: fields.tag as Tag,
    art: fields.art as ArtName,
    draft: fields.draft === "true",
    minutes: readingMinutes(locale, body),
    outline: outlineOf(body),
    html,
    headings,
  };
}

/** The h2 sections; one with no text under it is not written yet. */
function outlineOf(body: string) {
  return body
    .split(/^## +/m)
    .slice(1)
    .map((section) => {
      const [heading, ...rest] = section.split("\n");
      return { text: heading.trim(), done: rest.join("\n").trim().length > 0 };
    });
}

// About 400 characters a minute for Chinese and 200 words for English, counting code as text.
function readingMinutes(locale: Locale, body: string) {
  const amount =
    locale === "en" ? body.split(/\s+/).filter(Boolean).length / 200 : body.replace(/\s+/g, "").length / 400;
  return Math.max(1, Math.round(amount));
}

function render(markdown: string) {
  const headings: Post["headings"] = [];
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${inner}</h${depth}>\n`;
        const id = `section-${headings.length + 1}`;
        headings.push({ id, text });
        return `<h2 id="${id}">${inner}</h2>\n`;
      },
    },
  });
  const html = marked.parse(markdown, { async: false });
  return { html, headings };
}
