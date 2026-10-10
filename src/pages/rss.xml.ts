import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";
import type { APIContext } from "astro";
import { useTranslations } from "@/i18n";

export async function GET({ currentLocale }: APIContext) {
  const locale = currentLocale ?? config.site.lang;
  const t = useTranslations(locale);
  const posts = await getCollection("posts");
  const sortedPosts = getSortedPosts(posts, locale);

  return rss({
    title: config.site.title,
    description: locale === "zh" ? t.home.description : config.site.description,
    site: new URL(getRelativeLocaleUrl(locale, ""), config.site.url),
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: getPostUrl(id, filePath, locale),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
