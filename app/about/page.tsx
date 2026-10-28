import type { Metadata } from "next";
import RavenLogo from "@/components/RavenLogo";
import styles from "./about.module.css";

export const metadata: Metadata = { title: "关于" };

const contacts = [
  { label: "GitHub", value: "lhjZY", href: "https://github.com/lhjZY" },
  { label: "X", value: "@SevenLhj", href: "https://x.com/SevenLhj" },
  { label: "Email", value: "leo.h.jay1998@gmail.com", href: "mailto:leo.h.jay1998@gmail.com" },
];

export default function AboutPage() {
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">关于</h1>
        <p className="lede">Leo.h.Jay</p>
      </aside>
      <section>
        <div className="prose">
          <p>
            你好，我是 Leo。我在 macOS 上做一些自己每天都会用的小工具：读英文用的 Raven
            Translate，排日程用的 Raven Todo。
          </p>
          <p>
            这个博客记录做它们时的设计和工程决定：为什么这样选，试过什么，又推翻了什么。写下来，是为了下次少走一遍弯路。
          </p>
        </div>

        <div className={styles.mascot}>
          <RavenLogo size={72} />
          <div>
            <h2 className={styles.heading}>页头的小乌鸦</h2>
            <p className={styles.text}>
              它叫 Raven，来自 Raven Todo 的图标：圆身子，两片叶子一样的头毛，手里捧着一张清单。每隔几秒，它会眨一下眼；把鼠标移到它身上，它会跳一下。
            </p>
          </div>
        </div>

        <h2 className={`label ${styles.section}`}>联系</h2>
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

        <h2 className={`label ${styles.section}`}>这个站点</h2>
        <p className={styles.text}>
          用 Next.js 静态导出，版式参考了 claude.dev，颜色取自 Radix Colors。按 B、W、A 可以在博客、作品和关于之间切换。
        </p>
      </section>
    </div>
  );
}
