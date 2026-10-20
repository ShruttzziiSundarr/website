"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BLOCK_RADIUS, COLORS, LOT, PITCH } from "./config";
import { mulberry32, type Park } from "./City";
import { daylight } from "@/lib/daylight";

type Tree = { x: number; z: number; s: number; tint: number };
type Flower = { x: number; z: number; s: number; color: THREE.Color };

const AVENUE_X = 10.5;
// Where the camera lands; nothing grows close enough to fill the foreground.
const LANDING = { x: 10.5, z: 74, clear: 26 };
const nearLanding = (x: number, z: number) => Math.hypot(x - LANDING.x, z - LANDING.z) < LANDING.clear;
const FLOWER_COLORS = [COLORS.pink, COLORS.violet, COLORS.cyan, COLORS.amber, "#FFFFFF"].map((c) => new THREE.Color(c));
const CROWN_DAY = ["#5E9C4F", "#76AE5A", "#4E8A55", "#8DBB63"].map((c) => new THREE.Color(c));

function plant(parks: Park[], radius: number) {
  const rand = mulberry32(1618);
  const trees: Tree[] = [];
  const flowers: Flower[] = [];
  const edge = LOT * 1.5 + 0.9; // just past the block edge, on the sidewalk

  // Street trees on all four sides of blocks near downtown.
  for (let bx = -BLOCK_RADIUS; bx <= BLOCK_RADIUS; bx++) {
    for (let bz = -BLOCK_RADIUS; bz <= BLOCK_RADIUS; bz++) {
      const cx = bx * PITCH;
      const cz = bz * PITCH;
      if (Math.hypot(cx, cz) > radius) continue;
      for (const along of [-5, 0, 5]) {
        for (const [dx, dz] of [[edge, along], [-edge, along], [along, edge], [along, -edge]]) {
          if (rand() > 0.5) continue;
          // The landing avenue stays open; trees there would sit right in front of the camera.
          if (Math.abs(cx + dx - AVENUE_X) < 3.5 || nearLanding(cx + dx, cz + dz)) continue;
          trees.push({ x: cx + dx, z: cz + dz, s: 0.75 + rand() * 0.5, tint: rand() });
        }
      }
    }
  }

  // Parks: a few trees and a scatter of flower beds on each empty lot.
  for (const p of parks) {
    if (Math.hypot(p.x, p.z) > radius * 1.4) continue;
    const n = 2 + ((rand() * 3) | 0);
    for (let i = 0; i < n; i++) {
      if (nearLanding(p.x, p.z)) break;
      trees.push({ x: p.x + (rand() - 0.5) * 3.6, z: p.z + (rand() - 0.5) * 3.6, s: 0.9 + rand() * 0.7, tint: rand() });
    }
    const beds = 2 + ((rand() * 2) | 0);
    for (let b = 0; b < beds; b++) {
      const bx = p.x + (rand() - 0.5) * 3.4;
      const bz = p.z + (rand() - 0.5) * 3.4;
      const color = FLOWER_COLORS[(rand() * FLOWER_COLORS.length) | 0];
      for (let f = 0; f < 9; f++) {
        flowers.push({ x: bx + (rand() - 0.5) * 1.8, z: bz + (rand() - 0.5) * 1.8, s: 0.6 + rand() * 0.6, color });
      }
    }
  }
  return { trees, flowers, lawns: parks.filter((p) => Math.hypot(p.x, p.z) <= radius * 1.4) };
}

