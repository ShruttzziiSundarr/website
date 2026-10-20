"use client";

import { districts, type Accent } from "@/content/districts";
import { labelElements } from "@/lib/labels";
import { openDistrict, setState, useStore } from "@/lib/store";

export const ACCENT_VAR: Record<Accent, string> = {
  cyan: "var(--cyan)",
  violet: "var(--violet)",
  amber: "var(--amber)",
  pink: "var(--pink)",
};

/**
 * A floating name over each hero tower. They are real buttons, so every tower can be reached
 * with Tab and opened with Enter. The scene moves each one above its tower (see HeroTowers).
 */
export function DistrictLabels() {
  const phase = useStore((s) => s.phase);
  const hover = useStore((s) => s.hoverDistrict);
  const active = useStore((s) => s.activeDistrict);
  // Only at street level: in a district the panel has prev and next, and the tour has captions.
  const visible = phase === "city";
  const clickable = visible;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-20 overflow-hidden transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
      aria-hidden={!visible}
    >
      <ul aria-label="Districts">
        {districts.map((d) => {
          const open = hover === d.id || active === d.id;
          return (
            <li
              key={d.id}
              ref={(el) => {
                if (el) labelElements.set(`district:${d.id}`, el);
                else labelElements.delete(`district:${d.id}`);
              }}
              className="absolute left-0 top-0 will-change-transform"
              style={{ transform: "translate(-200vw, 0)" }}
            >
              <button
                type="button"
                tabIndex={clickable ? 0 : -1}
                aria-label={`${d.name}, ${d.ability}. Visit district`}
                aria-current={active === d.id ? "true" : undefined}
                onClick={() => openDistrict(d.id)}
                onFocus={() => setState({ hoverDistrict: d.id })}
                onBlur={() => setState({ hoverDistrict: null })}
                onPointerEnter={() => setState({ hoverDistrict: d.id })}
                onPointerLeave={() => setState({ hoverDistrict: null })}
                className={`constellation-label -translate-x-1/2 -translate-y-full rounded-full px-3 py-1 text-left font-mono text-[11px] uppercase tracking-[0.18em] transition-[padding] duration-300 ${clickable ? "pointer-events-auto" : ""}`}
                style={{ ["--accent" as string]: ACCENT_VAR[d.accent] }}
              >
                <span className="flex items-center gap-2 whitespace-nowrap text-ink">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: ACCENT_VAR[d.accent] }} aria-hidden="true" />
                  {d.name}
                </span>
                {/* The ability slides open on hover or focus. */}
                <span
                  className="grid transition-[grid-template-rows,opacity] duration-300"
                  style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
                >
                  <span className="overflow-hidden whitespace-nowrap pl-3.5 text-[10px] normal-case tracking-normal text-muted">
                    {d.ability}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
