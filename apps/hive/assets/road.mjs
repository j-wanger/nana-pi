/**
 * @module apps/hive/assets/road.mjs
 * @purpose Draws ground-level street ribbons with kerb lines and broken lane marks.
 * @inputs Explicit THREE, a road path and shared materials.
 * @outputs A pickable road mesh group bearing its unordered pair.
 * @effects none
 * @errors None for a valid road.
 */
import { ribbon } from './parts.mjs';
import { NAVIGATION, STREETS } from '../config.mjs';
export function buildRoad(THREE, road, materials) {
  const group = new THREE.Group(); group.userData.road = road.id;
  const width = NAVIGATION.roadWidths[road.class], street = ['loop', 'spur'].includes(road.class);
  // Round ground junctions close the outside wedges between consecutive ribbons.
  for (const p of road.path) {
    const joint = new THREE.Mesh(new THREE.CylinderGeometry(width / 2, width / 2, STREETS.thickness, 24), street ? materials.status.gap : materials.ink);
    joint.position.set(p[0], STREETS.elevation, p[1]); joint.receiveShadow = true; joint.userData.roadSurface = true; group.add(joint);
  }
  for (let i = 1; i < road.path.length; i++) {
    const a = road.path[i - 1], b = road.path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!length) continue;
    const surface = ribbon(THREE, group, a, b, width, STREETS.thickness, STREETS.elevation, street ? materials.status.gap : materials.ink);
    surface.userData.roadSurface = true;
    if (!street) continue;
    const normal = [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
    const top = STREETS.elevation + STREETS.thickness;
    for (const side of [-1, 1]) {
      const offset = normal.map(v => v * side * (width - STREETS.edgeWidth) / 2);
      const edge = ribbon(THREE, group, a.map((v, j) => v + offset[j]), b.map((v, j) => v + offset[j]), STREETS.edgeWidth, STREETS.thickness / 2, top, materials.ink);
      edge.userData.edgeLine = true;
    }
    if (road.class !== 'loop') continue;
    for (let d = STREETS.dashGap; d < length; d += STREETS.dashLength + STREETS.dashGap) {
      const at = distance => a.map((v, j) => v + (b[j] - v) * distance / length);
      const mark = ribbon(THREE, group, at(d), at(Math.min(length, d + STREETS.dashLength)), STREETS.laneWidth, STREETS.thickness / 2, top, materials.status.sound);
      mark.userData.laneMark = true;
    }
  }
  return group;
}
