"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, EXTRA_NAV_ITEMS } from "./navItems";
import { BrandGlyph } from "./BrandGlyph";
import { TOUR_START_EVENT } from "@/components/onboarding/OnboardingTour";
import { cn } from "@/lib/cn";

const DOCS = "https://docs.zama.org/protocol/protocol-apps/confidential-tokens/wrapper-registry";

/**
 * jup.ag-style left rail: logo on top, labeled nav items (active = soft raised
 * pill, no bright colors), a muted section label before secondary destinations,
 * and utility links pinned to the bottom. Desktop only; mobile uses the tab bar.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-line bg-base z-40">
      <Link href="/" className="group h-14 flex items-center gap-2.5 px-4 shrink-0">
        <span className="grid place-items-center h-8 w-8 rounded-input bg-raised shrink-0 transition-transform duration-250 ease-out group-hover:rotate-6 group-hover:scale-105">
          <BrandGlyph className="h-4 w-4 text-accentInk" />
        </span>
        <span className="leading-none">
          <span className="block text-13 font-semibold text-ink">Wrapper Registry</span>
          <span className="block text-[10px] text-ink-ghost mt-1 uppercase tracking-[0.12em]">
            Confidential · FHE
          </span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="Primary">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <SideLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>

        <div className="mt-5 mb-1.5 px-3 text-2xs uppercase tracking-[0.12em] text-ink-ghost">
          Learn &amp; build
        </div>
        <ul className="space-y-0.5">
          {EXTRA_NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <SideLink item={item} pathname={pathname} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-2.5 py-3 border-t border-line space-y-0.5">
        <button
          onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
          className="w-full flex items-center gap-2.5 h-8 px-3 rounded-input text-13 text-ink-faint hover:text-ink hover:bg-raised/60 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5.2v.01M7 7.4h1v3.4M6.8 10.8h2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Take a tour
        </button>
        <a
          href={DOCS}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 h-8 px-3 rounded-input text-13 text-ink-faint hover:text-ink hover:bg-raised/60 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M9 3h4v4M13 3 7 9M7 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Developer docs
        </a>
      </div>
    </aside>
  );
}

function SideLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: React.ReactNode };
  pathname: string;
}) {
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      data-tour={`nav-${item.href}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 h-9 px-3 rounded-input text-13 font-medium transition-colors duration-150",
        active
          ? "text-ink bg-raised/80"
          : "text-ink-faint hover:text-ink hover:bg-raised/50",
      )}
    >
      <span
        className={cn(
          "shrink-0 transition-transform duration-200 ease-out group-hover:scale-110",
          active ? "text-accentInk" : "",
        )}
      >
        {item.icon}
      </span>
      <span className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
        {item.label}
      </span>
    </Link>
  );
}
