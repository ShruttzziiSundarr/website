"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/hooks";

// A binary search tree walked in order (which reads its values out sorted),
// next to bars that bubble sort themselves, then shuffle and start again.

const NODES: [number, number, number][] = [
  [62, 24, 8], [34, 62, 4], [90, 62, 12], [20, 102, 2], [48, 102, 6], [76, 102, 10], [104, 102, 14],
];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
const IN_ORDER = [3, 1, 4, 0, 5, 2, 6];
const BAR_VALUES = [5, 2, 7, 1, 6, 3, 4];

type Sort = { arr: number[]; i: number; j: number; done: boolean; compare: number };

function sortStep(s: Sort): Sort {
  if (s.done) return { ...s, arr: [...s.arr].sort(() => Math.random() - 0.5), i: 0, j: 0, done: false, compare: -1 };
  const arr = [...s.arr];
  if (arr[s.j] > arr[s.j + 1]) [arr[s.j], arr[s.j + 1]] = [arr[s.j + 1], arr[s.j]];
  let { i, j } = s;
  j++;
  if (j >= arr.length - 1 - i) {
    j = 0;
    i++;
  }
  return { arr, i, j, done: i >= arr.length - 1, compare: s.j };
}

export function LogicIllustration() {
  const reduced = useReducedMotion();
  const [visit, setVisit] = useState(IN_ORDER.length);
  const [sort, setSort] = useState<Sort>({ arr: [...BAR_VALUES].sort((a, b) => a - b), i: 0, j: 0, done: true, compare: -1 });

  useEffect(() => {
    if (reduced) return;
    const walk = setInterval(() => setVisit((v) => (v >= IN_ORDER.length + 2 ? 0 : v + 1)), 650);
    const bars = setInterval(() => setSort((s) => sortStep(s)), 420);
    return () => {
      clearInterval(walk);
      clearInterval(bars);
    };
  }, [reduced]);

  const shown = reduced ? IN_ORDER.length : visit;
  const visited = new Set(IN_ORDER.slice(0, shown));
  const current = IN_ORDER[shown - 1];
  const arr = reduced ? [...BAR_VALUES].sort((a, b) => a - b) : sort.arr;

  return (
    <svg viewBox="0 0 240 150" className="illo h-full w-full" style={{ color: "var(--cyan)" }} aria-hidden="true">
      {EDGES.map(([a, b]) => (
        <line
          key={`${a}${b}`}
          x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]}
          stroke="currentColor"
          strokeOpacity={visited.has(a) && visited.has(b) ? 0.8 : 0.25}
          strokeWidth={1.5}
          style={{ transition: "stroke-opacity 0.3s" }}
        />
      ))}
      {NODES.map(([x, y, value], i) => (
        <g key={i}>
          <circle
            cx={x} cy={y} r={9}
            fill="currentColor"
            fillOpacity={i === current ? 0.9 : visited.has(i) ? 0.3 : 0.06}
            stroke="currentColor"
            strokeWidth={1.4}
            className={i === current ? "illo-glow" : undefined}
            style={{ transition: "fill-opacity 0.3s" }}
          />
          <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} style={{ fontFamily: "var(--font-mono)", fill: i === current ? "var(--night)" : "currentColor" }}>
            {value}
          </text>
        </g>
      ))}
      {/* The in order walk writes the values out sorted. */}
      <text x={62} y={136} textAnchor="middle" fontSize={9} style={{ fontFamily: "var(--font-mono)", fill: "var(--muted)" }}>
        {IN_ORDER.slice(0, shown).map((n) => NODES[n][2]).join(" ") || "in order"}
      </text>

      <line x1={140} y1={124} x2={232} y2={124} stroke="currentColor" strokeOpacity={0.3} />
      {arr.map((v, idx) => {
        const comparing = !reduced && !sort.done && (idx === sort.compare || idx === sort.compare + 1);
        return (
          <rect
            key={v}
            x={142}
            y={124 - v * 13}
            width={10}
            height={v * 13}
            rx={2}
            fillOpacity={comparing ? 0.9 : 0.55}
            style={{
              fill: comparing ? "var(--amber)" : "currentColor",
              transform: `translateX(${idx * 13}px)`,
              transition: "transform 0.35s ease, fill 0.2s",
            }}
          />
        );
      })}
    </svg>
  );
}
