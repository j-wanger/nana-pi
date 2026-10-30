/**
 * @module apps/hive/graph.mjs
 * @purpose Validates the sibling graph document at publisher and browser boundaries.
 * @inputs Component and graph documents.
 * @outputs One plain problem or null.
 * @effects none
 * @errors Invalid input returns a named problem.
 */
export function graphProblem(data, graph) {
  if (graph?.contract !== 'nana-component-graph' || graph.version !== 1) return 'incompatible graph contract';
  if (!Array.isArray(data?.components) || data.components.some(c => !c || typeof c.id !== 'string') || !Array.isArray(graph.nodes) || graph.nodes.some(n => !n || typeof n.id !== 'string') || graph.nodes.map(n => n.id).sort().join() !== data.components.map(c => c.id).sort().join()) return 'graph nodes must match the components';
  const ids = new Set(graph.nodes.map(n => n.id));
  if (!Array.isArray(graph.spine) || graph.spine.length < 3 || new Set(graph.spine).size !== graph.spine.length || graph.spine.some(id => !ids.has(id))) return 'graph spine is invalid';
  for (const n of graph.nodes) if (!['spine', 'support', 'gate', 'outside'].includes(n.role) || !Number.isFinite(n.x) || !Number.isFinite(n.z) || !Number.isFinite(n.radius) || n.radius <= 0 || (n.role === 'outside' ? n.stage !== 'outside' : !graph.spine.includes(n.stage))) return `graph node ${n.id} is invalid`;
  if (!Array.isArray(graph.edges) || !Array.isArray(graph.roads)) return 'graph edges and roads are required';
  for (const e of graph.edges) if (!e || !ids.has(e.from) || !ids.has(e.to) || e.from === e.to || !['import', 'artifact', 'join', 'feature', 'loop'].includes(e.source) || !Number.isInteger(e.count) || e.count < 1) return 'graph edge is invalid';
  for (const r of graph.roads) if (!r || !ids.has(r.from) || !ids.has(r.to) || !['loop', 'artifact', 'spur', 'import', 'feature'].includes(r.class) || !Array.isArray(r.sources) || !Array.isArray(r.path) || r.path.length < 2 || r.path.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite))) return 'graph road is invalid';
  return null;
}
