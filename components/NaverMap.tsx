"use client";

import { useEffect, useRef, useState } from "react";
import { attachJungguMask } from "@/lib/junggu-mask";
import type { GeoPoint } from "@/lib/geolocation";
import { loadNaverMapScript } from "@/lib/load-naver-map";
import {
  DEFAULT_ZOOM,
  FOCUS_ZOOM,
  JUNGGU_CENTER,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  NAME_ZOOM,
  USER_ZOOM,
} from "@/lib/naver-map";
import type { Cafe } from "@/lib/types";

type NaverMapProps = {
  cafes: Cafe[];
  visibleCafeIds?: string[];
  highlightedCafeIds?: string[];
  focusCafeId?: string;
  userLocation?: GeoPoint | null;
  followUser?: boolean;
  cameraTick?: number;
  onSelectCafe?: (cafeId: string) => void;
  onFocusSettled?: (cafeId: string) => void;
};

type MapStatus = "loading" | "ready" | "missing-key" | "auth-failed";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const NAME_WIDTH = 132;
const NAME_HEIGHT = 58;
const FOCUS_WIDTH = 148;
const FOCUS_HEIGHT = 62;
const NAME_PAD = 6;

function highlightKey(ids?: string[]) {
  return ids?.join("|") ?? "";
}

function isMine(cafeId: string, highlighted?: string[]) {
  return Boolean(highlighted?.includes(cafeId));
}

const LABEL_NUDGE: Record<string, number> = {
  "pildong-coffee": -86,
  "strength-dongguk": 86,
};

function labelNudge(cafeId: string, showName: boolean) {
  const nudge = LABEL_NUDGE[cafeId] ?? 0;
  if (!nudge) return 0;
  return showName ? nudge : Math.sign(nudge) * 12;
}

function drinkBadgeHtml() {
  return `<span style="position:absolute;top:-5px;right:-5px;display:flex;width:18px;height:18px;align-items:center;justify-content:center;border-radius:999px;background:var(--vanilla);border:2px solid var(--surface);box-shadow:0 1px 4px rgba(28,24,21,.28);">
  <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
    <path fill="var(--surface)" d="M3.2 4.6h7.2c.5 0 .9.4.9.9v3.2A3.3 3.3 0 0 1 8 12H5.6A3.3 3.3 0 0 1 2.3 8.7V5.5c0-.5.4-.9.9-.9Zm8.3 1.1h.8A1.6 1.6 0 0 1 13.9 7.3 1.6 1.6 0 0 1 12.3 8.9h-.8"/>
  </svg>
</span>`;
}

function nameIcon(
  cafe: Cafe,
  focused = false,
  mine = false,
  nudgeX = 0,
): naver.maps.HtmlIcon {
  const name = escapeHtml(cafe.name);
  const menu = escapeHtml(cafe.signature?.name ?? "대표 메뉴 확인 중");
  const width = focused ? FOCUS_WIDTH : NAME_WIDTH;
  const height = focused ? FOCUS_HEIGHT : NAME_HEIGHT;
  const badge = mine ? drinkBadgeHtml() : "";
  const pad = NAME_PAD;
  const shift = Math.round(nudgeX);
  const extraLeft = Math.max(0, shift);
  const extraRight = Math.max(0, -shift);
  const boxWidth = width + pad * 2 + extraLeft + extraRight;
  const boxHeight = height + pad;
  const anchorX = extraLeft + pad + width / 2 - shift;

  if (!focused) {
    return {
      content: `<div style="padding:${pad}px ${pad + extraRight}px 0 ${pad + extraLeft}px;box-sizing:content-box;width:${width}px;cursor:pointer;filter:drop-shadow(0 3px 10px rgba(28,24,21,.2));font-family:var(--font-ibm-plex-sans-kr),sans-serif;">
  <div style="position:relative;box-sizing:border-box;width:100%;padding:8px 10px;border-radius:12px;background:var(--surface);border:1px solid color-mix(in oklab,var(--ink) 12%,transparent);text-align:center;">
    ${badge}
    <div style="font-size:12px;font-weight:600;line-height:1.35;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
    <div style="margin-top:1px;font-size:13px;font-weight:700;line-height:1.35;color:var(--vanilla);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${menu}</div>
  </div>
  <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid var(--surface);margin: -1px auto 0;"></div>
</div>`,
      size: new naver.maps.Size(boxWidth, boxHeight),
      anchor: new naver.maps.Point(anchorX, boxHeight),
    };
  }

  return {
    content: `<div style="padding:${pad}px ${pad + extraRight}px 0 ${pad + extraLeft}px;box-sizing:content-box;width:${FOCUS_WIDTH}px;cursor:pointer;filter:drop-shadow(0 4px 12px rgba(28,24,21,.22));font-family:var(--font-ibm-plex-sans-kr),sans-serif;">
  <div style="position:relative;box-sizing:border-box;width:100%;padding:8px 10px;border-radius:14px;background:var(--surface);border:2px solid var(--accent);text-align:left;">
    ${badge}
    <div style="font-size:12px;line-height:1.35;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
    <div style="margin-top:1px;font-size:14px;font-weight:700;line-height:1.35;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${menu}</div>
  </div>
  <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:7px solid var(--surface);margin: -1px auto 0;"></div>
</div>`,
    size: new naver.maps.Size(
      FOCUS_WIDTH + pad * 2 + extraLeft + extraRight,
      FOCUS_HEIGHT + pad,
    ),
    anchor: new naver.maps.Point(
      extraLeft + pad + FOCUS_WIDTH / 2 - shift,
      FOCUS_HEIGHT + pad,
    ),
  };
}

