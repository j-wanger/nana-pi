/**
 * @module packages/nana-pack/tests/config-normalize.test.mjs
 * @purpose Pins that loadConfig never throws for any bytes and always returns a fully typed config, with the user gate block the one leaf that never falls back to a default
 * @inputs lib/config.ts and arbitrary nana-pack.json bytes under a fresh temp HOME per case
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOMEs and config files), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Config safety (L1 invariants 1, 2, 6): loadConfig never throws for any bytes in
// either nana-pack.json and always returns a fully typed config. A malformed leaf
// → that leaf's default; a malformed array entry → dropped; an unparsable file →
// contributes nothing. EXCEPT the user gate block: never "default" — the last
// valid policy loaded in this process, else (fresh HOME = never loaded) a
// conservative stop. Never widens: effective gate.allowPatterns ⊆ the valid config's list.
// Each case runs under a FRESH temp HOME + USERPROFILE (in-memory last-good is keyed
// by the user config path, so nothing leaks between cases).
// Run: node --experimental-strip-types <this file>
const { loadConfig, usePiTrustModule } = await import(new URL("../lib/config.ts", import.meta.url).href);

// Project scope needs nana-trust. This file tests NORMALIZATION, not trust (trust is
// pinned against the real pi module in config-trust.test.mjs), so it installs a
// minimal stand-in for pi's trust module that mirrors the one rule used here: a
// cwd with .pi/settings.json is trust-requiring (pi 0.87.1
// dist/core/trust-manager.js:8-16,155), and no trust.json entries exist.
usePiTrustModule({
	hasTrustRequiringProjectResources: (cwd) => fs.existsSync(path.join(cwd, ".pi", "settings.json")),
	ProjectTrustStore: class { get() { return null; } },
});

const VALUES = [null, 7, "x", [], true, {}, { unexpected: 1 }];
// leaf → [kind, a valid NON-default sibling value used to prove siblings survive]
const LEAVES = {
	gate: { extraPatterns: ["regex", ["\\bterraform\\s+destroy\\b"]], allowPatterns: ["regex", ["^ls\\b"]], protectedPaths: ["regex", ["secrets\\.txt"]] },
	postEdit: { commands: ["commands", [{ match: "\\.ts$", run: "true" }]] },
	notify: { enabled: ["bool", false], headless: ["bool", true] },
	journal: { enabled: ["bool", false], path: ["path", path.join(tmpDir(path.join(os.tmpdir(), "norm-j-")), "j.jsonl")] },
	handoff: { enabled: ["bool", false], path: ["path", "/tmp/nana-h.md"], staleAfterDays: ["days", 3] },
	objective: { enabled: ["bool", false], path: ["path", "/tmp/nana-o.md"], projectFile: ["path", "OBJECTIVE.md"] },
	receipts: { enabled: ["bool", false], dir: ["path", "/tmp/nana-r"] },
};
const DEFAULTS = {
	gate: { extraPatterns: [], allowPatterns: [], protectedPaths: [] },
	postEdit: { commands: [] },
	notify: { enabled: true, headless: false },
	journal: { enabled: true, path: null },
	handoff: { enabled: true, path: null, staleAfterDays: 7 },
	objective: { enabled: true, path: null, projectFile: null },
	receipts: { enabled: true, dir: null },
};
const validFor = (k, v) =>
	k === "bool" ? typeof v === "boolean" : k === "days" ? typeof v === "number" && Number.isFinite(v) && v > 0 : k === "path" ? v === null || typeof v === "string" : Array.isArray(v) && v.length === 0; // [] is the only valid array among VALUES
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let fails = 0, total = 0;
const failed = [];
const STOP = /^user nana-pack\.json gate block is malformed — repair it \(.+:.+\)$/s;
// A malformed gate block in a nana-trusted PROJECT with no last-good project gate in this
// process stops too (invariant 6, astra L1 land ruling) — never "no project contribution".
const PSTOP = /^project nana-pack\.json gate block is malformed — repair it \(.+nana-pack\.json:.+\)$/s;
const check = (n, ok) => { total++; if (!ok) { fails++; failed.push(n); } };
const named = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

function isTyped(c) {
	const arrStr = (a) => Array.isArray(a) && a.every((s) => typeof s === "string");
	const nul = (v) => v === null || typeof v === "string";
	return arrStr(c.gate.extraPatterns) && arrStr(c.gate.allowPatterns) && arrStr(c.gate.protectedPaths)
		&& (c.gate.stopReason === null || typeof c.gate.stopReason === "string")
		&& Array.isArray(c.postEdit.commands) && c.postEdit.commands.every((x) => typeof x.match === "string" && typeof x.run === "string")
		&& typeof c.notify.enabled === "boolean" && typeof c.notify.headless === "boolean"
		&& typeof c.journal.enabled === "boolean" && nul(c.journal.path)
		&& typeof c.handoff.enabled === "boolean" && nul(c.handoff.path) && typeof c.handoff.staleAfterDays === "number" && c.handoff.staleAfterDays > 0
		&& typeof c.objective.enabled === "boolean" && nul(c.objective.path) && nul(c.objective.projectFile)
		&& typeof c.receipts.enabled === "boolean" && nul(c.receipts.dir);
}

/** fresh HOME (+ optional user config), fresh project dir (+ optional trusted project config) */
function env({ user, project, userText, projectText } = {}) {
	const home = tmpDir(path.join(os.tmpdir(), "norm-home-"));
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const u = userText ?? (user === undefined ? undefined : JSON.stringify(user));
	if (u !== undefined) fs.writeFileSync(path.join(home, ".pi", "agent", "nana-pack.json"), u);
	const cwd = tmpDir(path.join(os.tmpdir(), "norm-proj-"));
	fs.mkdirSync(path.join(cwd, ".pi"));
	fs.writeFileSync(path.join(cwd, ".pi", "settings.json"), "{}");
	const p = projectText ?? (project === undefined ? undefined : JSON.stringify(project));
	if (p !== undefined) fs.writeFileSync(path.join(cwd, ".pi", "nana-pack.json"), p);
	return { home, ctx: { cwd, hasUI: false, isProjectTrusted: () => true } };
}
function load(e) {
	try { return { cfg: loadConfig(e.ctx), threw: false }; } catch (err) { return { threw: true, err }; }
}

