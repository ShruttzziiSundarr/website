"use client";

import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { tourScript } from "@/content/tour";
import { stopTour, useStore } from "@/lib/store";

/** Caption bar for the autopilot tour. Captions are announced to screen readers as they change. */
export function TourOverlay() {
  const step = useStore((s) => s.tourStep);
  const running = useStore((s) => s.phase === "tour");
  const stop = step !== null ? tourScript[step] : null;

  return (
    <AnimatePresence>
      {running && stop && (
        <motion.div
          key="tour"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4 }}
          className="glass fixed bottom-20 left-1/2 z-30 w-[min(92vw,34rem)] -translate-x-1/2 overflow-hidden rounded-xl"
        >
          <div className="h-0.5 bg-cyan/10">
            <div
              className="h-full bg-cyan transition-[width] duration-700"
              style={{ width: `${((step! + 1) / tourScript.length) * 100}%` }}
            />
          </div>
          <div className="flex items-start gap-4 px-5 py-4">
            <div className="min-w-0 flex-1" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">{stop.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{stop.caption}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={stopTour}
              className="shrink-0 rounded-full border border-cyan/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted hover:text-ink"
            >
              {site.tour.stop} <span className="text-muted/70">(esc)</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
