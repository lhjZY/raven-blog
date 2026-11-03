import PostList from "@/components/PostList";
import type { Locale } from "@/lib/i18n";
import { getPosts } from "@/lib/posts";

export default function BlogHome({ locale }: { locale: Locale }) {
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">Raven</h1>
        <p className="lede">Life's shit, but I'm loving it.</p>
      </aside>
      <PostList posts={getPosts(locale)} locale={locale} />
    </div>
  );
}
