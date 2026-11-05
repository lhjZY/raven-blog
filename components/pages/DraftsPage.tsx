import Link from "next/link";
import { dict, localize, type Locale } from "@/lib/i18n";
import { formatDate, getDrafts } from "@/lib/posts";
import { Box, Circled, Clip, HandFonts } from "./DraftBits";
import styles from "./drafts.module.css";

export const draftsTitle = { zh: "手稿", en: "Drafts" };

const tilts = [0.5, -0.8, 1.2, -0.4, -1.2, 0.9];

/** Unfinished articles as pinned sheets, each with its outline and how much of it is written. */
export default function DraftsPage({ locale }: { locale: Locale }) {
  const t = dict[locale];
  const drafts = getDrafts(locale);
  return (
    <div className={`page ${styles.vars} ${styles.index}`}>
      <HandFonts />
      <header className={styles.head}>
        <h1 className="site-title">{t.drafts}</h1>
        <p className={styles.lede}>{t.draftsLede}</p>
      </header>
      <div className={styles.grid}>
        {drafts.length === 0 && (
          <div className={styles.sheet} style={{ ["--tilt" as string]: "-0.8deg" }}>
            <p className={`label ${styles.date}`}>{t.drafts}</p>
            <p className={styles.line}>{t.noDrafts}</p>
          </div>
        )}
        {drafts.map((draft, i) => {
          const written = draft.outline.filter((section) => section.done).length;
          return (
            <Link
              key={draft.slug}
              href={localize(locale, `/drafts/${draft.slug}/`)}
              className={styles.sheet}
              style={{ ["--tilt" as string]: `${tilts[i % tilts.length]}deg` }}
            >
              <Clip />
              <p className={`label ${styles.date}`}>{formatDate(draft.date)}</p>
              <h2 className={styles.title}>{draft.title}</h2>
              <p className={styles.line}>{draft.description}</p>
              {draft.outline.map((section) => (
                <p key={section.text} className={`${styles.line} ${styles.todo}`}>
                  <Box done={section.done} />
                  <span>{section.text}</span>
                </p>
              ))}
              {draft.outline.length > 0 && (
                <p className={`${styles.line} ${styles.progress}`}>
                  <Circled>
                    {written}/{draft.outline.length}
                  </Circled>
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
