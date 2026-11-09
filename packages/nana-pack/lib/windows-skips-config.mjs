/**
 * @module packages/nana-pack/lib/windows-skips-config.mjs
 * @purpose Declare the whole-file Windows test skips the runner reads on win32.
 * @inputs none
 * @outputs WINDOWS_SKIPS
 * @effects none
 * @errors none
 */
// Provenance: measured on CI Windows run 2 at 3bd044e, declared 2026-10-17.
// Retirement 2026-11-09 removes the retired app-host test entries.
// ci-packs moved A/B to agent-dir-policy.test.mjs (docs/reviews/ci-packs/moves.json).
// Only section C remains; its own win32 guard says Windows locks a live cwd.
export const WINDOWS_SKIPS = Object.freeze({
 "packages/nana-pack/tests/agent-dir-hostile.test.mjs": "win32: Windows locks a live cwd and will not delete it",
});
