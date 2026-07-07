"use client";

import { Fragment } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Button";

/**
 * Horizontal progress stepper. `current` = number of completed steps; the step
 * at index `current` is active (spinner) unless `failed`. Completed steps draw a
 * checkmark in and their trailing connector fills with accent.
 */
export function Stepper({
  steps,
  current,
  failed = false,
}: {
  steps: string[];
  current: number;
  failed?: boolean;
}) {
  return (
    <div className="flex items-start">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current && !failed;
        const errored = i === current && failed;
        return (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <Node done={done} active={active} errored={errored} index={i} />
              <span
                className={cn(
                  "text-2xs font-medium whitespace-nowrap transition-colors duration-200",
                  done || active ? "text-ink" : errored ? "text-danger" : "text-ink-faint",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mt-3 mx-1.5 rounded-pill bg-line relative overflow-hidden">
                <span
                  className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-300 ease-out"
                  style={{ width: done ? "100%" : "0%" }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Node({ done, active, errored, index }: { done: boolean; active: boolean; errored: boolean; index: number }) {
  return (
    <span
      className={cn(
        "grid place-items-center h-6 w-6 rounded-pill border text-2xs font-mono transition-colors duration-200",
        done && "border-line-strong bg-ink text-base",
        active && "border-line-strong bg-elevate/[0.06] text-ink",
        errored && "border-danger/40 bg-danger/10 text-danger",
        !done && !active && !errored && "border-line bg-raised text-ink-faint",
      )}
    >
      {done ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="m4 8.5 2.5 2.5L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check" />
        </svg>
      ) : active ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : errored ? (
        "!"
      ) : (
        index + 1
      )}
    </span>
  );
}
