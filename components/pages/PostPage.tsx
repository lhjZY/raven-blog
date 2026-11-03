import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleAside from "@/components/ArticleAside";
import PostArt from "@/components/art/PostArt";
import RollingStamp from "@/components/stamp/RollingStamp";
import { alternates, dict, localize, type Locale } from "@/lib/i18n";
import { formatDate, getPost, getPosts } from "@/lib/posts";
import styles from "./post.module.css";

// A static export needs at least one page per dynamic route, so a language without posts yet gets a
// placeholder that renders the 404 page.
const placeholder = "none";

export function postParams(locale: Locale) {
  const slugs = getPosts(locale).map((post) => ({ slug: post.slug }));
  return slugs.length ? slugs : [{ slug: placeholder }];
}

function findPost(locale: Locale, slug: string) {
  if (!getPosts(locale).some((post) => post.slug === slug)) notFound();
  return getPost(locale, slug);
}

export function postMetadata(locale: Locale, slug: string): Metadata {
  const post = findPost(locale, slug);
  const other = locale === "zh" ? "en" : "zh";
  const translated = getPosts(other).some((entry) => entry.slug === slug);
  return {
    title: post.title,
    description: post.description,
    alternates: translated ? alternates(`/posts/${slug}/`) : undefined,
  };
}

export default function PostPage({ locale, slug }: { locale: Locale; slug: string }) {
  const post = findPost(locale, slug);
  const t = dict[locale];
  return (
    <div className="page split">
      <ArticleAside headings={post.headings} minutes={post.minutes} locale={locale} />
      <article id="article">
        <header className={styles.hero}>
          <PostArt art={post.art} size={96} />
          <h1 className={styles.title}>{post.title}</h1>
          <p className={`label ${styles.meta}`}>
            <span>{formatDate(post.date)}</span>
            <span>{t.tags[post.tag]}</span>
            <span>{t.readTime(post.minutes)}</span>
          </p>
        </header>
        <RollingStamp />
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        <Link href={localize(locale, "/")} className={`label ${styles.back}`}>
          {t.allPosts}
        </Link>
      </article>
    </div>
  );
}
