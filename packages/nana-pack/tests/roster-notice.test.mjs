/**
 * @module packages/nana-pack/tests/roster-notice.test.mjs
 * @purpose Pin the roster notice's composition from a roster result and file, its sealed
 *  config, and (once both seats carry it) the hook/extension parity and the relative-agent-dir
 *  case in both seats.
 * @inputs roster-notice.mjs's rosterNotice, roster-notice-config.mjs's sealed values,
 *  worker-config.mjs's ROSTER_DEFAULTS, nana-roster.mjs's resolveRoster, and temp agent dirs
 * @outputs named PASS/FAIL checks
 * @effects disk (temp fixtures)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { rosterNotice } from "../lib/roster-notice.mjs";
import {
	NOTICE_PREFIX,
	DEFAULT_MARK,
	REFUSED_HEAD,
	REFUSAL_CUT,
	SIZE_LABELS,
	CLAUDE_CODE_MARK,
	WIDGET_KEY,
	CHANGE_POINTER,
	RELATIVE_DIR_TEXT,
	SHOW_SOURCES,
} from "../lib/roster-notice-config.mjs";
import { ROSTER_DEFAULTS } from "../bin/worker-config.mjs";
import { resolveRoster } from "../bin/nana-roster.mjs";
import { tildeify } from "../../nana-setup/lib/paths.mjs";

const hookPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "nana-setup", "claude", "hooks", "nana-roster-notice.mjs");
const extensionDefault = (await import(new URL("../extensions/nana-roster-notice.ts", import.meta.url).href)).default;

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };

// A dedicated throwaway HOME, set before any os.homedir()-reading code below runs (this file's
// own tests and the hook/extension it drives both read it) — never the real developer home, so
// this file is safe to run directly, outside scripts/test.mjs's own per-file HOME isolation.
const testHome = tmpDir(path.join(os.tmpdir(), "roster-notice-testhome-"));
process.env.HOME = testHome;
process.env.USERPROFILE = testHome;

const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "roster-notice-")));
let agentCount = 0;
const freshAgentDir = (label) => { const d = path.join(temp, `agent-${++agentCount}-${label}`); fs.mkdirSync(d, { recursive: true }); return d; };
const homeDir = (label) => { const d = path.join(os.homedir(), `roster-notice-home-${++agentCount}-${label}`); fs.mkdirSync(d, { recursive: true }); return d; };
const entry = (model, thinking = null) => ({ provider: "zz-placeholder-provider", model, thinking });
const claudeEntry = (model) => ({ runtime: "claude-code", model });
const sampleRoster = () => ({
	scout: entry("zz-scout-model-l7"),
	builder: entry("zz-builder-model", "medium"),
	largerBuilder: null,
	reviewer: entry("zz-reviewer-model"),
	land: entry("zz-land-model"),
});
const writeRoster = (dir, roster) => { const f = path.join(dir, "nana-pack.json"); fs.writeFileSync(f, JSON.stringify({ roster })); return f; };
const fileAt = (dir) => path.join(dir, "nana-pack.json");

// req: R-1194
check("roster notice: one line that starts with the prefix and names the builders, reviewer and land by model and thinking",
	(() => {
		const dir = freshAgentDir("l1");
		// reviewer and land each carry a thinking level too, not just the builder — a one-line
		// notice must show all three, and no line break anywhere in it.
		const roster = { ...sampleRoster(), reviewer: entry("zz-reviewer-model", "high"), land: entry("zz-land-model", "low") };
		const file = writeRoster(dir, roster);
		const n = rosterNotice({ ok: true, roster, source: file }, file, false);
		return n.startsWith(NOTICE_PREFIX) &&
			!n.includes("\n") &&
			n.includes("zz-builder-model medium") &&
			n.includes("zz-reviewer-model high") &&
			n.includes("zz-land-model low");
	})());

// req: R-1195
check("roster notice: each entry shows its model and thinking and never its provider field, for a default, a file and a Claude Code roster and a model id that contains its provider",
	(() => {
		const results = [];
		// default roster: openai-codex is a real provider name and must never leak
		const defaultNotice = rosterNotice({ ok: true, roster: ROSTER_DEFAULTS, source: "default" }, fileAt(freshAgentDir("l2-default")), false);
		results.push(["default", defaultNotice.includes("gpt-6-luna high") && !defaultNotice.includes("openai-codex")]);
		// file roster: a placeholder provider found nowhere else
		const fileRoster = { ...sampleRoster(), builder: { provider: "zz-l2-file-provider", model: "zz-l2-file-model", thinking: "medium" } };
		const fileNotice = rosterNotice({ ok: true, roster: fileRoster, source: "x" }, fileAt(freshAgentDir("l2-file")), false);
		results.push(["file", fileNotice.includes("zz-l2-file-model medium") && !fileNotice.includes("zz-l2-file-provider")]);
		// Claude Code roster: has no provider field at all
		const claudeRoster = { ...sampleRoster(), largerBuilder: claudeEntry("sonnet") };
		const claudeNotice = rosterNotice({ ok: true, roster: claudeRoster, source: "x" }, fileAt(freshAgentDir("l2-claude")), false);
		results.push(["claude-code", claudeNotice.includes(`sonnet ${CLAUDE_CODE_MARK}`)]);
		// a model id that contains its provider: checked by the exact entry text, not by absence
		const leakRoster = { ...sampleRoster(), builder: { provider: "acme", model: "acme-large", thinking: null } };
		const leakNotice = rosterNotice({ ok: true, roster: leakRoster, source: "x" }, fileAt(freshAgentDir("l2-leak")), false);
		results.push(["model-contains-provider", leakNotice.includes("builder acme-large,")]);
		return { pass: results.every(([, p]) => p), results };
	})().pass, "see above");

// req: R-1194
// req: R-1196
// req: R-1197
// req: R-1201
// req: R-1202
// req: R-1203
// req: R-1206
// req: R-1210
// req: R-1215
check("roster notice: sealed values — prefix, size labels, Claude Code mark, default mark, refusal head and cut, change pointer, relative-dir text, shown start sources and widget key",
	NOTICE_PREFIX === "nana active · roster" &&
	DEFAULT_MARK === "(default)" &&
	REFUSED_HEAD === "refused:" &&
	REFUSAL_CUT === " (" &&
	SIZE_LABELS.larger === "for larger lanes" && SIZE_LABELS.small === "for small lanes" &&
	CLAUDE_CODE_MARK === "(Claude Code only)" &&
	CHANGE_POINTER === 'change: "roster" in' &&
	RELATIVE_DIR_TEXT === "unknown: PI_CODING_AGENT_DIR is relative, so each folder may read a different roster file" &&
	JSON.stringify(SHOW_SOURCES) === JSON.stringify(["startup", "resume", "fork", "clear", "new"]) &&
	WIDGET_KEY === "nana-roster",
	JSON.stringify({ NOTICE_PREFIX, DEFAULT_MARK, REFUSED_HEAD, REFUSAL_CUT, SIZE_LABELS, CLAUDE_CODE_MARK, CHANGE_POINTER, RELATIVE_DIR_TEXT, SHOW_SOURCES, WIDGET_KEY }));

// req: R-1196
check("roster notice: a larger-lane builder is named for larger lanes before the builder for small lanes",
	(() => {
		const roster = { ...sampleRoster(), largerBuilder: entry("zz-larger-model", "high") };
		const file = fileAt(freshAgentDir("l4"));
		const n = rosterNotice({ ok: true, roster, source: "x" }, file, false);
		return n.includes("zz-larger-model high for larger lanes") &&
			n.includes("zz-builder-model medium for small lanes") &&
			n.indexOf("zz-larger-model") < n.indexOf("zz-builder-model");
	})());

// req: R-1197
check("roster notice: a Claude Code entry's model is followed by the Claude Code mark, and a pi entry's is not",
	(() => {
		const roster = { ...sampleRoster(), largerBuilder: claudeEntry("sonnet") };
		const file = fileAt(freshAgentDir("l5"));
		const n = rosterNotice({ ok: true, roster, source: "x" }, file, false);
		return n.includes(`sonnet ${CLAUDE_CODE_MARK}`) &&
			!n.includes(`zz-builder-model ${CLAUDE_CODE_MARK}`) &&
			!n.includes(`zz-reviewer-model ${CLAUDE_CODE_MARK}`) &&
			!n.includes(`zz-land-model ${CLAUDE_CODE_MARK}`);
	})());

// req: R-1198
check("roster notice: a null land reads land seat",
	(() => {
		const roster = { ...sampleRoster(), land: null };
		const file = fileAt(freshAgentDir("l6"));
		const n = rosterNotice({ ok: true, roster, source: "x" }, file, false);
		return n.includes("land seat") && !n.includes("zz-land-model");
	})());

// req: R-1199
check("roster notice: a scout is never named, set or null",
	(() => {
		const withScout = rosterNotice({ ok: true, roster: sampleRoster(), source: "x" }, fileAt(freshAgentDir("l7-set")), false);
		const noScout = rosterNotice({ ok: true, roster: { ...sampleRoster(), scout: null }, source: "x" }, fileAt(freshAgentDir("l7-null")), false);
		return !withScout.includes("zz-scout-model-l7") && !withScout.toLowerCase().includes("scout") && !noScout.toLowerCase().includes("scout");
	})());

// req: R-1200
check("roster notice: a lone builder carries no size label",
	(() => {
		const roster = { ...sampleRoster(), largerBuilder: null };
		const file = fileAt(freshAgentDir("l8"));
		const n = rosterNotice({ ok: true, roster, source: "x" }, file, false);
		return n.includes("builder zz-builder-model medium,") && !n.includes(SIZE_LABELS.small) && !n.includes(SIZE_LABELS.larger);
	})());

// req: R-1201
check("roster notice: only the default roster is marked default, and a file roster equal to the default is not",
	(() => {
		const file = fileAt(freshAgentDir("l9"));
		const asDefault = rosterNotice({ ok: true, roster: ROSTER_DEFAULTS, source: "default" }, file, false);
		const asFile = rosterNotice({ ok: true, roster: ROSTER_DEFAULTS, source: file }, file, false);
		// (default) sits right after "roster" — not elsewhere on the line.
		return asDefault.startsWith(`${NOTICE_PREFIX} ${DEFAULT_MARK}:`) && asDefault.includes(DEFAULT_MARK) && !asFile.includes(DEFAULT_MARK);
	})());

// req: R-1202
check("roster notice: every refusal kind shows the problem cut before its first ' (' with no echoed value or line break, and a roster path holding ' (' stays whole",
	(() => {
		const results = [];
		// invalid JSON beside a provider string: the whole parenthetical — JSON error text,
		// leaked text included — is cut away.
		{
			const dir = freshAgentDir("l10-invalid-json");
			const file = path.join(dir, "nana-pack.json");
			fs.writeFileSync(file, '{"roster": {"builder": {"provider": "zz-l10-leak-provider", "model": "x" oops}}');
			const r = resolveRoster(dir);
			const n = rosterNotice(r, file, false);
			results.push(["invalid json", !r.ok && !n.includes("zz-l10-leak-provider") && n.startsWith(`${NOTICE_PREFIX} ${REFUSED_HEAD} invalid JSON`)]);
		}
		// an unexpected key holding a line feed: no ' (' to cut, so displayText alone removes
		// the line break while the key name itself survives (a residual, not this row's claim).
		{
			const dir = freshAgentDir("l10-linefeed-key");
			const file = path.join(dir, "nana-pack.json");
			fs.writeFileSync(file, JSON.stringify({ roster: { ...sampleRoster(), "weird\nkey": "x" } }));
			const r = resolveRoster(dir);
			const n = rosterNotice(r, file, false);
			results.push(["linefeed key", !r.ok && !n.includes("\n") && n.includes("weird key")]);
		}
		// a directory refusal under an agent dir named "My (old)": the path's own ' (' must
		// never be mistaken for the refusal's cut marker, and the message echoes it whole.
		{
			const dir = path.join(freshAgentDir("l10-paren-dir-parent"), "My (old)");
			fs.mkdirSync(dir, { recursive: true });
			const file = path.join(dir, "nana-pack.json");
			fs.mkdirSync(file); // a directory sits where the file belongs: EISDIR refusal
			const r = resolveRoster(dir);
			const n = rosterNotice(r, file, false);
			results.push(["paren path", !r.ok && n.includes(`${file} is a directory, not a regular file`)]);
		}
		// a validator refusal whose problem carries an echoed value after ' (' — a builder
		// provider holding a space — must show no echoed value in the notice (pair 13).
		{
			const dir = freshAgentDir("l10-echoed-value");
			const file = writeRoster(dir, { ...sampleRoster(), builder: { provider: "acme corp", model: "zz-l10-echo-model", thinking: null } });
			const r = resolveRoster(dir);
			const n = rosterNotice(r, file, false);
			results.push(["echoed provider value", !r.ok && !n.includes("acme corp") &&
				n === `${NOTICE_PREFIX} ${REFUSED_HEAD} roster.builder.provider must be a non-empty string with no whitespace or control character · ${CHANGE_POINTER} ${tildeify(file)}`]);
		}
		return { pass: results.every(([, p]) => p), results };
	})().pass, "see above");

// req: R-1203
check("roster notice: every notice, refused ones included, ends with the change pointer and the roster file",
	(() => {
		const okFile = fileAt(freshAgentDir("l11-ok"));
		const okNotice = rosterNotice({ ok: true, roster: sampleRoster(), source: "x" }, okFile, false);
		const refusedDir = freshAgentDir("l11-refused");
		const refusedFile = writeRoster(refusedDir, { ...sampleRoster(), builder: null });
		const refusedResult = resolveRoster(refusedDir);
		const refusedNotice = rosterNotice(refusedResult, refusedFile, false);
		return okNotice.endsWith(`${CHANGE_POINTER} ${tildeify(okFile)}`) &&
			!refusedResult.ok && refusedNotice.endsWith(`${CHANGE_POINTER} ${tildeify(refusedFile)}`);
	})());

// req: R-1204
check("roster notice: the roster file shows the home folder as ~ wherever it appears",
	(() => {
		const results = [];
		// the pointer, for a file under the home folder
		{
			const dir = homeDir("l12-pointer");
			const file = fileAt(dir);
			const n = rosterNotice({ ok: true, roster: sampleRoster(), source: "x" }, file, false);
			results.push(["pointer under home", n.endsWith(`${CHANGE_POINTER} ${tildeify(file)}`) && tildeify(file).startsWith("~") && n.includes(tildeify(file)) && !n.includes(file)]);
		}
		// a directory refusal under the home folder: the echoed path and the pointer both show ~
		{
			const parent = homeDir("l12-dir-refusal");
			const dir = path.join(parent, "My (old)");
			fs.mkdirSync(dir, { recursive: true });
			const file = path.join(dir, "nana-pack.json");
			fs.mkdirSync(file);
			const r = resolveRoster(dir);
			const n = rosterNotice(r, file, false);
			const tilde = tildeify(file);
			results.push(["directory refusal under home", !r.ok && n.includes(`${tilde} is a directory, not a regular file`) && n.endsWith(`${CHANGE_POINTER} ${tilde}`) && !n.includes(file)]);
		}
		// a dangling symlink under the home folder (POSIX only)
		if (process.platform !== "win32") {
			const dir = homeDir("l12-symlink");
			const file = path.join(dir, "nana-pack.json");
			fs.symlinkSync(path.join(dir, "missing-target.json"), file);
			const r = resolveRoster(dir);
			const n = rosterNotice(r, file, false);
			const tilde = tildeify(file);
			results.push(["dangling symlink under home", !r.ok && n.includes(`dangling symlink: ${tilde}`) && !n.includes(file)]);
		} else {
			console.log("SKIP dangling symlink under home: POSIX symlinks (win32)");
		}
		// a file outside the home folder stays absolute
		{
			const outside = path.join(temp, "outside-home", "nana-pack.json");
			const n = rosterNotice({ ok: true, roster: sampleRoster(), source: "x" }, outside, false);
			results.push(["outside home stays absolute", n.endsWith(`${CHANGE_POINTER} ${outside}`)]);
		}
		// an agent folder spelled in a different letter case still lies under the home folder on
		// a case-insensitive file system — macOS (darwin) and Windows (win32) always; linux keeps
		// comparing by exact case, so the absolute path survives there instead (R-1204).
		{
			const prevHome = process.env.HOME;
			const prevProfile = process.env.USERPROFILE;
			try {
				const home = path.join(os.tmpdir(), "Nana-Case-Fixture-Home");
				const variantHome = path.join(os.tmpdir(), "nana-case-fixture-home"); // same path, different case
				process.env.HOME = home;
				process.env.USERPROFILE = home;
				const file = path.join(variantHome, "Sub", "nana-pack.json");
				const n = rosterNotice({ ok: true, roster: sampleRoster(), source: "x" }, file, false);
				const caseInsensitive = process.platform !== "linux";
				const expectedPointer = caseInsensitive ? "~" + file.slice(home.length) : file;
				results.push(["case-variant home path", n.endsWith(`${CHANGE_POINTER} ${expectedPointer}`) &&
					(caseInsensitive ? !n.includes(file) : n.includes(file))]);
			} finally {
				if (prevHome === undefined) delete process.env.HOME; else process.env.HOME = prevHome;
				if (prevProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = prevProfile;
			}
		}
		// HOME ending in a separator (a trailing "/", or "\" on win32) must not block the ~
		// rewrite, in the pointer and in a path-bearing refusal (R-1204).
		{
			const prevHome = process.env.HOME;
			const prevProfile = process.env.USERPROFILE;
			process.env.HOME = os.homedir() + path.sep;
			process.env.USERPROFILE = process.env.HOME;
			try {
				const dir = homeDir("l12-trailing-slash");
				const file = fileAt(dir);
				const n = rosterNotice({ ok: true, roster: sampleRoster(), source: "x" }, file, false);
				results.push(["HOME with a trailing separator: pointer", n.endsWith(`${CHANGE_POINTER} ${tildeify(file)}`) && tildeify(file).startsWith("~") && !n.includes(file)]);
				const refusalParent = homeDir("l12-trailing-slash-refusal");
				const refusalFile = path.join(refusalParent, "nana-pack.json");
				fs.mkdirSync(refusalFile);
				const r = resolveRoster(refusalParent);
				const rn = rosterNotice(r, refusalFile, false);
				const tilde = tildeify(refusalFile);
				results.push(["HOME with a trailing separator: refusal", !r.ok && tilde.startsWith("~") && rn.includes(`${tilde} is a directory, not a regular file`) && !rn.includes(refusalFile)]);
			} finally {
				process.env.HOME = prevHome;
				process.env.USERPROFILE = prevProfile;
			}
		}
		return { pass: results.every(([, p]) => p), results };
	})().pass, "see above");

/* --- the pi extension: drives the REAL registered handler with a fake pi/ctx ------------ */
function makeExtensionHandlers() {
	const handlers = {};
	extensionDefault({ on: (name, fn) => { handlers[name] = fn; }, registerCommand: () => {} });
	return handlers;
}
function fakeCtx({ hasUI = true } = {}) {
	const widgetCalls = [];
	const notifyCalls = [];
	const ctx = { hasUI, ui: { setWidget: (key, lines, opts) => widgetCalls.push({ key, lines, opts }), notify: (message, kind) => notifyCalls.push({ message, kind }) } };
	return { ctx, widgetCalls, notifyCalls };
}
/** Run `fn` with PI_CODING_AGENT_DIR set to `agentDir` for the duration, then restore it. */
async function withAgentDir(agentDir, fn) {
	const prev = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = agentDir;
	try { return await fn(); }
	finally { if (prev === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = prev; }
}

{
	const l13 = await (async () => {
		const results = [];
		for (const reason of ["startup", "new", "resume", "fork"]) {
			for (const rosterKind of ["ok", "refused"]) {
				const dir = freshAgentDir(`l13-${reason}-${rosterKind}`);
				writeRoster(dir, rosterKind === "ok" ? sampleRoster() : { ...sampleRoster(), builder: null });
				const handlers = makeExtensionHandlers();
				const { ctx, widgetCalls, notifyCalls } = fakeCtx({ hasUI: true });
				await withAgentDir(dir, () => handlers.session_start({ reason }, ctx));
				const expected = rosterNotice(resolveRoster(dir), fileAt(dir), false);
				// pi's setWidget defaults to "aboveEditor" when no placement is given; an
				// explicit "belowEditor" is the only other value the type allows, so ruling
				// that out while allowing "unset" pins the placement without inventing a new
				// contract value (R-1210).
				const placement = widgetCalls[0]?.opts?.placement;
				results.push([`${reason}-${rosterKind}`, widgetCalls.length === 1 && widgetCalls[0].key === WIDGET_KEY && JSON.stringify(widgetCalls[0].lines) === JSON.stringify([expected]) && notifyCalls.length === 0 && (placement === undefined || placement === "aboveEditor")]);
			}
		}
		return { pass: results.every(([, p]) => p), results };
	})();
	// req: R-1210
	check("extension: with a UI, startup, new, resume and fork each set exactly one widget above the editor holding only the notice, a refused roster included, and raise no notify", l13.pass, JSON.stringify(l13.results.filter(([, p]) => !p)));
}

{
	const l14 = await (async () => {
		const results = [];
		{
			const dir = freshAgentDir("l14-no-ui");
			writeRoster(dir, sampleRoster());
			const handlers = makeExtensionHandlers();
			const { ctx, widgetCalls, notifyCalls } = fakeCtx({ hasUI: false });
			await withAgentDir(dir, () => handlers.session_start({ reason: "startup" }, ctx));
			results.push(["no UI", widgetCalls.length === 0 && notifyCalls.length === 0]);
		}
		{
			const dir = freshAgentDir("l14-reload");
			writeRoster(dir, sampleRoster());
			const handlers = makeExtensionHandlers();
			const { ctx, widgetCalls, notifyCalls } = fakeCtx({ hasUI: true });
			await withAgentDir(dir, () => handlers.session_start({ reason: "reload" }, ctx));
			results.push(["reload reason", widgetCalls.length === 0 && notifyCalls.length === 0]);
		}
		return { pass: results.every(([, p]) => p), results };
	})();
	// req: R-1210
	check("extension: no UI, and the reload reason, each set no widget and raise nothing", l14.pass, JSON.stringify(l14.results));
}

/* --- parity: the hook (spawned) and the extension (in-process) compose the same line ----- */
function runHookOnce(agentDir) {
	const r = spawnSync(process.execPath, [hookPath], { encoding: "utf8", input: JSON.stringify({ source: "startup" }), cwd: agentDir, env: { PATH: process.env.PATH, HOME: os.homedir(), USERPROFILE: os.homedir(), PI_CODING_AGENT_DIR: agentDir } });
	const parsed = JSON.parse(r.stdout.trim());
	return parsed.hookSpecificOutput.additionalContext;
}
async function runExtensionOnce(agentDir, { cwd } = {}) {
	const handlers = makeExtensionHandlers();
	const { ctx, widgetCalls } = fakeCtx({ hasUI: true });
	const prevCwd = cwd !== undefined ? process.cwd() : null;
	if (cwd !== undefined) process.chdir(cwd);
	try { await withAgentDir(agentDir, () => handlers.session_start({ reason: "startup" }, ctx)); }
	finally { if (cwd !== undefined) process.chdir(prevCwd); }
	return widgetCalls[0]?.lines?.[0];
}

{
	const l15 = await (async () => {
		const results = [];
		const dirDefault = freshAgentDir("l15-default");
		results.push(["default", runHookOnce(dirDefault) === await runExtensionOnce(dirDefault)]);
		const dirFile = freshAgentDir("l15-file");
		writeRoster(dirFile, sampleRoster());
		results.push(["file", runHookOnce(dirFile) === await runExtensionOnce(dirFile)]);
		const dirRefused = freshAgentDir("l15-refused");
		writeRoster(dirRefused, { ...sampleRoster(), builder: null });
		results.push(["refused", runHookOnce(dirRefused) === await runExtensionOnce(dirRefused)]);
		return { pass: results.every(([, p]) => p), results };
	})();
	// req: R-1211
	check("parity: the hook and the extension show the same notice for a default, a file and a refused roster", l15.pass, JSON.stringify(l15.results));
}

{
	const l16 = await (async () => {
		const results = [];
		for (const [label, arrange] of [["file", (dir) => writeRoster(dir, sampleRoster())], ["refused", (dir) => writeRoster(dir, { ...sampleRoster(), builder: null })]]) {
			const startFolder = freshAgentDir(`l16-start-${label}`);
			const relDir = path.join(startFolder, "rel");
			fs.mkdirSync(relDir, { recursive: true });
			arrange(relDir);
			const hookRun = spawnSync(process.execPath, [hookPath], { encoding: "utf8", input: JSON.stringify({ source: "startup" }), cwd: startFolder, env: { PATH: process.env.PATH, HOME: os.homedir(), USERPROFILE: os.homedir(), PI_CODING_AGENT_DIR: "rel" } });
			const hookLine = JSON.parse(hookRun.stdout.trim()).hookSpecificOutput.additionalContext;
			const extensionLine = await runExtensionOnce("rel", { cwd: startFolder });
			const isUnknown = (line) => typeof line === "string" && line.startsWith(`${NOTICE_PREFIX} ${RELATIVE_DIR_TEXT}`) && line.endsWith(`${CHANGE_POINTER} ${path.join(startFolder, "rel", "nana-pack.json")}`) && !line.includes("zz-");
			results.push([`${label} hook`, isUnknown(hookLine)]);
			results.push([`${label} extension`, isUnknown(extensionLine)]);
		}
		return { pass: results.every(([, p]) => p), results };
	})();
	// req: R-1215
	check("relative agent dir: the hook and the extension each show the unknown line and the change pointer, naming no lineup, for a file and a refused roster", l16.pass, JSON.stringify(l16.results));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
