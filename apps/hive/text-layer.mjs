/**
 * @module apps/hive/text-layer.mjs
 * @purpose Presents every component's story as a DOM-independent model and text-only rail and cards.
 * @inputs Component data, hash, renderer name and explicit document/container when rendering.
 * @outputs A reading model or populated container.
 * @effects none
 * @errors None for contract-shaped data.
 */
export function textLayer(data, hash, renderer) {
  const active = data.components.find(c => `#${c.id}` === hash)?.id ?? null;
  return {
    active, renderer: `Renderer: ${renderer}`,
    rail: data.components.map(c => ({ href: `#${c.id}`, name: c.name, active: c.id === active })),
    cards: data.components.map(c => ({ id: c.id, name: c.name, active: c.id === active,
      text: [c.metaphor, `${c.kind} · ${c.status}`, c.gap,
        ...(c.ask ? [`Question: ${c.ask.question}`, `Default: ${c.ask.default}`, `Gains and misses: ${c.ask.gains}`, `Cost: ${c.ask.cost}`, `Otherwise: ${c.ask.otherwise}`] : []),
        ...c.features.map(f => `${f.label} — ${f.implemented} of ${f.rows}`),
        !c.features.length ? 'No features recorded · sealed dark cell' : null,
        `Parts: ${c.parts.join(', ') || 'none'}`, `Evidence: ${c.evidence.join(', ')}`,
      ].filter(Boolean).join('\n'),
    })),
  };
}
export function renderText(document, container, model) {
  const el = (tag, text, parent) => { const n = document.createElement(tag); if (text) n.textContent = text; if (parent) parent.append(n); return n; };
  container.replaceChildren();
  const status = el('p', model.renderer, container); status.setAttribute('class', 'renderer-line'); status.setAttribute('role', 'status');
  const nav = el('nav', '', container); nav.setAttribute('aria-label', 'Components'); nav.setAttribute('class', 'rail');
  for (const item of model.rail) {
    const a = el('a', item.name, nav); a.setAttribute('href', item.href);
    if (item.active) a.setAttribute('aria-current', 'location');
  }
  const landing = el('article', '', container); landing.setAttribute('class', model.active ? 'landing card' : 'landing card active');
  el('h2', 'One hive. Many moving parts.', landing);
  el('p', 'Chambers are components. Cells are features. Honey is implemented requirements. Dark cells are gaps; grey caps are absent parts. Green rims mark governance homes.', landing);
  el('p', 'Bees show recent commits and in-flight lanes, not test results. Choose a component to focus. Drag sideways to orbit; swipe vertically to read. Pinch to zoom.', landing);
  for (const item of model.cards) {
    const article = el('article', '', container); article.setAttribute('id', item.id); article.setAttribute('class', item.active ? 'card active' : 'card');
    if (item.active) article.setAttribute('aria-current', 'true');
    el('h2', item.name, article); el('p', item.text, article);
  }
  return container;
}
