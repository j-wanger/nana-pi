/**
 * @module apps/hive/text-layer.mjs
 * @purpose Presents component chapters and three reading voices over the architectural scene.
 * @inputs Component data, hash, renderer, voice and explicit document/container when rendering.
 * @outputs A reading model or populated overlay with one visible frosted card.
 * @effects none
 * @errors None for contract-shaped data.
 */
export function textLayer(data, hash, renderer, voice = 'plain', chapters = null, mode = 'tour') {
  const order = chapters?.filter(c => c.component) ?? data.components.map((c, i) => ({ component: c.id, number: String(i + 1).padStart(2, '0') }));
  const components = order.map(ch => ({ ...data.components.find(c => c.id === ch.component), number: ch.number }));
  const active = components.find(c => `#${c.id}` === hash)?.id ?? null;
  return {
    active, voice, mode, renderer: `Renderer: ${renderer}`,
    rail: components.map(c => ({ href: `#${c.id}`, name: c.name, chapter: `${c.number}:${c.name.toUpperCase()}`, active: c.id === active })),
    cards: components.map(c => {
      const voices = {
        plain: c.metaphor,
        technical: [`${c.kind} · ${c.status}`, ...c.features.map(f => `${f.label} — ${f.implemented} of ${f.rows}`), !c.features.length ? 'No features recorded · empty foundation' : null, `Parts: ${c.parts.join('\n') || 'none'}`, `Evidence: ${c.evidence.join(', ')}`].filter(Boolean).join('\n\n'),
        work: [c.gap || 'No gap recorded in this assessment.', ...(c.ask ? [`Question: ${c.ask.question}`, `Default: ${c.ask.default}`, `Gains and misses: ${c.ask.gains}`, `Cost: ${c.ask.cost}`, `Otherwise: ${c.ask.otherwise}`] : ['No decision requested.'])].join('\n\n'),
      };
      return { id: c.id, name: c.name, active: c.id === active, chapter: c.number, voices, text: Object.values(voices).join('\n') };
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
  el('h2', model.mode === 'tour' ? 'From an idea to the next idea.' : 'Explore the loop.', landing);
  el('p', model.mode === 'tour' ? 'Direction. Plan. Queue. Build. Check. Review. Land. Release. Publish. Scroll to follow the work, or explore at your own pace.' : 'Drag to orbit. Pinch to zoom. A tap selects; only Enter takes you inside.', landing);
  const explore = el('button', model.mode === 'tour' ? 'Explore' : 'Back to tour', landing); explore.setAttribute('data-action', model.mode === 'tour' ? 'explore' : 'tour');
  el('p', 'White forms are built. Open frames are unfinished. Empty foundations mark what is absent.', landing).setAttribute('class', 'legend');
  for (const item of model.cards) {
    const article = el('article', '', container); article.setAttribute('id', `card-${item.id}`); article.setAttribute('class', item.active ? 'card active' : 'card');
    if (item.active) article.setAttribute('aria-current', 'true'); else article.setAttribute('hidden', '');
    el('span', `${item.chapter} / ${model.voice === 'work' ? 'FROM THE WORK' : model.voice.toUpperCase()}`, article).setAttribute('class', 'chapter-number');
    el('h2', item.name, article);
    if (model.mode === 'explore') for (const [action, label] of [['enter', 'Enter'], ['back', 'Back'], ['tour', 'Back to tour']]) { const button = el('button', label, article); button.setAttribute('data-action', action); button.setAttribute('data-component', item.id); }
    for (const [voice, text] of Object.entries(item.voices)) {
      const p = el('p', '', article); p.setAttribute('data-panel', voice); if (voice !== model.voice) p.setAttribute('hidden', '');
      if (voice !== 'technical') p.textContent = text;
      else {
        // Keep each code-name segment intact; paths may wrap only after a slash.
        const names = /(?:[\w.-]+\/)+[\w.-]*|\b(?:R|G|FEAT|CAP)-\d{2,4}\b/g;
        let end = 0;
        for (const match of text.matchAll(names)) {
          el('span', text.slice(end, match.index), p);
          const code = el('code', '', p);
          const segments = match[0].split('/');
          segments.forEach((segment, i) => {
            el('span', segment + (i < segments.length - 1 ? '/' : ''), code);
            if (i < segments.length - 1) el('wbr', '', code);
          });
          end = match.index + match[0].length;
        }
        el('span', text.slice(end), p);
      }
    }
  }
  return container;
}
