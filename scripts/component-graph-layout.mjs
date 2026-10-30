/**
 * @module scripts/component-graph-layout.mjs
 * @purpose Settles publish-time loop geometry and routes source roads around structure footprints.
 * @inputs Ordered nodes, counted edges and spine IDs.
 * @outputs Grid-rounded positions, typed road paths and crossing measurements.
 * @effects none
 * @errors Throws when no obstacle-free road can be routed.
 */
import { SPRING, LOOP_ELLIPSE, LOOP_SAMPLES, LOOP_START, LOOP_FRONTAGE, MAX_SPUR_LENGTH, ATTACH_DISTANCE, ATTACH_RADIUS, DEPOT, WORLD_HALF_EXTENT, POSITION_GRID, CLEARANCE, ROUTING } from './component-graph-config.mjs';
export const roundPosition = n => Math.round(n / POSITION_GRID) * POSITION_GRID;
const point = n => [n.x, n.z];
export function insidePolygon(p, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const a = polygon[i], b = polygon[j]; if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) inside = !inside; }
  return inside;
}
export function depotStage(nodes, edges, spine) {
  const outside = new Set(nodes.filter(n => n.role === 'outside').map(n => n.id)), scores = new Map();
  for (const edge of edges) {
    const id = outside.has(edge.from) ? edge.to : outside.has(edge.to) ? edge.from : null;
    const node = nodes.find(n => n.id === id), stage = node?.role === 'spine' ? node.id : node?.stage;
    if (spine.includes(stage)) scores.set(stage, (scores.get(stage) ?? 0) + edge.count);
  }
  return [...scores].sort((a, b) => b[1] - a[1] || spine.indexOf(a[0]) - spine.indexOf(b[0]))[0]?.[0] ?? spine.at(-1);
}
export function settle(input, edges, spine) {
  const arc = Array.from({ length: LOOP_SAMPLES + 1 }, (_, i) => {
    const a = LOOP_START + i / LOOP_SAMPLES * Math.PI * 2;
    return { x: Math.cos(a) * LOOP_ELLIPSE[0], z: Math.sin(a) * LOOP_ELLIPSE[1], length: 0 };
  });
  for (let i = 1; i < arc.length; i++) arc[i].length = arc[i - 1].length + Math.hypot(arc[i].x - arc[i - 1].x, arc[i].z - arc[i - 1].z);
  const slots = new Map(spine.map((id, i) => {
    const length = arc.at(-1).length * i / spine.length, end = arc.findIndex(p => p.length >= length), b = arc[Math.max(1, end)], a = arc[Math.max(1, end) - 1];
    const t = (length - a.length) / (b.length - a.length);
    return [id, { x: roundPosition(a.x + (b.x - a.x) * t), z: roundPosition(a.z + (b.z - a.z) * t) }];
  }));
  const yardStage = depotStage(input, edges, spine);
  const nodes = input.map(n => {
    let slot;
    if (n.role === 'outside') slot = { x: 0, z: 0 };
    else if (n.role === 'spine') slot = slots.get(n.id);
    else {
      const stage = slots.get(n.stage), siblings = input.filter(s => s.stage === n.stage && s.role !== 'spine'), i = siblings.findIndex(s => s.id === n.id);
      const depotNeighbour = n.stage === yardStage && input.some(n => n.role === 'outside');
      const angle = Math.atan2(stage.z, stage.x) + (i - (siblings.length - 1) / 2) * (depotNeighbour ? Math.PI : Math.PI / 3);
      const distance = ATTACH_DISTANCE;
      slot = { x: roundPosition(stage.x + Math.cos(angle) * distance), z: roundPosition(stage.z + Math.sin(angle) * distance) };
    }
    return { ...n, x: slot.x, z: slot.z, slot };
  });
  const pairs = new Map();
  for (const e of edges.filter(e => ['loop', 'artifact', 'join'].includes(e.source))) { const key = [e.from, e.to].sort().join('/'); pairs.set(key, { a: nodes.findIndex(n => n.id === e.from), b: nodes.findIndex(n => n.id === e.to), weight: roundPosition(1 + Math.log(1 + Math.min(e.count, SPRING.weightScale)) / Math.log(1 + SPRING.weightScale)) }); }
  let temperature = SPRING.temperature;
  for (let iteration = 0; iteration < SPRING.iterations; iteration++) {
    const forces = nodes.map(n => ({ x: -n.x * SPRING.centring, z: -n.z * SPRING.centring }));
    for (const [i, a] of nodes.entries()) for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]; if (a.role === 'outside' || b.role === 'outside') continue;
      const dx = a.x - b.x, dz = a.z - b.z, distance = Math.sqrt(dx * dx + dz * dz) || POSITION_GRID;
      const strength = SPRING.repulsion / (distance * distance);
      forces[i].x += dx / distance * strength; forces[i].z += dz / distance * strength; forces[j].x -= dx / distance * strength; forces[j].z -= dz / distance * strength;
    }
    for (const { a, b, weight } of pairs.values()) {
      if (nodes[a].role === 'outside' || nodes[b].role === 'outside') continue;
      const dx = nodes[b].x - nodes[a].x, dz = nodes[b].z - nodes[a].z, distance = Math.sqrt(dx * dx + dz * dz) || POSITION_GRID;
      const strength = (distance - SPRING.idealLength) / SPRING.idealLength * weight;
      forces[a].x += dx / distance * strength; forces[a].z += dz / distance * strength; forces[b].x -= dx / distance * strength; forces[b].z -= dz / distance * strength;
    }
    nodes.forEach((n, i) => {
      if (n.role === 'outside' || n.role === 'spine' || n.stage === yardStage) return;
      const strength = n.role === 'spine' ? SPRING.anchor : SPRING.attachment;
      const f = forces[i]; f.x += (n.slot.x - n.x) * strength; f.z += (n.slot.z - n.z) * strength;
      const length = Math.sqrt(f.x * f.x + f.z * f.z) || POSITION_GRID;
      n.x = roundPosition(Math.max(-WORLD_HALF_EXTENT, Math.min(WORLD_HALF_EXTENT, n.x + f.x / length * Math.min(temperature, length))));
      n.z = roundPosition(Math.max(-WORLD_HALF_EXTENT, Math.min(WORLD_HALF_EXTENT, n.z + f.z / length * Math.min(temperature, length))));
    });
    const polygon = spine.map(id => nodes.find(n => n.id === id));
    for (const n of nodes.filter(n => ['support', 'gate'].includes(n.role))) {
      const stage = nodes.find(s => s.id === n.stage), dx = n.x - stage.x, dz = n.z - stage.z;
      if (insidePolygon(n, polygon) || Math.sqrt(dx * dx + dz * dz) > ATTACH_RADIUS) { n.x = n.slot.x; n.z = n.slot.z; }
    }
    temperature *= SPRING.cooling;
  }
  // Fixed pair order, using the same footprint radius the renderer exposes.
  for (let pass = 0; pass < nodes.length; pass++) for (const [i, a] of nodes.entries()) for (const b of nodes.slice(i + 1)) {
    if (a.role === 'outside' || b.role === 'outside') continue;
    const dx = b.x - a.x, dz = b.z - a.z, distance = Math.sqrt(dx * dx + dz * dz) || POSITION_GRID, minimum = a.radius + b.radius + CLEARANCE;
    if (distance >= minimum || (a.role === 'outside' && b.role === 'outside')) continue;
    const move = minimum - distance + POSITION_GRID;
    const movable = b.role === 'spine' ? a : b, sign = movable === b ? 1 : -1;
    movable.x = roundPosition(movable.x + sign * dx / distance * move); movable.z = roundPosition(movable.z + sign * dz / distance * move);
  }
  const yard = nodes.filter(n => n.role === 'outside');
  if (yard.length) {
    const stage = nodes.find(n => n.id === yardStage);
    const supports = nodes.filter(n => n.stage === yardStage && n.role !== 'spine');
    const cluster = [...supports, ...yard], campus = nodes.filter(n => !cluster.includes(n));
    const radius = Math.max(...cluster.map(n => n.radius));
    // The large depot core faces its stage. Small depot lots flank that same driveway;
    // the stage's own supports occupy the fan's ends, never a second ring of spokes.
    const angles = supports.map((_, i) => supports.length === 1 ? -Math.PI / 3 : (i / (supports.length - 1) - 0.5) * Math.PI / 2);
    angles.push(...yard.map((_, i) => yard.length === 1 ? Math.PI / 3 : i === 0 ? 0 : (i % 2 ? -1 : 1) * Math.ceil(i / 2) * Math.PI / 9));
    let placed = false;
    for (let step = 0; step < DEPOT.searchSteps && !placed; step++) {
      const angle = Math.atan2(stage.z, stage.x) + (step % 2 ? 1 : -1) * Math.ceil(step / 2) * Math.PI * 2 / DEPOT.searchSteps;
      const candidates = cluster.map((n, i) => {
        const distance = stage.radius + n.radius + (n.radius === radius ? MAX_SPUR_LENGTH - POSITION_GRID : CLEARANCE + POSITION_GRID);
        return { ...n, x: roundPosition(stage.x + Math.cos(angle + angles[i]) * distance), z: roundPosition(stage.z + Math.sin(angle + angles[i]) * distance) };
      });
      if (candidates.some((n, i) => insidePolygon(n, spine.map(id => nodes.find(n => n.id === id))) || Math.max(Math.abs(n.x), Math.abs(n.z)) + n.radius > WORLD_HALF_EXTENT || [...campus, ...candidates.slice(i + 1)].some(c => Math.hypot(c.x - n.x, c.z - n.z) < c.radius + n.radius + CLEARANCE))) continue;
      candidates.forEach((n, i) => Object.assign(cluster[i], { x: n.x, z: n.z })); placed = true;
    }
    if (!placed) {
      // A different component inventory may not fit the preferred fan. Search the
      // same bounded short-spur annulus, largest foundations first.
      const ordered = [...cluster].sort((a, b) => b.radius - a.radius), chosen = [];
      const search = index => {
        if (index === ordered.length) return true;
        const n = ordered[index];
        for (let ring = 0; ring < DEPOT.searchSteps; ring++) for (let step = 0; step < DEPOT.searchSteps; step++) {
          const angle = Math.atan2(stage.z, stage.x) + (step % 2 ? 1 : -1) * Math.ceil(step / 2) * Math.PI * 2 / DEPOT.searchSteps;
          const distance = stage.radius + n.radius + CLEARANCE + POSITION_GRID + (MAX_SPUR_LENGTH - CLEARANCE - POSITION_GRID * 2) * ring / (DEPOT.searchSteps - 1);
          const p = { ...n, x: roundPosition(stage.x + Math.cos(angle) * distance), z: roundPosition(stage.z + Math.sin(angle) * distance) };
          if (insidePolygon(p, spine.map(id => nodes.find(n => n.id === id))) || [...campus, ...chosen].some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.radius + p.radius + CLEARANCE)) continue;
          chosen.push(p);
          if (search(index + 1)) return true;
          chosen.pop();
        }
        return false;
      };
      if (!search(0)) throw new Error('no clear short-spur depot yard');
      chosen.forEach(p => Object.assign(nodes.find(n => n.id === p.id), { x: p.x, z: p.z }));
    }
  }
  return nodes.map(({ slot, ...n }) => n);
}
export function segmentDistance(n, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((n.x - a[0]) * dx + (n.z - a[1]) * dz) / length)) : 0;
  return Math.hypot(n.x - a[0] - t * dx, n.z - a[1] - t * dz);
}
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const intersects = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < -POSITION_GRID && cross(c, d, a) * cross(c, d, b) < -POSITION_GRID;
export function crossings(roads) {
  const overview = roads.filter(r => ['loop', 'spur'].includes(r.class)); let count = 0, loop = 0;
  for (const [i, a] of overview.entries()) for (const b of overview.slice(i + 1)) for (let j = 1; j < a.path.length; j++) for (let k = 1; k < b.path.length; k++) if (intersects(a.path[j - 1], a.path[j], b.path[k - 1], b.path[k])) { count++; if (a.class === 'loop' || b.class === 'loop') loop++; }
  return { overview: count, loop };
}
function route(a, b, nodes, prior, loopFronts = null) {
  const obstacles = nodes.filter(n => n !== a && n !== b);
  // Existing road ends and bends are legal junctions: reuse a street rather than cross it.
  const streetEnd = n => {
    return loopFronts?.get(n.id) ?? point(n);
  };
  const vertices = [streetEnd(a), streetEnd(b), ...prior.flatMap(r => r.path).filter(p => obstacles.every(n => Math.hypot(n.x - p[0], n.z - p[1]) >= n.radius + POSITION_GRID))];
  for (const n of obstacles) for (let i = 0; i < ROUTING.sides; i++) {
    const angle = i / ROUTING.sides * Math.PI * 2, radius = (n.radius + ROUTING.margin) / Math.cos(Math.PI / ROUTING.sides);
    vertices.push([roundPosition(n.x + Math.cos(angle) * radius), roundPosition(n.z + Math.sin(angle) * radius)]);
  }
  const distance = vertices.map(() => Infinity), previous = [], visited = new Set(); distance[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < vertices.length; i++) if (!visited.has(i) && (u === -1 || distance[i] < distance[u])) u = i;
    if (u === -1 || !Number.isFinite(distance[u])) throw new Error(`no route for ${a.id}/${b.id}`);
    if (u === 1) break;
    visited.add(u);
    for (let v = 1; v < vertices.length; v++) {
      if (visited.has(v) || obstacles.some(n => segmentDistance(n, vertices[u], vertices[v]) < n.radius + POSITION_GRID)) continue;
      const hits = prior.reduce((count, road) => count + road.path.slice(1).filter((p, i) => intersects(vertices[u], vertices[v], road.path[i], p)).length, 0);
      const cost = distance[u] + Math.hypot(vertices[u][0] - vertices[v][0], vertices[u][1] - vertices[v][1]) + hits * ROUTING.crossingPenalty;
      if (cost < distance[v]) { distance[v] = cost; previous[v] = u; }
    }
  }
  const result = []; for (let i = 1; i !== undefined; i = previous[i]) result.unshift(vertices[i]);
  // A loop has one shared street junction beside each building; other roads end at the foundation edge.
  if (!loopFronts) for (const [index, next, node] of [[0, 1, a], [result.length - 1, result.length - 2, b]]) {
    const p = result[index], q = result[next], distance = Math.hypot(q[0] - p[0], q[1] - p[1]);
    result[index] = p.map((v, i) => roundPosition(v + (q[i] - v) * node.radius / distance));
  }
  return result;
}
export function roads(nodes, edges, spine) {
  const classes = ['loop', 'spur', 'artifact', 'import', 'feature'], pairs = new Map();
  const put = (a, b, source) => {
    const [from, to] = [a, b].sort(), id = `${from}/${to}`;
    if (!pairs.has(id)) pairs.set(id, { id, from, to, class: 'feature', sources: [] });
    const road = pairs.get(id), kind = source.source === 'join' ? 'artifact' : source.source;
    if (classes.indexOf(kind) < classes.indexOf(road.class)) road.class = kind;
    road.sources.push(source);
  };
  for (const edge of edges) put(edge.from, edge.to, edge);
  for (const n of nodes.filter(n => ['support', 'gate'].includes(n.role))) {
    put(n.id, n.stage, { from: n.stage, to: n.id, source: 'spur', count: 1, declared: true });
  }
  const outside = nodes.filter(n => n.role === 'outside');
  // The depot shares one driveway beside the stage with the strongest recorded relationship.
  const depot = depotStage(nodes, edges, spine);
  for (const n of outside) put(depot, n.id, { from: depot, to: n.id, source: 'spur', count: 1, declared: true });
  const ordered = [...pairs.values()].sort((a, b) => classes.indexOf(a.class) - classes.indexOf(b.class) || (a.id < b.id ? -1 : 1));
  const prior = [], stages = spine.map(id => nodes.find(n => n.id === id));
  // Offset toward the polygon's inward angle bisector, not toward its centre.
  // On the long sides of an oval, a radial offset would put the street under a building.
  const loopFronts = new Map(stages.map((n, i) => {
    const directions = [stages[(i + stages.length - 1) % stages.length], stages[(i + 1) % stages.length]].map(p => {
      const length = Math.hypot(p.x - n.x, p.z - n.z); return [(p.x - n.x) / length, (p.z - n.z) / length];
    });
    const dx = directions[0][0] + directions[1][0], dz = directions[0][1] + directions[1][1], length = Math.hypot(dx, dz);
    return [n.id, [roundPosition(n.x + dx / length * (n.radius + LOOP_FRONTAGE)), roundPosition(n.z + dz / length * (n.radius + LOOP_FRONTAGE))]];
  }));
  for (const road of ordered) {
    road.path = route(nodes.find(n => n.id === road.from), nodes.find(n => n.id === road.to), nodes, prior, road.class === 'loop' ? loopFronts : null);
    if (['loop', 'spur'].includes(road.class)) prior.push(road);
  }
  return ordered;
}
