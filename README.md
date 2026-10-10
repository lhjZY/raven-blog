## A blog for myself

GitHub Pages: https://liuhuanjun.top/raven-blog/

`https://lhjzy.github.io/raven-blog/` 会沿用账户现有的自定义域名，自动跳转到上述地址。

推送到 `main` 后，`.github/workflows/deploy.yml` 自动安装依赖、检查代码、构建双语页面和搜索索引，再部署 `dist/`。也可以在 Actions 页面手动运行部署。仓库的 Settings → Pages → Source 使用 GitHub Actions。

本地启动：`pnpm dev`，访问 `http://localhost:4321/raven-blog/`；中文入口为 `/raven-blog/zh/`。构建与回归检查：`pnpm build`、`pnpm test:i18n`。

`astro-paper.config.ts` 的 `site.url` 设置部署域名，`astro.config.ts` 的 `base` 设置仓库路径。更换域名或仓库名时应同步修改这两项并重新构建。
