import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "valid" | "revoked" | "pending" | "neutral" | "accent";

const tones: Record<Tone, string> = {
  // Status colors used ONLY for their meaning. Muted, desaturated.
  valid: "text-ok bg-ok/10 border-ok/20",
  revoked: "text-danger bg-danger/10 border-danger/20",
  pending: "text-warn bg-warn/10 border-warn/20",
  neutral: "text-ink-muted bg-raised border-line",
  accent: "text-accentInk bg-accent-soft border-accent/25",
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
      return "bg-ok";
    case "revoked":
      return "bg-danger";
    case "pending":
      return "bg-warn animate-pulse";
    case "accent":
      return "bg-accent";
    default:
      return "bg-ink-faint";
  }
}
