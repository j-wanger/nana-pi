/**
 * @module packages/nana-pack/tests/review-timeline.test.mjs
 * @purpose Pins the review timeline (R-1560 to R-1565, must-meet RT1 to RT6) through the real CLI
 *  against the real review ledger: grouping into rounds, MUST findings read from a sent-back
 *  review's own recorded file in each declared layout, the four cases where none can be read, the
 *  marks an unverified, over-cap, no-verdict or older line carries, no absolute path in the output,
 *  and no write to the ledger folder or any review folder.
 * @inputs bin/review-timeline.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub reviewer
 *  process, and temporary git repositories, HOMEs and review-output folders under the OS temp
 *  directory
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, git repositories and review-output folders under the OS temp
 *  directory; hand-crafted tally lines appended only to those temp ledgers), process (spawns
 *  bin/review-timeline.mjs and, through bin/review-ledger.mjs, a stub reviewer process)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { repoKeyOf } from "../bin/review-round.mjs";
import { WORD_MUST, WORD_NOTE, WORD_SEND_BACK, WORD_SHOULD } from "../lib/review-timeline-config.mjs";

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
const TIMELINE = path.join(bin, "review-timeline.mjs");
const LEDGER_CLI = path.join(bin, "review-ledger.mjs");

let fails = 0;
const check = (name, ok, why = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why);
	if (!ok) fails++;
};

const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "review-timeline-test-")));

// ---------------------------------------------------------------------- fixture plumbing
// The stub reviewer: prints the file named by STUB_FILE byte for byte, ignoring its own argv.
const stubDir = path.join(root, "stub");
fs.mkdirSync(stubDir, { recursive: true });
const stubPath = path.join(stubDir, "print-stub.mjs");
fs.writeFileSync(stubPath, 'import { readFileSync } from "node:fs";\nprocess.stdout.write(readFileSync(process.env.STUB_FILE));\n');

const git = (cwd, ...args) =>
	spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@test.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8" });
function makeRepo(name) {
	const dir = path.join(root, name);
	fs.mkdirSync(dir, { recursive: true });
	const init = git(dir, "init", "-q");
	if (init.status !== 0) throw new Error(init.stderr);
	return dir;
}
function commit(dir, content, msg) {
	fs.writeFileSync(path.join(dir, "f"), content);
	git(dir, "add", "f");
	const c = git(dir, "commit", "-qm", msg);
	if (c.status !== 0) throw new Error(c.stderr);
}
function makeHome(name) {
	const home = path.join(root, name);
	fs.mkdirSync(home, { recursive: true });
	return home;
}
const env = (home) => ({ ...process.env, HOME: home, USERPROFILE: home });

let fixtureCounter = 0;
function writeFixtureSource(text) {
	const dir = path.join(root, "stub-sources");
	fs.mkdirSync(dir, { recursive: true });
	const f = path.join(dir, `fixture-${++fixtureCounter}.md`);
	fs.writeFileSync(f, text);
	return f;
}

/** Record a real review through `review-ledger run`: the stub prints `text` byte for byte. */
function recordReview({ home, repoDir, item, role, model, outFile, text }) {
	const stubFile = writeFixtureSource(text);
	fs.mkdirSync(path.dirname(outFile), { recursive: true });
	return spawnSync(
		process.execPath,
		[LEDGER_CLI, "run", "--item", item, "--role", role, "--out", outFile, "--", process.execPath, stubPath, "--model", model],
		{ cwd: repoDir, env: { ...env(home), STUB_FILE: stubFile }, encoding: "utf8", timeout: 30000 },
	);
}

function runTimeline(home, args) {
	return spawnSync(process.execPath, [TIMELINE, ...args], { env: env(home), encoding: "utf8", timeout: 30000 });
}

function appendTally(home, record) {
	const dir = path.join(home, ".pi", "agent");
	fs.mkdirSync(dir, { recursive: true });
	fs.appendFileSync(path.join(dir, "review-ledger.rounds.jsonl"), `${JSON.stringify(record)}\n`);
}

