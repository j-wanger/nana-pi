/**
 * @module apps/hive/tour.mjs
 * @purpose Computes numbered loop chapters and road-following camera poses for scroll progress.
 * @inputs Published layout and graph, chapter progress, aspect and reduced-motion flag.
 * @outputs Ordered chapter anchors, walks, hash progress and camera poses.
 * @effects none
 * @errors Throws for missing chapter roads.
 */
import { focus, overview } from './camera.mjs';
export function tour(model, graph) {
  const chapters = [{ id: 'overview', number: '00', component: null, model, walk: [] }];
  for (const [i, id] of graph.spine.entries()) {
    const number = String(i + 1).padStart(2, '0'); chapters.push({ id, number, component: id, model });
    graph.nodes.filter(n => ['support', 'gate'].includes(n.role) && n.stage === id).forEach((n, j) => chapters.push({ id: n.id, number: `${number}.${j + 1}`, component: n.id, model }));
  }
  const outside = graph.nodes.filter(n => n.role === 'outside');
  chapters.push({ id: 'outside', number: '10', component: null, model: { ...model, chambers: model.chambers.filter(c => c.role === 'outside') } });
  outside.forEach((n, i) => chapters.push({ id: n.id, number: `10.${i + 1}`, component: n.id, model }));
  chapters.push({ id: 'closing', number: '11', component: null, model });
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const center = id => { const n = byId.get(id); return [n.x, n.z]; };
  const pathBetween = (from, to) => {
    if (from === to) return [center(from)];
    const queue = [[from]], seen = new Set([from]); let ids;
    while (queue.length) {
      const path = queue.shift(), last = path.at(-1); if (last === to) { ids = path; break; }
      // Loop and chapter ties define the tour; recorded artifact shortcuts do not skip stages.
      for (const road of graph.roads.filter(r => r.class === 'loop' || r.sources.some(s => s.source === 'spur') || [r.from, r.to].includes(last) && (byId.get(r.from)?.stage === r.to || byId.get(r.to)?.stage === r.from))) {
        const next = road.from === last ? road.to : road.to === last ? road.from : null;
        if (next && !seen.has(next)) { seen.add(next); queue.push([...path, next]); }
      }
    }
    if (!ids) throw new Error(`missing tour road ${from}/${to}`);
    const points = [center(from)];
    for (let i = 1; i < ids.length; i++) { const road = graph.roads.find(r => [r.from, r.to].includes(ids[i - 1]) && [r.from, r.to].includes(ids[i])); const p = road.from === ids[i - 1] ? road.path : [...road.path].reverse(); points.push(...p, center(ids[i])); }
    return points;
  };
  for (let i = 1; i < chapters.length; i++) {
    const a = chapters[i - 1], b = chapters[i];
    const from = a.component ?? (a.id === 'outside' ? outside[0]?.id : graph.spine[0]);
    const to = b.component ?? (b.id === 'outside' ? outside[0]?.id : graph.spine[0]);
    b.walk = from && to ? pathBetween(from, to) : [];
  }
  return chapters;
}
export function chapterProgress(chapters, hash) { return Math.max(0, chapters.findIndex(c => c.id === hash.replace(/^#/, ''))); }
const anchor = (chapter, aspect) => chapter.component ? focus(chapter.model, chapter.component, aspect) : chapter.id === 'outside' ? focus(chapter.model, null, aspect) : overview(chapter.model, aspect);
export function tourPose(chapters, progress, aspect = 1, reduced = false) {
  const p = Math.max(0, Math.min(chapters.length - 1, progress));
  if (reduced || Number.isInteger(p)) return anchor(chapters[Math.round(p)], aspect);
  const i = Math.floor(p), t = p - i, a = anchor(chapters[i], aspect), b = anchor(chapters[i + 1], aspect), walk = chapters[i + 1].walk;
  const lengths = walk.slice(1).map((v, j) => Math.hypot(v[0] - walk[j][0], v[1] - walk[j][1]));
  let distance = lengths.reduce((s, v) => s + v, 0) * t, target = a.target.map((v, j) => v + (b.target[j] - v) * t);
  for (let j = 0; j < lengths.length; j++) { if (distance <= lengths[j] || j === lengths.length - 1) { const ratio = lengths[j] ? distance / lengths[j] : 0; target = [walk[j][0] + (walk[j + 1][0] - walk[j][0]) * ratio, target[1], walk[j][1] + (walk[j + 1][1] - walk[j][1]) * ratio]; break; } distance -= lengths[j]; }
  const offset = a.position.map((v, j) => (v - a.target[j]) * (1 - t) + (b.position[j] - b.target[j]) * t);
  return { target, position: target.map((v, j) => v + offset[j]), fov: a.fov };
}
