export type GeoPoint = { lat: number; lng: number };

export class LocationError extends Error {
  readonly kind: "denied" | "unavailable";

  constructor(kind: "denied" | "unavailable") {
    super(kind === "denied" ? "위치 권한이 없어요" : "위치를 찾지 못했어요");
    this.name = "LocationError";
    this.kind = kind;
  }
}

export function getCurrentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new LocationError("unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(
          new LocationError(
            error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
          ),
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  });
}
