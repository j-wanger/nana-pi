// Schedule, fingerprint and resume. Three ways a study silently corrupts itself:
// a fixed order that hands one profile the cold-cache slot, a results file that mixes two
// experiments, and a torn append that eats the next record. All three are pinned here.
// Run: node apps/bench/test/plan.test.mjs   (exit 0 = all PASS)
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertFingerprint, buildSchedule, filterPlan, loadOrCreateSchedule, profilesFor, readResults, rng, shuffle, studyFingerprint, tupleKey } from "../lib/plan.mjs";
import { loadStudy } from "../run.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

const study = {
	id: "t",
	seed: 7,
	repeats: 3,
	fixture: { sha256: "fx" },
	profiles: [
		{ name: "A", tools: ["read"], families: ["code"] },
		{ name: "B", tools: ["read"], families: ["code", "research"] },
		{ name: "C", tools: ["read"], families: ["code", "research"] },
	],
};
const tasks = [
	{ id: "t1", family: "code" },
	{ id: "t2", family: "code" },
	{ id: "r1", family: "research" },
];

// ── seeded randomness ────────────────────────────────────────────────────────────────────────
const a = [...Array(12).keys()];
check("rng is deterministic for a seed", JSON.stringify(shuffle(a, rng(5))) === JSON.stringify(shuffle(a, rng(5))));
check("a different seed gives a different order", JSON.stringify(shuffle(a, rng(5))) !== JSON.stringify(shuffle(a, rng(6))));
check("shuffle is a permutation", JSON.stringify([...shuffle(a, rng(9))].sort((x, y) => x - y)) === JSON.stringify(a));
check("shuffle does not mutate its input", (() => { const src = [1, 2, 3, 4, 5]; shuffle(src, rng(3)); return JSON.stringify(src) === "[1,2,3,4,5]"; })());

// ── schedule ─────────────────────────────────────────────────────────────────────────────────
const sched = buildSchedule(study, tasks, { reps: 3, seed: 7 });
check("run count = sum over tasks of (eligible profiles) x reps", sched.runs.length === (3 + 3 + 2) * 3, String(sched.runs.length));
check("a code-only profile never gets a research task", !sched.runs.some((r) => r.profile === "A" && r.task === "r1"));
check("every tuple is unique", new Set(sched.runs.map(tupleKey)).size === sched.runs.length);
check("same seed → identical schedule", JSON.stringify(buildSchedule(study, tasks, { reps: 3, seed: 7 }).runs) === JSON.stringify(sched.runs));
check("different seed → different schedule", JSON.stringify(buildSchedule(study, tasks, { reps: 3, seed: 8 }).runs) !== JSON.stringify(sched.runs));

// A comparison block keeps a task's arms adjacent — that is what lets ONE snapshotted oracle key
// grade both arms, and keeps cache state between arms comparable.
const blocks = [];
for (const r of sched.runs) { if (!blocks.length || blocks.at(-1).block !== r.block) blocks.push({ block: r.block, runs: [r] }); else blocks.at(-1).runs.push(r); }
check("each block is contiguous and appears once", new Set(blocks.map((b) => b.block)).size === blocks.length, `${blocks.length} blocks`);
check("a block holds exactly the eligible profiles for its task", blocks.every((b) => b.runs.length === profilesFor(study, tasks.find((t) => t.id === b.runs[0].task)).length));

// Randomization: the first arm inside a block must not always be the same profile.
const firstArms = blocks.filter((b) => b.runs[0].task === "t1").map((b) => b.runs[0].profile);
check("the first-position profile varies across reps (not a fixed rotation)", new Set(firstArms).size > 1, firstArms.join(","));
const blockOrders = [0, 1, 2].map((rep) => sched.runs.filter((r) => r.rep === rep).map((r) => r.task).filter((t, i, arr) => t !== arr[i - 1]).join(","));
check("block order is randomized per rep", new Set(blockOrders).size > 1, blockOrders.join(" | "));

check("--task filter", filterPlan(sched.runs, { task: "t1" }).every((r) => r.task === "t1"));
check("--profile filter", filterPlan(sched.runs, { profile: "B" }).every((r) => r.profile === "B"));
check("--rep filter", filterPlan(sched.runs, { rep: 2 }).every((r) => r.rep === 2));

// ── fingerprint ──────────────────────────────────────────────────────────────────────────────
const fpArgs = { studyDir: "/x", study, tasks, piVersion: "0.84.4", extraSha: { "ext:c": "abc" } };
const fp0 = (await studyFingerprint(fpArgs)).fingerprint;
check("fingerprint is stable for identical inputs", (await studyFingerprint(fpArgs)).fingerprint === fp0);
check("a changed prompt changes it", (await studyFingerprint({ ...fpArgs, tasks: [{ ...tasks[0], prompt: "new" }, tasks[1], tasks[2]] })).fingerprint !== fp0);
check("a changed pi version changes it", (await studyFingerprint({ ...fpArgs, piVersion: "0.85.0" })).fingerprint !== fp0);
check("a changed extension hash changes it", (await studyFingerprint({ ...fpArgs, extraSha: { "ext:c": "def" } })).fingerprint !== fp0);
check("a changed fixture pin changes it", (await studyFingerprint({ ...fpArgs, study: { ...study, fixture: { sha256: "other" } } })).fingerprint !== fp0);
check("a machine-local agentDir path does NOT change it", (await studyFingerprint({ ...fpArgs, study: { ...study, agentDir: { dir: "/somewhere/else" } } })).fingerprint === fp0);
check("assertFingerprint accepts a matching file", (() => { try { assertFingerprint(new Set([fp0]), fp0); return true; } catch { return false; } })());
check("assertFingerprint REFUSES mixed experiments", (() => { try { assertFingerprint(new Set([fp0, "deadbeef"]), fp0); return false; } catch (e) { return /different experiment/.test(e.message); } })());
check("assertFingerprint accepts an empty (fresh) file", (() => { try { assertFingerprint(new Set(), fp0); return true; } catch { return false; } })());

