"use client";

import Image from "next/image";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CopyMenuName } from "@/components/CopyMenuName";
import { FavoriteButton } from "@/components/FavoriteButton";
import { KakaoShareButton } from "@/components/KakaoShareButton";
import { NaverMapLink } from "@/components/NaverMapLink";
import { RememberCafe } from "@/components/RememberCafe";
import type { GeoPoint } from "@/lib/geolocation";
import type { Cafe } from "@/lib/types";

type CafePopupProps = {
  cafe: Cafe;
  from?: GeoPoint | null;
  onClose: () => void;
  onGoHome: () => void;
};

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function CafePopup({ cafe, from, onClose, onGoHome }: CafePopupProps) {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="abara-backdrop absolute inset-0 bg-ink/25"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cafe-popup-title"
        className="abara-popup relative mb-1 flex max-h-[min(82dvh,40rem)] w-full max-w-sm flex-col overflow-hidden rounded-[28px] bg-surface shadow-popup ring-1 ring-ink/10"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-1">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.12em] text-vanilla">
              {cafe.dong}
            </p>
            <h2
              id="cafe-popup-title"
              className="mt-0.5 text-xl font-bold leading-normal text-ink"
            >
              {cafe.name}
            </h2>
            <p className="mt-1 text-sm text-faint">{cafe.address}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <FavoriteButton cafeId={cafe.id} />
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-faint transition-colors hover:bg-wash hover:text-muted"
              aria-label="닫기"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M6 6l8 8M14 6l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {cafe.photoThumb ? (
            <figure className="mt-4 overflow-hidden rounded-2xl bg-wash ring-1 ring-ink/10">
              <div className="relative aspect-[4/3]">
                <Image
                  src={cafe.photoThumb}
                  alt={`${cafe.name} ${cafe.signature?.name ?? "메뉴"} 실제 사진`}
                  fill
                  sizes="(max-width: 448px) calc(100vw - 72px), 352px"
                  className="object-cover"
                />
              </div>
              {cafe.photoSourceUrl ? (
                <figcaption className="px-3 py-2 text-right text-xs text-faint">
                  <a
                    href={cafe.photoSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-muted"
                  >
                    사진 출처
                  </a>
                </figcaption>
              ) : null}
            </figure>
          ) : null}
          {cafe.signature ? (
            <section className="mt-4">
              <p className="px-1 text-xs tracking-wide text-faint">대표 메뉴</p>
              <div className="mt-2">
                <CopyMenuName variant="signature" name={cafe.signature.name} />
              </div>
            </section>
          ) : (
            <section className="mt-4">
              <p className="px-1 text-xs tracking-wide text-faint">대표 메뉴</p>
              <div className="mt-2 rounded-2xl bg-wash px-5 py-5 ring-1 ring-ink/5">
                <p className="font-semibold text-ink">확인 중</p>
              </div>
            </section>
          )}
          {cafe.candidates && cafe.candidates.length > 0 ? (
            <section className="mt-4">
              <p className="px-1 text-xs tracking-wide text-faint">
                {cafe.signature ? "함께 확인된 메뉴" : "확인된 메뉴 후보"}
              </p>
              <ul className="mt-2 space-y-2">
                {cafe.candidates.slice(0, 2).map((menu) => (
                  <li key={menu.name}>
                    <CopyMenuName variant="candidate" name={menu.name} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <RememberCafe cafeId={cafe.id} />
          {cafe.signature ? (
            <KakaoShareButton
              cafeId={cafe.id}
              cafeName={cafe.name}
              menuName={cafe.signature.name}
            />
          ) : null}
          <NaverMapLink cafe={cafe} from={from} />
          <button
            type="button"
            onClick={onGoHome}
            className="mt-2 w-full cursor-pointer rounded-2xl px-4 py-3.5 text-sm font-medium text-muted transition-colors hover:bg-wash hover:text-ink"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
