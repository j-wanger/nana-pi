/**
 * @module apps/hive/assets/hive.mjs
 * @purpose Assembles original architectural structures, feature decks and activity into a pickable city.
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
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  const box = (parent, x, y, z, w, h, d, mat = materials.status.sound) => {
    const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const beam = (parent, a, b, thickness, mat = materials.rim.workflow) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const mesh = new THREE.Mesh(rod, mat); mesh.position.copy(start.add(end).multiplyScalar(0.5)); mesh.scale.set(thickness, delta.length(), thickness); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const fence = (parent, a, b) => {
    beam(parent, a, b, 0.018);
    const length = Math.hypot(...a.map((v, i) => v - b[i]));
    for (let t = 0; t <= 1; t += 1 / Math.ceil(length * 2)) {
      const p = a.map((v, i) => v + (b[i] - v) * t); beam(parent, [p[0], p[1] - 0.35, p[2]], p, 0.016);
    }
  };
  // Buildings use normalized architectural dimensions: a deck, a bay, a column and a floor.
  for (const [index, c] of model.chambers.entries()) {
    const chamber = new THREE.Group(); chamber.userData.component = c.id; group.add(chamber);
    const building = new THREE.Group(); building.position.set(c.x, 0, c.z); chamber.add(building);
    const r = c.radius * 0.78, height = STYLE.structureHeight;
    box(building, 0, -0.25, 0, r * 2.25, 0.35, r * 2.25, materials.rim[c.kind]);
    box(building, 0, -0.04, 0, r * 2.08, 0.08, r * 2.08);
    // The data's feature cells remain the foundations, including their exact fill ratios.
    for (const cell of c.cells) { const mesh = buildCell(THREE, cell, materials, c.material.status, c.kind); mesh.position.set(cell.x, 0, cell.z); mesh.scale.y = 0.15; chamber.add(mesh); }
    for (const activity of c.bees) { const bee = buildBee(THREE, materials); bee.scale.setScalar(STYLE.beeScale); bee.userData.bee = { ...activity, x: c.x, z: c.z }; chamber.add(bee); }
    if (c.material.status === 'absent') {
      // No invented building for a missing component: only excavated footings and survey stakes.
      box(building, 0, 0.06, 0, r * 1.65, 0.08, r * 1.65, materials.dark);
      for (const x of [-r, r]) for (const z of [-r, r]) {
        box(building, x, 0.16, z, 0.45, 0.3, 0.45); box(building, x, 0.7, z, 0.045, 1, 0.045, materials.ink);
      }
      for (const x of [-r, r]) beam(building, [x, 0.4, -r], [x, 0.4, r], 0.025);
      continue;
    }
    const open = c.material.status === 'gap';
    if (c.kind === 'governance') {
      // Civic gatehouses: twin service cores, a traversable lintel, and a colonnaded porch.
      for (const x of [-r * 0.7, r * 0.7]) {
        box(building, x, height * 0.4, 0, r * 0.5, height * 0.8, r * 1.25, materials.status[c.material.status]);
        for (let floor = 1; floor <= 7; floor++) {
          box(building, x, floor * height / 9, r * 0.635, r * 0.54, 0.12, 0.16);
          for (let j = -1; j <= 1; j++) box(building, x + j * r * 0.14, floor * height / 9 + 0.22, r * 0.637, r * 0.09, 0.25, 0.035, materials.ink);
        }
        box(building, x, height * 0.84, 0, r * 0.6, 0.22, r * 1.4);
      }
      box(building, 0, height * 0.68, 0, r * 1.9, 0.35, r * 1.45);
      fence(building, [-r, height * 0.68 + 0.5, r * 0.72], [r, height * 0.68 + 0.5, r * 0.72]);
      for (let i = -3; i <= 3; i++) {
        box(building, i * r / 3, height * 0.2, r * 0.95, 0.12, height * 0.4, 0.12);
        box(building, i * r / 3, height * 0.41, r * 0.95, 0.24, 0.12, 0.24);
      }
      box(building, 0, height * 0.44, r * 0.9, r * 2.2, 0.18, r * 0.6);
      for (let i = 0; i < 8; i++) box(building, 0, 0.08 + i * 0.07, r * (1.15 - i * 0.045), r * 1.8, 0.14, r * 0.12);
    } else {
      // Workshop: production decks and a crane. Library: open archive racks and a service tower.
      const floors = open ? 6 : 4;
      for (let floor = 0; floor < floors; floor++) {
        const y = 0.45 + floor * height / (floors + 1);
        box(building, 0, y, 0, r * 2, 0.13, r * 1.7, open ? materials.dark : materials.status.sound);
        for (const x of [-r, r]) for (const z of [-r * 0.85, r * 0.85]) box(building, x, y + 0.55, z, 0.11, height / (floors + 1), 0.11);
        for (let bay = -3; bay <= 3; bay++) {
          const x = bay * r / 3.6;
          box(building, x, y + 0.3, -r * 0.45, r * 0.17, 0.48, r * 0.45, materials.status[c.material.status]);
          for (let shelf = 0; shelf < 3; shelf++) box(building, x, y + 0.2 + shelf * 0.15, -r * 0.2, r * 0.15, 0.04, 0.035, materials.ink);
          if (!open) box(building, x, y + 0.24, r * 0.3, r * 0.2, 0.35, r * 0.35, materials.rim.workflow);
        }
        fence(building, [-r, y + 0.45, r * 0.86], [r, y + 0.45, r * 0.86]);
        beam(building, [-r, y, -r * 0.85], [-r, y + height / (floors + 1), r * 0.85], 0.025);
        beam(building, [r, y, r * 0.85], [r, y + height / (floors + 1), -r * 0.85], 0.025);
      }
      box(building, r * 0.65, height * 0.42, -r * 0.5, r * 0.45, height * 0.84, r * 0.5, materials.status[c.material.status]);
      for (let i = 0; i < 22; i++) box(building, -r * 0.8, 0.4 + i * 0.23, -r * 0.9, 0.34, 0.04, 0.22, materials.ink);
      // Freestanding lattice crane, with diagonal bracing and a suspended hook.
      const x = r * 0.8, z = r * 0.9;
      for (const dx of [-0.15, 0.15]) for (const dz of [-0.15, 0.15]) box(building, x + dx, height * 0.45, z + dz, 0.035, height * 0.9, 0.035, materials.ink);
      for (let y = 0.3; y < height * 0.85; y += 0.5) {
        beam(building, [x - 0.15, y, z + 0.15], [x + 0.15, y + 0.5, z + 0.15], 0.016, materials.ink);
        beam(building, [x + 0.15, y, z - 0.15], [x - 0.15, y + 0.5, z - 0.15], 0.016, materials.ink);
      }
      box(building, 0, height * 0.89, z, r * 2, 0.1, 0.2, materials.ink);
      beam(building, [-r * 0.8, height * 0.89, z], [x, height, z], 0.025);
      beam(building, [-r * 0.7, height * 0.89, z], [-r * 0.7, height * 0.5, z], 0.018, materials.ink);
    }
    // Every part gets its chapter from the ancestor group, including crane and deck picks.
    building.rotation.y = index % 2 ? Math.PI / 2 : 0;
  }
  const works = model.chambers.filter(c => c.kind === 'workflow');
  // Elevated walkways connect structures; paths depict adjacency, not a claimed data dependency.
  for (let i = 1; i < works.length; i++) {
    const a = works[i - 1], b = works[i], y = 1.1;
    beam(group, [a.x, y, a.z], [b.x, y, b.z], 0.22);
    for (const side of [-0.26, 0.26]) fence(group, [a.x + side, y + 0.45, a.z], [b.x + side, y + 0.45, b.z]);
  }
  const homes = model.chambers.filter(c => c.kind === 'governance');
  if (homes.length) {
    const radius = Math.hypot(homes[0].x, homes[0].z);
    const ring = new THREE.Group(); group.add(ring);
    // A continuous perimeter houses the governance structures around the workflow campus.
    for (let i = 0; i < 96; i++) {
      const angle = i / 96 * Math.PI * 2;
      const bay = new THREE.Group(); bay.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius); bay.rotation.y = angle; ring.add(bay);
      box(bay, 0, 0.85, 0, radius * Math.PI / 47, 0.18, 1.1);
      box(bay, 0, 0.35, 0, 0.12, 0.8, 0.75);
      box(bay, 0, 1.2, 0.5, 0.045, 0.65, 0.045);
      box(bay, 0, 1.52, 0.5, radius * Math.PI / 47, 0.045, 0.045);
      if (i % 4 === 0) box(bay, 0, 0.2, -0.5, 0.45, 0.4, 0.4, materials.ink);
    }
  }
  const size = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs));
  box(group, 0, -0.55, 0, size * 2.5, 0.12, size * 2.5, materials.ground);
  return group;
}
