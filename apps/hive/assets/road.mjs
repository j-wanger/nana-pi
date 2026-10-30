/**
 * @module apps/hive/assets/road.mjs
 * @purpose Builds shaded kerbed trays, a raised pier-supported ring and chapter air links.
 * @inputs Explicit THREE, a city street path and shared materials.
 * @outputs Solid outlined street groups and lane-keeping ink packet boxes.
 * @effects none
 * @errors None for a valid road.
 */
import { ribbon, beam, box, outline, cargo } from './parts.mjs';
import { STREETS, CARGO } from '../config.mjs';
export function buildRoad(THREE, road, materials) {
  const group = new THREE.Group(); group.userData.road = road.id;
  const ring = road.id.startsWith('ring-'), width = ring ? STREETS.ringWidth : STREETS.widths[road.class], cube = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 1; i < road.path.length; i++) {
    const a = road.path[i - 1], b = road.path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (road.class === 'air') {
      if (i % 2) beam(THREE, materials, new THREE.CylinderGeometry(1, 1, 1, 6), group, [a[0], road.heights[i - 1], a[1]], [b[0], road.heights[i], b[1]], width, materials.ink);
      continue;
    }
    // Ring approach trays slope up to the viaduct, rather than ending underneath it.
    const elevation = p => ring || Math.abs(Math.hypot(...p) - road.ringRadius) < 0.1 ? STREETS.ringElevation : STREETS.elevation;
    const ya = elevation(a), yb = elevation(b), y = (ya + yb) / 2;
    const surface = ribbon(THREE, group, a, b, width, STREETS.thickness, y, materials.status.sound);
    surface.rotation.x = -Math.atan2(yb - ya, length); surface.scale.z = Math.hypot(length, yb - ya) / (length || 1);
    surface.castShadow = true; surface.userData.roadSurface = true; surface.userData.streetSegment = { road: road.id, a, b }; outline(THREE, surface);
    if (!length) continue;
    const normal = [(b[1] - a[1]) / length, -(b[0] - a[0]) / length];
    for (const side of [-1, 1]) {
      const offset = normal.map(v => v * side * (width - STREETS.edgeWidth) / 2);
      const edge = ribbon(THREE, group, a.map((v, j) => v + offset[j]), b.map((v, j) => v + offset[j]), STREETS.edgeWidth, STREETS.kerbHeight, y + (STREETS.thickness + STREETS.kerbHeight) / 2, materials.status.sound);
      edge.rotation.x = surface.rotation.x; edge.scale.z = surface.scale.z; edge.castShadow = true; edge.userData.kerb = true; outline(THREE, edge);
    }
    if (ring) {
      const pier = box(THREE, materials, cube, group, a[0], (y + STREETS.elevation) / 2, a[1], width * 0.65, y - STREETS.elevation, 0.3, materials.rim.workflow); pier.userData.pier = true; outline(THREE, pier);
    }
    // Two opposing streams occupy separate lanes on avenues and the ring.
    // One pair per road, not per tessellated segment. Local trays belong to pedestrians.
    if (i === 1 && (ring ? Number(road.id.slice(5)) % CARGO.ringStride === 0 : ['freight', 'customers'].some(id => [road.from, road.to].includes(id)))) for (const side of [-1, 1]) {
      const truck = ['freight', 'customers'].some(id => [road.from, road.to].includes(id));
      const packet = cargo(THREE, materials, group, { pallet: true, truck });
      const points = road.path, lengths = points.slice(1).map((b, j) => Math.hypot(b[0] - points[j][0], b[1] - points[j][1]));
      packet.userData.traffic = { points, lengths, elevations: points.map(elevation), lane: side * width / 4, side, truck };
    }
  }
  return group;
}
