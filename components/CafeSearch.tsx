"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTaste } from "@/components/TasteProvider";
import { searchCafes } from "@/lib/cafes";
import { getRecentCafes } from "@/lib/recent-cafes";
import { cafesMatchingDrinks } from "@/lib/taste";
import type { Cafe } from "@/lib/types";

type CafeSearchProps = {
  cafes: Cafe[];
  onOpenChange?: (open: boolean) => void;
  onSelectCafe: (cafeId: string) => void;
};

export function CafeSearch({ cafes, onOpenChange, onSelectCafe }: CafeSearchProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<Cafe[]>([]);
  const [open, setOpen] = useState(false);
  const { favoriteCafeIds, preferredDrinkIds } = useTaste();
  const results = useMemo(() => searchCafes(query, cafes), [cafes, query]);
  const favorites = useMemo(
    () => cafes.filter((cafe) => favoriteCafeIds.has(cafe.id)),
    [cafes, favoriteCafeIds],
  );
  const preferred = useMemo(() => {
    const favoriteSet = new Set(favorites.map((cafe) => cafe.id));
    return cafesMatchingDrinks(cafes, preferredDrinkIds).filter(
      (cafe) => !favoriteSet.has(cafe.id),
    );
  }, [cafes, favorites, preferredDrinkIds]);
  const hasQuery = query.trim().length > 0;

  function close() {
    setOpen(false);
    onOpenChange?.(false);
    inputRef.current?.blur();
  }

  function openSearch() {
    if (!open) {
      setOpen(true);
      onOpenChange?.(true);
    }
  }

  useEffect(() => {
    function refresh() {
      setRecent(getRecentCafes(cafes));
    }

    refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [cafes]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
        inputRef.current?.blur();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        onOpenChange?.(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="pointer-events-auto relative w-full">
      <form
        role="search"
        className="flex h-11 w-full min-w-0 items-center gap-2 rounded-full bg-surface/95 px-3.5 shadow-chip ring-1 ring-ink/8 backdrop-blur-md"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="cafe-search" className="sr-only">
          카페 이름
        </label>
        <SearchIcon />
        <input
          ref={inputRef}
          id="cafe-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={openSearch}
          placeholder="카페 이름"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 w-0 flex-1 appearance-none bg-transparent text-base text-ink outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-faint transition-colors hover:bg-wash hover:text-muted"
            aria-label="검색어 지우기"
          >
            <ClearIcon />
          </button>
        ) : null}
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[24px] bg-surface/95 shadow-panel ring-1 ring-ink/8 backdrop-blur-md">
          <div className="max-h-[min(52vh,22rem)] overflow-y-auto p-2">
            <SearchList
              hasQuery={hasQuery}
              results={results}
              favorites={favorites}
              preferred={preferred}
              recent={recent}
              onSelectCafe={(cafeId) => {
                close();
                onSelectCafe(cafeId);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SearchList({
  hasQuery,
  results,
  favorites,
  preferred,
  recent,
  onSelectCafe,
}: {
  hasQuery: boolean;
  results: Cafe[];
  favorites: Cafe[];
  preferred: Cafe[];
  recent: Cafe[];
  onSelectCafe: (cafeId: string) => void;
}) {
  if (hasQuery && results.length === 0) {
    return <p className="px-3 py-8 text-center text-sm text-muted">없는 카페</p>;
  }

  if (hasQuery && results.length > 0) {
    return (
      <ul className="flex flex-col gap-0.5">
        {results.map((cafe) => (
          <CafeRow key={cafe.id} cafe={cafe} onSelectCafe={onSelectCafe} />
        ))}
      </ul>
    );
  }

  const shown = new Set<string>();
  const favoriteRows = favorites.filter((cafe) => {
    shown.add(cafe.id);
    return true;
  });
  const preferredRows = preferred.filter((cafe) => {
    if (shown.has(cafe.id)) return false;
    shown.add(cafe.id);
    return true;
  });
  const recentRows = recent.filter((cafe) => {
    if (shown.has(cafe.id)) return false;
    shown.add(cafe.id);
    return true;
  });

  if (favoriteRows.length + preferredRows.length + recentRows.length === 0) {
    return (
      <p className="px-3 py-7 text-center text-sm leading-relaxed text-faint">
        카페 이름을 치면
        <br />
        대표 메뉴가 나와요
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {favoriteRows.length > 0 ? (
        <SearchSection title="찜한 카페" cafes={favoriteRows} onSelectCafe={onSelectCafe} />
      ) : null}
      {preferredRows.length > 0 ? (
        <SearchSection title="내 음료 카페" cafes={preferredRows} onSelectCafe={onSelectCafe} />
      ) : null}
      {recentRows.length > 0 ? (
        <SearchSection title="아까 본 카페" cafes={recentRows} onSelectCafe={onSelectCafe} />
      ) : null}
    </div>
  );
}

function SearchSection({
  title,
  cafes,
  onSelectCafe,
}: {
  title: string;
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
}) {
  return (
    <section>
      <p className="px-3 pb-1 pt-2 text-xs font-medium tracking-wide text-faint">
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {cafes.map((cafe) => (
          <CafeRow key={cafe.id} cafe={cafe} onSelectCafe={onSelectCafe} />
        ))}
      </ul>
    </section>
  );
}

function CafeRow({
  cafe,
  onSelectCafe,
}: {
  cafe: Cafe;
  onSelectCafe: (cafeId: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelectCafe(cafe.id)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-wash active:bg-wash/80"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash text-sm font-bold text-vanilla">
          {cafe.name.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-ink">
            {cafe.name}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {cafe.signature?.name ?? "대표 메뉴 확인 중"}
          </span>
        </span>
        <ChevronIcon />
      </button>
    </li>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0 text-faint"
      aria-hidden
    >
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12.5 12.5 16 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0 text-faint"
      aria-hidden
    >
      <path
        d="M8 5.5 12.5 10 8 14.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
