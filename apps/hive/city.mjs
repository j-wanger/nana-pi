/**
 * @module apps/hive/city.mjs
 * @purpose Checks the hand city and computes radial lots, clear street paths and shape diagnostics.
 * @inputs Component data, city plan and optional serve-only positions.
 * @outputs Named problems and deterministic places, streets, handoffs and district radii.
 * @effects none
 * @errors Throws when a street cannot be routed around a footprint.
 */
import { CITY, STYLE, CITY_DISTRICTS, CITY_FORMS, DENSITY, STREETS } from './config.mjs';
import { footprint } from './layout.mjs';
const fields = (v, allowed) => v && typeof v === 'object' && Object.keys(v).every(k => allowed.includes(k));
export function checkCityPlan(plan, components) {
  if (!fields(plan, ['contract', 'version', 'places', 'journey', 'roads', 'residents']) || plan.contract !== 'nana-city-plan' || plan.version !== 1 || !['places', 'journey', 'roads', 'residents'].every(k => Array.isArray(plan[k]))) return ['city: invalid hand source or contract'];
  const problems = [], ids = new Set(), placed = new Set(), audit = new Set(components.map(c => c.id)), visited = new Set();
  for (const n of plan.places) {
    if (!fields(n, ['id', 'name', 'district', 'bearing', 'form', 'component']) || !n.id || !n.name || !Number.isFinite(n.bearing)) problems.push(`${n?.id}: invalid hand source; no coordinate, radius or count`);
    if (ids.has(n.id)) problems.push(`${n.id}: duplicate place`); ids.add(n.id);
    if (!CITY_DISTRICTS.includes(n.district)) problems.push(`${n.id}: unknown district`);
    if (!CITY_FORMS.includes(n.form)) problems.push(`${n.id}: unknown form`);
    if (n.component) { if (placed.has(n.component)) problems.push(`${n.component}: duplicate placement`); placed.add(n.component); if (!audit.has(n.component)) problems.push(`${n.component}: not in audit`); }
  }
  if (plan.places.filter(n => n.form === 'bay').length !== CITY.bayCount) problems.push('bays: count differs from sealed capacity');
  for (const id of audit) if (!placed.has(id)) problems.push(`${id}: no place yet`);
  const place = (id, context) => { if (!ids.has(id)) problems.push(`${context}: unknown place ${id}`); };
  const visit = (id, context) => { if (!placed.has(id)) problems.push(`${context}: unknown component ${id}`); if (visited.has(id)) problems.push(`${id}: visited twice`); visited.add(id); };
  const chapters = new Set();
  for (const step of plan.journey) {
    if (!fields(step, ['id', 'place', 'component', 'visits', 'title', 'text']) || !Array.isArray(step.visits)) { problems.push('journey: invalid hand source'); continue; }
    if (chapters.has(step.id)) problems.push(`${step.id}: duplicate chapter`); chapters.add(step.id);
    if (step.place !== null) place(step.place, step.id);
    if (step.component) visit(step.component, step.id);
    for (const id of step.visits) { place(id, step.id); const n = plan.places.find(n => n.id === id); if (n?.component) visit(n.component, step.id); }
  }
  for (const id of placed) if (!visited.has(id)) problems.push(`${id}: not visited`);
  for (const road of plan.roads) { if (!fields(road, ['from', 'to', 'kind', 'chapter']) || !['forward', 'back', 'air'].includes(road.kind)) problems.push('road: invalid hand source'); place(road.from, 'road'); place(road.to, 'road'); if (road.kind === 'air' && !chapters.has(road.chapter)) problems.push('road: unknown chapter'); }
  for (const r of plan.residents) { if (!fields(r, ['kind', 'place'])) problems.push('resident: invalid hand source'); place(r.place, 'resident'); }
  return [...new Set(problems)];
}
export const structuralProblems = problems => problems.filter(s => !s.endsWith(': not in audit') && !s.endsWith(': no place yet'));
// Moved from component-graph-layout.mjs; both the page and geometric checks use these helpers.
export const roundPosition = n => Math.round(n / CITY.positionGrid) * CITY.positionGrid;
export function segmentDistance(n, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((n.x - a[0]) * dx + (n.z - a[1]) * dz) / length)) : 0;
  return Math.hypot(n.x - a[0] - t * dx, n.z - a[1] - t * dz);
}
const polar = (bearing, radius) => [roundPosition(Math.sin(bearing * Math.PI / 180) * radius), roundPosition(-Math.cos(bearing * Math.PI / 180) * radius)];
const pos = n => [n.x, n.z];
// The former visibility router, moved here and restricted to a district's side of the fence.
// Its vertices still skirt polygonal footprints; the spring and ellipse are gone.
export function route(a, b, nodes, accept = () => true) {
  const vertices = [a, b];
  for (const n of nodes) for (let i = 0; i < CITY.routingSides; i++) {
    const angle = i / CITY.routingSides * Math.PI * 2, radius = (n.radius + CITY.routingMargin) / Math.cos(Math.PI / CITY.routingSides);
    const p = [roundPosition(n.x + Math.cos(angle) * radius), roundPosition(n.z + Math.sin(angle) * radius)]; if (accept(p)) vertices.push(p);
  }
  const distance = vertices.map(() => Infinity), previous = [], visited = new Set(); distance[0] = 0;
  for (;;) {
    let u = -1; for (let i = 0; i < vertices.length; i++) if (!visited.has(i) && (u === -1 || distance[i] < distance[u])) u = i;
    if (u === -1 || !Number.isFinite(distance[u])) throw new Error('no clear city street');
    if (u === 1) break; visited.add(u);
    for (let v = 1; v < vertices.length; v++) {
      const mid = vertices[u].map((x, i) => (x + vertices[v][i]) / 2);
      if (visited.has(v) || !accept(mid) || nodes.some(n => segmentDistance(n, vertices[u], vertices[v]) < n.radius + CITY.positionGrid)) continue;
      const cost = distance[u] + Math.hypot(vertices[u][0] - vertices[v][0], vertices[u][1] - vertices[v][1]);
      if (cost < distance[v]) { distance[v] = cost; previous[v] = u; }
    }
  }
  const result = []; for (let i = 1; i !== undefined; i = previous[i]) result.unshift(vertices[i]); return result;
}
export function cityLayout(data, plan, overrides = {}) {
  const byComponent = new Map(data.components.map(c => [c.id, c]));
  const input = [...plan.places, ...data.components.filter(c => !plan.places.some(n => n.component === c.id)).map(c => ({ id: c.id, name: c.name, district: 'town', bearing: CITY.vacantBearing, form: 'hall', component: c.id, note: 'No place yet' }))];
  const places = input.map(n => {
    const c = byComponent.get(n.component), radius = footprint({ status: 'sound', features: c?.features ?? [] });
    const bay = n.form === 'bay' ? plan.places.filter(p => p.form === 'bay').findIndex(p => p.id === n.id) : -1;
    const status = c?.status ?? (bay >= 0 && bay < CITY.litBays && byComponent.has('workshop') ? 'sound' : ['tower', 'craft', 'customers'].includes(n.form) && !n.component ? 'sound' : 'absent');
    return { ...n, radius, y: 0, material: { status, kind: c?.kind ?? 'workflow' }, note: n.note ?? (n.component && !c ? 'Not in audit' : null) };
  });
  const park = places.filter(n => n.district === 'park' && !['tower', 'land-gate'].includes(n.id));
  const parkMass = park.reduce((s, n) => s + n.radius * 2 + CITY.clearance, 0);
  for (const [i, n] of park.entries()) {
    let r = CITY.parkBase + i % CITY.parkBands * CITY.radialStep + parkMass / (Math.PI * 2 * CITY.parkBands);
    let p = polar(n.bearing, r);
    while (park.slice(0, i).some(b => Math.hypot(b.x - p[0], b.z - p[1]) < b.radius + n.radius + CITY.clearance)) { r += CITY.bandGap; p = polar(n.bearing, r); }
    [n.x, n.z] = p;
  }
  const tower = places.find(n => n.id === 'tower'); Object.assign(tower, { x: 0, z: 0 });
  const fenceRadius = roundPosition(Math.max(...park.map(n => Math.hypot(n.x, n.z) + n.radius)) + CITY.fenceGap + park.length * CITY.positionGrid);
  const ringRadius = roundPosition(fenceRadius + CITY.ringGap);
  const town = places.filter(n => n.district === 'town');
  const townRadius = roundPosition(ringRadius + CITY.townGap + Math.sqrt(town.reduce((s, n) => s + n.radius * n.radius, 0) / Math.PI));
  for (const [i, n] of town.entries()) {
    let r = townRadius + n.radius + (i % 3) * CITY.bandGap, p = polar(n.bearing, r);
    while (town.slice(0, i).some(b => Math.hypot(b.x - p[0], b.z - p[1]) < b.radius + n.radius + CITY.clearance)) { r += CITY.bandGap; p = polar(n.bearing, r); }
    [n.x, n.z] = p;
  }
  const townOuterRadius = roundPosition(Math.max(...town.map(n => Math.hypot(n.x, n.z) + n.radius)) + CITY.bandGap);
  const gate = places.find(n => n.id === 'land-gate'); Object.assign(gate, { x: 0, z: -fenceRadius });
  let edge = townOuterRadius;
  for (const n of places.filter(n => n.district === 'edge')) { edge += n.radius * 2 + CITY.edgeGap; [n.x, n.z] = polar(n.bearing, edge); }
  for (const [i, n] of places.filter(n => n.district === 'outside').entries()) [n.x, n.z] = polar(n.bearing, edge + CITY.outsideGap + n.radius * 2 + i * CITY.bandGap);
  for (const n of places.filter(n => n.district === 'sky')) Object.assign(n, { x: tower.x, z: tower.z, y: CITY.skyHeight });
  const controlledPark = park.filter(n => n.component && overrides[n.component]).map(n => Math.hypot(...overrides[n.component]));
  const controlRing = controlledPark.length && Math.max(...controlledPark) - Math.min(...controlledPark) < CITY.positionGrid ? controlledPark[0] : null;
  for (const n of places) {
    const override = overrides[n.id] ?? overrides[n.component]; if (override) [n.x, n.z] = override;
    // Controls carry the 23 audited IDs. Unclaimed future bays follow their park's ring control too.
    else if (controlRing && n.district === 'park' && !n.component) [n.x, n.z] = polar(n.bearing, controlRing);
    const length = Math.hypot(n.x, n.z), direction = n.id === 'billboard' ? [0, -1] : length ? [-n.x / length, -n.z / length] : [-1, 0];
    n.face = direction;
    n.door = pos(n).map((v, i) => roundPosition(v + direction[i] * n.radius));
    n.front = pos(n).map((v, i) => roundPosition(v + direction[i] * (n.radius + CITY.frontage / 2)));
    n.bounds = { min: [n.x - n.radius, n.y - 0.5, n.z - n.radius], max: [n.x + n.radius, n.y + STYLE.beeHeight + 1, n.z + n.radius] };
  }
  const roads = [], handoffs = plan.roads.map(r => ({ ...r }));
  // Serve-only shape controls intentionally need not admit clear streets.
  const streetRoute = Object.keys(overrides).length ? (a, b) => [a, b] : route;
  const add = (id, from, to, path, kind = 'local', district = 'park', extra = {}) => { const r = { id, from, to, path, kind, class: kind === 'forward' ? 'avenue' : kind === 'air' ? 'air' : kind === 'back' ? 'back' : 'local', district, ...extra }; roads.push(r); return r; };
  const obstacles = places.filter(n => n.district !== 'sky');
  const parkObstacles = obstacles.filter(n => n.district === 'park');
  const hub = tower.front;
  const inside = p => Math.hypot(...p) < fenceRadius;
  const entryIn = [0, roundPosition(fenceRadius - CITY.ringGap)], entryOut = [0, roundPosition(fenceRadius + CITY.ringGap)];
  const northIn = gate.front, northOut = [0, roundPosition(-fenceRadius - gate.radius - CITY.frontage)];
  const ring = Array.from({ length: CITY.arcSamples }, (_, i) => polar(i * 360 / CITY.arcSamples, ringRadius));
  const ringIndex = n => (Math.round(n.bearing / 360 * CITY.arcSamples) % CITY.arcSamples + CITY.arcSamples) % CITY.arcSamples;
  const outside = p => Math.hypot(...p) >= fenceRadius + CITY.positionGrid;
  for (let i = 0; i < ring.length; i++) add(`ring-${i}`, 'ring', 'ring', [ring[i], ring[(i + 1) % ring.length]], 'local', 'town');
  // The journey street joins neighbouring halls, rather than drawing a spoke to every lot.
  const halls = places.filter(n => n.district === 'park' && n.id !== 'tower').sort((a, b) => a.bearing - b.bearing);
  for (const [i, n] of halls.entries()) {
    const next = halls[(i + 1) % halls.length];
    add(`local/${n.id}`, n.id, next.id, streetRoute(n.front, next.front, parkObstacles, inside), 'local', 'park');
  }
  const drafting = places.find(n => n.id === 'drafting');
  add('plaza-avenue', 'tower', 'drafting', streetRoute(hub, drafting.front, parkObstacles, inside), 'forward', 'park');
  add('entry-approach', 'yard', 'entry', streetRoute(hub, entryIn, parkObstacles, inside), 'forward');
  add('entry-crossing', 'entry', 'tower', [entryIn, entryOut], 'forward', 'town');
  // Entry and north gate are shared physical segments, not duplicate back-road crossings.
  add('gate-crossing', 'land-gate', 'customs', [northIn, northOut], 'forward', 'edge');
  for (const n of town) {
    const target = ring[ringIndex(n)]; add(`local/${n.id}`, 'ring', n.id, streetRoute(target, n.front, obstacles, outside), 'local', 'town');
  }
  const northRing = ring[0];
  add('north-link', 'ring', 'land-gate', streetRoute(northRing, northOut, obstacles.filter(n => n !== gate), outside), 'forward', 'edge');
  let prev = northOut, prevId = 'land-gate';
  for (const n of places.filter(n => ['edge', 'outside'].includes(n.district))) {
    const start = n.district === 'outside' && n.id !== 'customers' ? places.find(n => n.id === 'freight').front : prev;
    add(`freight/${n.id}`, prevId, n.id, streetRoute(start, n.front, obstacles, outside), 'forward', n.district);
    if (n.district === 'edge' || n.id === 'customers') { prev = n.front; prevId = n.id; }
  }
  // A back route uses the same entry, then the town ring. The separate dashes stay inside each district.
  add('findings/park', 'inspection', 'entry', streetRoute(places.find(n => n.id === 'inspection').front, entryIn, parkObstacles, inside), 'back', 'park');
  const theater = places.find(n => n.id === 'theater'), court = places.find(n => n.id === 'court');
  for (const n of [theater, court]) {
    const index = ringIndex(n), start = CITY.arcSamples / 2, step = index >= start ? 1 : -1;
    const path = [entryOut]; for (let i = start + step; i !== index + step; i += step) path.push(ring[(i + CITY.arcSamples) % CITY.arcSamples]); path.push(...streetRoute(ring[index], n.front, obstacles, outside).slice(1));
    add(`back/${n.id}`, 'entry', n.id, path, 'back', 'town');
  }
  for (const r of handoffs.filter(r => r.kind === 'air')) {
    const a = places.find(n => n.id === r.from), b = places.find(n => n.id === r.to);
    const path = Array.from({ length: CITY.arcSamples + 1 }, (_, i) => { const t = i / CITY.arcSamples; return [roundPosition(a.x + (b.x - a.x) * t), roundPosition(a.z + (b.z - a.z) * t)]; });
    const heights = path.map((_, i) => a.y * (1 - i / CITY.arcSamples) + b.y * i / CITY.arcSamples + Math.sin(i / CITY.arcSamples * Math.PI) * CITY.skyHeight);
    add(`${r.from}/${r.to}`, r.from, r.to, path, 'air', 'sky', { chapter: r.chapter, heights });
  }
  const model = { places, roads };
  for (const handoff of handoffs) {
    const from = places.find(n => n.id === handoff.from), to = places.find(n => n.id === handoff.to);
    if (handoff.kind === 'back' && from.district !== to.district) {
      const insidePlace = from.district === 'park' ? from : to, outsidePlace = from.district === 'park' ? to : from;
      const path = [...pathBetween(model, insidePlace, { front: entryIn }), ...[entryIn, entryOut].map(p => [p[0], 0, p[1]]), ...pathBetween(model, { front: entryOut }, outsidePlace)];
      handoff.path = from.district === 'park' ? path : path.reverse();
    } else handoff.path = pathBetween(model, from, to);
  }
  const edgeKey = (a, b) => [a.join(','), b.join(',')].sort().join('/');
  const avenue = new Set(handoffs.filter(r => r.kind === 'forward').flatMap(r => r.path.slice(1).map((b, i) => edgeKey([r.path[i][0], r.path[i][2]], [b[0], b[2]]))));
  for (const road of roads.filter(r => r.class === 'local')) if (road.path.slice(1).every((b, i) => avenue.has(edgeKey(road.path[i], b)))) { road.class = 'avenue'; road.kind = 'forward'; }
  const houses = townHouses({ places, roads, ringRadius, townOuterRadius });
  return { places, roads, houses, handoffs, fenceRadius, ringRadius, townOuterRadius, residents: plan.residents };
}
// Moved out of tour's closure for the city handoffs' second caller; model replaces its captured graph.
export function pathBetween(model, from, to) {
  if (!from || !to) return [];
  const direct = model.roads.find(r => r.class === 'air' && r.from === from.id && r.to === to.id);
  if (direct) return direct.path.map((p, i) => [p[0], direct.heights[i], p[1]]);
  const graph = new Map(), key = p => p.join(',');
  for (const road of model.roads.filter(r => r.class !== 'air')) for (let i = 1; i < road.path.length; i++) {
    const a = road.path[i - 1], b = road.path[i]; for (const [p, q] of [[a, b], [b, a]]) { if (!graph.has(key(p))) graph.set(key(p), []); graph.get(key(p)).push(q); }
  }
  const queue = [[from.front]], seen = new Set([key(from.front)]);
  while (queue.length) {
    const path = queue.shift(), last = path.at(-1); if (key(last) === key(to.front)) return path.map(p => [p[0], 0, p[1]]);
    for (const next of graph.get(key(last)) ?? []) if (!seen.has(key(next))) { seen.add(key(next)); queue.push([...path, next]); }
  }
  throw new Error(`missing tour street ${from.id}/${to.id}`);
}
export function visibleRoads(roads, chapter = null) { return roads.filter(r => r.class !== 'air' || r.chapter === chapter); }
// Houses follow local trays, not a global lattice. Deterministic setbacks and block gaps leave yards.
export function townHouses(model) {
  const houses = [], radius = Math.hypot(DENSITY.houseWidth, DENSITY.houseDepth) / 2;
  for (const [r, road] of model.roads.filter(r => r.id.startsWith('local/') && r.district === 'town').entries()) {
    for (let i = 1; i < road.path.length; i++) {
      const a = road.path[i - 1], b = road.path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const along = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
      for (const side of [-1, 1]) for (let d = radius; d < length - radius; d += DENSITY.houseStep + (Math.floor(d / DENSITY.houseStep) % 3 === 2 ? DENSITY.blockGap : 0)) {
        const setback = radius + DENSITY.setback + (1 + Math.sin(d + r)) / 2;
        const face = [along[1] * side, -along[0] * side];
        const x = roundPosition(a[0] + along[0] * d - face[0] * setback), z = roundPosition(a[1] + along[1] * d - face[1] * setback);
        if (Math.hypot(x, z) < model.ringRadius + radius || Math.hypot(x, z) > model.townOuterRadius - radius) continue;
        if ([...model.places, ...houses].some(n => Math.hypot(x - n.x, z - n.z) < n.radius + radius + CITY.frontage)) continue;
        if (model.roads.some(r => r.class !== 'air' && r.path.slice(1).some((b, i) => segmentDistance({ x, z }, r.path[i], b) < radius + STREETS.widths[r.class]))) continue;
        const index = houses.length, type = DENSITY.types[index % DENSITY.types.length];
        houses.push({ x, z, face, radius, type, street: road.id, height: DENSITY.houseHeight + (1 + Math.sin(index * 2.4)) / 2 * DENSITY.heightVariation });
      }
    }
  }
  return houses;
}
export function cityShapeProblems(model) {
  const problems = [], nodes = [...model.places.filter(n => n.component), ...(model.houses ?? [])], families = [];
  // Three equally spaced centres establish a row. Parallel rows away from the public axis establish a family.
  for (const [i, a] of nodes.entries()) for (const b of nodes.slice(i + 1)) {
    const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz); if (length < CITY.positionGrid) continue;
    const direction = [dx / length, dz / length]; if (direction[0] < -CITY.positionGrid || Math.abs(direction[0]) < CITY.positionGrid && direction[1] < 0) { direction[0] *= -1; direction[1] *= -1; }
    if (Math.abs(a.x * direction[1] - a.z * direction[0]) <= CITY.latticeTolerance) continue;
    const line = nodes.filter(n => Math.abs((n.x - a.x) * direction[1] - (n.z - a.z) * direction[0]) <= CITY.latticeTolerance).map(n => n.x * direction[0] + n.z * direction[1]).sort((x, y) => x - y);
    let row = false; for (let j = 0; j + 2 < line.length; j++) if (Math.abs(line[j + 1] - line[j] - (line[j + 2] - line[j + 1])) <= CITY.latticeSpacing) row = true;
    if (row && !families.some(d => Math.abs(d[0] * direction[1] - d[1] * direction[0]) <= CITY.latticeTolerance)) families.push(direction);
  }
  if (families.length > CITY.latticeFamilies) problems.push('lattice: parallel evenly spaced rows');
  const radii = new Set(model.places.filter(n => n.district === 'park' && !['yard', 'land-gate'].includes(n.id)).map(n => Math.round(Math.hypot(n.x, n.z) / CITY.radiusBandSize)));
  if (radii.size < CITY.minimumRadiusBands) problems.push('radius bands: park halls share one ring');
  // Historical oval controls span several radii too; they fail district-band separation, not the ring rule.
  if (model.places.some(n => n.district === 'town' && Math.hypot(n.x, n.z) - n.radius <= model.fenceRadius)) problems.push('radius bands: town lots occupy the park band');
  return problems;
}
