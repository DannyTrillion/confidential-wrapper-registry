"use client";

import { useEffect, useState } from "react";
import { haptics } from "@/lib/haptics";

/** Theme key + the inline script that applies the saved/system theme before
 *  first paint (no flash). Imported by the root layout. */
export const THEME_KEY = "wr:theme";
export const THEME_SCRIPT = `try{var s=localStorage.getItem('${THEME_KEY}');var l=s?s==='light':matchMedia('(prefers-color-scheme: light)').matches;if(l)document.documentElement.classList.add('light');}catch(e){}`;

/** A sun/moon button that flips between the dark (default) and light themes by
 *  toggling `.light` on <html>, and remembers the choice. */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    haptics.tap();
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className="group grid place-items-center h-9 w-9 rounded-pill border border-line text-ink-faint hover:text-ink hover:border-line-strong transition-colors"
    >
      {light ? (
        // currently light → show moon (tap = go dark)
        <svg viewBox="0 0 18 18" className="h-4 w-4 animate-pop-in transition-transform duration-300 ease-out group-hover:-rotate-12" fill="none" aria-hidden="true">
          <path d="M14.5 10.5A6 6 0 0 1 7.5 3.5a6 6 0 1 0 7 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      ) : (
        // currently dark → show sun (tap = go light)
        <svg viewBox="0 0 18 18" className="h-4 w-4 animate-pop-in transition-transform duration-500 ease-out group-hover:rotate-45" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="3.3" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 1.8v1.6M9 14.6v1.6M16.2 9h-1.6M3.4 9H1.8M14.1 14.1l-1.1-1.1M5 5 3.9 3.9M14.1 3.9 13 5M5 13l-1.1 1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
