/**
 * @module apps/hive/assets/hive.mjs
 * @purpose Assembles pickable city lots, complete forms, residents, streets and the two-opening park fence.
 * @inputs Explicit THREE namespace, world layout and shared materials.
 * @outputs A scene group with place, component, street and resident metadata.
 * @effects none
 * @errors None for valid layout.
 */
import { buildCell } from './cell.mjs';
import { buildDistrict, animateDistrict } from './district.mjs';
import { buildResident, buildWorkplace, animateResident, animateWorkplace } from './residents.mjs';
import { STYLE, STREETS, CITY, DENSITY, WORKERS, CARGO } from '../config.mjs';
import { box, drum, hoop, fence, outline, trayName, houseInstances, cargo } from './parts.mjs';
import { buildRoad } from './road.mjs';
import { visibleRoads } from '../city.mjs';
export function buildHive(THREE, model, materials) {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1), rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  for (const n of model.chambers) {
    const lot = new THREE.Group(); lot.position.set(n.x, n.y, n.z); lot.userData.place = n.id; lot.userData.component = n.component ?? n.id; group.add(lot);
    const form = buildDistrict(THREE, n, materials); lot.add(form);
    for (const cell of n.cells) { const mesh = buildCell(THREE, cell, materials, n.material.status, n.kind); mesh.position.set(cell.x - n.x, 0, cell.z - n.z); mesh.scale.setScalar(0.6); lot.add(mesh); }
    const residents = (model.residents ?? []).filter(r => r.place === n.id).flatMap(r => Array.from({ length: r.kind === 'builder' ? WORKERS.crewSize : r.kind === 'reviewer' ? 3 : 1 }, () => r));
    const jobs = { drafting: 'runner', yard: 'dispatcher', 'land-gate': 'gatekeeper', customs: 'customs', freight: 'driver', utilities: 'mechanic', court: 'clerk' };
    if (jobs[n.id]) residents.push({ kind: jobs[n.id], place: n.id });
    for (const [i, resident] of residents.entries()) {
      if (n.material.status === 'absent' || resident.kind === 'builder' && n.material.status !== 'sound') continue;
      const role = resident.kind, figure = buildResident(THREE, materials, role); figure.userData.resident = resident; figure.userData.index = i;
      let x = (i - (residents.length - 1) / 2) * 1.2, y = 0, z = n.radius * 0.72 + 0.9;
      if (role === 'gatekeeper') { x = -1.5; z = n.radius * 0.78; }
      if (role === 'customs') { x = -1.7; y = 0.66; z = n.radius * DENSITY.footprint * 0.6 + 0.9; }
      if (role === 'planner') x = -0.9;
      if (role === 'adversary') x = 0.9;
      if (role === 'owner') { x = 0; y = CITY.skyHeight; z = 0; }
      if (role === 'seat') { x = 0; y = 7.1; z = n.radius * 0.72; }
      if (role === 'builder' || role === 'runner') {
        y = role === 'builder' ? 0.2 : 0; z = n.radius * 0.65; figure.userData.stride = n.radius * 0.06;
        if (i === 0 || role === 'runner') {
          const route = model.handoffs?.find(r => r.from === (role === 'runner' ? 'drafting' : 'yard') && r.to === (role === 'runner' ? 'yard' : n.id))?.path;
          // Remain on the drawn frontage route; never cut from a door through a wall to a home pose.
          if (route) figure.userData.carryPath = route.map((p, j) => { const next = route[Math.min(j + 1, route.length - 1)], prev = route[Math.max(0, j - 1)], dx = next[0] - prev[0], dz = next[2] - prev[2], length = Math.hypot(dx, dz) || 1; return [p[0] - n.x - dz / length * STREETS.laneWidth / 2, STREETS.elevation + STREETS.thickness / 2, p[2] - n.z + dx / length * STREETS.laneWidth / 2]; });
        }
      }
      if (role === 'reviewer') { x = (i - 1) * n.radius * DENSITY.footprint * 0.4; y = 1.72 + i * 1.15; z = n.radius * DENSITY.footprint * 0.5; figure.userData.startRung = i + 1; figure.userData.rungWidth = n.radius * DENSITY.footprint * 0.4; }
      figure.position.set(x, y, z); figure.userData.home = figure.position.toArray(); lot.add(figure);
      const workplace = buildWorkplace(THREE, materials, role); workplace.position.copy(figure.position);
      if (role === 'reviewer') { workplace.position.x = n.radius * DENSITY.footprint * 0.8; workplace.position.y = 5.17; }
      lot.add(workplace);
    }
    if (n.district !== 'sky' && n.front) {
      const mouth = new THREE.Group(); mouth.position.set(n.front[0] - n.x, STREETS.elevation + STREETS.thickness / 2, n.front[1] - n.z); mouth.rotation.y = Math.atan2(n.face[0], n.face[1]); lot.add(mouth);
      for (const side of [-1, 1]) { const post = box(THREE, materials, cube, mouth, side * 1.1, 0.6, 0, 0.3, 1.2, 0.5); outline(THREE, post); }
      outline(THREE, box(THREE, materials, cube, mouth, 0, 1.25, 0, 2.5, 0.15, 0.65));
      outline(THREE, box(THREE, materials, cube, mouth, 0, -STREETS.thickness / 2, 2, STREETS.widths.avenue, STREETS.thickness, 4));
      mouth.userData.gatehouse = true; trayName(THREE, mouth, n.name);
    }
    lot.userData.labelHeight = n.form === 'tower' ? n.bounds.max[1] : new THREE.Box3().setFromObject(lot).max.y;
  }
  if (model.townOuterRadius) {
    const housing = new THREE.Group(); housing.userData.housing = true; group.add(housing);
    houseInstances(THREE, materials, cube, housing, model.houses ?? []);
    const locals = model.roads.filter(r => r.id.startsWith('local/') && r.path.length > 1);
    for (const road of locals.filter((_, i) => i % WORKERS.townStride === 0)) {
      const walker = buildResident(THREE, materials, 'walker'); walker.userData.townResident = true;
      walker.userData.carryPath = road.path.map(p => [p[0], (Math.abs(Math.hypot(...p) - model.ringRadius) < 0.1 ? STREETS.ringElevation : STREETS.elevation) + STREETS.thickness / 2, p[1]]);
      walker.userData.home = walker.userData.carryPath[0]; housing.add(walker);
    }
  }
  // A loaded truck follows the same declared review-to-gate-to-customs tray.
  const outbound = ['ladder', 'land-gate', 'customs'];
  const truckPath = outbound.slice(1).flatMap((id, i) => model.handoffs?.find(r => r.from === outbound[i] && r.to === id)?.path ?? []);
  if (truckPath.length > 1) {
    const truck = cargo(THREE, materials, group, { truck: true });
    const points = truckPath.map(p => [p[0], p[2]]), lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    truck.userData.outbound = true;
    truck.userData.traffic = { points, lengths, elevations: points.map(() => STREETS.elevation), lane: STREETS.laneWidth / 2, side: 1, truck: true };
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
  for (const road of model.roads) { const mesh = buildRoad(THREE, { ...road, ringRadius: model.ringRadius }, materials); mesh.visible = visibleRoads(model.roads).includes(road); group.add(mesh); }
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
      const elevated = points.map((p, i) => { const next = points[Math.min(i + 1, points.length - 1)], dx = next[0] - p[0], dz = next[2] - p[2], length = Math.hypot(dx, dz) || 1; const elevation = Math.abs(Math.hypot(p[0], p[2]) - model.ringRadius) < 0.1 ? STREETS.ringElevation : STREETS.elevation; return index ? [p[0] + dz / length * STREETS.laneWidth / 2, elevation + STREETS.thickness / 2, p[2] - dx / length * STREETS.laneWidth / 2] : p; });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(elevated.map(p => new THREE.Vector3(...p))), new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 1, gapSize: 0.6 })); line.computeLineDistances(); line.userData.signalTrace = true; group.add(line);
      const packet = cargo(THREE, materials, group, { lit: true, pallet: index !== 0 });
      const lengths = elevated.slice(1).map((p, i) => Math.hypot(...p.map((v, j) => v - elevated[i][j])));
      packet.userData.packet = { points: elevated, lengths, total: lengths.reduce((a, b) => a + b, 0), speed: 1 / WORKERS.loopSeconds, signal: index === 0 }; group.add(packet);
    }
    const theater = model.chambers.find(n => n.id === 'theater');
    if (theater && theater.material.status !== 'absent') for (let i = 0; i < 3; i++) {
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
  if (frozen) phase = 0;
  group.traverse(o => {
    if (o.userData.role) animateResident(o, phase, frozen);
    if (o.userData.workplace) animateWorkplace(o, phase, frozen);
    if (o.userData.mechanism) animateDistrict(o, phase, frozen);
    const traffic = o.userData.traffic;
    if (traffic) {
      const { points, lengths, elevations, lane, side, truck } = traffic;
      const t = (phase / WORKERS.loopSeconds % 1 + 1) % 1;
      let distance = (side > 0 ? t : 1 - t) * lengths.reduce((a, b) => a + b, 0);
      for (let i = 0; i < lengths.length; i++) {
        if (distance <= lengths[i] || i === lengths.length - 1) {
          const a = points[i], b = points[i + 1], f = distance / (lengths[i] || 1), dx = b[0] - a[0], dz = b[1] - a[1], length = lengths[i] || 1;
          o.position.set(a[0] + dx * f + dz / length * lane, elevations[i] + (elevations[i + 1] - elevations[i]) * f + STREETS.thickness / 2 + (truck ? CARGO.palletHeight : 0), a[1] + dz * f - dx / length * lane);
          o.rotation.y = Math.atan2(dx * side, dz * side); break;
        }
        distance -= lengths[i];
      }
      if (truck) o.children.find(c => c.userData.crate).visible = side > 0;
    }
    if (o.userData.signalTrace) o.visible = frozen;
    const p = o.userData.packet;
    if (p) {
      const cycle = phase * p.speed % 1;
      o.visible = frozen || (p.signal ? cycle < 0.2 : cycle >= 0.2);
      let distance = (frozen ? 0.15 : p.signal ? Math.min(1, cycle / 0.2) : Math.max(0, (cycle - 0.2) / 0.8)) * p.total;
      for (let i = 0; i < p.lengths.length; i++) {
        if (distance <= p.lengths[i] || i === p.lengths.length - 1) { const t = p.lengths[i] ? distance / p.lengths[i] : 0; o.position.set(...p.points[i].map((v, j) => v + (p.points[i + 1][j] - v) * t)); break; }
        distance -= p.lengths[i];
      }
    }
    if (o.userData.broadcast) { const t = (phase * 0.15 + o.userData.broadcast.index / 3) % 1; o.scale.setScalar(1 + t * 4); }
  });
  group.traverse(o => { const mesh = o.userData.outlineOf; if (mesh) { o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale); o.visible = mesh.visible; } });
}
