"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";

type Variant = "primary" | "accentOutline" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-input " +
  "transition-[color,background-color,border-color,transform] duration-150 ease-out " +
  "active:scale-[0.97] select-none whitespace-nowrap " +
  "disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100";

const variants: Record<Variant, string> = {
  // The single WARM action accent — flat champagne fill, no halo. At most one
  // of these should be visible per screen; secondary/ghost carry the rest.
  primary:
    "bg-accent text-[#0a0a0a] hover:brightness-[1.06] active:brightness-95 focus-visible:ring-accent",
  // Restrained accent: reads as the primary action without a loud yellow fill.
  // Calm at rest (faint accent tint + hairline border, gold/yellow text); the
  // hover leans further into yellow to confirm it's interactive.
  accentOutline:
    "bg-ink/[0.06] text-ink border border-line-strong " +
    "hover:bg-ink/[0.12] hover:border-line-strong active:bg-ink/[0.18] " +
    "focus-visible:ring-accent",
  secondary:
    "bg-elevate/[0.03] text-ink border border-line hover:border-line-strong hover:bg-elevate/[0.07] " +
    "focus-visible:ring-accent",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-elevate/[0.05] " +
    "focus-visible:ring-accent",
  danger:
    "bg-transparent text-danger border border-danger/30 hover:bg-danger/10 " +
    "focus-visible:ring-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-13",
  md: "h-10 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, disabled, className, children, onPointerDown, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      onPointerDown={(e) => {
        // A light tap on press for the main action; no-op off touch devices.
        if (variant === "primary" || variant === "accentOutline") haptics.tap();
        onPointerDown?.(e);
      }}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin h-3.5 w-3.5", className)}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
