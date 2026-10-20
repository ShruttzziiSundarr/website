import * as THREE from "three";
import { tourScript } from "@/content/tour";
import { CAMERA } from "./config";
import { districtById } from "./districtLayout";
import { SKY_LOOK, SKY_VANTAGE, constellationCenter } from "./skyLayout";

export type TourStop = {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  /** Seconds to travel here from the previous stop. */
  travel: number;
  /** Seconds to linger once here. */
  hold: number;
};

const STREET = new THREE.Vector3(...CAMERA.street.pos);

/**
 * Camera moves for each beat of the tour script, about a minute in all: drop into the avenue,
 * pass every district along it, then rise over the city to the constellations.
 */
function stopFor(beat: (typeof tourScript)[number]): TourStop {
  switch (beat.kind) {
    case "intro":
      return { pos: new THREE.Vector3(STREET.x, 46, STREET.z + 70), look: new THREE.Vector3(STREET.x, 18, 0), travel: 2.5, hold: 1.5 };
    case "district": {
      const d = districtById(beat.id)!;
      const side = Math.sign(STREET.x - d.center.x) || 1;
      return {
        pos: new THREE.Vector3(STREET.x + side * 2.5, 16 + d.roof * 0.28, d.center.z + 48),
        look: new THREE.Vector3(d.center.x, d.roof * 0.55, d.center.z),
        travel: 3,
        hold: 2.6,
      };
    }
    case "sky":
      return { pos: SKY_VANTAGE.clone(), look: SKY_LOOK.clone(), travel: 4.5, hold: 1.5 };
    case "project": {
      const center = constellationCenter(beat.id)!;
      return { pos: SKY_VANTAGE.clone().lerp(center, 0.06), look: center.clone(), travel: 2.2, hold: 2.2 };
    }
    case "outro":
      return { pos: SKY_VANTAGE.clone(), look: SKY_LOOK.clone(), travel: 2.2, hold: 0 };
  }
}

export const tourStops = tourScript.map(stopFor);
