/**
 * @module packages/nana-setup/tests/paths.test.mjs
 * @purpose Pins resolveLayout's isRealHome guard (false whenever ANY explicit override — --home, --claude-home, --pi-home — is in force, even when --home resolves to the same path as the real home directory) and tildeify's case rule on a case-variant home path (R-1204)
 * @inputs lib/paths.mjs resolveLayout and tildeify, NANA_SETUP_PLATFORM (the forced-platform seam), and os.homedir() (under the suite runner this is already a fresh per-file temp HOME, never the developer's real one — scripts/test.mjs scrubs it; resolveLayout itself touches no disk either way)
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none (pure path arithmetic; nothing on disk is read or written)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: paths.mjs's own doc comment on isRealHome (lines 82-83) says "False whenever a
// --home/--claude-home/--pi-home override is in play: nothing that touches the live machine
// (launchctl, `pi install`) may run then." The implementation only excluded claudeHome and
// piHome; an explicit --home that happens to RESOLVE to the real home directory (the literal
// case: `--home "$HOME"`) still read isRealHome true, letting pi install / launchctl run
// during what the caller meant as an isolated test run (pi-1.0-2026-10-04 review claim).
import * as os from "node:os";
import * as path from "node:path";

const { resolveLayout, tildeify } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

check("no override at all: isRealHome is true", resolveLayout({}).isRealHome === true);
check("--claude-home alone (even at the real path): isRealHome is false", resolveLayout({ claudeHome: os.homedir() }).isRealHome === false);
check("--pi-home alone (even at the real path): isRealHome is false", resolveLayout({ piHome: os.homedir() }).isRealHome === false);

// req: R-378
check("--home set to the home directory's OWN path still forces isRealHome false", resolveLayout({ home: os.homedir() }).isRealHome === false);

// An agent folder spelled in a different letter case still lies under the home folder on a
// case-insensitive file system — macOS (darwin) and Windows (win32) always; a case-sensitive
// one (linux) must keep comparing by exact case. NANA_SETUP_PLATFORM forces each branch so all
// three run on any one machine; the path's own spelling survives after the "~" either way.
const caseVariantResults = (() => {
	const results = [];
	const savedPlatform = process.env.NANA_SETUP_PLATFORM;
	const savedHome = process.env.HOME;
	const savedProfile = process.env.USERPROFILE;
	try {
		const home = path.join(os.tmpdir(), "Nana-Case-Fixture-Home");
		const variantHome = path.join(os.tmpdir(), "nana-case-fixture-home"); // same path, different case
		const variant = path.join(variantHome, "Sub", "nana-pack.json");
		process.env.HOME = home;
		process.env.USERPROFILE = home;

		process.env.NANA_SETUP_PLATFORM = "darwin";
		results.push(["darwin", tildeify(variant) === "~" + variant.slice(home.length)]);

		process.env.NANA_SETUP_PLATFORM = "win32";
		results.push(["win32", tildeify(variant) === "~" + variant.slice(home.length)]);

		process.env.NANA_SETUP_PLATFORM = "linux";
		results.push(["linux stays absolute", tildeify(variant) === variant]);
	} finally {
		if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
		if (savedProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = savedProfile;
		if (savedPlatform === undefined) delete process.env.NANA_SETUP_PLATFORM; else process.env.NANA_SETUP_PLATFORM = savedPlatform;
	}
	return results;
})();
// req: R-1204
check("a case-variant home path reads ~ on darwin and win32, keeping its own spelling after it, and stays absolute on linux",
	caseVariantResults.every(([, ok]) => ok), JSON.stringify(caseVariantResults));

process.exit(fails);
