import type { Cafe } from "@/lib/types";
import { cafeMatchesFilters } from "@/lib/menu-filters";

export const DRINK_IDS = [
  "americano",
  "drip",
  "latte",
  "einspanner",
  "other",
] as const;

export type DrinkId = (typeof DRINK_IDS)[number];

export function isDrinkId(value: string): value is DrinkId {
  return (DRINK_IDS as readonly string[]).includes(value);
}

export function normalizeDrinkIds(values: unknown): DrinkId[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<DrinkId>();
  for (const value of values) {
    if (typeof value !== "string" || !isDrinkId(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    if (seen.size >= DRINK_IDS.length) break;
  }

  return DRINK_IDS.filter((id) => seen.has(id));
}

export function cafesMatchingDrinks(cafes: Cafe[], drinkIds: string[]): Cafe[] {
  const ids = normalizeDrinkIds(drinkIds);
  if (ids.length === 0) return [];
  return cafes.filter((cafe) => cafeMatchesFilters(cafe, ids));
}
