"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { haptics } from "@/lib/haptics";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-pill " +
  "transition-[color,background-color,border-color,transform] duration-150 ease-out " +
  "active:scale-[0.97] select-none whitespace-nowrap " +
  "disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100";

const variants: Record<Variant, string> = {
  // Zama-yellow pill for the primary action.
  primary:
    "btn-sheen bg-accent text-base hover:bg-[#FFDB3D] active:bg-[#E6BD00] " +
    "focus-visible:ring-accent",
  secondary:
    "bg-white/[0.03] text-ink border border-line hover:border-line-strong hover:bg-white/[0.07] " +
    "focus-visible:ring-accent",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-white/[0.05] " +
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
        // A light tap on press for the primary action; no-op off touch devices.
        if (variant === "primary") haptics.tap();
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
