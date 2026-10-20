"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { projects } from "@/content/projects";
import { constellations } from "@/content/constellations";
import { closeProject, openProject, useStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/hooks";

const order = constellations.map((c) => c.projectId);

/** Glass panel for the project behind a constellation. Arrow keys move between projects. */
export function ProjectPanel() {
  const activeId = useStore((s) => s.activeProject);
  const reduced = useReducedMotion();
  const closeBtn = useRef<HTMLButtonElement>(null);

  const index = activeId ? order.indexOf(activeId) : -1;
  const project = projects.find((p) => p.id === activeId);
  const shape = constellations[index];

  const step = (dir: number) => openProject(order[(index + dir + order.length) % order.length]);

  useEffect(() => {
    if (!activeId) return;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") openProject(order[(order.indexOf(activeId) + 1) % order.length]);
      if (e.key === "ArrowLeft") openProject(order[(order.indexOf(activeId) - 1 + order.length) % order.length]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  return (
    <AnimatePresence>
      {project && shape && (
        <motion.aside
          key="panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="project-title"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: 40 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass fixed inset-x-3 bottom-20 z-40 max-h-[70dvh] overflow-y-auto rounded-2xl p-5 sm:inset-x-auto sm:right-6 sm:top-20 sm:bottom-auto sm:w-[24rem] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan">
              constellation / {shape.skyName}
            </p>
            <button
              ref={closeBtn}
              type="button"
              onClick={closeProject}
              aria-label="Close project"
              className="-mr-1 -mt-1 rounded-full px-2 font-mono text-lg leading-none text-muted hover:text-ink"
            >
              ×
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={project.id}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2 id="project-title" className="mt-3 font-mono text-xl font-bold text-ink">
                {project.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{project.kind}</p>

              {/* Image slot: set `image` in content/projects.ts to fill it. */}
              <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-dashed border-cyan/25 bg-night/40">
                {project.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={project.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted/60">
                    image slot
                  </div>
                )}
              </div>

              <p className="mt-4 leading-relaxed text-ink/90">{project.summary}</p>

              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Stack">
                {project.stack.map((t) => (
                  <li key={t} className="rounded-full border border-cyan/20 px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    {t}
                  </li>
                ))}
              </ul>

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block font-mono text-xs uppercase tracking-[0.2em] text-cyan underline underline-offset-4"
                >
                  View project
                </a>
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
