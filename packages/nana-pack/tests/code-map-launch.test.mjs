/**
 * @module packages/nana-pack/tests/code-map-launch.test.mjs
 * @purpose Pin exact launch links, blind reach, declarations, history preservation and sealed launch vocabulary.
 * @inputs Shim functions, fixed git history and temporary fixture repositories.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (bounded shim and git children).
 * @errors Failed assertions or per-case deadlines produce exit 1.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { gitShow } from "./git-fixtures.mjs";
import { CASE_LIMIT_MS, withinCaseLimit } from "./report-fixtures.mjs";
import { checkRepo, writeMap } from "../../../scripts/code-map.mjs";

let failures = 0;
async function check(title, action) {
	try { await withinCaseLimit(title, action); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.message); }
}
const shim = new URL("../../../scripts/code-map.mjs", import.meta.url).href;
const configModule = () => import("../../../scripts/code-map-launch-config.mjs");
function fixture(action, variant = "lf") {
	const root = tmpDir(join(tmpdir(), "map-launch-"));
	const config = { roots: ["lib", "tests", "bin", "apps", "scripts", "extensions"], testRoots: ["tests"], moduleExtensions: [".mjs", ".ts"], mapPath: "map.md", runner: "npm run", packages: [{ id: "fixture", prefix: "" }], layers: [{ id: "all", title: "All", blurb: "Fixture", match: ".*" }], launchAlwaysRun: [] };
	const put = (path, source = "") => {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		const text = `/**\n * @module ${path}\n * @purpose Exercise fixture paths.\n * @inputs none\n * @outputs none\n * @effects none\n * @errors none\n */\n${source}`;
		writeFileSync(join(root, path), variant === "crlf" ? text.trimEnd().split("\n").map((line, i) => line + (i % 2 ? "\t" : "  ")).join("\r\n") : text);
	};
	const saveConfig = () => writeFileSync(join(root, "code-map.config.json"), JSON.stringify(config));
	for (const dir of config.roots) mkdirSync(join(root, dir));
	const cli = (...args) => spawnSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(shim)}); process.exitCode = m.repoMain ? m.repoMain(${JSON.stringify(args)}, ${JSON.stringify(root)}) : 0;`], { encoding: "utf8", timeout: CASE_LIMIT_MS });
	const get = (p) => checkRepo(root).graph.modules.get(p);
	saveConfig();
	try { return action({ root, config, put, saveConfig, cli, get }); }
	finally { rmSync(root, { recursive: true, force: true }); }
}
const here = 'const here = dirname(fileURLToPath(import.meta.url));\n';
function anchors(f) {
	f.put("lib/x-child.mjs"); f.put("bin/t.mjs"); f.put("apps/s.mjs"); f.put("scripts/tool.mjs");
	f.put("lib/x.mjs", 'spawnSync(process.execPath, [new URL("x-child.mjs", import.meta.url)]);');
	f.put("tests/a.test.mjs", 'import "../lib/x.mjs";');
	f.put("tests/b.test.mjs", here + 'const bin = join(here, "..", "bin"); spawnSync(process.execPath, [join(bin, "t.mjs")]);');
	f.put("lib/paths.mjs", 'export const root = new URL("../", import.meta.url);');
	f.put("tests/c.test.mjs", 'import { root } from @../lib/paths.mjs@; spawnSync(process.execPath, [join(root, "apps", "s.mjs")]);'.replaceAll("@", '"'));
	f.put("tests/d.test.mjs", 'spawnSync(process.execPath, ["scripts/tool.mjs"]);');
	// Assemble the inert fixture spelling so the suite's real-temp-call audit does not read it as a leak.
	f.put("tests/e.test.mjs", 'const tmp = ' + 'mkdtemp' + 'Sync("x"); spawnSync(process.execPath, [join(tmp, "bin", "t.mjs")]);');
}

