"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { setAmbient } from "@/lib/ambient";

const VIEW_LABEL = {
  gate: "gate",
  flying: "descending",
  city: "street",
  returning: "ascending",
  skyward: "rising",
  sky: "sky",
  groundward: "landing",
  focusing: "approaching",
  district: "district",
  unfocusing: "street",
  tour: "tour",
} as const;

export function Hud() {
  const ready = useStore((s) => s.sceneReady);
  const phase = useStore((s) => s.phase);
  const [sound, setSound] = useState(false);

  const toggle = () => {
    const next = !sound;
    setSound(next);
    void setAmbient(next);
  };

  return (
    <div className="glass fixed bottom-4 left-4 z-40 flex items-center gap-3 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
      <span className="flex items-center gap-2" role="status">
        <span
          className={`pulse-dot h-2 w-2 rounded-full ${
            ready ? "bg-cyan shadow-[0_0_8px_#6EE7F9]" : "bg-amber shadow-[0_0_8px_#FBBF24]"
          }`}
        />
        <span className={ready ? "text-ink" : undefined}>{ready ? "city online" : "streaming city"}</span>
      </span>
      <span className="hidden text-muted/60 sm:inline" aria-hidden="true">
        / view {VIEW_LABEL[phase]}
      </span>
      <span className="h-3 w-px bg-cyan/20" aria-hidden="true" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={sound}
        aria-label={sound ? "Turn ambient sound off" : "Turn ambient sound on"}
        className="flex items-center gap-2 rounded-full px-1 transition-colors hover:text-ink"
      >
        <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
          {[0.5, 1, 0.7, 0.9].map((h, i) => (
            <span
              key={i}
              className="w-[2px] rounded-sm bg-current transition-[height] duration-500"
              style={{ height: sound ? `${h * 100}%` : "20%" }}
            />
          ))}
        </span>
        sound {sound ? "on" : "off"}
      </button>
    </div>
  );
}
