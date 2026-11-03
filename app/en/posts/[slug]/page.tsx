import PostPage, { postMetadata, postParams } from "@/components/pages/PostPage";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return postParams("en");
}

export async function generateMetadata({ params }: Params) {
  return postMetadata("en", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <PostPage locale="en" slug={(await params).slug} />;
}