// ── resume + torn tail ───────────────────────────────────────────────────────────────────────
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "bench-plan-"));
const results = path.join(dir, "results.jsonl");
try {
	const done = [
		{ task: "t1", profile: "A", rep: 0, state: "ok", fingerprint: fp0 },
		{ task: "t1", profile: "B", rep: 0, state: "fail", fingerprint: fp0 },
		{ task: "r1", profile: "C", rep: 2, state: "grader-error", fingerprint: fp0 },
	];
	await fs.writeFile(results, `${done.map((d) => JSON.stringify(d)).join("\n")}\n`);
	let r = await readResults(results);
	check("completed tuples recognised", r.done.size === 3 && r.done.has("t1|A|0") && r.done.has("r1|C|2"));
	check("fingerprints collected", r.fingerprints.size === 1 && r.fingerprints.has(fp0));
	let todo = sched.runs.filter((x) => !r.done.has(tupleKey(x)));
	check("resume skips exactly the completed tuples", todo.length === sched.runs.length - 3, String(todo.length));
	check("a FAILED run counts as completed — the harness never retries it", !todo.some((x) => tupleKey(x) === "t1|B|0"));
	check("a GRADER-ERROR run is also not silently re-run", !todo.some((x) => tupleKey(x) === "r1|C|2"));

	// A torn tail: half a JSON object with no newline. It must be quarantined AND the file
	// restored to a newline boundary, or the next append destroys two records instead of one.
	await fs.appendFile(results, '{"task":"t2","profile":"A","rep');
	r = await readResults(results);
	check("torn tail is detected and quarantined", r.quarantined === 1);
	check("…its tuple is not treated as done", !r.done.has("t2|A|0"));
	check("…the quarantine file records the bytes verbatim", (await fs.readFile(`${results}.quarantine`, "utf8")).includes("torn-tail") && (await fs.readFile(`${results}.quarantine`, "utf8")).includes("t2"));
	const body = await fs.readFile(results, "utf8");
	check("…the file now ends on a newline boundary", body.endsWith("\n") && !body.includes('"rep\n'));
	await fs.appendFile(results, `${JSON.stringify({ task: "t2", profile: "A", rep: 0, state: "ok", fingerprint: fp0 })}\n`);
	r = await readResults(results);
	check("…and the NEXT append is readable (the torn record did not eat it)", r.done.has("t2|A|0") && r.records.length === 4);

	// A complete object that merely lost its newline is data, not damage.
	await fs.writeFile(results, `${JSON.stringify({ task: "t9", profile: "A", rep: 0, state: "ok" })}`);
	r = await readResults(results);
	check("a complete last line without a trailing newline is KEPT", r.done.has("t9|A|0") && r.quarantined === 0);
	check("…and the newline is restored", (await fs.readFile(results, "utf8")).endsWith("\n"));

	check("missing results file resumes from scratch", (await readResults(path.join(dir, "nope.jsonl"))).done.size === 0);

	// schedule.json is written once and refuses to serve a different experiment
	const s1 = await loadOrCreateSchedule(dir, study, tasks, fp0, { reps: 3, seed: 7 });
	const s2 = await loadOrCreateSchedule(dir, study, tasks, fp0, { reps: 3, seed: 7 });
	check("schedule is persisted and reused verbatim", JSON.stringify(s1.runs) === JSON.stringify(s2.runs));
	let threw = null;
	try { await loadOrCreateSchedule(dir, study, tasks, "otherfingerprint", { reps: 3, seed: 7 }); } catch (e) { threw = e.message; }
	check("a schedule from another fingerprint is REFUSED", /was built for fingerprint/.test(threw ?? ""), threw ?? "no throw");

	// the shipped study
	const shipped = await loadStudy(path.join(path.dirname(fileURLToPath(import.meta.url)), "../studies/tool-profiles-2026-09-08"));
	const shippedPlan = buildSchedule(shipped.study, shipped.tasks, { reps: shipped.study.repeats, seed: shipped.study.seed });
	check("shipped study loads", shipped.tasks.length === 14, `${shipped.tasks.length} tasks`);
	check("shipped study run count", shippedPlan.runs.length === 132, `${shippedPlan.runs.length} runs at N=${shipped.study.repeats}`);
	check("shipped study: profile C runs the code family too", shippedPlan.runs.some((x) => x.profile === "research" && x.task.startsWith("code-")));
	check("shipped study tuples are unique", new Set(shippedPlan.runs.map(tupleKey)).size === shippedPlan.runs.length);
} finally {
	await fs.rm(dir, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
