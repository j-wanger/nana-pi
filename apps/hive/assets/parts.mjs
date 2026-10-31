/**
 * @module apps/hive/assets/parts.mjs
 * @purpose Builds shared beams, fences and flat street ribbons without hidden THREE or material state.
 * @inputs Explicit THREE namespace, shared materials, unit rod geometry, parent and dimensions.
 * @outputs Meshes added to the supplied parent.
 * @effects none
 * @errors None for valid geometry.
 */
import { OUTLINES, DENSITY, CARGO } from '../config.mjs';
// Moved from buildHive's closure; geometry and materials are explicit like beam and fence.
export function box(THREE, materials, cube, parent, x, y, z, w, h, d, mat = materials.status.sound) {
  const mesh = new THREE.Mesh(cube, mat); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function drum(THREE, materials, parent, x, y, z, radius, h, mat = materials.status.sound, top = radius, openEnded = false) {
  const surface = openEnded ? mat.clone() : mat;
  if (openEnded) surface.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, h, 24, 1, openEnded), surface);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
export function hoop(THREE, materials, parent, x, y, z, radius, mat = materials.ink) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.055, 6, 48), mat);
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
export function beam(THREE, materials, rod, parent, a, b, thickness, mat = materials.rim.workflow) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
  const mesh = new THREE.Mesh(rod, mat); mesh.position.copy(start.add(end).multiplyScalar(0.5)); mesh.scale.set(thickness, delta.length(), thickness); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
}
export function ribbon(THREE, parent, a, b, width, thickness, elevation, material) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, length), material);
  mesh.position.set((a[0] + b[0]) / 2, elevation, (a[1] + b[1]) / 2);
  mesh.rotation.y = Math.atan2(dx, dz); mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