function snapshotDir(dir) {
	if (!fs.existsSync(dir)) return [];
	const out = [];
	const walk = (d, rel) => {
		for (const entry of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const full = path.join(d, entry.name);
			const relPath = rel ? `${rel}/${entry.name}` : entry.name;
			if (entry.isDirectory()) walk(full, relPath);
			else if (entry.isFile()) out.push(`${relPath}:${createHash("sha256").update(fs.readFileSync(full)).digest("hex")}`);
		}
	};
	walk(dir, "");
	return out;
}

// ======================================================================== RT1 (R-1560)
{
	const home = makeHome("rt1-home");
	const repoA = makeRepo("rt1-repo-a");
	commit(repoA, "a0", "c0");
	const outs = path.join(root, "rt1-outs");
	const r1 = recordReview({ home, repoDir: repoA, item: "timeline-one", role: "opus", model: "opus-model-r1", outFile: path.join(outs, "opus-r1.md"), text: `VERDICT: ${WORD_SEND_BACK}\n` });
	const r2 = recordReview({ home, repoDir: repoA, item: "timeline-one", role: "fable", model: "fable-model-r1", outFile: path.join(outs, "fable-r1.md"), text: "VERDICT: LAND\n" });
	commit(repoA, "a1", "c1");
	const r3 = recordReview({ home, repoDir: repoA, item: "timeline-one", role: "opus", model: "opus-model-r2", outFile: path.join(outs, "opus-r2.md"), text: "VERDICT: LAND\n" });
	// noise that must not show: another item in the same repo, and the same item in another repo
	const r4 = recordReview({ home, repoDir: repoA, item: "timeline-two", role: "opus", model: "modelItem2-leak", outFile: path.join(outs, "other-item.md"), text: "VERDICT: LAND\n" });
	const repoB = makeRepo("rt1-repo-b");
	commit(repoB, "b0", "c0");
	const r5 = recordReview({ home, repoDir: repoB, item: "timeline-one", role: "opus", model: "modelB-leak", outFile: path.join(outs, "repob.md"), text: "VERDICT: LAND\n" });
	check("RT1 setup: every recorded review earned its round", [r1, r2, r3, r4, r5].every((r) => r.status === 0), [r1, r2, r3, r4, r5].map((r) => r.stderr).join("\n"));

	const t = runTimeline(home, ["--item", "Timeline-ONE", "--repo", repoA]);
	const out = t.stdout;
	const round1 = out.indexOf("## Round 1");
	const round2 = out.indexOf("## Round 2");
	const opusLine = out.indexOf("role: opus");
	const fableLine = out.indexOf("role: fable");
	const roundHeadingCount = (out.match(/^## Round /gm) || []).length;
	const round1Section = round1 >= 0 ? out.slice(round1, round2 > round1 ? round2 : undefined) : "";
	const round1Rev = /## Round 1 — ([0-9a-f]{12})\b/.exec(out)?.[1];
	const round2Rev = /## Round 2 — ([0-9a-f]{12})\b/.exec(out)?.[1];
	// req: R-1560
	check(
		"RT1: one item's reviews in one repository, grouped into rounds in ledger order with revision, role, model, verdict and duration",
		t.status === 0 &&
			roundHeadingCount === 2 &&
			round1 >= 0 &&
			round2 > round1 &&
			opusLine >= 0 &&
			opusLine < fableLine &&
			round1Section.includes("role: opus") &&
			round1Section.includes("role: fable") &&
			Boolean(round1Rev) &&
			Boolean(round2Rev) &&
			round1Rev !== round2Rev &&
			!out.includes("modelB-leak") &&
			!out.includes("modelItem2-leak") &&
			out.includes("opus-model-r1") &&
			out.includes("fable-model-r1") &&
			out.includes("opus-model-r2") &&
			out.includes(`verdict: ${WORD_SEND_BACK}`) &&
			out.includes("verdict: LAND") &&
			/duration: \d+m \d{2}s/.test(out),
		JSON.stringify({ status: t.status, stderr: t.stderr, out, roundHeadingCount, round1Rev, round2Rev }),
	);
}

// ======================================================================== RT2 (R-1561)
{
	const home = makeHome("rt2-home");
	const repo = makeRepo("rt2-repo");
	commit(repo, "v0", "c0");
	const outs = path.join(root, "rt2-outs");
	const fixtures = {
		"layout-a":
			`## ${WORD_MUST}\n1. **Validate the input payload**\n   - **Smallest fix:** add a null check before dereferencing.\n` +
			`   - cite: src/parse.mjs:42\n\n#### Rationale\nContext that stays inside the MUST section: a deeper sub-heading does not end it.\n\n` +
			`2. **Guard the empty-list case**\n   - **Smallest fix:** return early when the list is empty.\n\n` +
			`## ${WORD_SHOULD}\n- Rename the helper function for clarity.\n\n## ${WORD_NOTE}\n- Consider adding a changelog entry.\n\nVERDICT: ${WORD_SEND_BACK}\n`,
		"layout-b":
			`### ${WORD_MUST} — Fix the race in the lock acquire path\nDetail paragraph describing the race condition.\n\n` +
			`### ${WORD_MUST} — Handle the empty queue on shutdown\nDetail paragraph describing shutdown handling.\n\n` +
			`### ${WORD_SHOULD} — Rename the helper for clarity\n\n### ${WORD_NOTE} — Consider caching the result\n\nVERDICT: ${WORD_SEND_BACK}\n`,
		"layout-c":
			`### ${WORD_MUST}\n**1. Reject malformed headers.**\n**Files:** src/http/headers.mjs:10-18\n\n` +
			`**2. Close the socket on timeout.**\n**Files:** src/http/socket.mjs:77\n\n` +
			`### ${WORD_SHOULD}\n**1. Rename the helper.**\n\n### ${WORD_NOTE}\n**1. Consider a changelog entry.**\n\nVERDICT: ${WORD_SEND_BACK}\n`,
		"layout-d":
			`VERDICT: ${WORD_SEND_BACK}\n\n1. ${WORD_MUST} — Reject requests missing the auth header\n` +
			`2. ${WORD_SHOULD} — Simplify the retry loop\n3. ${WORD_NOTE} — Consider a changelog entry\n`,
		"layout-e":
			`VERDICT: ${WORD_SEND_BACK}\r\n\r\n- **${WORD_MUST} — Close the temp file handle.** Leaking fd across retries.\r\n` +
			`- ${WORD_SHOULD} — Add a regression test.\r\n- ${WORD_NOTE} — Consider logging the retry count.`,
	};
	const runs = {};
	for (const [role, text] of Object.entries(fixtures)) {
		runs[role] = recordReview({ home, repoDir: repo, item: "layouts", role, model: `model-${role}`, outFile: path.join(outs, `${role}.md`), text });
	}
	check("RT2 setup: all five layouts recorded", Object.values(runs).every((r) => r.status === 0), Object.entries(runs).map(([k, r]) => `${k}:${r.stderr}`).join("\n"));

	const t = runTimeline(home, ["--item", "layouts", "--repo", repo]);
	const out = t.stdout;
	const expectTitles = [
		`${WORD_MUST} — Validate the input payload`,
		`${WORD_MUST} — Guard the empty-list case`,
		`${WORD_MUST} — Fix the race in the lock acquire path`,
		`${WORD_MUST} — Handle the empty queue on shutdown`,
		`${WORD_MUST} — Reject malformed headers.`,
		`${WORD_MUST} — Close the socket on timeout.`,
		`${WORD_MUST} — Reject requests missing the auth header`,
		`${WORD_MUST} — Close the temp file handle.`,
	];
	const allTitlesPresent = expectTitles.every((s) => out.includes(s));
	const noLeak = !/Smallest fix|Files:|SHOULD|NOTE|changelog|regression test|retry count|retry loop|Rename the helper|Rationale|cite:/.test(out);
	const titleCount = (out.match(/- MUST — /g) || []).length;
	// req: R-1561
	check(
		"RT2: a sent-back review lists the MUST findings its recorded file states in each declared layout, and no SHOULD, NOTE, label or detail line",
		t.status === 0 && allTitlesPresent && noLeak && titleCount === expectTitles.length,
		JSON.stringify({ status: t.status, stderr: t.stderr, out, expectTitles, allTitlesPresent, titleCount }),
	);
}

// ======================================================================== RT3 (R-1562)
{
	const home = makeHome("rt3-home");
	const repo = makeRepo("rt3-repo");
	const outs = path.join(root, "rt3-outs");

	// (a) a file deleted after its run
	commit(repo, "a0", "c-a");
	const outA = path.join(outs, "gone.md");
	const ra = recordReview({ home, repoDir: repo, item: "rt3", role: "role-a", model: "model-a", outFile: outA, text: `VERDICT: ${WORD_SEND_BACK}\n` });
	fs.unlinkSync(outA);

	// (b) a file rewritten after its run to end VERDICT: LAND and hold a planted MUST
	commit(repo, "b0", "c-b");
	const outB = path.join(outs, "rewritten.md");
	const rb = recordReview({ home, repoDir: repo, item: "rt3", role: "role-b", model: "model-b", outFile: outB, text: `VERDICT: ${WORD_SEND_BACK}\n` });
	fs.writeFileSync(outB, `### ${WORD_MUST} — PLANTED finding must never appear\nSome detail.\n\nVERDICT: LAND\n`);

	// (c) a file in the HIGH/MEDIUM severity grammar, no MUST section at all
	commit(repo, "c0", "c-c");
	const outC = path.join(outs, "severity.md");
	const rc = recordReview({
		home, repoDir: repo, item: "rt3", role: "role-c", model: "model-c", outFile: outC,
		text: `## Findings\n\nHIGH — Something is wrong with the retry loop.\nMEDIUM — The log message is misleading.\n\nVERDICT: ${WORD_SEND_BACK}\n`,
	});

	// (d) a hand-made SEND-BACK tally line with no audit record
	commit(repo, "d0", "c-d");
	const repoKey = repoKeyOf(repo);
	appendTally(home, { v: 2, kind: "round", repo: repoKey, item: "rt3", revision: "d".repeat(40), role: "role-d", model: "model-d", verdict: WORD_SEND_BACK, durationMs: 1000 });

	check("RT3 setup: (a)-(c) recorded", [ra, rb, rc].every((r) => r.status === 0), [ra, rb, rc].map((r) => r.stderr).join("\n"));

	const t = runTimeline(home, ["--item", "rt3", "--repo", repo]);
	const out = t.stdout;
	// req: R-1562
	check(
		"RT3: no recorded file, a gone file, a disagreeing file or no readable MUST is stated for that review and no finding is listed",
		t.status === 0 &&
			out.includes("model-a") && out.includes("review file gone") &&
			out.includes("model-b") && out.includes("disagrees with the ledger") &&
			out.includes("model-c") && out.includes("no MUST readable") &&
			out.includes("model-d") && out.includes("no review file recorded") &&
			!out.includes("PLANTED"),
		JSON.stringify({ status: t.status, stderr: t.stderr, out }),
	);
}

// ======================================================================== RT4 (R-1563)
{
	const home = makeHome("rt4-home");
	const repo = makeRepo("rt4-repo");
	commit(repo, "r0", "c0");
	const repoKey = repoKeyOf(repo);
	const base = { v: 2, kind: "round", repo: repoKey, item: "rt4" };
	appendTally(home, { ...base, revision: "1".repeat(40), role: "role-drift", model: "model-drift", verdict: "LAND", durationMs: 1000, unverified: true, completedAs: "9".repeat(40) });
	appendTally(home, { ...base, revision: "2".repeat(40), role: "role-overcap", model: "model-overcap", verdict: "LAND", durationMs: 1000, overCap: "ran over cap\nbecause of urgency" });
	appendTally(home, { ...base, revision: "3".repeat(40), role: "role-noverdict", model: "model-noverdict", verdict: null, durationMs: 1000 });
	appendTally(home, { v: 1, kind: "round", repo: repoKey, item: "rt4", revision: "4".repeat(40), role: "role-legacy", verdict: "LAND" });

	const t = runTimeline(home, ["--item", "rt4", "--repo", repo]);
	const out = t.stdout;
	const driftLine = /^- role: role-drift.*$/m.exec(out)?.[0] ?? "";
	const overcapLine = /^- role: role-overcap.*$/m.exec(out)?.[0] ?? "";
	const noverdictLine = /^- role: role-noverdict.*$/m.exec(out)?.[0] ?? "";
	const legacyLine = /^- role: role-legacy.*$/m.exec(out)?.[0] ?? "";
	// req: R-1563
	check(
		"RT4: unverified, over-cap, no-verdict and older ledger lines carry their marks",
		t.status === 0 &&
			/duration: \d+m \d{2}s \([^)]*\bunverified\b[^)]*\)/.test(driftLine) &&
			/duration: \d+m \d{2}s \(over cap: ran over cap because of urgency\)/.test(overcapLine) &&
			/verdict: no verdict/.test(noverdictLine) &&
			/model: -/.test(legacyLine) &&
			/duration: -/.test(legacyLine),
		JSON.stringify({ status: t.status, stderr: t.stderr, out, driftLine, overcapLine, noverdictLine, legacyLine }),
	);
}

