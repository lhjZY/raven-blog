import Link from "next/link";
import { localize, type Locale } from "@/lib/i18n";
import { getPosts } from "@/lib/posts";
import styles from "./works.module.css";

interface Work {
  name: string;
  icon: string;
  tagline: string;
  summary: string;
  features: [string, string][];
  platform: string;
  links: { label: string; href: string }[];
  /** Slug of the post about this work; linked only when it exists in the page's language. */
  post: string;
}

const site = "https://lhjzy.github.io/raven-translate-native-site/";
const releases = "https://github.com/lhjZY/raven-translate-native-site/releases";

const copy: Record<Locale, { title: string; lede: string; read: string; works: Work[] }> = {
  zh: {
    title: "作品",
    lede: "给自己每天用的 macOS 小工具，也放出来给你用。",
    read: "读：",
    works: [
      {
        name: "Raven Translate",
        icon: "/works/raven-translate.png",
        tagline: "macOS 原生翻译、检查与学习",
        summary:
          "选中文本按下 ⌘1，译文就在原处等你。检查英文后直接写回，值得记住的句子收进词汇本，按时复习。",
        features: [
          ["翻译", "选中即译，支持多个翻译引擎"],
          ["检查", "检查英文语法与用词，一键写回"],
          ["学习", "收藏句子与场景，按时复习"],
        ],
        platform: "macOS 26 以上，Apple Silicon",
        links: [
          { label: "官网", href: site },
          { label: "下载", href: releases },
        ],
        post: "drawing-the-raven",
      },
      {
        name: "Raven Todo",
        icon: "/works/raven-todo.png",
        tagline: "按时间排好的三列看板",
        summary:
          "待办、今天、明天三列。晚上把任务拖到明天，第二天它自己出现在今天；没做完的留在今天，标着“昨天”。",
        features: [
          ["看板", "列由日期决定，零点自动顺延"],
          ["录入", "备注、子任务、日期和时间，一张卡片写完"],
          ["日历", "农历、节日、节气，以及法定节假日与调休"],
        ],
        platform: "macOS 26 以上，开发中",
        links: [],
        post: "raven-todo-prototypes",
      },
    ],
  },
  en: {
    title: "Works",
    lede: "Small macOS tools I make for my own days, shared for yours.",
    read: "Read: ",
    works: [
      {
        name: "Raven Translate",
        icon: "/works/raven-translate.png",
        tagline: "Native macOS translation, checking and learning",
        summary:
          "Select text and press ⌘1; the translation waits right where you are. Check your English and write it back, keep sentences worth remembering in a word book, and review them on schedule.",
        features: [
          ["Translate", "Translate on selection, with several engines"],
          ["Check", "Check English grammar and wording, write back in one step"],
          ["Learn", "Save sentences with their context and review on time"],
        ],
        platform: "macOS 26 or later, Apple Silicon",
        links: [
          { label: "Website", href: site },
          { label: "Download", href: releases },
        ],
        post: "drawing-the-raven",
      },
      {
        name: "Raven Todo",
        icon: "/works/raven-todo.png",
        tagline: "A three-column board ordered by time",
        summary:
          "Three columns: To do, Today and Tomorrow. Drag a task to Tomorrow at night and it shows up in Today the next day; unfinished ones stay in Today, marked “Yesterday”.",
        features: [
          ["Board", "Columns follow the date and roll over at midnight"],
          ["Entry", "Notes, subtasks, date and time, all on one card"],
          ["Calendar", "Lunar dates, festivals, solar terms, public holidays and make-up workdays"],
        ],
        platform: "macOS 26 or later, in development",
        links: [],
        post: "raven-todo-prototypes",
      },
    ],
  },
};

export const worksTitle = { zh: copy.zh.title, en: copy.en.title };

export default function WorksPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const posts = getPosts(locale);
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">{t.title}</h1>
        <p className="lede">{t.lede}</p>
      </aside>
      <section>
        {t.works.map((work) => {
          const post = posts.find((entry) => entry.slug === work.post);
          return (
            <article key={work.name} className={styles.work}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimisation */}
              <img src={work.icon} alt="" width={128} height={128} className={styles.icon} />
              <div className={styles.text}>
                <p className="label keep-case">{work.tagline}</p>
                <h2 className={styles.name}>{work.name}</h2>
                <p className={styles.summary}>{work.summary}</p>
                <dl className={styles.features}>
                  {work.features.map(([term, detail]) => (
                    <div key={term} className={styles.feature}>
                      <dt className="label">{term}</dt>
                      <dd>{detail}</dd>
                    </div>
                  ))}
                </dl>
                <div className={styles.footer}>
                  <span className="label keep-case">{work.platform}</span>
                  <span className={styles.links}>
                    {work.links.map((link) => (
                      <a key={link.href} href={link.href} className={styles.link}>
                        {link.label} ↗
                      </a>
                    ))}
                    {post && (
                      <Link href={localize(locale, `/posts/${post.slug}/`)} className={styles.link}>
                        {t.read}
                        {post.title}
                      </Link>
                    )}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
