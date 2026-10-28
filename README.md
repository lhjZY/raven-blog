# Raven（新版博客）

Leo.h.Jay 的设计与开发笔记。Next.js（App Router）静态导出，版式参考 claude.dev，颜色取自 Radix Colors（sand 做中性色，amber 是小乌鸦的颜色）。

## 运行

```sh
pnpm install --ignore-workspace
pnpm dev      # http://localhost:4340
pnpm build    # 静态文件输出到 out/
```

## 结构

- `content/posts/*.md`：文章。头部写 `title`、`description`、`date`（yyyy-mm-dd）、`tag`（设计或工程）、`art`（board、raven 或 calendar，对应文章的动画插图）。文件名就是网址里的 slug。
- `lib/posts.ts`：读取文章、渲染 Markdown、收集二级标题做目录、估算阅读时间。
- `components/art/`：三幅动画插图（琥珀色方块上的线稿）和列表里的小图标。新文章想要新插图，在 `PostArt.tsx` 里加一个。
- `components/RavenLogo.tsx`：页头的小乌鸦，会眨眼，悬停时跳一下。
- 页面：`app/page.tsx` 博客，`app/works/` 作品，`app/about/` 关于，`app/posts/[slug]/` 文章。

按 B、W、A 在三个栏目间切换。动画在系统开启“减少动态效果”时停止。
