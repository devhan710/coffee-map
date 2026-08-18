import type { GeoPoint } from "@/lib/geolocation";

export function naverPlaceUrl(name: string, area: string) {
  const query = encodeURIComponent(`${name} ${area}`.trim());
  return `https://map.naver.com/p/search/${query}`;
}

export function naverDirectionsUrl(
  from: GeoPoint,
  to: GeoPoint,
  name: string,
) {
  const start = `${from.lng},${from.lat},${encodeURIComponent("내위치")}`;
  const goal = `${to.lng},${to.lat},${encodeURIComponent(name)}`;
  return `https://map.naver.com/p/directions/${start}/${goal}/-/walk`;
}
