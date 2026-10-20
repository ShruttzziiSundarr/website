// Containers drop into a stack under a drifting cloud while packets travel along a wire.

const CONTAINERS = [
  { y: 100, color: "var(--amber)", delay: 0 },
  { y: 82, color: "var(--cyan)", delay: 1.1 },
  { y: 64, color: "var(--violet)", delay: 2.2 },
];

export function HarborIllustration() {
  return (
    <svg viewBox="0 0 240 150" className="illo h-full w-full" style={{ color: "var(--amber)" }} aria-hidden="true">
      <g className="illo-drift">
        <path
          d="M70 40 C 60 40, 58 26, 70 24 C 72 12, 92 10, 98 20 C 106 12, 124 16, 122 28 C 134 28, 134 40, 124 40 Z"
          fill="currentColor"
          fillOpacity={0.12}
          stroke="currentColor"
          strokeWidth={1.4}
        />
      </g>

      {/* Dock */}
      <line x1={60} y1={118} x2={180} y2={118} stroke="currentColor" strokeOpacity={0.5} strokeWidth={2} />

      {CONTAINERS.map((c, i) => (
        <g key={i} className="illo-drop" style={{ animationDelay: `${c.delay}s` }}>
          <rect x={92} y={c.y} width={56} height={17} rx={2} fillOpacity={0.25} strokeWidth={1.5} style={{ fill: c.color, stroke: c.color }} />
          {[0, 1, 2, 3, 4].map((k) => (
            <line key={k} x1={100 + k * 10} y1={c.y + 3} x2={100 + k * 10} y2={c.y + 14} strokeOpacity={0.6} style={{ stroke: c.color }} />
          ))}
        </g>
      ))}

      {/* Network wire with packets moving along it */}
      <line x1={0} y1={136} x2={240} y2={136} strokeOpacity={0.35} strokeWidth={1.4} style={{ stroke: "var(--cyan)" }} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={-10}
          y={132}
          width={10}
          height={8}
          rx={2}
          className="illo-packet"
          style={{ fill: "var(--cyan)", animationDelay: `${i * 1.1}s`, transform: `translateX(${60 + i * 60}px)` }}
        />
      ))}
    </svg>
  );
}
