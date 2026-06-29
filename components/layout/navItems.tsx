import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the mobile tab bar (falls back to `label`). */
  short?: string;
  icon: ReactNode;
}

const cls = "h-[18px] w-[18px]";

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Registry",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <rect x="2.5" y="3" width="13" height="3.2" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2.5" y="8.4" width="13" height="3.2" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2.5" y="13.8" width="9" height="1.2" rx="0.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/balances",
    label: "My Balances",
    short: "Balances",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <rect x="2.5" y="4.5" width="13" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M12 9.2h.01M2.5 7h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/reveal",
    label: "Reveal",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <circle cx="6.8" cy="6.8" r="3.6" stroke="currentColor" strokeWidth="1.3" />
        <path d="m9.4 9.4 4.6 4.6M12 12l1.6-1.6M11 13l1.6-1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/faucet",
    label: "Faucet",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <path d="M9 2.5c2.8 3.4 4.5 5.7 4.5 7.7a4.5 4.5 0 0 1-9 0c0-2 1.7-4.3 4.5-7.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <path d="M2.5 9.5h3l2-5 2.5 9 2-4h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];
