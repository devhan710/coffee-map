import cafes from "@/data/cafes.json";
import type { Cafe } from "@/lib/types";

export const cafeList = cafes as Cafe[];

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function searchCafes(query: string, cafes: Cafe[] = cafeList): Cafe[] {
  const needle = normalize(query);
  if (!needle) return [];

  return cafes.filter((cafe) => normalize(cafe.name).includes(needle));
}

export function getCafeById(id: string): Cafe | undefined {
  return cafeList.find((cafe) => cafe.id === id);
}
