"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navItems";
import { cn } from "@/lib/cn";

/** Bottom tab bar for small screens — fits all sections evenly. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              data-tour={`nav-${item.href}`}
              className={cn(
                "flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 transition-colors",
                active ? "text-accentInk" : "text-ink-faint",
              )}
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">
                {item.short ?? item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
