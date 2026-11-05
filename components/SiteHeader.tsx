"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { dict, htmlLang, localeOf, localize, unlocalize, type Locale } from "@/lib/i18n";
import RavenLogo from "./RavenLogo";
import styles from "./SiteHeader.module.css";

type Slugs = Record<string, string[]>;

// The letter in brackets is the item's keyboard shortcut. Paths are without the /en prefix.
const nav = [
  { key: "B", name: "blog", href: "/", matches: (path: string) => path === "/" || path.startsWith("/posts/") },
  { key: "W", name: "works", href: "/works/", matches: (path: string) => path.startsWith("/works") },
  { key: "D", name: "drafts", href: "/drafts/", matches: (path: string) => path.startsWith("/drafts") },
  { key: "A", name: "about", href: "/about/", matches: (path: string) => path.startsWith("/about") },
] as const;

/** The same page in the other language; a post or draft without a translation falls back to its list. */
function switchHref(path: string, slugs: Slugs, draftSlugs: Slugs): string {
  const other: Locale = localeOf(path) === "zh" ? "en" : "zh";
  const base = unlocalize(path);
  const post = base.match(/^\/posts\/([^/]+)\/?$/)?.[1];
  const draft = base.match(/^\/drafts\/([^/]+)\/?$/)?.[1];
  if (post && !slugs[other]?.includes(post)) return localize(other, "/");
  if (draft && !draftSlugs[other]?.includes(draft)) return localize(other, "/drafts/");
  return localize(other, base);
}

export default function SiteHeader({ slugs, draftSlugs }: { slugs: Slugs; draftSlugs: Slugs }) {
  const path = usePathname();
  const router = useRouter();
  const locale = localeOf(path);
  const base = unlocalize(path);
  const t = dict[locale];
  const other = switchHref(path, slugs, draftSlugs);

  // The root layout renders zh-CN; keep <html lang> in step with the page.
  useEffect(() => {
    document.documentElement.lang = htmlLang[locale];
  }, [locale]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable]")) return;
      const key = event.key.toLowerCase();
      if (key === "l") return router.push(other);
      const item = nav.find((entry) => entry.key.toLowerCase() === key);
      if (item) router.push(localize(locale, item.href));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, locale, other]);

  return (
    <header className={`page ${styles.header}`}>
      <Link href={localize(locale, "/")} className={styles.logo} aria-label={t.home}>
        <RavenLogo />
      </Link>
      <nav className={styles.nav}>
        {nav.map((item) => {
          const active = item.matches(base);
          return (
            <Link
              key={item.key}
              href={localize(locale, item.href)}
              className={active ? `${styles.item} ${styles.active}` : styles.item}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.key}>[{item.key}]</span> {t[item.name]}
            </Link>
          );
        })}
      </nav>
      <Link href={other} className={`${styles.item} ${styles.lang}`} hrefLang={locale === "zh" ? "en" : "zh-CN"}>
        <span className={styles.key}>[L]</span> {t.switchTo}
      </Link>
    </header>
  );
}
