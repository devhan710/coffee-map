import type { GeoPoint } from "@/lib/geolocation";
import type { Cafe } from "@/lib/types";
import { naverDirectionsUrl, naverPlaceUrl } from "@/lib/naver-place";

type PlacePoint = GeoPoint & { url?: string };

type GeocodeResponse = {
  status?: string;
  addresses?: Array<{
    x?: string;
    y?: string;
    roadAddress?: string;
    jibunAddress?: string;
  }>;
};

type LocalSearchResponse = {
  items?: Array<{
    title?: string;
    address?: string;
    roadAddress?: string;
    mapx?: string;
    mapy?: string;
    link?: string;
  }>;
};

function stripHtml(value: string) {
  return value
    .replace(/<\/?b>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function compact(value: string) {
  return value.replace(/\s+/g, "");
}

function lastNumber(value: string) {
  const cleaned = value
    .replace(/\s+\d+층.*$/, "")
    .replace(/\s+[가-힣A-Za-z0-9]+(?:빌딩|타워|센터|역).*$/, "")
    .trim();
  return cleaned.match(/(\d+(?:-\d+)?)\s*$/)?.[1];
}

function geocodeMatchesQuery(
  query: string,
  road?: string,
  jibun?: string,
) {
  const needle = lastNumber(query);
  if (!needle) return false;
  const hay = compact(`${road ?? ""} ${jibun ?? ""}`);
  return new RegExp(`(?:길|로|동|가)${needle}(?!\\d)`).test(hay);
}

function parseMapCoord(mapx: string, mapy: string): GeoPoint | null {
  const x = Number(mapx);
  const y = Number(mapy);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (Math.abs(x) > 180 || Math.abs(y) > 90) {
    return { lng: x / 10_000_000, lat: y / 10_000_000 };
  }
  return { lng: x, lat: y };
}

function matchesCafe(
  cafe: Cafe,
  item: NonNullable<LocalSearchResponse["items"]>[number],
) {
  const title = compact(stripHtml(item.title ?? ""));
  const cafeName = compact(cafe.name);
  if (title && (title.includes(cafeName) || cafeName.includes(title))) {
    return true;
  }

  const itemAddr = compact(item.roadAddress || item.address || "");
  const cafeAddr = compact(cafe.roadAddress || cafe.address);
  if (!itemAddr || !cafeAddr) return false;
  const needle = cafeAddr.slice(-10);
  return needle.length >= 6 && itemAddr.includes(needle);
}

async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const key = process.env.NAVER_MAP_CLIENT_SECRET;
  if (!keyId || !key) return null;

  const headers = {
    Accept: "application/json",
    "x-ncp-apigw-api-key-id": keyId,
    "x-ncp-apigw-api-key": key,
  };
  const endpoints = [
    "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
    "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
  ];

  for (const endpoint of endpoints) {
    const url = new URL(endpoint);
    url.searchParams.set("query", query);
    url.searchParams.set("count", "1");

    const response = await fetch(url, {
      headers,
      next: { revalidate: 86_400 },
    });
    if (!response.ok) continue;

    const body = (await response.json()) as GeocodeResponse;
    const hit = body.addresses?.[0];
    const lng = Number(hit?.x);
    const lat = Number(hit?.y);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (!geocodeMatchesQuery(query, hit?.roadAddress, hit?.jibunAddress)) {
      continue;
    }
    return { lat, lng };
  }

  return null;
}

async function searchLocalPlace(cafe: Cafe): Promise<PlacePoint | null> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const url = new URL("https://openapi.naver.com/v1/search/local.json");
  url.searchParams.set("query", `${cafe.name} ${cafe.dong}`);
  url.searchParams.set("display", "5");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 86_400 },
  });
  if (!response.ok) return null;

  const body = (await response.json()) as LocalSearchResponse;
  const hit = (body.items ?? []).find((item) => matchesCafe(cafe, item));
  if (!hit?.mapx || !hit.mapy) return null;

  const point = parseMapCoord(hit.mapx, hit.mapy);
  if (!point) return null;

  const link = hit.link?.includes("map.naver.com") ? hit.link : undefined;
  return { ...point, url: link };
}

export async function lookupNaverPlace(cafe: Cafe, from?: GeoPoint | null) {
  const address = cafe.roadAddress ?? cafe.address;
  const local = await searchLocalPlace(cafe);
  const geo = local ? null : await geocodeAddress(address);
  const point = local ?? geo ?? { lat: cafe.lat, lng: cafe.lng };
  const placeUrl = local?.url || naverPlaceUrl(cafe.name, cafe.dong);
  const url = from ? naverDirectionsUrl(from, point, cafe.name) : placeUrl;

  return { lat: point.lat, lng: point.lng, url };
}
