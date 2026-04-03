"use client";

import type { Player } from "@/lib/party/types";

const CHART_COLORS = ["#c3f400", "#bb0058", "#006970", "#ff3d91"];

interface ScoreChartProps {
  players: Player[];
  scoreHistory: Record<string, number[]>;
}

export function ScoreChart({ players, scoreHistory }: ScoreChartProps) {
  const allScores = Object.values(scoreHistory).flat();
  if (allScores.length === 0) return null;

  const maxRounds = Math.max(
    ...Object.values(scoreHistory).map((h) => h.length),
  );
  if (maxRounds < 2) return null;

  const minScore = Math.min(0, ...allScores);
  const maxScore = Math.max(...allScores, 75);

  const width = 300;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 20, left: 30 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  function x(round: number) {
    return pad.left + (round / (maxRounds - 1)) * plotW;
  }

  function y(score: number) {
    return (
      pad.top + plotH - ((score - minScore) / (maxScore - minScore)) * plotH
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-xs"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 75-point line */}
      <line
        x1={pad.left}
        y1={y(75)}
        x2={width - pad.right}
        y2={y(75)}
        stroke="rgba(255,255,255,0.15)"
        strokeDasharray="4 2"
        strokeWidth={1}
      />
      <text x={pad.left - 4} y={y(75) + 3} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)">
        75
      </text>

      {/* Zero line */}
      {minScore < 0 && (
        <line
          x1={pad.left}
          y1={y(0)}
          x2={width - pad.right}
          y2={y(0)}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={0.5}
        />
      )}

      {/* Player lines */}
      {players.map((p, pi) => {
        const history = scoreHistory[p.id];
        if (!history || history.length < 2) return null;

        const points = history
          .map((s, ri) => `${x(ri)},${y(s)}`)
          .join(" ");

        return (
          <g key={p.id}>
            <polyline
              points={points}
              fill="none"
              stroke={CHART_COLORS[pi % CHART_COLORS.length]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {history.map((s, ri) => (
              <circle
                key={ri}
                cx={x(ri)}
                cy={y(s)}
                r={2.5}
                fill={CHART_COLORS[pi % CHART_COLORS.length]}
              />
            ))}
          </g>
        );
      })}

      {/* Round labels */}
      {Array.from({ length: maxRounds }).map((_, i) => (
        <text
          key={i}
          x={x(i)}
          y={height - 4}
          textAnchor="middle"
          fontSize={8}
          fill="rgba(255,255,255,0.3)"
        >
          {i + 1}
        </text>
      ))}
    </svg>
  );
}
