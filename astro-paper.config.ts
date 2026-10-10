import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://lhjzy.github.io/",
    title: "Leo.h.Jay",
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
    { name: "mail", url: "leo.h.jay1998@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
