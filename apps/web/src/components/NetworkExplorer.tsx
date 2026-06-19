import { useEffect, useMemo, useRef, useState } from "react";
import type { NetworkSummary, SectorSummary } from "@world-abm/core";

interface NetworkExplorerProps {
  readonly sectors: readonly SectorSummary[];
  readonly network: NetworkSummary;
}

interface ExplorerNode {
  readonly id: number;
  readonly label: string;
  readonly stageId: number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly stress: number;
  readonly outputIndex: number;
  readonly firms: number;
}

interface ExplorerLink {
  readonly id: string;
  readonly source: number;
  readonly target: number;
  readonly weight: number;
  readonly stress: number;
  readonly rewired: boolean;
}

interface ViewTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

const width = 900;
const height = 520;
const stageLabels = ["Primary", "Materials", "Inputs", "Final goods", "Distribution", "Services"];

export function NetworkExplorer({ sectors, network }: NetworkExplorerProps) {
  const nodes = useMemo(() => buildNodes(sectors), [sectors]);
  const initialLinks = useMemo(() => buildLinks(nodes, network), [nodes, network]);
  const [links, setLinks] = useState<ExplorerLink[]>(initialLinks);
  const [selectedNodeId, setSelectedNodeId] = useState(nodes[0]?.id ?? 0);
  const [selectedLinkId, setSelectedLinkId] = useState(initialLinks[0]?.id ?? "");
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ pointerId: number; x: number; y: number; origin: ViewTransform } | null>(null);

  useEffect(() => {
    setLinks(initialLinks);
    setSelectedNodeId(nodes[0]?.id ?? 0);
    setSelectedLinkId(initialLinks[0]?.id ?? "");
  }, [initialLinks, nodes]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];
  const selectedLink = links.find((link) => link.id === selectedLinkId) ?? links[0];
  const downstreamCount = links.filter((link) => link.source === selectedNode?.id).length;
  const upstreamCount = links.filter((link) => link.target === selectedNode?.id).length;
  const systemicScore =
    (selectedNode?.stress ?? 0) * 0.55 +
    ((selectedNode?.firms ?? 0) / Math.max(1, maxFirms(nodes))) * 0.25 +
    (upstreamCount + downstreamCount) * 0.025;

  function zoom(delta: number) {
    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, 0.65, 2.8)
    }));
  }

  function resetView() {
    setView({ x: 0, y: 0, scale: 1 });
  }

  function resetLinks() {
    setLinks(initialLinks);
    setSelectedLinkId(initialLinks[0]?.id ?? "");
  }

  function rewireSelectedLink() {
    if (!selectedLink) {
      return;
    }
    const currentTarget = selectedLink.target;
    const candidate = nodes
      .filter((node) => node.id !== selectedLink.source && node.id !== currentTarget)
      .sort((left, right) => left.stress - right.stress || right.outputIndex - left.outputIndex)[0];
    if (!candidate) {
      return;
    }
    setLinks((current) =>
      current.map((link) =>
        link.id === selectedLink.id
          ? {
              ...link,
              target: candidate.id,
              rewired: true,
              stress: clamp((link.stress + candidate.stress) / 2, 0, 1)
            }
          : link
      )
    );
  }

  return (
    <div className="network-explorer" aria-label="Interactive production network explorer">
      <div className="network-explorer-toolbar" aria-label="Network explorer controls">
        <button type="button" onClick={() => zoom(0.18)} aria-label="Zoom in" title="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoom(-0.18)} aria-label="Zoom out" title="Zoom out">
          -
        </button>
        <button type="button" onClick={resetView} aria-label="Reset view" title="Reset view">
          Reset
        </button>
        <button type="button" onClick={rewireSelectedLink} aria-label="Rewire selected link" title="Rewire selected link">
          Rewire
        </button>
        <button type="button" onClick={resetLinks} aria-label="Restore original links" title="Restore original links">
          Restore
        </button>
      </div>

      <div className="network-explorer-grid">
        <div className="network-explorer-canvas">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            onWheel={(event) => {
              event.preventDefault();
              zoom(event.deltaY < 0 ? 0.12 : -0.12);
            }}
            onPointerDown={(event) => {
              const target = event.target as SVGElement;
              if (event.currentTarget === event.target || target.classList.contains("network-explorer-bg")) {
                dragRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                  origin: view
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) {
                return;
              }
              setView({
                ...drag.origin,
                x: drag.origin.x + (event.clientX - drag.x) / view.scale,
                y: drag.origin.y + (event.clientY - drag.y) / view.scale
              });
            }}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) {
                dragRef.current = null;
              }
            }}
          >
            <title>Zoomable supplier-buyer sector network</title>
            <rect className="network-explorer-bg" width={width} height={height} />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
              {links.map((link) => {
                const source = nodes.find((node) => node.id === link.source);
                const target = nodes.find((node) => node.id === link.target);
                if (!source || !target) {
                  return null;
                }
                const selected = link.id === selectedLink?.id;
                return (
                  <g key={link.id}>
                    <line
                      className={`explorer-link-hit${selected ? " selected" : ""}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      onClick={() => {
                        setSelectedLinkId(link.id);
                        setSelectedNodeId(source.id);
                      }}
                    />
                    <line
                      className={`explorer-link${link.rewired ? " rewired" : ""}${selected ? " selected" : ""}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      style={{
                        strokeOpacity: clamp(0.22 + link.stress * 0.72, 0.22, 0.92),
                        strokeWidth: selected ? 4.6 : 1.6 + link.weight * 5.6
                      }}
                    />
                  </g>
                );
              })}

              {nodes.map((node) => {
                const selected = node.id === selectedNode?.id;
                return (
                  <g
                    className={`explorer-node${selected ? " selected" : ""}`}
                    key={node.id}
                    transform={`translate(${node.x} ${node.y})`}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      const link = links.find((candidate) => candidate.source === node.id || candidate.target === node.id);
                      if (link) {
                        setSelectedLinkId(link.id);
                      }
                    }}
                  >
                    <circle className="explorer-node-ring" r={node.radius + 8} />
                    <circle
                      className="explorer-node-core"
                      r={node.radius}
                      style={{ fill: nodeFill(node.stress, selected) }}
                    />
                    <text className="explorer-node-label" textAnchor="middle" dy="4">
                      S{node.id.toString().padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <aside className="network-inspector" aria-label="Selected network object">
          <span>Selected sector</span>
          <strong>{selectedNode ? `S${selectedNode.id.toString().padStart(2, "0")}` : "None"}</strong>
          <dl>
            <div>
              <dt>Stage</dt>
              <dd>{selectedNode ? stageLabels[selectedNode.stageId] : "-"}</dd>
            </div>
            <div>
              <dt>Stress</dt>
              <dd>{selectedNode ? formatPercent(selectedNode.stress) : "-"}</dd>
            </div>
            <div>
              <dt>Output</dt>
              <dd>{selectedNode ? selectedNode.outputIndex.toFixed(0) : "-"}</dd>
            </div>
            <div>
              <dt>Upstream</dt>
              <dd>{upstreamCount}</dd>
            </div>
            <div>
              <dt>Downstream</dt>
              <dd>{downstreamCount}</dd>
            </div>
            <div>
              <dt>Systemic score</dt>
              <dd>{formatPercent(systemicScore)}</dd>
            </div>
          </dl>
          <span>Selected link</span>
          <strong>{selectedLink ? `${linkLabel(selectedLink.source)} -> ${linkLabel(selectedLink.target)}` : "None"}</strong>
        </aside>
      </div>
    </div>
  );
}

function buildNodes(sectors: readonly SectorSummary[]): ExplorerNode[] {
  const maxSectorFirms = Math.max(1, ...sectors.map((sector) => sector.firms));
  return sectors.map((sector, index) => {
    const stageCount = Math.max(1, stageLabels.length - 1);
    const stageX = 95 + (sector.stageId / stageCount) * 705;
    const sectorOffset = (index % 4) - 1.5;
    const ring = Math.floor(index / 4) % 3;
    const stress = clamp(stressScore(sector), 0, 1);
    return {
      id: sector.sectorId,
      label: `S${sector.sectorId.toString().padStart(2, "0")}`,
      stageId: sector.stageId,
      x: stageX + sectorOffset * 30,
      y: 98 + ring * 116 + (sector.sectorId % 2) * 28 + stress * 42,
      radius: 12 + Math.sqrt(sector.firms / maxSectorFirms) * 16 + stress * 8,
      stress,
      outputIndex: sector.outputIndex,
      firms: sector.firms
    };
  });
}

function buildLinks(nodes: readonly ExplorerNode[], network: NetworkSummary): ExplorerLink[] {
  const links: ExplorerLink[] = [];
  for (const source of nodes) {
    const nextStage = nodes
      .filter((target) => target.stageId > source.stageId)
      .sort(
        (left, right) =>
          Math.abs(left.stageId - source.stageId) - Math.abs(right.stageId - source.stageId) ||
          Math.abs(left.y - source.y) - Math.abs(right.y - source.y)
      )
      .slice(0, 2);
    for (const target of nextStage) {
      links.push({
        id: `${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        weight: clamp((source.firms + target.firms) / Math.max(1, maxFirms(nodes) * 2), 0.12, 1),
        stress: clamp((source.stress + target.stress + network.deliveryFailureRate * 2) / 3, 0, 1),
        rewired: false
      });
    }
  }
  return links.slice(0, 38);
}

function stressScore(sector: SectorSummary): number {
  return (
    sector.backlogIndex * 0.55 +
    sector.deliveryFailureRate * 2.7 +
    Math.max(0, sector.inputCostIndex - 1) * 0.45 +
    Math.max(0, 100 - sector.outputIndex) / 180
  );
}

function maxFirms(nodes: readonly ExplorerNode[]): number {
  return Math.max(1, ...nodes.map((node) => node.firms));
}

function nodeFill(stress: number, selected: boolean): string {
  if (selected) {
    return "#0A4F56";
  }
  if (stress > 0.45) {
    return "#C18F49";
  }
  return "#2F7F86";
}

function linkLabel(id: number): string {
  return `S${id.toString().padStart(2, "0")}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
