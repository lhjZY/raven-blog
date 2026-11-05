import DraftPostPage, { draftMetadata, draftParams } from "@/components/pages/DraftPostPage";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return draftParams("zh");
}

export async function generateMetadata({ params }: Params) {
  return draftMetadata("zh", (await params).slug);
}

export default async function Page({ params }: Params) {
  return <DraftPostPage locale="zh" slug={(await params).slug} />;
}
