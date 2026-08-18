import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cafeList, getCafeById } from "@/lib/cafes";

type CafePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return cafeList.map((cafe) => ({ id: cafe.id }));
}

export async function generateMetadata({
  params,
}: CafePageProps): Promise<Metadata> {
  const { id } = await params;
  const cafe = getCafeById(id);

  if (!cafe) {
    return { title: "아바라" };
  }

  return {
    title: `${cafe.name} · 아바라`,
    description: cafe.signature
      ? `${cafe.name} 대표 메뉴 ${cafe.signature.name}`
      : `${cafe.name} 대표 메뉴 확인 중`,
  };
}

export default async function CafePage({ params }: CafePageProps) {
  const { id } = await params;
  const cafe = getCafeById(id);

  if (!cafe) {
    notFound();
  }

  redirect(`/?cafe=${encodeURIComponent(cafe.id)}`);
}
