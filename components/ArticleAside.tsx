"use client";

import { useEffect, useState } from "react";
import { dict, type Locale } from "@/lib/i18n";
import styles from "./ArticleAside.module.css";

const cells = 20;

/** The article's sections, the one being read highlighted, and a text progress bar. */
export default function ArticleAside({
  headings,
  minutes,
  locale,
}: {
  headings: { id: string; text: string }[];
  minutes: number;
  locale: Locale;
}) {
  const t = dict[locale];
  const [current, setCurrent] = useState(headings[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const article = document.getElementById("article");
      if (!article) return;
      const box = article.getBoundingClientRect();
      const total = box.height - window.innerHeight;
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, -box.top / total)));
      // The current section is the last one whose heading has passed the top third.
      let active = headings[0]?.id;
      for (const { id } of headings) {
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top < window.innerHeight / 3) active = id;
      }
      setCurrent(active);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  const filled = Math.round(progress * cells);
  return (
    <aside className={styles.aside}>
      <p className="label">{t.contents}</p>
      <ol className={styles.toc}>
        {headings.map(({ id, text }) => (
          <li key={id}>
            <a href={`#${id}`} className={id === current ? styles.current : undefined}>
              <span className={styles.branch}>└</span> {text}
            </a>
          </li>
        ))}
      </ol>
      <p className={`label ${styles.progress}`} aria-label={t.progress(Math.round(progress * 100))}>
        <span className={styles.bar}>
          <span className={styles.filled}>{"▓".repeat(filled)}</span>
          {"░".repeat(cells - filled)}
        </span>
        <span>{String(Math.round(progress * 100)).padStart(2, "0")}%</span>
      </p>
      <p className="label">{t.readTime(minutes)}</p>
    </aside>
  );
}
