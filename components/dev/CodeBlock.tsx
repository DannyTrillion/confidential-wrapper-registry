"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Flat, copy-able code block: a solid code surface, a 1px header carrying the
 * language label + a Copy button, and a tiny regex tokenizer for readable
 * syntax color — comments dimmed, strings gold, keywords cool blue, numbers
 * violet. No syntax-highlighter dependency.
 */
export function CodeBlock({ code, lang, className }: { code: string; lang: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const clean = code.replace(/^\n/, "").replace(/\n$/, "");

  function copy() {
    navigator.clipboard?.writeText(clean).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={cn("rounded-input border border-line bg-base overflow-hidden", className)}>
      <div className="flex items-center justify-between h-9 px-3 border-b border-line bg-elevate/[0.02]">
        <span className="font-mono text-2xs uppercase tracking-wide text-ink-faint">{lang}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink-faint hover:text-ink transition-colors"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
                <path d="m3 7.5 2.5 2.5L11 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" aria-hidden="true">
                <rect x="4.5" y="4.5" width="7" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9.5 4.5v-.9a1.1 1.1 0 0 0-1.1-1.1H3.6a1.1 1.1 0 0 0-1.1 1.1v4.8a1.1 1.1 0 0 0 1.1 1.1h.9" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 text-13 leading-relaxed">
        <code className="font-mono">
          {clean.split("\n").map((line, i) => (
            <div key={i} className="text-ink-muted">
              {line ? highlightLine(line) : " "}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------ highlighting */

// One combined pass: comments win, then strings, then numbers/keywords.
const TOKEN =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")|(\b\d[\d_]*n?\b)|\b(import|from|export|const|let|var|await|async|function|return|if|else|as|type|new|typeof|npm|install|run)\b/g;

function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [, comment, str, num, kw] = m;
    if (comment != null) {
      out.push(
        <span key={out.length} className="text-ink-ghost italic">
          {comment}
        </span>,
      );
    } else if (str != null) {
      out.push(
        <span key={out.length} className="text-accentInk/90">
          {str}
        </span>,
      );
    } else if (num != null) {
      out.push(
        <span key={out.length} className="text-[#B9A3E3]">
          {num}
        </span>,
      );
    } else if (kw != null) {
      out.push(
        <span key={out.length} className="text-[#82AEDC]">
          {kw}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