function cafeIcon(
  cafe: Cafe,
  showName: boolean,
  focused: boolean,
  mine: boolean,
): naver.maps.HtmlIcon {
  const nudge = labelNudge(cafe.id, showName);
  if (!showName) return dotIcon(mine, nudge);
  return nameIcon(cafe, focused, mine, nudge);
}

function dotIcon(mine = false, nudgeX = 0): naver.maps.HtmlIcon {
  const badge = mine
    ? `<span style="position:absolute;top:0;right:0;display:flex;width:16px;height:16px;align-items:center;justify-content:center;border-radius:999px;background:var(--vanilla);border:2px solid var(--surface);box-shadow:0 1px 4px rgba(28,24,21,.28);">
  <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden="true">
    <path fill="var(--surface)" d="M3.2 4.6h7.2c.5 0 .9.4.9.9v3.2A3.3 3.3 0 0 1 8 12H5.6A3.3 3.3 0 0 1 2.3 8.7V5.5c0-.5.4-.9.9-.9Zm8.3 1.1h.8A1.6 1.6 0 0 1 13.9 7.3 1.6 1.6 0 0 1 12.3 8.9h-.8"/>
  </svg>
</span>`
    : "";
  const shift = Math.round(nudgeX);
  const extraLeft = Math.max(0, shift);
  const extraRight = Math.max(0, -shift);
  const box = 22 + extraLeft + extraRight;
  return {
    content: `<div style="position:relative;width:${box}px;height:22px;cursor:pointer;padding-left:${extraLeft}px;padding-right:${extraRight}px;box-sizing:border-box;">
  <div style="position:absolute;left:${extraLeft + 11}px;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:999px;background:var(--accent);border:2px solid var(--surface);box-shadow:0 1px 4px rgba(28,24,21,.35);"></div>
  ${badge}
</div>`,
    size: new naver.maps.Size(box, 22),
    anchor: new naver.maps.Point(extraLeft + 11 - shift, 11),
  };
}

function userIcon(): naver.maps.HtmlIcon {
  return {
    content: `<div style="position:relative;width:22px;height:22px;pointer-events:none;">
  <div class="abara-user-pulse" style="position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:999px;background:var(--accent);"></div>
  <div style="position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:999px;background:var(--accent);border:2.5px solid var(--surface);box-shadow:0 1px 4px rgba(28,24,21,.35);"></div>
</div>`,
    size: new naver.maps.Size(22, 22),
    anchor: new naver.maps.Point(11, 11),
  };
}

type MarkerVisual = {
  showName: boolean;
  focusCafeId?: string;
  highlightKey: string;
};

function syncMarkerIcons(
  map: naver.maps.Map,
  markers: naver.maps.Marker[],
  cafes: Cafe[],
  focusCafeId: string | undefined,
  highlightedCafeIds: string[] | undefined,
  prev: MarkerVisual,
): MarkerVisual {
  const showName = map.getZoom() >= NAME_ZOOM;
  const next: MarkerVisual = {
    showName,
    focusCafeId,
    highlightKey: highlightKey(highlightedCafeIds),
  };
  const showNameChanged = showName !== prev.showName;
  const focusChanged = focusCafeId !== prev.focusCafeId;
  const highlightChanged = next.highlightKey !== prev.highlightKey;

  if (!showNameChanged && !focusChanged && !highlightChanged) return next;

  markers.forEach((marker, index) => {
    const cafe = cafes[index];
    if (!cafe) return;
    const focused = cafe.id === focusCafeId;
    const wasFocused = cafe.id === prev.focusCafeId;
    const mine = isMine(cafe.id, highlightedCafeIds);
    if (!showNameChanged && !highlightChanged && focused === wasFocused) return;
    marker.setIcon(cafeIcon(cafe, showName, focused, mine));
    marker.setZIndex(focused ? 200 : mine ? 50 : 1);
  });

  return next;
}

