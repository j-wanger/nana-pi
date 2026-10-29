/**
 * @module apps/hive/assets/bee.mjs
 * @purpose Builds a reusable faceted bee with paired pale wings.
 * @inputs Explicit THREE namespace and shared materials.
 * @outputs A small THREE group requiring no WebGL context.
 * @effects none
 * @errors None.
 */
export function buildBee(THREE, materials) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), materials.bee); body.scale.set(1, 0.7, 1.5); group.add(body);
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), materials.ink); head.position.z = 0.9; group.add(head);
  for (const z of [-0.35, 0.2]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.2, 6), materials.ink); band.rotation.x = Math.PI / 2; band.position.z = z; group.add(band); }
  for (const side of [-1, 1]) { const wing = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), materials.wing); wing.rotation.x = -Math.PI / 2; wing.rotation.y = side * 0.3; wing.position.set(side * 0.65, 0.5, 0); group.add(wing); }
  return group;
}
