/**
 * Re-mounts on every route change, so the content area gets a gentle entrance
 * when navigating between pages. Reduced-motion neutralizes it (globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-rise-in">{children}</div>;
}
