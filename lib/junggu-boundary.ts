/** Simplified Jung-gu ring (WGS84). Closed path, clockwise. */
export const JUNGGU_RING: { lat: number; lng: number }[] = [
  { lat: 37.56894, lng: 127.02547 },
  { lat: 37.56237, lng: 127.02572 },
  { lat: 37.56219, lng: 127.02881 },
  { lat: 37.56079, lng: 127.0287 },
  { lat: 37.55795, lng: 127.02544 },
  { lat: 37.55622, lng: 127.02451 },
  { lat: 37.55507, lng: 127.02496 },
  { lat: 37.5547, lng: 127.02147 },
  { lat: 37.55377, lng: 127.01998 },
  { lat: 37.55058, lng: 127.01889 },
  { lat: 37.54882, lng: 127.01722 },
  { lat: 37.54571, lng: 127.01376 },
  { lat: 37.54525, lng: 127.01172 },
  { lat: 37.543, lng: 127.01099 },
  { lat: 37.54182, lng: 127.01281 },
  { lat: 37.54197, lng: 127.01146 },
  { lat: 37.54101, lng: 127.00936 },
  { lat: 37.54338, lng: 127.00695 },
  { lat: 37.54541, lng: 127.008 },
  { lat: 37.54555, lng: 127.00682 },
  { lat: 37.54758, lng: 127.00633 },
  { lat: 37.5468, lng: 127.00479 },
  { lat: 37.54713, lng: 127.00062 },
  { lat: 37.54461, lng: 126.99847 },
  { lat: 37.54444, lng: 126.99742 },
  { lat: 37.54811, lng: 126.9933 },
  { lat: 37.54878, lng: 126.98967 },
  { lat: 37.55095, lng: 126.98753 },
  { lat: 37.55024, lng: 126.98584 },
  { lat: 37.551, lng: 126.9848 },
  { lat: 37.55075, lng: 126.98098 },
  { lat: 37.55226, lng: 126.97903 },
  { lat: 37.54991, lng: 126.97876 },
  { lat: 37.55163, lng: 126.97432 },
  { lat: 37.55109, lng: 126.97427 },
  { lat: 37.5511, lng: 126.97117 },
  { lat: 37.55237, lng: 126.97118 },
  { lat: 37.55259, lng: 126.97059 },
  { lat: 37.54871, lng: 126.96449 },
  { lat: 37.54955, lng: 126.96385 },
  { lat: 37.55255, lng: 126.9638 },
  { lat: 37.55435, lng: 126.96531 },
  { lat: 37.55539, lng: 126.96514 },
  { lat: 37.55606, lng: 126.96358 },
  { lat: 37.55922, lng: 126.97169 },
  { lat: 37.56314, lng: 126.96874 },
  { lat: 37.56565, lng: 126.97155 },
  { lat: 37.56603, lng: 126.97325 },
  { lat: 37.56551, lng: 126.97391 },
  { lat: 37.56568, lng: 126.97469 },
  { lat: 37.56646, lng: 126.97479 },
  { lat: 37.56661, lng: 126.97788 },
  { lat: 37.56531, lng: 126.99101 },
  { lat: 37.56682, lng: 127.00399 },
  { lat: 37.56703, lng: 127.01811 },
  { lat: 37.56893, lng: 127.02251 },
  { lat: 37.56894, lng: 127.02547 },
];

export const JUNGGU_OUTSIDE_LABELS: { lat: number; lng: number }[] = [
  { lat: 37.5758, lng: 126.997 },
  { lat: 37.5378, lng: 126.9885 },
  { lat: 37.5565, lng: 127.0365 },
  { lat: 37.5572, lng: 126.9518 },
];

const OUTER_MASK = [
  { lat: 33, lng: 124 },
  { lat: 33, lng: 132 },
  { lat: 39, lng: 132 },
  { lat: 39, lng: 124 },
];

export function isPointInJunggu(lat: number, lng: number) {
  const ring = JUNGGU_RING;
  let inside = false;

  for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
    const yi = ring[i].lat;
    const xi = ring[i].lng;
    const yj = ring[j].lat;
    const xj = ring[j].lng;
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export function jungguMaskPaths(maps: typeof naver.maps) {
  return [
    OUTER_MASK.map((point) => new maps.LatLng(point.lat, point.lng)),
    JUNGGU_RING.map((point) => new maps.LatLng(point.lat, point.lng)),
  ];
}

export function jungguOutlinePath(maps: typeof naver.maps) {
  return JUNGGU_RING.map((point) => new maps.LatLng(point.lat, point.lng));
}
