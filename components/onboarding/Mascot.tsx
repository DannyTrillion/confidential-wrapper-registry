"use client";

import { cn } from "@/lib/cn";

export type MascotMood = "idle" | "wave" | "point" | "think" | "celebrate";

/**
 * "Cipher" — the app mascot. A friendly padlock character whose face nods to the
 * product (a lock = your balance, kept confidential). Mood swaps the eyes/extras so
 * the same body can wave hello, point at a section, ponder, or celebrate.
 */
export function Mascot({
  mood = "idle",
  size = 72,
  float = true,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  float?: boolean;
  className?: string;
}) {
  const happy = mood === "celebrate";
  const thinking = mood === "think";

  return (
    <div
      className={cn("relative shrink-0", float && "animate-mascot-float", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 80" className="h-full w-full overflow-visible">
        {/* soft glow */}
        <ellipse cx="40" cy="68" rx="22" ry="5" fill="rgba(255,210,8,0.18)" />

        {/* shackle (the lock's arc) */}
        <path
          d="M27 33V25a13 13 0 0 1 26 0v8"
          fill="none"
          stroke="#FFD208"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M27 33V25a13 13 0 0 1 26 0v8"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="2"
          strokeLinecap="round"
          transform="translate(0,1.5)"
        />

        {/* body */}
        <rect x="18" y="31" width="44" height="38" rx="11" fill="#FFD208" />
        <rect x="18" y="31" width="44" height="38" rx="11" fill="url(#cipherShade)" />
        <rect
          x="18"
          y="31"
          width="44"
          height="38"
          rx="11"
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="1.5"
        />

        {/* feet */}
        <rect x="26" y="67" width="9" height="6" rx="3" fill="#E6BE00" />
        <rect x="45" y="67" width="9" height="6" rx="3" fill="#E6BE00" />

        {/* face */}
        {happy ? (
          <>
            {/* happy closed-arc eyes */}
            <path d="M28 47c1.6-2.4 4.4-2.4 6 0" stroke="#1A1505" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M46 47c1.6-2.4 4.4-2.4 6 0" stroke="#1A1505" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        ) : thinking ? (
          <>
            <circle cx="31" cy="47" r="3" fill="#1A1505" />
            {/* squinting eye */}
            <path d="M46 47h6" stroke="#1A1505" strokeWidth="2.6" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="31" cy="47" r="3.4" fill="#1A1505" />
            <circle cx="49" cy="47" r="3.4" fill="#1A1505" />
            {/* eye glints */}
            <circle cx="32.2" cy="45.8" r="1" fill="#fff" opacity="0.85" />
            <circle cx="50.2" cy="45.8" r="1" fill="#fff" opacity="0.85" />
          </>
        )}

        {/* keyhole "nose/mouth" — the encryption motif */}
        <circle cx="40" cy="55" r="2.6" fill="#1A1505" />
        <path d="M38.4 56.5h3.2l-.8 4.2h-1.6l-.8-4.2Z" fill="#1A1505" />

        {/* mood extras */}
        {mood === "wave" && (
          <g className="animate-mascot-wave">
            <circle cx="64" cy="42" r="4.5" fill="#FFD208" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" />
          </g>
        )}
        {mood === "point" && (
          <g>
            <circle cx="66" cy="50" r="4" fill="#FFD208" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" />
            <path d="M68.5 50h5" stroke="#FFD208" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {happy && (
          <>
            <g className="animate-sparkle" style={{ transformOrigin: "12px 26px" }}>
              <Sparkle x={12} y={26} />
            </g>
            <g className="animate-sparkle" style={{ animationDelay: "0.4s", transformOrigin: "68px 22px" }}>
              <Sparkle x={68} y={22} />
            </g>
            <g className="animate-sparkle" style={{ animationDelay: "0.8s", transformOrigin: "70px 56px" }}>
              <Sparkle x={70} y={56} />
            </g>
          </>
        )}

        <defs>
          <linearGradient id="cipherShade" x1="0" y1="31" x2="0" y2="69" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Sparkle({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y - 4.5}c.4 2.6 1.5 3.7 4.1 4.1-2.6.4-3.7 1.5-4.1 4.1-.4-2.6-1.5-3.7-4.1-4.1 2.6-.4 3.7-1.5 4.1-4.1Z`}
      fill="#FFE372"
    />
  );
}
