import type { ReactNode } from "react";
import styles from "./drafts.module.css";

/** Latin handwriting from Caveat, Chinese from Long Cang. Falls back to cursive if Google Fonts is unreachable. */
export function HandFonts() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Long+Cang&display=swap"
      precedence="default"
    />
  );
}

/** A hand-drawn paper clip on a sheet's corner. */
export function Clip() {
  return (
    <svg className={styles.clip} viewBox="0 0 20 56" aria-hidden="true">
      <path d="M6 20V9a4 4 0 0 1 8 0v34a7 7 0 0 1-14 0V16" />
    </svg>
  );
}

/** A wobbly checkbox, ticked or empty. */
export function Box({ done }: { done: boolean }) {
  return (
    <svg className={styles.box} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5C9 4.5 15 5 20 4.5C19.5 10 20.5 15 19.5 20C14 20.5 9 19.5 4.5 20C5 15 4 10 4 5.5Z" />
      {done && <path className={styles.tick} d="M7 12.5L11 17C13 11 16 7 21 2.5" />}
    </svg>
  );
}

/** A word circled in red pen. */
export function Circled({ children }: { children: ReactNode }) {
  return (
    <span className={styles.circle}>
      {children}
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M7 23C3 9 30 3 55 4C85 5 99 14 94 26C89 38 60 38 36 36C13 34 2 29 9 13" />
      </svg>
    </span>
  );
}
