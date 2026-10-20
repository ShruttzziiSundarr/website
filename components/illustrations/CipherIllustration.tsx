// A padlock whose shackle opens and closes, binary digits falling behind it, a scan ring pulsing.

const COLUMNS = [
  { x: 18, d: 7, delay: 0 },
  { x: 44, d: 9, delay: -3 },
  { x: 70, d: 6, delay: -1.5 },
  { x: 170, d: 8, delay: -4 },
  { x: 196, d: 6.5, delay: -2 },
  { x: 222, d: 9.5, delay: -5 },
];
const DIGITS = "1011001110100101";

export function CipherIllustration() {
  return (
    <svg viewBox="0 0 240 150" className="illo h-full w-full" style={{ color: "var(--cyan)" }} aria-hidden="true">
      <defs>
        <clipPath id="cipher-frame">
          <rect width={240} height={150} />
        </clipPath>
      </defs>
      <g clipPath="url(#cipher-frame)" fontSize={10} fill="currentColor" fillOpacity={0.35} style={{ fontFamily: "var(--font-mono)" }}>
        {COLUMNS.map((c, i) => (
          <text key={i} x={c.x} y={0} className="illo-fall" style={{ animationDuration: `${c.d}s`, animationDelay: `${c.delay}s` }}>
            {DIGITS.split("").map((ch, k) => (
              <tspan key={k} x={c.x} dy={12}>
                {(i + k) % 3 === 0 ? (ch === "1" ? "0" : "1") : ch}
              </tspan>
            ))}
          </text>
        ))}
      </g>

      <circle cx={120} cy={80} r={42} fill="none" stroke="currentColor" strokeWidth={1.2} className="illo-ring" />

      <g transform="translate(120 84)">
        <g className="illo-shackle">
          <path d="M-13 -6 V -20 A 13 13 0 0 1 13 -20 V -6" fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
        </g>
        <rect x={-22} y={-8} width={44} height={36} rx={6} stroke="currentColor" strokeWidth={2} style={{ fill: "var(--night-2)" }} />
        <circle cx={0} cy={6} r={4.5} fill="currentColor" />
        <rect x={-1.8} y={7} width={3.6} height={10} rx={1.5} fill="currentColor" />
      </g>
    </svg>
  );
}
