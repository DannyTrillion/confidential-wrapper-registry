"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { explorerTxUrl } from "@/lib/networks";
import { haptics } from "@/lib/haptics";
import { Spinner } from "./Button";

type ToastStatus = "pending" | "success" | "error";

interface Toast {
  id: string;
  status: ToastStatus;
  title: string;
  message?: string;
  txHash?: string;
  chainId?: number;
}

interface ToastApi {
  upsert: (id: string, t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const upsert = useCallback(
    (id: string, t: Omit<Toast, "id">) => {
      setToasts((prev) => {
        const next = prev.some((x) => x.id === id)
          ? prev.map((x) => (x.id === id ? { id, ...t } : x))
          : [...prev, { id, ...t }];
        return next;
      });
      // Success auto-dismisses; pending/error persist (error until user acts).
      if (timers.current[id]) clearTimeout(timers.current[id]);
      if (t.status === "success") {
        haptics.success();
        timers.current[id] = setTimeout(() => dismiss(id), 6000);
      } else if (t.status === "error") {
        haptics.error();
      }
    },
    [dismiss],
  );

  useEffect(() => {
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  return (
    <Ctx.Provider value={{ upsert, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-0 right-0 z-[70] flex flex-col gap-2 p-4 w-[min(92vw,380px)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const tone =
    toast.status === "success"
      ? "border-ok/25"
      : toast.status === "error"
        ? "border-danger/25"
        : "border-warn/25";

  return (
    <div
      className={cn(
        "relative overflow-hidden pointer-events-auto rounded-card border bg-surface p-3 animate-toast-in flex items-start gap-2.5",
        tone,
      )}
    >
      {toast.status === "success" && (
        <span
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-ok/40"
          style={{ animation: "timer-bar 6000ms linear forwards" }}
          aria-hidden="true"
        />
      )}
      <span className="mt-0.5 shrink-0">
        {toast.status === "pending" && <Spinner className="h-4 w-4 text-warn" />}
        {toast.status === "success" && (
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-ok" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m5 8 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {toast.status === "error" && (
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-danger" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-13 text-ink font-medium">{toast.title}</div>
        {toast.message && <div className="text-2xs text-ink-faint mt-0.5 leading-snug">{toast.message}</div>}
        {toast.txHash && toast.chainId && (
          <a
            href={explorerTxUrl(toast.chainId, toast.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 text-2xs font-mono text-ink-faint hover:text-ink transition-colors"
          >
            {toast.txHash.slice(0, 10)}…{toast.txHash.slice(-8)} ↗
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 grid place-items-center h-5 w-5 rounded-[4px] text-ink-faint hover:text-ink hover:bg-raised transition-colors"
      >
        <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
          <path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
