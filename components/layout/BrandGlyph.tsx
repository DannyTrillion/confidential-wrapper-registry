/**
 * The brand mark — "wrap pair": an outer rounded square (the public token)
 * wrapping an inner half-filled circle (its confidential twin; ◐ = amount hidden).
 * Dark glyph designed to sit on the yellow accent tile. Used in the sidebar,
 * top bar, and footer so the logo lives in exactly one place.
 */
export function BrandGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      {/* outer shell — the public token doing the wrapping */}
      <rect x="2.6" y="2.6" width="14.8" height="14.8" rx="4.6" stroke="currentColor" strokeWidth="1.8" />
      {/* inner confidential twin */}
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      {/* right half filled → reads as "partly hidden" */}
      <path d="M10 6.5a3.5 3.5 0 0 1 0 7Z" fill="currentColor" />
    </svg>
  );
}
