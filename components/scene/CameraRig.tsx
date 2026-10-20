"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { CAMERA } from "./config";
import { SKY_LOOK, SKY_VANTAGE, constellationCenter } from "./skyLayout";
import { districtById, districtPose } from "./districtLayout";
import { tourStops } from "./tour";
import { getState, setState, useStore, type Phase } from "@/lib/store";

const ORBIT_TARGET = new THREE.Vector3(...CAMERA.orbitTarget);
const STREET_POS = new THREE.Vector3(...CAMERA.street.pos);
const STREET_LOOK = new THREE.Vector3(...CAMERA.street.look);
const hover = new THREE.Vector3();
const focusLook = new THREE.Vector3();
const focusPos = new THREE.Vector3();

function orbitPosition(angle: number, out: THREE.Vector3) {
  return out.set(Math.sin(angle) * CAMERA.orbitRadius, CAMERA.orbitHeight, Math.cos(angle) * CAMERA.orbitRadius);
}

export function initialCameraPosition(): [number, number, number] {
  const v = orbitPosition(CAMERA.startAngle, new THREE.Vector3());
  return [v.x, v.y, v.z];
}

type Flight = { toPos: THREE.Vector3; toLook: THREE.Vector3; rest: Phase; mid: THREE.Vector3; duration: number };

/** A point above the halfway mark, so moves arc over rooftops instead of cutting through them. */
function arc(from: THREE.Vector3, to: THREE.Vector3, lift: number) {
  return from.clone().lerp(to, 0.5).setY(Math.max(from.y, to.y) + lift);
}

function planFlight(phase: Phase, from: THREE.Vector3, angle: number, mobile: boolean): Flight | null {
  const s = getState();
  const orbit = () => orbitPosition(angle, new THREE.Vector3());
  switch (phase) {
    case "flying":
      // Swoop through a point above and behind the avenue, so the descent reads as a dive.
      return { toPos: STREET_POS.clone(), toLook: STREET_LOOK.clone(), rest: "city", mid: new THREE.Vector3(STREET_POS.x + 30, 38, STREET_POS.z + 55), duration: 3.4 };
    case "returning":
      return { toPos: orbit(), toLook: ORBIT_TARGET.clone(), rest: "gate", mid: new THREE.Vector3(from.x + 25, 45, from.z + 50), duration: 2.6 };
    case "skyward":
      return { toPos: SKY_VANTAGE.clone(), toLook: SKY_LOOK.clone(), rest: "sky", mid: arc(from, SKY_VANTAGE, 8), duration: 2.6 };
    case "groundward": {
      const city = s.skyFrom === "city";
      const toPos = city ? STREET_POS.clone() : orbit();
      return { toPos, toLook: city ? STREET_LOOK.clone() : ORBIT_TARGET.clone(), rest: s.skyFrom, mid: arc(from, toPos, 6), duration: 2.4 };
    }
    case "focusing": {
      const d = districtById(s.activeDistrict);
      if (!d) return null;
      const { pos, look } = districtPose(d, mobile);
      return { toPos: pos, toLook: look, rest: "district", mid: arc(from, pos, 10), duration: 2.4 };
    }
    case "unfocusing":
      return { toPos: STREET_POS.clone(), toLook: STREET_LOOK.clone(), rest: "city", mid: arc(from, STREET_POS, 6), duration: 2.2 };
    default:
      return null;
  }
}

/**
 * Owns the camera. Resting views (gate orbit, street, sky, a district) and flights between them,
 * plus the scripted tour.
 */
