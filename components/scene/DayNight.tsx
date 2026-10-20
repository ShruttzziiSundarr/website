"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { COLORS, DAY, FOG } from "./config";
import { MOON_POS, SUN_DIR } from "./Sky";
import { daylight } from "@/lib/daylight";
import { useStore } from "@/lib/store";

/**
 * Drives the shared daylight value toward the chosen mode, and keeps the scene lights,
 * fog and background in step with it. Custom shaders read daylight directly.
 */
export function DayNight({ reducedMotion }: { reducedMotion: boolean }) {
  const mode = useStore((s) => s.mode);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    const target = mode === "day" ? 1 : 0;
    if (reducedMotion) {
      daylight.value = target;
      return;
    }
    const tween = gsap.to(daylight, { value: target, duration: 1.6, ease: "sine.inOut" });
    return () => void tween.kill();
  }, [mode, reducedMotion]);

  const c = useMemo(
    () => ({
      fogNight: new THREE.Color(FOG.color),
      fogDay: new THREE.Color(FOG.dayColor),
      bgNight: new THREE.Color(COLORS.night),
      bgDay: new THREE.Color(DAY.horizon),
      skyNight: new THREE.Color("#1B2550"),
      skyDay: new THREE.Color("#BFDBFF"),
      groundNight: new THREE.Color("#05070D"),
      groundDay: new THREE.Color("#8A8F7A"),
      moon: new THREE.Color("#9FB4FF"),
      sunCol: new THREE.Color(DAY.sun),
    }),
    [],
  );

  useFrame(({ scene }) => {
    const d = daylight.value;
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.lerpColors(c.fogNight, c.fogDay, d);
      scene.fog.far = FOG.far * (1 + d * 0.6);
    }
    if (scene.background instanceof THREE.Color) scene.background.lerpColors(c.bgNight, c.bgDay, d);
    if (hemi.current) {
      hemi.current.color.lerpColors(c.skyNight, c.skyDay, d);
      hemi.current.groundColor.lerpColors(c.groundNight, c.groundDay, d);
      hemi.current.intensity = THREE.MathUtils.lerp(0.5, 1.4, d);
    }
    if (sun.current) {
      sun.current.color.lerpColors(c.moon, c.sunCol, d);
      sun.current.intensity = THREE.MathUtils.lerp(0.5, 2.4, d);
      // One directional light that moves from the moon's side of the sky to the sun's.
      sun.current.position.set(
        THREE.MathUtils.lerp(MOON_POS.x, SUN_DIR.x * 300, d),
        THREE.MathUtils.lerp(MOON_POS.y, SUN_DIR.y * 300, d),
        THREE.MathUtils.lerp(MOON_POS.z, SUN_DIR.z * 300, d),
      );
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} />
    </>
  );
}
