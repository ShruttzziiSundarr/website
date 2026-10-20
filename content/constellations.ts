// One constellation per project (ids match content/projects.ts).
// Star coordinates are on a flat chart from -1 to 1 (x right, y up); lines join star indexes.
// azimuth: degrees left (negative) or right (positive) of straight ahead. elevation: degrees above the horizon.

export type ConstellationShape = {
  projectId: string;
  /** The name it carries in the sky. */
  skyName: string;
  azimuth: number;
  elevation: number;
  stars: [number, number][];
  lines: [number, number][];
};

export const constellations: ConstellationShape[] = [
  {
    // A house: owners, tenants, a roof over all of it.
    projectId: "society",
    skyName: "The Residence",
    azimuth: -29,
    elevation: 26,
    stars: [
      [-0.8, -0.8], [0.8, -0.8], [0.8, 0.15], [0, 0.85], [-0.8, 0.15], [-0.2, -0.8], [-0.2, -0.25], [0.2, -0.25], [0.2, -0.8],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 2], [5, 6], [6, 7], [7, 8]],
  },
  {
    // A key: the bow, the shaft, the teeth.
    projectId: "oauth",
    skyName: "The Key",
    azimuth: -10,
    elevation: 40,
    stars: [
      [-0.75, 0.2], [-0.45, 0.55], [-0.15, 0.2], [-0.45, -0.15], [0.85, 0.2], [0.85, -0.2], [0.55, 0.2], [0.55, -0.12],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [6, 7]],
  },
  {
    // A rising chart: data that someone finally gets to see.
    projectId: "hr",
    skyName: "The Ledger",
    azimuth: 11,
    elevation: 28,
    stars: [
      [-0.85, -0.7], [-0.45, -0.25], [-0.05, -0.45], [0.35, 0.15], [0.8, 0.65], [-0.85, 0.75], [0.85, -0.75],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 0], [0, 6]],
  },
  {
    // A flower on a stem, for the drawing work.
    projectId: "art",
    skyName: "The Bloom",
    azimuth: 29,
    elevation: 42,
    stars: [
      [0, 0.35], [0, 0.85], [0.48, 0.5], [0.3, -0.05], [-0.3, -0.05], [-0.48, 0.5], [0, -0.85], [0.35, -0.5],
    ],
    lines: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [4, 5], [5, 1], [0, 6], [6, 7]],
  },
];
