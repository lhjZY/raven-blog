# Raven 博客

Leo.h.Jay 的设计与开发笔记。Next.js（App Router）静态导出，版式参考 claude.dev，颜色取自 Radix Colors（sand 做中性色，amber 是小乌鸦的颜色）。

## 运行

```sh
pnpm install --ignore-workspace
pnpm dev      # http://localhost:4340
pnpm build    # 静态文件输出到 out/
pnpm write    # 写作后台 http://127.0.0.1:4341
```

## 写作

运行 `pnpm write`，在后台点击「新建」，填写标题、摘要和正文。改动自动保存到 `content/posts/`，`⌘S` 立即保存。

- 新文章是草稿，头部带 `draft: true`：`pnpm dev` 里能看到，`pnpm build` 会跳过。点击「发布」去掉草稿标记，日期更新为当天；「更多」里可以撤回为草稿或删除草稿。
- 「文章信息」设置网址、语言、日期、分类和插图。网址就是文件名，草稿阶段可以修改，发布后固定。
- 「更多」里的「添加英文版」以同名文件新建英文草稿，沿用日期、分类和插图；已有译文时变为「打开英文版」。
- 「分屏」和「预览」使用博客的 `globals.css`，与文章页排版一致。
- 正文里粘贴或拖入图片，文件存入 `public/images/posts/`。快捷键：`⌘B` 粗体，`⌘I` 斜体，`⌘K` 链接。
- 标题和摘要按单行保存；头部格式是每行一个 `key: value`，手动编辑时也保持这个格式。

## 结构

- `content/posts/*.md`：文章。头部写 `title`、`description`、`date`（yyyy-mm-dd）、`tag`（设计或工程）、`art`（board、raven、translate 或 calendar，对应文章的动画插图），草稿另加 `draft: true`。文件名就是网址里的 slug。
- `content/posts/en/*.md`：英文文章，与中文版同名即互为译文。可以只写一种语言。
- `lib/i18n.ts`：中英文界面文案和路径工具。中文在根路径，英文在 `/en/`；页头的语言切换（快捷键 L）进入当前页面的另一语言版本，文章没有译文时进入另一语言的博客首页。
- `components/pages/`：各页面的内容组件，`app/` 与 `app/en/` 下的路由共用。
- `scripts/admin/`：本地写作后台，`pnpm write` 启动。
- `lib/posts.ts`：读取文章、渲染 Markdown、收集二级标题做目录、估算阅读时间。
- `components/art/`：四幅动画插图（琥珀色方块上的线稿）和列表里的小图标。新文章想要新插图，在 `PostArt.tsx` 里加一个。
- `components/RavenLogo.tsx`：页头的小乌鸦，会眨眼，悬停时跳一下。
- 页面：`app/page.tsx` 博客，`app/works/` 作品，`app/about/` 关于，`app/posts/[slug]/` 文章。

按 B、W、A 在三个栏目间切换，按 L 切换语言。动画在系统开启“减少动态效果”时停止。
