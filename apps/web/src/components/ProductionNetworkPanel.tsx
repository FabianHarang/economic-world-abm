import type { NetworkSummary, SectorSummary } from "@world-abm/core";

interface ProductionNetworkPanelProps {
  readonly sectors: readonly SectorSummary[];
  readonly network: NetworkSummary;
}

const stageLabels = ["Primary", "Materials", "Inputs", "Final goods", "Distribution", "Services"];

export function ProductionNetworkPanel({ sectors, network }: ProductionNetworkPanelProps) {
  const width = 760;
  const height = 300;
  const stageSummaries = stageLabels.map((label, stageId) => {
    const stageSectors = sectors.filter((sector) => sector.stageId === stageId);
    const firms = stageSectors.reduce((sum, sector) => sum + sector.firms, 0);
    const averageBacklog = weightedAverage(stageSectors, "backlogIndex");
    const averageFailure = weightedAverage(stageSectors, "deliveryFailureRate");
    const averageOutput = weightedAverage(stageSectors, "outputIndex");
    return {
      stageId,
      label,
      firms,
      averageBacklog,
      averageFailure,
      averageOutput
    };
  });
  const stressedSectors = [...sectors]
    .sort(
      (left, right) =>
        stressScore(right) - stressScore(left) || right.deliveryFailureRate - left.deliveryFailureRate
    )
    .slice(0, 6);

  return (
    <div className="network-panel" aria-label="Production network summary">
      <div className="network-visual">
        <svg viewBox={`0 0 ${width} ${height}`} role="img">
          <title>Aggregate supplier stages</title>
          {stageSummaries.slice(0, -1).map((stage, index) => {
            const nextStage = stageSummaries[index + 1];
            const x1 = stageX(index, width);
            const x2 = stageX(index + 1, width);
            const y1 = stageY(stage.averageBacklog, height);
            const y2 = stageY(nextStage.averageBacklog, height);
            return (
              <line
                key={`${stage.stageId}-${nextStage.stageId}`}
                className="stage-link"
                x1={x1}
                x2={x2}
                y1={y1}
                y2={y2}
                style={{
                  strokeOpacity: clamp(0.25 + network.deliveryFailureRate * 5, 0.25, 0.72),
                  strokeWidth: 2 + clamp(network.supplierRewireShare, 0, 0.35) * 32
                }}
              />
            );
          })}
          {stageSummaries.map((stage, index) => {
            const radius = clamp(18 + stage.averageFailure * 80 + stage.averageBacklog * 22, 18, 34);
            return (
              <g key={stage.stageId} transform={`translate(${stageX(index, width)} ${stageY(stage.averageBacklog, height)})`}>
                <circle className="stage-node-shadow" r={radius + 5} />
                <circle className="stage-node" r={radius} />
                <text className="stage-node-index" textAnchor="middle" dy="5">
                  {stage.stageId}
                </text>
                <text className="stage-node-label" textAnchor="middle" y={radius + 25}>
                  {stage.label}
                </text>
                <text className="stage-node-detail" textAnchor="middle" y={radius + 43}>
                  {stage.averageOutput.toFixed(0)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="network-stats">
        <div className="network-stat">
          <span>Delivery failures</span>
          <strong>{formatPercent(network.deliveryFailureRate)}</strong>
        </div>
        <div className="network-stat">
          <span>Rewired edges</span>
          <strong>{network.rewiredEdges.toLocaleString()}</strong>
        </div>
        <div className="network-stat">
          <span>Backlog index</span>
          <strong>{network.backlogIndex.toFixed(2)}</strong>
        </div>
      </div>

      <div className="sector-table" role="table" aria-label="Most stressed sectors">
        <div className="sector-row sector-row-head" role="row">
          <span role="columnheader">Sec.</span>
          <span role="columnheader">Stage</span>
          <span role="columnheader">Out.</span>
          <span role="columnheader">Backlog</span>
          <span role="columnheader">Fail.</span>
        </div>
        {stressedSectors.map((sector) => (
          <div className="sector-row" role="row" key={sector.sectorId}>
            <span role="cell">S{sector.sectorId.toString().padStart(2, "0")}</span>
            <span role="cell">{stageLabels[sector.stageId]}</span>
            <span role="cell">{sector.outputIndex.toFixed(0)}</span>
            <span role="cell">{sector.backlogIndex.toFixed(2)}</span>
            <span role="cell">{formatPercent(sector.deliveryFailureRate)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function weightedAverage(sectors: readonly SectorSummary[], field: keyof SectorSummary): number {
  const firms = sectors.reduce((sum, sector) => sum + sector.firms, 0);
  if (firms === 0) {
    return field === "outputIndex" ? 100 : 0;
  }
  return sectors.reduce((sum, sector) => sum + Number(sector[field]) * sector.firms, 0) / firms;
}

function stressScore(sector: SectorSummary): number {
  return sector.backlogIndex * 1.9 + sector.deliveryFailureRate * 3.2 + Math.max(0, sector.inputCostIndex - 1) * 0.9;
}

function stageX(index: number, width: number): number {
  return 64 + index * ((width - 128) / (stageLabels.length - 1));
}

function stageY(backlog: number, height: number): number {
  return height * 0.52 - clamp(backlog, 0, 0.8) * 120;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
