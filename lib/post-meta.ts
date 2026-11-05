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
  /** Written in the admin; drafts are listed under 手稿 instead of the blog. */
  draft: boolean;
  minutes: number;
}

/** "2026.10.28" */
export function formatDate(date: string): string {
  return date.replaceAll("-", ".");
}

/** A draft with the sections of its outline: a section counts as written once it has text under it. */
export interface DraftMeta extends PostMeta {
  outline: { text: string; done: boolean }[];
}
