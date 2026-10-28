import type { Metadata } from "next";
import Link from "next/link";
import styles from "./works.module.css";

export const metadata: Metadata = { title: "作品" };

const works = [
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
      { label: "官网", href: "https://lhjzy.github.io/raven-translate-native-site/" },
      { label: "下载", href: "https://github.com/lhjZY/raven-translate-native-site/releases" },
    ],
    post: { label: "给 App 画一只小乌鸦", href: "/posts/drawing-the-raven/" },
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
    post: { label: "Raven Todo：先做原型，再写代码", href: "/posts/raven-todo-prototypes/" },
  },
];

export default function WorksPage() {
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">作品</h1>
        <p className="lede">给自己每天用的 macOS 小工具，也放出来给你用。</p>
      </aside>
      <section>
        {works.map((work) => (
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
                  <Link href={work.post.href} className={styles.link}>
                    读：{work.post.label}
                  </Link>
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
