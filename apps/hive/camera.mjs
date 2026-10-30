/**
 * @module apps/hive/camera.mjs
 * @purpose Computes chamber focus stops and a full-bleed campus overview.
 * @inputs Layout, optional component ID and viewport aspect ratio.
 * @outputs Camera position, target and vertical field of view.
 * @effects none
 * @errors None for a nonempty layout and positive aspect.
 */
import { STYLE } from './config.mjs';
// The overview is a close architectural view, not a fit-all inventory shot.
// Use the workflow campus's projected depth to fill the screen vertically;
// the outer governance ring continues beyond the viewport on either side.
export function overview(model, aspect = 1) {
  const campus = model.chambers.filter(c => c.kind === 'workflow');
  if (!campus.length) return focus(model, null, aspect);
  const min = [0, 1, 2].map(i => Math.min(...campus.map(c => c.bounds.min[i])));
  const max = [0, 1, 2].map(i => Math.max(...campus.map(c => c.bounds.max[i])));
  const target = min.map((v, i) => (v + max[i]) / 2);
  const direction = [0, STYLE.cameraElevation, 1];
  const length = Math.hypot(...direction);
  const projectedDepth = (max[2] - min[2]) * STYLE.cameraElevation / length + (max[1] - min[1]) / length;
  const distance = projectedDepth / (2 * Math.tan(STYLE.fov * Math.PI / 360));
  return { target, position: target.map((v, i) => v + direction[i] / length * distance), fov: STYLE.fov };
}
export function focus(model, id, aspect = 1) {
  const bounds = model.chambers.find(c => c.id === id)?.bounds ?? model.bounds;
  const target = bounds.min.map((v, i) => (v + bounds.max[i]) / 2);
  const radius = Math.hypot(...bounds.max.map((v, i) => (v - bounds.min[i]) / 2));
  const vertical = STYLE.fov * Math.PI / 360;
  const limitingAngle = Math.min(vertical, Math.atan(Math.tan(vertical) * aspect));
  const distance = radius * STYLE.framePadding / Math.sin(limitingAngle);
  const direction = [0, STYLE.cameraElevation, 1]; const length = Math.hypot(...direction);
  return { target, position: target.map((v, i) => v + direction[i] / length * distance), fov: STYLE.fov };
}
