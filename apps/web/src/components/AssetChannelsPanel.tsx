import type { SimulationResult } from "@world-abm/core";

interface AssetChannelsPanelProps {
  readonly result: SimulationResult;
}

const channelLabels = ["Policy", "Mortgages", "Housing", "Construction", "Equity", "Banks"];

export function AssetChannelsPanel({ result }: AssetChannelsPanelProps) {
  const finalPoint = result.path[result.path.length - 1];
  const width = 760;
  const height = 260;
  const indicators = [
    {
      label: "Mortgage rate",
      value: formatPercent(result.assets.mortgageRateAnnual),
      detail: `${formatPercent(result.assets.variableMortgageShare)} variable exposure`
    },
    {
      label: "Housing index",
      value: result.assets.housingPriceIndex.toFixed(2),
      detail: `${formatPercent(finalPoint.housingPriceGrowthAnnualized)} annualized`
    },
    {
      label: "Equity index",
      value: result.assets.equityPriceIndex.toFixed(2),
      detail: `${formatPercent(finalPoint.equityReturnAnnualized)} annualized`
    },
    {
      label: "Net worth",
      value: result.assets.householdNetWorthIndex.toFixed(2),
      detail: `risky share ${formatPercent(result.assets.riskyAssetShare)}`
    }
  ];

  return (
    <div className="asset-panel" aria-label="Milestone 4 asset and credit channels">
      <div className="asset-visual">
        <svg viewBox={`0 0 ${width} ${height}`} role="img">
          <title>Credit, housing, construction, and equity channels</title>
          {channelLabels.slice(0, -1).map((label, index) => (
            <line
              key={`${label}-${channelLabels[index + 1]}`}
              className="asset-link"
              x1={channelX(index, width)}
              x2={channelX(index + 1, width)}
              y1={channelY(index, finalPoint)}
              y2={channelY(index + 1, finalPoint)}
            />
          ))}
          {channelLabels.map((label, index) => (
            <g key={label} transform={`translate(${channelX(index, width)} ${channelY(index, finalPoint)})`}>
              <circle className="asset-node-shadow" r="31" />
              <circle className="asset-node" r={assetRadius(index, finalPoint)} />
              <text className="asset-node-index" textAnchor="middle" dy="5">
                {index + 1}
              </text>
              <text className="asset-node-label" textAnchor="middle" y="51">
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="asset-stats">
        {indicators.map((indicator) => (
          <article className="asset-stat" key={indicator.label}>
            <span>{indicator.label}</span>
            <strong>{indicator.value}</strong>
            <small>{indicator.detail}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function channelX(index: number, width: number): number {
  return 58 + index * ((width - 116) / (channelLabels.length - 1));
}

function channelY(index: number, point: SimulationResult["path"][number]): number {
  const drivers = [
    point.policyRateAnnual * 8,
    point.mortgageDebtServiceRatio * 6,
    Math.abs(point.housingPriceIndex - 1) * 1.8,
    Math.abs(point.constructionOutputIndex - 100) / 120,
    Math.abs(point.equityPriceIndex - 1) * 1.4,
    point.bankCreditTightness * 2.5
  ];
  return 128 - clamp(drivers[index], 0, 0.9) * 72;
}

function assetRadius(index: number, point: SimulationResult["path"][number]): number {
  const values = [
    point.policyRateAnnual * 120,
    point.mortgageDebtServiceRatio * 90,
    Math.abs(point.housingPriceIndex - 1) * 45,
    Math.abs(point.constructionOutputIndex - 100) / 4,
    Math.abs(point.equityPriceIndex - 1) * 40,
    point.bankCreditTightness * 52
  ];
  return clamp(20 + values[index], 20, 34);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
