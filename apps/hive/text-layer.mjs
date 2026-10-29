/**
 * @module apps/hive/text-layer.mjs
 * @purpose Presents component chapters and three reading voices over the architectural scene.
 * @inputs Component data, hash, renderer, voice and explicit document/container when rendering.
 * @outputs A reading model or populated overlay with one visible frosted card.
 * @effects none
 * @errors None for contract-shaped data.
 */
export function textLayer(data, hash, renderer, voice = 'plain') {
  const active = data.components.find(c => `#${c.id}` === hash)?.id ?? null;
  return {
    active, voice, renderer: `Renderer: ${renderer}`,
    rail: data.components.map((c, i) => ({ href: `#${c.id}`, name: c.name, chapter: `${String(i + 1).padStart(2, '0')}:${c.name.toUpperCase()}`, active: c.id === active })),
    cards: data.components.map((c, i) => {
      const voices = {
        plain: c.metaphor,
        technical: [`${c.kind} · ${c.status}`, ...c.features.map(f => `${f.label} — ${f.implemented} of ${f.rows}`), !c.features.length ? 'No features recorded · empty foundation' : null, `Parts: ${c.parts.join('\n') || 'none'}`, `Evidence: ${c.evidence.join(', ')}`].filter(Boolean).join('\n\n'),
        work: [c.gap || 'No gap recorded in this assessment.', ...(c.ask ? [`Question: ${c.ask.question}`, `Default: ${c.ask.default}`, `Gains and misses: ${c.ask.gains}`, `Cost: ${c.ask.cost}`, `Otherwise: ${c.ask.otherwise}`] : ['No decision requested.'])].join('\n\n'),
      };
      return { id: c.id, name: c.name, active: c.id === active, chapter: String(i + 1).padStart(2, '0'), voices, text: Object.values(voices).join('\n') };
    }),
  };
}
export function renderText(document, container, model) {
  const el = (tag, text, parent) => { const n = document.createElement(tag); if (text) n.textContent = text; if (parent) parent.append(n); return n; };
  container.replaceChildren();
  const status = el('p', model.renderer, container); status.setAttribute('class', 'renderer-line'); status.setAttribute('role', 'status');
  const tabs = el('div', '', container); tabs.setAttribute('class', 'voices'); tabs.setAttribute('aria-label', 'Reading voice');
  for (const [key, label] of [['plain', 'Plain'], ['technical', 'Technical'], ['work', 'From the work']]) {
    const button = el('button', label, tabs); button.setAttribute('type', 'button'); button.setAttribute('data-voice', key); button.setAttribute('aria-pressed', String(model.voice === key));
  }
  const nav = el('nav', '', container); nav.setAttribute('aria-label', 'Components'); nav.setAttribute('class', 'rail');
  for (const item of model.rail) {
    const a = el('a', item.chapter, nav); a.setAttribute('href', item.href);
    if (item.active) a.setAttribute('aria-current', 'location');
  }
  const pickerLabel = el('label', 'Chapter', container); pickerLabel.setAttribute('class', 'chapter-picker');
  const picker = el('select', '', pickerLabel); picker.setAttribute('aria-label', 'Choose a chapter');
  const overview = el('option', '00:THE WHOLE SYSTEM', picker); overview.setAttribute('value', '');
  if (!model.active) overview.setAttribute('selected', '');
  for (const item of model.rail) { const option = el('option', item.chapter, picker); option.setAttribute('value', item.href); if (item.active) option.setAttribute('selected', ''); }
  const landing = el('article', '', container); landing.setAttribute('class', model.active ? 'landing card' : 'landing card active');
  if (model.active) landing.setAttribute('hidden', '');
  el('span', '00 / NANA PI', landing).setAttribute('class', 'chapter-number');
  el('h2', 'A place for every moving part.', landing);
  el('p', 'A workshop, a library, and the structures that keep the work accountable. Choose a chapter to see what is built and what still needs a decision.', landing);
  el('p', 'White forms are built. Open frames are unfinished. Empty foundations mark what is absent.', landing).setAttribute('class', 'legend');
  for (const item of model.cards) {
    const article = el('article', '', container); article.setAttribute('id', item.id); article.setAttribute('class', item.active ? 'card active' : 'card');
    if (item.active) article.setAttribute('aria-current', 'true'); else article.setAttribute('hidden', '');
    el('span', `${item.chapter} / ${model.voice === 'work' ? 'FROM THE WORK' : model.voice.toUpperCase()}`, article).setAttribute('class', 'chapter-number');
    el('h2', item.name, article);
    for (const [voice, text] of Object.entries(item.voices)) {
      const p = el('p', text, article); p.setAttribute('data-panel', voice); if (voice !== model.voice) p.setAttribute('hidden', '');
    }
  }
  return container;
}
