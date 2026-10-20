// A small network: signals flow along the edges and each layer lights up after the one before.

const LAYERS = [3, 4, 4, 2];
const X = [34, 92, 150, 206];

function nodeY(count: number, i: number) {
  const gap = 28;
  return 75 + (i - (count - 1) / 2) * gap;
}

export function NeuralIllustration() {
  const edges: { x1: number; y1: number; x2: number; y2: number; layer: number }[] = [];
  LAYERS.forEach((count, l) => {
    if (l === LAYERS.length - 1) return;
    for (let a = 0; a < count; a++) {
      for (let b = 0; b < LAYERS[l + 1]; b++) {
        edges.push({ x1: X[l], y1: nodeY(count, a), x2: X[l + 1], y2: nodeY(LAYERS[l + 1], b), layer: l });
      }
    }
  });

  return (
    <svg viewBox="0 0 240 150" className="illo h-full w-full" style={{ color: "var(--violet)" }} aria-hidden="true">
      {edges.map((e, i) => (
        <g key={i}>
          <line {...e} stroke="currentColor" strokeOpacity={0.18} strokeWidth={1} />
          <line
            {...e}
            strokeWidth={1.4}
            strokeLinecap="round"
            className="illo-flow"
            style={{ stroke: "var(--cyan)", animationDelay: `${e.layer * 0.45 + (i % 4) * 0.1}s` }}
          />
        </g>
      ))}
      {LAYERS.map((count, l) =>
        Array.from({ length: count }, (_, i) => (
          <circle
            key={`${l}-${i}`}
            cx={X[l]}
            cy={nodeY(count, i)}
            r={8}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={1.4}
            className="illo-node"
            style={{ animationDelay: `${l * 0.45}s` }}
          />
        )),
      )}
    </svg>
  );
}
