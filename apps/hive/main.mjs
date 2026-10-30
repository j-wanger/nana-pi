/**
 * @module apps/hive/main.mjs
 * @purpose Wires the scroll tour and deliberate exploration to the shared hive models and scene.
 * @inputs Browser document, paired JSON, hash, scroll, viewport and gesture effects.
 * @outputs WebGL or pixel scene, numbered stories and chapter/pose/ready marks.
 * @effects network (same-origin modules and data), process (browser frames and listeners)
 * @errors Incompatible data displays one plain error; WebGL failure selects pixel.
 */
import { prepare, chooseRenderer, firstFrame } from './runtime.mjs';
import { focus, overview, viewCentreOffset } from './camera.mjs';
import { tour, tourPose, chapterProgress, stageAtScroll, chapterSpans, scrollAtStage, cardBlend, openingState } from './tour.mjs';
import { explore, bindGestures } from './explore.mjs';
import { visibleRoads } from './city.mjs';
import { placeLabels, safeBands } from './labels.mjs';
import { textLayer, renderText } from './text-layer.mjs';
import { pixel, drawPixel, drawPlan } from './pixel.mjs';
import { buildHive, animateHive } from './assets/hive.mjs';
import { buildMaterials } from './assets/materials.mjs';
import { batchStatic } from './assets/parts.mjs';
import { STYLE, HIVE_BACKGROUND, STREETS, CITY, TOUR_SCROLL, WORKERS, OUTLINES, CARGO } from './config.mjs';
const stories = document.querySelector('#stories'), stage = document.querySelector('.stage'), labels = document.querySelector('.labels');
let canvas = document.querySelector('canvas');
const preference = matchMedia('(prefers-reduced-motion: reduce)'), still = new URLSearchParams(location.search).has('still');
try {
  const [data, plan] = await Promise.all(['components.json', 'city.json'].map(async url => { const r = await fetch(url); if (!r.ok) throw new Error('hive: data could not be loaded'); return r.json(); }));
  const overrideResponse = await fetch('layout-override.json');
  const overrides = overrideResponse.ok ? await overrideResponse.json() : undefined;
  const prepared = prepare(data, plan, overrides);
  if (prepared.error) throw new Error(prepared.error);
  await start(data, plan, prepared.scene);
} catch (error) { document.querySelector('#error').textContent = error.message.startsWith('hive:') ? error.message : 'hive: data could not be loaded'; stories.replaceChildren(); }
async function start(data, plan, model) {
  const chapters = tour(model, plan), sections = document.querySelector('#chapters');
  for (const chapter of chapters) { const section = document.createElement('section'); section.id = chapter.id; section.dataset.chapter = chapter.id; section.setAttribute('aria-label', `${chapter.number} ${chapter.id}`); sections.append(section); }
  let spans = chapterSpans(chapters, stage.clientWidth / stage.clientHeight);
  const sizeSpans = () => { spans = chapterSpans(chapters, stage.clientWidth / stage.clientHeight).map(s => ({ start: Math.round(s.start * stage.clientHeight) / stage.clientHeight, end: Math.round(s.end * stage.clientHeight) / stage.clientHeight })); [...sections.children].forEach((s, i) => { s.style.height = `${(spans[i].end - spans[i].start) * stage.clientHeight}px`; }); sections.style.paddingBottom = `${stage.clientHeight}px`; }; sizeSpans();
  let rendererName = chooseRenderer(() => canvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true }), location.search);
  let THREE, renderer, scene, camera, hive, outline;
  if (rendererName === 'webgl') try {
    THREE = await import('three');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, STYLE.pixelRatioCap)); renderer.setClearColor(HIVE_BACKGROUND);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    // Architecture is immutable; moving figures already carry their own soft contact shadows.
    renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight('#ffffff', '#6e776d', STYLE.lighting.ambient));
    const sun = new THREE.DirectionalLight('#ffffff', STYLE.lighting.sun); sun.position.set(...STYLE.lighting.position); sun.castShadow = true;
    const extent = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs)) * 1.3;
    Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 0.1, far: extent * 8 }); sun.shadow.mapSize.set(STYLE.shadowMapSize, STYLE.shadowMapSize); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; scene.add(sun);
    camera = new THREE.PerspectiveCamera(STYLE.fov, 1, 0.1, 10000); hive = batchStatic(THREE, buildHive(THREE, model, buildMaterials(THREE)), model); scene.add(hive);
    outline = new THREE.Box3Helper(new THREE.Box3(), '#202622'); outline.visible = false; scene.add(outline);
  } catch { renderer?.dispose(); renderer = null; rendererName = 'pixel'; }
  if (rendererName === 'pixel') { const fresh = canvas.cloneNode(); canvas.replaceWith(fresh); canvas = fresh; canvas.classList.add('pixel'); }
  const raster = pixel(model), ctx = rendererName === 'pixel' ? canvas.getContext('2d') : null;
  if (ctx) { canvas.width = raster.width; canvas.height = raster.height; }
  const opening = document.createElement('div'); opening.className = 'opening'; opening.hidden = true;
  const drawing = document.createElement('canvas'); opening.append(drawing);
  const invitation = document.createElement('div'); invitation.className = 'invitation';
  const title = document.createElement('h2'); title.textContent = 'One wish. A working city.';
  const prompt = document.createElement('p'); prompt.textContent = 'Scroll to enter'; invitation.append(title, prompt); opening.append(invitation);
  for (let i = 0; i < 3; i++) { const pulse = document.createElement('i'); pulse.style.animationDelay = `${i}s`; opening.append(pulse); }
  stage.append(opening);
  const root = document.documentElement; document.querySelector('#source').textContent = data.project;
  root.dataset.hiveChapters = JSON.stringify(chapters.map(c => c.id));
  const labelNodes = model.chambers.map(c => { const ch = chapters.find(ch => ch.place === c.id), node = document.createElement('span'); node.className = 'label'; node.dataset.component = c.component ?? c.id; node.textContent = `${ch?.number ?? '—'} ${c.name}${c.note ? ` · ${c.note}` : ''}`; labels.append(node); return node; });
  const labelHeights = new Map(hive?.children.filter(c => c.userData.place).map(c => [c.userData.place, c.userData.labelHeight]));
  let mode = 'tour', voice = 'plain', selected = null, entered = null, progress = 0, chapterIndex = 0, yaw = 0, zoom = 1;
  let gestureState = { mode, selected, zoom }, desired = overview(model), current = desired, readingKey = '';
  const aspect = () => stage.clientWidth / stage.clientHeight;
  const poseAtStage = () => openingState(chapters, progress, aspect(), still || preference.matches).pose;
  const reading = () => {
    const id = mode === 'tour' ? chapters[chapterIndex].id : selected;
    const key = `${id}/${mode}/${voice}`;
    if (key !== readingKey) { readingKey = key; renderText(document, stories, textLayer(data, `#${id}`, rendererName, voice, chapters, mode)); }
    if (mode === 'tour') {
      const blend = cardBlend(progress, chapters.length);
      for (const [i, chapter] of chapters.entries()) {
        const card = document.querySelector(`#card-${chapter.id}`), incoming = i === blend.next && blend.next !== blend.index;
        const opacity = incoming ? blend.inOpacity : i === blend.index ? blend.outOpacity : 0;
        const intro = progress < 1 && !still && !preference.matches;
        card.hidden = intro || opacity === 0; card.style.opacity = String(opacity);
        card.style.transform = `translateY(${incoming ? blend.inY : blend.outY}px)`;
        card.style.pointerEvents = !intro && opacity > TOUR_SCROLL.opacityThreshold ? 'auto' : 'none'; card.setAttribute('aria-hidden', String(intro || opacity <= TOUR_SCROLL.opacityThreshold));
      }
    }
    root.dataset.hiveSelection = selected ?? '';
  };
  let hashRead = false, phoneCardTop = null;
  const setPose = pose => { desired = pose; current = pose; };
  const apply = effect => {
    if (effect.type === 'hash') { history.pushState(null, '', effect.value); readHash(); }
    else if (effect.type === 'select') { selected = effect.id; reading(); frame(); }
    else if (effect.type === 'orbit') { yaw += effect.delta; frame(); }
    else if (effect.type === 'zoom') { zoom = effect.value; frame(); }
  };
  stories.addEventListener('click', event => {
    const link = event.target.closest('.rail a');
    if (link) { event.preventDefault(); apply({ type: 'hash', value: link.getAttribute('href') }); return; }
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.voice) { voice = button.dataset.voice; reading(); return; }
    const action = button.dataset.action;
    if (action === 'explore') apply({ type: 'hash', value: '#explore' });
    else if (action) { const result = explore({ ...gestureState, selected }, { type: action, id: button.dataset.component }); gestureState = result.state; result.effects.forEach(apply); }
  });
  stories.addEventListener('change', event => { if (event.target.matches('select')) apply({ type: 'hash', value: event.target.value || '#overview' }); });
  const scrollProgress = () => {
    if (mode !== 'tour') return;
    progress = stageAtScroll(scrollY, stage.clientHeight, spans);
    chapterIndex = Math.floor(progress); setPose(poseAtStage()); reading(); frame();
  };
  const readHash = () => {
    const hash = decodeURIComponent(location.hash.slice(1)), [kind, id] = hash.split('/');
    const valid = model.chambers.some(c => c.id === id || c.component === id);
    mode = kind === 'explore' || kind === 'enter' && valid ? 'explore' : 'tour';
    root.dataset.hiveMode = mode; document.body.classList.toggle('exploring', mode === 'explore');
    entered = kind === 'enter' && valid ? id : null; selected = valid && mode === 'explore' ? id : null;
    gestureState = { mode, selected, zoom: 1 }; yaw = 0; zoom = 1;
    sections.hidden = mode === 'explore';
    if (mode === 'tour') {
      const destination = !hash && (still || preference.matches) ? 1 : chapterProgress(chapters, `#${hash}`), top = scrollAtStage(destination, stage.clientHeight, spans);
      if (hashRead && !still && !preference.matches) scrollTo({ top, behavior: 'smooth' });
      else { scrollTo(0, top); progress = destination; chapterIndex = destination; setPose(poseAtStage()); }
    } else if (entered) setPose(focus(model, entered, aspect()));
    else setPose(overview(model, aspect()));
    hashRead = true;
    reading(); frame();
  };
  let shadowScale;
  const draw = () => {
    const frameStart = performance.now();
    root.dataset.hiveStage = String(progress);
    if (renderer) {
      const intro = openingState(chapters, progress, aspect(), mode !== 'tour' || still || preference.matches);
      hive.scale.y = Math.max(0.001, intro.cityScale);
      if (shadowScale !== hive.scale.y) { renderer.shadowMap.needsUpdate = true; shadowScale = hive.scale.y; }
      opening.hidden = intro.planOpacity === 0; opening.style.opacity = String(intro.planOpacity);
      current = desired;
      camera.fov = current.fov; camera.updateProjectionMatrix();
      const vector = current.position.map((v, i) => (v - current.target[i]) * zoom), angle = yaw;
      camera.position.set(current.target[0] + vector[0] * Math.cos(angle) + vector[2] * Math.sin(angle), current.target[1] + vector[1], current.target[2] + vector[2] * Math.cos(angle) - vector[0] * Math.sin(angle)); camera.lookAt(...current.target);
      const safe = safeBands(document, stage);
      const cards = [...stories.querySelectorAll('.card:not([hidden])')];
      if (cards.length) phoneCardTop = Math.min(...cards.map(n => n.getBoundingClientRect().top));
      const cardTop = Math.min(stage.clientHeight - safe.bottom, phoneCardTop ?? stage.clientHeight);
      if (safe.top && intro.planOpacity === 0) camera.setViewOffset(stage.clientWidth, stage.clientHeight, 0, viewCentreOffset(stage.clientHeight, safe.top, stage.clientHeight - cardTop), stage.clientWidth, stage.clientHeight);
      else camera.clearViewOffset();
      camera.updateMatrixWorld();
      const active = mode === 'tour' ? chapters[chapterIndex].component : selected, visible = visibleRoads(model.roads, mode === 'tour' ? chapters[chapterIndex].id : null);
      const activePlace = model.chambers.find(c => c.component === active || c.id === active)?.id;
      hive.userData.batchSelection.value = mode === 'explore' ? hive.userData.batchOwners.indexOf(active) : -1;
      hive.children.forEach(o => {
        if (o.userData.road) { o.visible = visible.some(r => r.id === o.userData.road); const incident = mode === 'explore' && activePlace && model.roads.find(r => r.id === o.userData.road && [r.from, r.to].includes(activePlace)); o.traverse(m => { if (m.isMesh && m.userData.roadSurface) { if (!m.userData.original) { m.userData.original = m.material; m.material = m.material.clone(); } m.material.color.set(incident ? '#171c19' : m.userData.original.color); } }); }
        if (o.userData.component) o.traverse(m => { if (m.isMesh) { m.userData.highlight ??= m.material.clone(); m.material = m.userData.highlight; m.material.emissive?.set(o.userData.component === active ? '#303831' : '#000000'); m.material.emissiveIntensity = 0.12; } });
      });
      const worldPosition = new THREE.Vector3();
      hive.traverse(o => {
        if (o.userData.role || o.userData.workplace || o.userData.mechanism || o.userData.traffic) {
          o.getWorldPosition(worldPosition);
          const size = o.userData.traffic ? CARGO.size : WORKERS.height;
          const pixels = size * stage.clientHeight / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.distanceTo(worldPosition));
          o.visible = pixels >= (o.userData.traffic ? OUTLINES.fadePixels : OUTLINES.fullPixels);
        }
      });
      animateHive(hive, performance.now() / 1000, still || preference.matches);
      outline.visible = Boolean(activePlace) && (mode === 'explore' || chapters[chapterIndex].visit);
      if (outline.visible) { const c = model.chambers.find(c => c.id === activePlace); outline.box.set(new THREE.Vector3(...c.bounds.min), new THREE.Vector3(...c.bounds.max)); }
      const bands = safeBands(document, stage);
      stage.style.setProperty('--safe-top', `${bands.top}px`); stage.style.setProperty('--safe-bottom', `${bands.bottom}px`);
      if (bands.top || bands.bottom) {
        // Paving continues behind the controls; geometry and dark streets stay
        // inside the safe band, including roads projecting through the bottom edge.
        const structures = hive.children.filter(o => !o.userData.background);
        const visibility = structures.map(o => o.visible), outlined = outline.visible;
        structures.forEach(o => { o.visible = false; }); outline.visible = false;
        renderer.render(scene, camera);
        structures.forEach((o, i) => { o.visible = visibility[i]; }); outline.visible = outlined;
        renderer.autoClear = false; renderer.setScissorTest(true);
        renderer.setScissor(0, bands.bottom, stage.clientWidth, stage.clientHeight - bands.top - bands.bottom);
        renderer.render(scene, camera);
        renderer.setScissorTest(false); renderer.autoClear = true;
      } else renderer.render(scene, camera);
      model.chambers.forEach((c, i) => { const p = new THREE.Vector3(c.x, labelHeights.get(c.id), c.z).project(camera), node = labelNodes[i]; node.textContent = mode === 'tour' && c.id === chapters[chapterIndex].place ? `${chapters[chapterIndex].number} ${chapters[chapterIndex].name}` : `${c.name}${c.note ? ` · ${c.note}` : ''}`; node.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1 || !(mode === 'tour' && chapters[chapterIndex].place ? c.id === chapters[chapterIndex].place : mode === 'explore' && c.id === activePlace); node.dataset.x = (p.x + 1) / 2 * stage.clientWidth; node.dataset.y = (1 - p.y) / 2 * stage.clientHeight; const pick = new THREE.Vector3(c.x, 0, c.z).project(camera); node.dataset.pickX = (pick.x + 1) / 2 * stage.clientWidth; node.dataset.pickY = (1 - pick.y) / 2 * stage.clientHeight; });
      placeLabels(document, stage, labelNodes);
      const project = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return [(p.x + 1) / 2 * stage.clientWidth, (1 - p.y) / 2 * stage.clientHeight]; };
      root.dataset.hiveTarget = JSON.stringify(project(...current.target));
      const place = model.chambers.find(n => n.id === chapters[chapterIndex].place);
      const corners = place ? [place.bounds.min[0], place.bounds.max[0]].flatMap(x => [place.bounds.min[1], place.bounds.max[1]].flatMap(y => [place.bounds.min[2], place.bounds.max[2]].map(z => project(x, y, z)))) : [];
      root.dataset.hivePlaceBox = JSON.stringify(corners.length ? { left: Math.min(...corners.map(p => p[0])), right: Math.max(...corners.map(p => p[0])), top: Math.min(...corners.map(p => p[1])), bottom: Math.max(...corners.map(p => p[1])) } : null);
      root.dataset.hiveStreetSamples = JSON.stringify(model.roads.filter(r => r.id.startsWith('ring-')).filter((_, i) => i >= CITY.arcSamples / 2).slice(0, 5).map(r => {
        const a = r.path[0], b = r.path[1], x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, length = Math.hypot(x, z), offset = CITY.probeOffset;
        return { street: project(x, STREETS.ringElevation + STREETS.thickness / 2, z), ground: project(x + x / length * offset, STREETS.elevation - STREETS.thickness, z + z / length * offset) };
      }));
      root.dataset.hivePose = JSON.stringify({ target: current.target.map(v => +v.toFixed(3)), position: camera.position.toArray().map(v => +v.toFixed(3)) });
    } else { drawPixel(ctx, raster, mode === 'tour' ? chapters[chapterIndex].component : selected); labelNodes.forEach(n => { n.hidden = true; }); root.dataset.hivePose = 'pixel'; }
    if (renderer) root.dataset.hiveFrameStats = JSON.stringify({ cpuMs: performance.now() - frameStart, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
    root.dataset.hiveChapter = mode === 'tour' ? chapters[chapterIndex].id : entered ? `enter/${entered}` : 'explore';
  };
  // Readiness is armed only after readHash has scrolled and applied the requested chapter pose.
  let initialized = false;
  const first = firstFrame(rendererName, draw, name => { root.dataset.hiveReady = name; }, () => initialized);
  const frame = () => { if (initialized) first(); else draw(); };
  const resize = () => {
    const ratio = Math.min(devicePixelRatio, STYLE.pixelRatioCap);
    drawing.width = stage.clientWidth * ratio; drawing.height = stage.clientHeight * ratio;
    const context = drawing.getContext('2d'), scale = Math.min(drawing.width / raster.width, drawing.height / raster.height);
    context.setTransform(scale, 0, 0, scale, (drawing.width - raster.width * scale) / 2, (drawing.height - raster.height * scale) / 2);
    drawPlan(context, raster); phoneCardTop = null;
    if (renderer) { renderer.setSize(stage.clientWidth, stage.clientHeight, false); camera.aspect = aspect(); camera.updateProjectionMatrix(); }
    sizeSpans();
    if (mode === 'tour') { scrollTo(0, scrollAtStage(progress, stage.clientHeight, spans)); setPose(poseAtStage()); }
    else setPose(entered ? focus(model, entered, aspect()) : overview(model, aspect()));
    frame();
  };
  resize(); readHash(); initialized = true; current = desired; frame();
  new ResizeObserver(resize).observe(stage); addEventListener('resize', resize); addEventListener('hashchange', readHash); addEventListener('popstate', readHash); addEventListener('scroll', scrollProgress, { passive: true }); preference.addEventListener('change', () => { scrollProgress(); frame(); });
  const pick = event => {
    const rect = canvas.getBoundingClientRect();
    if (renderer) { const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera); for (const hit of ray.intersectObject(hive, true)) { const ranges = hit.object.userData.pickRanges; if (ranges) { const component = ranges.find(r => hit.faceIndex < r.end)?.component; if (component) return component; } let o = hit.object; while (o && !o.userData.component) o = o.parent; if (o) return o.userData.component; } }
    else { const scale = Math.min(rect.width / raster.width, rect.height / raster.height), x = (event.clientX - rect.left - (rect.width - raster.width * scale) / 2) / scale, y = (event.clientY - rect.top - (rect.height - raster.height * scale) / 2) / scale; const nearest = [...raster.hexes].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; if (Math.hypot(nearest.x - x, nearest.y - y) < STYLE.pixelPadding) return nearest.id; }
    return null;
  };
  bindGestures(canvas, event => { const result = explore({ ...gestureState, mode, selected }, event); gestureState = result.state; return result.effects; }, apply, pick);
  const animate = () => { if (!still && !preference.matches) frame(); requestAnimationFrame(animate); }; requestAnimationFrame(animate);
}
