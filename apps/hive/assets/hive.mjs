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
import { STYLE } from '../config.mjs';
export function buildHive(THREE, model, materials) {
  const group = new THREE.Group();
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const rod = new THREE.CylinderGeometry(1, 1, 1, 8);
  const box = (parent, x, y, z, w, h, d, mat = materials.status.sound) => {
    const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const beam = (parent, a, b, thickness, mat = materials.rim.workflow) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
    const mesh = new THREE.Mesh(rod, mat); mesh.position.copy(start.add(end).multiplyScalar(0.5)); mesh.scale.set(thickness, delta.length(), thickness); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
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
  const fence = (parent, a, b) => {
    beam(parent, a, b, 0.018);
    const length = Math.hypot(...a.map((v, i) => v - b[i]));
    for (let t = 0; t <= 1; t += 1 / Math.ceil(length * 2)) {
      const p = a.map((v, i) => v + (b[i] - v) * t); beam(parent, [p[0], p[1] - 0.35, p[2]], p, 0.016);
    }
  };
  // Buildings use normalized architectural dimensions: a deck, a bay, a column and a floor.
  for (const [index, c] of model.chambers.entries()) {
    const chamber = new THREE.Group(); chamber.userData.component = c.id; group.add(chamber);
    const building = new THREE.Group(); building.position.set(c.x, 0, c.z); chamber.add(building);
    const r = c.radius * 0.78, height = STYLE.structureHeight;
    box(building, 0, -0.25, 0, r * 2.25, 0.35, r * 2.25, materials.rim[c.kind]);
    box(building, 0, -0.04, 0, r * 2.08, 0.08, r * 2.08);
    // The data's feature cells remain the foundations, including their exact fill ratios.
    for (const cell of c.cells) { const mesh = buildCell(THREE, cell, materials, c.material.status, c.kind); mesh.position.set(cell.x, 0, cell.z); mesh.scale.y = 0.15; chamber.add(mesh); }
    for (const activity of c.bees) { const bee = buildBee(THREE, materials); bee.scale.setScalar(STYLE.beeScale); bee.userData.bee = { ...activity, x: c.x, z: c.z }; chamber.add(bee); }
    if (c.material.status === 'absent') {
      // No invented building for a missing component: only excavated footings and survey stakes.
      box(building, 0, 0.06, 0, r * 1.65, 0.08, r * 1.65, materials.dark);
      for (const x of [-r, r]) for (const z of [-r, r]) {
        box(building, x, 0.16, z, 0.45, 0.3, 0.45); box(building, x, 0.7, z, 0.045, 1, 0.045, materials.ink);
      }
      for (const x of [-r, r]) beam(building, [x, 0.4, -r], [x, 0.4, r], 0.025);
      continue;
    }
    const open = c.material.status === 'gap';
    const skin = materials.status[c.material.status];
    if (c.id === 'compass') {
      // A navigation mast, cardinal arms and a direction needle above its compass rose.
      drum(building, 0, 0.2, 0, r, 0.25);
      drum(building, 0, height / 2, 0, 0.16, height, materials.ink);
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
        beam(building, [0, 0.4, 0], [x, 0.4, z], 0.045, materials.ink);
        beam(building, [0, height * 0.72, 0], [x, height * 0.72, z], 0.06);
        beam(building, [x, height * 0.72, z], [0, height * 0.9, 0], 0.02, materials.ink);
      }
      const needle = box(building, 0, height * 0.98, 0, r * 1.6, 0.12, 0.3, materials.ink); needle.rotation.y = Math.PI / 4;
      hoop(building, 0, height * 0.68, 0, r * 0.65);
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
      beam(building, [-r, height * 0.8, -r], [r, height * 0.8, -r], 0.06, materials.ink);
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
      beam(building, [r, 0.3, -r], [r, 5, -r], 0.08, materials.ink);
      beam(building, [r, 5, -r], [0, 5, 0], 0.08, materials.ink);
    } else if (c.id === 'tool-belt') {
      // A circular tool carousel: sockets carry wrenches, bits and a fork.
      drum(building, 0, 0.5, 0, r * 0.8, 0.6, materials.ink);
      drum(building, 0, 1, 0, r, 0.2);
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4, x = Math.cos(angle) * r * 0.7, z = Math.sin(angle) * r * 0.7;
        drum(building, x, 1.3, z, 0.3, 0.5, materials.ink);
        box(building, x, 2.8, z, 0.13, 3, 0.13);
        if (i % 2) { hoop(building, x, 4.3, z, 0.32); }
        else for (const dx of [-0.25, 0.25]) box(building, x + dx, 4.3, z, 0.12, 0.65, 0.15, materials.ink);
      }
    } else if (c.id === 'eyes') {
      // Twin optical barrels on a swivelling camera mount.
      drum(building, 0, 0.3, 0, r * 0.8, 0.4);
      drum(building, 0, 2, 0, 0.25, 3.5, materials.ink);
      box(building, 0, 4, 0, r * 1.8, 1.4, r * 0.6);
      for (const x of [-r * 0.48, r * 0.48]) {
        const barrel = drum(building, x, 4.1, r * 0.3, r * 0.4, r * 0.9); barrel.rotation.x = Math.PI / 2;
        hoop(building, x, 4.1, r * 0.78, r * 0.41);
        const lens = drum(building, x, 4.1, r * 0.78, r * 0.32, 0.06, materials.ink); lens.rotation.x = Math.PI / 2;
      }
    } else if (c.id === 'notice-board') {
      // A two-legged public display with distinct sheets pinned to its face.
      for (const x of [-r * 0.8, r * 0.8]) box(building, x, 3, 0, 0.22, 6, 0.3, materials.ink);
      box(building, 0, 4.3, 0, r * 2, 3.8, 0.25);
      for (let col = -1; col <= 1; col++) for (let row = 0; row < 3; row++) {
        box(building, col * r * 0.6, 3.1 + row, 0.16, r * 0.5, 0.75, 0.04, materials.rim.workflow);
        for (let line = 0; line < 3; line++) box(building, col * r * 0.6, 2.9 + row + line * 0.15, 0.2, r * 0.36, 0.025, 0.015, materials.ink);
      }
    } else if (c.id === 'setup') {
      // An installation hopper funnels many inputs into one machine core.
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
        for (const z of [-r * 0.55, r * 0.55]) box(ramp, i * r / 4, -0.5, z, 0.08, 1.2, 0.08);
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
      }
      for (const x of [-r, r]) {
        for (const z of [-r, r]) beam(building, [x, 0, z], [x, 4.5, z], 0.045, materials.ink);
        beam(building, [x, 4.5, -r], [x, 4.5, r], 0.045, materials.ink);
      }
    } else if (c.id === 'lab') {
      // Unequal reaction vessels, exposed pipework and an incomplete service gantry.
      for (let i = -1; i <= 1; i++) {
        const x = i * r * 0.65, h = 3 + (i + 1) * 0.8;
        drum(building, x, h / 2, 0, r * 0.25, h, skin);
        drum(building, x, h, 0, r * 0.28, 0.15, materials.ink);
        beam(building, [x, h, 0], [x, 6.5, 0], 0.06, materials.ink);
        for (let y = 1; y < h; y++) { const band = hoop(building, x, y, 0, r * 0.255); band.rotation.x = Math.PI / 2; }
      }
      beam(building, [-r * 0.65, 6.5, 0], [r * 0.65, 6.5, 0], 0.08, materials.ink);
      for (const x of [-r, r]) beam(building, [x, 0, -r], [x, 6.5, -r], 0.045, materials.ink);
    } else if (c.id === 'stage') {
      // A cylinder core inside a deliberately unclosed signing cage.
      drum(building, 0, 0.3, 0, r, 0.4, materials.ink);
      drum(building, 0, 2, 0, r * 0.48, 3, skin);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, x = Math.cos(a) * r * 0.85, z = Math.sin(a) * r * 0.85;
        beam(building, [x, 0.5, z], [x, 5.5, z], 0.045, materials.ink);
      }
      const crown = hoop(building, 0, 5.5, 0, r * 0.85); crown.rotation.x = Math.PI / 2;
      box(building, 0, 4.2, 0, r * 0.7, 0.2, r * 0.7);
    } else if (c.id === 'review-ladder' || c.id === 'review-hall') {
      // Each review is a higher, open hall; the silhouette is an actual ladder.
      for (let i = 0; i < 5; i++) {
        const z = (i - 2) * r * 0.4, y = 0.25 + i * 0.7;
        box(building, 0, y / 2, z, r * 1.8, y, r * 0.4);
        for (const x of [-r * 0.85, r * 0.85]) box(building, x, y + 1.5, z, 0.14, 3, 0.14);
        box(building, 0, y + 3, z, r * 1.9, 0.15, r * 0.38);
        fence(building, [-r * 0.85, y + 0.6, z], [r * 0.85, y + 0.6, z]);
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
      drum(building, 0, 0.6, 0, r * 0.6, 0.5); drum(building, 0, 1.3, 0, 0.16, 1, materials.ink);
    } else if (c.id === 'identity-scan') {
      // A scanning aperture over a travelling sheet, with a suspended read head.
      for (const x of [-r * 0.8, r * 0.8]) box(building, x, 2.8, 0, 0.22, 5.6, 0.35, materials.ink);
      box(building, 0, 5.6, 0, r * 1.8, 0.3, 0.5);
      box(building, 0, 4.8, 0, r * 1.4, 0.35, 0.35, materials.ink);
      box(building, 0, 0.6, 0, r * 1.4, 0.12, r * 2);
      for (let i = -3; i <= 3; i++) box(building, 0, 0.7, i * r / 4, r, 0.025, 0.04, materials.ink);
      for (const x of [-r * 0.6, r * 0.6]) beam(building, [x, 4.6, 0], [x, 0.8, r * 0.7], 0.015);
    } else if (c.id === 'writing-rule') {
      // A mechanical writing platen with a paper sheet and ruled type bars.
      box(building, 0, 1, 0, r * 1.7, 1, r * 1.3);
      const roller = drum(building, 0, 2.6, -r * 0.35, 0.4, r * 1.8, materials.ink); roller.rotation.z = Math.PI / 2;
      box(building, 0, 4, -r * 0.4, r * 1.5, 3, 0.08);
      for (let i = 0; i < 5; i++) box(building, 0, 3 + i * 0.45, -r * 0.38, r * (i % 2 ? 0.8 : 1.2), 0.04, 0.04, materials.ink);
      for (let row = 0; row < 3; row++) for (let col = -4; col <= 4; col++) box(building, col * r / 6, 1.55, row * 0.35, 0.2, 0.12, 0.2, materials.ink);
    } else if (c.kind === 'governance') {
      // Civic gatehouses: twin service cores, a traversable lintel, and a colonnaded porch.
      for (const x of [-r * 0.7, r * 0.7]) {
        box(building, x, height * 0.4, 0, r * 0.5, height * 0.8, r * 1.25, materials.status[c.material.status]);
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
        beam(building, [-r * 0.4, 1.4, r * 0.9], [r * 0.4, 3.4, r * 0.9], 0.08, materials.ink);
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
    }
    // Every part gets its chapter from the ancestor group, including crane and deck picks.
    building.rotation.y = c.kind === 'governance' ? Math.atan2(c.x, c.z) : (index % 2 ? Math.PI / 2 : 0);
  }
  const works = model.chambers.filter(c => c.kind === 'workflow');
  // Elevated walkways connect structures; paths depict adjacency, not a claimed data dependency.
  for (let i = 1; i < works.length; i++) {
    const a = works[i - 1], b = works[i], y = 1.1;
    beam(group, [a.x, y, a.z], [b.x, y, b.z], 0.22);
    for (const side of [-0.26, 0.26]) fence(group, [a.x + side, y + 0.45, a.z], [b.x + side, y + 0.45, b.z]);
  }
  const homes = model.chambers.filter(c => c.kind === 'governance');
  if (homes.length) {
    const radius = Math.hypot(homes[0].x, homes[0].z);
    const ring = new THREE.Group(); group.add(ring);
    // A continuous perimeter houses the governance structures around the workflow campus.
    for (let i = 0; i < 96; i++) {
      const angle = i / 96 * Math.PI * 2;
      const bay = new THREE.Group(); bay.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius); bay.rotation.y = angle; ring.add(bay);
      box(bay, 0, 0.85, 0, radius * Math.PI / 47, 0.18, 1.1);
      box(bay, 0, 0.35, 0, 0.12, 0.8, 0.75);
      box(bay, 0, 1.2, 0.5, 0.045, 0.65, 0.045);
      box(bay, 0, 1.52, 0.5, radius * Math.PI / 47, 0.045, 0.045);
      if (i % 4 === 0) box(bay, 0, 0.2, -0.5, 0.45, 0.4, 0.4, materials.ink);
    }
  }
  const size = Math.max(...model.bounds.max.map(Math.abs), ...model.bounds.min.map(Math.abs));
  // A continuous ground, not a finite display plinth with a visible empty border.
  box(group, 0, -0.55, 0, size * size, 0.12, size * size, materials.ground);
  return group;
}
