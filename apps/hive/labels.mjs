/**
 * @module apps/hive/labels.mjs
 * @purpose Keeps projected models and labels clear of phone overlays while packing labels with leaders.
 * @inputs Explicit document, stage and projected label nodes.
 * @outputs Positioned labels with leaders back to their structures.
 * @effects none
 * @errors None for DOM-shaped inputs.
 */
// CSS decides whether the phone needs clear bands; their sizes follow the actual controls.
export function safeBands(document, stage) {
  if (!getComputedStyle(stage).getPropertyValue('--clear-overlays').trim()) return { top: 0, bottom: 0 };
  const bounds = selector => [...document.querySelectorAll(selector)].filter(n => n.getClientRects().length).map(n => n.getBoundingClientRect());
  const top = Math.max(0, ...bounds('header,.voices,.chapter-picker').map(r => r.bottom));
  const bottom = stage.clientHeight - Math.min(stage.clientHeight, ...bounds('footer,.scene-caption,.renderer-line').map(r => r.top));
  return { top, bottom };
}
// Moved from main.mjs's original placeLabels; the scroll scene keeps its overlay collision rule.
export function placeLabels(document, stage, labelNodes) {
  const width = stage.clientWidth, height = stage.clientHeight;
  const rect = n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const blocked = [...document.querySelectorAll('header,.voices,.rail,.chapter-picker,.card.active,footer,.scene-caption,.renderer-line,.coordinate')].filter(n => n.getClientRects().length).map(rect);
  const bands = safeBands(document, stage);
  if (bands.top) blocked.push({ x: 0, y: 0, w: width, h: bands.top });
  if (bands.bottom) blocked.push({ x: 0, y: height - bands.bottom, w: width, h: bands.bottom });
  const visible = labelNodes.filter(n => !n.hidden).sort((a, b) => Number(a.dataset.y) - Number(b.dataset.y));
  for (const node of visible) {
    const w = node.offsetWidth, h = node.offsetHeight, gap = parseFloat(getComputedStyle(node).paddingTop);
    const ax = Number(node.dataset.x), ay = Number(node.dataset.y);
    const x = Math.max(gap, Math.min(width - w - gap, ax + h)), y = Math.max(gap, Math.min(height - h - gap, ay - h));
    const xs = [x, ax - w - h, gap, width - w - gap, ...blocked.flatMap(b => [b.x - w - gap, b.x + b.w + gap])];
    const ys = [y, gap, height - h - gap, ...blocked.flatMap(b => [b.y - h - gap, b.y + b.h + gap])];
    let best = null, distance = Infinity;
    for (const px of xs) for (const py of ys) {
      if (px < gap || py < gap || px + w + gap > width || py + h + gap > height) continue;
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d >= distance || blocked.some(b => px < b.x + b.w + gap && px + w + gap > b.x && py < b.y + b.h + gap && py + h + gap > b.y)) continue;
      best = { x: px, y: py, w, h }; distance = d;
    }
    if (!best) { node.hidden = true; continue; }
    node.style.left = `${best.x}px`; node.style.top = `${best.y}px`;
    const dx = ax - best.x, dy = ay - best.y - h;
    node.style.setProperty('--leader-length', `${Math.hypot(dx, dy)}px`); node.style.setProperty('--leader-angle', `${Math.atan2(-dx, dy)}rad`);
    node.style.setProperty('--anchor-x', `${dx}px`); node.style.setProperty('--anchor-y', `${ay - best.y}px`);
    blocked.push(best);
  }
}
