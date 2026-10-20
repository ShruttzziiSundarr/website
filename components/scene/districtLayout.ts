import * as THREE from "three";
import { PITCH } from "./config";

// Where each hero tower stands and what it looks like. Copy lives in content/districts.ts.

export type Tier = {
  w: number;
  h: number;
  d: number;
  /** Offsets from the tower center; y defaults to the top of the previous tier. */
  x?: number;
  z?: number;
  y?: number;
  /** Rotation around the vertical axis, in degrees. */
  rot?: number;
};

export type DistrictShape = {
  /** Block coordinates; the tower takes the whole block, which becomes a small plaza. */
  block: [number, number];
  tiers: Tier[];
  extra?: "dome" | "antenna" | "crown";
};

// Laid out along the landing avenue (x = 10.5), alternating sides, nearest first.
export const DISTRICT_SHAPES: Record<string, DistrictShape> = {
  logic: {
    block: [0, 2],
    // A ziggurat: each step a little smaller, like a problem broken down.
    tiers: [{ w: 11, h: 34, d: 11 }, { w: 8.5, h: 26, d: 8.5 }, { w: 6, h: 18, d: 6 }, { w: 3.5, h: 8, d: 3.5 }],
  },
  atelier: {
    block: [1, 1],
    // A stack that twists as it rises.
    tiers: Array.from({ length: 6 }, (_, i) => ({ w: 8.5 - i * 0.5, h: 13, d: 8.5 - i * 0.5, rot: i * 12 })),
  },
  cipher: {
    block: [0, -1],
    tiers: [{ w: 9, h: 70, d: 7 }],
    extra: "crown",
  },
  neural: {
    block: [1, -2],
    tiers: [{ w: 10, h: 30, d: 10 }, { w: 7, h: 32, d: 7 }],
    extra: "dome",
  },
  harbor: {
    block: [-1, -3],
    // Twin towers on a wide base, joined by a sky bridge.
    tiers: [
      { w: 13, h: 12, d: 11 },
      { w: 4.5, h: 52, d: 5, x: -3.5, y: 12 },
      { w: 4.5, h: 60, d: 5, x: 3.5, y: 12 },
      { w: 6, h: 2.5, d: 3, x: 0, y: 44 },
    ],
  },
  signal: {
    block: [2, -4],
    tiers: [{ w: 7, h: 58, d: 7 }, { w: 5, h: 20, d: 5 }],
    extra: "antenna",
  },
};

export const EXTRA_HEIGHT = { dome: 6, antenna: 28, crown: 6 } as const;

export type PlacedTier = Required<Tier>;

export type PlacedDistrict = {
  id: string;
  center: THREE.Vector3;
  tiers: PlacedTier[];
  /** Top of the solid building, where trims and extras sit. */
  roof: number;
  /** Top including extras, where the beacon sits. */
  top: number;
  extra?: DistrictShape["extra"];
};

function placeDistrict(id: string, shape: DistrictShape): PlacedDistrict {
  const center = new THREE.Vector3(shape.block[0] * PITCH, 0, shape.block[1] * PITCH);
  let stack = 0;
  const tiers = shape.tiers.map((t) => {
    const y = t.y ?? stack;
    stack = Math.max(stack, y + t.h);
    return { w: t.w, h: t.h, d: t.d, x: t.x ?? 0, z: t.z ?? 0, y, rot: t.rot ?? 0 };
  });
  const roof = Math.max(...tiers.map((t) => t.y + t.h));
  const top = roof + (shape.extra ? EXTRA_HEIGHT[shape.extra] : 0);
  return { id, center, tiers, roof, top, extra: shape.extra };
}

export const placedDistricts = Object.entries(DISTRICT_SHAPES).map(([id, s]) => placeDistrict(id, s));

export function districtById(id: string | null) {
  return placedDistricts.find((d) => d.id === id) ?? null;
}

/** Blocks the generated city leaves empty for hero towers. */
export const HERO_BLOCKS = Object.values(DISTRICT_SHAPES).map((s) => s.block);

const AVENUE_X = 10.5;

/**
 * Camera pose for looking at a tower: from the avenue side, a little above mid height,
 * with the tower nudged left of center so the panel on the right does not cover it.
 * On phones the panel is a bottom sheet, so the tower is nudged up instead.
 */
export function districtPose(d: PlacedDistrict, mobile: boolean) {
  // Stand over the avenue, just off its center line, looking at the tower on the diagonal.
  // With the current layout these sightlines clear the other hero towers; recheck if you move one.
  const side = Math.sign(d.center.x - AVENUE_X) || 1;
  const pos = new THREE.Vector3(AVENUE_X - side * 4, d.roof * 0.45 + 8, d.center.z + 40);
  const look = new THREE.Vector3(d.center.x, d.roof * 0.5, d.center.z);
  const forward = look.clone().sub(pos).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  if (mobile) look.y -= d.roof * 0.22;
  else look.addScaledVector(right, 11);
  return { pos, look };
}
