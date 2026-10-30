/**
 * @module apps/hive/assets/road.mjs
 * @purpose Draws pale continuous streets, dashed back paths, white kerbs and chapter air arcs.
 * @inputs Explicit THREE, a city street path and shared materials.
 * @outputs A street group with measured segment endpoints.
 * @effects none
 * @errors None for a valid road.
 */
import { ribbon, beam } from './parts.mjs';
import { STREETS } from '../config.mjs';
export function buildRoad(THREE, road, materials) {
  const group = new THREE.Group(); group.userData.road = road.id;
  const width = STREETS.widths[road.class];
  for (let i = 1; i < road.path.length; i++) {
    const a = road.path[i - 1], b = road.path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (road.class === 'air') {
      beam(THREE, materials, new THREE.CylinderGeometry(1, 1, 1, 6), group, [a[0], road.heights[i - 1], a[1]], [b[0], road.heights[i], b[1]], width, materials.street); continue;
    }
    const at = distance => a.map((v, j) => v + (b[j] - v) * distance / (length || 1));
    const intervals = road.class === 'back' ? Array.from({ length: Math.max(1, Math.ceil(length / (STREETS.dashLength + STREETS.dashGap))) }, (_, j) => [j * (STREETS.dashLength + STREETS.dashGap), Math.min(length, j * (STREETS.dashLength + STREETS.dashGap) + STREETS.dashLength)]) : [[0, length]];
    for (const [j, [start, end]] of intervals.entries()) {
      const surface = ribbon(THREE, group, at(start), at(end), width, STREETS.thickness, STREETS.elevation, materials.street); surface.userData.roadSurface = true;
      if (!j) surface.userData.streetSegment = { road: road.id, a, b };
      if (road.class === 'back') { surface.userData.dash = true; surface.userData.length = end - start; }
    }
    if (road.class === 'back' || !length) continue;
    const normal = [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
    for (const side of [-1, 1]) {
      const offset = normal.map(v => v * side * (width - STREETS.edgeWidth) / 2);
      const edge = ribbon(THREE, group, a.map((v, j) => v + offset[j]), b.map((v, j) => v + offset[j]), STREETS.edgeWidth, STREETS.kerbHeight, STREETS.elevation + STREETS.thickness, materials.status.sound); edge.castShadow = true; edge.userData.kerb = true;
    }
  }
  return group;
}
