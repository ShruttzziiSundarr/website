"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BLOCK_RADIUS, COLORS, DAY, FOG, LOT, PITCH } from "./config";
import { daylight } from "@/lib/daylight";
import { getState } from "@/lib/store";
import { HERO_BLOCKS } from "./districtLayout";

// Small seeded RNG so the skyline is the same on every visit.
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Building = { x: number; z: number; w: number; d: number; h: number; seed: number; dist: number };
export type Park = { x: number; z: number };

const isHeroBlock = (bx: number, bz: number) => HERO_BLOCKS.some(([x, z]) => x === bx && z === bz);

export function generateCity() {
  const rand = mulberry32(20261020);
  const heroCenters = HERO_BLOCKS.map(([x, z]) => [x * PITCH, z * PITCH]);
  const buildings: Building[] = [];
  const parks: Park[] = [];
  for (let bx = -BLOCK_RADIUS; bx <= BLOCK_RADIUS; bx++) {
    for (let bz = -BLOCK_RADIUS; bz <= BLOCK_RADIUS; bz++) {
      for (let lx = -1; lx <= 1; lx++) {
        for (let lz = -1; lz <= 1; lz++) {
          const x = bx * PITCH + lx * LOT;
          const z = bz * PITCH + lz * LOT;
          const dist = Math.hypot(x, z);
          const r = rand();
          // Hero blocks stay clear; the tower and its plaza go there.
          if (isHeroBlock(bx, bz)) continue;
          // Empty lots become small parks. A few are forced along the landing avenue so they show.
          const avenuePark = bx === 0 && lx === 1 && bz >= 0 && bz <= 3 && r < 0.4;
          if (r > 0.9 || avenuePark) {
            parks.push({ x, z });
            continue;
          }
          const core = Math.exp(-dist / 85); // taller toward downtown
          let h = 3 + Math.pow(rand(), 2.4) * (10 + 70 * core) + core * 8;
          if (rand() < 0.03) h *= 1.7; // a few needles break the skyline
          // Keep the neighbors of hero towers low so the towers read from the street.
          const nearHero = Math.min(...heroCenters.map(([hx, hz]) => Math.hypot(x - hx, z - hz)));
          if (nearHero < 32) h = Math.min(h, 14 + nearHero * 0.5);
          buildings.push({
            x: x + (rand() - 0.5) * 0.6,
            z: z + (rand() - 0.5) * 0.6,
            w: LOT * (0.55 + rand() * 0.35),
            d: LOT * (0.55 + rand() * 0.35),
            h,
            seed: rand(),
            dist,
          });
        }
      }
    }
  }
  // Nearest first, so lowering the draw count trims the foggy outskirts.
  buildings.sort((a, b) => a.dist - b.dist);
  return { buildings, parks };
}

/** Fog uniforms every custom shader shares, including the day blend. */
export const fogUniforms = () => ({
  uDay: daylight,
  uFogColor: { value: new THREE.Color(FOG.color) },
  uFogDay: { value: new THREE.Color(FOG.dayColor) },
  uFogNear: { value: FOG.near },
  uFogFar: { value: FOG.far },
});

export const FOG_GLSL = /* glsl */ `
  uniform float uDay;
  uniform vec3 uFogColor;
  uniform vec3 uFogDay;
  uniform float uFogNear;
  uniform float uFogFar;
  vec3 applyFog(vec3 col, float depth) {
    float f = smoothstep(uFogNear, uFogFar * mix(1.0, 1.6, uDay), depth);
    return mix(col, mix(uFogColor, uFogDay, uDay), f);
  }
`;

