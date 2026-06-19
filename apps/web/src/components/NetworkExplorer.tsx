import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { NetworkSummary, SectorSummary } from "@world-abm/core";

interface NetworkExplorerProps {
  readonly sectors: readonly SectorSummary[];
  readonly network: NetworkSummary;
}

interface ExplorerNodeBase {
  readonly id: number;
  readonly label: string;
  readonly stageId: number;
  readonly radius: number;
  readonly stress: number;
  readonly outputIndex: number;
  readonly firms: number;
}

interface ExplorerNode extends ExplorerNodeBase {
  readonly x: number;
  readonly y: number;
}

interface ExplorerLink {
  readonly id: string;
  readonly source: number;
  readonly target: number;
  readonly weight: number;
  readonly stress: number;
  readonly rewired: boolean;
}

interface Position {
  readonly x: number;
  readonly y: number;
}

interface ViewTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

type LayoutMode = "layered" | "radial";

const width = 1120;
const height = 660;
const miniWidth = 174;
const miniHeight = 108;
const stageLabels = ["Primary", "Materials", "Inputs", "Final goods", "Distribution", "Services"];
const stageShortLabels = ["PRI", "MAT", "INP", "FIN", "DST", "SRV"];
const stageColors = ["#0A4F56", "#2F7F86", "#6B8F71", "#C18F49", "#8A6A3D", "#425A5F"];

