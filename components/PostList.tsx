"use client";

import Link from "next/link";
import { useState } from "react";
import PostArt from "@/components/art/PostArt";
import PostIcon from "@/components/art/PostIcon";
import { dict, localize, type Locale } from "@/lib/i18n";
import { formatDate, type PostMeta, type Tag } from "@/lib/post-meta";
import styles from "./PostList.module.css";

const filters: ("all" | Tag)[] = ["all", "设计", "工程"];

/** Category tabs, the newest post as the featured one, and a row for each of the rest. */
export default function PostList({ posts, locale }: { posts: PostMeta[]; locale: Locale }) {
  const t = dict[locale];
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const shown = filter === "all" ? posts : posts.filter((post) => post.tag === filter);
  const [featured, ...rest] = shown;

  return (
    <section>
      <div className={styles.tabs} role="tablist">
        {filters.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={filter === name}
            className={filter === name ? `${styles.tab} ${styles.on}` : styles.tab}
            onClick={() => setFilter(name)}
          >
            {name === "all" ? t.all : t.tags[name]}
          </button>
        ))}
      </div>

      {featured && (
        <Link href={localize(locale, `/posts/${featured.slug}/`)} className={styles.featured}>
          <PostArt art={featured.art} size={160} />
          <div className={styles.featuredText}>
            <div className={styles.chips}>
              <span className={styles.chipSolid}>{t.latest}</span>
              <span className={styles.chip}>{t.tags[featured.tag]}</span>
            </div>
            <h2 className={styles.featuredTitle}>{featured.title}</h2>
            <p className={styles.description}>{featured.description}</p>
          </div>
          <span className={`label ${styles.minutes}`}>{t.minutes(featured.minutes)}</span>
        </Link>
      )}

      {rest.map((post) => (
        <Link key={post.slug} href={localize(locale, `/posts/${post.slug}/`)} className={styles.row}>
          <span className={styles.icon}>
            <PostIcon art={post.art} />
          </span>
          <span className={`label ${styles.date}`}>{formatDate(post.date)}</span>
          <span className={styles.title}>{post.title}</span>
          <span className={`label ${styles.minutes}`}>{t.minutes(post.minutes)}</span>
        </Link>
      ))}
    </section>
  );
}
