// Deterministic checkers. NO LLM judge anywhere: every verdict is a regex, a string compare, a
// JSON walk, a filesystem predicate, or a child-process exit code.
//
// Every checker returns { pass, detail, graderError? } and never throws.
// `graderError: true` means THE ORACLE failed, not the model — an npm outage must not be
// recorded as a wrong answer. The runner turns that into its own record state.

import { spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lineDiff } from "./fixture.mjs";

const EVALUATOR = path.join(path.dirname(fileURLToPath(import.meta.url)), "eval-module.mjs");

const ok = (pass, detail) => ({ pass, detail });
const graderError = (detail) => ({ pass: false, graderError: true, detail });
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const sha256File = (p) => createHash("sha256").update(fs.readFileSync(p)).digest("hex");

/** Strip line and block comments so "the test mentions clampText" cannot be satisfied by a comment. */
export const stripComments = (src) => String(src ?? "").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

/** Pull the first JSON object/array out of a reply, tolerating ``` fences and prose. */
export function extractJson(text) {
	const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(String(text ?? ""));
	const candidates = fenced ? [fenced[1], text] : [text];
	for (const c of candidates) {
		const s = String(c ?? "");
		const start = Math.min(...[s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0).concat([Infinity]));
		if (!Number.isFinite(start)) continue;
		// Shrink from the right until it parses — tolerates trailing prose after the JSON.
		for (let end = s.length; end > start; end--) { try { return JSON.parse(s.slice(start, end)); } catch { /* keep shrinking */ } }
	}
	return undefined;
}

// "$" (or an empty path) addresses the whole parsed value, so a reply that must be an exact
// JSON array can be compared as one — which also rules out passing by over-listing.
const walk = (obj, dotted) => (!dotted || dotted === "$" ? obj : String(dotted).split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj));

function runArgv(argv, { cwd, timeoutMs = 120000, env } = {}) {
	// shell:false always — argv goes to the OS verbatim on darwin and win32 alike, so there are
	// no quoting rules to get wrong and no bash-only constructs. The cost: `.cmd`/`.bat` shims
	// (npm, npx) are NOT invocable; use `node` (a real executable) instead.
	const r = spawnSync(argv[0], argv.slice(1), { cwd, timeout: timeoutMs, encoding: "utf8", windowsHide: true, ...(env ? { env } : {}) });
	const errMsg = r.error ? String(r.error.message) : null;
	// INFRASTRUCTURE failure vs a program that ran and failed. A grader that could not be
	// spawned, or was killed by a signal or a timeout, says NOTHING about the model — recording
	// it as a wrong answer invents a result.
	const timedOut = Boolean(r.error && /ETIMEDOUT|timed? *out/i.test(errMsg ?? "")) || (r.signal != null && r.status == null && Boolean(r.error));
	const infra = Boolean(r.error) || r.status == null;
	return { status: r.status, signal: r.signal ?? null, stdout: r.stdout ?? "", stderr: r.stderr ?? "", error: errMsg, timedOut, infra, ran: !infra };
}

const infraDetail = (argv, r) => `could not run ${argv.join(" ")}: ${r.timedOut ? "timed out" : (r.error ?? `killed by ${r.signal}`)}`;
const countMatches = (text, re) => String(text ?? "").split("\n").filter((l) => re.test(l)).length;

/** Hash every file under a directory. Used for allowed-changed-paths. */
export function hashTree(dir, base = dir, out = new Map()) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (ent.name === ".git" || ent.name === "node_modules") continue;
		const abs = path.join(dir, ent.name);
		const rel = path.relative(base, abs).split(path.sep).join("/");
		if (ent.isDirectory()) hashTree(abs, base, out);
		else if (ent.isFile()) out.set(rel, sha256File(abs));
	}
	return out;
}

/** Minimal glob: `*` within a segment, `**` across segments. No dependency, no surprises. */
export function globMatch(pattern, p) {
	const rx = new RegExp(
		`^${String(pattern)
			.split("**")
			.map((seg) => seg.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]"))
			.join(".*")}$`,
	);
	return rx.test(p);
}

