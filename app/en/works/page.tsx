import type { Metadata } from "next";
import WorksPage, { worksTitle } from "@/components/pages/WorksPage";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { title: worksTitle.en, alternates: alternates("/works/") };

export default function Page() {
  return <WorksPage locale="en" />;
}
