/**
 * @module apps/hive/layout.mjs
 * @purpose Converts ordered components into deterministic disjoint chambers, cells and activity bees.
 * @inputs A contract-shaped component document.
 * @outputs A renderer-independent layout with world-space bounds.
 * @effects none
 * @errors Invalid document shapes may throw; the boundary checks the contract first.
 */
import { BEE_CAP, STYLE } from './config.mjs';
export function bees(component) {
  const count = Math.min(component.activity.recentCommits + component.activity.inFlight, BEE_CAP);
  return Array.from({ length: count }, (_, i) => ({ index: i, kind: i < component.activity.inFlight ? 'inFlight' : 'recent' }));
}
export function layout(data) {
  const side = Math.ceil(Math.sqrt(Math.max(1, ...data.components.map(c => c.features.length))));
  const half = side * STYLE.cellStep / 2;
  const radius = Math.SQRT2 * half;
  const stride = 2 * radius + STYLE.chamberGap;
  const workflows = data.components.filter(c => c.kind === 'workflow');
  const governance = data.components.filter(c => c.kind === 'governance');
  const cols = Math.ceil(Math.sqrt(workflows.length));
  const centres = new Map(workflows.map((c, i) => [c.id, {
    x: (i % cols - (cols - 1) / 2) * stride,
    z: (Math.floor(i / cols) - (Math.ceil(workflows.length / cols) - 1) / 2) * stride,
  }]));
  const outerWorkflow = Math.max(0, ...[...centres.values()].map(c => Math.hypot(c.x, c.z) + radius));
  const ring = Math.max(outerWorkflow + radius + STYLE.chamberGap, governance.length * stride / Math.PI);
  governance.forEach((c, i) => {
    const angle = i / governance.length * Math.PI * 2 - Math.PI / 2;
    centres.set(c.id, { x: Math.cos(angle) * ring, z: Math.sin(angle) * ring });
  });
  const chambers = data.components.map(c => {
    const { x, z } = centres.get(c.id);
    const features = c.features.length ? c.features : [null];
    const cellCols = Math.ceil(Math.sqrt(features.length));
    const cellRows = Math.ceil(features.length / cellCols);
    return {
      id: c.id, name: c.name, kind: c.kind, x, z, radius,
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
  return { cellWidth: STYLE.cellWidth, chambers, bounds: { min, max } };
}
