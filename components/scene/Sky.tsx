"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, DAY } from "./config";
import { mulberry32 } from "./City";
import { daylight } from "@/lib/daylight";

export const SUN_DIR = new THREE.Vector3(0.55, 0.6, -0.45).normalize();
// Off to the right of the sky view, so it never sits behind a constellation.
export const MOON_POS = new THREE.Vector3(260, 105, -250);
// The Milky Way runs along the great circle with this normal.
const GALAXY_NORMAL = new THREE.Vector3(0.35, 0.55, 0.76).normalize();

// ---------------------------------------------------------------- dome

const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DOME_FRAG = /* glsl */ `
  uniform float uDay;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBand;
  uniform vec3 uGalaxy;
  uniform vec3 uGalaxyNormal;
  uniform vec3 uDayTop;
  uniform vec3 uDayHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  varying vec3 vDir;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  void main() {
    float h = vDir.y;
    float up = smoothstep(0.0, 0.45, h);

    vec3 night = mix(uHorizon, uTop, up);
    // Thin glow just above the horizon. It is zero at h = 0 so the sky meets the fogged ground cleanly.
    night += uBand * smoothstep(0.0, 0.05, h) * exp(-h * 9.0);
    // A soft dusty glow along the Milky Way, broken up by noise.
    float g = exp(-pow(dot(vDir, uGalaxyNormal) / 0.13, 2.0));
    float dust = noise(vDir * 9.0) * 0.6 + noise(vDir * 23.0) * 0.4;
    night += uGalaxy * g * dust * smoothstep(0.0, 0.2, h);

    vec3 day = mix(uDayHorizon, uDayTop, smoothstep(0.0, 0.55, h));
    float s = max(dot(vDir, uSunDir), 0.0);
    day += uSun * (pow(s, 24.0) * 0.5 + pow(s, 4.0) * 0.12);

    gl_FragColor = vec4(mix(night, day, uDay), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ---------------------------------------------------------------- stars

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uDay;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    float twinkle = 0.65 + 0.35 * sin(uTime * (0.8 + aPhase * 2.2) + aPhase * 40.0);
    // Stars thin out near the horizon, where there is more air to look through.
    float horizon = smoothstep(0.0, 0.18, normalize(position).y);
    vAlpha = twinkle * horizon * (1.0 - uDay);
    gl_PointSize = aSize * uPixelRatio * (0.85 + 0.15 * twinkle);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = core * core * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
    #include <colorspace_fragment>
  }
`;

function buildStars(density: number) {
  const rand = mulberry32(7);
  const plain = Math.round(3200 * density);
  const galaxy = Math.round(5200 * density);
  const total = plain + galaxy;
  const pos = new Float32Array(total * 3);
  const size = new Float32Array(total);
  const phase = new Float32Array(total);
  const color = new Float32Array(total * 3);
  const radius = 470;

  const u = new THREE.Vector3(1, 0, 0).cross(GALAXY_NORMAL).normalize();
  const v = GALAXY_NORMAL.clone().cross(u).normalize();
  const tmp = new THREE.Vector3();
  const tints = [
    new THREE.Color("#FFFFFF"),
    new THREE.Color("#CFF6FF"),
    new THREE.Color("#E3D9FF"),
    new THREE.Color("#FFE9C2"),
  ];

  for (let i = 0; i < total; i++) {
    if (i < plain) {
      // Uniform over the upper sky.
      const y = rand() * 0.98 + 0.02;
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - y * y);
      tmp.set(Math.cos(a) * r, y, Math.sin(a) * r);
    } else {
      // Packed around the galactic circle with a gaussian spread.
      const a = rand() * Math.PI * 2;
      const spread = (rand() + rand() + rand() - 1.5) * 0.16;
      tmp.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(v, Math.sin(a)).addScaledVector(GALAXY_NORMAL, spread).normalize();
      if (tmp.y < 0.02) tmp.y = Math.abs(tmp.y) + 0.02;
      tmp.normalize();
    }
    pos.set([tmp.x * radius, tmp.y * radius, tmp.z * radius], i * 3);

    const bright = rand();
    const isGalaxy = i >= plain;
    // Most stars are faint pinpricks; a few are big enough to catch the bloom.
    size[i] = isGalaxy ? 1.2 + bright * 1.6 : 1.4 + Math.pow(bright, 6) * 6.5;
    phase[i] = rand();
    const c = tints[(rand() * tints.length) | 0].clone().multiplyScalar(isGalaxy ? 0.55 + bright * 0.4 : 0.7 + Math.pow(bright, 4) * 1.4);
    color.set([c.r, c.g, c.b], i * 3);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
  return g;
}

