/**
 * @module packages/nana-pack/lib/windows-skips-config.mjs
 * @purpose Declare the whole-file Windows test skips the runner reads on win32.
 * @inputs none
 * @outputs WINDOWS_SKIPS
 * @effects none
 * @errors none
 */
// Provenance: measured on CI Windows run 2 at 3bd044e, declared 2026-10-17.
// Retirement 2026-11-07 removes desk-page test entries. The app host no longer
// imports the transcript parser, so its listener and persistence tests run on Windows.
// The resolver and installed-pi probe retain their existing resolver limitation;
// the source inventory retains its platform-independent launcher regex skip.
const RESOLVER_CANNOT_START = "resolvePiPackage cannot tie pi to a package: its npm root -g and pi --version probes run .cmd shims through execFileSync with no shell, which Node does not run on Windows, and the error is swallowed (inferred)";
const LAUNCHER_REGEX = "a source scan whose launcher regex expects \"/\"; the result is platform-independent and already covered on macOS";
const reason = cause => `win32: desk not supported on Windows (declared 2026-10-17): ${cause}`;
export const WINDOWS_SKIPS = Object.freeze({
 "apps/desk/test/pi-resolution.test.mjs": reason(RESOLVER_CANNOT_START),
 "apps/desk/test/pi-rpc-contract.test.mjs": reason(RESOLVER_CANNOT_START),
 "apps/desk/test/knowledge-home-isolation.test.mjs": reason(LAUNCHER_REGEX),
});