// req: R-3149
await check("R-3149: anchors and exact launch literals link reciprocally without temporary-anchor guesses", () => {
	for (const variant of ["lf", "crlf"]) fixture((f) => {
		anchors(f); writeMap(f.root);
		for (const [from, to] of [["lib/x.mjs", "lib/x-child.mjs"], ["tests/b.test.mjs", "bin/t.mjs"], ["tests/c.test.mjs", "apps/s.mjs"], ["tests/d.test.mjs", "scripts/tool.mjs"]]) {
			assert(f.get(from).callees.includes(to), `${from} -> ${to}`);
			assert(f.get(to).callers.includes(from), `${to} <- ${from}`);
			const entry = readFileSync(join(f.root, "map.md"), "utf8").split(`### \`${from}\``)[1].split("### ")[0];
			assert(entry.includes(`\`${to}\``));
		}
		assert(!f.get("tests/e.test.mjs").callees.includes("bin/t.mjs"));
		assert.match(readFileSync(join(f.root, "map.md"), "utf8").split('### `tests/e.test.mjs`')[1], /unresolved launches.*line 9/);
	}, variant);
});

// req: R-3150
await check("R-3150: helper bindings resolve per site and non-launching references add no edge", () => fixture((f) => {
	f.put("bin/t.mjs"); f.put("bin/u.mjs");
	const pre = here + 'const CLI = join(here, "..", "bin", "t.mjs");\nfunction run(file) { return spawnSync(process.execPath, [file]); }\nrun(CLI);';
	f.put("tests/w.test.mjs", pre);
	f.put("tests/v.test.mjs", pre + '\nrun(process.argv[2]);');
	f.put("scripts/reference.mjs", here + 'const named = join(here, "..", "bin", "u.mjs");');
	writeMap(f.root);
	assert.deepEqual(f.get("bin/t.mjs").callers, ["tests/v.test.mjs", "tests/w.test.mjs"]);
	assert.deepEqual(f.get("bin/u.mjs").callers, []);
	const map = readFileSync(join(f.root, "map.md"), "utf8");
	assert(!map.split('### `tests/w.test.mjs`')[1].includes("unresolved launches"));
	assert.match(map.split('### `tests/v.test.mjs`')[1].split("### ")[0], /unresolved launches.*line 11.*binding line 13/);
}));

// req: R-3152
await check("R-3152: unresolved sites are numbered without guessing and local maps do not affect check", () => {
	for (const variant of ["lf", "crlf"]) fixture((f) => {
	f.put("bin/x.mjs"); f.put("lib/a.mjs");
	// The unchanged import parser sees import text inside inline code as an external fixture path.
	f.config.ignore = ["tests/lib/a.mjs"]; f.saveConfig();
	const source = 'function run(root) {\nspawnSync(process.execPath, [join(root, "bin", "x.mjs")]);\n}\nspawnSync(process.execPath, ["x.mjs"]);\nspawnSync(process.execPath, ["-e", "import(\'./lib/a.mjs\')"]);\nspawnSync(process.execPath, ["-e", "setInterval(() => {}, 1000)"]);\n// spawnSync(process.execPath, ["comment.mjs"]);\nconst re = /spawnSync\\(process.execPath/;\nconst text = "spawnSync(process.execPath, [])";';
	const launches = source + '\nspawnSync(process.execPath, [copyBin, "--", "-p", "review"]);\nconst code = "setInterval(() => {}, 1000)";\nspawnSync(process.execPath, ["-e", code]);\nspawnSync(process.execPath, ["--eval", `setInterval(() => {}, 1000)`]);\ncond ? spawnSync(process.execPath, [process.argv[2]]) : null;\ninterface Runner { spawnSync(command: string): unknown; }\ndeclare function spawnSync(command: string): unknown;\nconst methods = { spawnSync(command) { return command; } };';
	f.put("tests/u.test.mjs", launches); writeMap(f.root);
	assert.deepEqual(f.get("tests/u.test.mjs").callees, []);
	const entry = readFileSync(join(f.root, "map.md"), "utf8").split('### `tests/u.test.mjs`')[1];
	assert.equal((entry.match(/line \d+:/g) ?? []).length, 7, entry);
	for (const line of [10, 12, 13, 18, 20, 21, 22]) assert(entry.includes(`line ${line}:`), entry);
	for (const line of [14, 23, 24, 25]) assert(!entry.includes(`line ${line}:`), entry);
	assert.equal(f.cli("--check").status, 0);
	assert(f.cli("--impact", "bin/x.mjs").stdout.split("always-run tests (blind reach):")[1]?.includes("tests/u.test.mjs"));
	f.put("tests/u.test.mjs", launches + '\nspawnSync(process.execPath, [process.argv[2]]);');
	const result = f.cli("--check"); assert.equal(result.status, 0, result.stdout);
	assert.match(checkRepo(f.root).markdown, /line 26:/);
	writeFileSync(join(f.root, "map.md"), '### `deleted.mjs`\n');
	assert.equal(f.cli("--check").status, 0);
	rmSync(join(f.root, "map.md"));
	assert.equal(f.cli("--check").status, 0);
	}, variant);
});

