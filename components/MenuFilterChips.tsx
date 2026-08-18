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
      className="pointer-events-auto flex w-max max-w-full gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className={`inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full px-3 text-sm font-medium shadow-chip ring-1 transition-colors ${
              active
                ? "bg-accent text-on-accent ring-accent"
                : "bg-surface/95 text-ink ring-ink/8 backdrop-blur-md"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
