/**
 * @module apps/hive/assets/hive.mjs
 * @purpose Assembles reusable cell and bee assets into pickable component chambers.
 * @inputs Explicit THREE namespace, world layout and shared materials.
 * @outputs A scene group with component and bee metadata.
 * @effects none
 * @errors None for valid layout.
 */
import { buildCell } from './cell.mjs';
import { buildBee } from './bee.mjs';
import { STYLE } from '../config.mjs';
export function buildHive(THREE, model, materials) {
  const group = new THREE.Group();
  for (const c of model.chambers) {
    const chamber = new THREE.Group(); chamber.userData.component = c.id;
    for (const cell of c.cells) { const mesh = buildCell(THREE, cell, materials, c.material.status, c.kind); mesh.position.set(cell.x, 0, cell.z); chamber.add(mesh); }
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(c.radius, c.radius * 0.9, 0.35, 6), materials.rim[c.kind]); plate.position.set(c.x, -0.3, c.z); chamber.add(plate);
    for (const activity of c.bees) { const bee = buildBee(THREE, materials); bee.scale.setScalar(STYLE.beeScale); bee.userData.bee = { ...activity, x: c.x, z: c.z }; chamber.add(bee); }
    group.add(chamber);
  }
  return group;
}
