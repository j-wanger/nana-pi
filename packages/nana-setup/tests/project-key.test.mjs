// Gate: the project-key mapping. Claude Code stores per-project state (transcripts, auto-memory)
// under ~/.claude/projects/<key>; the shared-memory hook has to derive the same <key> or the
// `shared` symlink lands in a directory nobody reads.
//
// Grounding (2026-09-18, CLI 2.1.269): the key is `p.replace(/[^a-zA-Z0-9]/g, "-")`, and beyond
// 200 characters it is truncated to 200 with "-<hash>" appended. The literal samples below are
// cross-checked against the real ~/.claude/projects when it exists on this machine.
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { projectKey, slug, pathHash, KEY_MAX } = await import(new URL("../lib/project-key.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

/* --- the rule --------------------------------------------------------------------------- */
const cases = [
	["/Users/jwang/aml-desk", "-Users-jwang-aml-desk"],
	["/Users/jwang/.nana-worktrees/x", "-Users-jwang--nana-worktrees-x"],
	["/Users/jwang/nana-agent-loop", "-Users-jwang-nana-agent-loop"],
	["/Users/jwang/nana-pi", "-Users-jwang-nana-pi"],
	["/Users/jwang/the-hive", "-Users-jwang-the-hive"],
	["/Users/x/my_repo", "-Users-x-my-repo"], // underscore is outside [A-Za-z0-9]
	["/Users/x/a b.c", "-Users-x-a-b-c"], // space and dot too
	["C:\\dev\\repo", "C--dev-repo"],
];
for (const [input, want] of cases) check(`key(${input}) = ${want}`, projectKey(input) === want, projectKey(input));

/* --- over-long paths: truncate at 200 + hash -------------------------------------------- */
{
	const long = "/Users/jwang/" + "a".repeat(300);
	const key = projectKey(long);
	check("an over-long key is truncated to 200 + a hash", key.length > KEY_MAX && key.startsWith(slug(long).slice(0, KEY_MAX) + "-"));
	check("the hash is base 36", /^[0-9a-z]+$/.test(key.slice(KEY_MAX + 1)));
	check("the hash is stable", projectKey(long) === key);
	check("a 200-char key is NOT hashed", projectKey("/" + "a".repeat(199)).length === KEY_MAX);
	// the CLI's hash: h = (h << 5) - h + charCode, 32-bit, |0
	let h = 0;
	for (let i = 0; i < long.length; i++) h = ((h << 5) - h + long.charCodeAt(i)) | 0;
	check("pathHash matches the CLI's 32-bit string hash", pathHash(long) === Math.abs(h).toString(36));
}

/* --- cross-check against the real machine ----------------------------------------------- */
const projects = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"), "projects");
if (!fs.existsSync(projects)) {
	console.log("SKIP no ~/.claude/projects on this machine — the literal cases above stand alone");
} else {
	const dirs = new Set(fs.readdirSync(projects));
	// Any real directory on this machine whose mapped key must be one of the dirs Claude Code made.
	const candidates = fs
		.readdirSync(os.homedir(), { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => path.join(os.homedir(), d.name))
		.filter((p) => dirs.has(projectKey(p)));
	check(`at least 3 real project dirs map exactly (${candidates.length} matched)`, candidates.length >= 3, candidates.join(" "));
	for (const p of candidates.slice(0, 5)) check(`  real: ${p} -> ${projectKey(p)}`, dirs.has(projectKey(p)));
	// And the inverse: every existing dir name is a valid key shape.
	const odd = [...dirs].filter((d) => !/^[A-Za-z0-9-]+$/.test(d));
	check("every existing project dir name is [A-Za-z0-9-] only", odd.length === 0, odd.join(" "));
}

process.exit(fails);
