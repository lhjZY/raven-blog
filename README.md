## A blog for myself

GitHub Pages: https://liuhuanjun.top/

博客部署在自定义域名根路径，中文入口为 `https://liuhuanjun.top/zh/`。

推送到 `main` 后，`.github/workflows/deploy.yml` 自动安装依赖、检查代码、构建双语页面和搜索索引，再部署 `dist/`。也可以在 Actions 页面手动运行部署。仓库的 Settings → Pages → Source 使用 GitHub Actions。

本地启动：`pnpm dev`，访问 `http://localhost:4321/`；中文入口为 `/zh/`。构建与回归检查：`pnpm build`、`pnpm test:i18n`。

`astro-paper.config.ts` 的 `site.url` 设置为 `https://liuhuanjun.top/`，`astro.config.ts` 不设置仓库路径 `base`，使页面、静态资源、RSS 和搜索索引从域名根路径加载。仓库 Settings → Pages → Custom domain 应设置为 `liuhuanjun.top`，并启用 Enforce HTTPS。更换域名后需同步更新站点配置并重新构建部署。
