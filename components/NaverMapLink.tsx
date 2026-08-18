"use client";

import { useState } from "react";
import type { GeoPoint } from "@/lib/geolocation";
import { naverDirectionsUrl, naverPlaceUrl } from "@/lib/naver-place";
import type { Cafe } from "@/lib/types";

type NaverMapLinkProps = {
  cafe: Cafe;
  from?: GeoPoint | null;
};

export function NaverMapLink({ cafe, from }: NaverMapLinkProps) {
  const [busy, setBusy] = useState(false);
  const fallback = from
    ? naverDirectionsUrl(from, cafe, cafe.name)
    : naverPlaceUrl(cafe.name, cafe.dong);

  async function openNaverMap() {
    if (busy) return;
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (from) {
        params.set("fromLat", String(from.lat));
        params.set("fromLng", String(from.lng));
      }
      const query = params.toString();
      const response = await fetch(
        `/api/cafes/${encodeURIComponent(cafe.id)}/naver${query ? `?${query}` : ""}`,
      );
      const body = (await response.json()) as { url?: string };
      window.open(body.url || fallback, "_blank", "noopener,noreferrer");
    } catch {
      window.open(fallback, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void openNaverMap();
      }}
      disabled={busy}
      className="mt-4 w-full rounded-2xl bg-surface px-4 py-3.5 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-wash disabled:opacity-70"
    >
      {busy ? "좌표 확인 중" : "네이버지도로 보기"}
    </button>
  );
}