const BUILDING_VERT = /* glsl */ `
  attribute float aSeed;
  varying vec3 vLocal;
  varying vec3 vNormalL;
  varying vec3 vScale;
  varying float vSeed;
  varying float vFogDepth;
  void main() {
    vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    vLocal = position * vScale;
    vNormalL = normal;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const BUILDING_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uDim;
  uniform float uLit;
  uniform float uShade;
  uniform vec3 uWall;
  uniform vec3 uWallTop;
  uniform vec3 uMoonLight;
  uniform vec3 uWinA;
  uniform vec3 uWinB;
  uniform vec3 uWinC;
  uniform vec3 uDayA;
  uniform vec3 uDayB;
  uniform vec3 uDayC;
  uniform vec3 uGlass;
  uniform vec3 uGlassSky;
  uniform vec3 uSunDir;
  ${FOG_GLSL}
  varying vec3 vLocal;
  varying vec3 vNormalL;
  varying vec3 vScale;
  varying float vSeed;
  varying float vFogDepth;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // The seed is constant per building, but interpolation adds float noise that the hash would
    // amplify into speckled windows. Rounding it first keeps every window a single solid state.
    float seed = floor(vSeed * 4096.0 + 0.5) / 4096.0;
    vec3 n = vNormalL;
    float hNorm = clamp(vLocal.y / max(vScale.y, 1.0), 0.0, 1.0);

    // Night body: dark navy, a touch of moonlight on one side.
    vec3 night = mix(uWall, uWallTop, hNorm * hNorm);
    night += uMoonLight * max(dot(n, normalize(vec3(-0.45, 0.35, -0.8))), 0.0);

    // Day body: one of three materials per building, lit by the sun.
    vec3 dayWall = seed < 0.4 ? uDayA : (seed < 0.75 ? uDayB : uDayC);
    float sun = max(dot(n, uSunDir), 0.0);
    vec3 day = dayWall * (0.5 + 0.7 * sun) * mix(0.85, 1.0, hNorm);

    if (abs(n.y) < 0.5) {
      bool sideX = abs(n.x) > 0.5;
      float u = sideX ? vLocal.z : vLocal.x;
      float face = sideX ? (n.x > 0.0 ? 1.0 : 2.0) : (n.z > 0.0 ? 3.0 : 4.0);
      vec2 cell = vec2(u + 64.0, vLocal.y - 0.6) / vec2(0.9, 1.15);
      vec2 id = floor(cell);
      vec2 f = fract(cell);
      float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.25, f.y) * step(f.y, 0.72);
      win *= step(0.0, vLocal.y - 0.6);

      // Fade each axis on its own: grazing angles squash one axis long before the other.
      vec2 aa = fwidth(cell);
      win = mix(win, 0.22, smoothstep(0.15, 0.45, max(aa.x, aa.y)));

      float h = hash(id + vec2(seed * 31.7, face * 7.3));
      // Every window rerolls on its own slow clock, so lights switch on and off around the city.
      float epoch = floor(uTime * 0.08 + h * 11.0);
      float lit = step(uLit, hash(id * 1.37 + vec2(epoch * 0.71, seed * 17.0 + face)));
      // A handful of faulty lights flicker fast.
      float flicker = h > 0.988 ? 0.35 + 0.65 * step(0.45, fract(sin(floor(uTime * 14.0) + h * 91.0) * 43758.5)) : 1.0;

      float pick = hash(id + seed * 3.1);
      vec3 wc = pick < 0.78 ? uWinA : (pick < 0.92 ? uWinB : uWinC);
      float bright = 0.55 + 0.9 * hash(id * 2.1 + seed);
      night += win * lit * flicker * bright * wc * uDim;
      night += win * (1.0 - lit) * uWall * 0.6;

      // By day the windows are glass that catches the sky, lighter near the top of each pane.
      vec3 glass = mix(uGlass, uGlassSky, f.y * 0.8 + sun * 0.2) * (0.85 + 0.3 * h);
      day = mix(day, glass, win * 0.9);
    } else if (n.y > 0.5) {
      night = uWallTop * 0.6;
      day = dayWall * 0.8;
    }

    // uShade pulls a building back when another one has the visitor's attention.
    vec3 col = mix(night, day, uDay) * mix(uShade, 1.0, uDay * 0.5);
    gl_FragColor = vec4(applyFog(col, vFogDepth), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const GROUND_VERT = /* glsl */ `
  varying vec2 vWorld;
  varying float vFogDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xz;
    vec4 mv = viewMatrix * world;
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const GROUND_FRAG = /* glsl */ `
  uniform float uPitch;
  uniform float uHalfBlock;
  uniform vec3 uBase;
  uniform vec3 uRoad;
  uniform vec3 uLine;
  uniform vec3 uCurb;
  uniform vec3 uBaseDay;
  uniform vec3 uRoadDay;
  uniform vec3 uLineDay;
  ${FOG_GLSL}
  varying vec2 vWorld;
  varying float vFogDepth;

  void main() {
    vec2 m = mod(vWorld + uPitch * 0.5, uPitch) - uPitch * 0.5;
    vec2 a = abs(m);
    float roadX = step(uHalfBlock, a.x);
    float roadZ = step(uHalfBlock, a.y);
    float road = max(roadX, roadZ);

    float center = uPitch * 0.5;
    float aa = fwidth(vWorld.x) + fwidth(vWorld.y);
    // Dashed center lines, hidden inside intersections.
    float dashZ = step(0.5, fract(vWorld.y / 3.0)) * (1.0 - smoothstep(0.06, 0.06 + aa, abs(a.x - center))) * (1.0 - roadZ);
    float dashX = step(0.5, fract(vWorld.x / 3.0)) * (1.0 - smoothstep(0.06, 0.06 + aa, abs(a.y - center))) * (1.0 - roadX);
    float dash = dashZ + dashX;

    // Soft glow along the curbs at night, like light spilling from shopfronts.
    float curb = exp(-pow((a.x - uHalfBlock) * 1.6, 2.0)) * (1.0 - roadZ) + exp(-pow((a.y - uHalfBlock) * 1.6, 2.0)) * (1.0 - roadX);

    vec3 night = mix(uBase, uRoad, road) + uLine * dash + uCurb * curb;
    vec3 day = mix(uBaseDay, uRoadDay, road) + uLineDay * dash;
    gl_FragColor = vec4(applyFog(mix(night, day, uDay), vFogDepth), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type WindowColors = { a?: THREE.ColorRepresentation; b?: THREE.ColorRepresentation; c?: THREE.ColorRepresentation };

/** The building look, shared by the background city and the hero towers. */
export function createBuildingMaterial({ windows = {}, lit = 0.8 }: { windows?: WindowColors; lit?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: BUILDING_VERT,
    fragmentShader: BUILDING_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uDim: { value: 1 },
      uLit: { value: lit },
      uShade: { value: 1 },
      uWall: { value: new THREE.Color("#0A1120") },
      uWallTop: { value: new THREE.Color("#1A2442") },
      uMoonLight: { value: new THREE.Color("#141E38") },
      uWinA: { value: new THREE.Color(windows.a ?? COLORS.amber).multiplyScalar(1.7) },
      uWinB: { value: new THREE.Color(windows.b ?? COLORS.cyan).multiplyScalar(1.3) },
      uWinC: { value: new THREE.Color(windows.c ?? COLORS.violet).multiplyScalar(1.3) },
      uDayA: { value: new THREE.Color("#C9D1DC") }, // concrete
      uDayB: { value: new THREE.Color("#D9CDBA") }, // sandstone
      uDayC: { value: new THREE.Color("#9DB5CF") }, // blue glass tower
      uGlass: { value: new THREE.Color("#3C5878") },
      uGlassSky: { value: new THREE.Color(DAY.horizon) },
      uSunDir: { value: new THREE.Vector3(0.55, 0.6, -0.45).normalize() },
      ...fogUniforms(),
    },
  });
}

type Props = {
  buildings: Building[];
  count: number;
  animate: boolean;
  onReady?: () => void;
};

export function City({ buildings, count, animate, onReady }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    const seeds = new Float32Array(buildings.length);
    buildings.forEach((b, i) => (seeds[i] = b.seed));
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    return g;
  }, [buildings]);

  const material = useMemo(() => createBuildingMaterial(), []);

  const groundMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GROUND_VERT,
        fragmentShader: GROUND_FRAG,
        uniforms: {
          uPitch: { value: PITCH },
          uHalfBlock: { value: LOT * 1.5 },
          uBase: { value: new THREE.Color("#070C18") },
          uRoad: { value: new THREE.Color("#0C1426") },
          uLine: { value: new THREE.Color(COLORS.amber).multiplyScalar(0.35) },
          uCurb: { value: new THREE.Color(COLORS.cyan).multiplyScalar(0.12) },
          uBaseDay: { value: new THREE.Color("#AEB7C2") },
          uRoadDay: { value: new THREE.Color("#4A5363") },
          uLineDay: { value: new THREE.Color("#F2E6C4").multiplyScalar(0.8) },
          ...fogUniforms(),
        },
      }),
    [],
  );

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    buildings.forEach((b, i) => {
      o.position.set(b.x, 0, b.z);
      o.scale.set(b.w, b.h, b.d);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings]);

  useLayoutEffect(() => {
    if (mesh.current) mesh.current.count = Math.min(count, buildings.length);
  }, [count, buildings.length]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const u = (m.material as THREE.ShaderMaterial).uniforms;
    if (animate) u.uTime.value += dt;
    // While a tower is in focus, the rest of the city steps back.
    const p = getState().phase;
    const focused = p === "focusing" || p === "district";
    u.uDim.value = THREE.MathUtils.damp(u.uDim.value, focused ? 0.35 : 1, 3, dt);
    u.uShade.value = THREE.MathUtils.damp(u.uShade.value, focused ? 0.55 : 1, 3, dt);
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[geometry, material, buildings.length]} frustumCulled={false} />
      <mesh rotation-x={-Math.PI / 2} material={groundMaterial}>
        <planeGeometry args={[1800, 1800]} />
      </mesh>
    </group>
  );
}
