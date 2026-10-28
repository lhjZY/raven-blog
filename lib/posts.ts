import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import type { ArtName } from "@/components/art/PostArt";
import type { PostMeta, Tag } from "./post-meta";

export { formatDate, type PostMeta, type Tag } from "./post-meta";

export interface Post extends PostMeta {
  html: string;
  /** The h2 sections, for the table of contents. */
  headings: { id: string; text: string }[];
}

const directory = path.join(process.cwd(), "content/posts");

/** Posts, newest first. */
export function getPosts(): PostMeta[] {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readPost(file.replace(/\.md$/, "")))
    .map(({ html: _html, headings: _headings, ...meta }) => meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post {
  return readPost(slug);
}

function readPost(slug: string): Post {
  const source = fs.readFileSync(path.join(directory, `${slug}.md`), "utf8");
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
    // About 400 characters a minute for Chinese, counting code as text.
    minutes: Math.max(1, Math.round(body.replace(/\s+/g, "").length / 400)),
    html,
    headings,
  };
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
