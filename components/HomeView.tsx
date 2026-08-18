"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AccountDock } from "@/components/AccountDock";
import { CafePopup } from "@/components/CafePopup";
import { CafeSearch } from "@/components/CafeSearch";
import { HomeButton } from "@/components/HomeButton";
import { LoginPrompt } from "@/components/LoginPrompt";
import { MenuFilterChips } from "@/components/MenuFilterChips";
import { MyLocationButton } from "@/components/MyLocationButton";
import { NaverMap } from "@/components/NaverMap";
import { PreferredDrinksSheet } from "@/components/PreferredDrinks";
import { TasteProvider, useTaste } from "@/components/TasteProvider";
import { getCurrentPosition, LocationError, type GeoPoint } from "@/lib/geolocation";
import { filterCafes } from "@/lib/menu-filters";
import { cafesMatchingDrinks } from "@/lib/taste";
import type { Cafe } from "@/lib/types";

type HomeViewProps = {
  cafes: Cafe[];
  cafeId?: string;
};

export function HomeView({ cafes, cafeId }: HomeViewProps) {
  return (
    <TasteProvider>
      <HomeScreen cafes={cafes} cafeId={cafeId} />
    </TasteProvider>
  );
}

function HomeScreen({ cafes, cafeId }: HomeViewProps) {
  const router = useRouter();
  const { preferredDrinkIds } = useTaste();
  const [focusCafeId, setFocusCafeId] = useState(cafeId);
  const [settledCafeId, setSettledCafeId] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterIds, setFilterIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [cameraTick, setCameraTick] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const cafeIdFromUrl = cafeId;
  const cafeIdUrlRef = useRef(cafeIdFromUrl);

  useEffect(() => {
    const prev = cafeIdUrlRef.current;
    cafeIdUrlRef.current = cafeIdFromUrl;
    if (prev === cafeIdFromUrl) return;

    setFocusCafeId(cafeIdFromUrl);
    setSettledCafeId((current) => {
      if (!cafeIdFromUrl) return undefined;
      if (current === cafeIdFromUrl) return current;
      return undefined;
    });
    if (!cafeIdFromUrl) setFollowUser(false);
  }, [cafeIdFromUrl]);

  const visibleCafes = useMemo(
    () => filterCafes(cafes, filterIds),
    [cafes, filterIds],
  );
  const visibleIds = useMemo(
    () => visibleCafes.map((cafe) => cafe.id),
    [visibleCafes],
  );
  const highlightedCafeIds = useMemo(() => {
    if (preferredDrinkIds.length === 0) return undefined;
    const ids = cafesMatchingDrinks(cafes, preferredDrinkIds).map((cafe) => cafe.id);
    return ids.length > 0 ? ids : undefined;
  }, [cafes, preferredDrinkIds]);
  const selectedCafe = settledCafeId
    ? visibleCafes.find((cafe) => cafe.id === settledCafeId)
    : undefined;

  useEffect(() => {
    if (!locationHint) return;
    const timer = window.setTimeout(() => setLocationHint(null), 2800);
    return () => window.clearTimeout(timer);
  }, [locationHint]);

  function selectCafe(id: string) {
    if (id === focusCafeId) {
      setSettledCafeId(id);
      return;
    }

    setSettledCafeId(undefined);
    setFollowUser(false);
    setFocusCafeId(id);
    router.push(`/?cafe=${encodeURIComponent(id)}`, { scroll: false });
  }

  function goHome() {
    setSettledCafeId(undefined);
    setFocusCafeId(undefined);
    setFollowUser(false);
    setCameraTick((tick) => tick + 1);
    router.push("/", { scroll: false });
  }

  async function locateMe() {
    if (locating) return;
    setLocating(true);
    setLocationHint(null);
    try {
      const point = await getCurrentPosition();
      setUserLocation(point);
      setSettledCafeId(undefined);
      setFocusCafeId(undefined);
      setFollowUser(true);
      setCameraTick((tick) => tick + 1);
      router.push("/", { scroll: false });
    } catch (error) {
      const kind = error instanceof LocationError ? error.kind : "unavailable";
      setLocationHint(
        kind === "denied" ? "위치 권한이 없어요" : "위치를 찾지 못했어요",
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col gap-2 overflow-hidden bg-paper px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[24px] bg-wash shadow-chip ring-1 ring-ink/8">
        <NaverMap
          cafes={cafes}
          visibleCafeIds={filterIds.length > 0 ? visibleIds : undefined}
          highlightedCafeIds={highlightedCafeIds}
          focusCafeId={focusCafeId}
          userLocation={userLocation}
          followUser={followUser}
          cameraTick={cameraTick}
          onSelectCafe={selectCafe}
          onFocusSettled={(id) => {
            if (id === focusCafeId) setSettledCafeId(id);
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-3">
          <div className="px-3">
            <div className="mx-auto flex w-fit max-w-full items-start gap-2.5">
              <h1 className="pointer-events-auto flex h-11 shrink-0 items-center">
                <button
                  type="button"
                  onClick={goHome}
                  aria-label="홈"
                  className="inline-flex cursor-pointer items-center font-display text-4xl leading-none text-ink [text-shadow:0_1px_10px_rgba(255,251,247,0.95)]"
                >
                  아바라
                </button>
              </h1>
              <div className="flex w-max min-w-0 max-w-full flex-col gap-2">
                <CafeSearch
                  cafes={cafes}
                  onOpenChange={(open) => {
                    setSearchOpen(open);
                    if (open) setSettledCafeId(undefined);
                  }}
                  onSelectCafe={selectCafe}
                />
                <div className={searchOpen ? "invisible" : undefined}>
                  <MenuFilterChips
                    selectedIds={filterIds}
                    onChange={(ids) => {
                      setSettledCafeId(undefined);
                      setFilterIds(ids);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {filterIds.length > 0 ? (
          <p className="pointer-events-none absolute bottom-4 left-4 z-10">
            <span className="rounded-full bg-surface/95 px-3 py-1.5 text-sm font-semibold text-muted shadow-float ring-1 ring-ink/8">
              {visibleCafes.length}카페
            </span>
          </p>
        ) : null}
        <div className="pointer-events-none absolute right-4 bottom-4 z-10 flex flex-col items-end gap-2">
          {locationHint ? (
            <p className="rounded-full bg-surface/95 px-3 py-1.5 text-sm font-semibold text-muted shadow-float ring-1 ring-ink/8">
              {locationHint}
            </p>
          ) : null}
          {followUser ? (
            <div className="pointer-events-auto">
              <HomeButton onClick={goHome} />
            </div>
          ) : null}
          <div className="pointer-events-auto">
            <MyLocationButton
              locating={locating}
              active={followUser}
              onClick={() => {
                void locateMe();
              }}
            />
          </div>
        </div>
      </div>
      <AccountDock cafes={cafes} onSelectCafe={selectCafe} />
      {selectedCafe ? (
        <CafePopup
          cafe={selectedCafe}
          from={userLocation}
          onClose={() => setSettledCafeId(undefined)}
          onGoHome={goHome}
        />
      ) : null}
      <LoginPrompt />
      <PreferredDrinksSheet />
    </div>
  );
}
