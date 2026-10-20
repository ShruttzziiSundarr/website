"use client";

import { setState, useStore } from "@/lib/store";

const KEY = "city-mode";

export function saveMode(mode: "day" | "night") {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Private windows can block storage; the toggle still works for this visit.
  }
}

export function loadMode(): "day" | "night" | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "day" || v === "night" ? v : null;
  } catch {
    return null;
  }
}

/** Sun and moon share one icon: the moon's bite slides away and rays grow out as it turns to day. */
export function ModeToggle() {
  const mode = useStore((s) => s.mode);
  const day = mode === "day";

  const toggle = () => {
    const next = day ? "night" : "day";
    setState({ mode: next });
    saveMode(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={day ? "Switch the city to night" : "Switch the city to day"}
      className="glass flex h-9 items-center gap-2 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber" aria-hidden="true">
        <mask id="moon-bite">
          <rect width="24" height="24" fill="white" />
          <circle
            cx={day ? 30 : 16}
            cy={day ? -4 : 8}
            r="7"
            fill="black"
            style={{ transition: "cx 0.6s ease, cy 0.6s ease" }}
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r={day ? 5 : 8}
          fill="currentColor"
          mask="url(#moon-bite)"
          style={{ transition: "r 0.6s ease" }}
        />
        <g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformOrigin: "12px 12px",
            transform: day ? "scale(1) rotate(0deg)" : "scale(0.4) rotate(-90deg)",
            opacity: day ? 1 : 0,
            transition: "transform 0.6s ease, opacity 0.4s ease",
          }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
      <span className="hidden sm:inline">{day ? "day" : "night"}</span>
    </button>
  );
}
