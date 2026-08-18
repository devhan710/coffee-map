import { redirect } from "next/navigation";

type MapPageProps = {
  searchParams: Promise<{ cafe?: string }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const { cafe } = await searchParams;
  redirect(cafe ? `/?cafe=${encodeURIComponent(cafe)}` : "/");
}
