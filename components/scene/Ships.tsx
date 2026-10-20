"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { COLORS } from "./config";
import { mulberry32 } from "./City";
import { daylight } from "@/lib/daylight";

const ENGINE_COLORS = [COLORS.cyan, COLORS.pink, COLORS.amber, COLORS.violet];

/** Closed flight lanes that weave around downtown at different heights. */
function buildLanes() {
  const rand = mulberry32(314);
  const lanes: THREE.CatmullRomCurve3[] = [];
  for (let k = 0; k < 6; k++) {
    const radius = 45 + k * 22;
    const height = 22 + rand() * 45;
    const pts: THREE.Vector3[] = [];
    const n = 10;
    const phase = rand() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + phase;
      // Squash and wobble each loop so the lanes cross over one another.
      const r = radius * (0.75 + rand() * 0.45);
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * r * (k % 2 ? 1.25 : 0.85),
          height + Math.sin(a * 2 + k) * (6 + rand() * 8),
          Math.sin(a) * r * (k % 2 ? 0.85 : 1.25),
        ),
      );
    }
    if (k % 2) pts.reverse(); // alternate direction of travel
    lanes.push(new THREE.CatmullRomCurve3(pts, true, "centripetal"));
  }
  return lanes;
}

function useShipParts() {
  return useMemo(() => {
    const hull = new THREE.ConeGeometry(0.6, 3.2, 4);
    hull.rotateX(Math.PI / 2); // nose points down +z, which is where lookAt aims
    hull.scale(1, 0.5, 1);
    const wings = new THREE.BoxGeometry(3.4, 0.08, 0.9);
    wings.translate(0, 0, -0.5);
    const fin = new THREE.BoxGeometry(0.08, 0.6, 0.7);
    fin.translate(0, 0.32, -1.1);
    const canopy = new THREE.SphereGeometry(0.22, 8, 6);
    canopy.scale(1, 0.6, 1.6);
    canopy.translate(0, 0.16, 0.35);
    const engine = new THREE.SphereGeometry(0.26, 10, 8);
    const light = new THREE.SphereGeometry(0.09, 6, 4);
    // Low metalness: without an environment map, very metallic surfaces render black.
    const hullMat = new THREE.MeshStandardMaterial({ color: "#2E3A5C", metalness: 0.25, roughness: 0.5, flatShading: true });
    return { hull, wings, fin, canopy, engine, light, hullMat };
  }, []);
}

type ShipSpec = { lane: number; offset: number; speed: number; color: string };

function Ship({ spec, lanes, parts, animate, trails }: {
  spec: ShipSpec;
  lanes: THREE.CatmullRomCurve3[];
  parts: ReturnType<typeof useShipParts>;
  animate: boolean;
  trails: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  const navL = useRef<THREE.Mesh>(null);
  const navR = useRef<THREE.Mesh>(null);
  const progress = useRef(spec.offset);
  const scratch = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() }), []);
  const glow = useMemo(() => new THREE.Color(spec.color).multiplyScalar(3), [spec.color]);
  const curve = lanes[spec.lane];
  const length = useMemo(() => curve.getLength(), [curve]);

  useFrame((state, dt) => {
    const g = body.current;
    if (!g) return;
    if (animate) progress.current = (progress.current + (dt * spec.speed) / length) % 1;
    const u = progress.current;
    curve.getPointAt(u, scratch.a);
    curve.getPointAt((u + 0.004) % 1, scratch.b);
    curve.getPointAt((u + 0.02) % 1, scratch.c);
    g.position.copy(scratch.a);
    g.lookAt(scratch.b);
    // Bank into the turn: how far the path ahead swings left or right.
    const t1x = scratch.b.x - scratch.a.x, t1z = scratch.b.z - scratch.a.z;
    const t2x = scratch.c.x - scratch.b.x, t2z = scratch.c.z - scratch.b.z;
    const turn = (t1x * t2z - t1z * t2x) / Math.max(1e-4, Math.hypot(t1x, t1z) * Math.hypot(t2x, t2z));
    g.rotateZ(THREE.MathUtils.clamp(turn * 6, -0.7, 0.7));

    const blink = Math.sin(state.clock.elapsedTime * 6 + spec.offset * 20) > 0.6;
    if (navL.current) navL.current.visible = blink;
    if (navR.current) navR.current.visible = blink;
  });

  const engine = (
    <mesh geometry={parts.engine} position={[0, 0, -1.65]}>
      <meshBasicMaterial color={glow} toneMapped={false} />
    </mesh>
  );

  return (
    <group ref={body}>
      <mesh geometry={parts.hull} material={parts.hullMat} />
      <mesh geometry={parts.wings} material={parts.hullMat} />
      <mesh geometry={parts.fin} material={parts.hullMat} />
      <mesh geometry={parts.canopy}>
        <meshBasicMaterial color={[0.6, 1.6, 1.9]} toneMapped={false} />
      </mesh>
      <mesh ref={navL} geometry={parts.light} position={[-1.7, 0, -0.5]}>
        <meshBasicMaterial color={[2.5, 0.3, 0.4]} toneMapped={false} />
      </mesh>
      <mesh ref={navR} geometry={parts.light} position={[1.7, 0, -0.5]}>
        <meshBasicMaterial color={[0.3, 2.5, 0.8]} toneMapped={false} />
      </mesh>
      {trails ? (
        <Trail width={1.1} length={7} color={glow} attenuation={(w) => w * w} decay={1.2}>
          {engine}
        </Trail>
      ) : (
        engine
      )}
    </group>
  );
}

