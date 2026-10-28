import Link from "next/link";
import RavenLogo from "@/components/RavenLogo";

export default function NotFound() {
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">404</h1>
        <p className="lede">这一页不存在。</p>
      </aside>
      <section>
        <RavenLogo size={96} />
        <p>
          <Link href="/" className="label">
            ← 回到博客
          </Link>
        </p>
      </section>
    </div>
  );
}
