/**
 * @module apps/hive/camera.mjs
 * @purpose Computes chamber focus stops and a full-bleed campus overview.
 * @inputs Layout, optional component ID and viewport aspect ratio.
 * @outputs Camera position, target and vertical field of view.
 * @effects none
 * @errors None for a nonempty layout and positive aspect.
 */
import { STYLE, OVERVIEW_ELEVATION } from './config.mjs';
// Frame the loop and its depot, using actual projected corners rather than a loose sphere.
export function overview(model, aspect = 1) {
  const campus = model.chambers;
  if (!campus.length) return focus(model, null, aspect);
  const min = [0, 1, 2].map(i => Math.min(...campus.map(c => c.bounds.min[i])));
  const max = [0, 1, 2].map(i => Math.max(...campus.map(c => c.bounds.max[i])));
  const target = min.map((v, i) => (v + max[i]) / 2), length = Math.hypot(OVERVIEW_ELEVATION, 1);
  const vertical = Math.tan(STYLE.fov * Math.PI / 360), horizontal = vertical * aspect;
  let distance = 0;
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
    const dx = x - target[0], dy = y - target[1], dz = z - target[2];
    const depth = (dy * OVERVIEW_ELEVATION + dz) / length, up = (dy - dz * OVERVIEW_ELEVATION) / length;
    distance = Math.max(distance, depth + Math.max(Math.abs(dx) / horizontal, Math.abs(up) / vertical) * STYLE.framePadding);
  }
  // Fit the complete viewport. Overlays do not move the optical centre.
  return { target, position: [target[0], target[1] + distance * OVERVIEW_ELEVATION / length, target[2] + distance / length], fov: STYLE.fov };
}
export function focus(model, id, aspect = 1) {
  const bounds = model.chambers.find(c => c.id === id || c.component === id)?.bounds ?? model.bounds;
  const target = bounds.min.map((v, i) => (v + bounds.max[i]) / 2);
  const radius = Math.hypot(...bounds.max.map((v, i) => (v - bounds.min[i]) / 2));
  const vertical = STYLE.fov * Math.PI / 360;
  const limitingAngle = Math.min(vertical, Math.atan(Math.tan(vertical) * aspect));
  const distance = radius * STYLE.framePadding / Math.sin(limitingAngle);
  const direction = [0, STYLE.cameraElevation, 1]; const length = Math.hypot(...direction);
  return { target, position: target.map((v, i) => v + direction[i] / length * distance), fov: STYLE.fov };
}
