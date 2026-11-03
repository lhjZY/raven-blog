import type { Metadata } from "next";
import BlogHome from "@/components/pages/BlogHome";
import { alternates } from "@/lib/i18n";

export const metadata: Metadata = { alternates: alternates("/") };

export default function Page() {
  return <BlogHome locale="en" />;
}