// A full, valid user config (every leaf at its non-default sibling value).
const VALID = {};
for (const [b, leaves] of Object.entries(LEAVES)) { VALID[b] = {}; for (const [l, [, v]] of Object.entries(leaves)) VALID[b][l] = v; }
{
	const { cfg } = load(env({ user: VALID }));
	named("baseline: the full valid config loads verbatim", Object.entries(VALID).every(([b, blk]) => Object.entries(blk).every(([l, v]) => eq(cfg[b][l], v))));
}

// ── user scope: every block, then every leaf, × every value ──
for (const [block, leaves] of Object.entries(LEAVES)) {
	for (const v of VALUES) {
		const tag = `user ${block}=${JSON.stringify(v)}`;
		const r = load(env({ user: { ...VALID, [block]: v } }));
		check(`${tag}: no throw`, !r.threw);
		if (r.threw) continue;
		check(`${tag}: typed`, isTyped(r.cfg));
		const blockValid = v !== null && typeof v === "object" && !Array.isArray(v);
		if (block === "gate") {
			// req: R-081
			check(`${tag}: never widens`, r.cfg.gate.allowPatterns.every((p) => VALID.gate.allowPatterns.includes(p)));
			// req: R-081
			check(`${tag}: malformed gate → conservative stop (fresh process, no valid policy)`, blockValid ? r.cfg.gate.stopReason === null : STOP.test(r.cfg.gate.stopReason ?? ""));
		} else {
			check(`${tag}: block = defaults`, eq(r.cfg[block], DEFAULTS[block]));
		}
		// req: R-080
		for (const [b2, blk] of Object.entries(VALID)) if (b2 !== block && b2 !== "gate") check(`${tag}: sibling block ${b2} survives`, eq(r.cfg[b2], { ...DEFAULTS[b2], ...blk }));
	}
	for (const [leaf, [kind]] of Object.entries(leaves)) {
		for (const v of VALUES) {
			const tag = `user ${block}.${leaf}=${JSON.stringify(v)}`;
			const r = load(env({ user: { ...VALID, [block]: { ...VALID[block], [leaf]: v } } }));
			check(`${tag}: no throw`, !r.threw);
			if (r.threw) continue;
			check(`${tag}: typed`, isTyped(r.cfg));
			const ok = validFor(kind, v);
			if (block === "gate") {
				// req: R-081
				check(`${tag}: never widens`, r.cfg.gate.allowPatterns.every((p) => VALID.gate.allowPatterns.includes(p)));
				check(`${tag}: ${ok ? "valid → applied" : "malformed → conservative stop"}`, ok ? eq(r.cfg.gate[leaf], v) && r.cfg.gate.stopReason === null : r.cfg.gate.stopReason !== null);
			} else {
				// req: R-080
				check(`${tag}: ${ok ? "valid → applied" : "invalid → default"}`, eq(r.cfg[block][leaf], ok ? v : DEFAULTS[block][leaf]));
				// req: R-080
				for (const [l2, [, sv]] of Object.entries(leaves)) if (l2 !== leaf) check(`${tag}: sibling ${block}.${l2} survives`, eq(r.cfg[block][l2], sv));
			}
		}
	}
}

