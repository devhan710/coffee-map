import { getCafeById } from "@/lib/cafes";
import { lookupNaverPlace } from "@/lib/naver/place-lookup";

type RouteProps = {
  params: Promise<{ id: string }>;
};

function parseFrom(request: Request) {
  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("fromLat");
  const lngRaw = searchParams.get("fromLng");
  if (!latRaw || !lngRaw) return null;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function GET(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const cafe = getCafeById(id);
  if (!cafe) {
    return Response.json({ error: "없는 카페" }, { status: 404 });
  }

  const place = await lookupNaverPlace(cafe, parseFrom(request));
  return Response.json(place);
}
