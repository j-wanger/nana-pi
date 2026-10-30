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
import { STYLE, STREETS, CITY, DENSITY } from '../config.mjs';
import { box, drum, hoop, fence } from './parts.mjs';
import { buildRoad } from './road.mjs';
import { visibleRoads, segmentDistance } from '../city.mjs';
export function buildHive(THREE, model, materials) {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1), rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  for (const n of model.chambers) {
    const lot = new THREE.Group(); lot.position.set(n.x, n.y, n.z); lot.userData.place = n.id; lot.userData.component = n.component ?? n.id; group.add(lot);
    const form = buildDistrict(THREE, n, materials); lot.add(form);
    for (const cell of n.cells) { const mesh = buildCell(THREE, cell, materials, n.material.status, n.kind); mesh.position.set(cell.x - n.x, 0, cell.z - n.z); mesh.scale.setScalar(0.6); lot.add(mesh); }
    for (const activity of n.bees) {
      const worker = buildResident(THREE, materials); worker.userData.worker = activity;
      const angle = activity.index / Math.max(1, n.bees.length) * Math.PI * 2;
      worker.position.set(Math.cos(angle) * n.radius * 0.3, 0, Math.sin(angle) * n.radius * 0.3); if (n.form === 'bay') worker.position.set(Math.cos(angle) * n.radius * 0.3, 0.2, n.radius * 0.55); worker.userData.home = worker.position.toArray(); worker.userData.stride = n.radius * 0.2; lot.add(worker);
    }
    for (const [i, resident] of (model.residents ?? []).filter(r => r.place === n.id).entries()) {
      if (resident.kind === 'builder' && n.material.status !== 'sound') continue;
      const figure = buildResident(THREE, materials); figure.userData.resident = resident;
      figure.position.set((i - 0.5) * 0.8, resident.kind === 'owner' ? CITY.skyHeight : 0, n.radius * 0.3);
      if (resident.kind === 'builder') { figure.position.set((i - 0.5) * 0.8, 0.2, n.radius * 0.55); figure.userData.home = figure.position.toArray(); figure.userData.stride = n.radius * 0.2; }
      lot.add(figure);
    }
    lot.userData.labelHeight = n.form === 'tower' ? n.bounds.max[1] : new THREE.Box3().setFromObject(lot).max.y;
  }
  if (model.townOuterRadius) {
    const housing = new THREE.Group(); housing.userData.housing = true; group.add(housing);
    const radius = Math.hypot(DENSITY.houseWidth, DENSITY.houseDepth) / 2;
    for (let x = -model.townOuterRadius; x < model.townOuterRadius; x += DENSITY.houseStep) for (let z = -model.townOuterRadius; z < model.townOuterRadius; z += DENSITY.houseStep) {
      const distance = Math.hypot(x, z);
      if (distance < model.ringRadius + radius || distance > model.townOuterRadius - radius) continue;
      if (model.chambers.some(n => Math.hypot(x - n.x, z - n.z) < n.radius + radius + CITY.frontage)) continue;
      if (model.roads.some(r => r.class !== 'air' && r.path.slice(1).some((b, i) => segmentDistance({ x, z }, r.path[i], b) < radius + STREETS.widths[r.class]))) continue;
      const h = DENSITY.houseHeight + Math.abs(Math.round(x + z)) % DENSITY.heightVariation;
      box(THREE, materials, cube, housing, x, h / 2, z, DENSITY.houseWidth, h, DENSITY.houseDepth, materials.status.sound);
      box(THREE, materials, cube, housing, x, h, z, DENSITY.houseWidth + 0.3, 0.2, DENSITY.houseDepth + 0.3, materials.rim.workflow);
      for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) box(THREE, materials, cube, housing, x + i * 2, h * 0.6, z + side * DENSITY.houseDepth / 2, 0.8, 1, 0.05, materials.windows.dark);
    }
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
  const tower = model.chambers.find(n => n.id === 'tower');
  if (tower) {
    // The owner's craft is a prop, never a named lot or a chapter-sized building.
    drum(THREE, materials, group, tower.x, CITY.skyHeight, tower.z, tower.radius * 0.5, 0.5, materials.ink, tower.radius * 0.25);
    const falling = [[tower.x, CITY.skyHeight, tower.z], [tower.x, 9, tower.z]];
    const sequence = ['tower', 'drafting', 'yard', 'bay-1', 'inspection', 'ladder', 'land-gate', 'customs', 'freight', 'customers'];
    const journey = sequence.slice(1).flatMap((id, i) => model.handoffs.find(r => r.from === sequence[i] && r.to === id)?.path ?? []);
    for (const [index, points] of [falling, journey].entries()) {
      const elevated = points.map(p => [p[0], p[1] + (index ? 0.4 : 0), p[2]]);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(elevated.map(p => new THREE.Vector3(...p))), new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 1, gapSize: 0.6 })); line.computeLineDistances(); line.userData.signalTrace = true; group.add(line);
      const packet = new THREE.Mesh(new THREE.SphereGeometry(index ? 0.65 : 0.5, 8, 6), materials.windows.lit);
      const lengths = elevated.slice(1).map((p, i) => Math.hypot(...p.map((v, j) => v - elevated[i][j])));
      packet.userData.packet = { points: elevated, lengths, total: lengths.reduce((a, b) => a + b, 0), speed: index ? 0.025 : 0.3 }; group.add(packet);
    }
    const theater = model.chambers.find(n => n.id === 'theater');
    if (theater) for (let i = 0; i < 3; i++) {
      const ring = hoop(THREE, materials, group, theater.x, 5, theater.z, theater.radius, materials.windows.half); ring.rotation.x = Math.PI / 2;
      ring.userData.broadcast = { index: i }; group.add(ring);
    }
  }
  const size = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs));
  const paving = new THREE.Group(); paving.userData.background = true; group.add(paving);
  const ground = box(THREE, materials, cube, paving, 0, STREETS.elevation - STREETS.thickness / 2 - 0.06, 0, size * 6, 0.12, size * 6, materials.ground); ground.userData.ground = true;
  return group;
}
export function animateHive(group, phase, frozen) {
  group.traverse(o => {
    if (o.userData.signalTrace) o.visible = frozen;
    const p = o.userData.packet;
    if (p) {
      let distance = ((phase * p.speed + 0.15) % 1) * p.total;
      for (let i = 0; i < p.lengths.length; i++) {
        if (distance <= p.lengths[i] || i === p.lengths.length - 1) { const t = p.lengths[i] ? distance / p.lengths[i] : 0; o.position.set(...p.points[i].map((v, j) => v + (p.points[i + 1][j] - v) * t)); break; }
        distance -= p.lengths[i];
      }
    }
    if (o.userData.broadcast) { const t = (phase * 0.15 + o.userData.broadcast.index / 3) % 1; o.scale.setScalar(1 + t * 4); }
    if (o.userData.home) { o.position.x = o.userData.home[0] + Math.sin(phase) * o.userData.stride; o.rotation.y = Math.cos(phase) >= 0 ? Math.PI / 2 : -Math.PI / 2; }
  });
}
