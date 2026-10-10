import type { CollectionEntry } from "astro:content";
import config from "@/config";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - Matches explicit post languages; legacy posts without `lang` remain shared
 * - In production, excludes scheduled posts until `pubDatetime` minus the configured margin
 * - In dev, always shows non-draft posts to make authoring easier
 */
export function postFilter({ data }: CollectionEntry<"posts">, locale: string = config.site.lang) {
  const isPublishTimePassed =
    Date.now() > new Date(data.pubDatetime).getTime() - config.posts.scheduledPostMargin;
  return (
    !data.draft &&
    (!data.lang || data.lang === locale) &&
    (import.meta.env.DEV || isPublishTimePassed)
  );
}
