## A blog for myself

GitHub Pages: https://liuhuanjun.top/

博客部署在自定义域名根路径，中文入口为 `https://liuhuanjun.top/zh/`。

推送到 `main` 后，`.github/workflows/deploy.yml` 自动安装依赖、检查代码、构建双语页面和搜索索引，再部署 `dist/`。也可以在 Actions 页面手动运行部署。仓库的 Settings → Pages → Source 使用 GitHub Actions。

本地启动：`pnpm dev`，访问 `http://localhost:4321/`；中文入口为 `/zh/`。构建与回归检查：`pnpm build`、`pnpm test:i18n`。

`astro-paper.config.ts` 的 `site.url` 设置为 `https://liuhuanjun.top/`，`astro.config.ts` 不设置仓库路径 `base`，使页面、静态资源、RSS 和搜索索引从域名根路径加载。仓库 Settings → Pages → Custom domain 应设置为 `liuhuanjun.top`，并启用 Enforce HTTPS。更换域名后需同步更新站点配置并重新构建部署。

## 在浏览器里写文章

写作入口：[Pages CMS](https://app.pagescms.org/)。仓库根目录的 `.pages.yml` 定义了文章表单和图片上传目录，继续使用现有 Astro 博客和 GitHub Actions 部署。

### 首次连接

1. 将本次接入改动提交并推送到 GitHub 的 `main` 分支，Pages CMS 才能读取配置。
2. 打开 Pages CMS，用拥有 `lhjZY/raven-blog` 写入权限的 GitHub 账号登录。
3. 按提示安装 Pages CMS GitHub App，选择 **Only select repositories**，授权 `raven-blog`。
4. 打开 `lhjZY/raven-blog`，选择 `main` 分支，进入「博客文章」。如果仍提示创建配置，先检查所选分支上是否已有 `.pages.yml`。

托管后台负责登录和写入 GitHub，不需要在博客中添加密钥或部署后台服务。首次登录与 GitHub App 安装需要由账号所有者完成。[官方接入说明](https://pagescms.org/docs/quick-start/)

### 日常写作与发布

1. 在「博客文章」中新建文章，填写标题、摘要和正文。默认中文、作者 Raven、草稿状态，发布时间自动填写为当前时间。
2. 文件名默认由日期和时间生成，避免纯中文标题生成空文件名；新建时也可以调整为 `2026-10-23-react-state.md`。文件路径决定文章网址，发布后保持稳定；修改标题不需要修改文件名。
3. 在正文编辑器里插入图片；上传文件存入 `public/images/blog/`，正文使用 `/images/blog/...` 地址。也可以上传可选的分享封面。
4. 写作过程中保留「保存为草稿」，点击 Save 保存到 GitHub。
5. 准备发布时检查发布时间，关闭「保存为草稿」并保存。到 [GitHub Actions](https://github.com/lhjZY/raven-blog/actions) 查看部署状态，成功后访问 [中文博客](https://liuhuanjun.top/zh/)。

Pages CMS 每次保存都会提交所选分支；在 `main` 保存会触发当前部署工作流。已有公开文章的修改也会随成功部署上线。后续在本地开发前先拉取远端变更。

### 编辑约定

- 新文章使用 `.md`。含组件的 `.mdx` 文件和文章内的 `assets` 目录不进入写作列表，已有文件仍参与博客构建。
- 正文可在可视化编辑和 Source 模式之间切换。复杂代码块、HTML 和特殊 Markdown 建议使用 Source 模式；编辑器预览与博客最终排版可能不同。
- 日期使用带毫秒和时区的格式，例如 `2026-10-23T09:00:00.000+08:00`，与 Pages CMS 的日期控件一致。接入时仅为可编辑文章中缺少毫秒的日期补上 `.000`，对应时间点不变。以后手动添加日期也请沿用此格式。
- 最后更新时间可以留空。旧文章中未列入表单的字段会保留；未设置语言的旧文章原本会出现在两种语言页面，编辑时应检查语言选择。
- 草稿会保存到 GitHub，但不会生成博客页面，本地开发也会隐藏。当前接入提供编辑器内预览，未增加完整博客的草稿预览部署。
- 未来发布时间不会触发定时发布；到时需要再次保存或手动运行部署工作流。
- 如需英文版本，可在对应的 `_en` 子目录创建同名文件并选择 English，沿用现有中英文文章组织方式。
- 可以只发布一种语言。没有对应译文时，语言切换会进入另一语言的文章列表；没有对应标签或分页时，回到另一语言的列表首页。
