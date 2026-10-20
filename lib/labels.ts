import type * as THREE from "three";

// DOM labels that float over 3D points. The DOM side registers elements here and the
// scene writes their screen position every frame, so no extra React roots are needed.
export const labelElements = new Map<string, HTMLElement>();

let projected: THREE.Vector3 | null = null;

/** Moves the label registered under `key` to where `anchor` lands on screen. */
export function placeLabel(key: string, anchor: THREE.Vector3, camera: THREE.Camera, width: number, height: number) {
  const el = labelElements.get(key);
  if (!el) return;
  projected = (projected ?? anchor.clone()).copy(anchor).project(camera);
  if (projected.z > 1) {
    el.style.transform = "translate(-200vw, 0)"; // behind the camera
    return;
  }
  const x = (projected.x * 0.5 + 0.5) * width;
  const y = (-projected.y * 0.5 + 0.5) * height;
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}
