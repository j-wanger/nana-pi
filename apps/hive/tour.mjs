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
// Every chapter earns a reading screen before adding a capped camera-travel allowance.
export function chapterSpans(chapters, aspect = 1) {
  const poses = chapters.map((_, i) => tourPose(chapters, i, aspect));
  const weights = poses.map((a, i) => {
    const b = poses[i + 1] ?? a;
    return Math.hypot(...a.target.map((v, j) => b.target[j] - v)) + Math.hypot(...a.position.map((v, j) => b.position[j] - v));
  });
  let start = 0;
  return weights.map(weight => { const end = start + TOUR_SCROLL.readingScreens + Math.min(TOUR_SCROLL.travelCap, weight / TOUR_SCROLL.travelScale); const span = { start, end }; start = end; return span; });
}
export function stageAtScroll(offset, viewportHeight, spans) {
  if (typeof spans === 'number') return Math.max(0, Math.min(spans - 1, offset / viewportHeight));
  const y = Math.max(0, offset / viewportHeight), i = spans.findIndex(s => y < s.end);
  if (i < 0) return spans.length - 1;
  return Math.min(spans.length - 1, i + Math.max(0, (y - spans[i].start) / (spans[i].end - spans[i].start)));
}
// Analytic critically damped spring. Clamp every step to the segment from displayed
// stage to the page target; a changed direction must never inherit opposing momentum.
export function followStage(state, target, dt) {
  const quiet = target === state.target ? Math.min(TOUR_SCROLL.settleSeconds, state.quiet + dt) : dt;
  if (quiet >= TOUR_SCROLL.settleSeconds || state.stage === target) return { stage: target, velocity: 0, target, quiet };
  const omega = 2 / TOUR_SCROLL.followSeconds, error = state.stage - target;
  const velocity = state.velocity * (target - state.stage) < 0 ? 0 : state.velocity;
  const c = velocity + omega * error, decay = Math.exp(-omega * dt);
  const candidate = target + (error + c * dt) * decay;
  const stage = Math.max(Math.min(state.stage, target), Math.min(Math.max(state.stage, target), candidate));
  return { stage, velocity: stage === target ? 0 : (velocity - omega * c * dt) * decay, target, quiet };
}
export function scrollAtStage(stage, viewportHeight, spans) {
  const i = Math.max(0, Math.min(spans.length - 1, Math.floor(stage))), span = spans[i];
  return (span.start + (span.end - span.start) * (stage - i)) * viewportHeight;
}
export function cardBlend(stage, count) {
  const index = Math.min(count - 1, Math.floor(stage)), next = Math.min(count - 1, index + 1);
  const mix = next === index ? 0 : Math.max(0, Math.min(1, (stage - index - (1 - TOUR_SCROLL.crossFade)) / TOUR_SCROLL.crossFade));
  return { index, next, mix, outOpacity: Math.max(0, 1 - mix * 2), inOpacity: Math.max(0, mix * 2 - 1), outY: -TOUR_SCROLL.slidePx * Math.min(1, mix * 2), inY: TOUR_SCROLL.slidePx * (1 - Math.max(0, mix * 2 - 1)) };
}
// The first span is a plan-to-tower descent, never a timed flight.
export function openingState(chapters, stage, aspect = 1, skip = false) {
  const t = Math.max(0, Math.min(1, stage));
  if (skip || t === 1) return { planOpacity: 0, cityScale: 1, pose: tourPose(chapters, stage, aspect) };
  const plan = overview(chapters[0].model, aspect), distance = Math.hypot(...plan.position.map((v, i) => v - plan.target[i]));
  const above = { ...plan, position: [plan.target[0], plan.target[1] + distance, plan.target[2] + 0.001] };
  return { planOpacity: 1 - t, cityScale: t, pose: blendPose(above, tourPose(chapters, 1, aspect), t) };
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
  if (Number.isInteger(p)) return a;
  const fraction = p - i, reading = 1 - TOUR_SCROLL.cameraTravelFraction;
  if (fraction <= reading) return a;
  const t = (fraction - reading) / TOUR_SCROLL.cameraTravelFraction;
  // Spend a little more of the same travel span approaching the close-up.
  // Both endpoint derivatives remain zero; chapter holds and destinations stay exact.
  const front = t + TOUR_SCROLL.cameraTravelBias * t * (1 - t);
  return blendPose(a, anchor(chapters[i + 1]), front * front * (3 - 2 * front));
}
