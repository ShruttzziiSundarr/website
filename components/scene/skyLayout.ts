import * as THREE from "three";
import { constellations } from "@/content/constellations";
import { CAMERA, CONSTELLATION } from "./config";

export const SKY_VANTAGE = new THREE.Vector3(...CAMERA.sky.pos);

export type PlacedConstellation = {
  projectId: string;
  center: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  stars: THREE.Vector3[];
};

const deg = THREE.MathUtils.degToRad;

/** Places each chart on a sphere around the vantage, facing it, so the shapes read undistorted. */
function place(): PlacedConstellation[] {
  return constellations.map((c) => {
    const az = deg(c.azimuth);
    const el = deg(c.elevation);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    const center = SKY_VANTAGE.clone().addScaledVector(dir, CONSTELLATION.distance);
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, dir).normalize();
    const stars = c.stars.map(([x, y]) =>
      center.clone().addScaledVector(right, x * CONSTELLATION.scale).addScaledVector(up, y * CONSTELLATION.scale),
    );
    return { projectId: c.projectId, center, right, up, stars };
  });
}

export const placedConstellations = place();

/** The middle of the whole group, where the sky view looks by default. */
export const SKY_LOOK = placedConstellations
  .reduce((acc, c) => acc.add(c.center), new THREE.Vector3())
  .divideScalar(placedConstellations.length);

export function constellationCenter(projectId: string | null) {
  return placedConstellations.find((c) => c.projectId === projectId)?.center ?? null;
}
