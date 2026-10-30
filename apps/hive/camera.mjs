/**
 * @module apps/hive/camera.mjs
 * @purpose Computes chamber focus stops and a full-bleed campus overview.
 * @inputs Layout, optional component ID and viewport aspect ratio.
 * @outputs Camera position, target and vertical field of view.
 * @effects none
 * @errors None for a nonempty layout and positive aspect.
 */
import { STYLE, OVERVIEW_ELEVATION } from './config.mjs';
// Shift the projection, not the look-at target: positive offset lifts the subject above a bottom card.
export function viewCentreOffset(height, top, bottom) { return (bottom - top) / 2; }
// Frame the loop and its depot, using actual projected corners rather than a loose sphere.
export function overview(model, aspect = 1, elevation = OVERVIEW_ELEVATION) {
  const campus = model.chambers;
  if (!campus.length) return focus(model, null, aspect);
  const min = model.bounds.min, max = model.bounds.max;
  const target = min.map((v, i) => (v + max[i]) / 2), length = Math.hypot(elevation, 1);
  const vertical = Math.tan(STYLE.fov * Math.PI / 360), horizontal = vertical * aspect;
  let distance = 0;
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) {
    const dx = x - target[0], dy = y - target[1], dz = z - target[2];
    const depth = (dy * elevation + dz) / length, up = (dy - dz * elevation) / length;
    distance = Math.max(distance, depth + Math.max(Math.abs(dx) / horizontal, Math.abs(up) / vertical) * STYLE.framePadding);
  }
  // Fit the complete viewport. Overlays do not move the optical centre.
  return { target, position: [target[0], target[1] + distance * elevation / length, target[2] + distance / length], fov: STYLE.fov };
}
// A pose is an orbit keyframe; interpolate its scale, never Cartesian eye positions.
export function blendPose(a, b, t) {
  const orbit = p => { const d = p.position.map((v, i) => v - p.target[i]), distance = Math.hypot(...d); return { distance, azimuth: Math.atan2(d[0], d[2]), elevation: Math.asin(d[1] / distance) }; };
  const x = orbit(a), y = orbit(b), travel = Math.hypot(...a.target.map((v, i) => b.target[i] - v));
  const bump = Math.max(0, Math.log(Math.max(1, travel) / Math.sqrt(x.distance * y.distance)));
  const distance = Math.exp(Math.log(x.distance) * (1 - t) + Math.log(y.distance) * t + Math.sin(Math.PI * t) * bump);
  const azimuth = x.azimuth + Math.atan2(Math.sin(y.azimuth - x.azimuth), Math.cos(y.azimuth - x.azimuth)) * t;
  const elevation = x.elevation * (1 - t) + y.elevation * t, target = a.target.map((v, i) => v + (b.target[i] - v) * t);
  return { target, position: [target[0] + distance * Math.cos(elevation) * Math.sin(azimuth), target[1] + distance * Math.sin(elevation), target[2] + distance * Math.cos(elevation) * Math.cos(azimuth)], fov: a.fov + (b.fov - a.fov) * t };
}
export function focus(model, id, aspect = 1) {
  const bounds = model.chambers.find(c => c.id === id || c.component === id)?.bounds ?? model.bounds;
  // Reuse the overview's projected-corner fit, rather than enclosing an oversized sphere.
  return overview({ ...model, bounds, chambers: [{}] }, aspect, STYLE.cameraElevation);
}
