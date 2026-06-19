import { useMemo, useState } from "react";
import type { SimulationPoint, SimulationResult } from "@world-abm/core";

interface LaborMarketExplorerProps {
  readonly result: SimulationResult;
}

interface FlowNode {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly value: string;
}

interface FlowLink {
  readonly source: string;
  readonly target: string;
  readonly label: string;
  readonly intensity: number;
}

const laborWidth = 920;
const laborHeight = 430;

export function LaborMarketExplorer({ result }: LaborMarketExplorerProps) {
  const [period, setPeriod] = useState(result.path.length - 1);
  const point = result.path[period] ?? result.path[result.path.length - 1];
  const previousPoint = result.path[Math.max(0, period - 1)] ?? point;
  const nodes = useMemo(() => buildFlowNodes(point), [point]);
  const links = useMemo(() => buildFlowLinks(point, previousPoint), [point, previousPoint]);

  return (
    <div className="labor-explorer" aria-label="Labor-market explorer">
      <div className="labor-toolbar">
        <label>
          <span>Period</span>
          <input
            type="range"
            min={0}
            max={result.path.length - 1}
            step={1}
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value))}
          />
          <strong>{period + 1}</strong>
        </label>
      </div>

      <div className="labor-grid">
        <div className="labor-canvas">
          <svg viewBox={`0 0 ${laborWidth} ${laborHeight}`} role="img" aria-label="Employer-worker labor-flow graph">
            <title>Employer-worker labor-flow graph</title>
            <defs>
              <marker id="labor-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
                <path d="M0,0 L7,3.5 L0,7 Z" />
              </marker>
            </defs>
            <rect className="labor-bg" width={laborWidth} height={laborHeight} />
            {links.map((link, index) => {
              const source = nodes.find((node) => node.id === link.source);
              const target = nodes.find((node) => node.id === link.target);
              if (!source || !target) {
                return null;
              }
              const d = flowPath(source, target, index);
              return (
                <g key={`${link.source}-${link.target}`}>
                  <path
                    className="labor-link"
                    d={d}
                    markerEnd="url(#labor-arrow)"
                    style={{
                      strokeOpacity: 0.32 + link.intensity * 0.55,
                      strokeWidth: 2 + link.intensity * 8
                    }}
                  />
                  <text className="labor-link-label">
                    <textPath href={`#labor-link-${index}`} startOffset="50%" textAnchor="middle">
                      {link.label}
                    </textPath>
                  </text>
                  <path id={`labor-link-${index}`} d={d} fill="none" stroke="transparent" />
                </g>
              );
            })}
            {nodes.map((node) => (
              <g key={node.id} className="labor-node" transform={`translate(${node.x} ${node.y})`}>
                <circle r="52" />
                <text className="labor-node-label" textAnchor="middle" y="-7">
                  {node.label}
                </text>
                <text className="labor-node-value" textAnchor="middle" y="17">
                  {node.value}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <aside className="labor-inspector">
          <span>Labor state</span>
          <strong>{formatPercent(point.unemploymentRate)} unemployment</strong>
          <dl>
            <div>
              <dt>Employed households</dt>
              <dd>{point.employedHouseholds.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Vacancy rate</dt>
              <dd>{formatPercent(point.vacancyRate)}</dd>
            </div>
            <div>
              <dt>Layoff rate</dt>
              <dd>{formatPercent(point.layoffRate)}</dd>
            </div>
            <div>
              <dt>Hires</dt>
              <dd>{point.hires.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Layoffs</dt>
              <dd>{point.layoffs.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Wage growth</dt>
              <dd>{formatPercent(point.wageGrowthAnnualized)}</dd>
            </div>
          </dl>
          <div className="labor-sparkline" aria-label="Unemployment path">
            <svg viewBox="0 0 220 70" role="img">
              <title>Unemployment path</title>
              <polyline points={sparklinePoints(result.path, "unemploymentRate", 220, 70)} />
              <circle cx={(period / Math.max(1, result.path.length - 1)) * 220} cy={sparklineY(result.path, point, 70)} r="4" />
            </svg>
          </div>
        </aside>
      </div>
    </div>
  );
}

function buildFlowNodes(point: SimulationPoint): FlowNode[] {
  return [
    { id: "households", label: "Households", x: 118, y: 214, value: formatIndex(point.consumptionIndex) },
    { id: "firms", label: "Firms", x: 318, y: 116, value: formatIndex(point.outputIndex) },
    { id: "vacancies", label: "Vacancies", x: 554, y: 102, value: formatPercent(point.vacancyRate) },
    { id: "layoffs", label: "Layoffs", x: 554, y: 288, value: formatPercent(point.layoffRate) },
    { id: "unemployment", label: "Unemployed", x: 786, y: 214, value: formatPercent(point.unemploymentRate) }
  ];
}

function buildFlowLinks(point: SimulationPoint, previousPoint: SimulationPoint): FlowLink[] {
  const unemploymentMove = Math.max(0, point.unemploymentRate - previousPoint.unemploymentRate);
  const consumptionPressure = Math.max(0, 1 - point.consumptionIndex);
  return [
    {
      source: "households",
      target: "firms",
      label: "demand",
      intensity: clamp(consumptionPressure * 4, 0.08, 1)
    },
    {
      source: "firms",
      target: "vacancies",
      label: "hiring",
      intensity: clamp(point.vacancyRate * 12, 0.08, 1)
    },
    {
      source: "firms",
      target: "layoffs",
      label: "layoffs",
      intensity: clamp(point.layoffRate * 18, 0.08, 1)
    },
    {
      source: "layoffs",
      target: "unemployment",
      label: "job loss",
      intensity: clamp(point.layoffRate * 20 + unemploymentMove * 10, 0.08, 1)
    },
    {
      source: "unemployment",
      target: "households",
      label: "income loss",
      intensity: clamp(point.unemploymentRate * 8, 0.08, 1)
    }
  ];
}

function flowPath(source: FlowNode, target: FlowNode, index: number): string {
  const dx = target.x - source.x;
  const bend = (index - 2) * 14;
  return `M ${source.x} ${source.y} C ${source.x + dx * 0.35} ${source.y + bend}, ${source.x + dx * 0.65} ${
    target.y - bend
  }, ${target.x} ${target.y}`;
}

function sparklinePoints(path: readonly SimulationPoint[], metric: "unemploymentRate", width: number, height: number): string {
  const values = path.map((point) => point[metric]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / Math.max(0.0001, max - min)) * (height - 10) - 5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function sparklineY(path: readonly SimulationPoint[], point: SimulationPoint, height: number): number {
  const values = path.map((entry) => entry.unemploymentRate);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return height - ((point.unemploymentRate - min) / Math.max(0.0001, max - min)) * (height - 10) - 5;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatIndex(value: number): string {
  return value.toFixed(1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
