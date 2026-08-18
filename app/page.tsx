import { HomeView } from "@/components/HomeView";
import { cafeList } from "@/lib/cafes";

type HomeProps = {
  searchParams: Promise<{ cafe?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { cafe: cafeId } = await searchParams;

  return <HomeView cafes={cafeList} cafeId={cafeId} />;
}
