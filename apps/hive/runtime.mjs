/**
 * @module apps/hive/runtime.mjs
 * @purpose Keeps renderer selection, data refusal and frame state independent of the browser.
 * @inputs Component data, context factory, query text, motion options and callbacks.
 * @outputs Layout or plain error, renderer choice and deterministic animation state.
 * @effects none
 * @errors Context creation exceptions fall back to pixel; malformed layout data returns a plain error.
 */
import { layout } from './layout.mjs';
import { checkCityPlan, structuralProblems } from './city.mjs';
import { STYLE } from './config.mjs';
export function chooseRenderer(makeContext, query) {
  if (new URLSearchParams(query).get('view') === 'pixel') return 'pixel';
  try { return makeContext() ? 'webgl' : 'pixel'; } catch { return 'pixel'; }
}
export function prepare(data, plan, overrides) {
  if (data?.contract !== 'nana-components' || data?.version !== 1) return { scene: null, error: 'hive: incompatible component contract' };
  try {
    const problems = structuralProblems(checkCityPlan(plan, data.components));
    if (problems.length) return { scene: null, error: `hive: city: ${problems[0]}` };
    return { scene: layout(data, plan, overrides), error: null };
  } catch { return { scene: null, error: 'hive: unreadable component data' }; }
}
export function firstFrame(renderer, draw, setReady, chapterApplied = () => true) {
  let ready = false;
  return () => { draw(); if (!ready && chapterApplied()) { setReady(renderer); ready = true; } };
}
export function animationStep(seconds, { still = false, reduced = false } = {}) {
  const t = still || reduced ? 0 : seconds;
  return { beePhase: t * STYLE.beeSpeed, camera: Math.sin(t * STYLE.cameraDrift) * STYLE.cameraDrift };
}
