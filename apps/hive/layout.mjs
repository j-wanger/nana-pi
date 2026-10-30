/**
 * @module apps/hive/layout.mjs
 * @purpose Converts ordered components into deterministic disjoint chambers, cells and activity bees.
 * @inputs A contract-shaped component document.
 * @outputs A renderer-independent layout with world-space bounds.
 * @effects none
 * @errors Invalid document shapes may throw; the boundary checks the contract first.
 */
import { BEE_CAP, STYLE, FOOTPRINT_SCALE } from './config.mjs';
export function bees(component) {
  const count = Math.min(component.activity.recentCommits + component.activity.inFlight, BEE_CAP);
  return Array.from({ length: count }, (_, i) => ({ index: i, kind: i < component.activity.inFlight ? 'inFlight' : 'recent' }));
}
export function footprint(component) {
  return Math.max(component.status === 'absent' ? 1 : STYLE.foundationColumns, Math.ceil(Math.sqrt(Math.max(1, component.features.length)))) * STYLE.cellStep / 2 * Math.SQRT2 * FOOTPRINT_SCALE;
}
export function layout(data, graph) {
  // Direct asset callers may omit a graph; the page boundary always requires one.
  const centres = new Map(graph?.nodes.map(n => [n.id, n]) ?? data.components.map((c, i) => [c.id, { x: i * (footprint(c) * 2 + STYLE.chamberGap), z: 0 }]));
  const chambers = data.components.map(c => {
    const { x, z, role, stage } = centres.get(c.id);
    const radius = footprint(c) / FOOTPRINT_SCALE;
    const features = c.features.length ? c.features : [null];
    const cellCols = Math.ceil(Math.sqrt(features.length));
    const cellRows = Math.ceil(features.length / cellCols);
    return {
      id: c.id, name: c.name, kind: c.kind, role, stage, x, z, radius,
      material: { status: c.status, kind: c.kind }, bees: bees(c),
      bounds: { min: [x - radius, -0.5, z - radius], max: [x + radius, STYLE.beeHeight + 1, z + radius] },
      cells: features.map((f, i) => ({ id: f?.id ?? null, dark: !f,
        x: x + (i % cellCols - (cellCols - 1) / 2) * STYLE.cellStep,
        z: z + (Math.floor(i / cellCols) - (cellRows - 1) / 2) * STYLE.cellStep,
        fill: f?.rows ? f.implemented / f.rows : 0,
      })),
    };
  });
  const min = [0, 1, 2].map(axis => Math.min(...chambers.map(c => c.bounds.min[axis])));
  const max = [0, 1, 2].map(axis => Math.max(...chambers.map(c => c.bounds.max[axis])));
  return { cellWidth: STYLE.cellWidth, chambers, bounds: { min, max }, roads: graph?.roads ?? [] };
}
