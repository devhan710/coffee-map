"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTaste } from "@/components/TasteProvider";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

export function LoginPrompt() {
  const { loginOpen, loginHint, signInGoogle, dismissLogin } = useTaste();
  const mounted = useSyncExternalStore(subscribe, client, server);

  useEffect(() => {
    if (!loginOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissLogin();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismissLogin, loginOpen]);

  if (!mounted || !loginOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="abara-backdrop absolute inset-0 bg-ink/25"
        onClick={dismissLogin}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="abara-popup relative mb-1 w-full max-w-sm overflow-hidden rounded-[28px] bg-surface p-5 shadow-popup ring-1 ring-ink/10"
      >
        <p className="text-xs font-medium tracking-[0.12em] text-vanilla">아바라</p>
        <h2 id="login-prompt-title" className="mt-2 text-xl font-bold leading-snug text-ink">
          찜이랑 내 음료
          <br />
          다음에 와도 그대로예요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          지도랑 검색은 그대로 볼 수 있어요. 나중에 해도 됩니다.
        </p>
        {loginHint ? (
          <p className="mt-3 rounded-2xl bg-wash px-3 py-2 text-sm text-muted">{loginHint}</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            void signInGoogle();
          }}
          className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
        >
          <GoogleMark />
          Google로 로그인
        </button>
        <button
          type="button"
          onClick={dismissLogin}
          className="mt-2 w-full cursor-pointer rounded-2xl px-4 py-3.5 text-sm font-medium text-muted transition-colors hover:bg-wash hover:text-ink"
        >
          나중에
        </button>
      </div>
    </div>,
    document.body,
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden>
      <path
        fill="#fff"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        opacity=".9"
      />
      <path
        fill="#fff"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
        opacity=".75"
      />
      <path
        fill="#fff"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.69 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33Z"
        opacity=".75"
      />
      <path
        fill="#fff"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        opacity=".9"
      />
    </svg>
  );
}
