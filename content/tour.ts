// The autopilot tour script: what each stop says. Camera positions live in the scene
// (components/scene/tour.ts) so this file stays free of 3D code and loads with the page.
import { districts } from "./districts";
import { constellations } from "./constellations";
import { projects } from "./projects";
import { site } from "./site";

export type TourBeat =
  | { kind: "intro" | "sky" | "outro"; title: string; caption: string }
  | { kind: "district" | "project"; id: string; title: string; caption: string };

export const tourScript: TourBeat[] = [
  { kind: "intro", title: site.tour.introTitle, caption: site.tour.intro },
  // Districts in the order they stand along the avenue.
  ...districts.map((d): TourBeat => ({ kind: "district", id: d.id, title: `${d.name} / ${d.ability}`, caption: d.summary })),
  { kind: "sky", title: site.tour.skyTitle, caption: site.tour.sky },
  ...constellations.map((c): TourBeat => {
    const p = projects.find((x) => x.id === c.projectId);
    return { kind: "project", id: c.projectId, title: `${c.skyName} / ${p?.title ?? ""}`, caption: p?.summary ?? "" };
  }),
  { kind: "outro", title: site.tour.outroTitle, caption: site.tour.outro },
];
