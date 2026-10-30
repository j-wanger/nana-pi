/**
 * @module apps/hive/layout.mjs
 * @purpose Converts ordered components into deterministic disjoint chambers, cells and activity bees.
 * @inputs A contract-shaped component document.
 * @outputs A renderer-independent layout with world-space bounds.
 * @effects none
 * @errors Invalid document shapes may throw; the boundary checks the contract first.
 */
import { BEE_CAP, STYLE, FOOTPRINT_SCALE } from './config.mjs';
import { cityLayout } from './city.mjs';
export function bees(component) {
  const count = Math.min(component.activity.recentCommits + component.activity.inFlight, BEE_CAP);
  return Array.from({ length: count }, (_, i) => ({ index: i, kind: i < component.activity.inFlight ? 'inFlight' : 'recent' }));
}
export function footprint(component) {
  return Math.max(component.status === 'absent' ? 1 : STYLE.foundationColumns, Math.ceil(Math.sqrt(Math.max(1, component.features.length)))) * STYLE.cellStep / 2 * Math.SQRT2 * FOOTPRINT_SCALE;
}
export function layout(data, plan, overrides) {
  const city = plan ? cityLayout(data, plan, overrides) : null;
  const centres = city?.places ?? data.components.map((c, i) => ({ id: c.id, component: c.id, name: c.name, x: i * (footprint(c) * 2 + STYLE.chamberGap), y: 0, z: 0, radius: footprint(c), material: { status: c.status, kind: c.kind }, form: 'hall', face: [0, 1], district: 'town' }));
  const chambers = centres.map(n => {
    const c = data.components.find(c => c.id === n.component) ?? { id: n.id, name: n.name, status: n.material.status, kind: n.material.kind, features: [], activity: { recentCommits: 0, inFlight: 0 } };
    const { x, z, y = 0, radius } = n;
    const features = c.features.length ? c.features : [null];
    const cellCols = Math.ceil(Math.sqrt(features.length));
    const cellRows = Math.ceil(features.length / cellCols);
    return {
      ...n, kind: c.kind, x, y, z, radius, material: n.material, bees: bees(c),
      bounds: n.bounds ?? { min: [x - radius, y - 0.5, z - radius], max: [x + radius, y + STYLE.beeHeight + 1, z + radius] },
      cells: features.map((f, i) => ({ id: f?.id ?? null, dark: !f,
        x: x + (i % cellCols - (cellCols - 1) / 2) * STYLE.cellStep,
        z: z + (Math.floor(i / cellCols) - (cellRows - 1) / 2) * STYLE.cellStep,
        fill: f?.rows ? f.implemented / f.rows : 0,
      })),
    };
  });
  const min = [0, 1, 2].map(axis => Math.min(...chambers.map(c => c.bounds.min[axis])));
  const max = [0, 1, 2].map(axis => Math.max(...chambers.map(c => c.bounds.max[axis])));
  return { ...city, cellWidth: STYLE.cellWidth, chambers, bounds: { min, max }, roads: city?.roads ?? [] };
}
