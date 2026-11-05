import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleAside from "@/components/ArticleAside";
import { alternates, dict, localize, type Locale } from "@/lib/i18n";
import { formatDate, getDrafts, getPost } from "@/lib/posts";
import { Circled, Clip, HandFonts } from "./DraftBits";
import styles from "./drafts.module.css";

// A static export needs at least one page per dynamic route, so a language without drafts gets a
// placeholder that renders the 404 page.
const placeholder = "none";

export function draftParams(locale: Locale) {
  const slugs = getDrafts(locale).map((draft) => ({ slug: draft.slug }));
  return slugs.length ? slugs : [{ slug: placeholder }];
}

function findDraft(locale: Locale, slug: string) {
  if (!getDrafts(locale).some((draft) => draft.slug === slug)) notFound();
  return getPost(locale, slug);
}

export function draftMetadata(locale: Locale, slug: string): Metadata {
  const draft = findDraft(locale, slug);
  const other = locale === "zh" ? "en" : "zh";
  const translated = getDrafts(other).some((entry) => entry.slug === slug);
  return {
    title: draft.title,
    description: draft.description,
    alternates: translated ? alternates(`/drafts/${slug}/`) : undefined,
  };
}

/** An unfinished article, written out by hand on one long sheet of ruled paper. */
export default function DraftPostPage({ locale, slug }: { locale: Locale; slug: string }) {
  const draft = findDraft(locale, slug);
  const t = dict[locale];
  return (
    <div className={`page split ${styles.vars}`}>
      <HandFonts />
      <ArticleAside headings={draft.headings} minutes={draft.minutes} locale={locale} />
      <article id="article" className={styles.paper}>
        <Clip />
        <p className={`label ${styles.meta}`}>
          <Circled>{t.draftMark}</Circled>
          <span>{formatDate(draft.date)}</span>
          <span>{t.tags[draft.tag]}</span>
          <span>{t.readTime(draft.minutes)}</span>
        </p>
        <h1 className={styles.name}>{draft.title}</h1>
        <div className={`prose ${styles.writing}`} dangerouslySetInnerHTML={{ __html: draft.html }} />
        <Link href={localize(locale, "/drafts/")} className={styles.back}>
          {t.allDrafts}
        </Link>
      </article>
    </div>
  );
}
