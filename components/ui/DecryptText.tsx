"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import { useReducedMotion } from "@/lib/hooks";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/=?@";

function randomGlyph() {
  return GLYPHS[(Math.random() * GLYPHS.length) | 0];
}

/** Deterministic scramble so server and client render the same first frame. */
function staticScramble(text: string) {
  return text
    .split("")
    .map((ch, i) => (ch === " " ? " " : GLYPHS[(i * 7 + ch.charCodeAt(0) * 3) % GLYPHS.length]))
    .join("");
}

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** "mount" plays immediately, "inView" plays when the element scrolls into view. */
  trigger?: "mount" | "inView";
  delay?: number;
  duration?: number;
  /** Render scrambled glyphs before the animation starts (use for above the fold text). */
  startScrambled?: boolean;
  /** Skip the effect and show the final text. */
  instant?: boolean;
  onDone?: () => void;
};

export function DecryptText({
  text,
  as: Tag = "span",
  className,
  trigger = "mount",
  delay = 0,
  duration = 1200,
  startScrambled = false,
  instant = false,
  onDone,
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [display, setDisplay] = useState(() => (startScrambled ? staticScramble(text) : text));
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (reduced || instant) {
      onDoneRef.current?.();
      return;
    }

    let raf = 0;
    let observer: IntersectionObserver | undefined;

    const play = () => {
      let start: number | null = null;
      let lastSwap = 0;
      const step = (now: number) => {
        if (start === null) start = now + delay;
        const t = now - start;
        if (t >= 0) {
          const p = Math.min(1, t / duration);
          // Hold fully scrambled for the first moment, then reveal left to right.
          const revealed = Math.floor(Math.max(0, (p - 0.15) / 0.85) * text.length);
          if (now - lastSwap > 45 || p === 1) {
            lastSwap = now;
            setDisplay(
              text
                .split("")
                .map((ch, i) => (i < revealed || ch === " " ? ch : randomGlyph()))
                .join(""),
            );
          }
          if (p === 1) {
            onDoneRef.current?.();
            return;
          }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (trigger === "mount") {
      play();
    } else if (ref.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer?.disconnect();
            play();
          }
        },
        { threshold: 0.4 },
      );
      observer.observe(ref.current);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [text, trigger, delay, duration, reduced, instant]);

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{reduced || instant ? text : display}</span>
    </Tag>
  );
}
