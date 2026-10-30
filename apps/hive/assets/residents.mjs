/**
 * @module apps/hive/assets/residents.mjs
 * @purpose Builds one grounded jointed figure kit with role equipment and place-specific work loops.
 * @inputs Explicit THREE, shared materials, role and work phase.
 * @outputs Solid outlined figures with articulated limbs, equipment and contact shadows.
 * @effects none
 * @errors None.
 */
import { box, drum, hoop, outline } from './parts.mjs';
import { WORKERS } from '../config.mjs';
export function buildResident(THREE, materials, role = 'builder') {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1), joints = [];
  group.userData.role = role; group.userData.joints = joints;
  const block = (parent, x, y, z, w, h, d, mat = materials.status.sound) => { const m = box(THREE, materials, cube, parent, x, y, z, w, h, d, mat); outline(THREE, m); return m; };
  const body = block(group, 0, 1.02, 0, 0.42, 0.55, 0.25);
  block(group, 0, 1.33, 0, 0.12, 0.14, 0.12);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), materials.status.sound); head.position.y = WORKERS.height - 0.22; head.castShadow = true; group.add(head); outline(THREE, head);
  block(group, 0, 1.14, 0.14, 0.28, 0.12, 0.035, materials.bee);
  const limb = (x, y, upper, lower, width) => {
    const pivot = new THREE.Group(), bend = new THREE.Group(); pivot.position.set(x, y, 0); group.add(pivot);
    block(pivot, 0, -upper / 2, 0, width, upper, width); bend.position.y = -upper; pivot.add(bend);
    block(bend, 0, -lower / 2, 0, width * 0.85, lower, width * 0.85); joints.push(pivot, bend); return pivot;
  };
  for (const side of [-1, 1]) { limb(side * 0.12, 0.76, 0.34, 0.34, 0.13); block(group, side * 0.12, 0.04, 0.06, 0.16, 0.08, 0.28, materials.bee); }
  for (const side of [-1, 1]) limb(side * 0.29, 1.25, 0.3, 0.28, 0.11);
  const gear = new THREE.Group(); gear.userData.equipment = role; group.add(gear);
  if (role === 'builder') {
    const hat = drum(THREE, materials, gear, 0, 1.76, 0, 0.28, 0.08, materials.bee); outline(THREE, hat);
    const crown = drum(THREE, materials, gear, 0, 1.82, 0, 0.2, 0.12); outline(THREE, crown);
    const load = block(gear, 0, 1, 0.46, 0.55, 0.4, 0.4, materials.bee); load.userData.load = true;
  } else if (role === 'seat') {
    block(gear, 0, 1.79, 0, 0.5, 0.05, 0.08, materials.ink);
    for (const side of [-1, 1]) block(gear, side * 0.24, 1.59, 0, 0.08, 0.3, 0.13, materials.bee);
    block(gear, 0.25, 1.5, 0.14, 0.07, 0.07, 0.35, materials.ink);
  } else if (role === 'adversary') {
    for (const side of [-1, 1]) { const cross = block(gear, 0, 1.18, 0.17, 0.28, 0.035, 0.035, materials.ink); cross.rotation.z = side * Math.PI / 4; }
  } else if (role === 'visual judge') {
    block(gear, 0, 1.6, 0.21, 0.42, 0.08, 0.04, materials.ink);
  } else if (role === 'reviewer') {
    block(gear, 0, 1.25, 0.17, 0.3, 0.22, 0.05, materials.bee);
  } else if (role === 'projectionist') {
    block(gear, 0, 1.77, 0, 0.4, 0.08, 0.32, materials.bee);
  } else if (role === 'customs') {
    block(gear, 0, 1.79, 0.05, 0.48, 0.08, 0.4, materials.ink);
    block(gear, 0.13, 1.2, 0.16, 0.08, 0.12, 0.035, materials.ink);
  } else if (role === 'planner') {
    block(gear, -0.13, 1.74, 0, 0.05, 0.32, 0.05, materials.ink);
  }
  // Soft radial contact shadow, above the supporting deck but below the feet.
  const size = 16, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = (y * size + x) * 4, r = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1); pixels[i + 3] = Math.max(0, 1 - r) ** 2 * 65; }
  const texture = new THREE.DataTexture(pixels, size, size); texture.needsUpdate = true;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.006; group.add(shadow);
  body.userData.body = true;
  return group;
}
export function buildWorkplace(THREE, materials, role) {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1);
  const block = (...args) => { const m = box(THREE, materials, cube, group, ...args); outline(THREE, m); return m; };
  if (['planner', 'adversary', 'reviewer'].includes(role)) {
    block(0, 0.55, 0.7, 0.16, 1.1, 0.16, materials.bee); block(0, 1.13, 0.7, 1.3, 0.12, 0.8);
    const sheet = block(0, 1.21, 0.7, 0.8, 0.025, 0.6); sheet.userData.sheet = role;
    for (let i = 0; i < 3; i++) { const mark = block(-0.15, 1.23, 0.55 + i * 0.14, 0.4, 0.012, 0.025, materials.ink); mark.userData.drawing = true; }
    if (role === 'adversary') for (const side of [-1, 1]) { const mark = block(0, 1.25, 0.7, 0.6, 0.025, 0.045, materials.ink); mark.rotation.y = side * Math.PI / 4; mark.userData.strike = true; }
  } else if (role === 'visual judge') {
    for (const x of [-0.7, 0.7]) block(x, 1.2, 0.8, 0.08, 2.4, 0.08, materials.bee);
    for (const y of [0.5, 2.4]) block(0, y, 0.8, 1.5, 0.08, 0.08);
    const card = block(0, 1.4, 0.5, 0.6, 0.7, 0.06); card.userData.judgeCard = true;
    const light = block(0.8, 2.4, 0.8, 0.2, 0.2, 0.12, materials.windows.lit); light.userData.passLight = true;
  } else if (role === 'projectionist') {
    block(0, 0.7, 0.7, 0.18, 1.4, 0.18); block(0, 1.5, 0.7, 0.7, 0.5, 0.5, materials.bee);
    for (const x of [-0.35, 0.35]) { const reel = hoop(THREE, materials, group, x, 2, 0.7, 0.3); reel.userData.reel = true; block(x, 2, 0.7, 0.5, 0.06, 0.06, materials.bee).userData.reel = true; }
  } else if (role === 'customs') {
    block(0.6, 0.65, 0.6, 0.25, 1.3, 0.25, materials.bee);
    const pivot = new THREE.Group(); pivot.position.set(0.6, 1.3, 0.6); pivot.userData.barrier = true; group.add(pivot);
    const arm = box(THREE, materials, cube, pivot, -0.85, 0, 0, 1.8, 0.1, 0.12); outline(THREE, arm);
  } else if (role === 'builder') {
    const frame = block(0, 1, -0.5, 0.18, 2, 0.18); frame.userData.growingFrame = true;
    block(0.8, 1, -0.5, 0.18, 2, 0.18).userData.growingFrame = true;
    block(0.4, 2, -0.5, 1, 0.18, 0.18).userData.growingFrame = true;
  }
  group.userData.workplace = role; return group;
}
export function animateWorkplace(group, phase, frozen) {
  const t = frozen ? 0.25 : phase / WORKERS.loopSeconds % 1;
  group.traverse(o => {
    if (o.userData.sheet) o.position.x = o.userData.sheet === 'planner' ? -Math.sin(t * Math.PI * 2) * 0.3 : Math.sin(t * Math.PI * 2) * 0.3;
    if (o.userData.drawing) o.scale.x = 0.2 + t * 0.8;
    if (o.userData.strike) o.visible = t > 0.5;
    if (o.userData.judgeCard) o.position.y = 1.4 + Math.sin(t * Math.PI * 2) * 0.3;
    if (o.userData.passLight) o.visible = frozen || t > 0.5 && t < 0.75;
    if (o.userData.reel) o.rotation.z = t * Math.PI * 2;
    if (o.userData.barrier) o.rotation.z = -Math.max(0, Math.sin(t * Math.PI * 2)) * Math.PI / 2;
    if (o.userData.growingFrame) o.scale.y = Math.max(0.1, t * 2);
  });
}
export function animateResident(figure, phase, frozen) {
  const t = frozen ? 0.25 : (phase / WORKERS.loopSeconds + (figure.userData.index ?? 0) / WORKERS.crewSize) % 1, wave = Math.sin(t * Math.PI * 2), role = figure.userData.role, joints = figure.userData.joints;
  for (const j of joints) j.rotation.set(0, 0, 0);
  const working = ['planner', 'adversary', 'visual judge', 'projectionist', 'seat', 'customs'].includes(role);
  joints[4].rotation.x = working ? -0.8 : role === 'builder' ? -0.9 : wave * 0.4;
  joints[5].rotation.x = -0.65 + (working ? wave * 0.35 : 0);
  joints[6].rotation.x = role === 'adversary' ? -1.3 + wave * 0.6 : -0.7;
  joints[7].rotation.x = -0.6;
  if (role === 'builder' || role === 'reviewer') { joints[0].rotation.x = wave * 0.4; joints[2].rotation.x = -wave * 0.4; joints[1].rotation.x = Math.max(0, -wave) * 0.5; joints[3].rotation.x = Math.max(0, wave) * 0.5; }
  const home = figure.userData.home;
  if (home) {
    figure.position.set(...home);
    if (role === 'builder') {
      const path = figure.userData.carryPath;
      if (path && !frozen) {
        const lengths = path.slice(1).map((p, i) => Math.hypot(...p.map((v, j) => v - path[i][j]))); let distance = (1 - Math.abs(t * 2 - 1)) * lengths.reduce((a, b) => a + b, 0);
        for (let i = 0; i < lengths.length; i++) { if (distance <= lengths[i] || i === lengths.length - 1) { const a = path[i], b = path[i + 1], f = distance / (lengths[i] || 1); figure.position.set(...a.map((v, j) => v + (b[j] - v) * f)); figure.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]) + (t < 0.5 ? 0 : Math.PI); break; } distance -= lengths[i]; }
      } else { figure.position.z += (1 - Math.cos(t * Math.PI * 2)) * (figure.userData.stride ?? 1); figure.rotation.y = t < 0.5 ? 0 : Math.PI; }
      figure.traverse(o => { if (o.userData.load) o.visible = frozen || t < 0.5; });
    }
    if (role === 'reviewer' && !frozen) {
      const start = figure.userData.startRung ?? 1, rung = Math.min(4, start + Math.floor(phase / WORKERS.loopSeconds) % 4), step = rung === 4 ? 0 : Math.min(1, t * 2), width = figure.userData.rungWidth ?? 1;
      figure.position.x += (rung - start + step) * width;
      const stair = step <= 0.5 ? 0 : step === 1 ? 1.15 : 0.25 + Math.floor((step - 0.5) * 8) * 0.28;
      figure.position.y += (rung - start) * 1.15 + stair;
      if (rung === 4) joints[6].rotation.x = -1 + Math.abs(wave) * 0.5;
    }
  }
  return t;
}
