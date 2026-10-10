import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://liuhuanjun.top/",
    title: "Raven",
    description: "Leo.h.Jay's blog",
    author: "Leo.h.Jay",
    profile: "https://lhjzy.github.io/",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  socials: [
    { name: "github", url: "https://github.com/lhjZY" },
    { name: "x", url: "https://x.com/SevenLhj" },
    { name: "mail", url: "mailto:leo.h.jay1998@gmail.com" },
  ],
});