// One crate kit serves hands, machinery, tray pallets and outbound trucks.
export function cargo(THREE, materials, parent, { lit = false, pallet = false, truck = false } = {}) {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1), s = CARGO.size, h = CARGO.palletHeight;
  parent.add(group); group.userData.cargo = true;
  const crate = box(THREE, materials, cube, group, 0, (pallet || truck ? h : 0) + s / 2, 0, s, s, s, materials.bee);
  crate.userData.crate = true; outline(THREE, crate);
  if (pallet || truck) {
    const deck = box(THREE, materials, cube, group, 0, h / 2, 0, s * 1.35, h, s * (truck ? 2.2 : 1.35)); deck.userData.pallet = true; outline(THREE, deck);
    if (truck) {
      outline(THREE, box(THREE, materials, cube, group, 0, h + s * 0.35, s * 0.8, s, s * 0.7, s * 0.6));
      for (const x of [-s * 0.55, s * 0.55]) for (const z of [-s * 0.65, s * 0.65]) { const tyre = drum(THREE, materials, group, x, 0, z, h, h, materials.ink); tyre.rotation.z = Math.PI / 2; }
    }
  }
  if (lit) { const light = box(THREE, materials, cube, group, 0, (pallet ? h : 0) + s + s * 0.1, 0, s * 0.35, s * 0.2, s * 0.35, materials.windows.lit); light.userData.beacon = true; }
  return group;
}
// A wheel needs a spoke: a uniform torus alone cannot show rotation.
export function wheel(THREE, materials, parent, x, y, z, radius) {
  const group = new THREE.Group(); group.position.set(x, y, z); parent.add(group);
  hoop(THREE, materials, group, 0, 0, 0, radius);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  for (const a of [0, Math.PI / 2]) { const spoke = box(THREE, materials, cube, group, 0, 0, 0, radius * 2, 0.06, 0.06); spoke.rotation.z = a; }
  return group;
}
// Five plain house silhouettes share the same solid kit as the named places.
export function house(THREE, materials, cube, parent, lot) {
  const group = new THREE.Group(); parent.add(group); group.position.set(lot.x, 0, lot.z);
  group.rotation.y = Math.atan2(lot.face[0], lot.face[1]); group.userData.house = lot;
  const w = DENSITY.houseWidth, d = DENSITY.houseDepth, h = lot.height;
  const add = (x, y, z, width, height, depth, mat) => box(THREE, materials, cube, group, x, y, z, width, height, depth, mat);
  const count = lot.type === 'row-three' ? 3 : 1, width = w / count;
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * width, height = lot.type === 'two-storey' ? h : h * 0.8;
    add(x, height / 2, 0, width - 0.12, height, d);
    if (['pitched', 'yard', 'row-three'].includes(lot.type)) {
      for (const side of [-1, 1]) { const roof = add(x + side * width / 4, height + width * 0.12, 0, width * 0.58, 0.16, d + 0.3, materials.rim.workflow); roof.rotation.z = -side * Math.PI / 7; }
    } else {
      add(x, height, 0, width + 0.2, 0.2, d + 0.2, materials.rim.workflow);
      if (lot.type === 'terrace') for (const side of [-1, 1]) add(side * w / 2, height + 0.35, 0, 0.12, 0.7, d);
    }
    add(x, 0.7, d / 2 + 0.02, 0.55, 1.4, 0.05, materials.ink);
    for (const y of lot.type === 'two-storey' ? [1.4, 3.2] : [1.7]) for (const side of [-1, 1]) add(x + side * width * 0.3, y, d / 2 + 0.03, width * 0.18, 0.7, 0.05, materials.windows.dark);
  }
  if (lot.type === 'yard') {
    add(w * 0.65, 0.03, 0, w * 0.35, 0.06, d, materials.ground);
    drum(THREE, materials, group, w * 0.65, 0.9, 0, 0.12, 1.8, materials.rim.workflow);
    drum(THREE, materials, group, w * 0.65, 2.1, 0, 0.8, 1.6, materials.rim.workflow, 0.15);
  }
  return group;
}
// Reuse the house kit once per type; vertex colours retain its roof/door palette.
export function houseInstances(THREE, materials, cube, parent, lots) {
  for (const type of DENSITY.types) {
    const placed = lots.filter(lot => lot.type === type); if (!placed.length) continue;
    const prototype = house(THREE, materials, cube, new THREE.Group(), { x: 0, z: 0, face: [0, 1], height: DENSITY.houseHeight, type });
    prototype.updateMatrixWorld(true);
    const positions = [], normals = [], colors = [];
    prototype.traverse(o => {
      if (!o.isMesh) return;
      const geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geometry.applyMatrix4(o.matrixWorld);
      positions.push(...geometry.attributes.position.array); normals.push(...geometry.attributes.normal.array);
      for (let i = 0; i < geometry.attributes.position.count; i++) colors.push(...o.material.color.toArray());
      geometry.dispose();
    });
    const geometry = new THREE.BufferGeometry();
    for (const [name, values] of [['position', positions], ['normal', normals], ['color', colors]]) geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, 3));
    const material = materials.status.sound.clone(); material.color.set('#ffffff'); material.vertexColors = true;
    const instances = new THREE.InstancedMesh(geometry, material, placed.length), transform = new THREE.Object3D();
    placed.forEach((lot, i) => { transform.position.set(lot.x, 0, lot.z); transform.rotation.y = Math.atan2(lot.face[0], lot.face[1]); transform.scale.set(1, lot.height / DENSITY.houseHeight, 1); transform.updateMatrix(); instances.setMatrixAt(i, transform.matrix); });
    instances.instanceMatrix.needsUpdate = true; instances.castShadow = true; instances.receiveShadow = true;
    instances.userData.housingInstances = type; parent.add(instances);
  }
}
// The same thin ink edges serve infrastructure and figures; no renderer-global state.
export function outline(THREE, mesh) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), new THREE.LineBasicMaterial({ color: '#171c19', transparent: true, opacity: OUTLINES.opacity }));
  edges.userData.outlineOf = mesh; edges.position.copy(mesh.position); edges.quaternion.copy(mesh.quaternion); edges.scale.copy(mesh.scale); mesh.parent.add(edges);
  mesh.geometry.computeBoundingBox();
  const dimensions = mesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(mesh.scale).toArray().sort((a, b) => a - b), position = new THREE.Vector3(), viewport = new THREE.Vector2();
  // Thin neighbouring edges disappear when they collapse into the same screen pixel.
  edges.onBeforeRender = (renderer, scene, camera) => { renderer.getSize(viewport); mesh.getWorldPosition(position); const pixels = dimensions[1] * viewport.y / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.distanceTo(position)); edges.material.opacity = OUTLINES.opacity * Math.min(1, Math.max(0, (pixels - OUTLINES.fadePixels) / OUTLINES.fullPixels)); };
  return edges;
}
// A tiny original bitmap alphabet keeps painted names renderer- and DOM-independent.
export function trayName(THREE, parent, name) {
  const alphabet = { A:'0111010001111111000110001', B:'1111010001111101000111110', C:'0111110000100001000001111', D:'1111010001100011000111110', E:'1111110000111101000011111', F:'1111110000111101000010000', G:'0111110000101111000101111', H:'1000110001111111000110001', I:'1111100100001000010011111', J:'0011100010000101001001100', K:'1000110010111001001010001', L:'1000010000100001000011111', M:'1000111011101011000110001', N:'1000111001101011001110001', O:'0111010001100011000101110', P:'1111010001111101000010000', Q:'0111010001101011001001101', R:'1111010001111101001010001', S:'0111110000011100000111110', T:'1111100100001000010000100', U:'1000110001100011000101110', V:'1000110001100010101000100', W:'1000110001101011101110001', X:'1000101010001000101010001', Y:'1000101010001000010000100', Z:'1111100010001000100011111' };
  const text = name.toUpperCase(), width = text.length * 6, pixels = new Uint8Array(width * 5 * 4);
  for (let i = 0; i < text.length; i++) for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    const p = ((4 - y) * width + i * 6 + x) * 4; pixels[p] = 23; pixels[p + 1] = 28; pixels[p + 2] = 25; pixels[p + 3] = alphabet[text[i]]?.[y * 5 + x] === '1' ? 255 : 0;
  }
  const map = new THREE.DataTexture(pixels, width, 5); map.needsUpdate = true; map.magFilter = THREE.NearestFilter;
  const paint = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.4), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
  paint.rotation.set(-Math.PI / 2, 0, Math.PI / 2); paint.position.set(0, 0.014, 2); paint.userData.trayName = name; parent.add(paint); return paint;
}
// Bake only immutable geometry, per pickable lot/road. Moving subtrees stay articulated.
export function batchStatic(THREE, root, model) {
  root.updateMatrixWorld(true);
  const dynamic = o => ['role', 'workplace', 'mechanism', 'traffic', 'packet', 'broadcast', 'signalTrace', 'dish', 'articulated', 'load', 'crate', 'sheet', 'drawing', 'strike', 'judgeCard', 'passLight', 'reel', 'barrier', 'growingFrame'].some(key => o.userData[key]);
  const parents = [...root.children];
  root.traverse(o => { if (dynamic(o)) { parents.push(o); o.traverse(p => { if (p.isMesh) p.castShadow = false; }); } });
  for (const parent of parents) {
    const inverse = parent.matrixWorld.clone().invert(), groups = new Map(), removed = [], edges = { positions: [], centers: [], widths: [] };
    const visit = o => {
      if (o.userData.housingInstances) return;
      if (dynamic(o)) { o.traverse(p => { if (p.isMesh) p.castShadow = false; }); return; }
      const mesh = o.userData.outlineOf;
      if (mesh) {
        if (dynamic(mesh)) return;
        const matrix = inverse.clone().multiply(mesh.matrixWorld), center = new THREE.Vector3().setFromMatrixPosition(matrix);
        mesh.geometry.computeBoundingBox();
        const dimensions = mesh.geometry.boundingBox.getSize(new THREE.Vector3()).multiply(mesh.scale).toArray().sort((a, b) => a - b);
        const attr = o.geometry.attributes.position, point = new THREE.Vector3();
        for (let i = 0; i < attr.count; i++) { point.fromBufferAttribute(attr, i).applyMatrix4(matrix); edges.positions.push(...point.toArray()); edges.centers.push(...center.toArray()); edges.widths.push(dimensions[1]); }
        removed.push(o); return;
      }
      if (o.isMesh && !o.material.map) {
        const material = o.material, key = material.uuid;
        if (!groups.has(key)) groups.set(key, { material, positions: [], normals: [], cast: false });
        const g = groups.get(key), geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        geometry.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
        g.positions.push(...geometry.attributes.position.array); g.normals.push(...geometry.attributes.normal.array); g.cast ||= o.castShadow;
        geometry.dispose(); removed.push(o);
      }
      for (const c of [...o.children]) visit(c);
    };
    for (const c of [...parent.children]) visit(c);
    for (const o of removed) o.removeFromParent();
    for (const g of groups.values()) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3)); geometry.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
      const mesh = new THREE.Mesh(geometry, g.material); mesh.castShadow = g.cast; mesh.receiveShadow = true; mesh.userData.batched = true;
      if (parent.userData.road) mesh.userData.roadSurface = true;
      parent.add(mesh);
    }
    if (edges.positions.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(edges.positions, 3)); geometry.setAttribute('center', new THREE.Float32BufferAttribute(edges.centers, 3)); geometry.setAttribute('width', new THREE.Float32BufferAttribute(edges.widths, 1));
      const material = new THREE.ShaderMaterial({ transparent: true, uniforms: { ink: { value: new THREE.Color('#171c19') }, opacity: { value: OUTLINES.opacity }, fade: { value: OUTLINES.fadePixels }, full: { value: OUTLINES.fullPixels }, projectionPixels: { value: 1 } },
        vertexShader: 'attribute vec3 center; attribute float width; uniform float projectionPixels; uniform float fade; uniform float full; varying float alpha; void main() { vec3 worldCenter = (modelMatrix * vec4(center, 1.0)).xyz; float pixels = width * projectionPixels / max(0.001, distance(cameraPosition, worldCenter)); alpha = clamp((pixels - fade) / full, 0.0, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 ink; uniform float opacity; varying float alpha; void main() { gl_FragColor = vec4(ink, opacity * alpha); }' });
      const lines = new THREE.LineSegments(geometry, material), viewport = new THREE.Vector2();
      lines.onBeforeRender = (renderer, scene, camera) => { renderer.getSize(viewport); material.uniforms.projectionPixels.value = viewport.y / (2 * Math.tan(camera.fov * Math.PI / 360)); };
      lines.userData.batchedEdges = true; parent.add(lines);
    }
  }
  if (model) {
    root.updateMatrixWorld(true);
    const owners = [...new Set(root.children.map(o => o.userData.component).filter(Boolean))];
    root.userData.batchOwners = owners; root.userData.batchSelection = { value: -1 };
    const merged = new Map(), edgeGroups = new Map();
    for (const parent of [...root.children]) {
      if (parent.userData.background || dynamic(parent) || model.roads.some(r => r.id === parent.userData.road && r.class === 'air')) continue;
      const road = model.roads.find(r => r.id === parent.userData.road), owner = owners.indexOf(parent.userData.component);
      const from = owners.indexOf(model.chambers.find(n => n.id === road?.from)?.component), to = owners.indexOf(model.chambers.find(n => n.id === road?.to)?.component);
      for (const mesh of [...parent.children]) {
        if (!mesh.userData.batched && !mesh.userData.batchedEdges) continue;
        const map = mesh.userData.batchedEdges ? edgeGroups : merged, key = mesh.userData.batchedEdges ? 'edges' : `${mesh.material.uuid}/${Boolean(road)}`;
        if (!map.has(key)) map.set(key, { material: mesh.material, positions: [], normals: [], centers: [], widths: [], owners: [], endpoints: [], ranges: [], road: Boolean(road) });
        const g = map.get(key), geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), count = geometry.attributes.position.count;
        // Avoid spreading a city-sized array onto the JS call stack.
        for (const v of geometry.attributes.position.array) g.positions.push(v);
        if (mesh.userData.batchedEdges) {
          const center = new THREE.Vector3(), attr = mesh.geometry.attributes.center;
          for (let i = 0; i < count; i++) { center.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld); g.centers.push(...center.toArray()); g.widths.push(mesh.geometry.attributes.width.getX(i)); }
        } else {
          for (const v of geometry.attributes.normal.array) g.normals.push(v);
          for (let i = 0; i < count; i++) { g.owners.push(owner); g.endpoints.push(from, to); }
          g.ranges.push({ end: g.positions.length / 9, component: parent.userData.component });
        }
        geometry.dispose(); mesh.removeFromParent();
      }
    }
    for (const g of merged.values()) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3)); geometry.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
      geometry.setAttribute('owner', new THREE.Float32BufferAttribute(g.owners, 1)); geometry.setAttribute('endpoints', new THREE.Float32BufferAttribute(g.endpoints, 2));
      const material = g.material.clone();
      material.onBeforeCompile = shader => {
        shader.uniforms.selectedOwner = root.userData.batchSelection;
        shader.vertexShader = 'attribute float owner; attribute vec2 endpoints; varying float own; varying vec2 ends;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nown = owner; ends = endpoints;');
        shader.fragmentShader = 'uniform float selectedOwner; varying float own; varying vec2 ends;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + (g.road ? 'if (selectedOwner >= 0.0 && (abs(ends.x - selectedOwner) < 0.1 || abs(ends.y - selectedOwner) < 0.1)) diffuseColor.rgb = vec3(0.009, 0.012, 0.01);' : 'if (selectedOwner >= 0.0 && abs(own - selectedOwner) < 0.1) diffuseColor.rgb *= 1.06;'));
      };
      material.customProgramCacheKey = () => `city-batch-${g.road}`;
      const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.pickRanges = g.ranges; root.add(mesh);
    }
    for (const g of edgeGroups.values()) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3)); geometry.setAttribute('center', new THREE.Float32BufferAttribute(g.centers, 3)); geometry.setAttribute('width', new THREE.Float32BufferAttribute(g.widths, 1));
      const lines = new THREE.LineSegments(geometry, g.material), viewport = new THREE.Vector2();
      lines.onBeforeRender = (renderer, scene, camera) => { renderer.getSize(viewport); g.material.uniforms.projectionPixels.value = viewport.y / (2 * Math.tan(camera.fov * Math.PI / 360)); }; root.add(lines);
    }
  }
  return root;
}
export function fence(THREE, materials, rod, parent, a, b, drop = 0.45) {
  beam(THREE, materials, rod, parent, a, b, 0.018);
  const length = Math.hypot(...a.map((v, i) => v - b[i]));
  for (let t = 0; t <= 1; t += 1 / Math.ceil(length * 2)) {
    const p = a.map((v, i) => v + (b[i] - v) * t); beam(THREE, materials, rod, parent, [p[0], p[1] - drop, p[2]], p, 0.016);
  }
}
