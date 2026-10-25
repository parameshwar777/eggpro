import type { SVGProps } from "react";

/** Hen silhouette with comb, beak, rounded body, tail and feet. */
export const WelcomeHen = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M40 16c-2-3-1-7 2-7 1-5 6-5 7-1 4-2 7 2 4 6 3 2 4 5 3 8l7 4-8 3c-1 4-4 7-8 8-2 12-12 17-24 15C10 50 5 40 8 31L1 17l13 7-2-12 15 17c4-1 8-1 11 1l1-8c0-3 0-5 1-6Z" />
    <path d="m23 49-2 10h-7v3h13l2-12m8 0 2 9h7v3H34l-3-12" />
    <circle cx="49" cy="22" r="2" className="fill-accent" />
  </svg>
);