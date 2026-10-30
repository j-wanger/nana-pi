/**
 * @module scripts/hive-page-config.mjs
 * @purpose Seals the provenance of the vendored hive renderer.
 * @inputs None.
 * @outputs Three.js release and SHA-256 release bytes.
 * @effects none
 * @errors None.
 */
// measured (2026-10-29, R-3124): official registry.npmjs.org/three/-/three-0.186.1.tgz,
// extracted package/build files, unmodified. Tarball SHA-256:
// 8cd068708ea44f2c73c944b1cead2ba2f0d5c15c8fc194e5700f4e4f4a033fe7.
export const THREE_VERSION = '0.186.1';
export const VENDOR_SHA256 = Object.freeze({
  'three.module.js': '9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea',
  'three.core.js': '9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6',
});
