/**
 * @module apps/hive/tour.mjs
 * @purpose Computes the request journey, anchored visits and street-following scroll poses.
 * @inputs City layout, hand plan, chapter progress, aspect and reduced-motion flag.
 * @outputs Ordered chapters, walks, hash progress and camera poses.
 * @effects none
 * @errors Throws for missing chapter streets.
 */
import { focus, overview } from './camera.mjs';
import { STYLE } from './config.mjs';
import { pathBetween } from './city.mjs';
export function tour(model, plan) {
  const chapters = [];
  const place = id => model.chambers.find(n => n.id === id);
  for (const [i, step] of plan.journey.entries()) {
    const number = String(i).padStart(2, '0'), n = place(step.place);
    chapters.push({ ...step, number, name: n?.name ?? (step.id === 'closing' ? 'Explore the city' : 'The whole city'), model, walk: [] });
    for (const [j, id] of step.visits.entries()) { const n = place(id); chapters.push({ id: n.component ?? n.id, place: id, component: n.component, step: step.id, visit: true, number: `${number}.${j + 1}`, name: n.name, model, walk: [] }); }
  }
  for (const n of model.chambers.filter(n => n.note === 'No place yet')) chapters.splice(-1, 0, { id: n.component, component: n.component, place: n.id, number: '12.1', name: n.name, model, walk: [] });
  let previous = null;
  for (const chapter of chapters.filter(c => !c.visit)) {
    const n = place(chapter.place); if (n && previous) chapter.walk = pathBetween(model, previous, n); if (n) previous = n;
  }
  return chapters;
}
export function chapterProgress(chapters, hash) { return Math.max(0, chapters.findIndex(c => c.id === hash.replace(/^#/, ''))); }
const anchor = (chapter, chapters, aspect) => {
  if (!chapter.place) return overview(chapter.model, aspect);
  const step = chapter.visit ? chapters.find(c => c.id === chapter.step) : chapter;
  const pose = focus(chapter.model, step.place, aspect);
  if (!chapter.visit) return pose;
  const lot = chapter.model.chambers.find(n => n.id === chapter.place), base = chapter.model.chambers.find(n => n.id === step.place);
  let radius = 0;
  for (const bounds of [lot.bounds, base.bounds]) for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) radius = Math.max(radius, Math.hypot(x - pose.target[0], y - pose.target[1], z - pose.target[2]));
  const vertical = STYLE.fov * Math.PI / 360, distance = radius * STYLE.framePadding / Math.sin(Math.min(vertical, Math.atan(Math.tan(vertical) * aspect)));
  const delta = pose.position.map((v, i) => v - pose.target[i]), length = Math.hypot(...delta);
  return { ...pose, position: pose.target.map((v, i) => v + delta[i] / length * distance) };
};
export function tourPose(chapters, progress, aspect = 1, reduced = false) {
  const p = Math.max(0, Math.min(chapters.length - 1, progress));
  if (reduced || Number.isInteger(p)) return anchor(chapters[Math.round(p)], chapters, aspect);
  const i = Math.floor(p), t = p - i, a = anchor(chapters[i], chapters, aspect), b = anchor(chapters[i + 1], chapters, aspect), next = chapters[i + 1];
  const walk = next.walk, lengths = walk.slice(1).map((v, j) => Math.hypot(...v.map((x, k) => x - walk[j][k])));
  let distance = lengths.reduce((s, v) => s + v, 0) * t, target = next.visit ? b.target : a.target.map((v, j) => v + (b.target[j] - v) * t);
  for (let j = 0; j < lengths.length; j++) { if (distance <= lengths[j] || j === lengths.length - 1) { const ratio = lengths[j] ? distance / lengths[j] : 0; target = walk[j].map((v, k) => v + (walk[j + 1][k] - v) * ratio); break; } distance -= lengths[j]; }
  const offset = a.position.map((v, j) => (v - a.target[j]) * (1 - t) + (b.position[j] - b.target[j]) * t);
  return { target, position: target.map((v, j) => v + offset[j]), fov: a.fov };
}
