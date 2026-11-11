/**
 * @module packages/nana-setup/tests/project-key.test.mjs
 * @purpose Pins the project-key mapping the shared-memory hook has to reproduce, including the truncation-plus-hash form
 * @inputs lib/project-key.mjs and literal POSIX and Windows path fixtures
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects none
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: the project-key mapping. Claude Code stores per-project state (transcripts, auto-memory)
// under ~/.claude/projects/<key>; the shared-memory hook has to derive the same <key> or the
// `shared` symlink lands in a directory nobody reads.
//
// Grounding (2026-09-18, CLI 2.1.269): the key is `p.replace(/[^a-zA-Z0-9]/g, "-")`, and beyond
// 200 characters it is truncated to 200 with "-<hash>" appended.

const { projectKey, slug, pathHash, KEY_MAX } = await import(new URL("../lib/project-key.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

/* --- the rule --------------------------------------------------------------------------- */
const cases = [
	["/Users/example/a-work-project", "-Users-example-a-work-project"],
	["/Users/x/my_repo", "-Users-x-my-repo"], // underscore is outside [A-Za-z0-9]
	["/Users/x/a b.c", "-Users-x-a-b-c"], // space and dot too
	["C:\\dev\\repo", "C--dev-repo"],
];
// req: R-347
for (const [input, want] of cases) check(`key(${input}) = ${want}`, projectKey(input) === want, projectKey(input));

/* --- over-long paths: truncate at 200 + hash -------------------------------------------- */
{
	const long = "/Users/example/" + "a".repeat(300);
	const key = projectKey(long);
	// req: R-347
	check("an over-long key is truncated to 200 + a hash", key.length > KEY_MAX && key.startsWith(slug(long).slice(0, KEY_MAX) + "-"));
	// req: R-347
	check("the hash is base 36", /^[0-9a-z]+$/.test(key.slice(KEY_MAX + 1)));
	check("a 200-char key is NOT hashed", projectKey("/" + "a".repeat(199)).length === KEY_MAX);
	// the CLI's hash: h = (h << 5) - h + charCode, 32-bit, |0
	let h = 0;
	for (let i = 0; i < long.length; i++) h = ((h << 5) - h + long.charCodeAt(i)) | 0;
	// req: R-347
	check("pathHash matches the CLI's 32-bit string hash", pathHash(long) === Math.abs(h).toString(36));
}

process.exit(fails);
