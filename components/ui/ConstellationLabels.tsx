"use client";

import { constellations } from "@/content/constellations";
import { projects } from "@/content/projects";
import { labelElements } from "@/lib/labels";
import { openProject, setState, useStore } from "@/lib/store";

const ACCENT: Record<string, string> = {
  society: "var(--amber)",
  oauth: "var(--cyan)",
  hr: "var(--violet)",
  art: "var(--pink)",
};

/**
 * One real button per constellation, so the sky works with a keyboard and a screen reader.
 * The scene moves each button over its constellation (see ProjectConstellations).
 */
export function ConstellationLabels() {
  const inSky = useStore((s) => s.phase === "sky");

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-20 overflow-hidden transition-opacity duration-700 ${inSky ? "opacity-100" : "opacity-0"}`}
      aria-hidden={!inSky}
    >
      <ul aria-label="Projects in the sky">
        {constellations.map((c) => {
          const project = projects.find((p) => p.id === c.projectId);
          return (
            <li
              key={c.projectId}
              ref={(el) => {
                if (el) labelElements.set(c.projectId, el);
                else labelElements.delete(c.projectId);
              }}
              className="absolute left-0 top-0 will-change-transform"
              style={{ transform: "translate(-200vw, 0)" }}
            >
              <button
                type="button"
                tabIndex={inSky ? 0 : -1}
                aria-label={`${c.skyName}: ${project?.title}. Open project`}
                onClick={() => openProject(c.projectId)}
                onFocus={() => setState({ hoverProject: c.projectId })}
                onBlur={() => setState({ hoverProject: null })}
                onPointerEnter={() => setState({ hoverProject: c.projectId })}
                onPointerLeave={() => setState({ hoverProject: null })}
                className={`constellation-label -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-center font-mono text-[11px] uppercase tracking-[0.2em] ${inSky ? "pointer-events-auto" : ""}`}
                style={{ ["--accent" as string]: ACCENT[c.projectId] }}
              >
                <span className="block text-ink">{c.skyName}</span>
                <span className="block text-[10px] normal-case tracking-normal text-muted">{project?.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
