"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import RavenLogo from "./RavenLogo";
import styles from "./SiteHeader.module.css";

// The letter in brackets is the item's keyboard shortcut.
const nav = [
  { key: "B", label: "博客", href: "/", matches: (path: string) => path === "/" || path.startsWith("/posts/") },
  { key: "W", label: "作品", href: "/works/", matches: (path: string) => path.startsWith("/works") },
  { key: "A", label: "关于", href: "/about/", matches: (path: string) => path.startsWith("/about") },
];

export default function SiteHeader() {
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, [contenteditable]")) return;
      const item = nav.find((entry) => entry.key.toLowerCase() === event.key.toLowerCase());
      if (item) router.push(item.href);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className={`page ${styles.header}`}>
      <Link href="/" className={styles.logo} aria-label="Raven 首页">
        <RavenLogo />
      </Link>
      <nav className={styles.nav}>
        {nav.map((item) => {
          const active = item.matches(path);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={active ? `${styles.item} ${styles.active}` : styles.item}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.key}>[{item.key}]</span> {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
