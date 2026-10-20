// Shared numbers for the scene. Layout units are roughly meters.

export const COLORS = {
  night: "#060A14",
  horizon: "#0D1230",
  cyan: "#6EE7F9",
  violet: "#A78BFA",
  amber: "#FBBF24",
  pink: "#F472B6",
} as const;

export const DAY = {
  top: "#2F6FB8",
  horizon: "#CFE2F3",
  fog: "#BCD3EA",
  sun: "#FFE7B0",
} as const;

export const FOG = { color: COLORS.horizon, dayColor: DAY.fog, near: 60, far: 300 };

// A block is 3 x 3 lots, separated by streets.
export const LOT = 5;
export const STREET = 6;
export const BLOCK_SPAN = LOT * 3; // 15
export const PITCH = BLOCK_SPAN + STREET; // 21
export const BLOCK_RADIUS = 7; // blocks from center in each direction

/** How many background buildings to draw at each quality tier. */
export const BUILDING_BUDGET = { mobile: 450, low: 700, mid: 1150, high: 1800 } as const;

export const CAMERA = {
  fov: 45,
  orbitRadius: 175,
  orbitHeight: 52,
  orbitTarget: [0, 20, 0] as const,
  orbitSpeed: 0.035, // radians per second
  startAngle: 0.7,
  // The avenue the camera lands in after "Enter the city".
  street: { pos: [10.5, 5, 74] as const, look: [10.5, 15, -60] as const },
  // A rooftop height vantage for looking up at the project constellations.
  sky: { pos: [10.5, 58, 150] as const },
};

/** Constellations sit on a sphere around the sky vantage, all in front of it. */
export const CONSTELLATION = {
  distance: 330,
  scale: 34, // half width of a constellation in world units
};