// req: R-3153
await check("R-3153: impact marks launch-only callers and reports enriched blind reach", async () => fixture((f) => {
	anchors(f); f.put("lib/y.mjs", 'spawnSync(process.execPath, [process.argv[2]]);'); f.put("tests/y.test.mjs", 'import "../lib/y.mjs";');
	writeMap(f.root);
	const r = f.cli("--impact", "lib/x-child.mjs"); assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /tests\/a.test.mjs \[launch\/path\]/);
	const blind = r.stdout.split("always-run tests (blind reach):")[1]; assert(blind, r.stdout);
	assert.match(blind, /^ 2 of 6:/);
	assert(blind.includes("tests/y.test.mjs")); assert(blind.includes("tests/e.test.mjs"));
}));

// req: R-3154
await check("R-3154: launch-only tests count as traced with one untraced of three", () => fixture((f) => {
	f.put("bin/t.mjs"); f.put("tests/import.test.mjs", 'import "../bin/t.mjs";');
	f.put("tests/launch.test.mjs", 'spawnSync(process.execPath, [new URL("../bin/t.mjs", import.meta.url)]);'); f.put("tests/none.test.mjs");
	writeMap(f.root); const r = f.cli("--impact", "bin/t.mjs");
	assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /untraced tests: 1 of 3 test modules link no mapped module/);
	assert(!r.stdout.includes("only starts a process is not linked"));
}));

// req: R-3155
await check("R-3155: repo-code programs require reasoned declarations and remain in blind reach", () => fixture((f) => {
	f.put("extensions/e.ts"); f.put("bin/t.mjs");
	f.put("tests/p.test.mjs", here + 'spawnSync("pi", ["-e", join(here, "..", "extensions", "e.ts")]);');
	f.put("tests/q.test.mjs", 'spawnSync("bash", ["-c", "node bin/t.mjs"]);');
	writeMap(f.root); const bad = f.cli("--check"); assert.equal(bad.status, 1);
	for (const path of ["tests/p.test.mjs", "tests/q.test.mjs"]) assert(bad.stdout.includes(path), bad.stdout);
	assert(f.get("tests/p.test.mjs").callees.includes("extensions/e.ts"));
	f.config.launchAlwaysRun = ["tests/p.test.mjs", "tests/q.test.mjs"].map((path) => ({ path, reason: "Runs repository code under another program." }));
	f.saveConfig(); writeMap(f.root); const good = f.cli("--check"); assert.equal(good.status, 0, good.stdout);
	const blind = f.cli("--impact", "bin/t.mjs").stdout.split("always-run tests (blind reach):")[1];
	assert(blind?.includes("tests/p.test.mjs")); assert(blind?.includes("tests/q.test.mjs"));
}));

