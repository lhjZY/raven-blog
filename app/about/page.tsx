import type { Metadata } from "next";
import AboutPage, { aboutTitle } from "@/components/pages/AboutPage";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { title: aboutTitle.zh, alternates: alternates("/about/") };

export default function Page() {
  return <AboutPage locale="zh" />;
}
