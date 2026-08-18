import type { Cafe } from "@/lib/types";

const OTHER_EXCLUDED_LABELS = new Set([
  "아메리카노",
  "핸드드립",
  "라떼",
  "아인슈페너",
]);

export type MenuFilter = {
  id: string;
  label: string;
  test?: RegExp;
};

export const MENU_FILTERS: MenuFilter[] = [
  { id: "americano", label: "아메리카노", test: /아메리카노/ },
  { id: "drip", label: "핸드드립", test: /핸드드립|드립커피|필터|블렌드/ },
  { id: "latte", label: "라떼", test: /라떼|카푸치노|돌체/ },
  { id: "einspanner", label: "아인슈페너", test: /슈페너|비엔나|피에노/ },
  { id: "other", label: "기타" },
];

function menuText(cafe: Cafe) {
  if (!cafe.signature) return "";
  return `${cafe.signature.label ?? ""} ${cafe.signature.name}`;
}

function cafeMatchesFilter(cafe: Cafe, filter: MenuFilter): boolean {
  if (filter.id === "other") {
    const label = cafe.signature?.label;
    return !label || !OTHER_EXCLUDED_LABELS.has(label);
  }

  return Boolean(filter.test?.test(menuText(cafe)));
}

export function cafeMatchesFilters(cafe: Cafe, filterIds: string[]): boolean {
  if (filterIds.length === 0) return true;

  return MENU_FILTERS.some(
    (filter) => filterIds.includes(filter.id) && cafeMatchesFilter(cafe, filter),
  );
}

export function filterCafes(cafes: Cafe[], filterIds: string[]): Cafe[] {
  if (filterIds.length === 0) return cafes;
  return cafes.filter((cafe) => cafeMatchesFilters(cafe, filterIds));
}
