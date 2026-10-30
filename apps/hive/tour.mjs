/**
 * @module apps/hive/tour.mjs
 * @purpose Maps continuous page stage to the fourteen request journey camera keyframes.
 * @inputs City layout, hand plan, fractional stage and viewport aspect.
 * @outputs Ordered narrated chapters, hash stages and continuously blended camera poses.
 * @effects none
 * @errors None for a validated city plan.
 */
import { focus, overview, blendPose } from './camera.mjs';
import { CITY, TOUR_SCROLL } from './config.mjs';
export function tour(model, plan) {
  return plan.journey.map((step, i) => ({ ...step, number: String(i).padStart(2, '0'), name: step.title, model }));
}
export function chapterProgress(chapters, hash) { return Math.max(0, chapters.findIndex(c => c.id === hash.replace(/^#/, ''))); }
// Spans are measured in viewport heights, weighted by the actual camera journey.
export function chapterSpans(chapters, aspect = 1) {
  const poses = chapters.map((_, i) => tourPose(chapters, i, aspect));
  const weights = poses.map((a, i) => {
    const b = poses[i + 1] ?? a;
    return Math.max(TOUR_SCROLL.minimumTravel, Math.hypot(...a.target.map((v, j) => b.target[j] - v)) + Math.hypot(...a.position.map((v, j) => b.position[j] - v)));
  });
  const total = weights.reduce((a, b) => a + b, 0); let start = 0;
  return weights.map((weight, i) => { const end = i === weights.length - 1 ? TOUR_SCROLL.screens : start + weight / total * TOUR_SCROLL.screens; const span = { start, end }; start = end; return span; });
}
export function stageAtScroll(offset, viewportHeight, spans) {
  if (typeof spans === 'number') return Math.max(0, Math.min(spans - 1, offset / viewportHeight));
  const y = Math.max(0, offset / viewportHeight), i = spans.findIndex(s => y < s.end);
  if (i < 0) return spans.length - 1;
  return Math.min(spans.length - 1, i + Math.max(0, (y - spans[i].start) / (spans[i].end - spans[i].start)));
}
export function scrollAtStage(stage, viewportHeight, spans) {
  const i = Math.max(0, Math.min(spans.length - 1, Math.floor(stage))), span = spans[i];
  return (span.start + (span.end - span.start) * (stage - i)) * viewportHeight;
}
export function cardBlend(stage, count) {
  const index = Math.min(count - 1, Math.floor(stage)), next = Math.min(count - 1, index + 1);
  return { index, next, mix: next === index ? 0 : Math.max(0, (stage - index - (1 - TOUR_SCROLL.crossFade)) / TOUR_SCROLL.crossFade) };
}
export function tourPose(chapters, progress, aspect = 1) {
  const p = Math.max(0, Math.min(chapters.length - 1, progress)), i = Math.floor(p);
  const anchor = ch => {
    if (ch.id === 'signal') {
      const tower = ch.model.chambers.find(n => n.id === 'tower');
      return focus({ ...ch.model, chambers: [{ id: 'arrival', bounds: { min: tower.bounds.min, max: [tower.bounds.max[0], CITY.skyHeight, tower.bounds.max[2]] } }] }, 'arrival', aspect);
    }
    return ch.place ? focus(ch.model, ch.place, aspect) : overview(ch.model, aspect);
  };
  const a = anchor(chapters[i]);
  return Number.isInteger(p) ? a : blendPose(a, anchor(chapters[i + 1]), p - i);
}
