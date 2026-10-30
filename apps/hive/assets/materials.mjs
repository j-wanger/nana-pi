/**
 * @module apps/hive/assets/materials.mjs
 * @purpose Builds shared faceted materials from status and kind keys.
 * @inputs Explicit THREE namespace.
 * @outputs Material palette and pure status/kind colour tables.
 * @effects none
 * @errors None.
 */
import { STATUS_COLORS, KIND_RIMS, LIGHTS, STREETS } from '../config.mjs';
export { STATUS_COLORS, KIND_RIMS };
export function buildMaterials(THREE) {
  const material = color => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8 });
  return {
    status: Object.fromEntries(Object.entries(STATUS_COLORS).map(([key, color]) => [key, material(color)])),
    rim: Object.fromEntries(Object.entries(KIND_RIMS).map(([key, color]) => [key, material(color)])),
    honey: material('#eeefed'), dark: material('#242825'), bee: material('#b9bcb9'), ink: material('#171c19'),
    ground: material('#a9afa7'), street: new THREE.MeshBasicMaterial({ color: '#f4f5f2', polygonOffset: true, polygonOffsetFactor: STREETS.depthOffset, polygonOffsetUnits: STREETS.depthOffset }),
    windows: Object.fromEntries(Object.entries(LIGHTS.colors).map(([key, color]) => [key, new THREE.MeshBasicMaterial({ color })])),
    wing: new THREE.MeshStandardMaterial({ color: '#e6e9e4', transparent: true, opacity: 0.7, side: THREE.DoubleSide, flatShading: true }),
  };
}
