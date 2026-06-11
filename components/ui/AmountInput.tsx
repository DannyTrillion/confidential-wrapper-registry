"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Mono, tabular amount input with a unit suffix and optional MAX. Shakes once
 *  (the field only) when it first becomes invalid. */
export function AmountInput({
  value,
  onChange,
  symbol,
  onMax,
  disabled,
  invalid,
  placeholder = "0.0",
}: {
  value: string;
  onChange: (v: string) => void;
  symbol?: string;
  onMax?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [shaking, setShaking] = useState(false);
  const prevInvalid = useRef(false);

  // Shake only on the false → true transition, so it nudges once, not per keystroke.
  useEffect(() => {
    if (invalid && !prevInvalid.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 380);
      prevInvalid.current = true;
      return () => clearTimeout(t);
    }
    if (!invalid) prevInvalid.current = false;
  }, [invalid]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-12 px-3 rounded-input border bg-base transition-colors duration-150",
        invalid ? "border-danger/50" : "border-line focus-within:border-accent/50",
        disabled && "opacity-50",
        shaking && "animate-shake",
      )}
    >
      <input
        inputMode="decimal"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^\d*\.?\d*$/.test(v)) onChange(v);
        }}
        className="flex-1 min-w-0 bg-transparent font-mono text-lg tabular-nums text-ink placeholder:text-ink-ghost outline-none"
        aria-label="Amount"
        aria-invalid={invalid}
      />
      {symbol && <span className="font-mono text-13 text-ink-faint shrink-0">{symbol}</span>}
      {onMax && (
        <button
          type="button"
          onClick={onMax}
          disabled={disabled}
          className="shrink-0 text-2xs font-medium text-accent hover:text-[#FFDB3D] px-1.5 py-0.5 rounded-[4px] hover:bg-accent-faint transition-colors duration-150"
        >
          MAX
        </button>
      )}
    </div>
  );
}
