interface MetricTileProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export function MetricTile({ label, value, detail }: MetricTileProps) {
  return (
    <article className="metric-tile">
      <div className="metric-label">{label}</div>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

