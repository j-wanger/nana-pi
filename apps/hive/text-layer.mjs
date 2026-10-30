/**
 * @module apps/hive/text-layer.mjs
 * @purpose Presents component chapters and three reading voices over the architectural scene.
 * @inputs Component data, hash, renderer, voice and explicit document/container when rendering.
 * @outputs A reading model or populated overlay with one visible frosted card.
 * @effects none
 * @errors None for contract-shaped data.
 */
export function textLayer(data, hash, renderer, voice = 'plain', chapters = null, mode = 'tour') {
  const order = [...(chapters ?? data.components.map((c, i) => ({ id: c.id, component: c.id, number: String(i + 1).padStart(2, '0'), name: c.name })))];
  if (mode === 'explore' && chapters) for (const n of chapters[0].model.chambers) if (!order.some(ch => ch.place === n.id)) order.push({ id: n.component ?? n.id, component: n.component, place: n.id, name: n.name, number: '—', model: chapters[0].model });
  const components = order.map(ch => {
    const c = data.components.find(c => c.id === ch.component), lot = ch.model?.chambers.find(n => n.id === ch.place);
    return { id: ch.id, name: ch.name, componentName: c?.name ?? '', metaphor: c?.metaphor ?? (ch.id === 'signal' ? 'One wish becomes a signal. The reception tower catches it.' : ch.id === 'customers' ? 'Other projects receive the work. Their feedback becomes the next signal.' : 'Follow one wish through the city, then explore.'), kind: c?.kind ?? 'workflow', status: c?.status ?? 'absent', features: c?.features ?? [], parts: c?.parts ?? [], evidence: c?.evidence ?? [], gap: c?.gap, ask: c?.ask, note: lot?.note, number: ch.number };
  });
  const active = components.find(c => `#${c.id}` === hash && !['overview', 'closing'].includes(c.id))?.id ?? null;
  return {
    active, voice, mode, renderer: `Renderer: ${renderer}${renderer === 'pixel' ? ' · streets in 3D only' : ''}`,
    landing: mode === 'tour'
      ? { title: 'One wish. A working city.', text: 'A signal reaches the tower. The park plans, builds and checks it. One gate ships it to customers. Feedback starts again.', legend: 'Lit windows mean sound, half-lit windows mean partial or gap, and dark windows mean absent or future work.', actions: ['explore'] }
      : { title: 'Explore the city.', text: 'Tap a building to select it. Drag to orbit. Pinch to zoom. Only Enter takes you inside.', legend: 'Lit windows mean sound, half-lit windows mean partial or gap, and dark windows mean absent or future work.', actions: ['tour'] },
    rail: components.map(c => ({ href: `#${c.id}`, name: c.name, chapter: `${c.number.toUpperCase()} ${c.name.toUpperCase()}`, active: c.id === active })),
    cards: components.map(c => {
      const voices = {
        plain: [c.componentName, c.metaphor, c.note].filter(Boolean).join(' · '),
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
  if (!model.rail.some(item => item.href === '#overview')) { const overview = el('option', '00 THE WHOLE CITY', picker); overview.setAttribute('value', '#overview'); if (!model.active) overview.setAttribute('selected', ''); }
  for (const item of model.rail) { const option = el('option', item.chapter, picker); option.setAttribute('value', item.href); if (item.active || !model.active && item.href === '#overview') option.setAttribute('selected', ''); }
  const landing = el('article', '', container); landing.setAttribute('class', model.active ? 'landing card' : 'landing card active');
  if (model.active) landing.setAttribute('hidden', '');
  el('span', '00 / NANA PI', landing).setAttribute('class', 'chapter-number');
  el('h2', model.landing.title, landing);
  el('p', model.landing.text, landing);
  for (const action of model.landing.actions) { const button = el('button', action === 'explore' ? 'Explore' : 'Back to tour', landing); button.setAttribute('data-action', action); }
  el('p', model.landing.legend, landing).setAttribute('class', 'legend');
  for (const item of model.cards) {
    const article = el('article', '', container); article.setAttribute('id', `card-${item.id}`); article.setAttribute('class', item.active ? 'card active' : 'card');
    if (item.active) article.setAttribute('aria-current', 'true'); else article.setAttribute('hidden', '');
    el('span', `${item.chapter} / ${model.voice === 'work' ? 'FROM THE WORK' : model.voice.toUpperCase()}`, article).setAttribute('class', 'chapter-number');
    el('h2', item.name, article);
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
    if (model.mode === 'explore') for (const [action, label] of [['enter', 'Enter'], ['back', 'Back'], ['tour', 'Back to tour']]) { const button = el('button', label, article); button.setAttribute('data-action', action); button.setAttribute('data-component', item.id); }
  }
  return container;
}
