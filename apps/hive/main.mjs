/**
 * @module apps/hive/main.mjs
 * @purpose Wires the scroll tour and deliberate exploration to the shared hive models and scene.
 * @inputs Browser document, paired JSON, hash, scroll, viewport and gesture effects.
 * @outputs WebGL or pixel scene, numbered stories and chapter/pose/ready marks.
 * @effects network (same-origin modules and data), process (browser frames and listeners)
 * @errors Incompatible data displays one plain error; WebGL failure selects pixel.
 */
import { prepare, chooseRenderer, firstFrame, animationStep } from './runtime.mjs';
import { focus, overview } from './camera.mjs';
import { tour, tourPose, chapterProgress } from './tour.mjs';
import { explore, bindGestures } from './explore.mjs';
import { visibleRoads } from './roads.mjs';
import { placeLabels } from './labels.mjs';
import { textLayer, renderText } from './text-layer.mjs';
import { pixel, drawPixel } from './pixel.mjs';
import { buildHive } from './assets/hive.mjs';
import { buildMaterials } from './assets/materials.mjs';
import { STYLE, HIVE_BACKGROUND, NAVIGATION } from './config.mjs';
const stories = document.querySelector('#stories'), stage = document.querySelector('.stage'), labels = document.querySelector('.labels');
let canvas = document.querySelector('canvas');
const preference = matchMedia('(prefers-reduced-motion: reduce)'), still = new URLSearchParams(location.search).has('still');
try {
  const [data, graph] = await Promise.all(['components.json', 'graph.json'].map(async url => { const r = await fetch(url); if (!r.ok) throw new Error('hive: data could not be loaded'); return r.json(); }));
  const prepared = prepare(data, graph);
  if (prepared.error) throw new Error(prepared.error);
  await start(data, graph, prepared.scene);
} catch (error) { document.querySelector('#error').textContent = error.message.startsWith('hive:') ? error.message : 'hive: data could not be loaded'; stories.replaceChildren(); }
async function start(data, graph, model) {
  const chapters = tour(model, graph), sections = document.querySelector('#chapters');
  for (const chapter of chapters) { const section = document.createElement('section'); section.id = chapter.id; section.dataset.chapter = chapter.id; section.style.height = `${NAVIGATION.sectionHeight}svh`; section.setAttribute('aria-label', `${chapter.number} ${chapter.id}`); sections.append(section); }
  let rendererName = chooseRenderer(() => canvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true }), location.search);
  let THREE, renderer, scene, camera, hive, outline;
  if (rendererName === 'webgl') try {
    THREE = await import('three');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, STYLE.pixelRatioCap)); renderer.setClearColor(HIVE_BACKGROUND);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight('#ffffff', '#6e776d', 2));
    const sun = new THREE.DirectionalLight('#ffffff', 3); sun.position.set(-20, 90, 35); sun.castShadow = true;
    const extent = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs)) * 1.3;
    Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 0.1, far: extent * 8 }); sun.shadow.mapSize.set(STYLE.shadowMapSize, STYLE.shadowMapSize); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025; scene.add(sun);
    camera = new THREE.PerspectiveCamera(STYLE.fov, 1, 0.1, 10000); hive = buildHive(THREE, model, buildMaterials(THREE)); scene.add(hive);
    outline = new THREE.Box3Helper(new THREE.Box3(), '#202622'); outline.visible = false; scene.add(outline);
  } catch { renderer?.dispose(); renderer = null; rendererName = 'pixel'; }
  if (rendererName === 'pixel') { const fresh = canvas.cloneNode(); canvas.replaceWith(fresh); canvas = fresh; canvas.classList.add('pixel'); }
  const raster = pixel(model), ctx = rendererName === 'pixel' ? canvas.getContext('2d') : null;
  if (ctx) { canvas.width = raster.width; canvas.height = raster.height; }
  const root = document.documentElement; document.querySelector('#source').textContent = data.project;
  const labelNodes = model.chambers.map(c => { const ch = chapters.find(ch => ch.component === c.id), node = document.createElement('span'); node.className = 'label'; node.dataset.component = c.id; node.textContent = `${ch.number} ${c.name}`; labels.append(node); return node; });
  const labelHeights = new Map(hive?.children.filter(c => c.userData.component).map(c => [c.userData.component, c.userData.labelHeight]));
  let mode = 'tour', voice = 'plain', selected = null, entered = null, progress = 0, chapterIndex = 0, yaw = 0, zoom = 1;
  let gestureState = { mode, selected, zoom }, desired = overview(model), current = desired, readingKey = '';
  const aspect = () => stage.clientWidth / stage.clientHeight;
  const reading = () => {
    const id = mode === 'tour' ? chapters[chapterIndex].component : selected;
    const key = `${id}/${mode}/${voice}`;
    if (key === readingKey) return; readingKey = key;
    renderText(document, stories, textLayer(data, `#${id}`, rendererName, voice, chapters, mode));
    root.dataset.hiveSelection = selected ?? '';
  };
  const setPose = pose => { desired = pose; if (still || preference.matches) current = pose; };
  const apply = effect => {
    if (effect.type === 'hash') location.hash = effect.value;
    else if (effect.type === 'select') { selected = effect.id; reading(); frame(); }
    else if (effect.type === 'orbit') { yaw += effect.delta; frame(); }
    else if (effect.type === 'zoom') { zoom = effect.value; frame(); }
  };
  stories.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.dataset.voice) { voice = button.dataset.voice; reading(); return; }
    const action = button.dataset.action;
    if (action === 'explore') apply({ type: 'hash', value: '#explore' });
    else if (action) { const result = explore({ ...gestureState, selected }, { type: action, id: button.dataset.component }); gestureState = result.state; result.effects.forEach(apply); }
  });
  stories.addEventListener('change', event => { if (event.target.matches('select')) apply({ type: 'hash', value: event.target.value || '#overview' }); });
  const scrollProgress = () => {
    if (mode !== 'tour') return;
    progress = Math.max(0, Math.min(chapters.length - 1, scrollY / sections.firstElementChild.offsetHeight));
    chapterIndex = Math.round(progress); setPose(tourPose(chapters, progress, aspect(), still || preference.matches)); reading(); frame();
  };
  const readHash = () => {
    const hash = decodeURIComponent(location.hash.slice(1)), [kind, id] = hash.split('/');
    const valid = model.chambers.some(c => c.id === id);
    mode = kind === 'explore' || kind === 'enter' && valid ? 'explore' : 'tour';
    root.dataset.hiveMode = mode; document.body.classList.toggle('exploring', mode === 'explore');
    entered = kind === 'enter' && valid ? id : null; selected = valid && mode === 'explore' ? id : null;
    gestureState = { mode, selected, zoom: 1 }; yaw = 0; zoom = 1;
    sections.hidden = mode === 'explore';
    if (mode === 'tour') { progress = chapterProgress(chapters, `#${hash}`); chapterIndex = progress; scrollTo(0, sections.children[chapterIndex].offsetTop); setPose(tourPose(chapters, progress, aspect(), still || preference.matches)); }
    else if (entered) setPose(focus(model, entered, aspect()));
    else setPose(overview(model, aspect()));
    reading(); frame();
  };
  const draw = () => {
    const state = animationStep(performance.now() / 1000, { still, reduced: preference.matches });
    if (renderer) {
      const ease = still || preference.matches ? 1 : STYLE.focusEase;
      current = { ...desired, target: current.target.map((v, i) => v + (desired.target[i] - v) * ease), position: current.position.map((v, i) => v + (desired.position[i] - v) * ease) };
      const vector = current.position.map((v, i) => (v - current.target[i]) * zoom), angle = yaw;
      camera.position.set(current.target[0] + vector[0] * Math.cos(angle) + vector[2] * Math.sin(angle), current.target[1] + vector[1], current.target[2] + vector[2] * Math.cos(angle) - vector[0] * Math.sin(angle)); camera.lookAt(...current.target); camera.updateMatrixWorld();
      const active = mode === 'tour' ? chapters[chapterIndex].component : selected, visible = visibleRoads(model.roads, active);
      hive.children.forEach(o => {
        if (o.userData.road) { o.visible = visible.some(r => r.id === o.userData.road); const incident = active && o.userData.road.split('/').includes(active); o.traverse(m => { if (m.isMesh) { if (!m.userData.original) { m.userData.original = m.material; m.material = m.material.clone(); } m.material.color.set(incident ? '#303831' : '#b7bcb8'); } }); }
        if (o.userData.component) o.traverse(m => { if (m.isMesh) { m.userData.highlight ??= m.material.clone(); m.material = m.userData.highlight; m.material.emissive?.set(o.userData.component === active ? '#303831' : '#000000'); m.material.emissiveIntensity = 0.12; } });
      });
      hive.traverse(o => { const bee = o.userData.bee; if (!bee) return; const phase = state.beePhase + bee.index * Math.PI * 2 / STYLE.beeScale; if (bee.kind === 'inFlight') { const mix = (Math.sin(phase) + 1) / 2; o.position.set(bee.x * (1 - mix), STYLE.beeHeight + Math.cos(phase) * STYLE.beeScale, bee.z * (1 - mix) + Math.sin(phase) * STYLE.cellStep); o.rotation.y = phase; } else { const side = bee.index % 4, along = (Math.floor(bee.index / 4) - 1) * bee.apron / 2; o.position.set(bee.x + (side === 0 ? -bee.apron : side === 2 ? bee.apron : along), bee.restY, bee.z + (side === 1 ? -bee.apron : side === 3 ? bee.apron : along)); o.rotation.y = side * Math.PI / 2; } });
      outline.visible = mode === 'explore' && Boolean(selected);
      if (outline.visible) { const c = model.chambers.find(c => c.id === selected); outline.box.set(new THREE.Vector3(...c.bounds.min), new THREE.Vector3(...c.bounds.max)); }
      renderer.render(scene, camera);
      model.chambers.forEach((c, i) => { const p = new THREE.Vector3(c.x, labelHeights.get(c.id), c.z).project(camera), node = labelNodes[i]; node.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1 || c.role === 'outside' && chapterIndex < chapters.findIndex(ch => ch.id === 'outside') && mode === 'tour'; node.dataset.x = (p.x + 1) / 2 * stage.clientWidth; node.dataset.y = (1 - p.y) / 2 * stage.clientHeight; const pick = new THREE.Vector3(c.x, 0, c.z).project(camera); node.dataset.pickX = (pick.x + 1) / 2 * stage.clientWidth; node.dataset.pickY = (1 - pick.y) / 2 * stage.clientHeight; });
      placeLabels(document, stage, labelNodes);
      root.dataset.hivePose = JSON.stringify({ target: current.target.map(v => +v.toFixed(3)), position: camera.position.toArray().map(v => +v.toFixed(3)) });
    } else { drawPixel(ctx, raster, mode === 'tour' ? chapters[chapterIndex].component : selected); labelNodes.forEach(n => { n.hidden = true; }); root.dataset.hivePose = 'pixel'; }
    root.dataset.hiveChapter = mode === 'tour' ? chapters[chapterIndex].id : entered ? `enter/${entered}` : 'explore';
  };
  // Readiness is armed only after readHash has scrolled and applied the requested chapter pose.
  let initialized = false;
  const first = firstFrame(rendererName, draw, name => { root.dataset.hiveReady = name; }, () => initialized);
  const frame = () => { if (initialized) first(); else draw(); };
  const resize = () => {
    if (renderer) { renderer.setSize(stage.clientWidth, stage.clientHeight, false); camera.aspect = aspect(); camera.updateProjectionMatrix(); }
    if (mode === 'tour') { progress = chapterIndex; scrollTo(0, sections.children[chapterIndex].offsetTop); setPose(tourPose(chapters, progress, aspect(), still || preference.matches)); }
    else setPose(entered ? focus(model, entered, aspect()) : overview(model, aspect()));
    frame();
  };
  resize(); readHash(); initialized = true; current = desired; frame();
  new ResizeObserver(resize).observe(stage); addEventListener('resize', resize); addEventListener('hashchange', readHash); addEventListener('scroll', scrollProgress, { passive: true }); preference.addEventListener('change', scrollProgress);
  const pick = event => {
    const rect = canvas.getBoundingClientRect();
    if (renderer) { const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera); for (const hit of ray.intersectObject(hive, true)) { let o = hit.object; while (o && !o.userData.component) o = o.parent; if (o) return o.userData.component; } }
    else { const scale = Math.min(rect.width / raster.width, rect.height / raster.height), x = (event.clientX - rect.left - (rect.width - raster.width * scale) / 2) / scale, y = (event.clientY - rect.top - (rect.height - raster.height * scale) / 2) / scale; const nearest = [...raster.hexes].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; if (Math.hypot(nearest.x - x, nearest.y - y) < STYLE.pixelPadding) return nearest.id; }
    return null;
  };
  bindGestures(canvas, event => { const result = explore({ ...gestureState, mode, selected }, event); gestureState = result.state; return result.effects; }, apply, pick);
  const animate = () => { if (!still && !preference.matches) frame(); requestAnimationFrame(animate); }; requestAnimationFrame(animate);
}
