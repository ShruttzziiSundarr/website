"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { site, type TerminalColor, type TerminalLine } from "@/content/site";
import { useReducedMotion } from "@/lib/hooks";

const COLOR: Record<TerminalColor, string> = {
  cyan: "text-cyan",
  violet: "text-violet",
  amber: "text-amber",
  pink: "text-pink",
};

const lineText = (line: TerminalLine) => line.segments.map((s) => s.text).join("");

function Segments({ line, count }: { line: TerminalLine; count: number }) {
  const starts = line.segments.map((_, i) =>
    line.segments.slice(0, i).reduce((n, s) => n + s.text.length, 0),
  );
  return (
    <>
      {line.segments.map((seg, i) => {
        const shown = seg.text.slice(0, Math.max(0, count - starts[i]));
        if (!shown) return null;
        const color = "color" in seg ? COLOR[seg.color as TerminalColor] : undefined;
        return (
          <span key={i} className={color}>
            {shown}
          </span>
        );
      })}
    </>
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Props = {
  /** Show everything at once (second visit to the gate). */
  instant?: boolean;
  onDone?: () => void;
};

export function Terminal({ instant = false, onDone }: Props) {
  const reduced = useReducedMotion();
  const lines = site.terminal;
  const skip = instant || reduced;

  const [typedLine, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [dots, setDots] = useState(0);
  const [typedGranted, setGranted] = useState(false);
  const lineIdx = skip ? lines.length : typedLine;
  const granted = skip || typedGranted;
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (skip) {
      onDoneRef.current?.();
      return;
    }
    let cancelled = false;
    (async () => {
      await sleep(400);
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        const line = lines[i];
        const text = lineText(line);
        setLineIdx(i);
        const speed = line.tone === "cmd" ? 28 : 12;
        for (let c = 1; c <= text.length; c++) {
          if (cancelled) return;
          setCharIdx(c);
          await sleep(speed);
        }
        if (line.tone === "wait") {
          for (let d = 1; d <= 6; d++) {
            if (cancelled) return;
            setDots(d % 4);
            await sleep(170);
          }
          setDots(3);
        }
        await sleep(line.tone === "cmd" ? 380 : 220);
      }
      if (cancelled) return;
      setLineIdx(lines.length);
      await sleep(250);
      setGranted(true);
      onDoneRef.current?.();
    })();
    return () => {
      cancelled = true;
    };
  }, [skip, lines]);

  return (
    <div className="glass w-full rounded-xl font-mono text-[13px] leading-6 shadow-[0_0_60px_-20px_rgba(110,231,249,0.35)]">
      <div className="flex items-center justify-between border-b border-cyan/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-muted">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-pink/70" />
          <span className="h-2 w-2 rounded-full bg-amber/70" />
          <span className="h-2 w-2 rounded-full bg-cyan/70" />
        </span>
        <span>handshake.log</span>
      </div>

      {/* Screen readers get the whole transcript at once instead of character by character. */}
      <p className="sr-only">
        {lines.map((l) => lineText(l) + (l.tone === "wait" ? " ..." : "")).join(". ")}.{" "}
        {site.accessGranted}
      </p>

      <div aria-hidden="true" className="min-h-[13.5rem] px-4 py-3">
        {lines.map((line, i) => {
          if (i > lineIdx) return null;
          const full = i < lineIdx;
          const count = full ? lineText(line).length : charIdx;
          const isCurrent = i === lineIdx;
          return (
            <div key={i} className={line.tone === "cmd" ? "text-ink" : "text-muted"}>
              <span className={line.tone === "cmd" ? "text-cyan" : "text-muted/50"}>
                {line.tone === "cmd" ? "$ " : "  "}
              </span>
              <Segments line={line} count={count} />
              {line.tone === "wait" && (full || count === lineText(line).length) && (
                <span>{" " + ".".repeat(full ? 3 : dots)}</span>
              )}
              {isCurrent && <span className="caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-cyan" />}
            </div>
          );
        })}

        {granted && (
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 1.15, letterSpacing: "0.6em" }}
            animate={{ opacity: 1, scale: 1, letterSpacing: "0.32em" }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-4 inline-block rounded border border-cyan/50 px-3 py-1 text-sm font-bold text-cyan [text-shadow:0_0_12px_rgba(110,231,249,0.8)]"
          >
            {site.accessGranted}
          </motion.div>
        )}
      </div>
    </div>
  );
}
