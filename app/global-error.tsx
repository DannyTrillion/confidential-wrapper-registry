"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for failures in the root layout itself. Renders its own
 * <html>/<body> with inline styles, since the app's CSS may not have mounted.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#000",
          color: "#EDEDEF",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              margin: "0 auto",
              borderRadius: 12,
              background: "#FFD208",
              display: "grid",
              placeItems: "center",
              color: "#000",
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ marginTop: 20, fontSize: 20, fontWeight: 600 }}>The app failed to load</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#A1A1AA", lineHeight: 1.6 }}>
            An unexpected error stopped the page from rendering. Please reload — your wallet and balances are
            unaffected.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              height: 36,
              padding: "0 18px",
              borderRadius: 999,
              border: "none",
              background: "#FFD208",
              color: "#000",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
