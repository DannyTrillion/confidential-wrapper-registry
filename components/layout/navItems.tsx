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
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <rect x="2.5" y="4.5" width="13" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M12 9.2h.01M2.5 7h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

/** Secondary destinations — shown in the top bar after the primary set (and
 *  reachable via ⌘K everywhere). Not part of the mobile tab bar. */
export const EXTRA_NAV_ITEMS: NavItem[] = [
  {
    href: "/docs",
    label: "Guide",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <path d="M3.5 3.5h7a2 2 0 0 1 2 2v9H5.5a2 2 0 0 1-2-2v-9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M12.5 5.5h2v9H5.5M6 6.5h4M6 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/developers",
    label: "Developers",
    short: "Devs",
    icon: (
      <svg viewBox="0 0 18 18" className={cls} fill="none" aria-hidden="true">
        <path d="M6.5 5.5 3 9l3.5 3.5M11.5 5.5 15 9l-3.5 3.5M10 3.5 8 14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];
