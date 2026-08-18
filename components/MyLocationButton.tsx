type MyLocationButtonProps = {
  locating: boolean;
  active: boolean;
  onClick: () => void;
};

export function MyLocationButton({
  locating,
  active,
  onClick,
}: MyLocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      aria-label="내 위치"
      aria-pressed={active}
      aria-busy={locating}
      className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full shadow-float ring-1 transition-colors ${
        active
          ? "bg-accent text-on-accent ring-accent/20"
          : "bg-surface/95 text-ink ring-ink/8 backdrop-blur-md"
      } disabled:cursor-wait disabled:opacity-70`}
    >
      {locating ? <SpinnerIcon /> : <LocateIcon />}
    </button>
  );
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10 3.2v1.8M10 15v1.8M3.2 10h1.8M15 10h1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px] animate-spin" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.8"
      />
      <path
        d="M16.5 10a6.5 6.5 0 0 0-6.5-6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