// ── trusted project scope: same matrix; user config valid underneath ──
for (const [block, leaves] of Object.entries(LEAVES)) {
	for (const [leaf, [kind]] of Object.entries(leaves)) {
		for (const v of VALUES) {
			const tag = `project ${block}.${leaf}=${JSON.stringify(v)}`;
			const r = load(env({ user: VALID, project: { [block]: { [leaf]: v } } }));
			check(`${tag}: no throw`, !r.threw);
			if (r.threw) continue;
			check(`${tag}: typed`, isTyped(r.cfg));
			// req: R-081
			check(`${tag}: never widens`, r.cfg.gate.allowPatterns.every((p) => VALID.gate.allowPatterns.includes(p)));
			// a malformed project GATE leaf stops (fresh cwd = no last-good project gate);
			// any other block's malformed leaf never touches the gate
			check(`${tag}: ${block === "gate" && !validFor(kind, v) ? "malformed project gate → conservative stop" : "gate not stopped"}`,
				block === "gate" && !validFor(kind, v) ? PSTOP.test(r.cfg.gate.stopReason ?? "") : r.cfg.gate.stopReason === null);
			const ok = validFor(kind, v);
			// objective is USER SCOPE ONLY; a malformed project gate block contributes nothing
			const expected = block === "objective" || !ok ? VALID[block][leaf] : v;
			// req: R-080
			check(`${tag}: ${block === "objective" ? "ignored (user scope only)" : ok ? "valid → applied" : "invalid → user value kept"}`, eq(r.cfg[block][leaf], expected));
		}
	}
	for (const v of VALUES) {
		const tag = `project ${block}=${JSON.stringify(v)}`;
		const r = load(env({ user: VALID, project: { [block]: v } }));
		check(`${tag}: no throw + typed`, !r.threw && isTyped(r.cfg));
		// req: R-081
		check(`${tag}: never widens`, !r.threw && r.cfg.gate.allowPatterns.every((p) => VALID.gate.allowPatterns.includes(p)));
	}
}
for (const v of VALUES) {
	const r = load(env({ user: VALID, projectText: JSON.stringify(v) }));
	// req: R-008
	check(`project file = ${JSON.stringify(v)}: no throw, typed, user config intact`, !r.threw && isTyped(r.cfg) && eq(r.cfg.notify, VALID.notify));
}
console.log(`${fails ? "FAIL" : "PASS"} matrix: ${total - failed.length}/${total} checks (7 blocks × leaves × ${VALUES.length} values, user + trusted project)`);
for (const f of failed.slice(0, 20)) console.log("  FAIL", f);

