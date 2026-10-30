/**
 * @module apps/hive/tour.mjs
 * @purpose Maps continuous page stage to the fourteen request journey camera keyframes.
 * @inputs City layout, hand plan, fractional stage and viewport aspect.
 * @outputs Ordered narrated chapters, hash stages and continuously blended camera poses.
 * @effects none
 * @errors None for a validated city plan.
 */
import { focus, overview, blendPose } from './camera.mjs';
import { CITY } from './config.mjs';
export function tour(model, plan) {
  return plan.journey.map((step, i) => ({ ...step, number: String(i).padStart(2, '0'), name: step.title, model }));
}
export function chapterProgress(chapters, hash) { return Math.max(0, chapters.findIndex(c => c.id === hash.replace(/^#/, ''))); }
export function stageAtScroll(offset, chapterHeight, chapterCount) { return Math.max(0, Math.min(chapterCount - 1, offset / chapterHeight)); }
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
