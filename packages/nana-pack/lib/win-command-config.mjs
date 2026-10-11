/**
 * @module packages/nana-pack/lib/win-command-config.mjs
 * @purpose Centralize the Windows command vocabulary and supported executable suffixes.
 * @inputs Windows command lookup and launch helpers.
 * @outputs frozen PATHEXT, pi suffixes and cmd.exe internal command names.
 * @effects none
 * @errors none.
 */

// Provenance: Windows default PATHEXT documented by Microsoft; these are the four default executable suffixes.
export const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";
// Provenance: CHANGE.md §1 supported external pi entry points and npm/pnpm Windows shims.
export const PI_EXTENSIONS = Object.freeze([".com", ".exe", ".bat", ".cmd"]);
// Provenance: ss64.com/nt/syntax-internal.html, “CMD internal commands”, retrieved 2026-10-11.
export const INTERNAL_COMMANDS = Object.freeze("assoc break call cd chdir cls color copy date del dir dpath echo endlocal erase exit for ftype goto if keys md mkdir mklink move path pause popd prompt pushd rd rem ren rename rmdir set setlocal shift start time title type ver verify vol".split(" "));