// ── named cases ──
for (const v of [0, -1, 1e400]) {
	const r = load(env({ user: { handoff: { staleAfterDays: v } } }));
	named(`handoff.staleAfterDays=${v}: not a positive finite number → default 7`, !r.threw && r.cfg.handoff.staleAfterDays === 7);
}
{
	const r = load(env({ user: { postEdit: { commands: null } } }));
	named("sol {postEdit:{commands:null}}: no throw, commands = []", !r.threw && eq(r.cfg.postEdit.commands, []));
}
{
	const r = load(env({ user: { objective: { path: 7 } } }));
	named("sol {objective:{path:7}}: no throw, path = null (default)", !r.threw && r.cfg.objective.path === null && r.cfg.objective.enabled === true);
}
{
	const text = '{\n  "notify": { "headless": true },\n  "gate": { "extraPatterns": ["x"], },\n}\n';
	const r = load(env({ userText: text }));
	named("Opus trailing-comma file: no throw, file contributes nothing", !r.threw && r.cfg.notify.headless === false && eq(r.cfg.postEdit.commands, []));
	named("Opus trailing-comma file: gate stops conservatively (no valid policy in this process)", STOP.test(r.cfg?.gate.stopReason ?? ""));
	const p = load(env({ user: VALID, projectText: text }));
	named("trailing-comma PROJECT file: contributes nothing, user config intact", !p.threw && eq(p.cfg.gate.allowPatterns, VALID.gate.allowPatterns) && eq(p.cfg.notify, VALID.notify));
	named("trailing-comma PROJECT file: gate stops conservatively (no valid project policy in this process)", PSTOP.test(p.cfg?.gate.stopReason ?? ""));
}
{
	const r = load(env({ user: { postEdit: { commands: [{ match: "\\.ts$", run: "ok" }, 7, { match: "(", run: "x" }, { run: "nomatch" }, { match: "a", run: "t", timeoutMs: -1 }, { match: "b", run: "u", timeoutMs: 50 }] } } }));
	named("malformed array ENTRIES dropped, valid ones kept", !r.threw && eq(r.cfg.postEdit.commands, [{ match: "\\.ts$", run: "ok" }, { match: "b", run: "u", timeoutMs: 50 }]));
}
{
	const r = load(env({ userText: "﻿" + JSON.stringify({ notify: { headless: true } }) }));
	named("BOM-prefixed file parses", !r.threw && r.cfg.notify.headless === true);
}
for (const bytes of ["", "\u0000\u0001", "null", "[1,2]", '"str"', "{", "{}}"]) {
	const r = load(env({ userText: bytes }));
	named(`arbitrary bytes ${JSON.stringify(bytes)}: no throw, typed`, !r.threw && isTyped(r.cfg));
}
{
	// user config is a DIRECTORY (EISDIR) → unreadable, not a throw
	const e = env();
	fs.mkdirSync(path.join(e.home, ".pi", "agent", "nana-pack.json"));
	const r = load(e);
	named("user config is a directory: no throw, gate stopped", !r.threw && r.cfg.gate.stopReason !== null);
}
{
	// sol r1 MED: config diagnostics do not depend on journal.enabled (that flag governs
	// event journaling). The malformed leaf here is journal.path itself, so the line
	// goes to the DEFAULT journal path.
	const e = env({ userText: '{"journal":{"enabled":false,"path":7}}' });
	const r = load(e);
	const jf = path.join(e.home, ".pi", "agent", "nana-journal.jsonl");
	const lines = fs.existsSync(jf) ? fs.readFileSync(jf, "utf-8").trim().split("\n").map((l) => JSON.parse(l)) : [];
	named("sol {journal:{enabled:false,path:7}}: no throw, journal stays disabled", !r.threw && r.cfg.journal.enabled === false && r.cfg.journal.path === null);
	named("sol {journal:{enabled:false,path:7}}: exactly one config_invalid line at the default journal path",
		lines.filter((l) => l.event === "config_invalid").length === 1 && lines.some((l) => /journal\.path/.test(l.problem)));
}

process.exit(fails);
