// A brush stroke drawing itself on a canvas while paint drops orbit the palette.
// Pass `artwork` (an image path) to show your own piece inside the frame instead.

export function AtelierIllustration({ artwork }: { artwork?: string }) {
  return (
    <svg viewBox="0 0 240 150" className="illo h-full w-full" style={{ color: "var(--violet)" }} aria-hidden="true">
      <defs>
        <clipPath id="atelier-canvas">
          <rect x={22} y={18} width={116} height={100} rx={4} />
        </clipPath>
      </defs>
      {/* Easel legs */}
      <path d="M50 118 L40 142 M110 118 L120 142 M80 118 L80 140" stroke="currentColor" strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" />
      <rect x={22} y={18} width={116} height={100} rx={4} fill="currentColor" fillOpacity={0.06} stroke="currentColor" strokeWidth={1.5} />

      {artwork ? (
        <image href={artwork} x={22} y={18} width={116} height={100} preserveAspectRatio="xMidYMid slice" clipPath="url(#atelier-canvas)" />
      ) : (
        <g clipPath="url(#atelier-canvas)">
          <path
            className="illo-draw"
            d="M34 92 C 50 40, 70 40, 78 70 S 104 104, 126 46"
            fill="none"
            style={{ stroke: "var(--pink)" }}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            className="illo-draw"
            d="M38 104 C 70 96, 96 110, 128 98"
            fill="none"
            strokeWidth={3.5}
            strokeLinecap="round"
            pathLength={100}
            style={{ stroke: "var(--cyan)", animationDelay: "0.8s" }}
          />
        </g>
      )}

      {/* Palette with drops in orbit around it */}
      <g transform="translate(190 76)">
        <path
          d="M-24 -6 C -24 -22, 18 -26, 24 -8 C 28 4, 14 4, 12 12 C 10 22, -24 18, -24 -6 Z"
          fill="currentColor"
          fillOpacity={0.12}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <circle cx={-12} cy={-8} r={3.5} style={{ fill: "var(--pink)" }} />
        <circle cx={0} cy={-12} r={3.5} style={{ fill: "var(--amber)" }} />
        <circle cx={11} cy={-7} r={3.5} style={{ fill: "var(--cyan)" }} />
        <g className="illo-spin">
          {/* Invisible ring keeps the group's box centered on the palette, so the spin stays round. */}
          <circle r={41} fill="none" />
          {[
            ["var(--pink)", 0],
            ["var(--amber)", 120],
            ["var(--cyan)", 240],
          ].map(([c, a]) => (
            <path
              key={a}
              d="M0 -40 C 4 -34, 5 -31, 0 -28 C -5 -31, -4 -34, 0 -40 Z"
              style={{ fill: c as string }}
              transform={`rotate(${a})`}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
