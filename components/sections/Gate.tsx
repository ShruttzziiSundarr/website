"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { DecryptText } from "@/components/ui/DecryptText";
import { Terminal } from "@/components/ui/Terminal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { CornerSprig, FlowerVine } from "@/components/illustrations/Botanicals";
import { lookUp, startTour } from "@/lib/store";

type Props = {
  /** True when returning to the gate: skip the intro effects. */
  instant: boolean;
  onEnter: () => void;
};

export function Gate({ instant, onEnter }: Props) {
  const [granted, setGranted] = useState(instant);

  return (
    <motion.section
      aria-label="Introduction"
      className="relative z-10 flex min-h-dvh items-center px-4 pb-24 pt-20 sm:px-8 lg:px-16"
      initial={instant ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Shade behind the copy so it reads over the skyline: dark at night, a light haze by day. */}
      <div aria-hidden="true" className="gate-scrim pointer-events-none absolute inset-0" />

      {/* Mirrored into the bottom right so it frames the scene without crowding the copy. */}
      <FlowerVine className="absolute bottom-0 right-0 hidden h-[34vh] max-h-[320px] w-[24vh] max-w-[230px] -scale-x-100 sm:block" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan/80">
            night city / identity gate
          </p>

          <DecryptText
            as="h1"
            text={site.name}
            startScrambled
            instant={instant}
            duration={1600}
            delay={250}
            className="block whitespace-nowrap font-mono text-[clamp(2.2rem,11vw,3.4rem)] sm:text-[clamp(3rem,6.4vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-ink [text-shadow:0_0_40px_rgba(110,231,249,0.25)]"
          />

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">{site.tagline}</p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <MagneticButton
              onClick={onEnter}
              className={`group relative rounded-full border px-7 py-3.5 font-mono text-sm uppercase tracking-[0.2em] transition-[border-color,background-color,box-shadow] duration-500 ${
                granted
                  ? "border-cyan bg-cyan/10 text-cyan shadow-[0_0_30px_-4px_rgba(110,231,249,0.6)] hover:bg-cyan/20"
                  : "border-cyan/40 text-ink hover:border-cyan"
              }`}
            >
              {site.enterLabel}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-y-0.5">
                ↓
              </span>
            </MagneticButton>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted/70" aria-hidden="true">
              <span className="pointer-coarse:hidden">{site.enterHint}</span>
              <span className="hidden pointer-coarse:inline">{site.enterHintTouch}</span>
            </span>
          </div>

          <div className="mt-6 flex flex-col items-start gap-3">
            <button
              type="button"
              onClick={startTour}
              className="font-mono text-xs uppercase tracking-[0.2em] text-cyan underline decoration-cyan/40 underline-offset-4 transition-colors hover:text-ink"
            >
              {site.tour.gateLabel} <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={lookUp}
              className="font-mono text-xs uppercase tracking-[0.2em] text-muted underline decoration-cyan/30 underline-offset-4 transition-colors hover:text-ink"
            >
              {site.lookUpLabel} <span aria-hidden="true">↑</span>
            </button>
          </div>
        </div>

        <div className="relative w-full max-w-md justify-self-center lg:justify-self-end">
          <CornerSprig className="absolute -right-5 -top-10 z-10 hidden h-24 w-32 sm:block" />
          <Terminal instant={instant} onDone={() => setGranted(true)} />
        </div>
      </div>

      <div aria-hidden="true" className="absolute bottom-6 left-1/2 hidden h-10 w-px -translate-x-1/2 overflow-hidden bg-cyan/10 sm:block">
        <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-cyan" />
      </div>
    </motion.section>
  );
}
