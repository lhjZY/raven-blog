import PostPage, { postMetadata, postParams } from "@/components/pages/PostPage";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return postParams("zh");
}

export async function generateMetadata({ params }: Params) {
  return postMetadata("zh", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <PostPage locale="zh" slug={(await params).slug} />;
}
