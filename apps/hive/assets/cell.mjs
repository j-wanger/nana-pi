/**
 * @module apps/hive/assets/cell.mjs
 * @purpose Builds a reusable six-sided wax cell with a data-height honey surface.
 * @inputs Explicit THREE namespace, fill/dark cell data and shared materials.
 * @outputs A low-poly THREE group with no renderer dependency.
 * @effects none
 * @errors None for valid fill.
 */
import { STYLE } from '../config.mjs';
export function buildCell(THREE, cell, materials, status = 'sound', kind = 'workflow') {
  const group = new THREE.Group();
  const radius = STYLE.cellWidth / 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.18, 6), cell.dark ? materials.status.absent : materials.dark);
  base.position.y = cell.dark ? STYLE.cellHeight : 0;
  group.add(base);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, STYLE.cellHeight, 6, 1, true), materials.status[status]);
  wall.material.side = THREE.DoubleSide; wall.position.y = STYLE.cellHeight / 2; group.add(wall);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.065, 3, 6), materials.rim[kind]);
  rim.rotation.x = Math.PI / 2; rim.rotation.z = Math.PI / 6; rim.position.y = STYLE.cellHeight; group.add(rim);
  if (cell.fill > 0) {
    const honey = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, STYLE.cellHeight * cell.fill, 6), materials.honey);
    honey.position.y = STYLE.cellHeight * cell.fill / 2; group.add(honey);
  }
  return group;
}
