"use client";

import { useSyncExternalStore } from "react";

function useMedia(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function useReducedMotion() {
  return useMedia("(prefers-reduced-motion: reduce)");
}

/** Phones and small tablets: simpler city, no postprocessing. */
export function useIsMobile() {
  return useMedia("(max-width: 767px), (pointer: coarse)");
}

export function useFinePointer() {
  return useMedia("(hover: hover) and (pointer: fine)");
}
