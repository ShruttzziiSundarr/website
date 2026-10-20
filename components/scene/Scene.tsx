"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { City, generateCity } from "./City";
import { Sky } from "./Sky";
import { Ships } from "./Ships";
import { Greenery } from "./Greenery";
import { ProjectConstellations } from "./ProjectConstellations";
import { HeroTowers } from "./HeroTowers";
import { DayNight } from "./DayNight";
import { CameraRig, initialCameraPosition } from "./CameraRig";
import { BUILDING_BUDGET, CAMERA, COLORS, FOG } from "./config";
import { setState, useStore } from "@/lib/store";

// 0 = low, 1 = mid, 2 = high. PerformanceMonitor moves between them based on frame rate.
type Tier = 0 | 1 | 2;

function Effects({ tier, day }: { tier: Tier; day: boolean }) {
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);
  // By day only truly bright things (the sun, engines) should bloom, not the whole sky.
  const bloom = (
    <Bloom
      mipmapBlur
      intensity={day ? 0.45 : tier === 2 ? 1.15 : 0.75}
      luminanceThreshold={day ? 0.95 : 0.55}
      luminanceSmoothing={0.25}
      radius={tier === 2 ? 0.8 : 0.6}
    />
  );
  const finish = [
    <Vignette key="v" offset={0.28} darkness={day ? 0.45 : 0.72} />,
    <ToneMapping key="t" mode={ToneMappingMode.ACES_FILMIC} />,
  ];
  // Two composers instead of a conditional child: the composer rebuilds its passes from children.
  return tier === 2 ? (
    <EffectComposer multisampling={0}>
      {bloom}
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.35} blendFunction={BlendFunction.NORMAL} />
      {finish}
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      {bloom}
      {finish}
    </EffectComposer>
  );
}

type Props = { mobile: boolean; reducedMotion: boolean };

export default function Scene({ mobile, reducedMotion }: Props) {
  const [tier, setTier] = useState<Tier>(mobile ? 0 : 2);
  const day = useStore((s) => s.mode === "day");
  const { buildings, parks } = useMemo(() => generateCity(), []);
  const budget = mobile ? BUILDING_BUDGET.mobile : [BUILDING_BUDGET.low, BUILDING_BUDGET.mid, BUILDING_BUDGET.high][tier];
  const animate = !reducedMotion;

  return (
    <Canvas
      dpr={mobile ? [1, 1.5] : [1, tier === 2 ? 2 : 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: CAMERA.fov, near: 0.5, far: 1100, position: initialCameraPosition() }}
    >
      <color attach="background" args={[COLORS.night]} />
      <fog attach="fog" args={[FOG.color, FOG.near, FOG.far]} />

      <PerformanceMonitor
        onDecline={() => setTier((t) => (t > 0 ? ((t - 1) as Tier) : t))}
        onIncline={() => setTier((t) => (t < 2 && !mobile ? ((t + 1) as Tier) : t))}
        flipflops={3}
        onFallback={() => setTier(0)}
      >
        <DayNight reducedMotion={reducedMotion} />
        <Sky animate={animate} density={mobile ? 0.5 : 1} />
        <City
          buildings={buildings}
          count={budget}
          animate={animate}
          onReady={() => requestAnimationFrame(() => setState({ sceneReady: true }))}
        />
        <HeroTowers animate={animate} />
        <Greenery parks={parks} radius={mobile ? 70 : tier === 0 ? 85 : 115} />
        <Ships count={mobile ? 6 : tier === 0 ? 8 : 14} animate={animate} trails={!mobile && tier > 0} />
        <ProjectConstellations animate={animate} />
        <CameraRig reducedMotion={reducedMotion} mobile={mobile} />
        {!mobile && tier > 0 && <Effects tier={tier} day={day} />}
      </PerformanceMonitor>
    </Canvas>
  );
}
