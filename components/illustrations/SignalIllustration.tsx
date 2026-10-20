// A radio tower sending out waves to a small bobbing crowd.

const CROWD = [30, 52, 74, 166, 188, 210];

export function SignalIllustration() {
  return (
    <svg viewBox="0 0 240 150" className="illo h-full w-full" style={{ color: "var(--pink)" }} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={120} cy={30} r={8} fill="none" stroke="currentColor" strokeWidth={1.5} className="illo-wave" style={{ animationDelay: `${i}s` }} />
      ))}

      {/* Lattice tower */}
      <g stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" fill="none">
        <path d="M120 32 L102 128 M120 32 L138 128" />
        <path d="M110 76 L130 76 M106 100 L134 100 M114 54 L126 54" strokeOpacity={0.7} />
        <path d="M110 76 L134 100 M130 76 L106 100 M114 54 L130 76 M126 54 L110 76" strokeOpacity={0.4} />
      </g>
      <circle cx={120} cy={30} r={4} fill="currentColor" className="illo-glow" />

      {CROWD.map((x, i) => (
        <g key={x} className="illo-bob" style={{ animationDelay: `${(i % 3) * 0.35}s` }}>
          <circle cx={x} cy={118} r={5} fill="currentColor" fillOpacity={0.85} />
          <path d={`M${x - 8} 140 C ${x - 8} 128, ${x + 8} 128, ${x + 8} 140 Z`} fill="currentColor" fillOpacity={0.45} />
        </g>
      ))}
    </svg>
  );
}
