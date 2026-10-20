"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { districts } from "@/content/districts";
import { projects } from "@/content/projects";
import { districtIllustrations } from "@/components/illustrations";
import { ACCENT_VAR } from "@/components/ui/DistrictLabels";
import { closeDistrict, openDistrict, openProject, useStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/hooks";

const order = districts.map((d) => d.id);

/** Glass panel for the tower in focus. Arrow keys move to the next tower along the avenue. */
export function DistrictPanel() {
  const activeId = useStore((s) => s.activeDistrict);
  const phase = useStore((s) => s.phase);
  const reduced = useReducedMotion();
  const closeBtn = useRef<HTMLButtonElement>(null);

  const index = activeId ? order.indexOf(activeId) : -1;
  const district = districts[index];
  const show = !!district && (phase === "district" || phase === "focusing");
  const Illustration = district ? districtIllustrations[district.id] : null;

  const step = (dir: number) => openDistrict(order[(index + dir + order.length) % order.length]);

  useEffect(() => {
    if (!show || !activeId) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      const i = order.indexOf(activeId);
      if (e.key === "ArrowRight") openDistrict(order[(i + 1) % order.length]);
      if (e.key === "ArrowLeft") openDistrict(order[(i - 1 + order.length) % order.length]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, activeId]);

  return (
    <AnimatePresence>
      {show && district && (
        <motion.aside
          key="district"
          role="dialog"
          aria-modal="false"
          aria-labelledby="district-title"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: 48 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass fixed inset-x-3 bottom-20 z-40 max-h-[62dvh] overflow-y-auto rounded-2xl p-5 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-20 sm:max-h-[calc(100dvh-7rem)] sm:w-[26rem] sm:p-6"
          style={{ ["--accent" as string]: ACCENT_VAR[district.accent] }}
        >
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
              district / {district.ability}
            </p>
            <button
              ref={closeBtn}
              type="button"
              onClick={closeDistrict}
              aria-label="Close district and return to the street"
              className="-mr-1 -mt-1 rounded-full px-2 font-mono text-lg leading-none text-muted hover:text-ink"
            >
              ×
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={district.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
            >
              <div className="mt-4 aspect-[8/5] overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-night/40 p-2">
                {Illustration && <Illustration />}
              </div>

              <h2 id="district-title" className="mt-5 font-mono text-xl font-bold text-ink">
                {district.name}
              </h2>
              <p className="mt-3 leading-relaxed text-ink/90">{district.body}</p>

              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Topics">
                {district.tags.map((t) => (
                  <li key={t} className="rounded-full border border-cyan/20 px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    {t}
                  </li>
                ))}
              </ul>

              {district.projectIds.length > 0 && (
                <div className="mt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Related projects</p>
                  <ul className="mt-2 space-y-1.5">
                    {district.projectIds.map((id) => {
                      const p = projects.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => openProject(id)}
                            className="group flex w-full items-center justify-between gap-3 rounded-lg border border-cyan/10 px-3 py-2 text-left text-sm text-ink transition-colors hover:border-[var(--accent)]"
                          >
                            <span>
                              {p.title} <span className="text-muted">/ {p.kind}</span>
                            </span>
                            <span aria-hidden="true" className="font-mono text-xs text-muted transition-transform group-hover:-translate-y-0.5">
                              ↑ sky
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between border-t border-cyan/10 pt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            <button type="button" onClick={() => step(-1)} className="hover:text-ink">
              ← prev
            </button>
            <span aria-hidden="true">
              {index + 1} / {order.length}
            </span>
            <button type="button" onClick={() => step(1)} className="hover:text-ink">
              next →
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
