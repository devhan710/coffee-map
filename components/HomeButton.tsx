type HomeButtonProps = {
  onClick: () => void;
};

export function HomeButton({ onClick }: HomeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="홈"
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface/95 text-ink shadow-float ring-1 ring-ink/8 backdrop-blur-md"
    >
      <HomeIcon />
    </button>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]" aria-hidden>
      <path
        d="M3.8 9.2 10 3.8l6.2 5.4V16a.8.8 0 0 1-.8.8H4.6a.8.8 0 0 1-.8-.8V9.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7.6 16.8v-4.4h4.8v4.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
