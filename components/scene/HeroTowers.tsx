"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { districts, type Accent } from "@/content/districts";
import { COLORS } from "./config";
import { createBuildingMaterial } from "./City";
import { EXTRA_HEIGHT, placedDistricts, type PlacedDistrict } from "./districtLayout";
import { daylight } from "@/lib/daylight";
import { placeLabel } from "@/lib/labels";
import { getState, openDistrict, setState } from "@/lib/store";

const ACCENT: Record<Accent, string> = { cyan: COLORS.cyan, violet: COLORS.violet, amber: COLORS.amber, pink: COLORS.pink };
const INTERACTIVE = new Set(["city", "district", "tour"]);

const BEAM_VERT = /* glsl */ `
  varying float vY;
  void main() {
    vY = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vY;
  void main() {
    // Bright at the roof, fading to nothing as it climbs.
    float a = pow(1.0 - vY, 2.2) * uStrength;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/** Thin glowing bars along the top edges of every tier. */
function trimMatrices(d: PlacedDistrict) {
  const out: THREE.Matrix4[] = [];
  const o = new THREE.Object3D();
  const t = 0.22;
  for (const tier of d.tiers) {
    const rot = THREE.MathUtils.degToRad(tier.rot);
    const edges: [number, number, number, number][] = [
      [0, tier.d / 2, tier.w + t, t],
      [0, -tier.d / 2, tier.w + t, t],
      [tier.w / 2, 0, t, tier.d + t],
      [-tier.w / 2, 0, t, tier.d + t],
    ];
    for (const [ex, ez, sx, sz] of edges) {
      o.position.set(ex, 0, ez).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      o.position.add(new THREE.Vector3(tier.x, tier.y + tier.h, tier.z));
      o.rotation.set(0, rot, 0);
      o.scale.set(sx, t, sz);
      o.updateMatrix();
      out.push(o.matrix.clone());
    }
  }
  return out;
}

function Tower({ d, animate }: { d: PlacedDistrict; animate: boolean }) {
  const copy = districts.find((x) => x.id === d.id)!;
  const accent = useMemo(() => new THREE.Color(ACCENT[copy.accent]), [copy.accent]);
  const glow = useMemo(() => accent.clone().multiplyScalar(2.6), [accent]);

  const body = useRef<THREE.InstancedMesh>(null);
  const trims = useRef<THREE.InstancedMesh>(null);
  const lift = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const waves = useRef<THREE.Group>(null);
  const hot = useRef(0);

  const box = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    // The building shader varies windows by a per instance seed.
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(new Float32Array(d.tiers.map((_, i) => 0.31 + i * 0.17)), 1));
    return g;
  }, [d.tiers]);
  const material = useMemo(
    () => createBuildingMaterial({ windows: { a: ACCENT[copy.accent], b: COLORS.amber, c: "#FFFFFF" }, lit: 0.55 }),
    [copy.accent],
  );
  const trimList = useMemo(() => trimMatrices(d), [d]);
  const unitBox = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  const beamMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BEAM_VERT,
        fragmentShader: BEAM_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uColor: { value: accent.clone().multiplyScalar(1.6) }, uStrength: { value: 0.5 } },
      }),
    [accent],
  );

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    d.tiers.forEach((t, i) => {
      o.position.set(t.x, t.y, t.z);
      o.rotation.set(0, THREE.MathUtils.degToRad(t.rot), 0);
      o.scale.set(t.w, t.h, t.d);
      o.updateMatrix();
      body.current?.setMatrixAt(i, o.matrix);
    });
    trimList.forEach((m, i) => trims.current?.setMatrixAt(i, m));
    if (body.current) body.current.instanceMatrix.needsUpdate = true;
    if (trims.current) trims.current.instanceMatrix.needsUpdate = true;
  }, [d.tiers, trimList]);

  const labelAnchor = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const s = getState();
    const focused = s.activeDistrict === d.id;
    const hovered = s.hoverDistrict === d.id;
    const other = !!s.activeDistrict && !focused;
    hot.current = THREE.MathUtils.damp(hot.current, hovered || focused ? 1 : 0, 6, dt);
    const t = state.clock.elapsedTime;
    applyTowerFrame({
      t: animate ? t : 0,
      dt,
      hot: hot.current,
      other,
      day: daylight.value,
      lift: lift.current,
      body: body.current,
      beacon: beacon.current,
      beam: beam.current,
      waves: waves.current,
      animate,
    });
    // Labels sit near mid height, so farther towers land lower on screen and the names fan out.
    // Nearby towers whose middle is above the view get pulled down into it.
    const reach = Math.hypot(state.camera.position.x - d.center.x, state.camera.position.z - d.center.z);
    const y = Math.max(8, Math.min(d.roof * 0.5 + 6, state.camera.position.y + reach * 0.32));
    labelAnchor.current.set(d.center.x, y, d.center.z);
    placeLabel(`district:${d.id}`, labelAnchor.current, state.camera, state.size.width, state.size.height);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!INTERACTIVE.has(getState().phase)) return;
    e.stopPropagation();
    setState({ hoverDistrict: d.id, canvasHover: true });
  };
  const out = () => setState({ hoverDistrict: null, canvasHover: false });
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!INTERACTIVE.has(getState().phase)) return;
    e.stopPropagation();
    openDistrict(d.id);
  };

  return (
    <group position={d.center}>
      {/* A soft ring of light on the plaza marks the district from above. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.06}>
        <ringGeometry args={[8.6, 9.3, 48]} />
        <meshBasicMaterial color={glow} transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>

      <group ref={lift} onPointerOver={over} onPointerOut={out} onClick={click}>
        <instancedMesh ref={body} args={[box, material, d.tiers.length]} frustumCulled={false} />
        <instancedMesh ref={trims} args={[unitBox, undefined, trimList.length]} frustumCulled={false}>
          <meshBasicMaterial color={glow} toneMapped={false} />
        </instancedMesh>

        {d.extra === "dome" && (
          <group position-y={d.roof}>
            <mesh>
              <sphereGeometry args={[EXTRA_HEIGHT.dome - 0.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#1B2340" metalness={0.2} roughness={0.4} />
            </mesh>
            <mesh>
              <icosahedronGeometry args={[EXTRA_HEIGHT.dome, 2]} />
              <meshBasicMaterial color={glow} wireframe toneMapped={false} transparent opacity={0.55} />
            </mesh>
          </group>
        )}
        {d.extra === "crown" && (
          <mesh position-y={d.roof + 3.2} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry args={[4, 4, 4]} />
            <meshBasicMaterial color={glow} wireframe toneMapped={false} />
          </mesh>
        )}
        {d.extra === "antenna" && (
          <group position-y={d.roof}>
            <mesh position-y={EXTRA_HEIGHT.antenna / 2}>
              <cylinderGeometry args={[0.12, 0.35, EXTRA_HEIGHT.antenna, 6]} />
              <meshStandardMaterial color="#39456A" metalness={0.2} roughness={0.5} />
            </mesh>
            {/* Rings that ripple out from the mast, like a broadcast. */}
            <group ref={waves} position-y={EXTRA_HEIGHT.antenna * 0.8}>
              {[0, 1, 2].map((i) => (
                <mesh key={i} rotation-x={Math.PI / 2} userData={{ offset: i / 3 }}>
                  <torusGeometry args={[1, 0.06, 6, 40]} />
                  <meshBasicMaterial color={glow} transparent toneMapped={false} depthWrite={false} />
                </mesh>
              ))}
            </group>
          </group>
        )}

        <mesh ref={beacon} position-y={d.top + 1.2}>
          <sphereGeometry args={[1.1, 16, 12]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
        <mesh ref={beam} position-y={d.top + 1.2 + 30} material={beamMat}>
          <cylinderGeometry args={[0.15, 0.7, 60, 12, 1, true]} />
        </mesh>

        {/* Invisible box over the whole tower so it is easy to point at. */}
        <mesh position-y={d.top / 2}>
          <boxGeometry args={[14, d.top + 4, 14]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

type Frame = {
  t: number;
  dt: number;
  hot: number;
  other: boolean;
  day: number;
  lift: THREE.Group | null;
  body: THREE.InstancedMesh | null;
  beacon: THREE.Mesh | null;
  beam: THREE.Mesh | null;
  waves: THREE.Group | null;
  animate: boolean;
};

/** Per frame look of one tower. Kept outside the component so it can mutate scene objects freely. */
function applyTowerFrame(f: Frame) {
  if (f.lift) f.lift.position.y = f.hot * 1.4;
  if (f.body) {
    const u = (f.body.material as THREE.ShaderMaterial).uniforms;
    if (f.animate) u.uTime.value += f.dt;
    u.uDim.value = THREE.MathUtils.damp(u.uDim.value, f.other ? 0.45 : 1 + f.hot * 0.9, 4, f.dt);
    u.uShade.value = THREE.MathUtils.damp(u.uShade.value, f.other ? 0.65 : 1, 4, f.dt);
  }
  if (f.beacon) f.beacon.scale.setScalar(1 + Math.sin(f.t * 2.4) * 0.18 + f.hot * 0.4);
  if (f.beam) {
    const u = (f.beam.material as THREE.ShaderMaterial).uniforms;
    u.uStrength.value = (0.45 + f.hot * 0.5) * (1 - f.day * 0.75) * (f.other ? 0.4 : 1);
  }
  if (f.waves) {
    for (const w of f.waves.children) {
      const p = (f.t * 0.45 + (w.userData.offset as number)) % 1;
      w.scale.setScalar(1 + p * 9);
      ((w as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8;
    }
  }
}

export function HeroTowers({ animate }: { animate: boolean }) {
  return (
    <group>
      {placedDistricts.map((d) => (
        <Tower key={d.id} d={d} animate={animate} />
      ))}
    </group>
  );
}
