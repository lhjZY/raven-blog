import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import { dict, locales } from "@/lib/i18n";
import { getDrafts, getPosts } from "@/lib/posts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://liuhuanjun.top"),
  title: { default: "Raven", template: "%s / Raven" },
  description: dict.zh.description,
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Which posts exist in each language, so the switcher can land on the translation.
  const slugs = Object.fromEntries(locales.map((locale) => [locale, getPosts(locale).map((post) => post.slug)]));
  const draftSlugs = Object.fromEntries(locales.map((locale) => [locale, getDrafts(locale).map((post) => post.slug)]));
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader slugs={slugs} draftSlugs={draftSlugs} />
        <main>{children}</main>
        <footer className="page footer">
          <span className="mono">Raven</span>
          <span className="label">© 2026 Leo.h.Jay</span>
          <span className="footer-links label">
            <a href="https://github.com/lhjZY">GitHub</a>
            <a href="https://x.com/SevenLhj">X</a>
            <a href="mailto:leo.h.jay1998@gmail.com">Email</a>
          </span>
        </footer>
      </body>
    </html>
  );
}
