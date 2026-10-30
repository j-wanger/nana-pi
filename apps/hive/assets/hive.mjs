/**
 * @module apps/hive/assets/hive.mjs
 * @purpose Assembles original architectural structures, feature decks and activity into a pickable city.
 * @inputs Explicit THREE namespace, world layout and shared materials.
 * @outputs A scene group with component and bee metadata.
 * @effects none
 * @errors None for valid layout.
 */
import { buildCell } from './cell.mjs';
import { buildBee } from './bee.mjs';
import { STYLE, STREETS, NAVIGATION, FOOTPRINT_SCALE } from '../config.mjs';
import { beam as sharedBeam, fence as sharedFence, ribbon } from './parts.mjs';
import { buildRoad } from './road.mjs';
import { visibleRoads } from '../roads.mjs';
export function buildHive(THREE, model, materials) {
  const group = new THREE.Group();
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  const box = (parent, x, y, z, w, h, d, mat = materials.status.sound) => {
    const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const beam = sharedBeam.bind(null, THREE, materials, rod);
  const drum = (parent, x, y, z, radius, h, mat = materials.status.sound, top = radius, openEnded = false) => {
    const surface = openEnded ? mat.clone() : mat;
    if (openEnded) surface.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, h, 24, 1, openEnded), surface);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const hoop = (parent, x, y, z, radius, mat = materials.ink) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.055, 6, 48), mat);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const fence = sharedFence.bind(null, THREE, materials, rod);
  // Buildings use normalized architectural dimensions: a deck, a bay, a column and a floor.
  for (const [index, c] of model.chambers.entries()) {
    const chamber = new THREE.Group(); chamber.userData.component = c.id; group.add(chamber);
    const building = new THREE.Group(); building.position.set(c.x, 0, c.z); chamber.add(building);
    const r = c.radius * 0.78, height = STYLE.structureHeight;
    // A circular kerbed lot meets the same footprint used by the publisher.
    const groundY = STREETS.elevation - STREETS.thickness / 2;
    const lot = drum(chamber, c.x, groundY + 0.04, c.z, c.radius * FOOTPRINT_SCALE, 0.08, materials.rim[c.kind]);
    lot.userData.lot = c.id;
    const kerb = hoop(chamber, c.x, groundY + 0.1, c.z, c.radius * FOOTPRINT_SCALE, materials.status.sound); kerb.rotation.x = Math.PI / 2;
    box(building, 0, -0.2, 0, r * 2.08, 0.4, r * 2.08);
    const street = model.roads?.filter(road => ['loop', 'spur'].includes(road.class) && [road.from, road.to].includes(c.id))[0];
    if (street) {
      const end = street.from === c.id ? street.path[0] : street.path.at(-1);
      ribbon(THREE, chamber, [c.x, c.z], end, NAVIGATION.roadWidths.spur, STREETS.thickness, groundY + 0.11, materials.status.sound);
    }
    // The data's feature cells remain the foundations, including their exact fill ratios.
    for (const cell of c.cells) { const mesh = buildCell(THREE, cell, materials, c.material.status, c.kind); mesh.position.set(cell.x, 0, cell.z); mesh.scale.y = 0.15; chamber.add(mesh); }
    for (const activity of c.bees) {
      const bee = buildBee(THREE, materials);
      bee.scale.setScalar(activity.kind === 'inFlight' ? STYLE.beeScale * STYLE.cellWidth : STYLE.beeScale);
      bee.userData.bee = { ...activity, x: c.x, z: c.z, apron: r * 1.06, restY: -new THREE.Box3().setFromObject(bee).min.y }; chamber.add(bee);
    }
    if (c.material.status === 'absent') {
      // No invented building for a missing component: only excavated footings and survey stakes.
      box(building, 0, 0.06, 0, r * 1.65, 0.08, r * 1.65, materials.dark);
      for (const x of [-r, r]) for (const z of [-r, r]) {
        box(building, x, 0.16, z, 0.45, 0.3, 0.45); box(building, x, 0.7, z, 0.045, 1, 0.045, materials.ink);
      }
      for (const x of [-r, r]) beam(building, [x, 0.4, -r], [x, 0.4, r], 0.025);
      chamber.userData.labelHeight = new THREE.Box3().setFromObject(building).max.y;
      continue;
    }
    const open = c.material.status === 'gap';
    const skin = materials.status[c.material.status];
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
      // An unfilled archive: dark open stacks, not another inhabited workshop.
      for (let row = -2; row <= 2; row++) {
        const x = row * r * 0.42;
        for (const z of [-r * 0.8, r * 0.8]) box(building, x, height * 0.36, z, 0.09, height * 0.72, 0.09, materials.ink);
        for (let shelf = 0; shelf < 8; shelf++) {
          const y = 0.4 + shelf * height / 11;
          box(building, x, y, 0, r * 0.32, 0.1, r * 1.8, skin);
          for (let book = -3; book <= 3; book++) box(building, x, y + 0.23, book * r / 4, r * 0.25, 0.35, 0.1, materials.dark);
        }
      }
      box(building, 0, height * 0.72, -r * 0.8, r * 1.8, 0.12, 0.16, materials.ink);
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
      // Upright ledger leaves: rows, checks and connecting bindings.
      for (let leaf = -1; leaf <= 1; leaf++) {
        const panel = new THREE.Group(); panel.position.set(leaf * r * 0.6, 3.2, 0); panel.rotation.y = leaf * Math.PI / 8; building.add(panel);
        box(building, leaf * r * 0.6, 0.225, 0, r * 0.4, 0.45, 0.6, materials.ink);
        box(panel, 0, 0, 0, r * 0.57, 5.5, 0.18);
        for (let row = -4; row <= 4; row++) {
          box(panel, 0, row * 0.5, 0.12, r * 0.4, 0.035, 0.03, materials.ink);
          box(panel, -r * 0.2, row * 0.5 + 0.12, 0.12, 0.12, 0.12, 0.03, materials.ink);
        }
      }
      for (const y of [1, 5.4]) beam(building, [-r, y, -0.2], [r, y, -0.2], 0.07, materials.ink);
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
    // Every part gets its chapter from the ancestor group, including crane and deck picks.
    building.rotation.y = c.id === 'review-ladder' ? 0 : c.kind === 'governance' ? Math.atan2(c.x, c.z)
      : ['compass', 'tool-belt', 'eyes', 'notice-board', 'lab'].includes(c.id) ? STYLE.cameraElevation / 2
      : (index % 2 ? Math.PI / 2 : 0);
    chamber.userData.labelHeight = new THREE.Box3().setFromObject(building).max.y;
  }
  for (const road of model.roads ?? []) { const mesh = buildRoad(THREE, road, materials); mesh.visible = visibleRoads(model.roads).includes(road); group.add(mesh); }
  const size = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs));
  // The plaza occupies the loop's interior, with concentric paving, benches and clipped trees.
  const spine = model.chambers.filter(c => c.role === 'spine');
  if (spine.length) {
    const x = spine.reduce((sum, c) => sum + c.x, 0) / spine.length, z = spine.reduce((sum, c) => sum + c.z, 0) / spine.length;
    const lotRadius = Math.max(...spine.map(c => c.radius * FOOTPRINT_SCALE));
    const rx = (Math.max(...spine.map(c => c.x)) - Math.min(...spine.map(c => c.x))) / 2 - lotRadius * 1.3;
    const rz = (Math.max(...spine.map(c => c.z)) - Math.min(...spine.map(c => c.z))) / 2 - lotRadius * 1.3;
    const plaza = drum(group, x, STREETS.elevation, z, 1, STREETS.thickness, materials.rim.workflow); plaza.scale.set(rx, 1, rz);
    for (const scale of [0.65, 0.95]) { const ring = hoop(group, x, STREETS.elevation + STREETS.thickness, z, 1, materials.status.sound); ring.rotation.x = Math.PI / 2; ring.scale.set(rx * scale, rz * scale, 1); }
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, px = x + Math.cos(a) * rx * 0.8, pz = z + Math.sin(a) * rz * 0.8;
      if (i % 2) {
        drum(group, px, 0.6, pz, 0.12, 1.8, materials.ink);
        drum(group, px, 1.8, pz, 0.7, 1.5, materials.rim.workflow, 0.3);
      } else {
        box(group, px, 0.25, pz, 1.8, 0.15, 0.55, materials.ink);
        for (const dx of [-0.65, 0.65]) box(group, px + dx, -0.05, pz, 0.12, 0.6, 0.45);
      }
    }
    for (const c of spine) ribbon(THREE, group, [x, z], [x + (c.x - x) * 0.5, z + (c.z - z) * 0.5], NAVIGATION.roadWidths.spur, STREETS.thickness, STREETS.elevation + STREETS.thickness, materials.rim.workflow);
  }
  // Ground touches the undersides of streets and lots: no suspended ribbons.
  const groundY = STREETS.elevation - STREETS.thickness / 2;
  box(group, 0, groundY - 0.06, 0, size * size, 0.12, size * size, materials.ground);
  // Flush paving joints carry the ground through the viewport, including beneath the overlays.
  const step = STYLE.cellStep * STYLE.foundationColumns;
  for (let i = -size * 2; i <= size * 2; i += step) {
    ribbon(THREE, group, [i, -size * 2], [i, size * 2], STREETS.edgeWidth, STREETS.thickness / 4, groundY, materials.rim.workflow);
    for (let j = -size * 2; j < size * 2; j += step * 2) ribbon(THREE, group, [i, j + (Math.round(i / step) % 2 ? step : 0)], [i + step, j + (Math.round(i / step) % 2 ? step : 0)], STREETS.edgeWidth, STREETS.thickness / 4, groundY, materials.rim.workflow);
  }
  return group;
}
