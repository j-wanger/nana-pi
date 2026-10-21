/**
 * @module packages/nana-pack/lib/windows-skips-config.mjs
 * @purpose Declare the whole-file Windows test skips the runner (scripts/test.mjs) reads on win32.
 * @inputs none
 * @outputs WINDOWS_SKIPS
 * @effects none
 * @errors none
 */
// Provenance: measured on CI Windows run 2 at 3bd044e
// (docs/reviews/win-impact-paths-2026-10-18/ci-windows-run-2.log); declared by the owner 2026-10-17.
// These 16 desk files failed there and nowhere else — live-feel and the other nine bench files
// were green on that same run and keep running. R-1383 holds this list to only test files the
// runner actually collects from apps/desk/test or apps/bench/test.
// The four bench entries this list once carried were removed 2026-10-19 by bench-win: fixed
// instead (R-1520, R-1521).

// cause (desk, 13 files): resolvePiPackage's `npm root -g` and `pi --version` probes run .cmd
// shims through execFileSync with no shell, which Node does not run on Windows, and the error is
// swallowed (inferred from pi-session.mjs:169-182); the server stops with "cannot start"
// (server.mjs:129).
const RESOLVER_CANNOT_START = "resolvePiPackage cannot tie pi to a package: its npm root -g and pi --version probes run .cmd shims through execFileSync with no shell, which Node does not run on Windows, and the error is swallowed (inferred); the server stops with \"cannot start\" (server.mjs:129)";

// cause (desk, 2 files): the test harness, not the server, is the bug.
const HARNESS_PATHNAME = "the harness passes new URL(..).pathname as a Windows path (e.g. D:\\D:\\...\\server.mjs), and the server behind it hits the resolver bug above (inferred)";

// cause (desk, 1 file): a platform-independent result; macOS already covers it.
const LAUNCHER_REGEX = "a source scan whose launcher regex expects \"/\"; the result is platform-independent and already covered on macOS";

const reason = (app, cause) => `win32: ${app} not supported on Windows (declared 2026-10-17): ${cause}`;

export const WINDOWS_SKIPS = Object.freeze({
	"apps/desk/test/app-listener.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/buffer-caps.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/changes-endpoint.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/crash-paths.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/pi-087-entries.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/pi-resolution.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/pi-rpc-contract.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/pi-session-parity.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/prompt-detach.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/spawn-and-persist.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/stage-key-persistence.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/teardown-invariants.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/usage-line.test.mjs": reason("desk", RESOLVER_CANNOT_START),
	"apps/desk/test/host-rule.test.mjs": reason("desk", HARNESS_PATHNAME),
	"apps/desk/test/origin-rule.test.mjs": reason("desk", HARNESS_PATHNAME),
	"apps/desk/test/knowledge-home-isolation.test.mjs": reason("desk", LAUNCHER_REGEX),
});