// ======================================================================== RT5 (R-1564)
{
	const home = makeHome("rt5-home");
	const repo = makeRepo("rt5-repo");
	commit(repo, "r0", "c0");
	const outs = path.join(root, "rt5-outs");
	const r = recordReview({ home, repoDir: repo, item: "rt5", role: "opus", model: "model-rt5", outFile: path.join(outs, "opus-r1.md"), text: `VERDICT: ${WORD_SEND_BACK}\n` });
	check("RT5 setup: review recorded", r.status === 0, r.stderr);

	const t = runTimeline(home, ["--item", "rt5", "--repo", repo]);
	const out = t.stdout;
	const rootName = path.basename(root);
	// req: R-1564
	check(
		"RT5: the timeline prints no absolute path and names each review file by its file name",
		t.status === 0 && !out.includes(rootName) && !out.includes(home) && !out.includes(outs) && out.includes("opus-r1.md"),
		JSON.stringify({ status: t.status, stderr: t.stderr, out, rootName, home, outs }),
	);
}

// ======================================================================== RT6 (R-1565)
{
	const home = makeHome("rt6-home");
	const repo = makeRepo("rt6-repo");
	commit(repo, "r0", "c0");
	const outs = path.join(root, "rt6-outs");
	const r1 = recordReview({ home, repoDir: repo, item: "rt6", role: "opus", model: "model-rt6", outFile: path.join(outs, "opus-r1.md"), text: `VERDICT: ${WORD_SEND_BACK}\n\n## ${WORD_MUST}\n- Fix the thing.\n` });
	commit(repo, "r1", "c1");
	const r2 = recordReview({ home, repoDir: repo, item: "rt6", role: "opus", model: "model-rt6-2", outFile: path.join(outs, "opus-r2.md"), text: "VERDICT: LAND\n" });
	check("RT6 setup: reviews recorded", r1.status === 0 && r2.status === 0, r1.stderr + r2.stderr);

	const ledgerDir = path.join(home, ".pi", "agent");
	const before = { ledger: snapshotDir(ledgerDir), outs: snapshotDir(outs) };
	const t = runTimeline(home, ["--item", "rt6", "--repo", repo]);
	const after = { ledger: snapshotDir(ledgerDir), outs: snapshotDir(outs) };
	// req: R-1565
	check(
		"RT6: the timeline leaves the ledger folder and the review folders byte-for-byte unchanged",
		t.status === 0 &&
			JSON.stringify(before.ledger) === JSON.stringify(after.ledger) &&
			JSON.stringify(before.outs) === JSON.stringify(after.outs) &&
			before.ledger.length > 0 && before.outs.length > 0,
		JSON.stringify({ status: t.status, stderr: t.stderr, before, after }),
	);
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
