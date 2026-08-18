"use client";

import { useMemo, type ReactNode } from "react";
import { useTaste } from "@/components/TasteProvider";
import { MENU_FILTERS } from "@/lib/menu-filters";
import type { Cafe } from "@/lib/types";

type AccountDockProps = {
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
};

const shell =
  "shrink-0 rounded-[28px] bg-surface px-5 py-4 shadow-chip ring-1 ring-ink/8";

export function AccountDock({ cafes, onSelectCafe }: AccountDockProps) {
  const {
    ready,
    user,
    preferredDrinkIds,
    favoriteCafeIds,
    requestDrinks,
    requestLogin,
    signOutUser,
  } = useTaste();
  const drinkLabels = useMemo(
    () =>
      MENU_FILTERS.filter((filter) => preferredDrinkIds.includes(filter.id)).map(
        (filter) => filter.label,
      ),
    [preferredDrinkIds],
  );
  const favorites = useMemo(
    () => cafes.filter((cafe) => favoriteCafeIds.has(cafe.id)),
    [cafes, favoriteCafeIds],
  );

  if (!ready) {
    return (
      <section className={shell} aria-hidden>
        <div className="flex h-10 items-center justify-between gap-3">
          <div className="h-4 w-48 rounded-full bg-wash" />
          <div className="h-10 w-16 rounded-full bg-wash" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className={shell}>
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm leading-snug text-muted">
            로그인하면 내 음료랑 찜한 카페가 여기 남아요
          </p>
          <button
            type="button"
            onClick={requestLogin}
            className="h-10 shrink-0 cursor-pointer rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            로그인
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={shell}>
      <div className="flex h-10 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-base font-semibold text-ink">
          {user.displayName ?? "로그인됨"}
        </p>
        <button
          type="button"
          onClick={() => {
            void signOutUser();
          }}
          className="h-10 shrink-0 cursor-pointer rounded-full px-3 text-sm font-medium text-muted transition-colors hover:bg-wash hover:text-ink"
        >
          로그아웃
        </button>
      </div>
      <DockRow label="내 음료" onClick={requestDrinks}>
        <span className="truncate text-ink">
          {drinkLabels.length > 0 ? drinkLabels.join(" · ") : "아직 안 골랐어요"}
        </span>
      </DockRow>
      <div className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl bg-wash px-4 py-3">
        <p className="w-[5.5rem] shrink-0 text-sm font-semibold text-vanilla">찜한 카페</p>
        {favorites.length === 0 ? (
          <p className="min-w-0 flex-1 truncate text-base text-muted">카페를 찜하면 여기 모여요</p>
        ) : (
          <div
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="찜한 카페"
          >
            {favorites.map((cafe) => (
              <button
                key={cafe.id}
                type="button"
                onClick={() => onSelectCafe(cafe.id)}
                className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full bg-surface px-3.5 text-sm font-medium text-ink ring-1 ring-ink/8"
              >
                {cafe.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DockRow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-2xl bg-wash px-4 py-3 text-left transition-colors hover:bg-wash/80"
    >
      <span className="w-[5.5rem] shrink-0 text-sm font-semibold text-vanilla">{label}</span>
      <span className="min-w-0 flex-1 text-base">{children}</span>
      <ChevronIcon />
    </button>
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
