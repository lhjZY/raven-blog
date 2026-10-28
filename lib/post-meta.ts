import type { ArtName } from "@/components/art/PostArt";

// Shared with client components, so nothing here may touch the file system.

export type Tag = "设计" | "工程";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** yyyy-mm-dd */
  date: string;
  tag: Tag;
  art: ArtName;
  minutes: number;
}

/** "2026.10.28" */
export function formatDate(date: string): string {
  return date.replaceAll("-", ".");
}
