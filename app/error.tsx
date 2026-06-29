"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Mascot } from "@/components/onboarding/Mascot";

/**
 * Route-level error boundary. Catches render/runtime throws (e.g. a relayer or
 * WASM init failure that escapes a component) and offers a branded recovery
 * instead of Next.js's raw error screen.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-md text-center">
        <Mascot mood="think" size={84} className="mx-auto" />
        <h1 className="mt-5 text-xl font-semibold text-ink tracking-tight">Something went sideways</h1>
        <p className="mt-2 text-13 text-ink-muted leading-relaxed">
          A part of the app hit an unexpected error. Your funds and balances are untouched — this is just the
          screen. Try again, or head back to the registry.
        </p>
        {error?.message && (
          <p className="mt-3 font-mono text-2xs text-ink-faint break-words rounded-input border border-line bg-base/60 px-3 py-2 max-h-24 overflow-auto">
            {error.message}
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            onClick={reset}
            className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-semibold bg-accent text-[#0a0a0a] hover:brightness-105 active:scale-[0.97] transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="h-9 px-4 inline-flex items-center rounded-pill text-13 font-medium text-ink-muted border border-line hover:border-line-strong hover:text-ink transition-colors"
          >
            Back to registry
          </Link>
        </div>
      </div>
    </div>
  );
}
