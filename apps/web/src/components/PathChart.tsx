import type { SimulationPoint } from "@world-abm/core";

type PathMetric =
  | "inflationAnnualized"
  | "backlogIndex"
  | "deliveryFailureRate"
  | "inputInventoryIndex"
  | "supplyChainStress"
  | "housingPriceIndex"
  | "equityPriceIndex"
  | "constructionOutputIndex"
  | "mortgageDebtServiceRatio"
  | "bankCreditTightness";

interface PathChartProps {
  readonly path: readonly SimulationPoint[];
  readonly metric?: PathMetric;
  readonly title?: string;
  readonly caption?: string;
  readonly multiplier?: number;
  readonly floor?: number;
  readonly ceiling?: number;
  readonly variant?: "teal" | "amber";
}

export function PathChart({
  path,
  metric = "inflationAnnualized",
  title = "Annualized inflation path",
  caption = "Inflation path from the deterministic Milestone 10 browser companion. This remains a stylized architecture run, not a calibrated Norway/EU result.",
  multiplier = 100,
  floor = 0,
  ceiling = 4,
  variant = "teal"
}: PathChartProps) {
  const width = 680;
  const height = 240;
  const padding = 26;
  const values = path.slice(0, 36).map((point) => point[metric] * multiplier);
  const min = Math.min(...values, floor);
  const max = Math.max(...values, ceiling);
  const xStep = (width - padding * 2) / Math.max(1, values.length - 1);
  const y = (value: number) => height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
  const points = values.map((value, index) => `${padding + index * xStep},${y(value)}`).join(" ");

  return (
    <figure className="path-chart" data-variant={variant} aria-label={`${title} for the seeded scaffold run`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{title}</title>
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <polyline points={points} />
        {values.map((value, index) => (
          <circle key={`${index}-${value.toFixed(4)}`} cx={padding + index * xStep} cy={y(value)} r="2.5" />
        ))}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
