"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/content/site";
import { Gate } from "@/components/sections/Gate";
import { Cursor } from "@/components/ui/Cursor";
import { Hud } from "@/components/ui/Hud";
import { ModeToggle, loadMode } from "@/components/ui/ModeToggle";
import { ProjectPanel } from "@/components/ui/ProjectPanel";
import { ConstellationLabels } from "@/components/ui/ConstellationLabels";
import { DistrictLabels } from "@/components/ui/DistrictLabels";
import { DistrictPanel } from "@/components/ui/DistrictPanel";
import { TourOverlay } from "@/components/ui/TourOverlay";
import {
  closeDistrict,
  closeProject,
  enterCity as enter,
  getState,
  leaveCity,
  lookDown,
  lookUp,
  setState,
  startTour,
  stopTour,
  useStore,
} from "@/lib/store";
import { useIsMobile, useReducedMotion } from "@/lib/hooks";

// The 3D scene streams in after the gate is already on screen.
const Scene = dynamic(() => import("@/components/scene/Scene"), { ssr: false });

// After the first descent, returning to the gate skips the typing and decrypt intro.
let introPlayed = false;

function enterCity() {
  if (getState().phase === "gate") enter();
}

export function Experience() {
  const phase = useStore((s) => s.phase);
  const mode = useStore((s) => s.mode);
  const sceneReady = useStore((s) => s.sceneReady);
  const mobile = useIsMobile();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (phase !== "gate") introPlayed = true;
  }, [phase]);

  // Remember the visitor's day or night choice, and expose it to CSS.
  useEffect(() => {
    const saved = loadMode();
    if (saved) setState({ mode: saved });
  }, []);
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  // Scroll, swipe or arrow keys at the gate also start the descent.
  useEffect(() => {
    if (phase !== "gate") return;
    let touchY: number | null = null;
    const onWheel = (e: WheelEvent) => e.deltaY > 20 && enterCity();
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (touchY !== null && touchY - e.touches[0].clientY > 50) enterCity();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown"].includes(e.key)) enterCity();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase]);

  // Escape steps back one level: project, district, tour, sky, then street.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = getState();
      if (s.activeProject) closeProject();
      else if (s.phase === "district") closeDistrict();
      else if (s.phase === "tour") stopTour();
      else if (s.phase === "sky") lookDown();
      else if (s.phase === "city") leaveCity();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resting = phase === "gate" || phase === "city" || phase === "sky";
  const canTour = resting || phase === "district";

  return (
    <>
      <a
        href="/plain"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-md bg-cyan px-4 py-2 font-mono text-sm text-night focus:translate-y-0"
      >
        Skip the 3D
      </a>

      <div
        className={`fixed inset-0 transition-opacity duration-[1600ms] ${sceneReady ? "opacity-100" : "opacity-0"}`}
      >
        <Scene mobile={mobile} reducedMotion={reduced} />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-16">
        <span className="font-mono text-xs tracking-[0.25em] text-ink/80">
          MSS<span className="text-cyan">://</span>city
        </span>
        <nav aria-label="View" className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={!canTour && phase !== "tour"}
            onClick={phase === "tour" ? stopTour : startTour}
            className="glass flex h-9 items-center rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            {phase === "tour" ? "stop tour" : (
              <>
                <span className="sm:hidden">tour</span>
                <span className="hidden sm:inline">{site.tour.label}</span>
              </>
            )}
          </button>
          <button
            type="button"
            disabled={!resting}
            onClick={phase === "sky" ? lookDown : lookUp}
            className="glass flex h-9 items-center rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            {phase === "sky" ? "back down ↓" : "look up ↑"}
          </button>
          <ModeToggle />
          <a
            href="/plain"
            className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-muted underline decoration-cyan/30 underline-offset-4 transition-colors hover:text-ink sm:inline"
          >
            plain version
          </a>
        </nav>
      </header>

      <main className="relative">
        <AnimatePresence>
          {phase === "gate" && <Gate key="gate" instant={introPlayed} onEnter={enterCity} />}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "city" && (
            <motion.div
              key="city"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5 }}
              className="glass fixed bottom-20 left-1/2 z-20 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl px-5 py-4 text-center"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">street level</p>
              <p className="mt-2 text-sm text-muted">{site.streetHint}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={lookUp}
                  className="rounded-full border border-cyan/40 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-ink hover:border-cyan"
                >
                  Look up ↑
                </button>
                <button
                  type="button"
                  onClick={leaveCity}
                  className="rounded-full border border-cyan/20 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-ink"
                >
                  Back to the gate <span className="text-muted">(esc)</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "sky" && (
            <motion.p
              key="sky"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pointer-events-none fixed inset-x-0 top-20 z-20 px-4 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-muted"
            >
              {site.skyHint}
            </motion.p>
          )}
        </AnimatePresence>
      </main>

      <DistrictLabels />
      <ConstellationLabels />
      <DistrictPanel />
      <ProjectPanel />
      <TourOverlay />
      <Hud />
      <Cursor />
    </>
  );
}
