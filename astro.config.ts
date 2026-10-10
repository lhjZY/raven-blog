import { defineConfig, envField, fontProviders, svgoOptimizer } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  base: "/raven-blog",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => config.features?.showArchives !== false || !page.endsWith("/archives/"),
    }),
    {
      name: "chinese-routes",
      hooks: {
        "astro:config:setup": ({ injectRoute }) => {
          // Reuse page entrypoints so both languages share content and pagination logic.
          for (const [pattern, entrypoint] of [
            ["/zh", "./src/pages/index.astro"],
            ["/zh/about", "./src/pages/about.astro"],
            ["/zh/search", "./src/pages/search.astro"],
            ["/zh/tags", "./src/pages/tags/index.astro"],
            ["/zh/archives", "./src/pages/archives/index.astro"],
            ["/zh/404", "./src/pages/404.astro"],
            ["/zh/posts/[...page]", "./src/pages/posts/[...page].astro"],
            ["/zh/tags/[tag]/[...page]", "./src/pages/tags/[tag]/[...page].astro"],
            ["/zh/posts/[...slug]", "./src/pages/posts/[...slug]/index.astro"],
            ["/zh/posts/[...slug]/index.png", "./src/pages/posts/[...slug]/index.png.ts"],
            ["/zh/rss.xml", "./src/pages/rss.xml.ts"],
          ]) {
            injectRoute({ pattern, entrypoint: new URL(entrypoint, import.meta.url) });
          }
        },
      },
    },
  ],
  i18n: {
    locales: ["en", "zh"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
