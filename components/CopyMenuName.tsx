"use client";

import { useState } from "react";

type CopyMenuNameProps = {
  name: string;
  variant: "signature" | "candidate";
};

export function CopyMenuName({ name, variant }: CopyMenuNameProps) {
  const [copied, setCopied] = useState(false);
  const isSignature = variant === "signature";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${name} 복사`}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 text-left ring-1 ring-ink/10 transition-colors hover:bg-wash ${
        isSignature ? "py-4" : "py-3"
      }`}
    >
      <span
        className={
          isSignature
            ? "min-w-0 text-lg font-bold leading-normal text-ink"
            : "min-w-0 text-sm font-medium leading-normal text-ink"
        }
      >
        {name}
      </span>
      {copied ? <span className="text-sm text-faint">복사됨</span> : null}
    </button>
  );
}
