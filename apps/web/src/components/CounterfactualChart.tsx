import type { CounterfactualBandPoint } from "@world-abm/core";

type CounterfactualMetric = "inflation" | "output" | "unemployment" | "housing";

interface CounterfactualChartProps {
  readonly bands: readonly CounterfactualBandPoint[];
  readonly metric: CounterfactualMetric;
  readonly title: string;
  readonly caption: string;
  readonly unit: string;
  readonly variant?: "teal" | "amber";
}

export function CounterfactualChart({
  bands,
  metric,
  title,
  caption,
  unit,
  variant = "teal"
}: CounterfactualChartProps) {
  const width = 680;
  const height = 240;
  const padding = 28;
  const values = bands.slice(0, 36).map((point) => metricValues(point, metric));
  const allValues = values.flatMap((value) => [value.low, value.mean, value.high, 0]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const xStep = (width - padding * 2) / Math.max(1, values.length - 1);
  const y = (value: number) => height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
  const meanPoints = values.map((value, index) => `${padding + index * xStep},${y(value.mean)}`).join(" ");
  const upperPoints = values.map((value, index) => `${padding + index * xStep},${y(value.high)}`);
  const lowerPoints = values
    .map((value, index) => `${padding + index * xStep},${y(value.low)}`)
    .reverse();
  const bandPoints = [...upperPoints, ...lowerPoints].join(" ");

  return (
    <figure className="counterfactual-chart" data-variant={variant} aria-label={title}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <title>{title}</title>
        <line x1={padding} x2={width - padding} y1={y(0)} y2={y(0)} />
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <polygon points={bandPoints} />
        <polyline points={meanPoints} />
        {values.map((value, index) => (
          <circle key={`${index}-${value.mean.toFixed(4)}`} cx={padding + index * xStep} cy={y(value.mean)} r="2.5" />
        ))}
      </svg>
      <figcaption>
        {caption} Final mean: {values[values.length - 1]?.mean.toFixed(2)} {unit}.
      </figcaption>
    </figure>
  );
}

function metricValues(
  point: CounterfactualBandPoint,
  metric: CounterfactualMetric
): { mean: number; low: number; high: number } {
  if (metric === "output") {
    return {
      mean: point.outputDeltaIndexMean,
      low: point.outputDeltaIndexLow,
      high: point.outputDeltaIndexHigh
    };
  }
  if (metric === "unemployment") {
    return {
      mean: point.unemploymentDeltaPpMean,
      low: point.unemploymentDeltaPpLow,
      high: point.unemploymentDeltaPpHigh
    };
  }
  if (metric === "housing") {
    return {
      mean: point.housingPriceDeltaIndexMean,
      low: point.housingPriceDeltaIndexLow,
      high: point.housingPriceDeltaIndexHigh
    };
  }
  return {
    mean: point.inflationDeltaPpMean,
    low: point.inflationDeltaPpLow,
    high: point.inflationDeltaPpHigh
  };
}
