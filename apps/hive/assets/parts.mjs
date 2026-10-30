/**
 * @module apps/hive/assets/parts.mjs
 * @purpose Builds shared beams, fences and flat street ribbons without hidden THREE or material state.
 * @inputs Explicit THREE namespace, shared materials, unit rod geometry, parent and dimensions.
 * @outputs Meshes added to the supplied parent.
 * @effects none
 * @errors None for valid geometry.
 */
import { OUTLINES } from '../config.mjs';
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
export function fence(THREE, materials, rod, parent, a, b, drop = 0.45) {
  beam(THREE, materials, rod, parent, a, b, 0.018);
  const length = Math.hypot(...a.map((v, i) => v - b[i]));
  for (let t = 0; t <= 1; t += 1 / Math.ceil(length * 2)) {
    const p = a.map((v, i) => v + (b[i] - v) * t); beam(THREE, materials, rod, parent, [p[0], p[1] - drop, p[2]], p, 0.016);
  }
}
