"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { Mascot, type MascotMood } from "./Mascot";

/** Fire this event from anywhere to (re)start the tour: `window.dispatchEvent(new Event(TOUR_START_EVENT))`. */
export const TOUR_START_EVENT = "wr:start-tour";
const SEEN_KEY = "wr:onboarded:v2";

interface Step {
  /** data-tour value of the element to spotlight; null = centered welcome/finish card. */
  target: string | null;
  mood: MascotMood;
  title: string;
  body: string;
  /** Final-step call-to-action label; clicking it runs `onFinish`. */
  cta?: string;
}

const STEPS: Step[] = [
  {
    target: null,
    mood: "wave",
    title: "Hi, I'm Cipher 👋",
    body: "Give me 30 seconds and I'll show you around. This app lets you turn ordinary tokens into confidential ones — where only you can see the amount you hold.",
  },
  {
    target: "nav-/",
    mood: "point",
    title: "The Registry",
    body: "Your home base. It lists every token that has an approved confidential twin. Pick one to make a confidential version of it.",
  },
  {
    target: "nav-/balances",
    mood: "point",
    title: "My Balances",
    body: "Every confidential balance you hold, in one place. The amounts stay hidden on-screen until you choose to reveal them — just for you.",
  },
  {
    target: "nav-/decrypt",
    mood: "think",
    title: "Reveal",
    body: "Check the real amount of any confidential token. You approve it once with your wallet, and only you can read the result.",
  },
  {
    target: "nav-/faucet",
    mood: "point",
    title: "Faucet",
    body: "On the practice network, grab free test tokens here — so you can try everything risk-free before using real funds.",
  },
  {
    target: "nav-/activity",
    mood: "point",
    title: "Activity",
    body: "A live feed of what's happening across the registry: tokens being made confidential, sent, and turned back into public ones.",
  },
  {
    target: "search",
    mood: "idle",
    title: "Quick search",
    body: "Press ⌘K (or Ctrl+K) anytime to jump straight to a token or a page. The fastest way to get around.",
  },
  {
    target: "connect",
    mood: "wave",
    title: "Connect your wallet",
    body: "When you're ready, connect your wallet here. That's what lets you make tokens confidential, send them, and reveal your own balances.",
  },
  {
    target: null,
    mood: "celebrate",
    title: "That's the tour! 🎉",
    body: "Want the plain-English explainer — what all of this actually is and why it's confidential? I'll take you to the Guide.",
    cta: "Open the Guide",
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Find the first VISIBLE element with the given data-tour value (sidebar on
 *  desktop, bottom nav on mobile — both carry the same attribute). */
function findTarget(name: string): Element | null {
  const els = Array.from(document.querySelectorAll(`[data-tour="${name}"]`));
  return (
    els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) ?? null
  );
}

export function OnboardingTour() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(running, cardRef);

  const step = STEPS[i];

  const start = useCallback(() => {
    setI(0);
    setRunning(true);
  }, []);

  const finish = useCallback(() => {
    setRunning(false);
    setRect(null);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Auto-start exactly once for first-time visitors (we mark it seen the moment
  // it opens, so it never re-pops on later navigations); always replayable via
  // the event.
  useEffect(() => {
    const onStart = () => start();
    window.addEventListener(TOUR_START_EVENT, onStart);
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!window.localStorage.getItem(SEEN_KEY)) {
        t = setTimeout(() => {
          try {
            window.localStorage.setItem(SEEN_KEY, "1");
          } catch {
            /* ignore */
          }
          start();
        }, 900);
      }
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener(TOUR_START_EVENT, onStart);
      if (t) clearTimeout(t);
    };
  }, [start]);

  // Lock scroll + wire keyboard while running.
  useEffect(() => {
    if (!running) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") setI((v) => Math.min(STEPS.length - 1, v + 1));
      else if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [running, finish]);

  // Measure the current target (and keep it fresh on resize/scroll).
  useLayoutEffect(() => {
    if (!running) return;
    if (!step.target) {
      setRect(null);
      return;
    }
    let raf = 0;
    const measure = () => {
      const el = findTarget(step.target!);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [running, step.target, i]);

  if (!running) return null;

  const last = i === STEPS.length - 1;
  const onCta = () => {
    finish();
    router.push("/docs");
  };

  // Position the speech card relative to the spotlight, clamped to the viewport.
  const card = computeCardPosition(rect);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Welcome tour">
      {/* Backdrop. When there's a target, the spotlight div paints the dim via its
          huge box-shadow; otherwise we dim the whole screen here. */}
      {!rect && <div className={cn("absolute inset-0 bg-black/70 backdrop-blur-[2px]", !reduced && "animate-fade-in")} />}

      {/* Spotlight cutout */}
      {rect && (
        <div
          className={cn("absolute rounded-input pointer-events-none", reduced ? "" : "animate-spotlight")}
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: reduced
              ? "0 0 0 9999px rgba(2,2,4,0.74), 0 0 0 2px rgba(255,210,8,0.9)"
              : undefined,
            transition: "all 280ms cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      )}

      {/* Click-catcher so the page underneath isn't interactive mid-tour. */}
      <button
        type="button"
        aria-label="Skip tour"
        onClick={finish}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      {/* Speech card */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className={cn(
          "absolute w-[min(92vw,360px)] rounded-card border border-accent/30 bg-surface/95 backdrop-blur-2xl shadow-2xl p-5 outline-none",
          !reduced && "animate-rise-in",
        )}
        style={card}
        key={i}
      >
        <div className="flex items-start gap-3">
          <Mascot mood={step.mood} size={64} float={!reduced} className="-mt-1" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink tracking-tight">{step.title}</h3>
            <p className="mt-1.5 text-13 text-ink-muted leading-relaxed">{step.body}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-4 flex items-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-pill transition-all duration-300",
                idx === i ? "w-5 bg-accent" : idx < i ? "w-1.5 bg-accent/50" : "w-1.5 bg-line-strong",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={finish}
            className="text-2xs text-ink-faint hover:text-ink-muted transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                onClick={() => setI((v) => Math.max(0, v - 1))}
                className="h-8 px-3 rounded-pill text-13 font-medium text-ink-muted border border-line hover:border-line-strong hover:text-ink transition-colors"
              >
                Back
              </button>
            )}
            {last ? (
              <button
                onClick={onCta}
                className="h-8 px-4 rounded-pill text-13 font-semibold bg-accent text-[#0a0a0a] hover:brightness-105 active:scale-[0.97] transition"
              >
                {step.cta ?? "Done"}
              </button>
            ) : (
              <button
                onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}
                className="h-8 px-4 rounded-pill text-13 font-semibold bg-accent text-[#0a0a0a] hover:brightness-105 active:scale-[0.97] transition"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Place the card next to the spotlight (right of a left-rail item, above a
 *  bottom-nav item) or dead-center when there's no target. All values clamped. */
function computeCardPosition(rect: Rect | null): React.CSSProperties {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const CARD_W = Math.min(360, vw * 0.92);
  const CARD_H = 230; // approximate; only used for clamping
  const M = 16;

  if (!rect) {
    return {
      left: Math.round((vw - CARD_W) / 2),
      top: Math.round(Math.max(M, vh * 0.5 - CARD_H * 0.7)),
    };
  }

  let left: number;
  let top: number;

  if (rect.left + rect.width < vw * 0.5) {
    // Left-side target (desktop sidebar) → card to the right.
    left = rect.left + rect.width + M;
    top = rect.top - 8;
  } else if (rect.top > vh * 0.6) {
    // Bottom target (mobile nav) → card above, horizontally centered on it.
    left = rect.left + rect.width / 2 - CARD_W / 2;
    top = rect.top - CARD_H - M;
  } else {
    // Top-right target (search / connect) → card below.
    left = rect.left + rect.width - CARD_W;
    top = rect.top + rect.height + M;
  }

  left = Math.max(M, Math.min(left, vw - CARD_W - M));
  top = Math.max(M, Math.min(top, vh - CARD_H - M));
  return { left: Math.round(left), top: Math.round(top) };
}