/**
 * Run a live oracle command and validate its transport before trusting the answer.
 * A key of "" or an HTTP/schema failure is a GRADER error — never a wrong answer by the model.
 */
export function fetchKey(c, ctx) {
	const r = runArgv(c.argv ?? [], { cwd: ctx.dir ?? process.cwd(), timeoutMs: c.timeoutMs ?? 60000 });
	if (r.status !== 0) return { error: `oracle command exited ${r.status}: ${(r.stderr || r.error || "").slice(0, 200)}` };
	const key = r.stdout.trim();
	if (!key) return { error: "oracle command printed nothing" };
	if (c.reject && new RegExp(c.reject).test(key)) return { error: `oracle returned the sentinel ${JSON.stringify(key)} — the pinned source changed` };
	if (c.schema && !new RegExp(c.schema).test(key)) return { error: `oracle output ${JSON.stringify(key.slice(0, 80))} does not match the expected shape /${c.schema}/` };
	return { key };
}

/**
 * THE VERDICT-SELECTION POLICY, as one testable function.
 *
 * A verdict is a line `<json>\t<hex hmac>`; the HMAC must verify under the nonce this run invented.
 * EXACTLY ONE such line is accepted. Unsigned and malformed lines are ignored (the module is free to
 * write whatever it likes to fd 3), but TWO valid lines cannot both be the evaluator's single
 * signed verdict — that means the nonce leaked, and picking one of them would be choosing which
 * story to believe. Fail closed instead.
 */
export function selectSignedVerdict(fd3Text, nonce) {
	const signed = [];
	for (const line of String(fd3Text ?? "").split("\n")) {
		const tab = line.lastIndexOf("\t");
		if (tab < 0) continue;
		const json = line.slice(0, tab);
		const sig = line.slice(tab + 1).trim();
		const want = createHmac("sha256", nonce).update(json).digest("hex");
		if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) continue;
		signed.push(json);
	}
	if (signed.length > 1) return { ambiguous: signed.length };
	if (!signed.length) return { verdict: null };
	try {
		return { verdict: JSON.parse(signed[0]) };
	} catch (e) {
		// Our evaluator's hand-rolled serialiser cannot emit this; if it ever does, that is a grader
		// fault and must not be scored as the model's.
		return { malformed: `a signed verdict did not parse as JSON (${e.message})` };
	}
}

/**
 * Grade BEHAVIOUR in a separate process, with a nonce the module cannot reach.
 *
 * The parent invents a random nonce, hands it plus the probe spec to lib/eval-module.mjs over file
 * descriptor 4 (never argv, never the environment), and accepts only a verdict line whose
 * HMAC-SHA256 verifies under that nonce. Exit status and stdout are ignored entirely, because both
 * belong to the code being graded. See lib/eval-module.mjs for the threat model.
 *
 * TWO properties this function owns, both of which were missing (astra round 5, A1/A2):
 *  1. the spec file is UNLINKED before the child is spawned. `spawnSync` cannot feed an anonymous
 *     pipe on a non-stdin descriptor, so fd 4 has to be backed by a file — but a 0600 file in
 *     os.tmpdir() is readable by the very process being graded, which runs as the same user. It
 *     could glob `bench-eval-*​/spec.json`, read the nonce and sign anything. Unlinking keeps the
 *     bytes reachable through OUR open descriptor and removes them from every pathname.
 *  2. EXACTLY ONE signed line is a verdict. Taking the first HMAC-valid line made "more than one
 *     valid verdict" a silent selection rather than the contradiction it is; two valid lines now
 *     mean the signing key leaked, which is a grader error, never a pass.
 */