export function CameraRig({ reducedMotion, mobile }: { reducedMotion: boolean; mobile: boolean }) {
  const camera = useThree((s) => s.camera);
  const phase = useStore((s) => s.phase);
  const activeDistrict = useStore((s) => s.activeDistrict);
  const angle = useRef(CAMERA.startAngle);
  const look = useRef(ORBIT_TARGET.clone());
  const motion = useRef<gsap.core.Animation | null>(null);
  const parallax = useRef(new THREE.Vector2());
  const districtLook = useRef(new THREE.Vector3());
  const districtPos = useRef(new THREE.Vector3());

  /** Glide along an arc to a pose. Instant when reduced motion is on. */
  const glide = (toPos: THREE.Vector3, toLook: THREE.Vector3, mid: THREE.Vector3, duration: number, done?: () => void) => {
    motion.current?.kill();
    if (reducedMotion) {
      camera.position.copy(toPos);
      look.current.copy(toLook);
      done?.();
      return;
    }
    const fromLook = look.current.clone();
    const curve = new THREE.CatmullRomCurve3([camera.position.clone(), mid, toPos], false, "centripetal");
    const lookEase = gsap.parseEase("power2.out");
    const p = { t: 0 };
    motion.current = gsap.to(p, {
      t: 1,
      duration,
      ease: "power3.inOut",
      onUpdate: () => {
        curve.getPoint(p.t, camera.position);
        // The gaze settles a little ahead of the body, which feels like turning your head first.
        look.current.lerpVectors(fromLook, toLook, lookEase(p.t));
      },
      onComplete: done,
    });
  };

  // Flights between resting views.
  useEffect(() => {
    const plan = planFlight(phase, camera.position, angle.current, mobile);
    if (!plan) return;
    glide(plan.toPos, plan.toLook, plan.mid, plan.duration, () => setState({ phase: plan.rest }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Moving from one tower to the next while already in the district view.
  useEffect(() => {
    if (getState().phase !== "district") return;
    const d = districtById(activeDistrict);
    if (!d) return;
    const { pos, look: target } = districtPose(d, mobile);
    glide(pos, target, arc(camera.position, pos, 8), 1.8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDistrict]);

  // The autopilot tour: travel to each stop, linger, show its caption, end in the sky.
  useEffect(() => {
    if (phase !== "tour") return;
    motion.current?.kill();
    const tl = gsap.timeline({ onComplete: () => setState({ phase: "sky", skyFrom: "city", tourStep: null }) });
    tourStops.forEach((stop, i) => {
      const p = { t: 0 };
      let curve: THREE.CatmullRomCurve3 | null = null;
      let fromLook = new THREE.Vector3();
      tl.to(p, {
        t: 1,
        duration: reducedMotion ? 0.01 : stop.travel,
        ease: "sine.inOut",
        onStart: () => {
          setState({ tourStep: i });
          const from = camera.position.clone();
          // A big rise (the climb to the sky) arcs higher than a hop between towers.
          const lift = Math.abs(stop.pos.y - from.y) > 20 ? 20 : 4;
          curve = new THREE.CatmullRomCurve3([from, arc(from, stop.pos, lift), stop.pos.clone()], false, "centripetal");
          fromLook = look.current.clone();
        },
        onUpdate: () => {
          if (!curve) return;
          curve.getPoint(p.t, camera.position);
          look.current.lerpVectors(fromLook, stop.look, p.t);
        },
      });
      // Reduced motion cuts between stops instead of flying, so give each caption longer.
      tl.to({}, { duration: stop.hold * (reducedMotion ? 1.6 : 1) + (reducedMotion ? stop.travel : 0) });
    });
    motion.current = tl;
    return () => void tl.kill();
  }, [phase, camera, reducedMotion]);

  useEffect(() => () => void motion.current?.kill(), []);

  useFrame((state, dt) => {
    const s = getState();
    parallax.current.lerp(state.pointer, Math.min(1, dt * 2));
    const k = Math.min(1, dt * 3);

    if (s.phase === "gate") {
      if (!reducedMotion) angle.current += dt * CAMERA.orbitSpeed;
      orbitPosition(angle.current, camera.position);
      look.current.copy(ORBIT_TARGET);
      look.current.x += parallax.current.x * 6;
      look.current.y += parallax.current.y * 4;
    } else if (s.phase === "city") {
      const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
      hover.set(STREET_POS.x + parallax.current.x * 1.5, STREET_POS.y + parallax.current.y * 0.8 + bob, STREET_POS.z);
      camera.position.lerp(hover, k);
      look.current.lerp(STREET_LOOK, k);
    } else if (s.phase === "district" && motion.current && !motion.current.isActive()) {
      // Settled on a tower: drift a little with the pointer.
      const d = districtById(s.activeDistrict);
      if (d) {
        const pose = districtPose(d, mobile);
        districtPos.current.copy(pose.pos);
        districtPos.current.x += parallax.current.x * 2;
        districtPos.current.y += parallax.current.y * 1.2;
        districtLook.current.copy(pose.look);
        camera.position.lerp(districtPos.current, k);
        look.current.lerp(districtLook.current, k);
      }
    } else if (s.phase === "sky") {
      // Look around the sky with the pointer, and lean toward the chart that has attention.
      const active = constellationCenter(s.activeProject);
      const hovered = constellationCenter(s.hoverProject);
      focusLook.copy(SKY_LOOK);
      focusLook.x += parallax.current.x * 60;
      focusLook.y += parallax.current.y * 35;
      focusPos.copy(SKY_VANTAGE);
      if (active) {
        focusLook.lerp(active, 0.8);
        focusPos.lerp(active, 0.08);
      } else if (hovered) {
        focusLook.lerp(hovered, 0.3);
      }
      camera.position.lerp(focusPos, Math.min(1, dt * 1.5));
      look.current.lerp(focusLook, Math.min(1, dt * 2));
    }
    camera.lookAt(look.current);
  });

  return null;
}
