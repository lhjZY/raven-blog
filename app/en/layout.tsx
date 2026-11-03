import type { Metadata } from "next";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { description: dict.en.description };

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