function evaluateModule({ cwd, module: modulePath, probes, timeoutMs }) {
	const nonce = randomBytes(32).toString("hex");
	const specDir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-eval-"));
	const specFile = path.join(specDir, "spec.json");
	let fd = null;
	try {
		fs.writeFileSync(specFile, JSON.stringify({ nonce, module: pathToFileURL(path.resolve(cwd, modulePath)).href, probes }), { mode: 0o600 });
		fd = fs.openSync(specFile, "r");
		// UNLINK BEFORE SPAWNING. The descriptor keeps the contents readable for the evaluator; the
		// path no longer exists, so the untrusted module cannot read the nonce off the filesystem.
		fs.unlinkSync(specFile);
		const r = spawnSync(process.execPath, [EVALUATOR], { cwd, timeout: timeoutMs ?? 120000, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe", "pipe", fd] });
		const errMsg = r.error ? String(r.error.message) : null;
		if (r.error || r.signal) return { infra: `the trusted evaluator could not run: ${errMsg ?? `killed by ${r.signal}`}` };
		// Blank tail lines carry nothing but noise into the record's detail.
		const stderr = String(r.stderr ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(-4).join(" | ").slice(0, 300);
		return { ...selectSignedVerdict(String(r.output?.[3] ?? ""), nonce), stderr };
	} finally {
		if (fd !== null) {
			try {
				fs.closeSync(fd);
			} catch {
				/* already closed */
			}
		}
		fs.rmSync(specDir, { recursive: true, force: true });
	}
}

/**
 * THE VERDICT-ACCEPTANCE POLICY, as one testable function: what a signed verdict has to say before
 * it counts, and which failures belong to the GRADER rather than to the model.
 *
 *  * no signed verdict → an ordinary FAILURE (the module did not let the evaluator finish);
 *  * a module that does not import → an ordinary FAILURE (that is the model's code);
 *  * anything else the evaluator could not do — an unfinished evaluation, a verdict of the wrong
 *    shape, a probe count that does not match the spec, an invalid probe spec, two valid
 *    signatures — is a GRADER error: it says nothing about the behaviour that was asked for.
 */
export function judgeVerdict(res, probes = []) {
	if (res.infra) return graderError(res.infra);
	if (res.ambiguous) return graderError(`${res.ambiguous} HMAC-valid verdict lines arrived; exactly one is the contract, so the signing nonce leaked — ambiguous verdict`);
	if (res.malformed) return graderError(res.malformed);
	if (!res.verdict) return ok(false, `no signed verdict from the trusted evaluator — the module did not let it finish${res.stderr?.trim() ? `: ${res.stderr.trim()}` : ""}`);
	const v = res.verdict;
	// SHAPE first: a verdict that is not the object we sign is not a verdict.
	if (typeof v !== "object" || v === null || Array.isArray(v)) return graderError("the signed verdict is not an object");
	if (v.importError) return ok(false, `the module does not import: ${v.importError}`);
	if (!probes.length) return graderError("the evaluator ran no probes");
	if (v.specError) return graderError(`the probe spec is wrong, not the module: ${v.specError}`);
	if (!Array.isArray(v.probes)) return graderError("the signed verdict carries no probe array");
	// An UNFINISHED evaluation is a grader error, never a model failure: a top-level await that never
	// settles makes Node exit 13 BEFORE any timeout, and a module that exits during import produces
	// the same partial verdict. Neither is evidence about the behaviour asked for. The parent's spawn
	// timeout remains the watchdog for a module that never exits at all.
	//
	// EXCEPT when the partial verdict already contains a FAILING probe. Then wrong behaviour was
	// observed and signed before the evaluation died, and calling that a harness fault would let a
	// module trade a failure for an exclusion by killing the process after its first bad answer.
	if (v.complete !== true) {
		const observed = v.probes.filter((p) => p?.pass !== true);
		if (observed.length) {
			return ok(false, `${observed.length} behaviour probe(s) had already failed when the evaluation died: ${observed.slice(0, 3).map((p) => `${p?.name} — ${p?.detail}`).join("; ")}`);
		}
		return graderError(`the trusted evaluator did not finish — an incomplete evaluation (${v.probes.length}/${probes.length} probes reported, none failing) is not a verdict${res.stderr?.trim() ? `: ${res.stderr.trim()}` : ""}`);
	}
	if (v.probes.length !== probes.length) return graderError(`the evaluator reported ${v.probes.length} probe result(s) for ${probes.length} declared probe(s)`);
	const failed = v.probes.filter((p) => !p?.pass);
	if (failed.length) return ok(false, `${failed.length}/${v.probes.length} behaviour probe(s) failed: ${failed.slice(0, 3).map((p) => `${p?.name} — ${p?.detail}`).join("; ")}`);
	return ok(true, `${v.probes.length}/${v.probes.length} behaviour probes passed under the trusted evaluator (signed verdict)`);
}

const CHECKERS = {
	// { type: "regex", pattern, flags? } — matched against the model's final text.
	regex(c, ctx) {
		let re;
		try {
			re = new RegExp(c.pattern, c.flags ?? "");
		} catch (e) {
			return graderError(`bad pattern: ${e.message}`);
		}
		const hit = re.test(ctx.finalText);
		return ok(hit, hit ? "matched" : `no match for /${c.pattern}/${c.flags ?? ""}`);
	},

	// { type: "exact", value, caseSensitive?, mode?: "whole"|"contains" } — DEFAULT is "whole".
	// Contains-matching a number accepts "1304" for a key of "304", so it is opt-in only.
	exact(c, ctx) {
		const cs = c.caseSensitive === true;
		const got = cs ? norm(ctx.finalText) : norm(ctx.finalText).toLowerCase();
		const want = cs ? norm(c.value) : norm(c.value).toLowerCase();
		const mode = c.mode ?? "whole";
		const stripped = got.replace(/[.\s]+$/, "");
		const pass = mode === "contains" ? got.includes(want) : stripped === want.replace(/[.\s]+$/, "");
		return ok(pass, pass ? "matched" : `expected ${JSON.stringify(c.value)} (${mode}), got ${JSON.stringify(got.slice(0, 120))}`);
	},

	// { type: "json-path", path, value, unordered? }
	"json-path"(c, ctx) {
		const parsed = extractJson(ctx.finalText);
		if (parsed === undefined) return ok(false, "reply is not parseable JSON");
		const norm2 = (v) => (c.unordered && Array.isArray(v) ? [...v].map(String).sort() : v);
		const got = walk(parsed, c.path);
		const pass = JSON.stringify(norm2(got)) === JSON.stringify(norm2(c.value));
		return ok(pass, pass ? "matched" : `${c.path} = ${JSON.stringify(got)}, want ${JSON.stringify(c.value)}`);
	},

	// { type: "command", commands: [[argv...]], cwd?, timeoutMs? } — ALL must exit 0.
	command(c, ctx) {
		const cwd = c.cwd ? path.resolve(ctx.dir, c.cwd) : ctx.dir;
		if (!cwd) return graderError("command checker needs a fixture dir");
		for (const argv of c.commands ?? []) {
			const r = runArgv(argv, { cwd, timeoutMs: c.timeoutMs });
			if (r.infra) return graderError(infraDetail(argv, r));
			if (r.status !== 0) {
				const tail = (r.stderr || r.stdout || "").split("\n").slice(-6).join(" | ").slice(0, 400);
				return ok(false, `exit ${r.status} from ${argv.join(" ")}: ${tail}`);
			}
		}
		return ok(true, `${(c.commands ?? []).length} command(s) exited 0`);
	},

	/**
	 * { type: "suite", argv, passLines, forbid?, cwd?, timeoutMs? }
	 * Exit status alone NEVER proves a test suite ran. A `process.exit(0)` anywhere in the
	 * imported source — including in a file the task ALLOWS the model to edit — makes a suite
	 * exit 0 having asserted nothing. So the suite must also emit its expected number of `PASS`
	 * lines and none of `forbid`. That is externally observed completion, not a claim.
	 */
	suite(c, ctx) {
		const cwd = c.cwd ? path.resolve(ctx.dir, c.cwd) : ctx.dir;
		if (!cwd) return graderError("suite checker needs a fixture dir");
		const r = runArgv(c.argv ?? [], { cwd, timeoutMs: c.timeoutMs });
		if (r.infra) return graderError(infraDetail(c.argv ?? [], r));
		const out = `${r.stdout}\n${r.stderr}`;
		const passes = countMatches(out, /^PASS\b/);
		const forbidden = c.forbid ? countMatches(out, new RegExp(c.forbid)) : 0;
		if (r.status !== 0) return ok(false, `exit ${r.status} from ${(c.argv ?? []).join(" ")} (${passes} PASS lines): ${out.split("\n").filter((l) => /^FAIL\b/.test(l)).slice(0, 3).join(" | ").slice(0, 300)}`);
		if (forbidden) return ok(false, `${forbidden} line(s) matched the forbidden pattern /${c.forbid}/`);
		if (c.passLines !== undefined && passes !== c.passLines) {
			return ok(false, `the suite exited 0 but printed ${passes} PASS lines, expected ${c.passLines} — it did not run to completion (an early exit in the source will do this)`);
		}
		return ok(true, `suite completed: ${passes} PASS lines, exit 0`);
	},

	// { type: "file", path, exists?, contains?, containsCode?, notContains?, sha256? }
	file(c, ctx) {
		if (!ctx.dir) return graderError("file checker needs a fixture dir");
		const p = path.resolve(ctx.dir, c.path);
		if (!p.startsWith(path.resolve(ctx.dir))) return graderError("path escapes the fixture copy");
		const exists = fs.existsSync(p);
		if (c.exists === false) return ok(!exists, exists ? "file exists but should not" : "absent as expected");
		if (!exists) return ok(false, `missing ${c.path}`);
		const wants = ["contains", "containsCode", "notContains", "sha256"].some((k) => c[k] !== undefined);
		if (!wants) return ok(true, "exists");
		const body = fs.readFileSync(p, "utf8");
		if (c.contains !== undefined && !body.includes(c.contains)) return ok(false, `${c.path} lacks ${JSON.stringify(c.contains)}`);
		// containsCode ignores comments, so a commented-out mention does not count as a test.
		if (c.containsCode !== undefined && !stripComments(body).includes(c.containsCode)) return ok(false, `${c.path} never calls ${JSON.stringify(c.containsCode)} outside comments`);
		if (c.notContains !== undefined && body.includes(c.notContains)) return ok(false, `${c.path} still contains ${JSON.stringify(c.notContains)}`);
		if (c.sha256 !== undefined && sha256File(p) !== c.sha256) return ok(false, `${c.path} was modified (sha256 mismatch)`);
		return ok(true, "file predicate held");
	},

	/**
	 * { type: "eval-module", module, probes: [...], timeoutMs? }
	 *
	 * The authoritative correctness verdict for an edit task. Each probe calls a named export with
	 * given arguments and compares the returned primitive (`equals`), or requires a thrown error
	 * class (`throws`), or checks a byte length / substring — all inside a trusted process, with no
	 * dependence on anything the module prints or on the status it exits with.
	 */
	"eval-module"(c, ctx) {
		if (!ctx.dir) return graderError("eval-module needs a fixture dir");
		const probes = c.probes ?? [];
		return judgeVerdict(evaluateModule({ cwd: ctx.dir, module: c.module, probes, timeoutMs: c.timeoutMs }), probes);
	},

	/**
	 * { type: "changed-paths", allow: [glob], protect: [glob], withinLines: {path:[from,to]} }
	 *
	 * `denyAdded` (a token denylist on added lines) was REMOVED: a reviewer forged a passing verdict
	 * from entirely inside the allowed lines using `process['exit']` and `stdout['write']`, which no
	 * literal denylist catches. It bought nothing and implied protection it did not provide.
	 * Correctness now comes from `eval-module`, which grades behaviour instead of source text.
	 * Diffs the workspace against the snapshot the harness took after mutations and before the
	 * model ran. Anything changed/added/removed outside `allow` fails; anything matching
	 * `protect` must be byte-identical. This is what stops "make the suite pass" from being
	 * solved by editing the suite, the runner, or an unrelated module.
	 */
	"changed-paths"(c, ctx) {
		if (!ctx.baseline) return graderError("changed-paths needs a pre-run baseline snapshot");
		const now = hashTree(ctx.dir);
		const bench = new Set(ctx.benchPaths ?? []);
		const changed = [];
		for (const [p, sha] of now) if (!bench.has(p) && ctx.baseline.get(p) !== sha) changed.push(ctx.baseline.has(p) ? `modified ${p}` : `added ${p}`);
		for (const p of ctx.baseline.keys()) if (!now.has(p)) changed.push(`deleted ${p}`);
		const allow = c.allow ?? [];
		const offending = changed.filter((entry) => {
			const p = entry.split(" ").slice(1).join(" ");
			return !allow.some((g) => globMatch(g, p));
		});
		if (offending.length) return ok(false, `changed outside the allowed paths: ${offending.slice(0, 6).join(", ")}`);
		for (const g of c.protect ?? []) {
			for (const [p, sha] of ctx.baseline) if (globMatch(g, p) && now.get(p) !== sha) return ok(false, `protected file changed: ${p}`);
		}

		// DIFF SHAPE. An allowlisted file is still only allowed to change WHERE the task says the
		// work is. This bounds where a change can hide; it does not pretend to police what it does.
		const ranges = c.withinLines ?? {};
		if (Object.keys(ranges).length) {
			if (!ctx.preRun) return graderError("withinLines needs the pre-run file contents");
			for (const [rel, before] of ctx.preRun) {
				const abs = path.resolve(ctx.dir, rel);
				if (!fs.existsSync(abs)) continue;
				const after = fs.readFileSync(abs, "utf8");
				if (after === before) continue;
				const d = lineDiff(before, after);
				const range = ranges[rel];
				if (range) {
					// Insertions shift later lines, so the window is allowed to grow by however
					// many lines were added inside it.
					const [from, to] = range;
					const slack = d.added.length;
					const outside = [
						...d.added.filter((a) => a.line < from || a.line > to + slack).map((a) => `added line ${a.line}`),
						...d.removed.filter((x) => x.line < from || x.line > to).map((x) => `removed line ${x.line}`),
					];
					if (outside.length) return ok(false, `${rel}: change outside the declared range ${from}-${to}: ${outside.slice(0, 4).join(", ")}`);
				}
			}
		}
		return ok(true, changed.length ? `only allowed paths changed (${changed.length}), inside the declared shape` : "workspace unchanged");
	},

	/**
	 * { type: "revert-and-fail", restore: [path], commands: [[argv]] }
	 * Copies the workspace, restores `restore` from the PINNED fixture (i.e. undoes the model's
	 * fix), and requires the commands to FAIL there. Without this, "add a test" is satisfied by
	 * a test that asserts nothing.
	 */
	"revert-and-fail"(c, ctx) {
		if (!ctx.fixtureDir) return graderError("revert-and-fail needs the pinned fixture dir");
		let tmp;
		try {
			tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bench-revert-"));
			fs.cpSync(ctx.dir, tmp, { recursive: true, force: true });
			for (const rel of c.restore ?? []) {
				const src = path.resolve(ctx.fixtureDir, rel);
				if (!fs.existsSync(src)) return graderError(`revert-and-fail: ${rel} is not in the fixture`);
				fs.copyFileSync(src, path.resolve(tmp, rel));
			}
			for (const argv of c.commands ?? []) {
				const r = runArgv(argv, { cwd: tmp, timeoutMs: c.timeoutMs });
				// The test must RUN and end badly. A spawn failure, a signal or a timeout is the
				// harness failing, not detection. But ANY ordinary failure mode counts — a bare
				// `node:assert` throw, a nonzero exit, a rejected promise — because the prompt asks
				// for a test, not for a particular reporting convention. (astra: requiring a `FAIL`
				// line or a trusted nonzero exit rejected perfectly good assert.throws tests.)
				if (r.infra) return graderError(`revert-and-fail could not determine anything: ${infraDetail(argv, r)}`);
				if (r.status === 0) return ok(false, `${argv.join(" ")} still exits 0 with ${(c.restore ?? []).join(", ")} reverted — the added test does not detect the missing behaviour`);
				const out = `${r.stdout}\n${r.stderr}`;
				if (c.expectFail && !new RegExp(c.expectFail).test(out)) {
					return ok(false, `exited ${r.status} with ${(c.restore ?? []).join(", ")} reverted, but its output does not match /${c.expectFail}/ — that is not an observed assertion failure`);
				}
				// `requireOutput` is opt-in and NOT used by the shipped study: a minimal but
				// perfectly good test may exit(1) silently, and failing it for that would grade
				// a style the prompt never asked for. The evidence that the test really detects
				// the behaviour is the PAIR — it exits 0 in the un-reverted workspace (a separate
				// `command` check) and nonzero here — plus the infra rejection above, which is
				// what stops a spawn failure or a timeout from counting as detection.
				if (c.requireOutput && !out.trim()) return ok(false, `exited ${r.status} silently with ${(c.restore ?? []).join(", ")} reverted — no output to show an assertion ran`);
			}
			return ok(true, "the added test fails against the un-fixed source, as it must");
		} finally {
			if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
		}
	},

	/**
	 * { type: "live-key", argv, expect?, schema?, reject?, mode? }
	 * The key comes from a command run at bench time, so a moving answer cannot go stale.
	 *  - `expect` pins an immutable value: the command then acts as a TRIPWIRE. If it disagrees
	 *    with `expect`, that is a grader error (the pinned source moved), never a model failure.
	 *  - `ctx.snapshotKey` (set by the runner) reuses one key for every arm of a comparison
	 *    block, so two profiles are never graded against two different fetches.
	 */
	"live-key"(c, ctx) {
		// The block's oracle already failed: every arm of that comparison is a grader error.
		// Refetching here would grade two arms against two different fetches — the exact thing
		// the per-block snapshot exists to prevent.
		if (ctx.snapshotFailed) return graderError(`oracle unavailable for this comparison block: ${ctx.snapshotFailed}`);
		let key = ctx.snapshotKey;
		if (key === undefined) {
			const got = fetchKey(c, ctx);
			if (got.error) return graderError(got.error);
			key = got.key;
		}
		if (c.expect !== undefined && norm(key) !== norm(c.expect)) {
			return graderError(`pinned value drifted: oracle says ${JSON.stringify(key)}, study pins ${JSON.stringify(c.expect)} — re-verify the source before grading anything`);
		}
		const res = CHECKERS.exact({ type: "exact", value: c.expect ?? key, mode: c.mode ?? "whole", caseSensitive: c.caseSensitive }, ctx);
		return ok(res.pass, `key=${JSON.stringify(key)} ${res.pass ? "matched" : "NOT matched"}: ${res.detail}`);
	},

	/**
	 * { type: "all", checks: [...] } — composite; every child must pass.
	 * Every child RUNS: short-circuiting on the first ordinary failure would hide a grader error
	 * in a later child and record a harness fault as a model failure. A grader error anywhere
	 * dominates.
	 */
	all(c, ctx) {
		const details = [];
		let failed = false;
		let grader = false;
		for (const child of c.checks ?? []) {
			const r = runCheck(child, ctx);
			details.push(`${child.type}:${r.graderError ? "GRADER-ERROR" : r.pass ? "ok" : "FAIL"} ${r.detail}`);
			if (r.graderError) grader = true;
			else if (!r.pass) failed = true;
		}
		const detail = details.join(" ;; ");
		if (grader) return { pass: false, graderError: true, detail };
		return ok(!failed, detail);
	},
};

export function runCheck(check, ctx) {
	const fn = CHECKERS[check?.type];
	if (!fn) return graderError(`unknown checker type ${JSON.stringify(check?.type)}`);
	try {
		return fn(check, ctx);
	} catch (e) {
		return graderError(`checker threw: ${e.message}`);
	}
}

/** The live-key check inside a task's checker tree, if it has exactly one. */
export function liveKeyOf(check) {
	if (!check) return null;
	if (check.type === "live-key") return check;
	if (check.type === "all") {
		const found = (check.checks ?? []).map(liveKeyOf).filter(Boolean);
		return found.length === 1 ? found[0] : null;
	}
	return null;
}

export const CHECKER_TYPES = Object.keys(CHECKERS);
