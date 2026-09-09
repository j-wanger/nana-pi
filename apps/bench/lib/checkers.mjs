// Deterministic checkers. NO LLM judge anywhere: every verdict is a regex, a string compare, a
// JSON walk, a filesystem predicate, or a child-process exit code.
//
// Every checker returns { pass, detail, graderError? } and never throws.
// `graderError: true` means THE ORACLE failed, not the model — an npm outage must not be
// recorded as a wrong answer. The runner turns that into its own record state.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

function runArgv(argv, { cwd, timeoutMs = 120000 } = {}) {
	// shell:false always — argv goes to the OS verbatim on darwin and win32 alike, so there are
	// no quoting rules to get wrong and no bash-only constructs. The cost: `.cmd`/`.bat` shims
	// (npm, npx) are NOT invocable; use `node` (a real executable) instead.
	const r = spawnSync(argv[0], argv.slice(1), { cwd, timeout: timeoutMs, encoding: "utf8", windowsHide: true });
	return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", error: r.error ? String(r.error.message) : null };
}

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
			if (r.status !== 0) {
				const tail = (r.stderr || r.stdout || r.error || "").split("\n").slice(-6).join(" | ").slice(0, 400);
				return ok(false, `exit ${r.status} from ${argv.join(" ")}: ${tail}`);
			}
		}
		return ok(true, `${(c.commands ?? []).length} command(s) exited 0`);
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
	 * { type: "changed-paths", allow: [glob], protect: [glob] }
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
		return ok(true, changed.length ? `only allowed paths changed (${changed.length})` : "workspace unchanged");
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
				if (r.status === 0) return ok(false, `${argv.join(" ")} still exits 0 with ${(c.restore ?? []).join(", ")} reverted — the added test does not detect the missing behaviour`);
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

	// { type: "all", checks: [...] } — composite; every child must pass. A grader error in any
	// child makes the whole thing a grader error.
	all(c, ctx) {
		const details = [];
		for (const child of c.checks ?? []) {
			const r = runCheck(child, ctx);
			details.push(`${child.type}:${r.graderError ? "GRADER-ERROR" : r.pass ? "ok" : "FAIL"} ${r.detail}`);
			if (r.graderError) return { pass: false, graderError: true, detail: details.join(" ;; ") };
			if (!r.pass) return ok(false, details.join(" ;; "));
		}
		return ok(true, details.join(" ;; "));
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