export function Greenery({ parks, radius }: { parks: Park[]; radius: number }) {
  const { trees, flowers, lawns } = useMemo(() => plant(parks, radius), [parks, radius]);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const blooms = useRef<THREE.InstancedMesh>(null);
  const grass = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.1, 0.16, 1.5, 5);
    trunk.translate(0, 0.75, 0);
    // Two stacked low poly blobs read as a tree from street level and from above.
    const crownA = new THREE.IcosahedronGeometry(1, 0);
    crownA.translate(0, 2.2, 0);
    const crownB = new THREE.IcosahedronGeometry(0.7, 0);
    crownB.translate(0.25, 3.0, 0.1);
    const crown = mergeGeometries([crownA, crownB]);
    const bloom = new THREE.IcosahedronGeometry(0.13, 0);
    bloom.translate(0, 0.28, 0);
    const lawn = new THREE.BoxGeometry(LOT * 0.92, 0.06, LOT * 0.92);
    lawn.translate(0, 0.03, 0);
    return { trunk, crown, bloom, lawn };
  }, []);

  const mats = useMemo(
    () => ({
      trunk: new THREE.MeshLambertMaterial({ color: "#5A4636", flatShading: true }),
      crown: new THREE.MeshLambertMaterial({ color: "#FFFFFF", flatShading: true, emissive: new THREE.Color("#0B3B3A") }),
      bloom: new THREE.MeshBasicMaterial({ color: "#FFFFFF", toneMapped: false }),
      lawn: new THREE.MeshLambertMaterial({ color: "#FFFFFF", emissive: new THREE.Color("#06201E") }),
    }),
    [],
  );

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    trees.forEach((t, i) => {
      o.position.set(t.x, 0, t.z);
      o.rotation.set(0, t.tint * Math.PI * 2, 0);
      o.scale.setScalar(t.s);
      o.updateMatrix();
      trunks.current?.setMatrixAt(i, o.matrix);
      crowns.current?.setMatrixAt(i, o.matrix);
      // Instance colors hold the day green; the night look comes from material tint below.
      c.copy(CROWN_DAY[(t.tint * CROWN_DAY.length) | 0]);
      crowns.current?.setColorAt(i, c);
    });
    flowers.forEach((f, i) => {
      o.position.set(f.x, 0, f.z);
      o.rotation.set(0, f.s * 9, 0);
      o.scale.setScalar(f.s);
      o.updateMatrix();
      blooms.current?.setMatrixAt(i, o.matrix);
      blooms.current?.setColorAt(i, f.color);
    });
    lawns.forEach((p, i) => {
      o.position.set(p.x, 0, p.z);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      o.updateMatrix();
      grass.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [trunks, crowns, blooms, grass]) {
      if (!m.current) continue;
      m.current.instanceMatrix.needsUpdate = true;
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true;
    }
  }, [trees, flowers, lawns]);

  const dayLawn = useMemo(() => new THREE.Color("#7DB062"), []);
  const nightLawn = useMemo(() => new THREE.Color("#0F2B2C"), []);
  const nightCrownTint = useMemo(() => new THREE.Color("#3B6E73"), []);
  const white = useMemo(() => new THREE.Color("#FFFFFF"), []);

  useFrame(() =>
    applyDaylight(
      daylight.value,
      crowns.current?.material as THREE.MeshLambertMaterial | undefined,
      grass.current?.material as THREE.MeshLambertMaterial | undefined,
      blooms.current?.material as THREE.MeshBasicMaterial | undefined,
      { nightCrownTint, white, nightLawn, dayLawn },
    ),
  );

  return (
    <group>
      <instancedMesh ref={trunks} args={[geo.trunk, mats.trunk, trees.length]} frustumCulled={false} />
      <instancedMesh ref={crowns} args={[geo.crown, mats.crown, trees.length]} frustumCulled={false} />
      <instancedMesh ref={blooms} args={[geo.bloom, mats.bloom, flowers.length]} frustumCulled={false} />
      <instancedMesh ref={grass} args={[geo.lawn, mats.lawn, lawns.length]} frustumCulled={false} />
    </group>
  );
}

type Tints = { nightCrownTint: THREE.Color; white: THREE.Color; nightLawn: THREE.Color; dayLawn: THREE.Color };

function applyDaylight(
  d: number,
  crown: THREE.MeshLambertMaterial | undefined,
  lawn: THREE.MeshLambertMaterial | undefined,
  bloom: THREE.MeshBasicMaterial | undefined,
  t: Tints,
) {
  // Crowns: full green by day, a cool blue green tint at night with a faint glow.
  if (crown) {
    crown.color.lerpColors(t.nightCrownTint, t.white, d);
    crown.emissiveIntensity = 1 - d;
  }
  if (lawn) {
    lawn.color.lerpColors(t.nightLawn, t.dayLawn, d);
    lawn.emissiveIntensity = 1 - d;
  }
  // Flowers glow at night (bright enough to bloom) and settle to plain petals by day.
  bloom?.color.setScalar(THREE.MathUtils.lerp(2.2, 0.95, d));
}

/** Minimal merge for non indexed geometries with matching attributes. */
function mergeGeometries(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const names = Object.keys(flat[0].attributes);
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const size = flat[0].attributes[name].itemSize;
    const total = flat.reduce((n, g) => n + g.attributes[name].array.length, 0);
    const arr = new Float32Array(total);
    let off = 0;
    for (const g of flat) {
      arr.set(g.attributes[name].array as Float32Array, off);
      off += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
}
