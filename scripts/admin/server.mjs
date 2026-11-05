// 本地写作后台：pnpm write，只监听本机。
// 直接读写 content/posts 下的 Markdown；草稿写 draft: true，不进博客，只列在「手稿」栏目。
// 文章以 id 标识：中文为 slug，英文为 en/slug，同名即互为译文。
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const POSTS = join(ROOT, "content/posts");
const PUBLIC = join(ROOT, "public");
const IMAGES = join(PUBLIC, "images/posts");
const PORT = Number(process.env.PORT) || 4341;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ID = /^(en\/)?[a-z0-9]+(-[a-z0-9]+)*$/;
const KEY_ORDER = ["title", "description", "date", "tag", "art", "draft"];
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

// ---------- frontmatter ----------

// 与 lib/posts.ts 的解析方式一致：每行一个 key: value，不支持多行和引号。
function parse(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: source };
  const data = Object.fromEntries(
    match[1]
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const colon = line.indexOf(":");
        return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
      }),
  );
  return { data, body: match[2].replace(/^\n+/, "") };
}

function serialize(data, body) {
  const keys = [...KEY_ORDER, ...Object.keys(data).filter((key) => !KEY_ORDER.includes(key))];
  const lines = keys
    .filter((key) => (key === "draft" ? data.draft === true : data[key] !== undefined && data[key] !== null))
    .map((key) => `${key}: ${String(data[key]).replace(/\s*\n\s*/g, " ").trim()}`);
  return `---\n${lines.join("\n")}\n---\n\n${body.replace(/^\n+/, "")}`;
}

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
}

// ---------- 文章 ----------

