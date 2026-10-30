/**
 * @module apps/hive/assets/hive.mjs
 * @purpose Assembles pickable city lots, complete forms, residents, streets and the two-opening park fence.
 * @inputs Explicit THREE namespace, world layout and shared materials.
 * @outputs A scene group with place, component, street and resident metadata.
 * @effects none
 * @errors None for valid layout.
 */
import { buildCell } from './cell.mjs';
import { buildDistrict } from './district.mjs';
import { buildResident } from './residents.mjs';
import { STYLE, STREETS, CITY } from '../config.mjs';
import { box, drum, hoop, fence } from './parts.mjs';
import { buildRoad } from './road.mjs';
import { visibleRoads } from '../city.mjs';
export function buildHive(THREE, model, materials) {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1), rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  for (const n of model.chambers) {
    const lot = new THREE.Group(); lot.position.set(n.x, n.y, n.z); lot.userData.place = n.id; lot.userData.component = n.component ?? n.id; group.add(lot);
    const form = buildDistrict(THREE, n, materials); lot.add(form);
    for (const cell of n.cells) { const mesh = buildCell(THREE, cell, materials, n.material.status, n.kind); mesh.position.set(cell.x - n.x, 0, cell.z - n.z); mesh.scale.setScalar(0.6); lot.add(mesh); }
    for (const activity of n.bees) {
      const worker = buildResident(THREE, materials); worker.userData.worker = activity;
      const angle = activity.index / Math.max(1, n.bees.length) * Math.PI * 2;
      worker.position.set(Math.cos(angle) * n.radius * 0.74, 0, Math.sin(angle) * n.radius * 0.74); lot.add(worker);
    }
    for (const [i, resident] of (model.residents ?? []).filter(r => r.place === n.id).entries()) {
      if (resident.kind === 'builder' && n.material.status !== 'sound') continue;
      const figure = buildResident(THREE, materials); figure.userData.resident = resident;
      figure.position.set((i - 0.5) * 0.8, 0, n.radius * 0.65); lot.add(figure);
    }
    lot.userData.labelHeight = new THREE.Box3().setFromObject(lot).max.y;
  }
  const civic = model.chambers.filter(n => ['court', 'records', 'style'].includes(n.id));
  if (civic.length) {
    const minX = Math.min(...civic.map(n => n.x - n.radius)), maxX = Math.max(...civic.map(n => n.x + n.radius));
    const minZ = Math.min(...civic.map(n => n.z - n.radius)), maxZ = Math.max(...civic.map(n => n.z + n.radius));
    const plinth = box(THREE, materials, cube, group, (minX + maxX) / 2, -0.32, (minZ + maxZ) / 2, maxX - minX, 0.2, maxZ - minZ, materials.rim.governance); plinth.userData.compound = 'courthouse';
  }
  // The command gate is one audited place, repeated physically at every workshop door.
  const guards = model.chambers.find(n => n.id === 'guards');
  if (guards) for (const bay of model.chambers.filter(n => n.form === 'bay')) {
    const post = new THREE.Group(); post.userData.component = guards.component; post.position.set(bay.door[0], 0, bay.door[1]); group.add(post);
    for (const x of [-0.7, 0.7]) box(THREE, materials, cube, post, x, 0.7, 0, 0.18, 1.4, 0.18);
    box(THREE, materials, cube, post, 0, 1.4, 0, 1.6, 0.15, 0.25, materials.ink);
  }
  for (const road of model.roads) { const mesh = buildRoad(THREE, road, materials); mesh.visible = visibleRoads(model.roads).includes(road); group.add(mesh); }
  if (model.fenceRadius) {
    const perimeter = new THREE.Group(); perimeter.userData.fence = true; group.add(perimeter);
    const gap = (model.chambers.find(n => n.id === 'land-gate').radius + STREETS.widths.avenue) / model.fenceRadius;
    for (let i = 0; i < CITY.arcSamples; i++) {
      const a = i / CITY.arcSamples * Math.PI * 2, b = (i + 1) / CITY.arcSamples * Math.PI * 2;
      if (Math.abs(Math.sin((a + b) / 2)) < gap) continue;
      const p = angle => [Math.sin(angle) * model.fenceRadius, 1.25, -Math.cos(angle) * model.fenceRadius];
      fence(THREE, materials, rod, perimeter, p(a), p(b), 1.6);
      const q = p(a); drum(THREE, materials, perimeter, q[0], 0.6, q[2], 0.13, 1.8);
    }
    // A thin model-white kerb makes the yard visible without a dark enclosing road.
    const yard = hoop(THREE, materials, perimeter, 0, STREETS.elevation, 0, STYLE.cellStep * 4, materials.status.sound); yard.rotation.x = Math.PI / 2;
  }
  const size = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs));
  const paving = new THREE.Group(); paving.userData.background = true; group.add(paving);
  const ground = box(THREE, materials, cube, paving, 0, STREETS.elevation - STREETS.thickness / 2 - 0.06, 0, size * 6, 0.12, size * 6, materials.ground); ground.userData.ground = true;
  return group;
}
