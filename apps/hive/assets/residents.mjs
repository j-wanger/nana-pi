/**
 * @module apps/hive/assets/residents.mjs
 * @purpose Builds a small faceted resident using the bee builder's explicit dependency pattern.
 * @inputs Explicit THREE namespace and shared materials.
 * @outputs A local-space standing figure with no renderer dependency.
 * @effects none
 * @errors None.
 */
export function buildResident(THREE, materials) {
  const group = new THREE.Group();
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), materials.ink); head.position.y = 0.95; group.add(head);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.48, 6), materials.bee); body.position.y = 0.56; group.add(body);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.35, 0.12), materials.ink); leg.position.set(side * 0.1, 0.175, 0); group.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.35, 0.1), materials.bee); arm.position.set(side * 0.25, 0.55, 0); arm.rotation.z = side * -0.25; group.add(arm);
  }
  return group;
}
