/**
 * @module apps/hive/assets/parts.mjs
 * @purpose Builds shared architectural beams and fences without hidden THREE or material state.
 * @inputs Explicit THREE namespace, shared materials, unit rod geometry, parent and dimensions.
 * @outputs Meshes added to the supplied parent.
 * @effects none
 * @errors None for valid geometry.
 */
export function beam(THREE, materials, rod, parent, a, b, thickness, mat = materials.rim.workflow) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
  const mesh = new THREE.Mesh(rod, mat); mesh.position.copy(start.add(end).multiplyScalar(0.5)); mesh.scale.set(thickness, delta.length(), thickness); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
}
export function fence(THREE, materials, rod, parent, a, b, drop = 0.45) {
  beam(THREE, materials, rod, parent, a, b, 0.018);
  const length = Math.hypot(...a.map((v, i) => v - b[i]));
  for (let t = 0; t <= 1; t += 1 / Math.ceil(length * 2)) {
    const p = a.map((v, i) => v + (b[i] - v) * t); beam(THREE, materials, rod, parent, [p[0], p[1] - drop, p[2]], p, 0.016);
  }
}
