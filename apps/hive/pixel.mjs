/**
 * @module apps/hive/pixel.mjs
 * @purpose Projects the complete hive to a fixed pixel grid and draws its honey cells.
 * @inputs Pure world layout and optional explicit 2D drawing context.
 * @outputs A hex draw list or pixels on the supplied context.
 * @effects none
 * @errors None for valid layout and context.
 */
import { PIXEL_WIDTH, PIXEL_HEIGHT, STYLE, HIVE_BACKGROUND } from './config.mjs';
import { STATUS_COLORS, KIND_RIMS } from './assets/materials.mjs';
export function pixel(model) {
  const width = PIXEL_WIDTH; const height = PIXEL_HEIGHT;
  const size = model.bounds.max.map((v, i) => v - model.bounds.min[i]);
  const scale = Math.min((width - 2 * STYLE.pixelPadding) / size[0], (height - 2 * STYLE.pixelPadding) / size[2]);
  const offsetX = (width - size[0] * scale) / 2; const offsetY = (height - size[2] * scale) / 2;
  const point = (x, z) => [(x - model.bounds.min[0]) * scale + offsetX, (z - model.bounds.min[2]) * scale + offsetY];
  const plan = { lots: model.chambers.map(c => [point(c.bounds.min[0], c.bounds.min[2]), point(c.bounds.max[0], c.bounds.max[2])]), streets: (model.roads ?? []).filter(r => r.class !== 'air').map(r => r.path.map(p => point(...p))) };
  return { width, height, plan, fence: model.fenceRadius ? { x: -model.bounds.min[0] * scale + offsetX, y: -model.bounds.min[2] * scale + offsetY, radius: model.fenceRadius * scale } : null, lines: [], hexes: model.chambers.flatMap(c => c.cells.map(cell => {
    const x = (cell.x - model.bounds.min[0]) * scale + offsetX;
    const y = (cell.z - model.bounds.min[2]) * scale + offsetY;
    const radius = model.cellWidth / 2 * scale;
    return { id: c.id, x, y, fill: cell.fill, color: STATUS_COLORS[c.material.status], rim: KIND_RIMS[c.kind],
      points: Array.from({ length: 6 }, (_, i) => [x + Math.cos(i * Math.PI / 3) * radius, y + Math.sin(i * Math.PI / 3) * radius]),
    };
  })) };
}
export function drawPlan(ctx, list) {
  ctx.clearRect(0, 0, list.width, list.height); ctx.strokeStyle = '#737a72'; ctx.lineWidth = 0.35;
  for (const [a, b] of list.plan.lots) ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  for (const points of list.plan.streets) { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); }
  if (list.fence) { ctx.beginPath(); ctx.arc(list.fence.x, list.fence.y, list.fence.radius, 0, Math.PI * 2); ctx.stroke(); }
}
export function drawPixel(ctx, list, selected = null) {
  ctx.fillStyle = HIVE_BACKGROUND; ctx.fillRect(0, 0, list.width, list.height);
  if (list.fence) { ctx.beginPath(); ctx.arc(list.fence.x, list.fence.y, list.fence.radius, 0, Math.PI * 2); ctx.strokeStyle = '#737a72'; ctx.lineWidth = 1; ctx.stroke(); }
  for (const line of list.lines) { ctx.beginPath(); line.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = selected && line.id.split('/').includes(selected) ? '#202622' : '#737a72'; ctx.lineWidth = 1; ctx.stroke(); }
  for (const hex of list.hexes) {
    ctx.beginPath(); hex.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = hex.color; ctx.fill(); ctx.strokeStyle = hex.id === selected ? '#202622' : hex.rim; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#f6c65b';
    const top = Math.min(...hex.points.map(p => p[1])); const bottom = Math.max(...hex.points.map(p => p[1]));
    ctx.fillRect(Math.min(...hex.points.map(p => p[0])), bottom - (bottom - top) * hex.fill, Math.max(...hex.points.map(p => p[0])) - Math.min(...hex.points.map(p => p[0])), (bottom - top) * hex.fill);
    ctx.restore();
  }
}
