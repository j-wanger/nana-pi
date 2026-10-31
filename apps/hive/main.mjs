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
import { tour, tourPose, chapterProgress, stageAtScroll, chapterSpans, scrollAtStage, cardBlend, openingState, followStage } from './tour.mjs';
import { explore, bindGestures } from './explore.mjs';
import { visibleRoads } from './city.mjs';
import { placeLabels, safeBands } from './labels.mjs';
import { textLayer, renderText } from './text-layer.mjs';
import { pixel, drawPixel, drawPlan } from './pixel.mjs';
import { buildHive, animateHive, emphasizeReturns } from './assets/hive.mjs';
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
    // Screen-space ink signs keep human-scale figures and crates legible at city
    // distance, without enlarging their geometry or changing the shared scale.
    const markerGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);
    const markerMaterial = new THREE.PointsMaterial({ color: '#303831', size: OUTLINES.fullPixels, sizeAttenuation: false });
    const residents = []; hive.traverse(o => { if (o.userData.role || o.userData.traffic) residents.push(o); });
    for (const o of residents) { const mark = new THREE.Points(markerGeometry, o.userData.packet ? new THREE.PointsMaterial({ color: '#ffffff', size: OUTLINES.fullPixels, sizeAttenuation: false }) : markerMaterial); mark.position.y = (o.userData.traffic || o.userData.packet ? CARGO.size : WORKERS.height) / 2; o.add(mark); o.userData.distanceMarker = mark; }
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
  let gestureState = { mode, selected, zoom }, desired = overview(model), current = desired, readingKey = '', fadeKey = '', visibleCard = '';
  let width = stage.clientWidth, height = stage.clientHeight, targetStage = 0;
  let follower = { stage: 0, velocity: 0, target: 0, quiet: 0 }, layoutDirty = true, bands = { top: 0, bottom: 0 }, labelCache = {};
  const aspect = () => width / height;
  const poseAtStage = () => openingState(chapters, progress, aspect(), still || preference.matches).pose;
  const reading = () => {
    const id = mode === 'tour' ? chapters[chapterIndex].id : selected;
    const key = `${id}/${mode}/${voice}`;
    if (key !== readingKey) { readingKey = key; layoutDirty = true; labelCache = {}; renderText(document, stories, textLayer(data, `#${id}`, rendererName, voice, chapters, mode)); }
    if (mode === 'tour') {
      const exact = cardBlend(progress, chapters.length), bucket = Math.round(exact.mix * TOUR_SCROLL.fadeBuckets);
      const nextFadeKey = `${key}/${exact.index}/${bucket}/${progress < 1 && !still && !preference.matches}`;
      if (fadeKey === nextFadeKey) return;
      fadeKey = nextFadeKey;
      const blend = cardBlend(exact.index + (1 - TOUR_SCROLL.crossFade) + bucket / TOUR_SCROLL.fadeBuckets * TOUR_SCROLL.crossFade, chapters.length);
      const nextVisible = blend.inOpacity > TOUR_SCROLL.opacityThreshold ? blend.next : blend.outOpacity > TOUR_SCROLL.opacityThreshold ? blend.index : visibleCard;
      if (nextVisible !== visibleCard) { visibleCard = nextVisible; layoutDirty = true; labelCache = {}; }
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
    targetStage = stageAtScroll(scrollY, height, spans);
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
      else { scrollTo(0, top); targetStage = progress = destination; follower = { stage: progress, velocity: 0, target: progress, quiet: 0 }; chapterIndex = destination; setPose(poseAtStage()); }
    } else if (entered) setPose(focus(model, entered, aspect()));
    else setPose(overview(model, aspect()));
    hashRead = true;
    reading(); frame();
  };
  let shadowScale;
  const draw = () => {
    const frameStart = performance.now();
    root.dataset.hiveStage = String(progress);
    root.dataset.hiveTargetStage = String(targetStage);
    if (renderer) {
      const intro = openingState(chapters, progress, aspect(), mode !== 'tour' || still || preference.matches);
      // The first frame is covered by the opaque plan: cache full-height architecture
      // once, then flatten only the visible city. Never rebuild sun shadows on scroll.
      hive.scale.y = shadowScale === undefined ? 1 : Math.max(0.001, intro.cityScale);
      shadowScale = 1;
      opening.hidden = intro.planOpacity === 0; opening.style.opacity = '1';
      drawing.style.opacity = String(intro.planOpacity);
      title.style.opacity = prompt.style.opacity = String(intro.planOpacity);
      current = desired;
      camera.fov = current.fov; camera.updateProjectionMatrix();
      const vector = current.position.map((v, i) => (v - current.target[i]) * zoom), angle = yaw;
      camera.position.set(current.target[0] + vector[0] * Math.cos(angle) + vector[2] * Math.sin(angle), current.target[1] + vector[1], current.target[2] + vector[2] * Math.cos(angle) - vector[0] * Math.sin(angle)); camera.lookAt(...current.target);
      if (layoutDirty) {
        bands = safeBands(document, stage);
        const cards = [...stories.querySelectorAll('.card:not([hidden])')];
        if (cards.length) phoneCardTop = Math.min(...cards.map(n => n.getBoundingClientRect().top));
        labelCache = { bands, width, height }; layoutDirty = false;
      }
      const cardTop = Math.min(height - bands.bottom, phoneCardTop ?? height);
      if (bands.top && intro.planOpacity === 0) camera.setViewOffset(width, height, 0, viewCentreOffset(height, bands.top, height - cardTop), width, height);
      else camera.clearViewOffset();
      camera.updateMatrixWorld();
      const active = mode === 'tour' ? chapters[chapterIndex].component : selected, visible = visibleRoads(model.roads, mode === 'tour' ? chapters[chapterIndex].id : null);
      const activePlace = model.chambers.find(c => c.component === active || c.id === active)?.id;
      hive.userData.batchSelection.value = mode === 'explore' ? hive.userData.batchOwners.indexOf(active) : -1;
      const selectionKey = `${mode}/${chapterIndex}/${selected}`;
      if (hive.userData.selectionKey !== selectionKey) { hive.userData.selectionKey = selectionKey; emphasizeReturns(hive, mode === 'tour' ? chapters[chapterIndex].flows : []); hive.children.forEach(o => {
        if (o.userData.road) { o.visible = visible.some(r => r.id === o.userData.road); const incident = mode === 'explore' && activePlace && model.roads.find(r => r.id === o.userData.road && [r.from, r.to].includes(activePlace)); o.traverse(m => { if (m.isMesh && m.userData.roadSurface) { if (!m.userData.original) { m.userData.original = m.material; m.material = m.material.clone(); } m.material.color.set(incident ? '#171c19' : m.userData.original.color); } }); }
        if (o.userData.component) o.traverse(m => { if (m.isMesh) { m.userData.highlight ??= m.material.clone(); m.material = m.userData.highlight; m.material.emissive?.set(o.userData.component === active ? '#303831' : '#000000'); m.material.emissiveIntensity = 0.12; } });
      }); }
      const worldPosition = new THREE.Vector3();
      hive.traverse(o => {
        if (o.userData.role || o.userData.workplace || o.userData.mechanism || o.userData.traffic || o.userData.packet) {
          o.getWorldPosition(worldPosition);
          const size = o.userData.traffic || o.userData.packet ? CARGO.size : WORKERS.height;
          const pixels = size * height / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.distanceTo(worldPosition));
          o.visible = Boolean(o.userData.mechanism || o.userData.distanceMarker) || pixels >= OUTLINES.fadePixels;
          if (o.userData.distanceMarker) o.userData.distanceMarker.visible = Boolean(o.userData.packet) || pixels < OUTLINES.fullPixels;
        }
      });
      animateHive(hive, performance.now() / 1000, still || preference.matches);
      outline.visible = Boolean(activePlace) && (mode === 'explore' || chapters[chapterIndex].visit);
      if (outline.visible) { const c = model.chambers.find(c => c.id === activePlace); outline.box.set(new THREE.Vector3(...c.bounds.min), new THREE.Vector3(...c.bounds.max)); }
      stage.style.setProperty('--safe-top', `${bands.top}px`); stage.style.setProperty('--safe-bottom', `${bands.bottom}px`);
      if (bands.top || bands.bottom) {
        // Paving continues behind the controls; geometry and dark streets stay
        // inside the safe band, including roads projecting through the bottom edge.
        // The clear colour is the unlit paving tone. One colour pass keeps all
        // structures inside the phone band without rendering the scene twice.
        renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
        renderer.setScissor(0, bands.bottom, width, height - bands.top - bands.bottom);
        renderer.render(scene, camera);
        renderer.setScissorTest(false);
      } else renderer.render(scene, camera);
      model.chambers.forEach((c, i) => { const p = new THREE.Vector3(c.x, labelHeights.get(c.id), c.z).project(camera), node = labelNodes[i]; node.textContent = mode === 'tour' && c.id === chapters[chapterIndex].place ? `${chapters[chapterIndex].number} ${chapters[chapterIndex].name}` : `${c.name}${c.note ? ` · ${c.note}` : ''}`; node.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1 || !(mode === 'tour' && chapters[chapterIndex].place ? [chapters[chapterIndex].place, ...chapters[chapterIndex].visits].includes(c.id) : mode === 'explore' && c.id === activePlace); node.dataset.x = (p.x + 1) / 2 * width; node.dataset.y = (1 - p.y) / 2 * height; const pick = new THREE.Vector3(c.x, 0, c.z).project(camera); node.dataset.pickX = (pick.x + 1) / 2 * width; node.dataset.pickY = (1 - pick.y) / 2 * height; });
      placeLabels(document, stage, labelNodes, labelCache);
      const project = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return [(p.x + 1) / 2 * width, (1 - p.y) / 2 * height]; };
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
  let dirty = true;
  const frame = () => { dirty = true; };
  let viewportRatio;
  const resize = () => {
    const nextWidth = stage.clientWidth, nextHeight = stage.clientHeight, ratio = Math.min(devicePixelRatio, STYLE.pixelRatioCap);
    // ResizeObserver's initial notification must not clear an already-ready still
    // canvas between its ready mark and a reader's pixel probe.
    if (initialized && width === nextWidth && height === nextHeight && viewportRatio === ratio) return;
    width = nextWidth; height = nextHeight; viewportRatio = ratio; layoutDirty = true; labelCache = {};
    drawing.width = stage.clientWidth * ratio; drawing.height = stage.clientHeight * ratio;
    const context = drawing.getContext('2d'), scale = Math.min(drawing.width * (aspect() > 1 ? 0.72 : 0.96) / raster.width, drawing.height * 0.52 / raster.height);
    context.setTransform(scale, 0, 0, scale, (drawing.width - raster.width * scale) / 2 + (aspect() > 1 ? drawing.width * 0.08 : 0), drawing.height * 0.4);
    drawPlan(context, raster); phoneCardTop = null;
    if (renderer) { renderer.setSize(stage.clientWidth, stage.clientHeight, false); camera.aspect = aspect(); camera.updateProjectionMatrix(); }
    sizeSpans();
    if (mode === 'tour') { scrollTo(0, scrollAtStage(progress, height, spans)); targetStage = progress; follower = { stage: progress, velocity: 0, target: progress, quiet: 0 }; setPose(poseAtStage()); }
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
  let lastFrame, lastReadKey;
  const animate = now => {
    const dt = lastFrame === undefined ? 0 : (now - lastFrame) / 1000; lastFrame = now;
    if (mode === 'tour') {
      follower = still || preference.matches ? { stage: targetStage, velocity: 0, target: targetStage, quiet: 0 } : followStage(follower, targetStage, dt);
      if (progress !== follower.stage) { progress = follower.stage; chapterIndex = Math.floor(progress); setPose(poseAtStage()); dirty = true; }
      const readKey = `${chapterIndex}/${voice}/${Math.round(cardBlend(progress, chapters.length).mix * TOUR_SCROLL.fadeBuckets)}/${progress < 1 && !still && !preference.matches}`;
      if (lastReadKey !== readKey) { lastReadKey = readKey; reading(); }
    }
    if (dirty || !still && !preference.matches) { first(); dirty = false; }
    requestAnimationFrame(animate);
  }; requestAnimationFrame(animate);
}
