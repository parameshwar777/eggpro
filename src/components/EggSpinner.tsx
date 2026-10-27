interface EggSpinnerProps {
  size?: number;
  className?: string;
}

/** Egg-shaped loading spinner — the egg itself rotates while a total or coupon quote refreshes. */
export function EggSpinner({ size = 22, className = "" }: EggSpinnerProps) {
  const height = Math.round((size * 40) / 32);
  return (
    <svg
      role="status"
      aria-hidden="true"
      viewBox="0 0 32 40"
      width={size}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin shrink-0 ${className}`}
      style={{ animationDuration: "1.1s" }}
    >
      <path d="M16 3c7.2 0 13 10.2 13 19a13 13 0 0 1-26 0c0-8.8 5.8-19 13-19Z" fill="currentColor" opacity="0.18" />
      <path d="M16 6c5.9 0 10.6 8.4 10.6 15.8a10.6 10.6 0 0 1-21.2 0C5.4 14.4 10.1 6 16 6Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="62 22" />
      <circle cx="16" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}
