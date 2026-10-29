/**
 * @module apps/hive/camera.mjs
 * @purpose Computes pure sphere-framed perspective camera stops for chambers or the whole hive.
 * @inputs Layout, optional component ID and viewport aspect ratio.
 * @outputs Camera position, target and vertical field of view.
 * @effects none
 * @errors None for a nonempty layout and positive aspect.
 */
import { STYLE } from './config.mjs';
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