function StarField({ animate, density }: { animate: boolean; density: number }) {
  const geometry = useMemo(() => buildStars(density), [density]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uDay: daylight, uPixelRatio: { value: 1 } },
      }),
    [],
  );
  const points = useRef<THREE.Points>(null);

  useFrame((state, dt) => {
    const m = points.current?.material as THREE.ShaderMaterial | undefined;
    if (!m) return;
    if (animate) m.uniforms.uTime.value += dt;
    m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

// ---------------------------------------------------------------- shooting stars

const DOWN = new THREE.Vector3(0, -1, 0);

type Shooter = {
  line: THREE.Line;
  t: number;
  dur: number;
  start: THREE.Vector3;
  dir: THREE.Vector3;
  head: THREE.Vector3;
  tail: THREE.Vector3;
  next: number;
};

function stepShootingStars(pool: Shooter[], dt: number) {
  const night = 1 - daylight.value;
  for (const s of pool) {
    if (!s.line.visible) {
      s.next -= dt;
      if (s.next > 0 || night < 0.5) continue;
      // Start somewhere high in the sky and fall across it at a shallow angle.
      const a = Math.random() * Math.PI * 2;
      const y = 0.35 + Math.random() * 0.4;
      const r = Math.sqrt(1 - y * y);
      s.start.set(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(440);
      const side = Math.random() < 0.5 ? 1 : -1;
      s.dir.set(-Math.sin(a) * side, 0, Math.cos(a) * side).addScaledVector(DOWN, 0.45).normalize();
      s.t = 0;
      s.dur = 0.7 + Math.random() * 0.6;
      s.line.visible = true;
    }
    s.t += dt;
    const p = s.t / s.dur;
    if (p >= 1) {
      s.line.visible = false;
      s.next = 4 + Math.random() * 8;
      continue;
    }
    s.head.copy(s.start).addScaledVector(s.dir, p * 140);
    s.tail.copy(s.head).addScaledVector(s.dir, -40 * Math.min(1, p * 3));
    const fade = Math.sin(Math.PI * p) * night * 2.2;
    const pos = s.line.geometry.attributes.position as THREE.BufferAttribute;
    const col = s.line.geometry.attributes.color as THREE.BufferAttribute;
    pos.setXYZ(0, s.head.x, s.head.y, s.head.z);
    pos.setXYZ(1, s.tail.x, s.tail.y, s.tail.z);
    col.setXYZ(0, fade, fade, fade * 1.1);
    col.setXYZ(1, 0, 0, 0);
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }
}

function ShootingStars() {
  const pool = useMemo(
    () =>
      Array.from({ length: 2 }, (_, i) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
        g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(
          g,
          new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
        );
        line.frustumCulled = false;
        line.visible = false;
        return {
          line,
          t: 0,
          dur: 1,
          start: new THREE.Vector3(),
          dir: new THREE.Vector3(),
          head: new THREE.Vector3(),
          tail: new THREE.Vector3(),
          next: 2 + i * 4,
        };
      }),
    [],
  );

  useFrame((_, dt) => stepShootingStars(pool, dt));

  return (
    <>
      {pool.map((s, i) => (
        <primitive key={i} object={s.line} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------- moon, sun, clouds

function canvasTexture(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function radial(c: CanvasRenderingContext2D, s: number, stops: [number, string][]) {
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
}

function makeSkyTextures() {
  const moon = canvasTexture(256, (c, s) => {
    c.beginPath();
    c.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
    c.fillStyle = "#fff6e2";
    c.fill();
    c.save();
    c.clip();
    const craters: [number, number, number][] = [
      [90, 100, 30], [165, 80, 17], [155, 165, 34], [80, 175, 15], [205, 130, 11], [118, 138, 10],
    ];
    for (const [x, y, r] of craters) {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(186,170,155,0.6)");
      g.addColorStop(1, "rgba(186,170,155,0)");
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // A slight shadow on one side gives the disc some roundness.
    const shade = c.createRadialGradient(s * 0.38, s * 0.38, s * 0.2, s / 2, s / 2, s / 2);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(60,50,80,0.35)");
    c.fillStyle = shade;
    c.fillRect(0, 0, s, s);
    c.restore();
  });
  const moonHalo = canvasTexture(256, (c, s) =>
    radial(c, s, [[0, "rgba(255,240,210,0.9)"], [0.18, "rgba(255,230,200,0.35)"], [0.5, "rgba(167,139,250,0.08)"], [1, "rgba(167,139,250,0)"]]),
  );
  const sun = canvasTexture(256, (c, s) =>
    radial(c, s, [[0, "rgba(255,255,245,1)"], [0.22, "rgba(255,248,220,1)"], [0.3, "rgba(255,231,176,0.45)"], [1, "rgba(255,231,176,0)"]]),
  );
  const cloud = canvasTexture(256, (c, s) => {
    const rand = mulberry32(42);
    for (let i = 0; i < 14; i++) {
      const x = s * (0.2 + rand() * 0.6);
      const y = s * (0.45 + (rand() - 0.5) * 0.25);
      const r = s * (0.1 + rand() * 0.14);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
  return { moon, moonHalo, sun, cloud };
}

/** Each sprite says in userData whether it belongs to the night or the day, and how opaque it gets. */
function fadeSprites(root: THREE.Object3D, d: number) {
  root.traverse((o) => {
    const s = o as THREE.Sprite;
    if (!s.isSprite) return;
    const { time, base = 1 } = s.userData as { time: "night" | "day"; base?: number };
    const m = s.material as THREE.SpriteMaterial;
    m.opacity = (time === "night" ? 1 - d : d) * base;
    s.visible = m.opacity > 0.005;
  });
}

function driftClouds(group: THREE.Object3D, dt: number) {
  for (const c of group.children) {
    c.position.x += dt * (c.userData.speed as number);
    if (c.position.x > 380) c.position.x = -380;
  }
}

function Lights({ animate }: { animate: boolean }) {
  const tex = useMemo(() => makeSkyTextures(), []);
  const root = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Group>(null);
  const cloudSeeds = useMemo(() => {
    const rand = mulberry32(99);
    // Clouds sit low, near the horizon, so they never cover the constellations higher up.
    return Array.from({ length: 14 }, () => ({
      x: (rand() - 0.5) * 760,
      y: 55 + rand() * 45,
      z: -260 - rand() * 180,
      s: 90 + rand() * 90,
      speed: 2 + rand() * 3,
    }));
  }, []);
  const sunPos = useMemo(() => SUN_DIR.clone().multiplyScalar(420), []);

  useFrame((_, dt) => {
    if (root.current) fadeSprites(root.current, daylight.value);
    if (animate && clouds.current) driftClouds(clouds.current, dt);
  });

  return (
    <group ref={root}>
      <group position={MOON_POS}>
        <sprite scale={[150, 150, 1]} userData={{ time: "night" }}>
          <spriteMaterial map={tex.moonHalo} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
        {/* Sprites always face the screen, so the moon stays round even at the edge of a wide view. */}
        <sprite scale={[24, 24, 1]} userData={{ time: "night" }}>
          <spriteMaterial map={tex.moon} color={[1.5, 1.45, 1.35]} transparent toneMapped={false} fog={false} />
        </sprite>
      </group>

      <sprite position={sunPos} scale={[120, 120, 1]} userData={{ time: "day" }}>
        <spriteMaterial map={tex.sun} color={[2, 1.9, 1.6]} transparent opacity={0} depthWrite={false} toneMapped={false} fog={false} />
      </sprite>

      <group ref={clouds}>
        {cloudSeeds.map((c, i) => (
          <sprite key={i} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.45, 1]} userData={{ time: "day", base: 0.9, speed: c.speed }}>
            <spriteMaterial map={tex.cloud} transparent opacity={0} depthWrite={false} fog={false} />
          </sprite>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- sky

export function Sky({ animate, density = 1 }: { animate: boolean; density?: number }) {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  // The sky rides along with the camera so stars, moon and sun read as infinitely far away.
  useFrame(() => group.current?.position.copy(camera.position));

  const dome = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DOME_VERT,
        fragmentShader: DOME_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uDay: daylight,
          uTop: { value: new THREE.Color(COLORS.night) },
          uHorizon: { value: new THREE.Color(COLORS.horizon) },
          uBand: { value: new THREE.Color(COLORS.violet).multiplyScalar(0.06) },
          uGalaxy: { value: new THREE.Color("#7C6BC4").multiplyScalar(0.09) },
          uGalaxyNormal: { value: GALAXY_NORMAL },
          uDayTop: { value: new THREE.Color(DAY.top) },
          uDayHorizon: { value: new THREE.Color(DAY.horizon) },
          uSun: { value: new THREE.Color(DAY.sun) },
          uSunDir: { value: SUN_DIR },
        },
      }),
    [],
  );

  return (
    <group ref={group}>
      <mesh material={dome} renderOrder={-1}>
        <sphereGeometry args={[520, 48, 24]} />
      </mesh>
      <StarField animate={animate} density={density} />
      {animate && <ShootingStars />}
      <Lights animate={animate} />
    </group>
  );
}
