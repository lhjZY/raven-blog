import type { Metadata } from "next";
import DraftsPage, { draftsTitle } from "@/components/pages/DraftsPage";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { title: draftsTitle.en, alternates: alternates("/drafts/") };

export default function Page() {
  return <DraftsPage locale="en" />;
}
