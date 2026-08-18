"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTaste } from "@/components/TasteProvider";
import { MENU_FILTERS } from "@/lib/menu-filters";
import { isDrinkId } from "@/lib/taste";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

export function PreferredDrinksSheet() {
  const { drinksOpen, preferredDrinkIds, setDrinkChecked, dismissDrinks } =
    useTaste();
  const mounted = useSyncExternalStore(subscribe, client, server);

  useEffect(() => {
    if (!drinksOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissDrinks();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismissDrinks, drinksOpen]);

  if (!mounted || !drinksOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="abara-backdrop absolute inset-0 bg-ink/25"
        onClick={dismissDrinks}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferred-drinks-title"
        className="abara-popup relative mb-1 w-full max-w-sm overflow-hidden rounded-[28px] bg-surface p-5 shadow-popup ring-1 ring-ink/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] text-vanilla">취향</p>
            <h2
              id="preferred-drinks-title"
              className="mt-0.5 text-xl font-bold leading-snug text-ink"
            >
              내가 시킬 것
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              맞는 카페에 컵 표시가 붙어요. 다른 카페는 그대로 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissDrinks}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-faint transition-colors hover:bg-wash hover:text-muted"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MENU_FILTERS.map((filter) => {
            const id = filter.id;
            if (!isDrinkId(id)) return null;
            const checked = preferredDrinkIds.includes(id);

            return (
              <button
                key={id}
                type="button"
                aria-pressed={checked}
                onClick={() => setDrinkChecked(id, !checked)}
                className={`inline-flex h-9 cursor-pointer items-center rounded-full px-3 text-sm font-medium ring-1 transition-colors ${
                  checked
                    ? "bg-accent text-on-accent ring-accent"
                    : "bg-wash text-ink ring-ink/8"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CloseIcon() {
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
