import PostList from "@/components/PostList";
import { getPosts } from "@/lib/posts";

export default function BlogPage() {
  return (
    <div className="page split">
      <aside>
        <h1 className="site-title">Raven</h1>
        <p className="lede">做 Raven Translate 和 Raven Todo 时的设计与开发笔记。</p>
      </aside>
      <PostList posts={getPosts()} />
    </div>
  );
}