/** A long freighter that crosses high above the city with a strip of lit windows. */
function Cruiser({ animate }: { animate: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const beacons = useRef<THREE.Group>(null);
  const windows = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 16;
    const x = c.getContext("2d")!;
    x.fillStyle = "#000";
    x.fillRect(0, 0, 256, 16);
    const rand = mulberry32(5);
    for (let i = 0; i < 64; i++) {
      if (rand() < 0.35) continue;
      x.fillStyle = rand() < 0.8 ? "#FBBF24" : "#6EE7F9";
      x.fillRect(i * 4 + 1, 5, 2, 6);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    if (animate) {
      g.position.x += dt * 6;
      if (g.position.x > 420) g.position.x = -420;
    }
    const on = Math.sin(state.clock.elapsedTime * 2.2) > 0.7;
    beacons.current?.children.forEach((b) => (b.visible = on && daylight.value < 0.9));
  });

  return (
    <group ref={ref} position={[-120, 150, -170]} rotation-y={Math.PI / 2}>
      <mesh scale={[9, 4, 46]}>
        <boxGeometry />
        <meshStandardMaterial color="#2A3352" metalness={0.25} roughness={0.55} flatShading fog={false} />
      </mesh>
      <mesh position={[0, 3, -12]} scale={[5, 3, 10]}>
        <boxGeometry />
        <meshStandardMaterial color="#303A5C" metalness={0.25} roughness={0.55} flatShading fog={false} />
      </mesh>
      {/* Window strips on both flanks. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 4.55, 0.4, 0]} rotation-y={(side * Math.PI) / 2}>
          <planeGeometry args={[44, 1.6]} />
          <meshBasicMaterial map={windows} color={[1.6, 1.6, 1.6]} transparent blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
        </mesh>
      ))}
      <mesh position={[0, 0, -23.5]} scale={[6, 2.6, 0.6]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color={[0.6, 1.8, 2.2]} toneMapped={false} fog={false} />
      </mesh>
      <group ref={beacons}>
        {[[0, 2.2, 22], [0, 4.6, -12], [-4.6, 0, -20], [4.6, 0, -20]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <sphereGeometry args={[0.45, 8, 6]} />
            <meshBasicMaterial color={[3, 0.4, 0.5]} toneMapped={false} fog={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Ships({ count, animate, trails }: { count: number; animate: boolean; trails: boolean }) {
  const lanes = useMemo(() => buildLanes(), []);
  const parts = useShipParts();
  const specs = useMemo(() => {
    const rand = mulberry32(2718);
    return Array.from({ length: count }, (_, i): ShipSpec => ({
      lane: i % lanes.length,
      offset: rand(),
      speed: 14 + rand() * 12,
      color: ENGINE_COLORS[i % ENGINE_COLORS.length],
    }));
  }, [count, lanes.length]);

  return (
    <group>
      {specs.map((s, i) => (
        <Ship key={i} spec={s} lanes={lanes} parts={parts} animate={animate} trails={trails && animate} />
      ))}
      <Cruiser animate={animate} />
    </group>
  );
}
