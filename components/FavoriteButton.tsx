"use client";

import { useTaste } from "@/components/TasteProvider";

type FavoriteButtonProps = {
  cafeId: string;
};

export function FavoriteButton({ cafeId }: FavoriteButtonProps) {
  const { favoriteCafeIds, requestFavorite } = useTaste();
  const liked = favoriteCafeIds.has(cafeId);

  return (
    <button
      type="button"
      onClick={() => requestFavorite(cafeId)}
      aria-pressed={liked}
      aria-label={liked ? "찜 해제" : "찜"}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-faint transition-colors hover:bg-wash hover:text-muted"
    >
      <HeartIcon filled={liked} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <path
        d="M10 16.2 8.55 14.9C4.4 11.15 1.7 8.7 1.7 5.7A3.45 3.45 0 0 1 5.2 2.2c1.1 0 2.16.52 2.85 1.34L10 5.05l1.95-1.51A3.48 3.48 0 0 1 14.8 2.2a3.45 3.45 0 0 1 3.5 3.5c0 3-2.7 5.45-6.85 9.2L10 16.2Z"
        fill={filled ? "var(--vanilla)" : "none"}
        stroke={filled ? "var(--vanilla)" : "currentColor"}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