const langOf = (id) => (id.startsWith("en/") ? "en" : "zh");
const slugOf = (id) => id.replace(/^en\//, "");
const idOf = (lang, slug) => (lang === "en" ? `en/${slug}` : slug);
const otherLang = (lang) => (lang === "en" ? "zh" : "en");

function postPath(id) {
  if (!ID.test(id ?? "")) throw new HttpError(400, "网址只能使用小写字母、数字和连字符");
  return join(POSTS, `${id}.md`);
}

async function readPost(id) {
  const { data, body } = parse(await readFile(postPath(id), "utf8"));
  const lang = langOf(id);
  return {
    id,
    slug: slugOf(id),
    lang,
    translated: existsSync(postPath(idOf(otherLang(lang), slugOf(id)))),
    data: { ...data, draft: data.draft === "true" },
    body,
  };
}

async function summary(id) {
  const { slug, lang, data } = await readPost(id);
  return {
    id,
    slug,
    lang,
    title: data.title ?? "",
    date: data.date ?? "",
    draft: data.draft,
    mtime: (await stat(postPath(id))).mtimeMs,
  };
}

async function listIds(lang) {
  const dir = lang === "en" ? join(POSTS, "en") : POSTS;
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((file) => file.endsWith(".md")).map((file) => idOf(lang, file.slice(0, -3)));
}

// ---------- HTTP ----------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const json = async (req) => JSON.parse((await readBody(req)).toString("utf8") || "{}");

const routes = {
  "GET /api/posts": async () => {
    const ids = [...(await listIds("zh")), ...(await listIds("en"))];
    const posts = await Promise.all(ids.map(summary));
    return posts.sort((a, b) => b.draft - a.draft || b.date.localeCompare(a.date) || b.mtime - a.mtime);
  },

  "GET /api/post": async (_req, url) => readPost(url.searchParams.get("id")),

  // 传入 translationOf 时为该文章创建另一种语言的版本，沿用日期、分类和插图。
  "POST /api/post": async (req) => {
    const { translationOf } = await json(req);
    let id;
    let data = { title: "", description: "", date: today(), tag: "工程", art: "raven", draft: true };
    if (translationOf) {
      const source = await readPost(translationOf);
      id = idOf(otherLang(source.lang), source.slug);
      if (existsSync(postPath(id))) return { id };
      data = { ...data, date: source.data.date, tag: source.data.tag, art: source.data.art };
    } else {
      const base = `draft-${today()}`;
      id = base;
      for (let n = 2; existsSync(postPath(id)); n++) id = `${base}-${n}`;
    }
    await mkdir(dirname(postPath(id)), { recursive: true });
    await writeFile(postPath(id), serialize(data, ""));
    return { id };
  },

  "PUT /api/post": async (req) => {
    const { id, slug, lang, data, body } = await json(req);
    const current = await readPost(id);
    if (!SLUG.test(slug ?? "")) throw new HttpError(400, "网址只能使用小写字母、数字和连字符");
    const target = idOf(lang === "en" ? "en" : "zh", slug);
    if (target !== id) {
      if (!current.data.draft) throw new HttpError(400, "已发布文章的网址和语言不能修改");
      if (existsSync(postPath(target))) throw new HttpError(409, "这个网址已被其他文章使用");
      await mkdir(dirname(postPath(target)), { recursive: true });
      await rename(postPath(id), postPath(target));
    }
    // 发布状态只由发布和撤回操作修改。
    await writeFile(postPath(target), serialize({ ...data, draft: current.data.draft }, body));
    return { id: target };
  },

  "DELETE /api/post": async (_req, url) => {
    const { id, data } = await readPost(url.searchParams.get("id"));
    if (!data.draft) throw new HttpError(400, "已发布的文章需要先撤回为草稿");
    await unlink(postPath(id));
    return { ok: true };
  },

  // action: publish 发布草稿，unpublish 撤回为草稿。
  "POST /api/publish": async (req) => {
    const { id, action } = await json(req);
    if (action !== "publish" && action !== "unpublish") throw new HttpError(400, "未知操作");
    const post = await readPost(id);
    if (action === "publish") {
      if (!post.data.title?.trim() || !post.data.description?.trim())
        throw new HttpError(400, "发布前请填写标题和摘要");
      post.data.draft = false;
      post.data.date = today();
    } else {
      post.data.draft = true;
    }
    await writeFile(postPath(id), serialize(post.data, post.body));
    return { ok: true };
  },

  "POST /api/preview": async (req) => {
    const { body } = await json(req);
    return { html: new Marked().parse(body ?? "", { async: false }) };
  },

  "POST /api/upload": async (req, url) => {
    const ext = extname(url.searchParams.get("name") ?? "").toLowerCase();
    if (!MIME[ext] || ext === ".html" || ext === ".css") throw new HttpError(400, "仅支持图片文件");
    const name = `${randomBytes(6).toString("hex")}${ext}`;
    await mkdir(IMAGES, { recursive: true });
    await writeFile(join(IMAGES, name), await readBody(req));
    return { url: `/images/posts/${name}` };
  },
};

async function serveFile(res, file) {
  const data = await readFile(file);
  res.writeHead(200, { "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream" });
  res.end(data);
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const route = routes[`${req.method} ${url.pathname}`];
    if (route) {
      const result = await route(req, url);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify(result));
    }
    if (req.method === "GET" && url.pathname === "/") return await serveFile(res, join(ROOT, "scripts/admin/index.html"));
    // 预览直接使用博客的样式。
    if (req.method === "GET" && url.pathname === "/blog.css") return await serveFile(res, join(ROOT, "app/globals.css"));
    if (req.method === "GET") {
      const file = resolve(PUBLIC, "." + decodeURIComponent(url.pathname));
      if (file.startsWith(PUBLIC + sep) && existsSync(file)) return await serveFile(res, file);
    }
    throw new HttpError(404, "Not found");
  } catch (error) {
    const status = error.status ?? (error.code === "ENOENT" ? 404 : 500);
    res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.code === "ENOENT" ? "文章不存在" : error.message }));
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`写作后台：http://127.0.0.1:${PORT}`);
});
