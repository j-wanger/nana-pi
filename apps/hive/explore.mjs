/**
 * @module apps/hive/explore.mjs
 * @purpose Reduces and binds safe selection, orbit, pinch and explicit navigation effects.
 * @inputs Immutable gesture state, pointer events, navigation actions and an injected hit picker.
 * @outputs New state and effects, or a removable EventTarget binding.
 * @effects process (installs and removes listeners on the supplied target)
 * @errors None for pointer-shaped events.
 */
import { NAVIGATION, STYLE } from './config.mjs';
export function explore(state, event) {
  const next = { ...state, pointers: Object.fromEntries(Object.entries(state.pointers ?? {}).map(([id, p]) => [id, { ...p }])) }, effects = [];
  const hash = value => effects.push({ type: 'hash', value });
  if (event.type === 'enter' && (event.id || state.selected)) hash(`#enter/${event.id || state.selected}`);
  else if (event.type === 'back') hash('#explore');
  else if (event.type === 'tour') hash(`#${state.selected || 'overview'}`);
  else if (next.mode === 'explore') {
    const pointers = next.pointers, id = event.pointerId;
    if (event.type === 'pointerdown') {
      pointers[id] = { x: event.x, y: event.y, startX: event.x, startY: event.y, moved: false };
      if (Object.keys(pointers).length > 1) for (const p of Object.values(pointers)) p.moved = true;
      next.pinch = pinchDistance(pointers);
    } else if (event.type === 'pointermove' && pointers[id]) {
      const old = pointers[id], p = { ...old, x: event.x, y: event.y }; pointers[id] = p;
      p.moved ||= Math.hypot(event.x - p.startX, event.y - p.startY) > NAVIGATION.tapTolerance;
      const distance = pinchDistance(pointers);
      if (distance && next.pinch) { next.zoom = Math.max(STYLE.minZoom, Math.min(STYLE.maxZoom, (next.zoom ?? 1) * next.pinch / distance)); effects.push({ type: 'zoom', value: next.zoom }); }
      else if (p.moved) effects.push({ type: 'orbit', delta: (event.x - old.x) * STYLE.dragScale });
      next.pinch = distance;
    } else if (event.type === 'pointerup' || event.type === 'pointercancel') {
      const p = pointers[id];
      if (p && !p.moved && event.type === 'pointerup' && Math.hypot(event.x - p.startX, event.y - p.startY) <= NAVIGATION.tapTolerance && event.id && !(next.lastTap?.id === event.id && event.time - next.lastTap.time < NAVIGATION.doubleTapMs)) {
        next.selected = event.id; next.lastTap = { id: event.id, time: event.time }; effects.push({ type: 'select', id: event.id });
      }
      delete pointers[id]; next.pinch = null;
    }
  }
  return { state: next, effects };
}
function pinchDistance(pointers) { const values = Object.values(pointers); return values.length === 2 ? Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y) : null; }
export function bindGestures(target, reducer, apply, pick = () => null) {
  const handlers = new Map();
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
    const handler = event => {
      if (type === 'pointerdown') target.setPointerCapture?.(event.pointerId);
      const effects = reducer({ type, pointerId: event.pointerId, x: event.clientX, y: event.clientY, time: event.now ?? event.timeStamp, id: type === 'pointerup' ? pick(event) : null });
      for (const effect of effects) apply(effect);
    };
    handlers.set(type, handler); target.addEventListener(type, handler);
  }
  return () => { for (const [type, handler] of handlers) target.removeEventListener(type, handler); };
}
