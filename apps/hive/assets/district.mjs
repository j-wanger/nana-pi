/**
 * @module apps/hive/assets/district.mjs
 * @purpose Builds complete city forms on a repeated plinth and gatehouse kit with audited window lights.
 * @inputs Explicit THREE, one placed lot and shared materials.
 * @outputs A local-space architectural group.
 * @effects none
 * @errors None for a valid lot.
 */
import { box as sharedBox, drum as sharedDrum, hoop as sharedHoop, beam as sharedBeam, fence as sharedFence, outline } from './parts.mjs';
import { STYLE, LIGHTS, DENSITY } from '../config.mjs';
export function buildDistrict(THREE, n, materials) {
  const building = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1), rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  const box = sharedBox.bind(null, THREE, materials, cube), drum = sharedDrum.bind(null, THREE, materials), hoop = sharedHoop.bind(null, THREE, materials);
  const beam = sharedBeam.bind(null, THREE, materials, rod), fence = sharedFence.bind(null, THREE, materials, rod);
  const c = { id: n.component ?? n.id, kind: n.kind, material: { status: 'sound' } }, r = n.radius * DENSITY.footprint, height = STYLE.structureHeight, skin = materials.status.sound, open = false;
  drum(building, 0, -0.25, 0, n.radius, 0.3, materials.rim[n.kind]);
  const kerb = hoop(building, 0, -0.07, 0, n.radius, skin); kerb.rotation.x = Math.PI / 2;
  const face = n.face ?? [0, 1];
  const door = box(building, face[0] * n.radius * 0.86, 0.6, face[1] * n.radius * 0.86, 1, 1.3, 0.65, skin); door.rotation.y = Math.atan2(face[0], face[1]); door.userData.door = true;
  if (n.form === 'tower') {
    drum(building, 0, 3.4, 0, r * 0.45, 6.8);
    for (const y of [1, 3, 5, 7]) drum(building, 0, y, 0, r * 0.58, 0.18, materials.ink);
    drum(building, 0, 7, 0, r * 0.95, 0.2);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(r * 0.8, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin); dish.rotation.x = Math.PI * 0.9; dish.position.y = 8; dish.scale.y = 0.4; dish.castShadow = true; dish.userData.dish = true; building.add(dish);
    beam(building, [0, 6.5, 0], [r * 0.8, 9, 0], 0.06); drum(building, r * 0.8, 9, 0, 0.12, 0.3, materials.ink);
  } else if (['bay', 'hall', 'vault', 'neighbour', 'customers', 'feedback', 'craft'].includes(n.form)) {
    if (n.form === 'craft') {
      drum(building, 0, 1, 0, r, 0.45, skin, r * 0.6);
      drum(building, 0, 1.5, 0, r * 0.5, 0.7, materials.ink, r * 0.2);
      for (const x of [-r * 0.6, r * 0.6]) beam(building, [x, 0.8, 0], [x, 0, r * 0.5], 0.1);
    } else if (n.form === 'feedback') {
      const path = hoop(building, 0, 0.05, 0, r, materials.rim.workflow); path.rotation.x = Math.PI / 2; path.scale.y = 0.6;
      for (const side of [-1, 1]) { box(building, side * r, 0.9, 0, 0.12, 1.8, 0.12); box(building, side * r, 1.8, 0, 0.5, 0.15, 0.5, materials.ink); }
    } else if (n.form === 'customers' || n.form === 'neighbour') {
      for (const [x, z, h] of [[-r * 0.5, 0, 2.5], [r * 0.5, r * 0.2, 3.3], [0, -r * 0.5, 4]]) {
        box(building, x, h / 2, z, r * 0.7, h, r * 0.6); const roof = box(building, x, h + 0.2, z, r * 0.8, 0.2, r * 0.75, materials.ink); roof.rotation.z = 0.15;
      }
    } else {
      if (n.form === 'bay') {
        // The open front lets the crew be seen working inside, not orbiting the lot.
        box(building, 0, 0.1, 0, r * 1.8, 0.2, r * 1.6);
        box(building, 0, 1.8, -r * 0.78, r * 1.8, 3.6, 0.18);
        for (const side of [-1, 1]) box(building, side * r * 0.88, 1.8, 0, 0.18, 3.6, r * 1.6);
      } else box(building, 0, 1.8, 0, r * 1.8, 3.6, r * 1.6);
      for (let i = -1; i <= 1; i++) { const roof = box(building, i * r * 0.6, 3.9, 0, r * 0.72, 0.18, r * 1.7); roof.rotation.z = Math.PI / 8; }
      if (n.form !== 'bay') box(building, 0, 0.9, r * 0.81, r * 0.7, 1.8, 0.06, materials.ink);
      for (const x of [-r * 0.7, r * 0.7]) box(building, x, 2, r * 0.84, 0.12, 4, 0.12, materials.rim.workflow);
      if (n.form === 'vault') for (let i = -2; i <= 2; i++) box(building, i * 0.35, 1, r * 0.84, 0.08, 2, 0.1);
    }
  } else {
    if (c.id === 'compass') {
      // A pocket compass enlarged to architecture: stepped bezel, ruled dial,
      // two-tone pointed needle, pivot and a carrying bow attached to the case.
      drum(building, 0, 0.65, 0, r, 1.3, skin);
      drum(building, 0, 1.34, 0, r * 0.94, 0.12, materials.ink);
      drum(building, 0, 1.42, 0, r * 0.86, 0.12);
      for (const radius of [r * 0.96, r * 0.84, r * 0.64]) {
        const bezel = hoop(building, 0, 1.5, 0, radius); bezel.rotation.x = Math.PI / 2;
      }
      for (let i = 0; i < 48; i++) {
        const a = i * Math.PI / 24, major = i % 4 === 0;
        const tick = box(building, Math.sin(a) * r * 0.74, 1.51, Math.cos(a) * r * 0.74, major ? 0.07 : 0.035, 0.025, r * (major ? 0.17 : 0.08), materials.ink);
        tick.rotation.y = a;
      }
      for (const side of [-1, 1]) {
        const arrow = new THREE.Shape(); arrow.moveTo(0, r * 0.7 * side); arrow.lineTo(-r * 0.18, 0); arrow.lineTo(0, -r * 0.12 * side); arrow.lineTo(r * 0.18, 0); arrow.closePath();
        const needle = new THREE.Mesh(new THREE.ExtrudeGeometry(arrow, { depth: 0.08, bevelEnabled: false }), side === 1 ? materials.ink : materials.rim.workflow);
        needle.rotation.set(-Math.PI / 2, 0, Math.PI / 5); needle.position.y = 1.57; needle.castShadow = true; building.add(needle);
      }
      drum(building, 0, 1.72, 0, 0.18, 0.2, materials.ink);
      box(building, 0, 0.85, -r, r * 0.35, 0.35, 0.3, materials.ink);
      const bow = hoop(building, 0, 0.85, -r * 1.12, r * 0.3); bow.rotation.x = Math.PI / 2;
    } else if (c.id === 'queue') {
      // A long conveyor with separate waiting trays, rollers and an intake gantry.
      for (const z of [-r * 0.55, r * 0.55]) {
        box(building, 0, 1.1, z, r * 2, 0.2, 0.14, materials.ink);
        for (const x of [-r * 0.8, 0, r * 0.8]) box(building, x, 0.55, z, 0.12, 1.1, 0.12);
      }
      for (let i = -7; i <= 7; i++) {
        const roller = drum(building, i * r / 8, 1.1, 0, 0.12, r, skin); roller.rotation.x = Math.PI / 2;
        if (i % 3 === 0) box(building, i * r / 8, 1.5, 0, r * 0.28, 0.55, r * 0.8);
      }
      for (const z of [-r * 0.65, r * 0.65]) box(building, -r * 0.8, 2, z, 0.14, 4, 0.14);
      box(building, -r * 0.8, 4, 0, 0.25, 0.25, r * 1.5);
    } else if (c.id === 'library') {
      // Open archive pavilion, on the existing footprint: a civic entrance,
      // cornices, recessed stacks, a reading desk and individual pale page edges.
      for (const x of [-r * 0.85, r * 0.85]) for (const z of [-r * 0.8, r * 0.65]) {
        box(building, x, 2.4, z, 0.24, 4.8, 0.24, skin);
        for (const y of [0.3, 4.5]) box(building, x, y, z, 0.45, 0.2, 0.45);
      }
      for (const y of [4.65, 4.95]) {
        for (const x of [-r * 0.85, r * 0.85]) box(building, x, y, -r * 0.08, 0.32, 0.2, r * 1.65);
        box(building, 0, y, -r * 0.8, r * 1.85, 0.2, 0.35);
      }
      box(building, 0, 4.65, r * 0.68, r * 1.9, 0.35, 0.65);
      box(building, 0, 5, r * 0.68, r * 2, 0.14, 0.8, materials.ink);
      for (let i = -5; i <= 5; i++) box(building, i * r / 7, 4.68, r * 0.77, 0.04, 0.18, 0.5, materials.ink);
      for (const x of [-r * 0.65, r * 0.65]) {
        box(building, x, 2.1, -r * 0.2, 0.14, 4, r * 1.1, skin);
        for (let shelf = 0; shelf < 5; shelf++) {
          const y = 0.45 + shelf * 0.72;
          box(building, x, y, -r * 0.2, r * 0.45, 0.12, r * 1.12, skin);
          for (let book = -4; book <= 4; book++) {
            const z = -r * 0.2 + book * r / 9, h = 0.4 + (book + 4) % 3 * 0.08;
            box(building, x, y + h / 2 + 0.08, z, r * 0.35, h, 0.13, materials.status.sound);
            box(building, x + (x < 0 ? 1 : -1) * r * 0.18, y + h / 2, z, 0.025, 0.05, 0.1, materials.ink);
          }
        }
      }
      box(building, 0, 0.7, r * 0.2, r * 0.7, 1.4, 0.8, skin);
      box(building, 0, 1.45, r * 0.2, r * 0.85, 0.12, 1.1);
      for (const x of [-0.4, 0.4]) { const leaf = box(building, x, 1.57, r * 0.2, 0.75, 0.06, 0.7); leaf.rotation.z = x < 0 ? -0.08 : 0.08; }
      for (let step = 0; step < 3; step++) box(building, 0, 0.08 + step * 0.1, r * (0.95 - step * 0.1), r * 1.3, 0.18, r * 0.2, materials.status.sound);
    } else if (c.id === 'drafting-table') {
      // An oversized inclined drawing board with a parallel drafting arm.
      for (const x of [-r * 0.7, r * 0.7]) {
        beam(building, [x, 0, -r * 0.65], [x, 3.2, r * 0.5], 0.14, materials.ink);
        beam(building, [x, 0, r * 0.7], [x, 3.2, -r * 0.5], 0.14, materials.ink);
      }
      const board = new THREE.Group(); board.position.y = 3.3; board.rotation.x = -Math.PI / 8; building.add(board);
      box(board, 0, 0, 0, r * 2, 0.16, r * 1.5);
      for (let i = -2; i <= 2; i++) box(board, i * r / 3, 0.1, 0, 0.025, 0.02, r * 1.2, materials.ink);
      box(board, 0, 0.13, r * 0.4, r * 1.9, 0.06, 0.12, materials.ink);
      // A jointed task lamp, attached to a weighted foot rather than a bare pole.
      drum(building, r * 0.8, 0.2, -r * 0.8, 0.45, 0.4, materials.ink);
      beam(building, [r * 0.8, 0.4, -r * 0.8], [r * 0.8, 4.7, -r * 0.8], 0.06);
      beam(building, [r * 0.8, 4.7, -r * 0.8], [0, 4.7, 0], 0.06);
      drum(building, 0, 4.55, 0, 0.45, 0.3, materials.ink, 0.12);
    } else if (c.id === 'tool-belt') {
      // An actual oval belt with sewn pouches, buckle and distinct hand tools.
      drum(building, 0, 0.35, 0, r * 0.72, 0.7);
      const belt = drum(building, 0, 1.3, 0, r * 0.85, 1.3, materials.ink, r * 0.85, true); belt.scale.z = 0.7;
      for (const y of [0.68, 1.95]) { const seam = hoop(building, 0, y, 0, r * 0.86, materials.rim.workflow); seam.rotation.x = Math.PI / 2; seam.scale.y = 0.7; }
      for (const x of [-r * 0.4, r * 0.4]) {
        box(building, x, 1.2, r * 0.59, r * 0.56, 1.3, 0.45);
        box(building, x, 1.88, r * 0.61, r * 0.6, 0.12, 0.5, materials.rim.workflow);
        for (const dx of [-r * 0.23, r * 0.23]) for (let y = 0.75; y <= 1.7; y += 0.19) box(building, x + dx, y, r * 0.825, 0.035, 0.075, 0.025, materials.ink);
      }
      for (const x of [-0.28, 0.28]) box(building, x, 1.4, r * 0.64, 0.1, 0.7, 0.12);
      for (const y of [1.05, 1.75]) box(building, 0, y, r * 0.64, 0.65, 0.1, 0.12);
      box(building, 0, 1.4, r * 0.72, 0.52, 0.06, 0.1);
      // Hammer, screwdriver and open-ended spanner emerge from their pockets.
      box(building, -r * 0.48, 2.55, r * 0.55, 0.22, 2.2, 0.2, materials.ink);
      box(building, -r * 0.48, 3.65, r * 0.55, 1.15, 0.42, 0.42);
      drum(building, r * 0.32, 2.2, r * 0.55, 0.2, 1.15, materials.ink);
      box(building, r * 0.32, 3.15, r * 0.55, 0.085, 1, 0.085);
      box(building, r * 0.32, 3.67, r * 0.55, 0.2, 0.18, 0.08);
      box(building, r * 0.62, 2.6, r * 0.5, 0.22, 2.2);
      box(building, r * 0.62, 3.68, r * 0.5, 0.7, 0.25, 0.2);
      for (const dx of [-0.3, 0.3]) box(building, r * 0.62 + dx, 3.94, r * 0.5, 0.16, 0.55, 0.2);
      for (const side of [-1, 1]) {
        const pocket = box(building, side * r * 0.82, 1.2, 0, 0.45, 1.3, r * 0.65);
        pocket.rotation.z = side * -0.08;
        hoop(building, side * r * 0.83, 1.8, r * 0.2, 0.2);
      }
    } else if (c.id === 'eyes') {
      // Binocular inspection head: hooded lenses, focus wheel, bridge and yoke.
      drum(building, 0, 0.2, 0, r * 0.7, 0.4);
      for (const x of [-r * 0.65, r * 0.65]) beam(building, [x, 0.4, r * 0.45], [0, 2.5, 0], 0.12);
      drum(building, 0, 1.6, 0, 0.22, 2.8, materials.ink);
      box(building, 0, 3.1, 0, r * 1.6, 0.24, 0.45, materials.ink);
      for (const x of [-r * 0.75, r * 0.75]) box(building, x, 3.65, 0, 0.18, 1.2, 0.4);
      box(building, 0, 4, -r * 0.15, r * 1.55, 1.15, r * 0.8);
      for (const x of [-r * 0.42, r * 0.42]) {
        const barrel = drum(building, x, 4.1, r * 0.3, r * 0.34, r * 1.15); barrel.rotation.x = Math.PI / 2;
        for (const z of [r * 0.05, r * 0.17, r * 0.7, r * 0.85]) hoop(building, x, 4.1, z, r * 0.35);
        const lens = drum(building, x, 4.1, r * 0.88, r * 0.29, 0.06, materials.ink); lens.rotation.x = Math.PI / 2;
        hoop(building, x, 4.1, r * 0.92, r * 0.2, materials.rim.workflow);
        const glint = drum(building, x - r * 0.09, 4.1 + r * 0.1, r * 0.94, r * 0.065, 0.02); glint.rotation.x = Math.PI / 2;
        const eyepiece = drum(building, x, 4.1, -r * 0.65, r * 0.2, r * 0.25, materials.ink); eyepiece.rotation.x = Math.PI / 2;
      }
      drum(building, 0, 4.8, -r * 0.2, 0.32, 0.35, materials.ink);
      for (let i = -2; i <= 2; i++) box(building, i * 0.1, 4.99, -r * 0.2, 0.025, 0.03, 0.4);
    } else if (c.id === 'notice-board') {
      // Framed public pinboard: recessed dark backing, paper, pins and rain hood.
      for (const x of [-r * 0.78, r * 0.78]) {
        box(building, x, 2.6, 0, 0.25, 5.2, 0.3);
        box(building, x, 0.18, 0, 0.65, 0.36, 0.8, materials.ink);
        box(building, x, 4, 0.2, 0.16, 3.8, 0.2);
      }
      box(building, 0, 4, 0, r * 1.65, 3.8, 0.25, materials.dark);
      for (const y of [2.1, 5.9]) box(building, 0, y, 0.18, r * 1.8, 0.2, 0.3);
      box(building, 0, 6.05, 0.1, r * 1.95, 0.14, 1);
      box(building, 0, 2, 0.25, r * 1.8, 0.15, 0.7);
      for (let col = -1; col <= 1; col++) for (let row = 0; row < 2; row++) {
        const sheet = new THREE.Group(); sheet.position.set(col * r * 0.51, 3.15 + row * 1.65, 0.18); sheet.rotation.z = col * (row ? -0.05 : 0.04); building.add(sheet);
        box(sheet, 0, 0, 0, r * 0.43, 1.3, 0.05);
        const pin = drum(sheet, 0, 0.5, 0.07, 0.07, 0.08, materials.ink); pin.rotation.x = Math.PI / 2;
        box(sheet, 0, 0.29, 0.04, r * 0.3, 0.08, 0.02, materials.ink);
        for (let line = 0; line < 4; line++) box(sheet, -r * 0.02, 0.04 - line * 0.15, 0.04, r * (line === 3 ? 0.2 : 0.32), 0.035, 0.02, materials.rim.workflow);
      }
    } else if (c.id === 'setup') {
      // An installation hopper funnels many inputs into one machine core.
      drum(building, 0, 0.3, 0, r * 0.55, 0.6);
      drum(building, 0, 2, 0, r * 0.4, 3, materials.ink);
      drum(building, 0, 4.5, 0, r * 0.4, 2.4, skin, r, true);
      const rim = hoop(building, 0, 5.7, 0, r); rim.rotation.x = Math.PI / 2;
      for (const x of [-r * 0.8, r * 0.8]) for (const z of [-r * 0.8, r * 0.8]) beam(building, [x, 0, z], [x, 5.7, z], 0.09);
      box(building, 0, 0.7, r * 0.75, r, 0.3, r * 0.8);
    } else if (c.id === 'release-route') {
      // A raised dispatch ramp carries packages out through an open portal.
      const ramp = new THREE.Group(); ramp.rotation.z = Math.PI / 10; ramp.position.y = 2; building.add(ramp);
      box(ramp, 0, 0, 0, r * 2, 0.2, r, materials.ink);
      for (let i = -3; i <= 3; i++) {
        box(ramp, i * r / 4, 0.45, 0, r * 0.3, 0.8, r * 0.7);
        for (const z of [-r * 0.55, r * 0.55]) {
          const x = i * r / 4, top = 2 + Math.sin(ramp.rotation.z) * x;
          box(building, Math.cos(ramp.rotation.z) * x, top / 2, z, 0.12, top, 0.12);
        }
      }
      for (const z of [-r * 0.75, r * 0.75]) box(building, r * 0.8, 2.4, z, 0.18, 4.8, 0.18);
      box(building, r * 0.8, 4.8, 0, 0.3, 0.3, r * 1.7);
    } else if (c.id === 'desk') {
      // An open control floor: desks and monitors, with an unfinished roof frame.
      for (const x of [-r * 0.6, 0, r * 0.6]) for (const z of [-r * 0.55, r * 0.35]) {
        box(building, x, 1, z, r * 0.45, 0.12, r * 0.5, skin);
        for (const dx of [-r * 0.18, r * 0.18]) box(building, x + dx, 0.5, z, 0.08, 1, 0.08, materials.ink);
        box(building, x, 1.5, z - 0.35, r * 0.32, 0.6, 0.08, materials.ink);
        box(building, x, 0.7, z + 0.7, 0.55, 0.2, 0.55, skin);
        drum(building, x, 0.33, z + 0.7, 0.08, 0.6, materials.ink);
        box(building, x, 0.08, z + 0.7, 0.7, 0.12, 0.5, skin);
      }
      // Connected pale portal frames read as unfinished construction, not black poles.
      for (const x of [-r, r]) for (const z of [-r, r]) {
        box(building, x, 2.25, z, 0.16, 4.5, 0.16, skin);
        box(building, x, 0.18, z, 0.45, 0.36, 0.45, materials.ink);
      }
      for (const x of [-r, r]) box(building, x, 4.5, 0, 0.18, 0.18, r * 2, skin);
      for (const z of [-r, r]) box(building, 0, 4.5, z, r * 2, 0.18, 0.18, skin);
    } else if (c.id === 'lab') {
      // Laboratory bench with a round-bottom flask, conical flask, retort
      // stand, condenser and test-tube rack. Open underside preserves partial status.
      box(building, 0, 1.6, 0, r * 1.9, 0.25, r * 1.5, materials.ink);
      for (const x of [-r * 0.8, r * 0.8]) for (const z of [-r * 0.6, r * 0.6]) {
        box(building, x, 0.75, z, 0.16, 1.5, 0.16, skin);
        box(building, x, 0.1, z, 0.45, 0.2, 0.45, materials.ink);
      }
      box(building, 0, 0.4, -r * 0.6, r * 1.6, 0.12, 0.14, skin);
      const flask = new THREE.Mesh(new THREE.SphereGeometry(r * 0.31, 20, 12), materials.status.sound);
      flask.position.set(-r * 0.45, 2.65, 0); flask.scale.y = 0.95; flask.castShadow = true; building.add(flask);
      drum(building, -r * 0.45, 3.65, 0, 0.19, 1.1);
      const lip = hoop(building, -r * 0.45, 4.2, 0, 0.23); lip.rotation.x = Math.PI / 2;
      drum(building, -r * 0.45, 1.9, 0, 0.45, 0.35, materials.ink);
      drum(building, r * 0.32, 2.35, r * 0.2, r * 0.3, 1.25, materials.status.sound, 0.2);
      drum(building, r * 0.32, 3.25, r * 0.2, 0.2, 0.55);
      const mouth = hoop(building, r * 0.32, 3.55, r * 0.2, 0.24); mouth.rotation.x = Math.PI / 2;
      for (let y = 2; y < 2.8; y += 0.2) box(building, r * 0.32, y, r * 0.2 + r * 0.24, 0.16, 0.03, 0.04, materials.ink);
      box(building, -r * 0.75, 1.8, -r * 0.45, 0.7, 0.12, 0.7);
      beam(building, [-r * 0.75, 1.8, -r * 0.45], [-r * 0.75, 4.6, -r * 0.45], 0.07);
      beam(building, [-r * 0.75, 3.8, -r * 0.45], [-r * 0.45, 3.8, 0], 0.07, materials.ink);
      beam(building, [-r * 0.45, 4.2, 0], [-r * 0.45, 4.5, 0], 0.1, materials.ink);
      beam(building, [-r * 0.45, 4.5, 0], [r * 0.32, 4.5, 0], 0.14);
      beam(building, [r * 0.32, 4.5, 0], [r * 0.32, 3.55, r * 0.2], 0.1, materials.ink);
      for (let i = -2; i <= 2; i++) {
        const x = i * r * 0.16;
        drum(building, x, 2.25, -r * 0.5, 0.1, 1, materials.status.sound);
        const rim = hoop(building, x, 2.76, -r * 0.5, 0.12); rim.rotation.x = Math.PI / 2;
      }
      for (const y of [1.8, 2.45]) box(building, 0, y, -r * 0.5, r, 0.08, 0.35, skin);
      for (const x of [-r * 0.46, r * 0.46]) box(building, x, 2.1, -r * 0.5, 0.1, 0.7, 0.4, skin);
    } else if (c.id === 'stage') {
      // A cylinder core inside a deliberately unclosed signing cage.
      drum(building, 0, 0.3, 0, r, 0.4, materials.ink);
      drum(building, 0, 2.3, 0, r * 0.48, 3.8, skin);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, x = Math.cos(a) * r * 0.85, z = Math.sin(a) * r * 0.85;
        beam(building, [x, 0.5, z], [x, 5.5, z], 0.045, materials.ink);
      }
      const crown = hoop(building, 0, 5.5, 0, r * 0.85); crown.rotation.x = Math.PI / 2;
      box(building, 0, 4.2, 0, r * 0.7, 0.2, r * 0.7);
    } else if (c.id === 'review-ladder' || c.id === 'review-hall') {
      // Exposed review terraces rise sideways: an unmistakable stair silhouette.
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * r * 0.4, y = 0.5 + i * 1.15;
        box(building, x, y / 2, 0, r * 0.4, y, r * 1.6);
        box(building, x, y + 0.07, 0, r * 0.42, 0.14, r * 1.7, materials.ink);
        for (const z of [-r * 0.82, r * 0.82]) fence(building, [x - r * 0.18, y + 0.6, z], [x + r * 0.18, y + 0.6, z], 0.6);
        for (let step = 0; step < 4; step++) box(building, x - r * 0.2 + step * r * 0.1, y - 0.9 + step * 0.28, r * 0.5, r * 0.1, 0.14, r * 0.45);
        box(building, x, y + 0.25, -r * 0.3, r * 0.22, 0.35, r * 0.45, materials.rim.workflow);
      }
    } else if (c.id === 'rulings') {
      // A rotunda of settled decisions, crowned by a faceted dome.
      drum(building, 0, 0.4, 0, r, 0.5);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        drum(building, Math.cos(a) * r * 0.8, 2.6, Math.sin(a) * r * 0.8, 0.13, 4);
      }
      drum(building, 0, 4.7, 0, r, 0.25);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 0.9, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin);
      dome.position.y = 4.85; dome.scale.y = 0.55; dome.castShadow = true; building.add(dome);
    } else if (c.id === 'requirement-contract') {
      // A bound, open contract on a braced lectern: layered paper, stitched
      // covers, metal rings, row checkmarks, signatures and an embossed seal.
      for (const x of [-r * 0.6, r * 0.6]) {
        box(building, x, 0.2, 0, 0.8, 0.4, r * 1.5, materials.ink);
        beam(building, [x, 0.4, r * 0.5], [x, 3, -r * 0.25], 0.14, skin);
        beam(building, [x, 0.4, -r * 0.5], [x, 3, r * 0.25], 0.14, skin);
      }
      const folio = new THREE.Group(); folio.position.y = 3.5; folio.rotation.x = -Math.PI / 9; building.add(folio);
      for (const side of [-1, 1]) {
        const panel = new THREE.Group(); panel.position.x = side * r * 0.43; panel.rotation.y = side * Math.PI / 10; folio.add(panel);
        box(panel, 0, 0, -0.18, r * 0.86, 4.6, 0.2, materials.ink);
        for (let page = 0; page < 4; page++) box(panel, 0, 0.02 * page, -0.04 + page * 0.04, r * 0.8 - page * 0.025, 4.4 - page * 0.04, 0.035);
        box(panel, 0, 1.7, 0.14, r * 0.58, 0.12, 0.035, materials.ink);
        for (let row = -2; row <= 2; row++) {
          const y = row * 0.5;
          for (const dy of [-0.09, 0.09]) box(panel, -r * 0.27, y + dy, 0.15, 0.18, 0.025, 0.025, materials.ink);
          for (const dx of [-0.09, 0.09]) box(panel, -r * 0.27 + dx, y, 0.15, 0.025, 0.18, 0.025, materials.ink);
          beam(panel, [-r * 0.29, y, 0.18], [-r * 0.27, y - 0.05, 0.18], 0.018);
          beam(panel, [-r * 0.27, y - 0.05, 0.18], [-r * 0.22, y + 0.1, 0.18], 0.018);
          box(panel, r * 0.05, y, 0.15, r * 0.42, 0.035, 0.025, materials.ink);
          box(panel, 0, y - 0.14, 0.15, r * 0.32, 0.02, 0.025, materials.rim.workflow);
        }
        for (let stroke = 0; stroke < 4; stroke++) { const mark = box(panel, -r * 0.1 + stroke * 0.14, -1.55, 0.15, 0.25, 0.025, 0.025, materials.ink); mark.rotation.z = stroke % 2 ? 0.3 : -0.3; }
        const seal = drum(panel, r * 0.23, -1.6, 0.2, 0.24, 0.1, materials.rim.workflow); seal.rotation.x = Math.PI / 2;
        hoop(panel, r * 0.23, -1.6, 0.28, 0.17);
      }
      for (const y of [-1.6, -0.8, 0, 0.8, 1.6]) { const ring = hoop(folio, 0, y, 0.1, 0.22); ring.rotation.y = Math.PI / 2; }
      box(folio, 0, 0, -0.25, 0.22, 4.7, 0.25, materials.ink);
    } else if (c.id === 'code-map') {
      // A wire globe of modules and edges, not a solid office tower.
      for (let i = 0; i < 4; i++) { const ring = hoop(building, 0, 3.8, 0, r * 0.9); ring.rotation.y = i * Math.PI / 4; }
      const equator = hoop(building, 0, 3.8, 0, r * 0.9); equator.rotation.x = Math.PI / 2;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, x = Math.cos(a) * r * 0.9, z = Math.sin(a) * r * 0.9;
        box(building, x, 3.8, z, 0.45, 0.45, 0.45);
        beam(building, [x, 3.8, z], [0, 3.8 + (i % 2 ? r * 0.9 : -r * 0.9), 0], 0.025);
      }
      drum(building, 0, 0.4, 0, r * 0.6, 0.8);
      const bottom = 3.8 - r * 0.9;
      drum(building, 0, (0.8 + bottom) / 2, 0, 0.16, Math.max(0.1, bottom - 0.8), materials.ink);
    } else if (c.id === 'identity-scan') {
      // A scanning aperture over a travelling sheet, with a suspended read head.
      for (const x of [-r * 0.8, r * 0.8]) box(building, x, 2.8, 0, 0.22, 5.6, 0.35, materials.ink);
      box(building, 0, 5.6, 0, r * 1.8, 0.3, 0.5);
      box(building, 0, 4.8, 0, r * 1.4, 0.35, 0.35, materials.ink);
      for (const x of [-r * 0.6, r * 0.6]) box(building, x, 5.2, 0, 0.09, 0.8, 0.09);
      box(building, 0, 0.6, 0, r * 1.4, 0.12, r * 2);
      for (let i = -3; i <= 3; i++) box(building, 0, 0.7, i * r / 4, r, 0.025, 0.04, materials.ink);
      for (const x of [-r * 0.55, r * 0.55]) box(building, x, 0.3, 0, 0.12, 0.6, r * 1.8);
    } else if (c.id === 'writing-rule') {
      // A mechanical writing platen with a paper sheet and ruled type bars.
      box(building, 0, 1, 0, r * 1.7, 1, r * 1.3);
      for (const x of [-r * 0.7, r * 0.7]) for (const z of [-r * 0.5, r * 0.5]) box(building, x, 0.25, z, 0.3, 0.5, 0.3, materials.ink);
      for (const x of [-r * 0.85, r * 0.85]) box(building, x, 1.95, -r * 0.35, 0.12, 0.9, 0.5);
      const roller = drum(building, 0, 2.6, -r * 0.35, 0.4, r * 1.8, materials.ink); roller.rotation.z = Math.PI / 2;
      box(building, 0, 4, -r * 0.4, r * 1.5, 3, 0.08);
      for (let i = 0; i < 5; i++) box(building, 0, 3 + i * 0.45, -r * 0.38, r * (i % 2 ? 0.8 : 1.2), 0.04, 0.04, materials.ink);
      for (let row = 0; row < 3; row++) for (let col = -4; col <= 4; col++) box(building, col * r / 6, 1.55, row * 0.35, 0.2, 0.12, 0.2, materials.ink);
    } else if (c.kind === 'governance') {
      // Civic gatehouses: twin service cores, a traversable lintel, and a colonnaded porch.
      for (const x of [-r * 0.7, r * 0.7]) {
        drum(building, x, height * 0.4, 0, r * 0.32, height * 0.8, skin);
        drum(building, x, height * 0.82, 0, r * 0.38, 0.3, materials.ink);
        for (let tooth = 0; tooth < 8; tooth++) {
          const angle = tooth * Math.PI / 4;
          box(building, x + Math.cos(angle) * r * 0.3, height * 0.87, Math.sin(angle) * r * 0.3, r * 0.15, 0.6, r * 0.15);
        }
        for (let floor = 1; floor <= 7; floor++) {
          box(building, x, floor * height / 9, r * 0.635, r * 0.54, 0.12, 0.16);
          for (let j = -1; j <= 1; j++) box(building, x + j * r * 0.14, floor * height / 9 + 0.22, r * 0.637, r * 0.09, 0.25, 0.035, materials.ink);
        }
        box(building, x, height * 0.84, 0, r * 0.6, 0.22, r * 1.4);
      }
      box(building, 0, height * 0.68, 0, r * 1.9, 0.35, r * 1.45);
      fence(building, [-r, height * 0.68 + 0.5, r * 0.72], [r, height * 0.68 + 0.5, r * 0.72]);
      for (let i = -3; i <= 3; i++) {
        box(building, i * r / 3, height * 0.2, r * 0.95, 0.12, height * 0.4, 0.12);
        box(building, i * r / 3, height * 0.41, r * 0.95, 0.24, 0.12, 0.24);
      }
      box(building, 0, height * 0.44, r * 0.9, r * 2.2, 0.18, r * 0.6);
      for (let i = 0; i < 8; i++) box(building, 0, 0.08 + i * 0.07, r * (1.15 - i * 0.045), r * 1.8, 0.14, r * 0.12);
      if (c.id === 'command-gate') {
        // Protected commands pass a portcullis; landing has an open checkpoint instead.
        for (let bar = -3; bar <= 3; bar++) box(building, bar * r / 6, height * 0.28, 0, 0.065, height * 0.52, 0.065, materials.ink);
        box(building, 0, height * 0.2, 0, r, 0.08, 0.08, materials.ink);
      } else {
        box(building, -r * 0.4, 0.65, r * 0.9, 0.4, 1.3, 0.45, materials.ink);
        beam(building, [-r * 0.4, 1.3, r * 0.9], [r * 0.4, 3.4, r * 0.9], 0.08, materials.ink);
      }
    } else {
      // Workshop: production decks and a crane. Library: open archive racks and a service tower.
      const floors = open ? 6 : 4;
      for (let floor = 0; floor < floors; floor++) {
        const y = 0.45 + floor * height / (floors + 1);
        box(building, 0, y, 0, r * 2, 0.13, r * 1.7, open ? materials.dark : materials.status.sound);
        for (const x of [-r, r]) for (const z of [-r * 0.85, r * 0.85]) box(building, x, y + 0.55, z, 0.11, height / (floors + 1), 0.11);
        for (let bay = -3; bay <= 3; bay++) {
          const x = bay * r / 3.6;
          box(building, x, y + 0.3, -r * 0.45, r * 0.17, 0.48, r * 0.45, materials.status[c.material.status]);
          for (let shelf = 0; shelf < 3; shelf++) box(building, x, y + 0.2 + shelf * 0.15, -r * 0.2, r * 0.15, 0.04, 0.035, materials.ink);
          if (!open) box(building, x, y + 0.24, r * 0.3, r * 0.2, 0.35, r * 0.35, materials.rim.workflow);
        }
        fence(building, [-r, y + 0.45, r * 0.86], [r, y + 0.45, r * 0.86]);
        beam(building, [-r, y, -r * 0.85], [-r, y + height / (floors + 1), r * 0.85], 0.025);
        beam(building, [r, y, r * 0.85], [r, y + height / (floors + 1), -r * 0.85], 0.025);
      }
      box(building, r * 0.65, height * 0.42, -r * 0.5, r * 0.45, height * 0.84, r * 0.5, materials.status[c.material.status]);
      for (let i = 0; i < 22; i++) box(building, -r * 0.8, 0.4 + i * 0.23, -r * 0.9, 0.34, 0.04, 0.22, materials.ink);
      // Freestanding lattice crane, with diagonal bracing and a suspended hook.
      const x = r * 0.8, z = r * 0.9;
      for (const dx of [-0.15, 0.15]) for (const dz of [-0.15, 0.15]) box(building, x + dx, height * 0.45, z + dz, 0.035, height * 0.9, 0.035, materials.ink);
      for (let y = 0.3; y < height * 0.85; y += 0.5) {
        beam(building, [x - 0.15, y, z + 0.15], [x + 0.15, y + 0.5, z + 0.15], 0.016, materials.ink);
        beam(building, [x + 0.15, y, z - 0.15], [x - 0.15, y + 0.5, z - 0.15], 0.016, materials.ink);
      }
      box(building, 0, height * 0.89, z, r * 2, 0.1, 0.2, materials.ink);
      beam(building, [-r * 0.8, height * 0.89, z], [x, height, z], 0.025);
      beam(building, [-r * 0.7, height * 0.89, z], [-r * 0.7, height * 0.5, z], 0.018, materials.ink);
      hoop(building, -r * 0.7, height * 0.5 - 0.12, z, 0.16);
    }
    if (c.id === 'workshop') {
      // Sawtooth factory roof, roof lights and a banded chimney distinguish production.
      for (let bay = -1; bay <= 1; bay++) {
        const roof = box(building, bay * r * 0.6, height * 0.86, 0, r * 0.7, 0.15, r * 1.7); roof.rotation.z = Math.PI / 8;
        box(building, bay * r * 0.6 + r * 0.3, height * 0.82, 0, 0.1, 0.8, r * 1.6, materials.ink);
      }
      drum(building, -r * 0.75, height * 0.55, -r * 0.7, 0.35, height * 1.1);
      for (const y of [height * 0.85, height]) drum(building, -r * 0.75, y, -r * 0.7, 0.38, 0.22, materials.ink);
    }
  }
  // Only these window materials vary with status: dark forms never lose structure.
  const status = n.material.status;
  const lit = status === 'sound' ? LIGHTS.windows : ['partial', 'gap'].includes(status) ? Math.round(LIGHTS.windows * LIGHTS.halfFraction) : 0;
  const panel = box(building, face[0] * (n.radius * 0.86 + 0.32), 0.6, face[1] * (n.radius * 0.86 + 0.32), 1, 1.12, 0.04, materials.ink); panel.rotation.y = Math.atan2(face[0], face[1]);
  for (let i = 0; i < LIGHTS.windows; i++) {
    // The audit windows belong to the solid entrance, never float across workers or machinery.
    const along = (i % 4 - 1.5) * 0.21, depth = n.radius * 0.86 + 0.34, y = 0.35 + Math.floor(i / 4) * 0.5;
    const window = box(building, face[0] * depth + face[1] * along, y, face[1] * depth - face[0] * along, 0.17, 0.3, 0.025, i < lit ? status === 'sound' ? materials.windows.lit : materials.windows.half : materials.windows.dark);
    window.rotation.y = Math.atan2(face[0], face[1]); window.userData.window = true;
  }
  // A roof clerestory has a broad top face; dark buildings retain an unlit cap, never a glow.
  const roofY = new THREE.Box3().setFromObject(building).max.y;
  const roofLight = box(building, 0, roofY + LIGHTS.roofHeight / 2, 0, n.radius * LIGHTS.roofWidth, LIGHTS.roofHeight, n.radius * LIGHTS.roofDepth, lit ? status === 'sound' ? materials.windows.lit : materials.windows.half : materials.windows.dark);
  roofLight.userData.roofLight = true;
  const solids = []; building.traverse(o => { if (o.isMesh) solids.push(o); }); solids.forEach(o => outline(THREE, o));
  return building;
}
