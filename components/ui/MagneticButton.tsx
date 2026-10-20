"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { ReactNode, PointerEvent, MouseEventHandler } from "react";
import { useReducedMotion } from "@/lib/hooks";

type Props = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  strength?: number;
  "aria-label"?: string;
  target?: string;
  rel?: string;
};

/** Button or link that leans toward the pointer and springs back on leave. */
export function MagneticButton({ children, className, href, onClick, strength = 0.35, ...rest }: Props) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 220, damping: 18, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  // The label travels a little further than the shell, which gives the pull some depth.
  const lx = useTransform(sx, (v) => v * 0.4);
  const ly = useTransform(sy, (v) => v * 0.4);

  const move = (e: PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  const inner = (
    <motion.span className="relative inline-flex items-center gap-2" style={{ x: lx, y: ly }}>
      {children}
    </motion.span>
  );

  const common = {
    className,
    style: { x: sx, y: sy },
    onPointerMove: move,
    onPointerLeave: leave,
    onClick,
    ...rest,
  };

  return href ? (
    <motion.a href={href} {...common}>
      {inner}
    </motion.a>
  ) : (
    <motion.button type="button" {...common}>
      {inner}
    </motion.button>
  );
}
