import {
  JUNGGU_OUTSIDE_LABELS,
  JUNGGU_RING,
  isPointInJunggu,
  jungguMaskPaths,
  jungguOutlinePath,
} from "@/lib/junggu-boundary";

const LABEL_ZOOM = 16;

const LABEL_HTML =
  '<div style="padding:6px 10px;border-radius:999px;background:color-mix(in oklab,var(--surface) 92%,transparent);border:1px solid color-mix(in oklab,var(--ink) 12%,transparent);box-shadow:0 4px 14px rgba(28,24,21,.14);font-family:var(--font-ibm-plex-sans-kr),sans-serif;font-size:16px;font-weight:700;letter-spacing:-0.01em;color:var(--muted);white-space:nowrap;pointer-events:none;">추후 개방 예정</div>';

function supportsEvenoddClip() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports(
      "clip-path",
      "polygon(evenodd, 0px 0px, 10px 0px, 10px 10px, 0px 10px)",
    )
  );
}

function comingSoonLabel() {
  const el = document.createElement("div");
  el.style.cssText =
    "position:absolute;transform:translate(-50%,-50%);pointer-events:none;";
  el.innerHTML = LABEL_HTML;
  return el;
}

export function attachJungguMask(
  map: naver.maps.Map,
  onOutsideChange: (outside: boolean) => void,
) {
  const maps = naver.maps;
  const useClip = supportsEvenoddClip();
  const listeners: naver.maps.MapEventListener[] = [];
  const labels: naver.maps.Marker[] = [];

  const outline = new maps.Polygon({
    map,
    paths: [jungguOutlinePath(maps)],
    fillColor: "#000000",
    fillOpacity: 0,
    strokeColor: "#2c211c",
    strokeOpacity: 0.55,
    strokeWeight: 2,
    clickable: false,
    zIndex: 20,
  });

  const fill = useClip
    ? null
    : new maps.Polygon({
        map,
        paths: jungguMaskPaths(maps),
        fillColor: "#ebe4d8",
        fillOpacity: 0.62,
        strokeWeight: 0,
        clickable: false,
        zIndex: 10,
      });

  class FrostOverlay extends maps.OverlayView {
    wrap = document.createElement("div");
    frost = document.createElement("div");
    labelEls = JUNGGU_OUTSIDE_LABELS.map(() => comingSoonLabel());

    constructor() {
      super();
      this.wrap.style.cssText =
        "position:absolute;left:0;top:0;pointer-events:none;";
      this.frost.className = "abara-junggu-frost";
      this.frost.style.cssText = "position:absolute;left:0;top:0;";
      this.wrap.append(this.frost, ...this.labelEls);
    }

    override onAdd() {
      this.getPanes().overlayLayer.appendChild(this.wrap);
    }

    override draw() {
      const current = this.getMap();
      if (!current) return;

      const proj = this.getProjection();
      const size = current.getSize();
      const topLeft = this.getContainerTopLeft();
      this.wrap.style.left = `${topLeft.x}px`;
      this.wrap.style.top = `${topLeft.y}px`;
      this.frost.style.width = `${size.width}px`;
      this.frost.style.height = `${size.height}px`;

      const hole = JUNGGU_RING.map((point) => {
        const offset = proj.fromCoordToOffset(
          new maps.LatLng(point.lat, point.lng),
        );
        return `${(offset.x - topLeft.x).toFixed(1)}px ${(offset.y - topLeft.y).toFixed(1)}px`;
      }).join(", ");

      const clip = `polygon(evenodd, 0px 0px, ${size.width}px 0px, ${size.width}px ${size.height}px, 0px ${size.height}px, 0px 0px, ${hole})`;
      this.frost.style.setProperty("-webkit-clip-path", clip);
      this.frost.style.clipPath = clip;

      const showLabels = current.getZoom() < LABEL_ZOOM;
      JUNGGU_OUTSIDE_LABELS.forEach((point, index) => {
        const label = this.labelEls[index];
        if (!label) return;
        const offset = proj.fromCoordToOffset(
          new maps.LatLng(point.lat, point.lng),
        );
        label.style.left = `${offset.x - topLeft.x}px`;
        label.style.top = `${offset.y - topLeft.y}px`;
        label.style.display = showLabels ? "block" : "none";
      });
    }

    override onRemove() {
      this.wrap.remove();
    }
  }

  const overlay = useClip ? new FrostOverlay() : null;
  overlay?.setMap(map);

  if (overlay) {
    let moving = false;
    listeners.push(
      maps.Event.addListener(map, "bounds_changed", () => {
        if (moving) return;
        moving = true;
        overlay.frost.classList.add("is-moving");
      }),
    );
    listeners.push(
      maps.Event.addListener(map, "idle", () => {
        if (!moving) return;
        moving = false;
        overlay.frost.classList.remove("is-moving");
      }),
    );
  }

  if (!useClip) {
    for (const point of JUNGGU_OUTSIDE_LABELS) {
      labels.push(
        new maps.Marker({
          map,
          position: new maps.LatLng(point.lat, point.lng),
          icon: {
            content: LABEL_HTML,
            size: new maps.Size(108, 28),
            anchor: new maps.Point(54, 14),
          },
          clickable: false,
          visible: map.getZoom() < LABEL_ZOOM,
        }),
      );
    }

    listeners.push(
      maps.Event.addListener(map, "zoom_changed", () => {
        const visible = map.getZoom() < LABEL_ZOOM;
        for (const marker of labels) marker.setVisible(visible);
      }),
    );
  }

  function emitOutside() {
    const center = map.getCenter() as naver.maps.LatLng;
    onOutsideChange(!isPointInJunggu(center.lat(), center.lng()));
  }

  listeners.push(maps.Event.addListener(map, "idle", emitOutside));
  emitOutside();

  return () => {
    overlay?.setMap(null);
    outline.setMap(null);
    fill?.setMap(null);
    for (const marker of labels) marker.setMap(null);
    for (const listener of listeners) maps.Event.removeListener(listener);
  };
}
