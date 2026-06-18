import type { SimulationPoint } from "@world-abm/core";

interface PathChartProps {
  readonly path: readonly SimulationPoint[];
}

export function PathChart({ path }: PathChartProps) {
  const width = 680;
  const height = 240;
  const padding = 26;
  const values = path.slice(0, 36).map((point) => point.inflationAnnualized * 100);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 4);
  const xStep = (width - padding * 2) / Math.max(1, values.length - 1);
  const y = (value: number) => height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
  const points = values.map((value, index) => `${padding + index * xStep},${y(value)}`).join(" ");

  return (
    <figure className="path-chart" aria-label="Annualized inflation path for the seeded scaffold run">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Annualized inflation path</title>
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <polyline points={points} />
        {values.map((value, index) => (
          <circle key={`${index}-${value.toFixed(4)}`} cx={padding + index * xStep} cy={y(value)} r="2.5" />
        ))}
      </svg>
      <figcaption>
        Inflation path from the deterministic Milestone 1 TypeScript core. This remains a stylized architecture run, not
        a calibrated Norway/EU result.
      </figcaption>
    </figure>
  );
}
