/**
 * @module apps/hive/main.mjs
 * @purpose Connects the static page to the pure hive models, interactive scene and accessible stories.
 * @inputs Browser document, component JSON, hash, viewport, gestures and motion preference.
 * @outputs A WebGL or pixel hive, all component cards and a named ready mark after drawing.
 * @effects network (same-origin data and module fetches), process (browser animation frames and event handlers)
 * @errors Fetch or incompatible data displays one plain error; WebGL setup failure selects pixel.
 */
import { prepare, chooseRenderer, firstFrame, animationStep } from './runtime.mjs';
import { focus, overview } from './camera.mjs';
import { textLayer, renderText } from './text-layer.mjs';
import { pixel, drawPixel } from './pixel.mjs';
import { buildHive } from './assets/hive.mjs';
import { buildMaterials } from './assets/materials.mjs';
import { STYLE, HIVE_BACKGROUND } from './config.mjs';
const stories = document.querySelector('#stories');
const stage = document.querySelector('.stage');
const labels = document.querySelector('.labels');
let canvas = document.querySelector('canvas');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const still = new URLSearchParams(location.search).has('still');
let data;
try {
  const response = await fetch('components.json'); if (!response.ok) throw new Error(); data = await response.json();
} catch { document.querySelector('#error').textContent = 'hive: component data could not be loaded'; stories.replaceChildren(); }
if (data) {
  const prepared = prepare(data);
  if (prepared.error) { document.querySelector('#error').textContent = prepared.error; stories.replaceChildren(); }
  else await start(data, prepared.scene);
}
async function start(data, model) {
  let rendererName = chooseRenderer(() => canvas.getContext('webgl2', { antialias: true, preserveDrawingBuffer: true }), location.search);
  let THREE, renderer, scene, camera, hive;
  if (rendererName === 'webgl') {
    try {
      THREE = await import('three');
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, STYLE.pixelRatioCap));
      renderer.setClearColor(HIVE_BACKGROUND);
      scene = new THREE.Scene();
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      scene.add(new THREE.HemisphereLight('#ffffff', '#6e776d', 2));
      const sun = new THREE.DirectionalLight('#ffffff', 3); sun.position.set(-20, 35, 18); sun.castShadow = true;
      const extent = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs)) * 1.3;
      Object.assign(sun.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 0.1, far: extent * 8 });
      sun.shadow.mapSize.set(STYLE.shadowMapSize, STYLE.shadowMapSize); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.025;
      scene.add(sun);
      camera = new THREE.PerspectiveCamera(STYLE.fov, 1, 0.1, 10000);
      hive = buildHive(THREE, model, buildMaterials(THREE)); scene.add(hive);
    } catch { renderer?.dispose(); renderer = null; rendererName = 'pixel'; }
  }
  if (rendererName === 'pixel') {
    // A canvas with an existing WebGL context cannot later provide a 2D context.
    const fresh = canvas.cloneNode(); canvas.replaceWith(fresh); canvas = fresh; canvas.classList.add('pixel');
  }
  document.querySelector('#source').textContent = data.project;
  let voice = 'plain';
  const reading = () => renderText(document, stories, textLayer(data, location.hash, rendererName, voice));
  stories.addEventListener('click', event => { const button = event.target.closest('[data-voice]'); if (button) { voice = button.dataset.voice; reading(); frame(); } });
  stories.addEventListener('change', event => { if (event.target.matches('select')) { location.hash = event.target.value; } });
  reading(); scrollTo(0, 0);
  const labelNodes = model.chambers.map(c => {
    const node = document.createElement('span'); node.className = 'label'; node.textContent = c.name; labels.append(node); return node;
  });
  const labelHeights = new Map(hive?.children.filter(c => c.userData.component).map(c => [c.userData.component, c.userData.labelHeight]));
  // Pack measured labels around overlays and earlier labels, keeping leaders at their structures.
  const placeLabels = () => {
    const width = stage.clientWidth, height = stage.clientHeight;
    const rect = n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const blocked = [...document.querySelectorAll('header,.voices,.rail,.chapter-picker,.card.active,footer,.scene-caption,.renderer-line,.coordinate')]
      .filter(n => n.getClientRects().length).map(rect);
    const visible = labelNodes.filter(n => !n.hidden).sort((a, b) => Number(a.dataset.y) - Number(b.dataset.y));
    for (const node of visible) {
      const w = node.offsetWidth, h = node.offsetHeight;
      const gap = parseFloat(getComputedStyle(node).paddingTop);
      const ax = Number(node.dataset.x), ay = Number(node.dataset.y);
      const x = Math.max(gap, Math.min(width - w - gap, ax + h));
      const y = Math.max(gap, Math.min(height - h - gap, ay - h));
      const xs = [x, ax - w - h, gap, width - w - gap, ...blocked.flatMap(b => [b.x - w - gap, b.x + b.w + gap])];
      const ys = [y, gap, height - h - gap, ...blocked.flatMap(b => [b.y - h - gap, b.y + b.h + gap])];
      let best = null, distance = Infinity;
      for (const px of xs) for (const py of ys) {
        if (px < gap || py < gap || px + w + gap > width || py + h + gap > height) continue;
        const d = (px - x) ** 2 + (py - y) ** 2;
        if (d >= distance || blocked.some(b => px < b.x + b.w + gap && px + w + gap > b.x && py < b.y + b.h + gap && py + h + gap > b.y)) continue;
        best = { x: px, y: py, w, h }; distance = d;
      }
      // If a tiny viewport has no free label-sized area, the chapter picker remains the reading.
      if (!best) { node.hidden = true; continue; }
      node.style.left = `${best.x}px`; node.style.top = `${best.y}px`;
      const dx = ax - best.x, dy = ay - best.y - h;
      node.style.setProperty('--leader-length', `${Math.hypot(dx, dy)}px`);
      node.style.setProperty('--leader-angle', `${Math.atan2(-dx, dy)}rad`);
      node.style.setProperty('--anchor-x', `${dx}px`); node.style.setProperty('--anchor-y', `${ay - best.y}px`);
      blocked.push(best);
    }
  };
  const raster = pixel(model); const ctx = rendererName === 'pixel' ? canvas.getContext('2d') : null;
  if (ctx) { canvas.width = raster.width; canvas.height = raster.height; }
  const pose = () => {
    const id = location.hash.slice(1), aspect = stage.clientWidth / stage.clientHeight;
    if (!model.chambers.some(c => c.id === id)) return overview(model, aspect);
    const stop = focus(model, id, aspect);
    // A portrait detail is a close view through the campus, not a miniature
    // building fitted into a horizontal band. The pure fit-all stop remains
    // available for bounds checks; gestures can still pull back from this crop.
    const crop = Math.min(1, Math.sqrt(aspect));
    return { ...stop, position: stop.position.map((v, i) => stop.target[i] + (v - stop.target[i]) * crop) };
  };
  // View perimeter chapters from outside the ring, looking into the campus;
  // an outward-facing camera would leave only empty ground behind the hall.
  const heading = () => {
    const chamber = model.chambers.find(c => c.id === location.hash.slice(1));
    return chamber?.kind === 'governance' ? Math.atan2(chamber.x, chamber.z) : STYLE.cameraElevation / 2;
  };
  let current = pose();
  let desired = current; let yaw = heading(); let zoom = 1;
  const motion = () => ({ still, reduced: preference.matches });
  const chooseStop = () => { desired = pose(); yaw = heading(); zoom = 1; if (still || preference.matches) current = desired; };
  const draw = () => {
    const state = animationStep(performance.now() / 1000, motion());
    if (rendererName === 'webgl') {
      const ease = still || preference.matches ? 1 : STYLE.focusEase;
      current = { ...desired, target: current.target.map((v, i) => v + (desired.target[i] - v) * ease), position: current.position.map((v, i) => v + (desired.position[i] - v) * ease) };
      const vector = current.position.map((v, i) => (v - current.target[i]) * zoom); const angle = yaw + state.camera;
      camera.position.set(current.target[0] + vector[0] * Math.cos(angle) + vector[2] * Math.sin(angle), current.target[1] + vector[1], current.target[2] + vector[2] * Math.cos(angle) - vector[0] * Math.sin(angle));
      camera.lookAt(...current.target); camera.updateMatrixWorld();
      hive.traverse(o => {
        const bee = o.userData.bee; if (!bee) return;
        const phase = state.beePhase + bee.index * Math.PI * 2 / STYLE.beeScale;
        if (bee.kind === 'inFlight') {
          const mix = (Math.sin(phase) + 1) / 2;
          o.position.set(bee.x * (1 - mix), STYLE.beeHeight + Math.cos(phase) * STYLE.beeScale, bee.z * (1 - mix) + Math.sin(phase) * STYLE.cellStep);
          o.rotation.y = phase;
        } else {
          // Recent work rests on the foundation apron. Only in-flight work flies;
          // hundreds of tiny hovering bees otherwise read as rendering debris.
          const side = bee.index % 4, along = (Math.floor(bee.index / 4) - 1) * bee.apron / 2;
          const x = side === 0 ? -bee.apron : side === 2 ? bee.apron : along;
          const z = side === 1 ? -bee.apron : side === 3 ? bee.apron : along;
          o.position.set(bee.x + x, bee.restY, bee.z + z);
          o.rotation.y = side * Math.PI / 2;
        }
      });
      renderer.render(scene, camera);
      model.chambers.forEach((c, i) => {
        const p = new THREE.Vector3(c.x, labelHeights.get(c.id), c.z).project(camera); const node = labelNodes[i];
        node.hidden = Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || p.z > 1;
        node.dataset.x = (p.x + 1) / 2 * stage.clientWidth; node.dataset.y = (1 - p.y) / 2 * stage.clientHeight;
      });
      placeLabels();
    } else {
      drawPixel(ctx, raster);
      labelNodes.forEach(n => { n.hidden = true; });
    }
  };
  const frame = firstFrame(rendererName, draw, name => { document.documentElement.dataset.hiveReady = name; });
  const resize = () => {
    if (renderer) {
      const width = stage.clientWidth, height = stage.clientHeight;
      renderer.setSize(width, height, false); camera.aspect = width / height;
      // The same scene runs beneath every overlay, including the phone's card.
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    chooseStop(); frame();
  };
  new ResizeObserver(resize).observe(stage); resize();
  addEventListener('hashchange', () => { reading(); chooseStop(); frame(); scrollTo(0, 0); });
  preference.addEventListener('change', () => { chooseStop(); frame(); });
  const pointers = new Map(); let down; let moved = false; let pinch = null;
  canvas.addEventListener('pointerdown', e => { pointers.set(e.pointerId, [e.clientX, e.clientY]); down = [e.clientX, e.clientY]; moved = false; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const previous = pointers.get(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]; const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) zoom = Math.max(STYLE.minZoom, Math.min(STYLE.maxZoom, zoom * pinch / distance)); pinch = distance; moved = true;
    } else if (down && Math.abs(e.clientX - down[0]) > Math.abs(e.clientY - down[1])) {
      yaw += (e.clientX - previous[0]) * STYLE.dragScale; moved ||= Math.abs(e.clientX - down[0]) > 5;
    }
    frame();
  });
  const release = e => {
    if (!moved && down && e.type === 'pointerup') {
      const rect = canvas.getBoundingClientRect(); let id;
      if (rendererName === 'webgl') {
        const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2), camera);
        let hit = ray.intersectObject(hive, true)[0]?.object; while (hit && !hit.userData.component) hit = hit.parent; id = hit?.userData.component;
      } else {
        // object-fit: contain letterboxes the small fixed raster.
        const scale = Math.min(rect.width / raster.width, rect.height / raster.height);
        const x = (e.clientX - rect.left - (rect.width - raster.width * scale) / 2) / scale;
        const y = (e.clientY - rect.top - (rect.height - raster.height * scale) / 2) / scale;
        const nearest = [...raster.hexes].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
        if (Math.hypot(nearest.x - x, nearest.y - y) < STYLE.pixelPadding) id = nearest.id;
      }
      if (id) location.hash = id;
    }
    pointers.delete(e.pointerId); pinch = null; down = null;
  };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  const animate = () => { if (!still && !preference.matches) frame(); requestAnimationFrame(animate); }; requestAnimationFrame(animate);
}
