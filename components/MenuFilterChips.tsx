"use client";

import { MENU_FILTERS } from "@/lib/menu-filters";

type MenuFilterChipsProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function MenuFilterChips({
  selectedIds,
  onChange,
}: MenuFilterChipsProps) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange([]);
      return;
    }

    onChange([id]);
  }

  return (
    <div
      className="pointer-events-auto flex w-max max-w-full gap-2 overflow-x-auto py-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="대표 메뉴 필터"
    >
      {MENU_FILTERS.map((filter) => {
        const active = selectedIds.includes(filter.id);

        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(filter.id)}
            className={`inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border-2 px-3 text-sm font-medium shadow-chip transition-colors ${
              active
                ? "border-accent bg-accent text-on-accent"
                : "border-ink bg-surface/95 text-ink backdrop-blur-md"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
