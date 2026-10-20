import type { CSSProperties } from "react";

// Animated plant illustrations in SVG. Motion lives in globals.css (".botanical" rules) so these
// stay server components with zero JavaScript. To swap in a Rive or Lottie file later, render it
// in place of the <svg> and keep the wrapper so placement and sizing stay the same.

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function Flower({ x, y, r, color, delay, petals = 5 }: { x: number; y: number; r: number; color: string; delay: number; petals?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="bud neon" style={{ "--delay": `${delay}s`, color } as Vars}>
        {Array.from({ length: petals }, (_, i) => (
          <ellipse
            key={i}
            cx={0}
            cy={-r * 0.62}
            rx={r * 0.38}
            ry={r * 0.62}
            transform={`rotate(${(360 / petals) * i})`}
            fill="currentColor"
            style={{ fillOpacity: "var(--petal-fill)" }}
            stroke="currentColor"
            strokeWidth={1.4}
          />
        ))}
        <circle r={r * 0.24} style={{ fill: "var(--amber)" }} />
      </g>
    </g>
  );
}

function Tulip({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="bud neon" style={{ "--delay": `${delay}s`, color } as Vars}>
        <path
          d="M0 10 C -9 6, -10 -6, -7 -13 L -3.5 -6 L 0 -14 L 3.5 -6 L 7 -13 C 10 -6, 9 6, 0 10 Z"
          fill="currentColor"
          style={{ fillOpacity: "var(--petal-fill)" }}
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

function Leaf({ x, y, rot, size = 1, delay }: { x: number; y: number; rot: number; size?: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${size})`}>
      <g className="leaf neon" style={{ "--delay": `${delay}s`, color: "var(--leaf)" } as Vars}>
        <path d="M0 0 C 8 -9, 22 -9, 30 0 C 22 9, 8 9, 0 0 Z" fill="currentColor" style={{ fillOpacity: "var(--leaf-fill)" }} stroke="currentColor" strokeWidth={1.2} />
        <path d="M2 0 L 26 0" stroke="currentColor" strokeWidth={0.8} strokeOpacity={0.7} />
      </g>
    </g>
  );
}

function Stem({ d, delay, width = 2 }: { d: string; delay: number; width?: number }) {
  return (
    <path
      className="stem neon"
      d={d}
      pathLength={100}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      style={{ "--len": 100, "--delay": `${delay}s`, color: "var(--leaf)" } as Vars}
    />
  );
}

/** A cluster of flowers growing up from a corner. */
export function FlowerVine({ className }: { className?: string }) {
  return (
    <div className={`botanical pointer-events-none ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 240 340" className="h-full w-full overflow-visible">
        <g className="sway" style={{ transformOrigin: "20% 100%" }}>
          <Stem d="M40 340 C 50 270, 20 220, 60 160 S 110 70, 95 30" delay={0.2} />
          <Stem d="M60 340 C 80 290, 120 270, 125 210 S 160 140, 185 120" delay={0.45} />
          <Stem d="M30 340 C 25 300, 0 280, 12 240" delay={0.7} width={1.6} />
          <Stem d="M75 340 C 95 320, 150 320, 170 280" delay={0.9} width={1.6} />

          <Leaf x={50} y={252} rot={-150} delay={1.3} />
          <Leaf x={62} y={185} rot={-20} delay={1.5} />
          <Leaf x={110} y={243} rot={-40} size={0.9} delay={1.7} />
          <Leaf x={140} y={178} rot={-160} size={0.85} delay={1.9} />
          <Leaf x={20} y={286} rot={-120} size={0.8} delay={2.0} />
          <Leaf x={122} y={322} rot={-15} size={0.75} delay={2.1} />
          <Leaf x={84} y={100} rot={-170} size={0.7} delay={2.2} />

          <Flower x={95} y={30} r={20} color="var(--pink)" delay={2.4} />
          <Flower x={185} y={120} r={17} color="var(--violet)" delay={2.65} petals={6} />
          <Flower x={170} y={280} r={11} color="var(--amber)" delay={2.9} />
          <Tulip x={12} y={238} color="var(--cyan)" delay={3.1} />
        </g>

        {/* A few petals let go and drift down. */}
        {[
          { x: 95, y: 40, dx: "-40px", delay: 5, c: "var(--pink)" },
          { x: 185, y: 130, dx: "30px", delay: 8.5, c: "var(--violet)" },
          { x: 100, y: 45, dx: "20px", delay: 12, c: "var(--pink)" },
        ].map((p, i) => (
          <ellipse
            key={i}
            className="petal-fall"
            cx={p.x}
            cy={p.y}
            rx={3}
            ry={5}
            fill="currentColor"
            fillOpacity={0.8}
            style={{ "--dx": p.dx, "--delay": `${p.delay}s`, color: p.c, opacity: 0, transformBox: "fill-box" } as Vars}
          />
        ))}
      </svg>
    </div>
  );
}

/** A small sprig that hangs over the corner of a panel. */
export function CornerSprig({ className }: { className?: string }) {
  return (
    <div className={`botanical pointer-events-none ${className ?? ""}`} aria-hidden="true">
      <svg viewBox="0 0 160 120" className="h-full w-full overflow-visible">
        <g className="sway" style={{ transformOrigin: "95% 0%", animationDuration: "9s" }}>
          <Stem d="M152 2 C 124 18, 134 48, 104 60 S 52 68, 30 100" delay={3.2} width={1.6} />
          <Stem d="M118 40 C 112 58, 126 72, 120 92" delay={3.6} width={1.3} />
          <Leaf x={132} y={30} rot={150} size={0.6} delay={4.2} />
          <Leaf x={80} y={66} rot={-170} size={0.65} delay={4.4} />
          <Leaf x={54} y={82} rot={20} size={0.55} delay={4.6} />
          <Leaf x={120} y={70} rot={70} size={0.5} delay={4.7} />
          <Flower x={104} y={60} r={9} color="var(--amber)" delay={4.9} />
          <Flower x={30} y={100} r={11} color="var(--pink)" delay={5.1} />
          <Flower x={120} y={94} r={7} color="var(--violet)" delay={5.3} petals={6} />
        </g>
      </svg>
    </div>
  );
}
