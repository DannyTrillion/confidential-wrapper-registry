import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "valid" | "revoked" | "pending" | "neutral" | "accent";

const tones: Record<Tone, string> = {
  // Yellow is the app's major accent — "valid/active" wears it. Red/amber stay
  // semantic for revoked/pending; green is reserved for transient success only.
  valid: "text-accentInk bg-accent/10 border-accent/20",
  revoked: "text-danger bg-danger/10 border-danger/20",
  pending: "text-warn bg-warn/10 border-warn/20",
  neutral: "text-ink-muted bg-raised border-line",
  accent: "text-ink bg-elevate/[0.10] border-line-strong",
};

/** Pill badge — full radius, hairline border, 11px uppercase-ish label. */
export function Badge({
  tone = "neutral",
  children,
  dot,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-2xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-pill", dotColor(tone))} />}
      {children}
    </span>
  );
}

function dotColor(tone: Tone): string {
  switch (tone) {
    case "valid":
      return "bg-accent";
    case "revoked":
      return "bg-danger";
    case "pending":
      return "bg-warn animate-pulse";
    case "accent":
      return "bg-ink";
    default:
      return "bg-ink-faint";
  }
}
