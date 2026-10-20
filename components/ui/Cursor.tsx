"use client";

import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/lib/hooks";
import { useStore } from "@/lib/store";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, [data-cursor='hover']";

/** Dot plus trailing ring. The ring grows over anything clickable, including 3D towers. */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const canvasHover = useStore((s) => s.canvasHover);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const domHover = useRef(false);

  useEffect(() => {
    if (!fine) return;
    const root = document.documentElement;
    root.classList.add("custom-cursor");

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      ring.current?.parentElement?.setAttribute("data-visible", "true");
    };
    const onOver = (e: PointerEvent) => {
      const el = e.target as Element | null;
      domHover.current = !!el?.closest?.(INTERACTIVE);
      ring.current?.setAttribute("data-hover", String(domHover.current));
    };
    const onDown = () => ring.current?.setAttribute("data-press", "true");
    const onUp = () => ring.current?.setAttribute("data-press", "false");
    const onLeave = () => ring.current?.parentElement?.setAttribute("data-visible", "false");

    const tick = () => {
      const k = reduced ? 1 : 0.18;
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      if (ring.current) ring.current.style.translate = `${pos.x}px ${pos.y}px`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [fine, reduced]);

  useEffect(() => {
    ring.current?.setAttribute("data-canvas", String(canvasHover));
  }, [canvasHover]);

  if (!fine) return null;

  return (
    <div
      aria-hidden="true"
      data-visible="false"
      className="pointer-events-none fixed inset-0 z-[100] opacity-0 transition-opacity duration-300 data-[visible=true]:opacity-100"
    >
      <div
        ref={ring}
        className="group absolute left-0 top-0 h-9 w-9 -ml-[18px] -mt-[18px] rounded-full border border-cyan/60 transition-[scale,background-color,border-color] duration-300 ease-out data-[canvas=true]:scale-[1.9] data-[canvas=true]:border-cyan data-[canvas=true]:bg-cyan/10 data-[hover=true]:scale-[1.9] data-[hover=true]:border-cyan data-[hover=true]:bg-cyan/10 data-[press=true]:scale-90"
      />
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1.5 w-1.5 -ml-[3px] -mt-[3px] rounded-full bg-cyan shadow-[0_0_10px_rgba(110,231,249,0.9)]"
      />
    </div>
  );
}
