"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { constellations } from "@/content/constellations";
import { COLORS, CONSTELLATION } from "./config";
import { placedConstellations, SKY_VANTAGE, type PlacedConstellation } from "./skyLayout";
import { daylight } from "@/lib/daylight";
import { placeLabel } from "@/lib/labels";
import { getState, openProject, setState } from "@/lib/store";

const ACCENT: Record<string, string> = {
  society: COLORS.amber,
  oauth: COLORS.cyan,
  hr: COLORS.violet,
  art: COLORS.pink,
};
const INK = new THREE.Color("#1B2A55"); // chart ink against the day sky

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform float uHi;
  uniform float uDay;
  varying float vTw;
  void main() {
    vTw = 0.8 + 0.2 * sin(uTime * 1.7 + position.x * 0.13);
    // Ink dots need to be larger than glowing stars to read against a bright sky.
    gl_PointSize = aSize * uPixelRatio * (1.0 + uHi * 0.45) * (1.0 + uDay * 0.7) * vTw;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.05, d);
    float a = core * core * uAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor * (0.7 + 0.3 * vTw), a);
    #include <colorspace_fragment>
  }
`;
function Constellation({ placed, index, animate }: { placed: PlacedConstellation; index: number; animate: boolean }) {
  const shape = constellations[index];
  const accent = useMemo(() => new THREE.Color(ACCENT[placed.projectId] ?? COLORS.cyan), [placed.projectId]);

  const starGeo = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(placed.stars);
    // The first star of every chart is its brightest, like an alpha star.
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(placed.stars.map((_, i) => (i === 0 ? 9 : 6))), 1));
    return g;
  }, [placed]);

  const lineGeo = useMemo(() => {
    const pts = shape.lines.flatMap(([a, b]) => [placed.stars[a], placed.stars[b]]);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setDrawRange(0, 0);
    return g;
  }, [placed, shape.lines]);

  const starMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: { value: new THREE.Color() },
          uAlpha: { value: 1 },
          uHi: { value: 0 },
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uDay: daylight,
        },
      }),
    [],
  );
  const lineMat = useMemo(
    () => new THREE.LineBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false }),
    [],
  );

  // Hit area: an invisible disc over the chart, facing the vantage point.
  const hitQuat = useMemo(() => {
    const m = new THREE.Matrix4().lookAt(placed.center, SKY_VANTAGE, placed.up);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  }, [placed]);

  const labelAnchor = useMemo(
    () => placed.center.clone().addScaledVector(placed.up, -CONSTELLATION.scale * 1.25),
    [placed],
  );

  const drawn = useRef(0);
  const hi = useRef(0);
  const points = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);

  useFrame((state, dt) => {
    const s = getState();
    const sky = s.phase === "sky" || s.phase === "tour";
    const focus = s.activeProject === placed.projectId ? 1 : s.hoverProject === placed.projectId ? 0.7 : 0;
    hi.current = THREE.MathUtils.damp(hi.current, focus, 6, dt);
    // Lines draw themselves the first time the visitor looks up, then stay.
    if (sky) drawn.current = animate ? Math.min(1, drawn.current + dt / 1.6) : 1;
    const segs = shape.lines.length;
    lines.current?.geometry.setDrawRange(0, Math.floor(drawn.current * segs + 0.001) * 2);

    placeLabel(placed.projectId, labelAnchor, state.camera, state.size.width, state.size.height);

    const d = daylight.value;
    const sm = points.current?.material as THREE.ShaderMaterial | undefined;
    if (sm) {
      sm.uniforms.uTime.value += animate ? dt : 0;
      sm.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
      sm.uniforms.uHi.value = hi.current;
      (sm.uniforms.uColor.value as THREE.Color).copy(accent).multiplyScalar(1.3 + hi.current * 1.2).lerp(INK, d);
      sm.uniforms.uAlpha.value = sky ? 1 : 0.55;
    }
    const lm = lines.current?.material as THREE.LineBasicMaterial | undefined;
    if (lm) {
      lm.color.copy(accent).multiplyScalar(0.9 + hi.current * 1.4).lerp(INK, d);
      lm.opacity = THREE.MathUtils.lerp(sky ? 0.55 : 0.18, sky ? 0.9 : 0.35, d) + hi.current * 0.45;
    }
  });

  return (
    <group>
      <points ref={points} geometry={starGeo} material={starMat} frustumCulled={false} />
      <lineSegments ref={lines} geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <mesh
        position={placed.center}
        quaternion={hitQuat}
        onPointerOver={(e) => {
          e.stopPropagation();
          setState({ hoverProject: placed.projectId, canvasHover: true });
        }}
        onPointerOut={() => setState({ hoverProject: null, canvasHover: false })}
        onClick={(e) => {
          e.stopPropagation();
          openProject(placed.projectId);
        }}
      >
        <circleGeometry args={[CONSTELLATION.scale * 1.2, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} side={THREE.DoubleSide} />
      </mesh>

    </group>
  );
}

export function ProjectConstellations({ animate }: { animate: boolean }) {
  return (
    <group>
      {placedConstellations.map((p, i) => (
        <Constellation key={p.projectId} placed={p} index={i} animate={animate} />
      ))}
    </group>
  );
}
