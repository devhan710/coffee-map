"use client";

import { useState } from "react";

type KakaoShareButtonProps = {
  cafeId: string;
  cafeName: string;
  menuName: string;
};

function shareMessage(cafeName: string, menuName: string, url: string) {
  return `여기 이거 시키래\n${cafeName} · ${menuName}\n${url}`;
}

export function KakaoShareButton({
  cafeId,
  cafeName,
  menuName,
}: KakaoShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/cafes/${cafeId}`;
    const message = shareMessage(cafeName, menuName, url);

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="mt-4 w-full rounded-2xl bg-accent px-4 py-3.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
    >
      {copied ? "복사됨" : "여기 이거 시키래"}
    </button>
  );
}
