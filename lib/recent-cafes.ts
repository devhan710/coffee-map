import type { Cafe } from "@/lib/types";

const STORAGE_KEY = "abara:recent-cafe-ids";
const MAX_RECENT = 3;

export function getRecentCafeIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function rememberCafe(id: string) {
  if (typeof window === "undefined") return;

  const ids = getRecentCafeIds().filter((item) => item !== id);
  ids.unshift(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
}

export function getRecentCafes(cafes: Cafe[]): Cafe[] {
  const byId = new Map(cafes.map((cafe) => [cafe.id, cafe]));

  return getRecentCafeIds()
    .map((id) => byId.get(id))
    .filter((cafe): cafe is Cafe => cafe !== undefined);
}