export function NaverMap({
  cafes,
  visibleCafeIds,
  highlightedCafeIds,
  focusCafeId,
  userLocation,
  followUser = false,
  cameraTick = 0,
  onSelectCafe,
  onFocusSettled,
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const userMarkerRef = useRef<naver.maps.Marker | null>(null);
  const cafeIdsRef = useRef<string[]>([]);
  const cafesRef = useRef(cafes);
  const focusCafeIdRef = useRef(focusCafeId);
  const highlightedCafeIdsRef = useRef(highlightedCafeIds);
  const onSelectCafeRef = useRef(onSelectCafe);
  const onFocusSettledRef = useRef(onFocusSettled);
  const markerVisualRef = useRef<MarkerVisual>({
    showName: false,
    highlightKey: "",
  });
  const cameraMoveRef = useRef("");
  const [status, setStatus] = useState<MapStatus>(() =>
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ? "loading" : "missing-key",
  );
  const [outsideJunggu, setOutsideJunggu] = useState(false);

  useEffect(() => {
    cafesRef.current = cafes;
    focusCafeIdRef.current = focusCafeId;
    highlightedCafeIdsRef.current = highlightedCafeIds;
    onSelectCafeRef.current = onSelectCafe;
    onFocusSettledRef.current = onFocusSettled;
  }, [cafes, focusCafeId, highlightedCafeIds, onFocusSettled, onSelectCafe]);

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    const key: string = clientId;

    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let map: naver.maps.Map | null = null;
    let detachMask: (() => void) | null = null;
    const markers: naver.maps.Marker[] = [];
    const listeners: naver.maps.MapEventListener[] = [];

    window.navermap_authFailure = () => {
      if (!cancelled) setStatus("auth-failed");
    };

    async function start() {
      try {
        await loadNaverMapScript(key);
        if (cancelled || !containerRef.current) return;

        map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(JUNGGU_CENTER.lat, JUNGGU_CENTER.lng),
          zoom: DEFAULT_ZOOM,
          minZoom: MAP_MIN_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
          draggable: true,
          pinchZoom: true,
          scrollWheel: true,
          keyboardShortcuts: true,
          disableDoubleClickZoom: false,
          disableDoubleTapZoom: false,
          disableTwoFingerTapZoom: false,
          disableKineticPan: false,
          scaleControl: false,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.RIGHT_CENTER,
            style: naver.maps.ZoomControlStyle.LARGE,
          },
          logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        });

        const useName = map.getZoom() >= NAME_ZOOM;

        for (const cafe of cafesRef.current) {
          const focused = cafe.id === focusCafeIdRef.current;
          const mine = isMine(cafe.id, highlightedCafeIdsRef.current);
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(cafe.lat, cafe.lng),
            map,
            icon: cafeIcon(cafe, useName, focused, mine),
            title: cafe.name,
            zIndex: focused ? 200 : mine ? 50 : 1,
          });

          listeners.push(
            naver.maps.Event.addListener(marker, "click", () => {
              onSelectCafeRef.current?.(cafe.id);
            }),
          );
          markers.push(marker);
        }

        cafeIdsRef.current = cafesRef.current.map((cafe) => cafe.id);

        markerVisualRef.current = {
          showName: useName,
          focusCafeId: focusCafeIdRef.current,
          highlightKey: highlightKey(highlightedCafeIdsRef.current),
        };

        listeners.push(
          naver.maps.Event.addListener(map, "zoom_changed", () => {
            if (!map) return;
            markerVisualRef.current = syncMarkerIcons(
              map,
              markersRef.current,
              cafesRef.current,
              focusCafeIdRef.current,
              highlightedCafeIdsRef.current,
              markerVisualRef.current,
            );
          }),
        );

        detachMask = attachJungguMask(map, (outside) => {
          if (!cancelled) setOutsideJunggu(outside);
        });

        if (cancelled) {
          detachMask();
          detachMask = null;
          map.destroy();
          return;
        }

        mapRef.current = map;
        markersRef.current = markers;
        userMarkerRef.current = null;
        map.autoResize();
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("auth-failed");
      }
    }

    void start();

    const observer = new ResizeObserver(() => {
      map?.autoResize();
    });
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      delete window.navermap_authFailure;
      detachMask?.();
      userMarkerRef.current?.setMap(null);
      mapRef.current = null;
      markersRef.current = [];
      cafeIdsRef.current = [];
      userMarkerRef.current = null;
      if (window.naver?.maps) {
        for (const listener of listeners) {
          naver.maps.Event.removeListener(listener);
        }
        for (const marker of markers) {
          marker.setMap(null);
        }
        map?.destroy();
      }
    };
  }, [clientId]);

  useEffect(() => {
    if (status === "missing-key" || status === "auth-failed") {
      if (focusCafeId) onFocusSettledRef.current?.(focusCafeId);
      return;
    }

    if (status !== "ready") return;

    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;

    if (!focusCafeId) {
      const atUser = followUser && userLocation;
      const target = atUser ? userLocation : JUNGGU_CENTER;
      const zoom = atUser ? USER_ZOOM : DEFAULT_ZOOM;
      const moveKey = atUser ? `user:${cameraTick}` : `home:${cameraTick}`;
      const center = map.getCenter() as naver.maps.LatLng;
      const alreadyThere =
        Math.abs(center.lat() - target.lat) < 0.0004 &&
        Math.abs(center.lng() - target.lng) < 0.0004 &&
        map.getZoom() === zoom;
      if (alreadyThere || cameraMoveRef.current === moveKey) {
        cameraMoveRef.current = moveKey;
        return;
      }
      cameraMoveRef.current = moveKey;
      map.morph(new naver.maps.LatLng(target.lat, target.lng), zoom, {
        duration: 500,
        easing: "easeOutCubic",
      });
      return;
    }

    const cafeId = focusCafeId;
    const cafe = cafesRef.current.find((item) => item.id === cafeId);
    if (!cafe) return;

    let settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      onFocusSettledRef.current?.(cafeId);
    }

    const center = map.getCenter() as naver.maps.LatLng;
    const alreadyThere =
      Math.abs(center.lat() - cafe.lat) < 0.0004 &&
      Math.abs(center.lng() - cafe.lng) < 0.0004 &&
      map.getZoom() === FOCUS_ZOOM;
    if (alreadyThere) {
      cameraMoveRef.current = `cafe:${cafeId}`;
      settle();
      return;
    }

    const moveKey = `cafe:${cafeId}`;
    if (cameraMoveRef.current !== moveKey) {
      cameraMoveRef.current = moveKey;
      map.morph(new naver.maps.LatLng(cafe.lat, cafe.lng), FOCUS_ZOOM, {
        duration: 500,
        easing: "easeOutCubic",
      });
    }

    const fallback = window.setTimeout(settle, 560);

    return () => {
      settled = true;
      window.clearTimeout(fallback);
    };
  }, [cameraTick, focusCafeId, followUser, status, userLocation]);

  useEffect(() => {
    if (status !== "ready") return;
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;

    markerVisualRef.current = syncMarkerIcons(
      map,
      markersRef.current,
      cafesRef.current,
      focusCafeId,
      highlightedCafeIds,
      markerVisualRef.current,
    );
  }, [focusCafeId, highlightedCafeIds, status]);

  useEffect(() => {
    if (status !== "ready") return;

    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;

    if (!userLocation) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }

    const position = new naver.maps.LatLng(userLocation.lat, userLocation.lng);
    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition(position);
      return;
    }

    userMarkerRef.current = new naver.maps.Marker({
      map,
      position,
      icon: userIcon(),
      clickable: false,
      zIndex: 300,
      title: "내 위치",
    });
  }, [status, userLocation]);

  useEffect(() => {
    if (status !== "ready") return;

    const allowed = Array.isArray(visibleCafeIds) ? new Set(visibleCafeIds) : null;
    markersRef.current.forEach((marker, index) => {
      const cafeId = cafeIdsRef.current[index];
      if (!cafeId) return;
      marker.setVisible(!allowed || allowed.has(cafeId));
    });
  }, [status, visibleCafeIds]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
      <div ref={containerRef} className="naver-map h-full w-full" />
      {status === "missing-key" ? (
        <p className="absolute inset-x-6 top-36 z-10 rounded-2xl bg-surface px-4 py-3 text-center text-sm text-muted ring-1 ring-ink/10">
          지도 키가 없습니다.
        </p>
      ) : null}
      {status === "auth-failed" ? (
        <p className="absolute inset-x-6 top-36 z-10 rounded-2xl bg-surface px-4 py-3 text-center text-sm text-muted ring-1 ring-ink/10">
          지도 인증에 실패했습니다. NCP Web 서비스 URL은 포트 없이
          http://localhost 만 등록하세요.
        </p>
      ) : null}
      {outsideJunggu ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4 pr-16">
          <span className="rounded-full bg-surface/95 px-3 py-1.5 text-sm font-semibold text-muted shadow-float ring-1 ring-ink/8">
            이 동네는 추후 개방 예정
          </span>
        </p>
      ) : null}
    </div>
  );
}