export function NetworkExplorer({ sectors, network }: NetworkExplorerProps) {
  const baseNodes = useMemo(() => buildBaseNodes(sectors), [sectors]);
  const initialLinks = useMemo(() => buildLinks(baseNodes, network), [baseNodes, network]);
  const [links, setLinks] = useState<ExplorerLink[]>(initialLinks);
  const [layout, setLayout] = useState<LayoutMode>("layered");
  const [positions, setPositions] = useState<Record<number, Position>>(() => layoutPositions(baseNodes, "layered"));
  const [selectedNodeId, setSelectedNodeId] = useState(baseNodes[0]?.id ?? 0);
  const [selectedLinkId, setSelectedLinkId] = useState(initialLinks[0]?.id ?? "");
  const [focusNeighborhood, setFocusNeighborhood] = useState(true);
  const [highlightPath, setHighlightPath] = useState(true);
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasDragRef = useRef<{ pointerId: number; x: number; y: number; origin: ViewTransform } | null>(null);
  const nodeDragRef = useRef<{ pointerId: number; nodeId: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    setLinks(initialLinks);
    setPositions(layoutPositions(baseNodes, layout));
    setSelectedNodeId(baseNodes[0]?.id ?? 0);
    setSelectedLinkId(initialLinks[0]?.id ?? "");
    setView({ x: 0, y: 0, scale: 1 });
  }, [baseNodes, initialLinks, layout]);

  const nodes = useMemo(
    () =>
      baseNodes.map((node) => ({
        ...node,
        x: positions[node.id]?.x ?? width / 2,
        y: positions[node.id]?.y ?? height / 2
      })),
    [baseNodes, positions]
  );
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];
  const selectedLink = links.find((link) => link.id === selectedLinkId) ?? links[0];
  const selectedNeighborhood = useMemo(() => neighborIds(selectedNode?.id, links), [links, selectedNode?.id]);
  const analytics = useMemo(() => computeAnalytics(nodes, links), [nodes, links]);
  const pathTarget = analytics.ranked.find((node) => node.id !== selectedNode?.id) ?? selectedNode;
  const selectedPath = useMemo(
    () => shortestPath(selectedNode?.id, pathTarget?.id, links),
    [links, pathTarget?.id, selectedNode?.id]
  );
  const selectedPathLinkIds = useMemo(() => new Set(selectedPath.linkIds), [selectedPath.linkIds]);
  const downstreamCount = links.filter((link) => link.source === selectedNode?.id).length;
  const upstreamCount = links.filter((link) => link.target === selectedNode?.id).length;
  const selectedCentrality = selectedNode ? analytics.centrality.get(selectedNode.id) ?? 0 : 0;
  const rewiredCount = links.filter((link) => link.rewired).length;
  const selectedNodeRank = selectedNode
    ? analytics.ranked.findIndex((node) => node.id === selectedNode.id) + 1
    : 0;

  function zoom(delta: number) {
    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, 0.55, 3.6)
    }));
  }

  function fitView() {
    setView({ x: 0, y: 0, scale: 1 });
  }

  function centerSelected() {
    if (!selectedNode) {
      return;
    }
    const nextScale = Math.max(view.scale, 1.35);
    setView({
      x: width / (2 * nextScale) - selectedNode.x,
      y: height / (2 * nextScale) - selectedNode.y,
      scale: nextScale
    });
  }

  function restoreGraph() {
    setLinks(initialLinks);
    setPositions(layoutPositions(baseNodes, layout));
    setSelectedLinkId(initialLinks[0]?.id ?? "");
  }

  function rewireSelectedLink() {
    if (!selectedLink) {
      return;
    }
    const existingTargets = new Set(links.filter((link) => link.source === selectedLink.source).map((link) => link.target));
    const candidate = nodes
      .filter((node) => node.id !== selectedLink.source && node.id !== selectedLink.target && !existingTargets.has(node.id))
      .sort(
        (left, right) =>
          left.stress - right.stress ||
          Math.abs(left.stageId - (selectedNode?.stageId ?? 0)) - Math.abs(right.stageId - (selectedNode?.stageId ?? 0)) ||
          right.outputIndex - left.outputIndex
      )[0];
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

  function selectNode(nodeId: number, shouldCenter = false) {
    setSelectedNodeId(nodeId);
    const link = links.find((candidate) => candidate.source === nodeId || candidate.target === nodeId);
    if (link) {
      setSelectedLinkId(link.id);
    }
    if (shouldCenter) {
      const node = nodes.find((candidate) => candidate.id === nodeId);
      if (node) {
        setView({ x: width / 2 / 1.35 - node.x, y: height / 2 / 1.35 - node.y, scale: 1.35 });
      }
    }
  }

  function pointerToGraphPoint(event: ReactPointerEvent<SVGElement>): Position {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    const rawX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * width;
    const rawY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * height;
    return {
      x: rawX / view.scale - view.x,
      y: rawY / view.scale - view.y
    };
  }

  function beginNodeDrag(event: ReactPointerEvent<SVGGElement>, node: ExplorerNode) {
    event.preventDefault();
    event.stopPropagation();
    const point = pointerToGraphPoint(event);
    nodeDragRef.current = {
      pointerId: event.pointerId,
      nodeId: node.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y
    };
    svgRef.current?.setPointerCapture(event.pointerId);
    selectNode(node.id);
  }

  function beginCanvasDrag(event: ReactPointerEvent<SVGSVGElement>) {
    const target = event.target as SVGElement;
    if (event.currentTarget === event.target || target.classList.contains("network-explorer-bg")) {
      canvasDragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        origin: view
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function movePointer(event: ReactPointerEvent<SVGSVGElement>) {
    const nodeDrag = nodeDragRef.current;
    if (nodeDrag && nodeDrag.pointerId === event.pointerId) {
      const point = pointerToGraphPoint(event);
      setPositions((current) => ({
        ...current,
        [nodeDrag.nodeId]: {
          x: clamp(point.x - nodeDrag.offsetX, 40, width - 40),
          y: clamp(point.y - nodeDrag.offsetY, 45, height - 45)
        }
      }));
      return;
    }

    const canvasDrag = canvasDragRef.current;
    if (!canvasDrag || canvasDrag.pointerId !== event.pointerId) {
      return;
    }
    setView({
      ...canvasDrag.origin,
      x: canvasDrag.origin.x + (event.clientX - canvasDrag.x) / view.scale,
      y: canvasDrag.origin.y + (event.clientY - canvasDrag.y) / view.scale
    });
  }

  function endPointer(event: ReactPointerEvent<SVGSVGElement>) {
    if (nodeDragRef.current?.pointerId === event.pointerId) {
      nodeDragRef.current = null;
    }
    if (canvasDragRef.current?.pointerId === event.pointerId) {
      canvasDragRef.current = null;
    }
  }

  return (
    <div className="network-explorer" aria-label="Interactive production network explorer">
      <div className="network-explorer-toolbar" aria-label="Network explorer controls">
        <div className="network-tool-group">
          <button type="button" onClick={() => zoom(0.2)} aria-label="Zoom in" title="Zoom in">
            +
          </button>
          <button type="button" onClick={() => zoom(-0.2)} aria-label="Zoom out" title="Zoom out">
            -
          </button>
          <button type="button" onClick={fitView} aria-label="Fit graph" title="Fit graph">
            Fit
          </button>
          <button type="button" onClick={centerSelected} aria-label="Center selected sector" title="Center selected sector">
            Center
          </button>
        </div>

        <label className="network-select-label">
          <span>Sector</span>
          <select value={selectedNode?.id ?? ""} onChange={(event) => selectNode(Number(event.target.value), true)}>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} - {stageLabels[node.stageId]}
              </option>
            ))}
          </select>
        </label>

        <label className="network-select-label">
          <span>Layout</span>
          <select value={layout} onChange={(event) => setLayout(event.target.value as LayoutMode)}>
            <option value="layered">Layered</option>
            <option value="radial">Radial</option>
          </select>
        </label>

        <div className="network-tool-group">
          <button
            type="button"
            className={focusNeighborhood ? "pressed" : ""}
            onClick={() => setFocusNeighborhood((current) => !current)}
            aria-pressed={focusNeighborhood}
            aria-label="Toggle neighborhood focus"
            title="Neighborhood focus"
          >
            Neighborhood
          </button>
          <button
            type="button"
            className={highlightPath ? "pressed" : ""}
            onClick={() => setHighlightPath((current) => !current)}
            aria-pressed={highlightPath}
            aria-label="Toggle path highlight"
            title="Path highlight"
          >
            Path
          </button>
          <button type="button" onClick={rewireSelectedLink} aria-label="Rewire selected link" title="Rewire selected link">
            Rewire
          </button>
          <button type="button" onClick={restoreGraph} aria-label="Restore original graph" title="Restore original graph">
            Restore
          </button>
        </div>
      </div>

      <div className="network-explorer-grid">
        <div className="network-explorer-canvas">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Zoomable supplier-buyer sector network"
            onWheel={(event) => {
              event.preventDefault();
              zoom(event.deltaY < 0 ? 0.14 : -0.14);
            }}
            onPointerDown={beginCanvasDrag}
            onPointerMove={movePointer}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          >
            <title>Zoomable supplier-buyer sector network</title>
            <defs>
              <marker id="network-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
                <path d="M0,0 L7,3.5 L0,7 Z" />
              </marker>
            </defs>
            <rect className="network-explorer-bg" width={width} height={height} />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
              {layout === "layered" &&
                stageLabels.map((label, index) => {
                  const x = 82 + (index / Math.max(1, stageLabels.length - 1)) * (width - 190);
                  return (
                    <g key={label}>
                      <line className="network-stage-guide" x1={x} x2={x} y1={54} y2={height - 58} />
                      <text className="network-stage-label" x={x} y={34} textAnchor="middle">
                        {stageShortLabels[index]}
                      </text>
                    </g>
                  );
                })}

              {links.map((link, index) => {
                const source = nodes.find((node) => node.id === link.source);
                const target = nodes.find((node) => node.id === link.target);
                if (!source || !target) {
                  return null;
                }
                const selected = link.id === selectedLink?.id;
                const adjacent = source.id === selectedNode?.id || target.id === selectedNode?.id;
                const onPath = selectedPathLinkIds.has(link.id);
                const dimmed = focusNeighborhood && selectedNode ? !adjacent && !onPath : false;
                const path = linkPath(source, target, index);
                return (
                  <g key={link.id}>
                    <path
                      className={`explorer-link-hit${selected ? " selected" : ""}`}
                      d={path}
                      onClick={() => {
                        setSelectedLinkId(link.id);
                        setSelectedNodeId(source.id);
                      }}
                    />
                    <path
                      className={`explorer-link${link.rewired ? " rewired" : ""}${selected ? " selected" : ""}${
                        adjacent ? " adjacent" : ""
                      }${highlightPath && onPath ? " path" : ""}${dimmed ? " dimmed" : ""}`}
                      d={path}
                      markerEnd="url(#network-arrow)"
                      style={{
                        strokeOpacity: dimmed ? 0.12 : clamp(0.28 + link.stress * 0.65, 0.28, 0.92),
                        strokeWidth: selected ? 5.4 : highlightPath && onPath ? 4.3 : 1.4 + link.weight * 5.4
                      }}
                    />
                  </g>
                );
              })}

              {nodes.map((node) => {
                const selected = node.id === selectedNode?.id;
                const neighbor = selectedNeighborhood.has(node.id);
                const onPath = selectedPath.nodeIds.includes(node.id);
                const dimmed = focusNeighborhood && selectedNode ? !selected && !neighbor && !onPath : false;
                return (
                  <g
                    className={`explorer-node${selected ? " selected" : ""}${neighbor ? " neighbor" : ""}${
                      highlightPath && onPath ? " path" : ""
                    }${dimmed ? " dimmed" : ""}`}
                    key={node.id}
                    transform={`translate(${node.x} ${node.y})`}
                    onPointerDown={(event) => beginNodeDrag(event, node)}
                    onClick={() => selectNode(node.id)}
                  >
                    <title>
                      {node.label} {stageLabels[node.stageId]} stress {formatPercent(node.stress)}
                    </title>
                    <circle className="explorer-node-ring" r={node.radius + 12} />
                    <circle
                      className="explorer-node-core"
                      r={node.radius}
                      style={{ fill: nodeFill(node.stress, selected, node.stageId) }}
                    />
                    <text className="explorer-node-label" textAnchor="middle" dy="4">
                      {node.label.replace("S", "")}
                    </text>
                    <text className="explorer-node-subtitle" textAnchor="middle" y={node.radius + 21}>
                      {stageShortLabels[node.stageId]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="network-minimap" aria-label="Network minimap">
            <svg viewBox={`0 0 ${miniWidth} ${miniHeight}`} role="img">
              <title>Network minimap</title>
              <rect width={miniWidth} height={miniHeight} />
              {links.map((link) => {
                const source = nodes.find((node) => node.id === link.source);
                const target = nodes.find((node) => node.id === link.target);
                if (!source || !target) {
                  return null;
                }
                return (
                  <line
                    key={link.id}
                    x1={(source.x / width) * miniWidth}
                    y1={(source.y / height) * miniHeight}
                    x2={(target.x / width) * miniWidth}
                    y2={(target.y / height) * miniHeight}
                  />
                );
              })}
              {nodes.map((node) => (
                <circle
                  key={node.id}
                  className={node.id === selectedNode?.id ? "selected" : ""}
                  cx={(node.x / width) * miniWidth}
                  cy={(node.y / height) * miniHeight}
                  r={node.id === selectedNode?.id ? 4.2 : 2.7}
                />
              ))}
            </svg>
          </div>

          <div className="network-canvas-status" aria-label="Graph view status">
            <span>{Math.round(view.scale * 100)}%</span>
            <span>{rewiredCount} rewired</span>
            <span>{links.length} links</span>
          </div>
        </div>

        <aside className="network-inspector" aria-label="Selected network object">
          <span>Selected sector</span>
          <strong>{selectedNode ? `${selectedNode.label} ${stageLabels[selectedNode.stageId]}` : "None"}</strong>
          <dl>
            <div>
              <dt>Stress</dt>
              <dd>{selectedNode ? formatPercent(selectedNode.stress) : "-"}</dd>
            </div>
            <div>
              <dt>Centrality</dt>
              <dd>{formatPercent(selectedCentrality)}</dd>
            </div>
            <div>
              <dt>Rank</dt>
              <dd>{selectedNodeRank ? `#${selectedNodeRank}` : "-"}</dd>
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
          </dl>

          <span>Selected link</span>
          <strong className="network-link-label">
            {selectedLink ? `${linkLabel(selectedLink.source)} -> ${linkLabel(selectedLink.target)}` : "None"}
          </strong>

          <span>Path to bottleneck</span>
          <div className="network-path-list">
            {selectedPath.nodeIds.length > 1 ? selectedPath.nodeIds.map(linkLabel).join(" -> ") : "No connected path"}
          </div>

          <span>Systemic sectors</span>
          <div className="network-rank-list">
            {analytics.ranked.slice(0, 5).map((node) => (
              <button type="button" key={node.id} onClick={() => selectNode(node.id, true)}>
                <span>{node.label}</span>
                <strong>{formatPercent(analytics.centrality.get(node.id) ?? 0)}</strong>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function buildBaseNodes(sectors: readonly SectorSummary[]): ExplorerNodeBase[] {
  const maxSectorFirms = Math.max(1, ...sectors.map((sector) => sector.firms));
  return sectors.map((sector) => {
    const stress = clamp(stressScore(sector), 0, 1);
    return {
      id: sector.sectorId,
      label: `S${sector.sectorId.toString().padStart(2, "0")}`,
      stageId: sector.stageId,
      radius: 15 + Math.sqrt(sector.firms / maxSectorFirms) * 18 + stress * 9,
      stress,
      outputIndex: sector.outputIndex,
      firms: sector.firms
    };
  });
}

function buildLinks(nodes: readonly ExplorerNodeBase[], network: NetworkSummary): ExplorerLink[] {
  const links: ExplorerLink[] = [];
  for (const source of nodes) {
    const nextStage = nodes
      .filter((target) => target.stageId > source.stageId)
      .sort(
        (left, right) =>
          Math.abs(left.stageId - source.stageId) - Math.abs(right.stageId - source.stageId) ||
          Math.abs(left.id - source.id) - Math.abs(right.id - source.id)
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
  return links.slice(0, 42);
}

function layoutPositions(nodes: readonly ExplorerNodeBase[], layout: LayoutMode): Record<number, Position> {
  const positions: Record<number, Position> = {};
  if (layout === "radial") {
    const centerX = width / 2;
    const centerY = height / 2;
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      const radialDistance = 205 + node.stageId * 21 + node.stress * 48;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * radialDistance,
        y: centerY + Math.sin(angle) * radialDistance
      };
    });
    return positions;
  }

  for (let stageId = 0; stageId < stageLabels.length; stageId += 1) {
    const stageNodes = nodes
      .filter((node) => node.stageId === stageId)
      .sort((left, right) => right.stress - left.stress || left.id - right.id);
    stageNodes.forEach((node, index) => {
      const x = 82 + (stageId / Math.max(1, stageLabels.length - 1)) * (width - 190);
      const y = 90 + ((index + 1) / (stageNodes.length + 1)) * (height - 180);
      positions[node.id] = {
        x: x + ((index % 2) - 0.5) * 34,
        y
      };
    });
  }
  return positions;
}

function computeAnalytics(nodes: readonly ExplorerNode[], links: readonly ExplorerLink[]) {
  const maxDegree = Math.max(
    1,
    ...nodes.map((node) => links.filter((link) => link.source === node.id || link.target === node.id).length)
  );
  const centrality = new Map<number, number>();
  for (const node of nodes) {
    const degree = links.filter((link) => link.source === node.id || link.target === node.id).length;
    const outgoingStress = links
      .filter((link) => link.source === node.id)
      .reduce((total, link) => total + link.stress * link.weight, 0);
    centrality.set(
      node.id,
      clamp(node.stress * 0.45 + (degree / maxDegree) * 0.34 + outgoingStress * 0.21, 0, 1)
    );
  }
  const ranked = [...nodes].sort((left, right) => (centrality.get(right.id) ?? 0) - (centrality.get(left.id) ?? 0));
  return { centrality, ranked };
}

function neighborIds(nodeId: number | undefined, links: readonly ExplorerLink[]): Set<number> {
  const ids = new Set<number>();
  if (nodeId === undefined) {
    return ids;
  }
  ids.add(nodeId);
  for (const link of links) {
    if (link.source === nodeId) {
      ids.add(link.target);
    }
    if (link.target === nodeId) {
      ids.add(link.source);
    }
  }
  return ids;
}

function shortestPath(
  startId: number | undefined,
  targetId: number | undefined,
  links: readonly ExplorerLink[]
): { nodeIds: number[]; linkIds: string[] } {
  if (startId === undefined || targetId === undefined) {
    return { nodeIds: [], linkIds: [] };
  }
  const queue: Array<{ nodeId: number; path: number[]; linkPath: string[] }> = [{ nodeId: startId, path: [startId], linkPath: [] }];
  const visited = new Set<number>([startId]);
  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (current.nodeId === targetId) {
      return { nodeIds: current.path, linkIds: current.linkPath };
    }
    const neighbors = links.filter((link) => link.source === current.nodeId || link.target === current.nodeId);
    for (const link of neighbors) {
      const nextId = link.source === current.nodeId ? link.target : link.source;
      if (visited.has(nextId)) {
        continue;
      }
      visited.add(nextId);
      queue.push({ nodeId: nextId, path: [...current.path, nextId], linkPath: [...current.linkPath, link.id] });
    }
  }
  return { nodeIds: [startId], linkIds: [] };
}

function linkPath(source: ExplorerNode, target: ExplorerNode, index: number): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const bend = ((index % 5) - 2) * 9;
  const controlX = source.x + dx * 0.5 - dy * 0.08;
  const controlY = source.y + dy * 0.5 + dx * 0.08 + bend;
  return `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;
}

function stressScore(sector: SectorSummary): number {
  return (
    sector.backlogIndex * 0.55 +
    sector.deliveryFailureRate * 2.7 +
    Math.max(0, sector.inputCostIndex - 1) * 0.45 +
    Math.max(0, 100 - sector.outputIndex) / 180
  );
}

function maxFirms(nodes: readonly ExplorerNodeBase[]): number {
  return Math.max(1, ...nodes.map((node) => node.firms));
}

function nodeFill(stress: number, selected: boolean, stageId: number): string {
  if (selected) {
    return "#0A4F56";
  }
  if (stress > 0.52) {
    return "#C18F49";
  }
  return stageColors[stageId] ?? "#2F7F86";
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
