import type { Metadata } from "next";
import Link from "next/link";
import ArticleAside from "@/components/ArticleAside";
import PostArt from "@/components/art/PostArt";
import { formatDate, getPost, getPosts } from "@/lib/posts";
import styles from "./post.module.css";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = getPost((await params).slug);
  return { title: post.title, description: post.description };
}

export default async function PostPage({ params }: Params) {
  const post = getPost((await params).slug);
  return (
    <div className="page split">
      <ArticleAside headings={post.headings} minutes={post.minutes} />
      <article id="article">
        <header className={styles.hero}>
          <PostArt art={post.art} size={96} />
          <h1 className={styles.title}>{post.title}</h1>
          <p className={`label ${styles.meta}`}>
            <span>{formatDate(post.date)}</span>
            <span>{post.tag}</span>
            <span>{post.minutes} 分钟阅读</span>
          </p>
        </header>
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        <Link href="/" className={`label ${styles.back}`}>
          ← 所有文章
        </Link>
      </article>
    </div>
  );
}
