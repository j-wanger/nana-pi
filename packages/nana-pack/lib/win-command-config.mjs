/**
 * @module packages/nana-pack/lib/win-command-config.mjs
 * @purpose Centralize supported Windows executable suffixes.
 * @inputs Windows command lookup and launch helpers.
 * @outputs default PATHEXT and frozen pi suffixes.
 * @effects none
 * @errors none.
 */

// Provenance: Windows default PATHEXT documented by Microsoft; these are the four default executable suffixes.
export const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";
// Provenance: CHANGE.md §1 supported external pi entry points and npm/pnpm Windows shims.
export const PI_EXTENSIONS = Object.freeze([".com", ".exe", ".bat", ".cmd"]);
