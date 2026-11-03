import type { Tag } from "./post-meta";

// Chinese lives at the root, English under /en. Shared with client components.

export type Locale = "zh" | "en";

export const locales: Locale[] = ["zh", "en"];

export const htmlLang: Record<Locale, string> = { zh: "zh-CN", en: "en" };

export function localeOf(path: string): Locale {
  return path === "/en" || path.startsWith("/en/") ? "en" : "zh";
}

/** "/about/" → "/en/about/" for English. */
export function localize(locale: Locale, path: string): string {
  return locale === "en" ? `/en${path}` : path;
}

/** "/en/about/" → "/about/". */
export function unlocalize(path: string): string {
  return path.replace(/^\/en(?=\/|$)/, "") || "/";
}

/** hreflang links for a page that exists in both languages. */
export function alternates(path: string) {
  return { languages: { "zh-CN": path, en: localize("en", path) } };
}

export const dict = {
  zh: {
    description: "Leo.h.Jay 的设计与开发笔记。",
    blog: "博客",
    works: "作品",
    about: "关于",
    home: "Raven 首页",
    switchTo: "English",
    all: "全部",
    tags: { 设计: "设计", 工程: "工程" } satisfies Record<Tag, string>,
    latest: "最新",
    minutes: (n: number) => `${n} 分钟`,
    readTime: (n: number) => `${n} 分钟阅读`,
    contents: "目录",
    progress: (percent: number) => `已读 ${percent}%`,
    allPosts: "← 所有文章",
    notFound: "这一页不存在。",
    backHome: "← 回到博客",
  },
  en: {
    description: "Design and engineering notes by Leo.h.Jay.",
    blog: "Blog",
    works: "Works",
    about: "About",
    home: "Raven home",
    switchTo: "中文",
    all: "All",
    tags: { 设计: "Design", 工程: "Engineering" } satisfies Record<Tag, string>,
    latest: "Latest",
    minutes: (n: number) => `${n} min`,
    readTime: (n: number) => `${n} min read`,
    contents: "Contents",
    progress: (percent: number) => `${percent}% read`,
    allPosts: "← All posts",
    notFound: "This page doesn't exist.",
    backHome: "← Back to the blog",
  },
};
