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
import { STYLE, STREETS, CITY, DENSITY, WORKERS, CARGO, RETURNS, PACKETS } from '../config.mjs';
import { box, drum, hoop, fence, outline, trayName, houseInstances, cargo, ribbon } from './parts.mjs';
import { buildRoad } from './road.mjs';
import { visibleRoads, pathBetween } from '../city.mjs';
// Moved from the request's inline mapping for its return-packet and ribbon callers.
function laneOffset(points, model, offset = STREETS.laneWidth / 2) {
  return points.map((p, i) => {
    const next = points[Math.min(i + 1, points.length - 1)], prev = points[Math.max(0, i - 1)];
    const dx = next[0] - prev[0], dz = next[2] - prev[2], length = Math.hypot(dx, dz) || 1;
    // Canonical orientation keeps opposing returns on the same side of a shared segment.
    const side = dx < 0 || dx === 0 && dz < 0 ? -1 : 1;
    const elevation = p[1] || (Math.abs(Math.hypot(p[0], p[2]) - model.ringRadius) < 0.1 ? STREETS.ringElevation : STREETS.elevation);
    return [p[0] + dz / length * offset * side, elevation + STREETS.thickness / 2, p[2] - dx / length * offset * side];
  });
}
export function emphasizeReturns(group, flows = []) {
  for (const o of group.children) if (o.userData.packet?.ribbonPacket) o.userData.packet.active = flows.includes(o.userData.packet.flows[0]);
  for (const o of group.children) if (o.userData.returnRibbon) {
    const opacity = flows.includes(o.userData.returnRibbon.flow) ? 1 : RETURNS.dimFraction;
    o.traverse(mesh => { if (mesh.isMesh) mesh.material.opacity = mesh.userData.trayName && opacity !== 1 ? 0 : opacity; });
  }
}
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
  for (const road of model.roads) {
    const mesh = road.class === 'air' ? new THREE.Group() : buildRoad(THREE, { ...road, ringRadius: model.ringRadius }, materials);
    mesh.userData.road = road.id; mesh.visible = visibleRoads(model.roads).includes(road); group.add(mesh);
  }
  const paintedSpans = new Set(), paintFrame = { number: -1, boxes: [] };
  for (const road of (model.handoffs ?? []).filter(r => r.kind !== 'forward')) {
    const object = new THREE.Group(), width = RETURNS.widthFraction * STREETS.laneWidth;
    const offset = road.built ? RETURNS.builtOffset : RETURNS.unbuiltOffset;
    const path = road.kind === 'air' ? pathBetween({ ...model, roads: model.roads.filter(r => r.class !== 'air') }, model.chambers.find(n => n.id === road.from), model.chambers.find(n => n.id === road.to)) : road.path;
    object.userData.returnRibbon = { flow: `${road.from}>${road.to}`, path, width, offset };
    const material = (road.built ? materials.ink : materials.windows.dark).clone(); material.transparent = true; material.opacity = RETURNS.dimFraction;
    const projection = { value: 1 }, minimum = { value: 0 }, viewport = new THREE.Vector2();
    material.onBeforeCompile = shader => {
      shader.uniforms.returnProjection = projection; shader.uniforms.returnMinimum = minimum;
      shader.vertexShader = 'attribute vec3 returnCentre; uniform float returnProjection; uniform float returnMinimum;\n' + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nvec3 offset = position - returnCentre; float depth = length((modelViewMatrix * vec4(returnCentre, 1.0)).xyz); transformed = returnCentre + offset * max(1.0, returnMinimum * depth / (returnProjection * ${width.toFixed(6)}));`);
    };
    material.customProgramCacheKey = () => 'ground-return';
    let nameSpan = 0, nameLength = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i], length = Math.hypot(...b.map((v, j) => v - a[j])); if (!length) continue;
      const spanKey = [a.join(), b.join()].sort().join('/');
      if (!paintedSpans.has(spanKey) && length > nameLength) { nameLength = length; nameSpan = i; }
      const [start, end] = laneOffset([a, b], model, offset * STREETS.laneWidth);
      const span = road.built ? length : STREETS.dashLength, step = road.built ? length : STREETS.dashLength + STREETS.dashGap;
      for (let d = 0; d < length; d += step) {
        const p = start.map((v, j) => v + (end[j] - v) * d / length), q = start.map((v, j) => v + (end[j] - v) * Math.min(length, d + span) / length);
        const flat = Math.hypot(q[0] - p[0], q[2] - p[2]);
        const mesh = ribbon(THREE, object, [p[0], p[2]], [q[0], q[2]], width, RETURNS.thickness, (p[1] + q[1]) / 2 + RETURNS.height, material);
        mesh.rotation.x = -Math.atan2(q[1] - p[1], flat); mesh.scale.z = Math.hypot(flat, q[1] - p[1]) / (flat || 1);
        mesh.userData.returnPiece = { dashed: !road.built };
        mesh.updateMatrix();
        const centre = new THREE.Vector3(), attr = mesh.geometry.attributes.position, centres = [];
        for (let vertex = 0; vertex < attr.count; vertex++) { centre.fromBufferAttribute(attr, vertex); centre.x = 0; centre.applyMatrix4(mesh.matrix); centres.push(...centre.toArray()); }
        mesh.geometry.setAttribute('returnCentre', new THREE.Float32BufferAttribute(centres, 3));
        mesh.onBeforeRender = (renderer, scene, camera) => { renderer.getSize(viewport); projection.value = viewport.y / (2 * Math.tan(camera.fov * Math.PI / 360)); minimum.value = material.opacity === 1 ? RETURNS.minimumPixels : 0; };
      }
    }
    if (nameSpan) {
      paintedSpans.add([path[nameSpan - 1].join(), path[nameSpan].join()].sort().join('/'));
      const [a, b] = laneOffset([path[nameSpan - 1], path[nameSpan]], model, offset * STREETS.laneWidth);
      const paint = trayName(THREE, object, `${road.from} to ${road.to}`); paint.renderOrder = group.children.length + 1;
      paint.scale.set((road.from.length + road.to.length + 4) * RETURNS.nameHeight / 3.5, RETURNS.nameHeight / 0.4, 1);
      paint.rotation.set(-Math.PI / 2, 0, 0);
      paint.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + RETURNS.height + RETURNS.thickness, (a[2] + b[2]) / 2);
      const base = paint.scale.clone(), origin = new THREE.Vector3(), cap = new THREE.Vector3(), view = new THREE.Vector2();
      const name = paint.userData.trayName, candidates = [paint.position.toArray(), ...path.slice(1).map((b, i) => {
        const [start, end] = laneOffset([path[i], b], model, offset * STREETS.laneWidth);
        return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + RETURNS.height + RETURNS.thickness, (start[2] + end[2]) / 2];
      })];
      paint.onBeforeRender = (renderer, scene, camera) => {
        if (!paint.material.opacity) return;
        if (paintFrame.number !== renderer.info.render.frame) { paintFrame.number = renderer.info.render.frame; paintFrame.boxes = []; }
        renderer.getSize(view);
        let best, score = Infinity;
        for (const candidate of candidates) {
          origin.set(...candidate).project(camera); cap.set(...candidate); cap.z += RETURNS.nameHeight; cap.project(camera);
          const pixels = Math.hypot((cap.x - origin.x) * view.x, (cap.y - origin.y) * view.y) / 2;
          const heightScale = Math.max(1, RETURNS.namePixels / (pixels || 1));
          cap.set(...candidate); cap.x += name.length * RETURNS.nameHeight; cap.project(camera);
          const widthPixels = Math.abs(cap.x - origin.x) * view.x / 2, widthScale = Math.max(1, name.length * RETURNS.namePixels / (widthPixels || 1));
          const w = widthPixels * widthScale, h = pixels * heightScale, x = (origin.x + 1) * view.x / 2, y = (1 - origin.y) * view.y / 2;
          const box = { left: x - w / 2, right: x + w / 2, top: y - h, bottom: y + h };
          const overlap = paintFrame.boxes.reduce((total, b) => total + Math.max(0, Math.min(box.right, b.right) - Math.max(box.left, b.left)) * Math.max(0, Math.min(box.bottom, b.bottom) - Math.max(box.top, b.top)), 0);
          const outside = Math.max(0, -box.left) + Math.max(0, box.right - view.x) + Math.max(0, -box.top) + Math.max(0, box.bottom - view.y);
          const cost = overlap + outside * w * h;
          if (cost < score) { score = cost; best = { candidate, box, heightScale, widthScale }; }
          if (!cost) break;
        }
        paint.position.set(...best.candidate); paint.scale.set(base.x * best.widthScale, base.y * best.heightScale, 1); paint.updateMatrixWorld();
        paintFrame.boxes.push(best.box);
      };
    }
    group.add(object);
  }
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
    const returnFlows = ['ladder>ledger', 'ledger>drafting'];
    const connector = [...(model.handoffs.find(r => r.from === 'ladder' && r.to === 'land-gate')?.path ?? [])].reverse();
    const returning = [...connector, ...returnFlows.flatMap(flow => model.handoffs.find(r => `${r.from}>${r.to}` === flow && r.built)?.path ?? [])];
    const builtReturns = group.children.filter(o => o.userData.returnRibbon && model.handoffs.some(r => r.built && `${r.from}>${r.to}` === o.userData.returnRibbon.flow));
    for (const [index, points] of [falling, journey, returning, ...builtReturns.map(o => o.userData.returnRibbon.path)].entries()) {
      const elevated = index ? laneOffset(points, model, index === 2 ? 0 : index > 2 ? RETURNS.builtOffset * STREETS.laneWidth : STREETS.laneWidth / 2) : points;
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(elevated.map(p => new THREE.Vector3(...p))), new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 1, gapSize: 0.6 })); line.computeLineDistances(); line.userData.signalTrace = true; group.add(line);
      const packet = cargo(THREE, materials, group, { lit: true, pallet: index !== 0 });
      const lengths = elevated.slice(1).map((p, i) => Math.hypot(...p.map((v, j) => v - elevated[i][j])));
      packet.userData.packet = { points: elevated, lengths, total: lengths.reduce((a, b) => a + b, 0), speed: 1 / WORKERS.loopSeconds, signal: index === 0, returning: index === 2, ribbonPacket: index > 2, flows: index === 2 ? returnFlows : index > 2 ? [builtReturns[index - 3].userData.returnRibbon.flow] : [] }; group.add(packet);
      // A single point draw carries a white packet with an ink rim and its fading wake.
      // The points remain on the sampled street; only their screen footprint is sealed.
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((PACKETS.trailSamples + 1) * 3), 3));
      geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(PACKETS.trailSamples + 1), 1));
      const marker = new THREE.Points(geometry, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
        uniforms: { minimumPixels: { value: PACKETS.minimumPixels }, pixelRatio: { value: 1 }, ink: { value: materials.ink.color }, paper: { value: materials.windows.lit.color } },
        vertexShader: 'attribute float alpha; varying float fade; uniform float minimumPixels; uniform float pixelRatio; void main() { fade = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = minimumPixels * pixelRatio * sqrt(alpha); }',
        fragmentShader: 'varying float fade; uniform vec3 ink; uniform vec3 paper; void main() { float radius = length(gl_PointCoord - vec2(0.5)); if (radius > 0.5) discard; gl_FragColor = vec4(mix(paper, ink, step(0.30, radius)), fade); }' }));
      marker.frustumCulled = false; marker.onBeforeRender = renderer => { marker.material.uniforms.pixelRatio.value = renderer.getPixelRatio(); };
      packet.add(marker); packet.userData.distanceMarker = marker;
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
      o.visible = p.active !== false && (frozen || (p.signal ? cycle < 0.2 : cycle >= 0.2));
      const marker = o.userData.distanceMarker, positions = marker.geometry.attributes.position, alpha = marker.geometry.attributes.alpha;
      marker.visible = true;
      for (let sample = 0; sample <= PACKETS.trailSamples; sample++) {
        const earlier = Math.max(0, cycle - sample / PACKETS.trailSamples * PACKETS.trailSeconds * p.speed);
        let distance = (frozen ? 0.15 : p.signal ? Math.min(1, earlier / 0.2) : Math.max(0, (earlier - 0.2) / 0.8)) * p.total;
        for (let i = 0; i < p.lengths.length; i++) {
          if (distance <= p.lengths[i] || i === p.lengths.length - 1) {
            const t = p.lengths[i] ? distance / p.lengths[i] : 0, point = p.points[i].map((v, j) => v + (p.points[i + 1][j] - v) * t);
            if (!sample) o.position.set(...point);
            positions.setXYZ(sample, point[0] - o.position.x, point[1] - o.position.y + CARGO.size, point[2] - o.position.z);
            alpha.setX(sample, sample && frozen ? 0 : 1 - sample / (PACKETS.trailSamples + 1)); break;
          }
          distance -= p.lengths[i];
        }
      }
      positions.needsUpdate = alpha.needsUpdate = true;
    }
    if (o.userData.broadcast) { const t = (phase * 0.15 + o.userData.broadcast.index / 3) % 1; o.scale.setScalar(1 + t * 4); }
  });
  group.traverse(o => { const mesh = o.userData.outlineOf; if (mesh) { o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale); o.visible = mesh.visible; } });
}
