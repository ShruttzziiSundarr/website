"use client";

import { useSyncExternalStore } from "react";

// Tiny shared store so the DOM overlay and the R3F scene can talk without an extra library.

/**
 * Camera phases. Resting views: gate, city, sky, district, tour (the tour drives itself).
 * The "ing" phases are flights between them:
 * gate -> flying -> city, city -> returning -> gate,
 * gate | city -> skyward -> sky, sky -> groundward -> (gate | city),
 * anywhere -> focusing -> district, district | tour -> unfocusing -> city.
 */
export type Phase =
  | "gate"
  | "flying"
  | "city"
  | "returning"
  | "skyward"
  | "sky"
  | "groundward"
  | "focusing"
  | "district"
  | "unfocusing"
  | "tour";
export type Mode = "night" | "day";

type State = {
  phase: Phase;
  /** Where to land when leaving the sky view. */
  skyFrom: "gate" | "city";
  mode: Mode;
  sceneReady: boolean;
  canvasHover: boolean;
  hoverProject: string | null;
  activeProject: string | null;
  hoverDistrict: string | null;
  activeDistrict: string | null;
  /** Index of the tour stop being shown, or null when no tour is running. */
  tourStep: number | null;
};

const initial: State = {
  phase: "gate",
  skyFrom: "gate",
  mode: "night",
  sceneReady: false,
  canvasHover: false,
  hoverProject: null,
  activeProject: null,
  hoverDistrict: null,
  activeDistrict: null,
  tourStep: null,
};

let state: State = initial;
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

// Actions shared by buttons, keys and scene clicks.

export function enterCity() {
  if (state.phase === "gate") setState({ phase: "flying" });
}

export function leaveCity() {
  if (state.phase === "city") setState({ phase: "returning" });
}

export function lookUp() {
  if (state.phase === "gate" || state.phase === "city") {
    setState({ phase: "skyward", skyFrom: state.phase });
  }
}

export function lookDown() {
  if (state.phase === "sky") setState({ phase: "groundward", activeProject: null });
}

export function openProject(id: string) {
  // Opening a project from the ground also lifts the camera so its constellation is in view.
  const p = state.phase;
  if (p === "gate" || p === "city" || p === "district") {
    setState({ activeProject: id, activeDistrict: null, phase: "skyward", skyFrom: p === "gate" ? "gate" : "city" });
  } else {
    setState({ activeProject: id });
  }
}

export function closeProject() {
  setState({ activeProject: null });
}

export function openDistrict(id: string) {
  // Already focused on a tower: the camera glides to the next one without leaving the view.
  const phase = state.phase === "district" ? "district" : "focusing";
  setState({ activeDistrict: id, activeProject: null, tourStep: null, phase });
}

export function closeDistrict() {
  if (state.phase === "district") setState({ phase: "unfocusing", activeDistrict: null });
}

export function startTour() {
  const p = state.phase;
  if (p === "gate" || p === "city" || p === "sky" || p === "district") {
    setState({ phase: "tour", tourStep: 0, activeDistrict: null, activeProject: null });
  }
}

export function stopTour() {
  if (state.phase === "tour") setState({ phase: "unfocusing", tourStep: null });
}
