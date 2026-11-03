import RavenLogo from "@/components/RavenLogo";
import type { Locale } from "@/lib/i18n";
import styles from "./about.module.css";

const contacts = [
  { label: "GitHub", value: "lhjZY", href: "https://github.com/lhjZY" },
  { label: "X", value: "@SevenLhj", href: "https://x.com/SevenLhj" },
  { label: "Email", value: "leo.h.jay1998@gmail.com", href: "mailto:leo.h.jay1998@gmail.com" },
];

const copy = {
  zh: {
    title: "关于",
    intro: [
      "你好，我是 Leo。我在 macOS 上做一些自己每天都会用的小工具：读英文用的 Raven Translate，排日程用的 Raven Todo。",
      "这个博客记录做它们时的设计和工程决定：为什么这样选，试过什么，又推翻了什么。写下来，是为了下次少走一遍弯路。",
    ],
    mascotTitle: "页头的小乌鸦",
    mascot:
      "它叫 Raven，来自 Raven Todo 的图标：圆身子，两片叶子一样的头毛，手里捧着一张清单。每隔几秒，它会眨一下眼；把鼠标移到它身上，它会跳一下。",
    contact: "联系",
    siteTitle: "这个站点",
    site: "用 Next.js 静态导出，版式参考了 claude.dev，颜色取自 Radix Colors。按 B、W、A 可以在博客、作品和关于之间切换，按 L 切换语言。",
  },
  en: {
    title: "About",
    intro: [
      "Hi, I'm Leo. I make small macOS tools I use every day: Raven Translate for reading English, and Raven Todo for planning my days.",
      "This blog records the design and engineering decisions behind them: why I chose what I chose, what I tried, and what I threw away. Writing it down saves me the detour next time.",
    ],
    mascotTitle: "The raven in the header",
    mascot:
      "Its name is Raven, and it comes from the Raven Todo icon: a round body, two leaf-shaped tufts, and a checklist in its hands. Every few seconds it blinks; hover over it and it hops.",
    contact: "Contact",
    siteTitle: "This site",
    site: "A static Next.js export, laid out after claude.dev, with colours from Radix Colors. Press B, W or A to move between Blog, Works and About, and L to switch language.",
  },
};

export default function AboutPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">{t.title}</h1>
        <p className="lede">Leo.h.Jay</p>
      </aside>
      <section>
        <div className="prose">
          {t.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className={styles.mascot}>
          <RavenLogo size={72} />
          <div>
            <h2 className={styles.heading}>{t.mascotTitle}</h2>
            <p className={styles.text}>{t.mascot}</p>
          </div>
        </div>

        <h2 className={`label ${styles.section}`}>{t.contact}</h2>
        <dl className={styles.contacts}>
          {contacts.map((contact) => (
            <div key={contact.label} className={styles.contact}>
              <dt className="label">{contact.label}</dt>
              <dd>
                <a href={contact.href}>{contact.value}</a>
              </dd>
            </div>
          ))}
        </dl>

        <h2 className={`label ${styles.section}`}>{t.siteTitle}</h2>
        <p className={styles.text}>{t.site}</p>
      </section>
    </div>
  );
}

export const aboutTitle = { zh: copy.zh.title, en: copy.en.title };
