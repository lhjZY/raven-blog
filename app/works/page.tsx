import type { Metadata } from "next";
import WorksPage, { worksTitle } from "@/components/pages/WorksPage";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { title: worksTitle.zh, alternates: alternates("/works/") };

export default function Page() {
  return <WorksPage locale="zh" />;
}
