"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RavenLogo from "@/components/RavenLogo";
import { dict, localeOf, localize } from "@/lib/i18n";

export default function NotFound() {
  const locale = localeOf(usePathname() ?? "/");
  const t = dict[locale];
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">404</h1>
        <p className="lede">{t.notFound}</p>
      </aside>
      <section>
        <RavenLogo size={96} />
        <p>
          <Link href={localize(locale, "/")} className="label">
            {t.backHome}
          </Link>
        </p>
      </section>
    </div>
  );
}
