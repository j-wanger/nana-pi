/**
 * @module apps/hive/assets/road.mjs
 * @purpose Draws a published road as shared architectural beams with low guard rails.
 * @inputs Explicit THREE, a road path and shared materials.
 * @outputs A pickable road mesh group bearing its unordered pair.
 * @effects none
 * @errors None for a valid road.
 */
import { beam, fence } from './parts.mjs';
import { NAVIGATION } from '../config.mjs';
export function buildRoad(THREE, road, materials) {
  const group = new THREE.Group(); group.userData.road = road.id;
  const rod = new THREE.CylinderGeometry(1, 1, 1, 8), width = NAVIGATION.roadWidths[road.class];
  for (let i = 1; i < road.path.length; i++) {
    const a = road.path[i - 1], b = road.path[i];
    beam(THREE, materials, rod, group, [a[0], 0, a[1]], [b[0], 0, b[1]], width);
    if (road.class === 'loop') fence(THREE, materials, rod, group, [a[0], width, a[1]], [b[0], width, b[1]], width);
  }
  return group;
}