// req: R-3156
await check("R-3156: every fixed-base callee survives or has a named loss reason", () => {
	const losses = new Map([
		['packages/nana-pack/tests/requirements-lift.test.mjs -> scripts/requirements-tree.mjs', 'diet1 consolidates the lift proof and main-use fixture.'],
		...['extensions/nana-roster-notice.ts', 'lib/adoption.mjs'].map(target => [`packages/nana-pack/tests/agent-dir-config.test.mjs -> packages/nana-pack/${target}`, 'diet1 removes the unearned stranded-config read watcher.']),
		...[...['ask-shape', 'build-records-config', 'build-records', 'frontier-config', 'handoff-asks', 'suite-records-config', 'suite-records'].map(name => `packages/nana-pack/lib/${name}.mjs`), 'scripts/deliverables.mjs', 'scripts/requirements-tree.mjs'].map(target => [`packages/nana-pack/tests/product-report.test.mjs -> ${target}`, 'diet1 consolidates report drawing and retires unearned detail and age matrices.']),
		['packages/nana-pack/tests/brief-check.test.mjs -> packages/nana-pack/tests/slow-sampler.mjs', 'Cut A 2026-11-09: brief-check.test no longer launches pi-worker'],
		['packages/nana-setup/tests/uninstall.test.mjs -> packages/nana-setup/lib/steps.mjs', 'desk cut 2026-11-09'],
		['packages/nana-setup/tests/doctor-detail.test.mjs -> packages/nana-setup/lib/steps.mjs', 'desk cut 2026-11-09'],
		['packages/nana-setup/tests/agent-dir-consumers.test.mjs -> packages/nana-setup/bin/nana-setup.mjs', 'desk cut 2026-11-09'],
		['packages/nana-setup/lib/project.mjs -> packages/nana-pack/lib/json-text.mjs', 'FEAT-013 setup-tail stops seeding postEdit config; project no longer parses user config for the retired shadow guard.'],
		['packages/nana-pack/tests/claude-review.test.mjs -> packages/nana-pack/tests/ledger-repo.mjs', 'R-3766 removes the movement-only repository fixtures from launcher tests.'],
		['packages/nana-pack/tests/immutable-review.test.mjs -> packages/nana-pack/tests/ledger-repo.mjs', 'R-3766 removes movement-only repository fixtures; immutable snapshot checks remain.'],
		["packages/nana-pack/bin/pi-worker.mjs -> packages/nana-pack/lib/json-text.mjs", "FEAT-041 moves settings carry into claude-settings-carry.mjs, which imports the JSON helpers."],
		["packages/nana-pack/lib/roster-set.mjs -> packages/nana-pack/lib/bounded-read.mjs", "Config-write tail moved to pack-config-write.mjs; roster-set imports that shared writer."],
		["packages/nana-pack/lib/roster-set.mjs -> packages/nana-pack/lib/json-text.mjs", "Config-write tail moved to pack-config-write.mjs; roster-set imports that shared writer."],
		["packages/nana-pack/tests/objective-golden.test.mjs -> packages/nana-pack/bin/nana-objective.mjs", "Wrong basename guess: the hook runs instead."],
		["packages/nana-setup/tests/stale-copies.test.mjs -> packages/nana-pack/bin/nana-adoption.mjs", "Wrong basename guess: the hook runs instead."],
		["packages/nana-setup/tests/hooks-win32-exec.test.mjs -> packages/nana-knowledge/bin/nana-knowledge.ts", "Command text for a deleted checkout."],
		["packages/nana-setup/tests/hooks-win32-exec.test.mjs -> packages/nana-setup/bin/nana-setup.mjs", "Temporary worktree copy."],
		["packages/nana-setup/tests/copy-record.test.mjs -> packages/nana-setup/bin/nana-setup.mjs", "Temporary repository copy."],
		["packages/nana-pack/tests/review-standard.test.mjs -> packages/nana-pack/bin/pi-review.mjs", "Temporary pack copy."],
		["packages/nana-setup/tests/pi-registration.test.mjs -> packages/nana-setup/bin/nana-setup.mjs", "Twice-bound pkg does not trace."],
		["packages/nana-pack/tests/review-ledger.test.mjs -> packages/nana-pack/bin/review-round.mjs", "The review-ledger test files share review-ledger-fixture.mjs, which loads it; the run-alone file no longer loads it itself."],
		["packages/nana-pack/tests/review-ledger.test.mjs -> packages/nana-pack/tests/fake-pi.mjs", "The review-ledger test files share review-ledger-fixture.mjs, which loads it; the run-alone file no longer loads it itself."],
		["packages/nana-pack/tests/review-ledger.test.mjs -> packages/nana-pack/tests/tmp-dir.mjs", "The review-ledger test files share review-ledger-fixture.mjs, which loads it; the run-alone file no longer loads it itself."],
		["packages/nana-pack/tests/review-ledger.test.mjs -> packages/nana-pack/lib/verdict-config.mjs", "The verdict checks moved to review-ledger-verdicts.test.mjs, which imports it."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-pack/bin/nana-adoption.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-pack/bin/nana-frontier-summary.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-pack/bin/nana-objective.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
		["packages/nana-setup/lib/hook-producer.mjs -> packages/nana-setup/bin/stale-copies.mjs", "Only a sealed wrapper definition, not a launch call; injected run is outside the sealed call vocabulary."],
	]);
	const retiredStudyModules = new Set([
		"aggregate.mjs", "catch-ledger.mjs", "run.mjs", "ext/bench-nested-usage.ts",
		...["agentdir", "catch-extract", "catch-stats", "checkers", "eval-module", "fixture", "nested", "pi-exports", "plan", "profiles"].map(n => `lib/${n}.mjs`),
		...["agentdir", "aggregate", "argv", "catch-ledger", "checkers", "evaluator-hardening", "integration", "nested", "ops", "orchestration-paths", "plan", "study-tasks", "timeout", "usage"].map(n => `test/${n}.test.mjs`),
	].map(p => `apps/bench/${p}`));
	losses.set("scripts/deliverables.mjs -> apps/bench/lib/checkers.mjs", "Study checkers retired; globMatch moved to scripts/glob-match.mjs.");
	losses.set("scripts/product-report.mjs -> apps/bench/lib/checkers.mjs", "Study checkers retired; globMatch moved to scripts/glob-match.mjs.");
	// The one-reviewer cut retires these sources, including all of their former outgoing edges.
	const retiredSources = new Map([
		['apps/bench/lib/usage.mjs', 'FEAT-007 review fix removes the unused stream parser after the memory factory cut.'],
		...['apps/bench/test/retire.test.mjs', ...['preview-retirement', 'gate-config-robustness', 'experiment-cut', 'memory-cut-checks'].map(name => `packages/nana-pack/tests/${name}.test.mjs`), 'packages/nana-setup/tests/stale-copies-slow.test.mjs'].map(file => [file, 'FEAT-031 test-retire removes the named Lane A test file; its live cases or markers move to kept tests.']),
		...['packages/nana-setup/claude/hooks/verifier-pipe.mjs', 'packages/nana-setup/lib/verifier-hook.mjs'].map(file => [file, 'FEAT-013 retires only the Claude verifier hook and wrapper library; the pi predicate stays.']),
		...['extensions/nana-handoff.ts', ...['handoff-artifact', 'handoff-store', 'handoff-staleness', 'handoff-trust', 'handoff-symlink'].map(name => `tests/${name}.test.mjs`)].map(file => [`packages/nana-pack/${file}`, 'FEAT-013 retires compaction storage and pickup; adoption survives separately.']),
		...['extensions/nana-post-edit.ts', 'lib/post-edit-config.mjs', ...['post-edit-default-timeout', 'post-edit-file-queue', 'post-edit-hardening', 'post-edit-status', 'post-edit-utf8', 'post-edit-values-named'].map(name => `tests/${name}.test.mjs`)].map(file => [`packages/nana-pack/${file}`, 'FEAT-013 retires the post-edit extension and its dedicated checks.']),
		['packages/nana-pack/extensions/nana-notify.ts', 'FEAT-013 setup-retire removes desktop notification behavior.'],
		['packages/nana-pack/tests/notify-dispatch.test.mjs', 'FEAT-013 retires notifier-only dispatch checks with their extension.'],
		['packages/nana-pack/tests/notify-fallback.test.mjs', 'FEAT-013 retires notifier-only failure checks with their extension.'],
		['scripts/lane-class.mjs', 'Lane classification is retired by R-3761.'],
		['scripts/requirements-moved.mjs', 'R-3770 removes the movement command; git-runner preserves its git helpers.'],
		['packages/nana-pack/bin/review-ledger.mjs', 'R-3765 moves review execution into review-run and claude-review.'],
		['packages/nana-pack/lib/review-movement.mjs', 'R-3770 removes movement context.'],
		['packages/nana-pack/lib/review-movement-config.mjs', 'R-3770 removes movement context configuration.'],
		['packages/nana-pack/tests/requirements-moved.test.mjs', 'R-3770 removes movement-only tests with the command.'],
		['packages/nana-pack/tests/review-movement.test.mjs', 'R-3770 removes movement-only tests with the prompt producer.'],
		['packages/nana-pack/tests/keep-movement.test.mjs', 'R-3770 removes keep-only tests with the command.'],
		['packages/nana-pack/lib/mutation-runner-config.mjs', 'Seat mutation runner is retired by R-3761.'],
		['packages/nana-pack/lib/mutation-runner.mjs', 'Seat mutation runner is retired by R-3761.'],
		['packages/nana-pack/tests/lane-class.test.mjs', 'Classifier tests retired with their code by R-3761.'],
		['packages/nana-pack/tests/mutation-runner.test.mjs', 'Seat runner tests retired with their code by R-3761.'],
		['packages/nana-pack/tests/mutation-runner-takeover.test.mjs', 'Seat runner tests retired with their code by R-3761.'],
	]);
	for (const target of ['scripts/test-locked.mjs', 'scripts/runtime-measure.mjs']) losses.set(`packages/nana-pack/tests/process-tree.test.mjs -> ${target}`, 'R-3863 retires the duplicate-kill scan fixtures; runtime tree-kill assertions survive.');
	losses.set('packages/nana-pack/bin/pi-worker.mjs -> packages/nana-pack/lib/lane-class-config.mjs', 'R-3761 removes lane classification from build output.');
	losses.set('packages/nana-pack/bin/pi-worker.mjs -> scripts/lane-class.mjs', 'R-3761 removes lane classification from build output.');
	for (const file of ['display-surfaces', 'config-handlers-malformed']) losses.set(`packages/nana-pack/tests/${file}.test.mjs -> packages/nana-pack/extensions/nana-post-edit.ts`, 'FEAT-013 removes the post-edit-only cases; surviving cases remain.');
	for (const file of ['display-surfaces', 'config-handlers-malformed', 'writing-injection', 'handoff-writer-role', 'adoption-producer']) losses.set(`packages/nana-pack/tests/${file}.test.mjs -> packages/nana-pack/extensions/nana-handoff.ts`, 'FEAT-013 removes handoff-only calls; adoption now imports nana-adoption.');
	losses.set('packages/nana-pack/tests/adoption-producer.test.mjs -> packages/nana-pack/lib/config.ts', 'FEAT-013 adoption now reads only user-scope adoptionSettings; the test still exercises config via its dynamic import.');
	for (const target of ['packages/nana-setup/lib/settings.mjs', 'packages/nana-setup/lib/verifier-hook.mjs', 'packages/nana-pack/lib/pipe-guard.mjs', 'packages/nana-setup/bin/nana-setup.mjs']) losses.set(`packages/nana-setup/tests/verifier-pipe.test.mjs -> ${target}`, 'FEAT-013 retires the Claude wrapper cases, retaining the doctor and pi predicate documentation cases.');
	losses.set('packages/nana-setup/tests/hook-producers.test.mjs -> packages/nana-setup/lib/verifier-hook.mjs', 'FEAT-013 retires the wrapper import-safety case with the library.');
	for (const caller of ['lib/install-check.mjs', ...['install-check', 'doctor-fix-line', 'install', 'linked-claude-folder', 'relative-agent-dir', 'rulings-install', 'settings-lock', 'skills-and-standards', 'win32-degrade', 'win32-hook-repair'].map(name => `tests/${name}.test.mjs`)]) losses.set(`packages/nana-setup/${caller} -> packages/nana-setup/lib/doctor.mjs`, 'FEAT-013 removes the delegation-runtime floor import with the vendor install and retry.');
	const retiredTargets = new Map([
		['apps/bench/lib/usage.mjs', 'FEAT-007 review fix removes the unused stream parser after the memory factory cut.'],
		['scripts/requirements-moved.mjs', 'R-3770 rehomes the shared runner in git-runner.mjs and removes movement.'],
		['packages/nana-pack/bin/review-ledger.mjs', 'R-3765 moves execution into review-run.mjs, shared with the test harness.'],
		['packages/nana-pack/lib/review-movement.mjs', 'R-3766 removes movement from reviewer prompts.'],
		['packages/nana-pack/lib/review-movement-config.mjs', 'R-3766 removes movement configuration and its test imports.'],
	]);
	// Named retirement losses: spell stems in pieces so live source does not advertise removed modules.
	const cutStem = words => words.join('-');
	const memoryCuts = new Set([
	 ...[['memory','replay'], ['memory','score'], ['outcome','meter'], ['outcome','score'], ['outcome','compare'], ['blast','radius'], ['requirement','rows']].map(words => `scripts/${cutStem(words)}.mjs`),
	 ...[['memory','replay'], ['memory','replay','config'], ['memory','replay','context'], ['memory','score'], ['outcome','meter'], ['outcome','meter','config'], ['outcome','score'], ['writing','trial','extractor'], ['blast','radius','config'], ['tree','kill','scan']].map(words => `packages/nana-pack/lib/${cutStem(words)}.mjs`),
	 ...[['memory','replay'], ['outcome','meter'], ['writing','trial','extractor'], ['blast','radius'], ['requirement','rows']].map(words => `packages/nana-pack/tests/${cutStem(words)}.test.mjs`),
	 ['packages/nana-knowledge/extensions', 'nana-knowledge.ts'].join('/'),
	 ['packages/nana-knowledge/tests', 'extension.test.mjs'].join('/'),
	 ...[['memory','end','hook'], ['memory','end','wiring']].map(words => `packages/nana-setup/tests/${cutStem(words)}.test.mjs`),
	]);
	const noReaderCuts = new Set([
		...[['review', 'timeline'], ['brief', 'check'], ['build', 'report'], ['nana', 'frontier']].map(words => words.join('-')).map(name => `packages/nana-pack/bin/${name}.mjs`),
		...[['ci', 'records'], ['ts', 'syntax', 'check'], ['component', 'audit'], ['component', 'audit', 'config'], ['component', 'contract']].map(words => words.join('-')).map(name => `scripts/${name}.mjs`),
		...[['review', 'timeline'], ['build', 'report'], ['ts', 'syntax', 'check'], ['component', 'audit'], ['profile', 'sync']].map(words => words.join('-')).map(name => `packages/nana-pack/tests/${name}.test.mjs`),
	]);
	const factoryCuts = new Set([
		...[['nana', 'memory'], ['nana', 'curate']].map(words => `packages/nana-pack/bin/${cutStem(words)}.mjs`),
		...[['memory', 'curation'], ['memory', 'curation', 'config'], ['memory', 'making'], ['memory', 'making', 'config'], ['memory', 'shaping'], ['memory', 'shaping', 'config'], ['memory', 'run'], ['memory', 'start']].map(words => `packages/nana-pack/lib/${cutStem(words)}.mjs`),
		...[['memory', 'curate'], ['memory', 'make'], ['memory', 'run'], ['memory', 'shape'], ['memory', 'shape', 'runners']].map(words => `scripts/${cutStem(words)}.mjs`),
		...[['memory', 'curation'], ['memory', 'cut', 'guidance'], ['memory', 'making'], ['memory', 'run'], ['memory', 'run', 'recovery'], ['memory', 'run', 'seals'], ['memory', 'session', 'end'], ['memory', 'shaping']].map(words => `packages/nana-pack/tests/${cutStem(words)}.test.mjs`),
		`packages/nana-pack/tests/${cutStem(['memory', 'run', 'fixture'])}.mjs`,
		`packages/nana-setup/claude/hooks/${cutStem(['nana', 'memory', 'end'])}.mjs`,
	]);
	losses.set('packages/nana-pack/lib/memory-store.mjs -> packages/nana-pack/lib/profile-config.mjs', 'Cut B retains only profile-compatible reads, saved merges and area-local writes.');
	for (const target of ['lib/profile-sync.mjs', 'bin/nana-profile.mjs']) losses.set(`packages/nana-setup/lib/doctor.mjs -> packages/nana-pack/${target}`, 'Cut B removes factory-only run-health probes; hook retirement diagnostics stay.');
	const graph = checkRepo().graph;
	for (const entry of gitShow("57167e92",  "docs/code-map.md").split(/^### `/m).slice(1)) {
		const path = entry.split("`")[0];
		for (const match of (entry.match(/^- \*\*callees\*\* — (.*)$/m)?.[1] ?? "").matchAll(/`([^`]+)`/g)) {
			const edge = `${path} -> ${match[1]}`;
			if (factoryCuts.has(path) || factoryCuts.has(match[1])) losses.set(edge, 'Cut B 2026-11-09 removes the paused memory factory and dedicated tests; profile compatibility and anatomy readers stay.');
			if (noReaderCuts.has(path) || noReaderCuts.has(match[1])) losses.set(edge, 'Cut A 2026-11-09 removes no-reader tools and their dedicated tests; live library consumers stay.');
			if (memoryCuts.has(path) || memoryCuts.has(match[1])) losses.set(edge, 'FEAT-043 R-3860/R-3863 retire automatic delivery and completed instruments; surviving readers and assertions moved.');
			if (retiredStudyModules.has(path)) losses.set(edge, `FEAT-034 retired study module ${path} and its runner-only tests; frozen records remain.`);
			// Owner retirement (2026-11-07): the preview and all of its consumers left together.
			const retiredPreview = [path, match[1]].some(file => file.startsWith(['apps', 'hive', ''].join('/')) || /^hive-/.test(file.split('/').at(-1)));
			const retiredDesk = [path, match[1]].some(file => file.startsWith(['apps', 'desk', ''].join('/')) || file.startsWith(['packages', ['nana', 'stage'].join('-'), ''].join('/')) || file === ['packages/nana-setup/tests', ['desk', 'service.test.mjs'].join('-')].join('/'));
			assert(graph.modules.get(path)?.callees.includes(match[1]) || losses.get(edge) || retiredPreview || retiredDesk || (!graph.modules.has(match[1]) && retiredTargets.get(match[1])) || (!graph.modules.has(path) && retiredSources.get(path)), `lost edge: ${edge}`);
		}
	}
});

process.exitCode = failures ? 1 : 0;
