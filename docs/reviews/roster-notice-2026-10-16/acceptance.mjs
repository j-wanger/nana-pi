// Seat acceptance for lane roster-notice (frozen; written by the seat 2026-10-16 before the build, from CHANGE.md §2's
// rows R-1190 to R-1215 and the twelve reworded rows, §3's design, §4's scope, §3.9's exclusions and §5's "Seat
// acceptance", plan frozen at 61b48e1 after sol plan r2 LAND). Run from anywhere inside the checkout under test; the
// build is read from the cwd's git root, the spec (CHANGE.md, seat-titles.mjs) from this script's own folder:
//   node docs/reviews/roster-notice-2026-10-16/acceptance.mjs
// Every judgement uses this script's own readers: the notice is composed here from §3.4's form (and checked against
// §3.4's three worked examples, read from CHANGE.md), never by importing the build's composer. The only build output
// used as an INPUT is the resolver's refusal problem, read from the roster command's stderr, because R-1202 defines the
// refused notice as a transform of that text; the transform itself is this script's.
// (a) seat-titles 1 prints `seat-titles 1: 0 missing`.
// (n) the notice, for a default roster (absent file and the installer's seed), file rosters with and without
//     largerBuilder (a pi entry with and without thinking, and a Claude Code entry), a reviewer with a thinking level,
//     a null land, a set scout (never shown), a file equal to the default, a model id that holds its provider, an agent
//     dir outside the home folder, `~/…` and file:// agent dirs, a relative agent dir (with a file, with a refused file,
//     and §3.4's own example), and refusals of several kinds (a value echo, invalid JSON beside a provider string, a
//     trailing comma whose problem holds two ' (', an unexpected key holding a line feed, ESC, TAB, U+009B and
//     U+202E, a directory and a dangling symlink under a path holding ' (', a dangling symlink inside and outside the
//     home folder, a non-object, over the cap, unreadable, a Claude Code model outside the four), each run through
//     BOTH seats: the hook (spawned with JSON stdin), the extension under a fake ctx that records every UI call, and
//     the extension inside the installed pi in RPC mode (`pi --mode rpc --no-session --offline -ne -e <extension>`,
//     §5 Seat acceptance); one line per scenario asserts all three equal the composed notice (R-1211 parity). The
//     extension's reasons and no-UI case, the events it registers (session_start only: no prompt section, §3.9), a UI
//     with no setWidget (it never throws, §3.6), a roster edit between two session starts in one process (the notice
//     is composed per start), NANA_ROLE=worker and reviewer in all three probes (no role check, §3.6, §3.9), the notice
//     config's values by name, and cross-scenario properties (one line, pointer last, no provider, no absolute home
//     path, no scout, no echoed value, no lineup while relative).
// (h) the hook's JSON shape for startup, resume, fork, clear, compact, an empty input, a non-JSON input, a source-less
//     input and an input that fails on read (stdin a write-only descriptor; R-1205, R-1206); its exported runner fed a
//     stream that fails on read (§3.5, pair 65); a copy whose imports fail prints the unavailable notice (R-1207); its
//     static imports are node built-ins only and nothing in the lane's three new modules starts a child process.
// (r) the roster resolver through the roster command: largerBuilder absent, null, a pi entry and each of the four
//     Claude Code names accepted and printed (R-1121, R-1123); every refusal kind N2 lists, and a falsy largerBuilder
//     ("", false, 0), refused naming the slot or field, `roster.largerBuilder.model` for a model outside the four
//     (R-1122); the resolver itself returns an absent largerBuilder as null (R-1121); `--json` prints one object holding
//     only `roster` in print order, refuses on stderr, and reads back after being set as the `roster` member of a file
//     that starts as the installer's seed (R-1192); worker-config's §3.3 names and values (D1: largerBuilder default null).
// (w) lane mode with a stub pi on PATH (as the roster lane's acceptance does): --lane-size larger with a pi entry, a
//     null slot and a Claude Code entry (refused before the lock or any spawn, R-1191's text with both ways out),
//     --lane-size small, no --lane-size and --lane-size=larger once largerBuilder is set (R-1212's text, before the
//     lock), a missing and an unknown value (R-960), and the builder line text for each (R-1124); a non-lane launch
//     with largerBuilder set reads no roster.
// (i) installer wiring without a real install on this machine: desiredHooks (POSIX, win32 from a checkout path holding
//     a space, `$`, `%` and `'`; the new entry at the base's sealed timeout and every base entry unchanged), steps
//     HOOKS, the state manifest row, the install-check table, DOCTOR_NOTES, the exported rosterNoticeOutputOk predicate
//     and runInstallCheck's own roster row under a stub spawn (R-1209); then `nana-setup install --home <scratch>`
//     (POSIX and forced win32): one matcher-less SessionStart entry with the other entries' timeout (R-1208), the hook
//     link, the installed command's output, uninstall removing both, and a stale win32 roster notice entry replaced in
//     place (R-1056).
// (t) the shared working pattern: §3.8's bullet byte for byte after the seat land review bullet, the three runtime rows'
//     Notify cells, nothing else changed; AGENTS.md's region equals it; the README and package description counts;
//     §3.8's pack README items (Machine roster, Lane builder, the extension table, What you will see), the root and
//     nana-setup README counts, each desk matrix surface list, and shared-memory-input.mjs's @purpose.
// (e) rows R-1190 to R-1215 carry §2's text, one `shall`, status implemented, under the feature §2 names, and cite their
//     §5 titles (read from seat-titles.mjs, the one title list); the twelve reworded rows carry §2's change on the base
//     text; R-1075's, R-1051's and R-658's cells cite the renamed titles; no other base row changes; the row set is the
//     base's plus 26; the tree, trace, map and readme checks.
// (f) scope: `git diff --name-only <base>..HEAD` ⊆ §4 In plus this review folder; nothing §3.9 names; HANDOFF and the
//     session entry in the diff; the new modules' headers; no added owner name, home path, host name or provider; the
//     worktree clean outside this review folder.
// (g) the test files that hold §5 titles, install.test.mjs, win32-degrade.test.mjs and config-handlers-malformed.test.mjs
//     exit 0 and print PASS once for every macOS title, every macOS loop instance and the existing win32 loops'
//     roster notice instances (R-1056's stale repair among them); the Windows-leg titles are listed (WIN) for the seat
//     to read from CI. (g) is not the suite, and a PASS proves a title exists and runs green, not that its test bites:
//     the locked full suite and the seat's mutation runner are both still required before the review.
// <base> is `git merge-base main HEAD` (2dbc817 when written), so a merge of a newer main moves it with the lane. Cases
// marked (guard) hold at the base too and catch a regression; (harness) cases check this script's own inputs; every
// other case depends on the build and reads red at the base. POSIX only (the stub pi is a sh script). Every HOME, agent
// dir, repo, worktree and install lives in one scratch folder under the OS temp dir, removed at the end; the real
// ~/.pi and ~/.claude are never written (read only: this machine's roster providers, for the (f) leak count). Not run
// here: `npm run test:locked`, install-check.mjs (both on the land checklist), `claude -p` (a paid call; the hook's
// systemMessage look is the owner's feel check), and the Windows CI leg. Before the land only: after it, `git merge-base
// main HEAD` is the tip itself and every build case reads red.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LANE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SEAT_TITLES = path.join(LANE_DIR, "seat-titles.mjs");
const ST = await import(pathToFileURL(SEAT_TITLES).href);
const root = ST.repoRoot();
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md")) || !fs.existsSync(path.join(root, "packages/nana-pack/bin/nana-roster.mjs"))) {
	console.error("run inside a nana-pi checkout: node <lane>/docs/reviews/roster-notice-2026-10-16/acceptance.mjs");
	process.exit(2);
}
if (process.platform === "win32") {
	console.error("POSIX only: the stub pi is a sh script; the Windows evidence is the CI leg");
	process.exit(2);
}

// ---------------------------------------------------------------- reporting
/** Canonical JSON: object keys sorted, arrays in order, undefined spelled out; key order is checked explicitly where the plan fixes it. */
const canon = (v) => JSON.stringify(v, (_k, x) => (x === undefined ? "(undefined)" : x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
let bad = 0, n = 0, badBuild = 0, nBuild = 0;
const out = (title, got, want, detail = "") => {
	n++;
	const ok = canon(got) === canon(want);
	const isBuild = !/^\((harness|guard)\)/.test(title);
	if (isBuild) nBuild++;
	if (!ok) { bad++; if (isBuild) badBuild++; }
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${canon(got).slice(0, 400)} (want ${canon(want).slice(0, 400)})${detail ? ` [${String(detail).replace(/\s+/g, " ").slice(0, 400)}]` : ""}`}`);
	return ok;
};
const windowsLeg = (what) => console.log(`WIN  ${what}`);

// ---------------------------------------------------------------- repo readers
const rel = (p) => path.join(root, p);
const text = (p) => { try { return fs.readFileSync(rel(p), "utf8"); } catch { return null; } };
const lines = (s) => (s ?? "").replace(/\r/g, "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));
const collapse = (s) => (s ?? "").replace(/\s+/g, " ");
const occurrences = (hay, needle) => (hay && needle ? hay.split(needle).length - 1 : 0);
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^(NANA_|GIT_|PI_|CLAUDE_|ROSTER_ACCEPT_)/.test(k)) delete env[k]; return env; };
const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const statusOf = () => git("status", "--porcelain=v1", "-uall").stdout;
const statusBefore = statusOf();
const base = git("merge-base", "main", "HEAD").stdout.trim();
const atBase = (p) => { const r = git("show", `${base}:${p}`); return r.status === 0 ? r.stdout : null; };
const NODE_WARNING = [/^\(node:\d+\) /, /ExperimentalWarning/, /^\(Use `node --trace-warnings/, /^Reparsing as ES module/, /^To eliminate this warning/];
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const importFresh = async (p) => { try { return await import(`${pathToFileURL(rel(p)).href}?accept=${Date.now()}`); } catch (e) { return { __error: String(e?.code ?? e?.message ?? e) }; } };

// ---------------------------------------------------------------- the plan, read from CHANGE.md
const change = fs.readFileSync(path.join(LANE_DIR, "CHANGE.md"), "utf8");
const flat = collapse(change);
const tick = (re) => re.exec(flat)?.[1] ?? null;
/** §3.4's worked examples are the whole lines, pointer included (§2's rows quote only their heads). */
const example = (head) => [...flat.matchAll(new RegExp("`(" + head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^`]+)`", "g"))].map((m) => m[1]).find((l) => l.includes(" · change: ")) ?? null;
const DEFAULT_EXAMPLE = example("nana active · roster (default): builder "); // §3.4, 144 characters
const REFUSED_EXAMPLE = example("nana active · roster refused: "); // §3.4, 169 characters
const RELATIVE_EXAMPLE = example("nana active · roster unknown: "); // §3.4, 166 characters
const SONNET_BUILDERS = tick(/the builders read `(builders [^`]+)`/); // §3.4, D1's other answer
const R1191_TEXT = tick(/`(roster\.largerBuilder is a Claude Code entry; [^`]+)`/); // §3.2
const R1212_TEXT = tick(/`(roster sets largerBuilder: pass [^`]+)`/); // §3.2
const BULLET = tick(/"(- Larger lanes: [^"]+)"/); // §3.8

// Contract values, literal by design in this seat script (each is quoted in the plan where named).
const PREFIX = "nana active · roster"; // R-1194
const SEP = " · "; // §3.4: segments join with ` · `
const POINTER = 'change: "roster" in'; // R-1203
const RELATIVE_TEXT = "unknown: PI_CODING_AGENT_DIR is relative, so each folder may read a different roster file"; // R-1215
const CC_MARK = "(Claude Code only)"; // R-1197
const UNAVAILABLE = /^nana active · roster notice unavailable \(([A-Za-z_][A-Za-z0-9_]*)\)$/; // R-1207
const WIDGET_KEY = "nana-roster"; // §3.3, L3
const CC_MODELS = ["sonnet", "opus", "haiku", "fable"]; // R-1122, §3.3 CLAUDE_CODE_SUBAGENT_MODELS
const PRINT_ORDER = ["scout", "builder", "largerBuilder", "reviewer", "land"]; // R-1123, R-1192
const SHOWN_HOOK_SOURCES = ["startup", "resume", "clear", "fork"]; // R-1206
const SHOWN_PI_REASONS = ["startup", "new", "resume", "fork"]; // R-1210
const LARGER_LINE = "pi-worker: builder (larger lanes):"; // R-1124
const TOOLS = "read,grep,find,bash,edit,write"; // R-961
const HOOK_NAME = "nana-roster-notice.mjs";
const HOOK_REL = `packages/nana-setup/claude/hooks/${HOOK_NAME}`;
const EXT_REL = "packages/nana-pack/extensions/nana-roster-notice.ts";
const LIB_REL = "packages/nana-pack/lib/roster-notice.mjs";
const CONFIG_REL = "packages/nana-pack/lib/roster-notice-config.mjs";
const SEED_REL = "packages/nana-setup/pi/nana-pack.seed.json";
const HOOK = rel(HOOK_REL), EXT = rel(EXT_REL);
const NANA_ROSTER = rel("packages/nana-pack/bin/nana-roster.mjs");
const PI_WORKER = rel("packages/nana-pack/bin/pi-worker.mjs");
const SETUP_CLI = rel("packages/nana-setup/bin/nana-setup.mjs");
const SHARED = "templates/_shared/working-under-nana-pi.md";
const BEGIN = "<!-- nana:working-under-nana-pi begin -->";
const END = "<!-- nana:working-under-nana-pi end -->";

// The sealed default roster, read from R-1120's base text (its contract), so no provider is written here.
const r1120Base = (atBase("REQUIREMENTS.md") ?? "").split("\n").find((l) => /^\|\s*R-1120\s*\|/.test(l)) ?? "";
const dm = /builder (\S+) (\S+) (\S+), reviewer (\S+) (\S+), and land (\S+) (\S+),/.exec(r1120Base);
const pe = (provider, model, thinking) => ({ provider, model, thinking });
const DEF = dm ? { scout: null, builder: pe(dm[1], dm[2], dm[3]), largerBuilder: null, reviewer: pe(dm[4], dm[5], null), land: pe(dm[6], dm[7], null) } : null;
const DEF4 = DEF ? { scout: null, builder: DEF.builder, reviewer: DEF.reviewer, land: DEF.land } : null;

// ---------------------------------------------------------------- this script's own notice composer (§3.4, R-1194 to R-1204, R-1215)
const tildeIn = (home) => (p) => (p === home || p.startsWith(home + path.sep) ? `~${p.slice(home.length)}` : p);
const entryText = (e) => (e.runtime === "claude-code" ? `${e.model} ${CC_MARK}` : e.thinking == null ? e.model : `${e.model} ${e.thinking}`);
function lineup(r, isDefault) {
	const builders = r.largerBuilder ? `builders ${entryText(r.largerBuilder)} for larger lanes and ${entryText(r.builder)} for small lanes` : `builder ${entryText(r.builder)}`;
	return `${PREFIX}${isDefault ? " (default)" : ""}: ${builders}, reviewer ${entryText(r.reviewer)}, land ${r.land ? entryText(r.land) : "seat"}`;
}
const HOLE = "\uE000roster-file\uE001";
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;
/** R-1202: the path set aside, cut before the first ` (`, controls and breaks to spaces, the path put back (as R-1204's ~ form). */
function shownProblem(problem, file, t) {
	let s = problem.split(file).join(HOLE);
	const cut = s.indexOf(" (");
	if (cut >= 0) s = s.slice(0, cut);
	return s.replace(CONTROL, " ").split(HOLE).join(t(file));
}
function expectNotice({ kind, roster, problem, file, home }) {
	const t = tildeIn(home);
	const ptr = `${POINTER} ${t(file)}`;
	if (kind === "relative") return `${PREFIX} ${RELATIVE_TEXT}${SEP}${ptr}`;
	if (kind === "refused") return typeof problem === "string" ? `${PREFIX} refused: ${shownProblem(problem, file, t)}${SEP}${ptr}` : null;
	return `${lineup(roster, kind === "default")}${SEP}${ptr}`;
}

// ---------------------------------------------------------------- scratch harness
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "roster-notice-accept-")));
const restore = [];
let homeCount = 0;
const newHome = (label) => { const h = path.join(scratch, "homes", `${++homeCount}-${label.replace(/\W+/g, "-").slice(0, 30)}`); fs.mkdirSync(h, { recursive: true }); return h; };
const envFor = (home, agentEnv, extra = {}) => { const e = { ...cleanEnv(), HOME: home, USERPROFILE: home, ...extra }; if (agentEnv !== undefined) e.PI_CODING_AGENT_DIR = agentEnv; return e; };
const writeRoster = (file, roster, raw = null) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, raw ?? `${JSON.stringify({ roster }, null, 2)}\n`); return file; };
// Placeholder providers, found nowhere in the checkout (checked below); PV_ECHO's model id holds it (R-1195, L2).
const PV = ["pvx-alpha", "pvx-bravo", "pvx-charlie", "pvx-delta"];
const PV_LEAK = "pvx-leak", PV_ECHO = "pvx-echo", PV_ECHO_MODEL = "pvx-echo-large";
const ALL_PV = [...PV, PV_LEAK, PV_ECHO];
const SCOUT_MODEL = "mdl-scout-only";
const base4 = () => ({ scout: pe(PV[0], SCOUT_MODEL, "low"), builder: pe(PV[1], "mdl-build", "high"), reviewer: pe(PV[2], "mdl-review", null), land: null });

/** The resolver's refusal problem for this env, as the roster command prints it (R-1123): `nana-roster: roster refused: <file>: <problem>`. */
function cliProblem(env, cwd, file) {
	const r = spawnSync(process.execPath, [NANA_ROSTER], { cwd, env, encoding: "utf8", timeout: 30_000 });
	const prefix = `nana-roster: roster refused: ${file}: `;
	return r.status === 1 && (r.stderr ?? "").startsWith(prefix) ? r.stderr.slice(prefix.length).replace(/\n$/, "") : null;
}
const hookInput = (source, cwd) => JSON.stringify({ session_id: "accept", transcript_path: "", cwd, hook_event_name: "SessionStart", ...(source === undefined ? {} : { source }) });
function runHook(env, cwd, input, hookPath = HOOK) {
	const r = spawnSync(process.execPath, [hookPath], { cwd, env, input, encoding: "utf8", timeout: 30_000 });
	const stdout = r.stdout ?? "";
	let obj = null;
	try { obj = JSON.parse(stdout); } catch { obj = `unparsable stdout: ${JSON.stringify(stdout.slice(0, 160))}`; }
	return { status: r.status, lines: stdout.split("\n").filter((l) => l.trim() !== "").length, obj, stderr: r.stderr ?? "" };
}
/** The hook (or `script`) spawned with stdin as a write-only descriptor, so a read of stdin fails with EBADF (R-1206: "an input read error included"). */
function runWithWriteOnlyStdin(env, cwd, script, args = []) {
	const woPath = path.join(scratch, `write-only-stdin-${++woCount}.txt`);
	const wo = fs.openSync(woPath, "w");
	try {
		const r = spawnSync(process.execPath, [...args, script], { cwd, env, stdio: [wo, "pipe", "pipe"], encoding: "utf8", timeout: 30_000 });
		const stdout = r.stdout ?? "";
		let obj = null;
		try { obj = JSON.parse(stdout); } catch { obj = `unparsable stdout: ${JSON.stringify(stdout.slice(0, 160))}`; }
		return { status: r.status, lines: stdout.split("\n").filter((l) => l.trim() !== "").length, obj, stdout, stderr: r.stderr ?? "" };
	} finally { fs.closeSync(wo); }
}
let woCount = 0;
const ctxOf = (h) => (h.obj && typeof h.obj === "object" ? h.obj.hookSpecificOutput?.additionalContext ?? "(no additionalContext)" : h.obj);
const EXT_CASES = [["startup", true], ["new", true], ["resume", true], ["fork", true], ["reload", true], ["startup", false], ["resume", false]];
/**
 * The extension under a fake ctx in a child node (its own cwd and env); a fresh registration per case, as pi re-creates
 * extensions per runtime. Also records the event names the first registration passes to pi.on (§3.9: no prompt section,
 * so session_start only), and one startup with config-handlers-malformed.test.mjs's fake UI, which has notify and
 * setStatus but no setWidget (§3.6: it never throws).
 */
function extProbe(env, cwd) {
	const code = `
const out = { loadError: null, cases: [], events: null, noWidgetUi: null };
let mod = null;
try { mod = await import(${JSON.stringify(pathToFileURL(EXT).href)}); } catch (e) { out.loadError = String(e?.code ?? e?.message ?? e); }
const register = () => {
  const handlers = {};
  const api = new Proxy({ on: (ev, fn) => { (handlers[ev] ??= []).push(fn); } }, { get: (t, p) => (p in t ? t[p] : () => undefined) });
  let threw = null;
  try { mod.default(api); } catch (e) { threw = String(e?.message ?? e); }
  return { handlers, threw };
};
for (const [reason, hasUI] of ${JSON.stringify(EXT_CASES)}) {
  if (!mod) break;
  const reg = register();
  const handlers = reg.handlers;
  out.events ??= Object.keys(handlers);
  let threw = reg.threw;
  const rec = [];
  const theme = { fg: (_c, s) => s, bg: (_c, s) => s, bold: (s) => s, italic: (s) => s, dim: (s) => s };
  const ui = new Proxy({ theme }, { get: (t, p) => (p in t ? t[p] : typeof p === "string" ? (...args) => { rec.push({ m: p, args: JSON.parse(JSON.stringify(args, (_k, v) => (typeof v === "function" ? "[function]" : v === undefined ? null : v))) }); return undefined; } : undefined) });
  const ctx = { cwd: process.cwd(), hasUI, ui, isProjectTrusted: () => true, hasPendingMessages: () => false, signal: new AbortController().signal, sessionManager: { getSessionId: () => "accept", getSessionFile: () => undefined } };
  for (const fn of handlers.session_start ?? []) { try { await fn({ type: "session_start", reason }, ctx); } catch (e) { threw = String(e?.message ?? e); } }
  out.cases.push({ reason, hasUI, calls: rec, threw });
}
if (mod) {
  const reg = register();
  const rec = [];
  const ui = { notify: () => { rec.push({ m: "notify" }); }, setStatus: () => { rec.push({ m: "setStatus" }); }, select: async () => "Block", theme: { fg: (_c, t) => t } };
  const ctx = { cwd: process.cwd(), hasUI: true, ui, isProjectTrusted: () => false, sessionManager: { getSessionId: () => "accept" } };
  let threw = reg.threw;
  for (const fn of reg.handlers.session_start ?? []) { try { await fn({ type: "session_start", reason: "startup" }, ctx); } catch (e) { threw = String(e?.message ?? e); } }
  out.noWidgetUi = { calls: rec, threw };
}
console.log(JSON.stringify(out));`;
	const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", code], { cwd, env, encoding: "utf8", timeout: 60_000 });
	try { return JSON.parse(lines(r.stdout).at(-1) ?? ""); } catch { return { loadError: `probe failed: ${own(r.stderr).slice(-2).join(" | ")}`, cases: [] }; }
}
/** One registration in one process: startup, then the roster file rewritten, then a `new` start; the widget lines each start set. */
function extEditProbe(env, cwd, file, nextText) {
	const code = `
import * as fs from "node:fs";
const out = { loadError: null, shown: [] };
let mod = null;
try { mod = await import(${JSON.stringify(pathToFileURL(EXT).href)}); } catch (e) { out.loadError = String(e?.code ?? e?.message ?? e); }
if (mod) {
  const handlers = {};
  const api = new Proxy({ on: (ev, fn) => { (handlers[ev] ??= []).push(fn); } }, { get: (t, p) => (p in t ? t[p] : () => undefined) });
  try { mod.default(api); } catch (e) { out.loadError = String(e?.message ?? e); }
  for (const reason of ["startup", "new"]) {
    if (reason === "new") fs.writeFileSync(${JSON.stringify(file)}, ${JSON.stringify(nextText)});
    const set = [];
    const theme = { fg: (_c, s) => s, bg: (_c, s) => s, bold: (s) => s, italic: (s) => s, dim: (s) => s };
    const ui = new Proxy({ theme, setWidget: (_k, ls) => { set.push(Array.isArray(ls) ? ls[0] : ls); } }, { get: (t, p) => (p in t ? t[p] : () => undefined) });
    const ctx = { cwd: process.cwd(), hasUI: true, ui, isProjectTrusted: () => true, hasPendingMessages: () => false, signal: new AbortController().signal, sessionManager: { getSessionId: () => "accept", getSessionFile: () => undefined } };
    for (const fn of handlers.session_start ?? []) { try { await fn({ type: "session_start", reason }, ctx); } catch (e) { set.push("threw: " + String(e?.message ?? e)); } }
    out.shown.push(set.length === 1 ? set[0] : { set });
  }
}
console.log(JSON.stringify(out));`;
	const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", code], { cwd, env, encoding: "utf8", timeout: 60_000 });
	try { const o = JSON.parse(lines(r.stdout).at(-1) ?? ""); return o.loadError ? `extension did not load: ${o.loadError}` : o.shown; } catch { return `probe failed: ${own(r.stderr).slice(-2).join(" | ")}`; }
}
/**
 * The hook's exported runner (§3.5: "It exports its runner with the input stream injected"), imported in a child node
 * (its own cwd and env) and fed a Readable that fails on read. The plan names no export or signature, so each exported
 * function is tried as fn(stream, write) and then as fn({ stdin, input, stream, stdout: { write }, write, out, print }),
 * with process.stdout.write captured and process.exit made a no-op; a returned string or object counts as printed. The
 * first try whose output holds hookSpecificOutput is the runner's.
 */
function hookRunnerProbe(env, cwd) {
	const code = `
import { Readable } from "node:stream";
const out = { loadError: null, exports: [], tried: [], printed: null };
const realWrite = process.stdout.write.bind(process.stdout);
const realExit = process.exit;
let mod = null;
try { mod = await import(${JSON.stringify(pathToFileURL(HOOK).href)}); } catch (e) { out.loadError = String(e?.code ?? e?.message ?? e); }
const failing = () => new Readable({ read() { this.destroy(Object.assign(new Error("injected read failure"), { code: "EIO" })); } });
const fns = mod ? Object.entries(mod).filter(([, v]) => typeof v === "function") : [];
out.exports = fns.map(([k]) => k);
search: for (const [name, fn] of fns) {
  for (const shape of ["(stream, write)", "({ stdin, write, ... })"]) {
    let printed = "";
    const write = (s) => { printed += String(s); return true; };
    let threw = null, ret;
    process.stdout.write = write;
    process.exit = () => {};
    try { const s = failing(); ret = shape === "(stream, write)" ? await fn(s, write) : await fn({ stdin: s, input: s, stream: s, stdout: { write }, write, out: write, print: write }); }
    catch (e) { threw = String(e?.code ?? e?.message ?? e); }
    finally { process.stdout.write = realWrite; process.exit = realExit; }
    if (typeof ret === "string") printed += ret;
    else if (ret && typeof ret === "object") printed += typeof ret.stdout === "string" ? ret.stdout : JSON.stringify(ret);
    out.tried.push({ name, shape, threw, printed: printed.slice(0, 300) });
    if (printed.includes("hookSpecificOutput")) { out.printed = printed; break search; }
  }
}
realWrite(JSON.stringify(out) + "\\n");`;
	const r = spawnSync(process.execPath, ["--no-warnings", "--input-type=module", "-e", code], { cwd, env, input: "", encoding: "utf8", timeout: 30_000 });
	let o;
	try { o = JSON.parse(lines(r.stdout).at(-1) ?? ""); } catch { return { hasRunner: false, obj: `probe failed: ${own(r.stderr).slice(-2).join(" | ")}` }; }
	if (o.loadError) return { hasRunner: false, obj: `hook did not load: ${o.loadError}` };
	let obj = null;
	try { obj = JSON.parse((o.printed ?? "").split("\n").find((l) => l.trim() !== "") ?? ""); } catch { obj = { exports: o.exports, tried: o.tried }; }
	return { hasRunner: o.exports.length > 0, obj };
}
const uiSummary = (calls) => (calls ?? []).map((c) => (c.m === "setWidget" ? { m: "setWidget", key: c.args?.[0], lines: c.args?.[1], placement: c.args?.[2]?.placement ?? "aboveEditor" } : { m: c.m }));
const extStartup = (probe) => { if (probe.loadError) return `extension did not load: ${probe.loadError}`; const c = probe.cases.find((x) => x.reason === "startup" && x.hasUI); const s = uiSummary(c?.calls); return s.length === 1 && s[0].m === "setWidget" && Array.isArray(s[0].lines) ? s[0].lines[0] : { calls: s, threw: c?.threw ?? null }; };
const widgetWant = (L) => [{ m: "setWidget", key: WIDGET_KEY, lines: [L], placement: "aboveEditor" }];
// R-898: a real pi child gets its own knowledge home, never the machine's index.
const knowledgeHome = fs.mkdtempSync(path.join(os.tmpdir(), "roster-accept-knowledge-"));
process.on("exit", () => { try { fs.rmSync(knowledgeHome, { recursive: true, force: true }); } catch { /* best effort */ } });
const piVersion = spawnSync("pi", ["--version"], { encoding: "utf8", env: { ...cleanEnv(), NANA_KNOWLEDGE_HOME: knowledgeHome }, timeout: 30_000 });
const piOk = piVersion.status === 0;
/** The extension inside the installed pi, RPC mode, nothing else loaded (§5 Seat acceptance: one setWidget request, no notify). */
function rpcProbe(env, cwd) {
	if (!piOk) return { error: "no pi on PATH", requests: [] };
	const r = spawnSync("pi", ["--mode", "rpc", "--no-session", "--offline", "-ne", "-nc", "-ns", "-np", "--no-themes", "-e", EXT], { cwd, env: { ...env, PI_OFFLINE: "1", NANA_KNOWLEDGE_HOME: knowledgeHome }, input: '{"type":"get_commands"}\n', encoding: "utf8", timeout: 60_000 });
	const msgs = lines(r.stdout).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
	return { requests: msgs.filter((m) => m.type === "extension_ui_request").map((m) => (m.method === "setWidget" ? { m: "setWidget", key: m.widgetKey, lines: m.widgetLines, placement: m.widgetPlacement ?? "aboveEditor" } : { m: m.method })), stderr: own(r.stderr).slice(-2).join(" | ") };
}
const rpcLine = (p) => (p.error ? p.error : p.requests.length === 1 && p.requests[0].m === "setWidget" && Array.isArray(p.requests[0].lines) && p.requests[0].lines.length === 1 ? p.requests[0].lines[0] : { requests: p.requests, stderr: p.stderr });

try {
	// ---------------------------------------------------------------- (harness)
	out("(harness) git merge-base main HEAD resolves", /^[0-9a-f]{40}$/.test(base), true, base);
	out("(harness) the scratch folder is outside the checkout", path.relative(fs.realpathSync(root), scratch).startsWith(".."), true, scratch);
	out("(harness) CHANGE.md gives §3.4's three examples at 144, 169 and 166 characters, the larger-lane builders fragment, §3.2's two refusal texts and §3.8's bullet",
		[DEFAULT_EXAMPLE?.length, REFUSED_EXAMPLE?.length, RELATIVE_EXAMPLE?.length, Boolean(SONNET_BUILDERS), Boolean(R1191_TEXT), Boolean(R1212_TEXT), Boolean(BULLET)], [144, 169, 166, true, true, true, true]);
	out("(harness) R-1120's base text gives the default roster's builder, reviewer and land", DEF !== null, true, r1120Base.slice(0, 200));
	const grepPv = git("grep", "-I", "-l", "-e", "pvx-", "--", ".", ":!docs/reviews/roster-notice-2026-10-16");
	out("(harness) the placeholder providers appear nowhere in the checkout outside this review folder", grepPv.stdout.split("\n").filter(Boolean), []);
	out("(harness) pi is on PATH for the RPC runs", [piOk, /^1\./.test((piVersion.stdout ?? "").trim())], [true, true], piVersion.stderr);
	{
		// This script's composer reproduces §3.4's worked examples (its form is the plan's, not the build's).
		const h = "/home/u";
		const ok1 = DEF && expectNotice({ kind: "default", roster: DEF, file: `${h}/.pi/agent/nana-pack.json`, home: h }) === DEFAULT_EXAMPLE;
		const ok2 = expectNotice({ kind: "refused", problem: 'roster.builder.provider must be a non-empty string with no whitespace or control character (got "")', file: `${h}/.pi/agent/nana-pack.json`, home: h }) === REFUSED_EXAMPLE;
		const ok3 = expectNotice({ kind: "relative", file: `${h}/nana-pi/pi-agent/nana-pack.json`, home: h }) === RELATIVE_EXAMPLE;
		const ok4 = DEF && lineup({ ...DEF, largerBuilder: { runtime: "claude-code", model: "sonnet" } }, true).includes(`: ${SONNET_BUILDERS}, reviewer `);
		out("(harness) the composer reproduces §3.4's default, refused and relative examples and its larger-lane builders fragment", [ok1, ok2, ok3, ok4], [true, true, true, true]);
	}

	// ---------------------------------------------------------------- (a) the title check
	{
		const r = spawnSync(process.execPath, [SEAT_TITLES, "1"], { cwd: root, encoding: "utf8" });
		const tl = lines(r.stdout);
		out("(a) seat-titles 1 prints `seat-titles 1: 0 missing` and exits 0 (§5: every §5.1 title under its req: marker, the four loop instances, the renamed titles, the old names gone)",
			[tl.at(-1) ?? null, r.status], ["seat-titles 1: 0 missing", 0], `${tl.filter((l) => !/^(ok|gone) /.test(l)).length} lines not ok, first: ${tl.find((l) => !/^(ok|gone) /.test(l)) ?? ""}`);
	}

	// ---------------------------------------------------------------- (n) the notice in both seats (R-1194 to R-1204, R-1210, R-1211, R-1215)
	const scenarios = [];
	const sc = (label, o) => {
		const home = o.home ?? newHome(label);
		const cwd = o.cwd ?? (() => { const d = path.join(home, "project"); fs.mkdirSync(d, { recursive: true }); return d; })();
		if (o.cwd) fs.mkdirSync(o.cwd, { recursive: true });
		const env = envFor(home, o.agentEnv);
		const file = o.file(home, cwd);
		o.arrange?.(file, home, cwd);
		const problem = o.kind === "refused" ? cliProblem(env, cwd, file) : undefined;
		const L = DEF ? expectNotice({ kind: o.kind, roster: o.roster, problem, file, home }) : null;
		const s = { label, home, cwd, env, file, kind: o.kind, roster: o.roster, problem, L, hook: runHook(env, cwd, hookInput("startup", cwd)), ext: extProbe(env, cwd), rpc: rpcProbe(env, cwd), allowModel: o.allowModel ?? null, scoutModel: o.roster?.scout?.model ?? null };
		scenarios.push(s);
		return s;
	};
	const homeAgent = (h) => path.join(h, ".pi", "agent", "nana-pack.json");
	const seedText = text(SEED_REL);
	const withLarger = (larger, over = {}) => ({ ...base4(), largerBuilder: larger, ...over });
	const sDefault = sc("default, no file", { kind: "default", roster: DEF, file: homeAgent });
	sc("default, the installer's seed (objective only)", { kind: "default", roster: DEF, agentEnv: undefined, file: homeAgent, arrange: (f) => writeRoster(f, null, seedText) });
	const sPlain = sc("file roster: set scout, null land, no largerBuilder", { kind: "file", roster: base4(), file: homeAgent, arrange: (f) => writeRoster(f, base4()) });
	sc("file roster: explicit null largerBuilder", { kind: "file", roster: withLarger(null), file: homeAgent, arrange: (f) => writeRoster(f, withLarger(null)) });
	const lgPi = withLarger(pe(PV[3], "mdl-large", "xhigh"), { land: pe(PV[0], "mdl-land", "medium") });
	sc("file roster: pi largerBuilder and a set land", { kind: "file", roster: lgPi, file: homeAgent, arrange: (f) => writeRoster(f, lgPi) });
	// R-1194 "each entry by its model and any thinking level": every other fixture's reviewer has a null thinking.
	const lgPiR = { ...lgPi, reviewer: pe(PV[2], "mdl-review", "low") };
	sc("file roster: a reviewer with a thinking level (low)", { kind: "file", roster: lgPiR, file: homeAgent, arrange: (f) => writeRoster(f, lgPiR) });
	// R-1194: a pi largerBuilder with a null thinking names its model alone (no "null", no "default").
	const lgPiNull = withLarger(pe(PV[3], "mdl-large", null));
	sc("file roster: pi largerBuilder with a null thinking", { kind: "file", roster: lgPiNull, file: homeAgent, arrange: (f) => writeRoster(f, lgPiNull) });
	const lgCc = DEF ? withLarger({ runtime: "claude-code", model: "sonnet" }, { builder: pe(PV[1], DEF.builder.model, DEF.builder.thinking) }) : null;
	sc("file roster: Claude Code largerBuilder sonnet (§3.4's builders fragment)", { kind: "file", roster: lgCc, file: homeAgent, arrange: (f) => writeRoster(f, lgCc) });
	for (const model of ["opus", "haiku", "fable"]) {
		const r = withLarger({ runtime: "claude-code", model }, { scout: null });
		sc(`file roster: Claude Code largerBuilder ${model}, null scout`, { kind: "file", roster: r, file: homeAgent, arrange: (f) => writeRoster(f, r) });
	}
	sc("file roster equal to the default (not marked default)", { kind: "file", roster: DEF, file: homeAgent, arrange: (f) => writeRoster(f, DEF4) });
	const echo = { ...base4(), builder: pe(PV_ECHO, PV_ECHO_MODEL, null) };
	sc("file roster: a model id that holds its provider", { kind: "file", roster: echo, file: homeAgent, arrange: (f) => writeRoster(f, echo), allowModel: PV_ECHO_MODEL });
	{
		const outside = path.join(scratch, "outside", "agent");
		sc("agent dir outside the home folder (absolute pointer)", { kind: "file", roster: lgPi, agentEnv: outside, file: () => path.join(outside, "nana-pack.json"), arrange: (f) => writeRoster(f, lgPi) });
	}
	sc("PI_CODING_AGENT_DIR=~/agents/tilde", { kind: "file", roster: base4(), agentEnv: "~/agents/tilde", file: (h) => path.join(h, "agents", "tilde", "nana-pack.json"), arrange: (f) => writeRoster(f, base4()) });
	{
		const h = newHome("file-url");
		sc("PI_CODING_AGENT_DIR as a file:// URL", { home: h, kind: "file", roster: base4(), agentEnv: pathToFileURL(path.join(h, "agents", "url")).href, file: () => path.join(h, "agents", "url", "nana-pack.json"), arrange: (f) => writeRoster(f, base4()) });
	}
	// R-1215: a relative value names no lineup, whatever the resolver returns.
	const sRelFile = sc("relative agent dir with a valid roster (unknown line)", { kind: "relative", agentEnv: "rel", file: (_h, cwd) => path.join(cwd, "rel", "nana-pack.json"), arrange: (f) => writeRoster(f, lgPi) });
	sc("relative agent dir with a refused roster (unknown line)", { kind: "relative", agentEnv: "rel", file: (_h, cwd) => path.join(cwd, "rel", "nana-pack.json"), arrange: (f) => writeRoster(f, null, "{") });
	{
		const h = newHome("relative-example");
		const s = sc("relative agent dir: §3.4's example (PI_CODING_AGENT_DIR=pi-agent read from ~/nana-pi)", { home: h, cwd: path.join(h, "nana-pi"), kind: "relative", agentEnv: "pi-agent", file: () => path.join(h, "nana-pi", "pi-agent", "nana-pack.json") });
		out("(harness) the relative example's composed notice equals §3.4's text", s.L, RELATIVE_EXAMPLE);
	}
	// Refusals (R-1202, R-1203, R-1204): the expected text is this script's transform of the resolver's own problem.
	const sValue = sc("refused: builder.provider \"\" at ~/.pi/agent (§3.4's refused example)", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, { ...base4(), builder: pe("", "mdl-build", "high") }) });
	const sJson = sc("refused: invalid JSON beside a provider string", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, null, `{"roster":{"builder":{"provider":${PV_LEAK}}}}`) });
	const sEcho = sc("refused: a provider string echoed as a bad thinking value", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, { ...base4(), builder: pe(PV[1], "mdl-build", PV[2]) }) });
	// R-1202 "cut before its first ' (' ": the hand-edit slip, a trailing comma, gives `invalid JSON (<parser text> (line N column M))`.
	const sTrail = sc("refused: a trailing comma (a problem holding two ' (')", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, null, `${JSON.stringify({ roster: base4() }).slice(0, -2)},}}`) });
	// R-1202 "every control character and line break": a line feed, ESC (an ANSI colour), TAB, C1 CSI and a bidi override.
	const ODD_KEY = "odd\nkey\u001b[31m\tx\u009by‮z";
	const sLf = sc("refused: an unexpected key holding a line feed, ESC, TAB, U+009B and U+202E", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, { ...base4(), [ODD_KEY]: 1 }) });
	const dirHome = newHome("my-old");
	const sDir = sc("refused: a directory under an agent dir named My (old)", { home: dirHome, kind: "refused", agentEnv: path.join(dirHome, "My (old)", "agent"), file: () => path.join(dirHome, "My (old)", "agent", "nana-pack.json"), arrange: (f) => fs.mkdirSync(f, { recursive: true }) });
	// R-1202, R-1204: the path follows other text here (`dangling symlink: <file>`), so it must be set aside wherever it sits.
	const dangleOldHome = newHome("my-old-dangling");
	const sDangleOld = sc("refused: a dangling symlink under an agent dir named My (old)", { home: dangleOldHome, kind: "refused", agentEnv: path.join(dangleOldHome, "My (old)", "agent"), file: () => path.join(dangleOldHome, "My (old)", "agent", "nana-pack.json"), arrange: (f) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.symlinkSync(path.join(path.dirname(f), "missing-target.json"), f); } });
	const sDangle = sc("refused: a dangling symlink in the home folder", { kind: "refused", file: homeAgent, arrange: (f) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.symlinkSync(path.join(path.dirname(f), "missing-target.json"), f); } });
	{
		const outside = path.join(scratch, "outside-dangling", "agent");
		sc("refused: a dangling symlink outside the home folder (absolute)", { kind: "refused", agentEnv: outside, file: () => path.join(outside, "nana-pack.json"), arrange: (f) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.symlinkSync(path.join(path.dirname(f), "missing-target.json"), f); } });
	}
	const sArr = sc("refused: a top level that is not an object", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, null, "[]") });
	sc("refused: over the bounded-read cap", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, null, `${JSON.stringify({ roster: base4() })}${" ".repeat(1024 * 1024 + 1)}`) });
	if (process.getuid?.() !== 0) sc("refused: unreadable (mode 000)", { kind: "refused", file: homeAgent, arrange: (f) => { writeRoster(f, base4()); fs.chmodSync(f, 0o000); restore.push(() => fs.chmodSync(f, 0o644)); } });
	sc("refused: a Claude Code model outside the four", { kind: "refused", file: homeAgent, arrange: (f) => writeRoster(f, withLarger({ runtime: "claude-code", model: "sonnet-4-full" })) });

	out("(harness) the roster command gives a refusal problem for every refused scenario", scenarios.filter((s) => s.kind === "refused" && typeof s.problem !== "string").map((s) => s.label), []);
	{
		const t = (s) => tildeIn(s.home)(s.file);
		const sh = (s) => (typeof s.problem === "string" ? shownProblem(s.problem, s.file, tildeIn(s.home)) : null);
		out("(guard) this script's R-1202 transform of the resolver's problems: invalid JSON, a trailing comma, a value echo, a control-character key, a directory and a dangling symlink under My (old), a dangling symlink, a non-object",
			[sh(sJson), sh(sTrail), sh(sEcho), sh(sLf), sh(sDir), sh(sDangleOld), sh(sDangle), sh(sArr)],
			["invalid JSON", "invalid JSON", "roster.builder.thinking must be one of pi's thinking levels or null", "roster has an unexpected field odd key [31m x y z", `${t(sDir)} is a directory, not a regular file`, `dangling symlink: ${t(sDangleOld)}`, `dangling symlink: ${t(sDangle)}`, "top level is not an object"]);
		out("(harness) the raw problems hold what the cut must remove: the leaked and echoed provider strings, two ' (' in the trailing-comma problem, the line feed, ESC, TAB, U+009B and U+202E, and ' (' inside the My (old) dangling path",
			[String(sJson.problem).includes(PV_LEAK), String(sEcho.problem).includes(PV[2]), (String(sTrail.problem).match(/ \(/g) ?? []).length >= 2, ["\n", "\u001b", "\t", "\u009b", "‮"].filter((c) => !String(sLf.problem).includes(c)).length, String(sDangleOld.problem).startsWith("dangling symlink: ") && String(sDangleOld.problem).includes(" (old)")],
			[true, true, true, 0, true], JSON.stringify([sTrail.problem, sDangleOld.problem]));
		out("(harness) the value-echo scenario's composed notice equals §3.4's refused example", sValue.L, REFUSED_EXAMPLE);
		out("(harness) the default scenario's composed notice equals §3.4's default example", sDefault.L, DEFAULT_EXAMPLE);
	}
	for (const s of scenarios) {
		out(`(n) ${s.label}: the hook's context, the extension's widget and pi's RPC widget each read the composed notice (R-1211)`, { hook: ctxOf(s.hook), ext: extStartup(s.ext), rpc: rpcLine(s.rpc) }, { hook: s.L, ext: s.L, rpc: s.L });
	}
	{
		const shown = scenarios.map((s) => ({ s, L: ctxOf(s.hook) })).filter(({ L }) => typeof L === "string" && L.startsWith(PREFIX));
		// Each property reports how many notices it judged, so a run where no hook printed one reads red, not vacuously ok.
		const judged = (pred, pool = shown) => ({ judged: pool.length, failing: pool.filter(pred).map(({ s }) => s.label) });
		const all = (pool = scenarios) => ({ judged: pool.length, failing: [] });
		out("(n) every scenario's hook printed a notice that starts with the prefix (R-1194)", scenarios.filter((s) => !(typeof ctxOf(s.hook) === "string" && ctxOf(s.hook).startsWith(PREFIX))).map((s) => s.label), []);
		out("(n) every notice is one line that ends with the change pointer and the roster file, ~ for the home folder (R-1194, R-1203, R-1204)",
			judged(({ s, L }) => /[\r\n]/.test(L) || !L.endsWith(`${SEP}${POINTER} ${tildeIn(s.home)(s.file)}`)), all());
		out("(n) no notice holds a fixture provider string, the model id that holds its provider excepted as a whole token (R-1195)",
			judged(({ s, L }) => ALL_PV.some((p) => (s.allowModel ? L.split(s.allowModel).join("") : L).includes(p))), all());
		out("(n) the model id that holds its provider prints whole (R-1195)", shown.filter(({ s }) => s.allowModel).map(({ L }) => L.includes(`builder ${PV_ECHO_MODEL},`)), [true]);
		const underHome = (pool) => pool.filter(({ s }) => s.file.startsWith(s.home + path.sep));
		out("(n) no notice for a roster file under a home folder holds that absolute home path (R-1204)", judged(({ s, L }) => L.includes(s.home), underHome(shown)), all(underHome(scenarios.map((s) => ({ s })))));
		out("(n) no notice names the scout: no scout word and no scout model (R-1199)", judged(({ L, s }) => /\bscout\b/i.test(L) || L.includes(SCOUT_MODEL) || Boolean(s.scoutModel && L.includes(s.scoutModel))), all());
		const refusedOnly = (pool) => pool.filter(({ s }) => s.kind === "refused");
		out("(n) no refused notice holds an echoed value or a ' (' outside its path (R-1202)", judged(({ s, L }) => L.includes("(got") || L.split(tildeIn(s.home)(s.file)).join("").includes(" ("), refusedOnly(shown)), all(refusedOnly(scenarios.map((s) => ({ s })))));
		out("(n) only the default scenarios carry (default) after roster (R-1201)", judged(({ s, L }) => L.startsWith(`${PREFIX} (default):`) !== (s.kind === "default")), all());
		const relOnly = (pool) => pool.filter(({ s }) => s.kind === "relative");
		// The prefix itself holds ` · `, so the lineup segment is the text between the prefix and the change pointer.
		const namesLineup = (L) => /\b(builders?|reviewer|land) /.test(L.slice(PREFIX.length).split(SEP)[0]);
		out("(harness) the lineup predicate is true for a lineup notice and false for §3.4's relative example", [namesLineup(`${PREFIX}: builder a, reviewer b, land c${SEP}${POINTER} ~/f`), namesLineup(`${PREFIX} (default): builder a, reviewer b, land seat${SEP}${POINTER} ~/f`), namesLineup(RELATIVE_EXAMPLE ?? "")], [true, true, false]);
		out("(n) no relative-agent-dir notice names a lineup (R-1215)", judged(({ L }) => namesLineup(L), relOnly(shown)), all(relOnly(scenarios.map((s) => ({ s })))));
	}
	// R-1210: the extension's reasons and the no-UI case, a file and a refused roster.
	for (const s of [sPlain, sValue, sRelFile]) {
		const got = s.ext.loadError ? `extension did not load: ${s.ext.loadError}` : s.ext.cases.map((c) => ({ case: `${c.reason}${c.hasUI ? "" : " (no UI)"}`, calls: uiSummary(c.calls), threw: c.threw }));
		const want = EXT_CASES.map(([reason, hasUI]) => ({ case: `${reason}${hasUI ? "" : " (no UI)"}`, calls: hasUI && SHOWN_PI_REASONS.includes(reason) ? widgetWant(s.L) : [], threw: null }));
		out(`(n) extension, ${s.label}: startup, new, resume and fork with a UI each set one ${WIDGET_KEY} widget holding only the notice; reload and no UI set nothing; nothing notifies or throws (R-1210)`, got, want);
	}
	out("(n) pi in RPC mode sends exactly one setWidget request and no notify for every scenario (R-1210, §5 Seat acceptance)", scenarios.filter((s) => !(s.rpc.requests?.length === 1 && s.rpc.requests[0].m === "setWidget")).map((s) => s.label), []);
	// §3.9 "no pi prompt section" (and §3.6's one handler): the extension registers session_start and nothing else.
	out("(n) the extension registers only session_start: no before_agent_start prompt section or other handler (§3.6, §3.9)", sPlain.ext.loadError ? `extension did not load: ${sPlain.ext.loadError}` : sPlain.ext.events, ["session_start"]);
	// §3.6 "It never throws": config-handlers-malformed.test.mjs's fake UI has notify and setStatus but no setWidget.
	out("(n) with a UI that has notify and setStatus but no setWidget, the extension's startup throws nothing and calls nothing (§3.6; config-handlers-malformed.test.mjs's fake UI)", sPlain.ext.loadError ? `extension did not load: ${sPlain.ext.loadError}` : sPlain.ext.noWidgetUi, { calls: [], threw: null });
	out("(n) config-handlers-malformed.test.mjs's extension list names nana-roster-notice (§5.2)", /const EXT = \[[^\]]*"nana-roster-notice"[^\]]*\]/.test(text("packages/nana-pack/tests/config-handlers-malformed.test.mjs") ?? ""), true);
	{
		// R-1210, R-1211: the notice is the current file's at each start, so a roster edit between startup and /new in one pi process shows.
		const h = newHome("edit-between-starts");
		const cwd = path.join(h, "project");
		fs.mkdirSync(cwd, { recursive: true });
		const file = writeRoster(homeAgent(h), base4());
		const before = DEF ? expectNotice({ kind: "file", roster: base4(), file, home: h }) : null;
		const after = DEF ? expectNotice({ kind: "file", roster: lgPiR, file, home: h }) : null;
		out("(n) one registration, one process: startup shows the file's lineup, and after the roster file is rewritten a new session start shows the new lineup (R-1210, R-1211; composed per start, not once at load)",
			extEditProbe(envFor(h), cwd, file, `${JSON.stringify({ roster: lgPiR }, null, 2)}\n`), [before, after]);
	}
	// §3.6, §3.9 "no NANA_ROLE check in either seat": a role in the environment changes nothing in the hook, the extension or pi.
	for (const role of ["worker", "reviewer"]) {
		const env = { ...sPlain.env, NANA_ROLE: role };
		const h = runHook(env, sPlain.cwd, hookInput("startup", sPlain.cwd));
		out(`(n) NANA_ROLE=${role}: the hook's user message and context, the extension's widget and pi's RPC widget each still read the notice (§3.6, §3.9)`,
			{ hookUser: h.obj && typeof h.obj === "object" ? h.obj.systemMessage ?? "(no systemMessage)" : h.obj, hookContext: ctxOf(h), ext: extStartup(extProbe(env, sPlain.cwd)), rpc: rpcLine(rpcProbe(env, sPlain.cwd)) },
			{ hookUser: sPlain.L, hookContext: sPlain.L, ext: sPlain.L, rpc: sPlain.L });
	}
	{
		const cfg = await importFresh(CONFIG_REL);
		const labels = cfg.SIZE_LABELS && typeof cfg.SIZE_LABELS === "object" ? Object.values(cfg.SIZE_LABELS) : [];
		const got = cfg.__error ? cfg.__error : { NOTICE_PREFIX: cfg.NOTICE_PREFIX, DEFAULT_MARK: cfg.DEFAULT_MARK, REFUSED_HEAD: cfg.REFUSED_HEAD, CLAUDE_CODE_MARK: cfg.CLAUDE_CODE_MARK, WIDGET_KEY: cfg.WIDGET_KEY, CHANGE_POINTER: cfg.CHANGE_POINTER, REFUSAL_CUT: cfg.REFUSAL_CUT, RELATIVE_DIR_TEXT: cfg.RELATIVE_DIR_TEXT, SHOW_SOURCES: Array.isArray(cfg.SHOW_SOURCES) ? [...cfg.SHOW_SOURCES].sort() : cfg.SHOW_SOURCES, SIZE_LABELS: [...labels].sort() };
		out("(n) roster-notice-config.mjs holds §3.3's values by name", got, { NOTICE_PREFIX: PREFIX, DEFAULT_MARK: "(default)", REFUSED_HEAD: "refused:", CLAUDE_CODE_MARK: CC_MARK, WIDGET_KEY, CHANGE_POINTER: POINTER, REFUSAL_CUT: " (", RELATIVE_DIR_TEXT: RELATIVE_TEXT, SHOW_SOURCES: ["clear", "fork", "new", "resume", "startup"], SIZE_LABELS: ["for larger lanes", "for small lanes"] });
		const lib = await importFresh(LIB_REL);
		out("(n) roster-notice.mjs has one export, rosterNotice (§3.4)", lib.__error ? lib.__error : Object.keys(lib).sort(), ["rosterNotice"]);
	}

	// ---------------------------------------------------------------- (h) the hook's JSON shape, sources and fail-open path (R-1205 to R-1207)
	{
		const L = sPlain.L;
		const shown = (Lx) => ({ status: 0, lines: 1, obj: { systemMessage: Lx, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: Lx } } });
		const ctxOnly = (Lx) => ({ status: 0, lines: 1, obj: { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: Lx } } });
		const pick = (h) => ({ status: h.status, lines: h.lines, obj: h.obj });
		const SOURCES = [
			["startup", hookInput("startup", sPlain.cwd), true], ["resume", hookInput("resume", sPlain.cwd), true], ["fork", hookInput("fork", sPlain.cwd), true], ["clear", hookInput("clear", sPlain.cwd), true],
			["compact", hookInput("compact", sPlain.cwd), false], ["an empty input", "", true], ["a non-JSON input", "{not json", true], ["an input with no source", hookInput(undefined, sPlain.cwd), true],
		];
		for (const [label, input, user] of SOURCES) {
			out(`(h) hook, ${label}: exit 0 and exactly one JSON object, the notice as SessionStart context${user ? " and as the user message" : " and no user message"} (R-1205, R-1206)`, pick(runHook(sPlain.env, sPlain.cwd, input)), user ? shown(L) : ctxOnly(L));
		}
		out("(h) hook, a refused roster on compact: context only, exit 0 (R-1205, R-1206)", pick(runHook(sJson.env, sJson.cwd, hookInput("compact", sJson.cwd))), ctxOnly(sJson.L));
		out("(h) hook, a relative agent dir on resume: the unknown line in both fields (R-1205, R-1215)", pick(runHook(sRelFile.env, sRelFile.cwd, hookInput("resume", sRelFile.cwd))), shown(sRelFile.L));
		// R-1206 "an input read error included" (and R-1205's exit 0 and one object; R-1207 leaves input reads out): a spawned
		// hook whose stdin is a write-only descriptor fails its read with EBADF, which must count as no source.
		{
			const reader = pathToFileURL(rel("packages/nana-setup/lib/shared-memory-input.mjs")).href;
			const probe = path.join(scratch, "read-stdin-probe.mjs");
			fs.writeFileSync(probe, `import { readHookInput } from ${JSON.stringify(reader)};\ntry { await readHookInput(process.stdin); console.log("read"); } catch (e) { console.log(String(e?.code ?? e?.name)); }\n`);
			out("(harness) a child whose stdin is a write-only descriptor fails readHookInput with EBADF", runWithWriteOnlyStdin(sPlain.env, sPlain.cwd, probe).stdout.trim(), "EBADF");
		}
		out("(h) hook, an input that fails on read (stdin a write-only descriptor): exit 0 and one JSON object, the notice as SessionStart context and as the user message, not the unavailable notice (R-1205, R-1206; pair 65)",
			pick(runWithWriteOnlyStdin(sPlain.env, sPlain.cwd, HOOK)), shown(L));
		out("(h) the hook exports its runner, which, fed an input stream that fails on read, prints the notice as SessionStart context and as the user message (§3.5, R-1206; pair 65)",
			hookRunnerProbe(sPlain.env, sPlain.cwd), { hasRunner: true, obj: shown(L).obj });
		// R-1207: a copy whose module imports cannot resolve.
		const copyDir = path.join(scratch, "hook-copy", "claude", "hooks");
		fs.mkdirSync(copyDir, { recursive: true });
		let copied = false;
		try { fs.copyFileSync(HOOK, path.join(copyDir, HOOK_NAME)); copied = true; } catch { /* the base has no hook: the case below reads red */ }
		const u = copied ? runHook(sPlain.env, sPlain.cwd, hookInput("startup", sPlain.cwd), path.join(copyDir, HOOK_NAME)) : { status: null, lines: 0, obj: "no hook to copy" };
		const sm = u.obj?.systemMessage, ac = u.obj?.hookSpecificOutput?.additionalContext;
		out("(h) a copy of the hook that cannot load its modules exits 0 and prints one JSON object whose systemMessage and SessionStart context both read the unavailable notice with an error code and no path (R-1207)",
			{ status: u.status, lines: u.lines, same: typeof sm === "string" && sm === ac, form: UNAVAILABLE.test(String(sm)), event: u.obj?.hookSpecificOutput?.hookEventName ?? null, noPath: !String(sm).includes("/") && !String(sm).includes(scratch) },
			{ status: 0, lines: 1, same: true, form: true, event: "SessionStart", noPath: true }, JSON.stringify(u.obj).slice(0, 200));
		const src = text(HOOK_REL) ?? "";
		const staticImports = [...src.matchAll(/^\s*import\s+(?:[^'"`;]*?\sfrom\s*)?['"]([^'"]+)['"]/gm)].map((m) => m[1]);
		out("(h) the hook's static imports are node built-ins only (§3.5: the fail-open path cannot rely on an import)", src ? staticImports.filter((s) => !s.startsWith("node:")) : "no hook file", []);
		const spawners = [HOOK_REL, EXT_REL, LIB_REL, CONFIG_REL].filter((p) => /child_process/.test(text(p) ?? "child_process"));
		out("(h) the hook, the extension and the notice modules start no child process and make no git call (§3.5, §3.6, §3.9)", spawners, []);
	}

	// ---------------------------------------------------------------- (r) the roster resolver and command (R-1121 to R-1123, R-1192)
	const project = path.join(scratch, "roster-project");
	fs.mkdirSync(project);
	const rosterCmd = (agentDir, args = []) => {
		const r = spawnSync(process.execPath, [NANA_ROSTER, ...args], { cwd: project, env: envFor(path.join(scratch, "roster-home"), agentDir), encoding: "utf8", timeout: 30_000 });
		return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
	};
	let agentCount = 0;
	const newAgent = (label, roster, raw = null) => { const d = path.join(scratch, "agents", `${++agentCount}-${label.replace(/\W+/g, "-").slice(0, 30)}`); fs.mkdirSync(d, { recursive: true }); const f = path.join(d, "nana-pack.json"); if (roster !== undefined || raw !== null) writeRoster(f, roster, raw); return { dir: d, file: f }; };
	const slotLine = (slot, v) => (v === null ? `${slot}: ${slot === "land" ? "seat" : "none"}` : v.runtime === "claude-code" ? `${slot}: claude-code ${v.model}` : `${slot}: ${v.provider} ${v.model} ${v.thinking ?? "default"}`);
	const wantLines = (r, source) => [...PRINT_ORDER.map((s) => slotLine(s, r[s] ?? null)), `source: ${source}`];
	const wantJson = (r) => ({ roster: Object.fromEntries(PRINT_ORDER.map((s) => [s, r[s] ?? null])) });
	const parseJson = (s) => { try { return JSON.parse(s); } catch { return `not one JSON value: ${JSON.stringify(s.slice(0, 120))}`; } };
	const jsonCase = (res) => (res.status !== 0 ? `exit ${res.status}: ${res.stderr.slice(0, 160)}` : (() => { const v = parseJson(res.stdout); return typeof v === "string" ? v : { keys: Object.keys(v), slots: v.roster && typeof v.roster === "object" ? Object.keys(v.roster) : null, value: v }; })());
	const jsonWant = (r) => ({ keys: ["roster"], slots: PRINT_ORDER, value: wantJson(r) });
	{
		const a = newAgent("absent");
		out("(r) no file: the roster command prints the default roster with largerBuilder: none after the builder, source default (R-1123, D1 null)", [rosterCmd(a.dir).status, lines(rosterCmd(a.dir).stdout)], [0, DEF ? wantLines(DEF, "default") : null]);
		out("(r) no file: --json prints one object holding only roster, every slot in print order, largerBuilder null (R-1192)", jsonCase(rosterCmd(a.dir, ["--json"])), DEF ? jsonWant(DEF) : null);
		const s = newAgent("seed", undefined, seedText);
		out("(r) the installer's seed (objective only): the default roster, source default (R-1120, R-1123)", lines(rosterCmd(s.dir).stdout), DEF ? wantLines(DEF, "default") : null);
		const accepted = [
			["no largerBuilder (four slots)", base4(), { ...base4(), largerBuilder: null }],
			["largerBuilder null", withLarger(null), withLarger(null)],
			["a pi largerBuilder", lgPi, lgPi],
			["a pi largerBuilder with null thinking", withLarger(pe(PV[3], "mdl-large", null)), withLarger(pe(PV[3], "mdl-large", null))],
			...CC_MODELS.map((m) => [`a Claude Code largerBuilder ${m}`, withLarger({ runtime: "claude-code", model: m }), withLarger({ runtime: "claude-code", model: m })]),
		];
		for (const [label, written, resolved] of accepted) {
			const ag = newAgent(label, written);
			const plain = rosterCmd(ag.dir);
			out(`(r) ${label}: accepted; the roster command prints every slot as written, largerBuilder after the builder, source the file (R-1121, R-1122, R-1123)`, [plain.status, lines(plain.stdout)], [0, wantLines(resolved, ag.file)], plain.stderr);
			out(`(r) ${label}: --json prints the resolved roster, an absent largerBuilder as null (R-1121, R-1192)`, jsonCase(rosterCmd(ag.dir, ["--json"])), jsonWant(resolved));
		}
		{
			// R-1121 "reading an absent larger-lane builder as null" (§3.1: the resolver returns a normalised copy). The CLI,
			// --json and pi-worker may each coalesce, so the resolver is read directly. Key ORDER is R-1192's, on the --json
			// surface above; the resolver's contract is the key set.
			const NR = await importFresh("packages/nana-pack/bin/nana-roster.mjs");
			const four = newAgent("resolver-four", base4());
			let got;
			try { const res = NR.__error ? null : NR.resolveRoster(four.dir); got = NR.__error ?? (res?.ok ? { hasKey: "largerBuilder" in res.roster, value: res.roster.largerBuilder === undefined ? "(undefined)" : res.roster.largerBuilder, keys: Object.keys(res.roster).sort() } : { refused: res?.problem ?? null }); } catch (e) { got = `resolveRoster threw: ${e?.message ?? e}`; }
			out("(r) resolveRoster on a four-slot file returns a roster that holds largerBuilder as null beside the four slots (R-1121, §3.1; pair 40)", got, { hasKey: true, value: null, keys: [...PRINT_ORDER].sort() });
		}
		// N2's refusal kinds. Each must name the file and the dotted slot (or field) R-1122 names; the base's
		// "unexpected field largerBuilder" names neither `roster.largerBuilder` nor `roster.largerBuilder.model`.
		const cc = (o) => ({ runtime: "claude-code", ...o });
		const REFUSE = [
			["largerBuilder a string", withLarger("sonnet"), ["roster.largerBuilder"]],
			["largerBuilder an array", withLarger([]), ["roster.largerBuilder"]],
			// A falsy value is not null: R-1122 allows a pi entry, a Claude Code entry or null.
			["largerBuilder an empty string", withLarger(""), ["roster.largerBuilder"]],
			["largerBuilder false", withLarger(false), ["roster.largerBuilder"]],
			["largerBuilder 0", withLarger(0), ["roster.largerBuilder"]],
			["runtime claude", withLarger({ runtime: "claude", model: "sonnet" }), ["roster.largerBuilder"]],
			["a Claude Code entry with thinking", withLarger(cc({ model: "sonnet", thinking: "high" })), ["roster.largerBuilder", "thinking"]],
			["a Claude Code entry without model", withLarger(cc({})), ["roster.largerBuilder", "model"]],
			["a Claude Code entry with an effort field", withLarger(cc({ model: "sonnet", effort: "high" })), ["roster.largerBuilder", "effort"]],
			["a full model name", withLarger(cc({ model: "sonnet-4-full" })), ["roster.largerBuilder.model"]],
			["a bracketed variant sonnet[1m]", withLarger(cc({ model: "sonnet[1m]" })), ["roster.largerBuilder.model"]],
			["a model with a space", withLarger(cc({ model: "son net" })), ["roster.largerBuilder.model"]],
			["a model differing in case (Sonnet)", withLarger(cc({ model: "Sonnet" })), ["roster.largerBuilder.model"]],
			["a pi largerBuilder missing thinking", withLarger({ provider: PV[3], model: "mdl-large" }), ["roster.largerBuilder", "thinking"]],
			["a pi largerBuilder with an empty model", withLarger(pe(PV[3], "", "high")), ["roster.largerBuilder.model"]],
			["a pi largerBuilder with a runtime field", withLarger({ runtime: "pi", ...pe(PV[3], "mdl-large", "high") }), ["roster.largerBuilder"]],
		];
		for (const [label, roster, tokens] of REFUSE) {
			const ag = newAgent(`refuse-${label}`, roster);
			const r = rosterCmd(ag.dir);
			out(`(r) refused, ${label}: exit 1, empty stdout, stderr names the file and ${tokens.join(" and ")} (R-1122)`, [r.status, r.stdout, r.stderr.includes(ag.file), tokens.filter((t) => !r.stderr.includes(t))], [1, "", true, []], r.stderr);
		}
		// A runtime field in any other slot: today's resolver already refuses it naming the slot, so these hold at the base.
		for (const slot of ["builder", "reviewer", "scout", "land"]) {
			const ag = newAgent(`runtime-${slot}`, { ...base4(), [slot]: cc({ model: "sonnet" }) });
			const r = rosterCmd(ag.dir);
			out(`(guard) refused, a Claude Code entry in ${slot}: exit 1, empty stdout, stderr names the file and roster.${slot} (R-1122)`, [r.status, r.stdout, r.stderr.includes(ag.file), r.stderr.includes(`roster.${slot}`)], [1, "", true, true], r.stderr);
		}
		const bj = newAgent("json-refused", { ...base4(), builder: pe(PV[1], "mdl-build", "ultra") });
		const rj = rosterCmd(bj.dir, ["--json"]);
		out("(guard) --json with a refused roster: exit 1, empty stdout, the refusal on stderr naming the file (R-1192; the base ignores --json and already does this)", [rj.status, rj.stdout, rj.stderr.includes(bj.file)], [1, "", true], rj.stderr);
		// R-1192 read-back, as the README tells it (§3.8): set the file's roster member to the printed roster value, keep every other key.
		const seedObj = (() => { try { return JSON.parse(seedText); } catch { return null; } })();
		out("(harness) the installer's seed parses, holds objective and no roster", [Boolean(seedObj?.objective), seedObj?.roster === undefined], [true, true]);
		const readBack = (label, startJson, expectRoster) => {
			const ag = newAgent(`readback-${label}`, undefined, seedText);
			const printed = parseJson(rosterCmd(startJson.dir, ["--json"]).stdout);
			let after = null, plainAfter = null, kept = null;
			if (printed && typeof printed === "object" && printed.roster) {
				const obj = JSON.parse(fs.readFileSync(ag.file, "utf8"));
				obj.roster = printed.roster;
				fs.writeFileSync(ag.file, `${JSON.stringify(obj, null, "\t")}\n`);
				after = parseJson(rosterCmd(ag.dir, ["--json"]).stdout);
				plainAfter = lines(rosterCmd(ag.dir).stdout).at(-1) ?? null;
				kept = canon(JSON.parse(fs.readFileSync(ag.file, "utf8")).objective) === canon(seedObj?.objective);
			}
			out(`(r) --json read-back, ${label}: its roster value, set as the roster member of a file holding the installer's seed, resolves to the same roster from that file, objective kept (R-1192, N4)`,
				[typeof printed === "object" ? canon(printed) === canon(wantJson(expectRoster)) : printed, after === null ? null : canon(after) === canon(printed), plainAfter, kept], [true, true, `source: ${ag.file}`, true]);
			return ag;
		};
		const rb = readBack("the default roster", newAgent("readback-src-default"), DEF ?? {});
		const fileSrc = newAgent("readback-src-file", lgPi);
		readBack("a file roster with a pi largerBuilder", fileSrc, lgPi);
		// Then "change one value": the read-back file takes a Claude Code largerBuilder.
		let changed = null;
		try { const obj = JSON.parse(fs.readFileSync(rb.file, "utf8")); obj.roster.largerBuilder = { runtime: "claude-code", model: "opus" }; fs.writeFileSync(rb.file, JSON.stringify(obj)); changed = lines(rosterCmd(rb.dir).stdout); } catch (e) { changed = `edit failed: ${e.message}`; }
		out("(r) after the read-back, changing one value (largerBuilder to Claude Code opus) resolves (R-1121, §3.8)", changed, DEF ? wantLines({ ...DEF, largerBuilder: { runtime: "claude-code", model: "opus" } }, rb.file) : null);
		const wc = await importFresh("packages/nana-pack/bin/worker-config.mjs");
		out("(r) worker-config.mjs holds §3.3's names and values, ROSTER_DEFAULTS.largerBuilder null (D1's recommended default)",
			wc.__error ? wc.__error : { OPTIONAL_SLOTS: wc.OPTIONAL_SLOTS, CLAUDE_CODE_SLOTS: wc.CLAUDE_CODE_SLOTS, SLOT_PRINT_ORDER: wc.SLOT_PRINT_ORDER, CLAUDE_CODE_RUNTIME: wc.CLAUDE_CODE_RUNTIME, CLAUDE_CODE_SUBAGENT_MODELS: wc.CLAUDE_CODE_SUBAGENT_MODELS, LANE_SIZE_SLOTS: wc.LANE_SIZE_SLOTS, LARGER_BUILDER_LABEL: wc.LARGER_BUILDER_LABEL, largerDefault: wc.ROSTER_DEFAULTS && "largerBuilder" in wc.ROSTER_DEFAULTS ? wc.ROSTER_DEFAULTS.largerBuilder : "(absent)" },
			{ OPTIONAL_SLOTS: ["largerBuilder"], CLAUDE_CODE_SLOTS: ["largerBuilder"], SLOT_PRINT_ORDER: PRINT_ORDER, CLAUDE_CODE_RUNTIME: "claude-code", CLAUDE_CODE_SUBAGENT_MODELS: CC_MODELS, LANE_SIZE_SLOTS: { small: "builder", larger: "largerBuilder" }, LARGER_BUILDER_LABEL: "builder (larger lanes)", largerDefault: null });
	}

	// ---------------------------------------------------------------- (w) lane mode with a stub pi (R-1190, R-1191, R-1212, R-960, R-1124)
	{
		const stubBin = path.join(scratch, "stub-bin");
		fs.mkdirSync(stubBin);
		const stubJs = path.join(scratch, "stub-pi.mjs");
		fs.writeFileSync(stubJs, `import fs from "node:fs";\nconst record = process.env.ROSTER_ACCEPT_RECORD;\nif (record) fs.appendFileSync(record, JSON.stringify({ argv: process.argv.slice(2) }) + "\\n");\nconsole.log("stub pi: done");\n`);
		fs.writeFileSync(path.join(stubBin, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${stubJs}" "$@"\n`);
		fs.chmodSync(path.join(stubBin, "pi"), 0o755);
		const wHome = path.join(scratch, "lane-home");
		fs.mkdirSync(wHome);
		const gitIn = (cwd, ...args) => spawnSync("git", ["-c", "user.name=seat", "-c", "user.email=seat@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", env: { ...cleanEnv(), HOME: wHome } });
		const repo = path.join(scratch, "lane-repo"), lane = path.join(scratch, "lane-wt");
		const LANE = "notice-accept";
		fs.mkdirSync(repo);
		gitIn(repo, "init", "-q", "-b", "main");
		fs.writeFileSync(path.join(repo, "seed.txt"), "seed\n");
		gitIn(repo, "add", "seed.txt");
		gitIn(repo, "commit", "-qm", "seed");
		gitIn(repo, "worktree", "add", "-qb", `feat/${LANE}`, lane);
		let laneLock = null;
		try { laneLock = path.join(fs.realpathSync(path.resolve(lane, gitIn(lane, "rev-parse", "--git-dir").stdout.trim())), "nana-lane.lock"); } catch { /* reported below */ }
		const brief = path.join(scratch, "brief.md");
		fs.writeFileSync(brief, "Acceptance brief: do nothing.\n");
		const briefReal = fs.realpathSync(brief);
		const INSTRUCTION = `Do the work in your brief for lane ${LANE}. Your cwd is the lane worktree. Finish with the report shape the brief gives.`;
		let runCount = 0;
		const readRecord = (file) => { try { return fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
		const laneRun = (agentDir, extra = [], { preLock = false } = {}) => {
			const record = path.join(scratch, `record-${++runCount}.jsonl`);
			const outFile = path.join(scratch, `out-${runCount}.md`);
			if (preLock && laneLock) fs.writeFileSync(laneLock, "424242\n");
			const r = spawnSync(process.execPath, [PI_WORKER, "--poll", "0.1", "--stall-secs", "10", "--out", outFile, "--lane", LANE, "--brief", brief, ...extra], { cwd: lane, env: envFor(wHome, agentDir, { ROSTER_ACCEPT_RECORD: record, PATH: `${stubBin}${path.delimiter}${process.env.PATH}` }), encoding: "utf8", timeout: 60_000 });
			const lockText = laneLock && fs.existsSync(laneLock) ? fs.readFileSync(laneLock, "utf8") : null;
			if (preLock && laneLock) fs.rmSync(laneLock, { force: true });
			const calls = readRecord(record);
			return { status: r.status, stderr: r.stderr ?? "", calls, argv: calls[0]?.argv ?? null, lockText };
		};
		const builderLines = (stderr) => stderr.split(/\r?\n/).filter((l) => l.startsWith("pi-worker: builder"));
		const lineFirst = (stderr) => { const i = stderr.indexOf("pi-worker: builder"), j = stderr.indexOf("[pi-worker] attempt 1/1"); return i >= 0 && j >= 0 && i < j; };
		const normalise = (argv) => (argv ?? []).map((a, i, all) => (all[i - 1] === "--name" ? "<name>" : all[i - 1] === "--append-system-prompt" && all.indexOf("--append-system-prompt") === i - 1 ? "<preamble>" : a));
		const laneArgv = (b) => ["--provider", b.provider, "--model", b.model, ...(b.thinking === null ? [] : ["--thinking", b.thinking]), "-t", TOOLS, "--append-system-prompt", "<preamble>", "--append-system-prompt", briefReal, "-p", INSTRUCTION, "--name", "<name>"];
		const started = (r, b, line) => ({ status: r.status, calls: r.calls.length, argv: normalise(r.argv), lines: builderLines(r.stderr), first: lineFirst(r.stderr), lock: r.lockText });
		const startedWant = (b, line) => ({ status: 0, calls: 1, argv: laneArgv(b), lines: [line], first: true, lock: null });
		const refusedWith = (r, textWant) => ({ status: r.status, calls: r.calls.length, says: r.stderr.includes(textWant), lockMessage: /worktree lock/.test(r.stderr), lock: r.lockText });
		const agentWith = (label, roster) => newAgent(`lane-${label}`, roster);
		out("(harness) the scratch lane worktree is on its feat/ branch and its lock path resolved", [gitIn(lane, "branch", "--show-current").stdout.trim(), laneLock !== null], [`feat/${LANE}`, true]);
		const none = newAgent("lane-none");
		if (DEF) {
			const defLine = `pi-worker: builder: ${DEF.builder.provider} ${DEF.builder.model} ${DEF.builder.thinking}; source: default`;
			out("(guard) no roster, no --lane-size: the builder starts as today (R-1124, R-961)", started(laneRun(none.dir)), startedWant(DEF.builder, defLine));
			out("(guard) no roster, --lane-size small: the builder (the base ignores the option; the build reads it)", started(laneRun(none.dir, ["--lane-size", "small"])), startedWant(DEF.builder, defLine));
			out("(guard) no roster, --lane-size larger: a null larger-lane builder falls back to the builder, builder: line (R-1190)", started(laneRun(none.dir, ["--lane-size", "larger"])), startedWant(DEF.builder, defLine));
			const four = agentWith("four", base4());
			out("(guard) a four-slot roster, --lane-size=larger (not an own option): the builder (§3.2)", started(laneRun(four.dir, ["--lane-size=larger"])), startedWant(base4().builder, `pi-worker: builder: ${PV[1]} mdl-build high; source: ${four.file}`));
		}
		const nul = agentWith("null", withLarger(null));
		out("(w) largerBuilder null, --lane-size larger: the builder, builder: line naming the file (R-1190, R-1124)", started(laneRun(nul.dir, ["--lane-size", "larger"])), startedWant(base4().builder, `pi-worker: builder: ${PV[1]} mdl-build high; source: ${nul.file}`));
		const piL = agentWith("pi", lgPi);
		out("(w) a pi largerBuilder, --lane-size larger: pi starts with its provider, model and thinking, each flag once; one larger-lane builder line before attempt 1/1; lock released (R-1190, R-961, R-1124)",
			started(laneRun(piL.dir, ["--lane-size", "larger"])), startedWant(lgPi.largerBuilder, `${LARGER_LINE} ${PV[3]} mdl-large xhigh; source: ${piL.file}`));
		const piN = agentWith("pi-null-thinking", withLarger(pe(PV[3], "mdl-large", null)));
		out("(w) a pi largerBuilder with null thinking, --lane-size larger: no --thinking, the line says default (R-1190, R-1124)",
			started(laneRun(piN.dir, ["--lane-size", "larger"])), startedWant(pe(PV[3], "mdl-large", null), `${LARGER_LINE} ${PV[3]} mdl-large default; source: ${piN.file}`));
		out("(w) a pi largerBuilder, --lane-size small: the builder, builder: line (R-1190, R-1124)", started(laneRun(piL.dir, ["--lane-size", "small"])), startedWant(lgPi.builder, `pi-worker: builder: ${PV[1]} mdl-build high; source: ${piL.file}`));
		const ccL = agentWith("cc", withLarger({ runtime: "claude-code", model: "sonnet" }));
		out("(w) a Claude Code largerBuilder, --lane-size small: the builder (R-1190)", started(laneRun(ccL.dir, ["--lane-size", "small"])), startedWant(base4().builder, `pi-worker: builder: ${PV[1]} mdl-build high; source: ${ccL.file}`));
		out("(w) a Claude Code largerBuilder, --lane-size larger: exit 1, no pi, no lock left, §3.2's text with both ways out as the user's choice (R-1191)",
			refusedWith(laneRun(ccL.dir, ["--lane-size", "larger"]), R1191_TEXT ?? "(no text)"), { status: 1, calls: 0, says: true, lockMessage: false, lock: null });
		out("(w) the same with a worktree lock already held: refused by R-1191's text, not the lock, and the lock untouched (before the lock, R-1191)",
			refusedWith(laneRun(ccL.dir, ["--lane-size", "larger"], { preLock: true }), R1191_TEXT ?? "(no text)"), { status: 1, calls: 0, says: true, lockMessage: false, lock: "424242\n" });
		for (const [label, ag, extra] of [["a pi largerBuilder, no --lane-size", piL, []], ["a Claude Code largerBuilder, no --lane-size", ccL, []], ["a pi largerBuilder, --lane-size=larger", piL, ["--lane-size=larger"]]]) {
			out(`(w) ${label}: exit 1, no pi, no lock left, §3.2's no-size text naming largerBuilder and both sizes (R-1212)`, refusedWith(laneRun(ag.dir, extra), R1212_TEXT ?? "(no text)"), { status: 1, calls: 0, says: true, lockMessage: false, lock: null });
		}
		out("(w) a pi largerBuilder, no --lane-size, with a worktree lock already held: R-1212's text, not the lock, and the lock untouched (before the lock)",
			refusedWith(laneRun(piL.dir, [], { preLock: true }), R1212_TEXT ?? "(no text)"), { status: 1, calls: 0, says: true, lockMessage: false, lock: "424242\n" });
		const valueRefusal = (r) => ({ status: r.status, calls: r.calls.length, lane: /pi-worker: lane refused: .*(--lane-size|lane size)/i.test(r.stderr), lockMessage: /worktree lock/.test(r.stderr), lock: r.lockText });
		out("(w) --lane-size bogus: exit 1 before pi, a lane refusal naming --lane-size (R-960)", valueRefusal(laneRun(none.dir, ["--lane-size", "bogus"])), { status: 1, calls: 0, lane: true, lockMessage: false, lock: null });
		out("(w) --lane-size bogus with a worktree lock already held: refused for the value, not the lock (§3.2: before the lock)", valueRefusal(laneRun(none.dir, ["--lane-size", "bogus"], { preLock: true })), { status: 1, calls: 0, lane: true, lockMessage: false, lock: "424242\n" });
		out("(w) --lane-size with no value (last argument): exit 1 before pi, naming --lane-size (R-960)", valueRefusal(laneRun(none.dir, ["--lane-size"])), { status: 1, calls: 0, lane: true, lockMessage: false, lock: null });
		const mid = (() => { const record = path.join(scratch, `record-${++runCount}.jsonl`); const r = spawnSync(process.execPath, [PI_WORKER, "--poll", "0.1", "--stall-secs", "10", "--out", path.join(scratch, "out-mid.md"), "--lane", LANE, "--lane-size", "--brief", brief], { cwd: lane, env: envFor(wHome, none.dir, { ROSTER_ACCEPT_RECORD: record, PATH: `${stubBin}${path.delimiter}${process.env.PATH}` }), encoding: "utf8", timeout: 60_000 }); return { status: r.status, stderr: r.stderr ?? "", calls: readRecord(record), lockText: null }; })();
		out("(w) --lane-size followed by --brief (no value): exit 1 before pi, naming --lane-size (R-960)", valueRefusal(mid), { status: 1, calls: 0, lane: true, lockMessage: false, lock: null });
		{
			// R-1212 is lane mode only, and the pack README says the non-lane worker reads no roster.
			const record = path.join(scratch, `record-${++runCount}.jsonl`);
			const plainCwd = path.join(scratch, "non-lane-cwd");
			fs.mkdirSync(plainCwd, { recursive: true });
			const r = spawnSync(process.execPath, [PI_WORKER, "--poll", "0.1", "--stall-secs", "10", "--out", path.join(scratch, "out-non-lane.md"), "--", "-p", "hi"], { cwd: plainCwd, env: envFor(wHome, piL.dir, { ROSTER_ACCEPT_RECORD: record, PATH: `${stubBin}${path.delimiter}${process.env.PATH}` }), encoding: "utf8", timeout: 60_000 });
			const calls = readRecord(record);
			out("(guard) a non-lane pi-worker launch with a pi largerBuilder set reads no roster: exit 0, pi gets only the caller's arguments and the watchdog's --name, no builder line (R-1212 is lane mode only; pack README)",
				{ status: r.status, calls: calls.length, argv: normalise(calls[0]?.argv), lines: builderLines(r.stderr ?? "") }, { status: 0, calls: 1, argv: ["-p", "hi", "--name", "<name>"], lines: [] }, r.stderr);
		}
	}

	// ---------------------------------------------------------------- (i) installer wiring (R-1208, R-1209, R-301, R-1051, R-954, R-1081)
	{
		const S = await importFresh("packages/nana-setup/lib/settings.mjs");
		const weird = "/r w$%'x";
		const posix = S.desiredHooks ? S.desiredHooks({ hooksDir: "/h", repoRoot: "/r", platform: "darwin" }) : [];
		const bare = S.desiredHooks ? S.desiredHooks({ hooksDir: "/h", repoRoot: "/r" }) : [];
		const w32 = S.desiredHooks ? S.desiredHooks({ hooksDir: "/h", repoRoot: weird, platform: "win32" }) : [];
		const find = (list) => list.filter((w) => w.spec?.script === HOOK_NAME);
		const sessionStart = (list) => list.filter((w) => w.event === "SessionStart");
		const shq = (p) => `'${String(p).replace(/'/g, `'\\''`)}'`;
		const pick = (w) => (w ? { event: w.event, matcherKey: "matcher" in w, label: w.label, entry: w.entry } : null);
		// §3.9 "no change to the other hooks": the base's own settings.mjs and install-check-config.mjs (node built-ins only,
		// copied out of the merge base) give every base entry and the sealed SessionStart timeout. R-1208 says "the timeout of
		// the other SessionStart entries"; pinning it to the base's sealed value stops a build that moves all of them together.
		const baseLib = path.join(scratch, "base-lib");
		fs.mkdirSync(baseLib, { recursive: true });
		const fromBase = async (p) => { const t = atBase(p); if (t === null) return { __error: `${p} absent at the base` }; const f = path.join(baseLib, path.basename(p)); fs.writeFileSync(f, t); try { return await import(pathToFileURL(f).href); } catch (e) { return { __error: String(e?.code ?? e?.message ?? e) }; } };
		const SB = await fromBase("packages/nana-setup/lib/settings.mjs");
		const ICB = await fromBase("packages/nana-setup/lib/install-check-config.mjs");
		const SEALED_TIMEOUT = Array.isArray(ICB.HOOKS) ? ICB.HOOKS.find((h) => h.script === "nana-objective.mjs")?.timeout ?? null : null;
		const baseP = SB.desiredHooks ? SB.desiredHooks({ hooksDir: "/h", repoRoot: "/r", platform: "darwin" }) : [];
		const baseW = SB.desiredHooks ? SB.desiredHooks({ hooksDir: "/h", repoRoot: weird, platform: "win32" }) : [];
		out("(harness) the base's install-check table gives the sealed SessionStart timeout, and the base's desiredHooks gives five entries on each platform", [typeof SEALED_TIMEOUT, baseP.length, baseW.length], ["number", 5, 5], `${SB.__error ?? ""} ${ICB.__error ?? ""}`);
		const changedFromBase = (list, baseList) => baseList.filter((b) => canon(list.find((w) => w.label === b.label) ?? null) !== canon(b)).map((b) => b.label);
		out("(guard) desiredHooks: every base entry, POSIX and win32, is the base's exactly (event, matcher, label, marker, spec and entry, timeout included; §3.9)", { posix: changedFromBase(posix, baseP), win32: changedFromBase(w32, baseW) }, { posix: [], win32: [] });
		out("(i) desiredHooks (POSIX): six entries, four SessionStart, one roster notice entry with no matcher, shell form like its siblings, the base's sealed SessionStart timeout (R-1208)",
			{ count: posix.length, sessionStart: sessionStart(posix).length, hits: find(posix).length, hook: pick(find(posix)[0]) },
			{ count: 6, sessionStart: 4, hits: 1, hook: { event: "SessionStart", matcherKey: false, label: "SessionStart roster notice", entry: { type: "command", command: `node ${shq(`/h/${HOOK_NAME}`)}`, timeout: SEALED_TIMEOUT, statusMessage: "nana: roster notice" } } }, S.__error ?? "");
		out("(guard) desiredHooks with no platform equals the POSIX output (R-1061)", canon(bare) === canon(posix), true);
		out("(i) desiredHooks (win32, checkout path with a space, $, % and '): exec form naming the checkout's own hook, no matcher, the base's sealed SessionStart timeout (R-1208, R-1051)",
			pick(find(w32)[0]), { event: "SessionStart", matcherKey: false, label: "SessionStart roster notice", entry: { type: "command", command: "node", args: [`${weird}/packages/nana-setup/claude/hooks/${HOOK_NAME}`], timeout: SEALED_TIMEOUT, statusMessage: "nana: roster notice" } });
		const steps = await importFresh("packages/nana-setup/lib/steps.mjs");
		out("(i) steps HOOKS lists the hook (five hooks, R-301)", steps.__error ?? [steps.HOOKS?.length, steps.HOOKS?.includes(HOOK_NAME)], [5, true]);
		const SMm = await importFresh("packages/nana-setup/lib/state-manifest.mjs");
		const P = await importFresh("packages/nana-setup/lib/paths.mjs");
		const layout = P.resolveLayout ? P.resolveLayout({ home: path.join(scratch, "manifest-home") }) : null;
		const mrow = SMm.stateRows && layout ? SMm.stateRows(layout).find((r) => r.store === `hook ${HOOK_NAME}`) : null;
		out("(i) the state manifest has a rebuildable link row for the hook at the hooks dir (R-954; uninstall reads it)", mrow ? { class: mrow.class, kind: mrow.kind, owner: mrow.owner, path: mrow.path } : null, layout ? { class: "rebuildable", kind: "link", owner: "nana-setup", path: path.join(layout.hooksDir, HOOK_NAME) } : null);
		const IC = await importFresh("packages/nana-setup/lib/install-check-config.mjs");
		const ICb = atBase("packages/nana-setup/lib/install-check-config.mjs");
		const icRow = Array.isArray(IC.HOOKS) ? IC.HOOKS.find((h) => h.script === HOOK_NAME) : null;
		out("(i) the install-check hook table: six rows, a SessionStart roster notice row labelled hook roster notice with the base's sealed SessionStart timeout and shell/shell/exec forms (R-1074, R-1209)",
			IC.__error ?? { count: IC.HOOKS?.length, row: icRow ? { label: icRow.label, event: icRow.event, timeout: icRow.timeout, form: icRow.form } : null },
			{ count: 6, row: { label: "hook roster notice", event: "SessionStart", timeout: SEALED_TIMEOUT, form: { darwin: "shell", linux: "shell", win32: "exec" } } });
		out("(i) DOCTOR_NOTES: win32 gains hook nana-roster-notice.mjs; darwin and linux unchanged from the base (R-1081)",
			IC.__error ?? [IC.DOCTOR_NOTES?.win32?.includes(`hook ${HOOK_NAME}`), canon(IC.DOCTOR_NOTES?.darwin), canon(IC.DOCTOR_NOTES?.linux)],
			[true, ...(() => { const at = (ICb ?? "").indexOf("export const DOCTOR_NOTES"); const m = at < 0 ? null : /darwin: (\[[^\]]*\]),\s*linux: (\[[^\]]*\])/.exec(ICb.slice(at)); try { return m ? [canon(JSON.parse(m[1])), canon(JSON.parse(m[2]))] : ["(base unread)", "(base unread)"]; } catch { return ["(base unparsable)", "(base unparsable)"]; } })()]);
		const ICM = await importFresh("packages/nana-setup/lib/install-check.mjs");
		const ok = typeof ICM.rosterNoticeOutputOk === "function" ? (s) => { try { return ICM.rosterNoticeOutputOk(s) === true; } catch { return "threw"; } } : null;
		const L = sDefault.L ?? `${PREFIX} (default): builder x, reviewer y, land z${SEP}${POINTER} ~/f`;
		const both = (sm, ac, ev = "SessionStart") => JSON.stringify({ ...(sm === null ? {} : { systemMessage: sm }), hookSpecificOutput: { ...(ev === null ? {} : { hookEventName: ev }), ...(ac === null ? {} : { additionalContext: ac }) } });
		const unavailable = `${PREFIX} notice unavailable (ERR_MODULE_NOT_FOUND)`;
		const PRED = [
			["the notice in both fields", `${both(L, L)}\n`, true],
			["the same, a refused notice", `${both(`${PREFIX} refused: invalid JSON${SEP}${POINTER} ~/f`, `${PREFIX} refused: invalid JSON${SEP}${POINTER} ~/f`)}\n`, true],
			["plain text", `${L}\n`, false],
			["two objects", `${both(L, L)}\n${both(L, L)}\n`, false],
			["a missing user message", both(null, L), false],
			["a missing SessionStart context", JSON.stringify({ systemMessage: L }), false],
			["a context with no hookEventName", both(L, L, null), false],
			["a context under another event", both(L, L, "UserPromptSubmit"), false],
			["a context that does not start with the prefix", both(L, "something else"), false],
			["a user message that does not start with the prefix", both("something else", L), false],
			["the unavailable notice in both fields", both(unavailable, unavailable), false],
			["empty output", "", false],
		];
		out("(i) install-check.mjs exports rosterNoticeOutputOk, which passes only one JSON object with the notice as user message and SessionStart context (R-1209)",
			ok ? PRED.filter(([, s, want]) => ok(s) !== want).map(([label]) => label) : "rosterNoticeOutputOk is not exported", []);
		// R-1209 at the point of use: runInstallCheck's own hook branch, under a stub spawn as install-check.test.mjs's
		// recordingRun does (an install that writes settings from the build's install-check table, every other command
		// exiting 0 with empty output), with the roster hook's stdout varied. An unbranched row passes on empty stdout (§3.10).
		let icCount = 0;
		const icRosterStatus = async (rosterStdout) => {
			if (typeof ICM.runInstallCheck !== "function" || !Array.isArray(IC.HOOKS)) return "runInstallCheck or the hook table is not exported";
			const icHome = path.join(scratch, `ic-home-${++icCount}`);
			fs.mkdirSync(icHome, { recursive: true });
			const spawn = async (command, args) => {
				const joined = `${command} ${args.join(" ")}`;
				if (joined.includes("nana-setup.mjs") && args.includes("install")) {
					fs.mkdirSync(path.join(icHome, ".pi", "agent"), { recursive: true });
					fs.mkdirSync(path.join(icHome, ".claude", "nana-memory", "shared"), { recursive: true });
					const hooks = {};
					for (const h of IC.HOOKS.filter((x) => !x.platforms || x.platforms.includes("darwin"))) {
						const matcher = h.matcher && typeof h.matcher === "object" ? h.matcher.darwin : h.matcher;
						(hooks[h.event] ??= []).push({ ...(matcher ? { matcher } : {}), hooks: [{ type: "command", command: `node ${h.script}`, timeout: h.timeout }] });
					}
					fs.writeFileSync(path.join(icHome, ".claude", "settings.json"), JSON.stringify({ hooks }));
					return { status: 0, stdout: "", stderr: "" };
				}
				if (joined.includes(HOOK_NAME)) return { status: 0, stdout: rosterStdout, stderr: "" };
				return { status: 0, stdout: "", stderr: "" };
			};
			try {
				const res = await ICM.runInstallCheck({ root, home: icHome, platformName: "darwin", env: { PATH: "/bin" }, spawn, now: () => new Date("2026-10-16T00:00:00Z"), out: () => {} });
				return res.lines.find((l) => /^\S+ hook roster notice(?: —|$)/.test(l))?.split(" ")[0] ?? "(no hook roster notice line)";
			} catch (e) { return `runInstallCheck threw: ${e?.message ?? e}`; }
		};
		out("(i) runInstallCheck's hook roster notice row, its hook printing nothing, plain text, the unavailable notice in both fields, then the notice in both fields: FAIL, FAIL, FAIL, PASS (R-1209, §3.5's branch)",
			[await icRosterStatus(""), await icRosterStatus(`${L}\n`), await icRosterStatus(`${both(unavailable, unavailable)}\n`), await icRosterStatus(`${both(L, L)}\n`)], ["FAIL", "FAIL", "FAIL", "PASS"]);
		// A real install into a scratch HOME (as install.test.mjs and state-manifest.test.mjs do): POSIX, then forced win32.
		const instHome = path.join(scratch, "install-home");
		fs.mkdirSync(instHome);
		const inst = spawnSync(process.execPath, [SETUP_CLI, "install", "--home", instHome], { cwd: scratch, encoding: "utf8", timeout: 300_000, env: envFor(instHome, path.join(instHome, ".pi", "agent")) });
		out("(guard) nana-setup install --home <scratch> exits 0", inst.status, 0, (inst.stderr ?? "").slice(-300));
		let settings = {};
		try { settings = JSON.parse(fs.readFileSync(path.join(instHome, ".claude", "settings.json"), "utf8")); } catch { /* reported below */ }
		const groupsWith = (s, name) => (s.hooks?.SessionStart ?? []).filter((g) => (g.hooks ?? []).some((h) => JSON.stringify(h).includes(name)));
		const entriesWith = (s, name) => (s.hooks?.SessionStart ?? []).flatMap((g) => (g.hooks ?? []).filter((h) => JSON.stringify(h).includes(name)).map((h) => ({ matcherKey: "matcher" in g, h })));
		const linkPath = path.join(instHome, ".claude", "hooks", HOOK_NAME);
		const instObj = entriesWith(settings, "nana-objective.mjs")[0]?.h;
		const instHits = entriesWith(settings, HOOK_NAME);
		let link = null;
		try { link = fs.readlinkSync(linkPath); } catch { link = "absent"; }
		out("(i) after install: one SessionStart entry runs the linked hook, in a group with no matcher, with the objective entry's timeout; the link points into this checkout (R-1208, R-301)",
			{ hits: instHits.length, matcherKey: instHits[0]?.matcherKey ?? null, command: instHits[0]?.h?.command ?? null, timeout: instHits[0]?.h?.timeout ?? null, link, otherEvents: Object.entries(settings.hooks ?? {}).filter(([ev]) => ev !== "SessionStart").some(([, gs]) => JSON.stringify(gs).includes(HOOK_NAME)) },
			{ hits: 1, matcherKey: false, command: `node ${shq(linkPath)}`, timeout: instObj?.timeout ?? 5, link: HOOK, otherEvents: false });
		const instProject = path.join(instHome, "project");
		fs.mkdirSync(instProject, { recursive: true });
		const cmd = instHits[0]?.h?.command;
		const viaShell = cmd ? spawnSync("/bin/sh", ["-c", cmd], { cwd: instProject, env: envFor(instHome, undefined), input: hookInput("startup", instProject), encoding: "utf8", timeout: 30_000 }) : null;
		let viaObj = null;
		try { viaObj = JSON.parse(viaShell?.stdout ?? ""); } catch { viaObj = viaShell ? `unparsable: ${(viaShell.stdout ?? "").slice(0, 120)}` : "no command"; }
		const instL = DEF ? expectNotice({ kind: "default", roster: DEF, file: path.join(instHome, ".pi", "agent", "nana-pack.json"), home: instHome }) : null;
		out("(i) the installed command, run through /bin/sh with startup input, prints the default notice (the seeded file holds no roster) in both fields (R-1205, R-1209's fixture)",
			{ status: viaShell?.status ?? null, obj: viaObj }, { status: 0, obj: { systemMessage: instL, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: instL } } });
		out("(i) the install output reports the hook link and the settings SessionStart roster notice entry", [lines(inst.stdout).some((l) => l.includes(`hook ${HOOK_NAME}`)), lines(inst.stdout).some((l) => l.includes("settings SessionStart roster notice"))], [true, true]);
		const un = spawnSync(process.execPath, [SETUP_CLI, "uninstall", "--yes", "--home", instHome], { cwd: scratch, encoding: "utf8", timeout: 300_000, env: envFor(instHome, path.join(instHome, ".pi", "agent")) });
		let after = {};
		try { after = JSON.parse(fs.readFileSync(path.join(instHome, ".claude", "settings.json"), "utf8")); } catch { after = {}; }
		let linkAfter = true;
		try { fs.lstatSync(linkPath); } catch { linkAfter = false; }
		out("(i) uninstall --yes removes the hook link and its settings entry, which install had made (state manifest, §3.5)", [link === HOOK, instHits.length, un.status, linkAfter, entriesWith(after, HOOK_NAME).length], [true, 1, 0, false, 0], (un.stderr ?? "").slice(-200));
		const winHome = path.join(scratch, "install-home-win32");
		fs.mkdirSync(winHome);
		const winst = spawnSync(process.execPath, [SETUP_CLI, "install", "--home", winHome], { cwd: scratch, encoding: "utf8", timeout: 300_000, env: envFor(winHome, path.join(winHome, ".pi", "agent"), { NANA_SETUP_PLATFORM: "win32" }) });
		let wset = {};
		try { wset = JSON.parse(fs.readFileSync(path.join(winHome, ".claude", "settings.json"), "utf8")); } catch { /* reported below */ }
		const wHits = entriesWith(wset, HOOK_NAME);
		const wObj = entriesWith(wset, "nana-objective.mjs")[0]?.h;
		out("(i) forced-win32 install: one exec-form SessionStart entry naming the checkout's hook, no matcher, the objective entry's timeout; the line reports created (R-1208, R-1051, R-1056)",
			{ status: winst.status, hits: wHits.length, matcherKey: wHits[0]?.matcherKey ?? null, command: wHits[0]?.h?.command ?? null, args: wHits[0]?.h?.args ?? null, timeout: wHits[0]?.h?.timeout ?? null, created: lines(winst.stdout).some((l) => l.includes("settings SessionStart roster notice") && l.includes("created")) },
			{ status: 0, hits: 1, matcherKey: false, command: "node", args: [`${root}/packages/nana-setup/claude/hooks/${HOOK_NAME}`], timeout: wObj?.timeout ?? 5, created: true });
		{
			// R-1056 (reworded: "all six entries on win32"): an installer-shaped roster notice entry whose script is gone is
			// replaced IN PLACE (same group, same index, ahead of a foreign entry) with this checkout's exec form, no twin.
			const staleHome = path.join(scratch, "install-home-win32-stale");
			fs.mkdirSync(path.join(staleHome, ".claude"), { recursive: true });
			const stale = { type: "command", command: "node", args: [`/gone/checkout/packages/nana-setup/claude/hooks/${HOOK_NAME}`], timeout: SEALED_TIMEOUT ?? 5, statusMessage: "nana: roster notice" };
			const foreign = { type: "command", command: "echo personal-session-start", timeout: 3, statusMessage: "my own start note" };
			fs.writeFileSync(path.join(staleHome, ".claude", "settings.json"), `${JSON.stringify({ hooks: { SessionStart: [{ hooks: [stale, foreign] }] } }, null, 2)}\n`);
			const rs = spawnSync(process.execPath, [SETUP_CLI, "install", "--home", staleHome], { cwd: scratch, encoding: "utf8", timeout: 300_000, env: envFor(staleHome, path.join(staleHome, ".pi", "agent"), { NANA_SETUP_PLATFORM: "win32" }) });
			let sset = {};
			try { sset = JSON.parse(fs.readFileSync(path.join(staleHome, ".claude", "settings.json"), "utf8")); } catch { /* reported below */ }
			const g0 = sset.hooks?.SessionStart?.[0]?.hooks ?? [];
			out("(i) forced-win32 install over a stale roster notice entry: replaced in place by the checkout's exec form, the foreign entry after it kept, no twin (R-1056, R-1051)",
				{ status: rs.status, first: g0[0] ? { command: g0[0].command, args: g0[0].args ?? null } : null, second: g0[1] ?? null, hits: entriesWith(sset, HOOK_NAME).length },
				{ status: 0, first: { command: "node", args: [`${root}/packages/nana-setup/claude/hooks/${HOOK_NAME}`] }, second: foreign, hits: 1 }, (rs.stderr ?? "").slice(-200));
		}
	}

	// ---------------------------------------------------------------- (t) the shared working pattern and the docs (R-1193, R-1213, R-1214, R-859, R-680, R-685, R-658)
	{
		const baseShared = atBase(SHARED) ?? "";
		const shared = text(SHARED) ?? "";
		const bl = baseShared.split("\n"), hl = shared.split("\n");
		const seatAt = hl.findIndex((l) => l.startsWith("- Seat land review:"));
		out("(t) the shared file carries §3.8's Larger lanes bullet once, byte for byte, right after the seat land review bullet (R-1193, R-1213, R-1214)", [hl.filter((l) => l === BULLET).length, seatAt >= 0 && hl[seatAt + 1] === BULLET], [1, true]);
		const ROWS = ["| Claude Code seat |", "| pi TUI or desk session |", "| pi reviewer/worker child"];
		const mask = (ls) => ls.filter((l) => l !== BULLET).map((l) => ROWS.find((k) => l.startsWith(k)) ?? l);
		out("(guard) apart from the bullet and the three runtime rows, the shared file is the base's line for line (§3.8)", canon(mask(hl)) === canon(mask(bl)), true);
		const cellsOf = (l) => (l ?? "").split("|").map((s) => s.trim()).slice(1, -1);
		const rowCheck = ROWS.map((k) => {
			const b = cellsOf(bl.find((l) => l.startsWith(k))), h = cellsOf(hl.find((l) => l.startsWith(k)));
			return { row: k, sameCount: b.length === h.length && b.length > 0, restSame: canon(b.slice(0, -1)) === canon(h.slice(0, -1)), notify: k.includes("Claude Code") ? (h.at(-1) ?? "").includes(HOOK_NAME) : /nana-roster-notice|roster notice/.test(h.at(-1) ?? "") };
		});
		out("(t) the runtime table keeps its columns; only the Notify cell of the three nana rows changes, naming the hook (Claude Code) or the roster notice extension (pi) (§3.8, R-680)", rowCheck, ROWS.map((row) => ({ row, sameCount: true, restSame: true, notify: true })));
		const keep = (ls) => ls.filter((l) => l.startsWith("- Default pattern:") || l.startsWith("- Seat land review:"));
		out("(guard) the default-pattern and seat land review bullets are the base's, byte for byte (R-1126 to R-1128, §3.9)", keep(hl), keep(bl));
		const agents = text("AGENTS.md") ?? "";
		const b = agents.indexOf(`${BEGIN}\n`), e = agents.indexOf(`\n${END}`, b + 1);
		out("(guard) AGENTS.md's marker region is byte-identical to the shared file (R-859; regenerated by nana-setup project)", b >= 0 && e >= 0 && agents.slice(b + BEGIN.length + 1, e + 1) === shared, true);
		out("(t) AGENTS.md carries the Larger lanes bullet once (the regenerated region)", agents.split("\n").filter((l) => l === BULLET).length, 1);
		const soulBase = atBase("packages/nana-setup/claude/rules/nana-soul.md"), soul = text("packages/nana-setup/claude/rules/nana-soul.md");
		out("(guard) nana-soul.md is the base's (§3.9)", soul === soulBase, true);
		const pack = text("packages/nana-pack/README.md") ?? "";
		out("(t) pack README: Eight extensions, the Machine roster section names largerBuilder, the --json command and \"pull before you add `largerBuilder`\"; the Lane builder paragraph names --lane-size (§3.8)",
			[/^Eight extensions/m.test(pack), /^Seven extensions/m.test(pack), pack.includes("largerBuilder"), pack.includes('node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs" --json'), /pull before you add `largerBuilder`/i.test(pack), /#### Lane builder[\s\S]*?--lane-size[\s\S]*?####/.test(pack)],
			[true, false, true, true, true, true]);
		// §3.8's README items, each by one substring or pattern, each confined to the section §3.8 names (a section ends at
		// the next heading of its own level or higher). A wording change that keeps §3.8's meaning may need the seat's read.
		const sectionRaw = (s, head) => { const i = s.indexOf(`\n${head}\n`); if (i < 0) return ""; const rest = s.slice(i + head.length + 2); const lvl = /^#+/.exec(head)[0].length; const next = rest.search(new RegExp(`\\n#{1,${lvl}} `)); return next < 0 ? rest : rest.slice(0, next); };
		const sectionOf = (s, head) => collapse(sectionRaw(s, head));
		const missing = (hay, checks) => checks.filter(([, re]) => !re.test(hay)).map(([label]) => label);
		const rosterSec = sectionOf(pack, "#### Machine roster");
		out("(t) pack README Machine roster section: larger or riskier, a Claude Code entry with its four model names, --lane-size, the --json edit (set the file's roster member, keep every other key) and a JSON syntax error stopping pi's gate (§3.8)",
			missing(rosterSec, [["larger or riskier", /larger or riskier/i], ["a Claude Code entry (runtime claude-code)", /claude-code/], ...CC_MODELS.map((m) => [`model ${m}`, new RegExp(`\\b${m}\\b`)]), ["--lane-size", /--lane-size/], ["--json", /nana-roster\.mjs"? --json/], ["set the roster member", /roster`? member/], ["keep every other key", /every other key/i], ["a JSON syntax error also stops pi's gate", /syntax error[^.]*\bgate\b/i]]), []);
		const laneSec = sectionOf(pack, "#### Lane builder");
		out("(t) pack README Lane builder paragraph: --lane-size, and the refusal-list item \"a launch with no --lane-size once the roster sets largerBuilder\" (§3.8, R-1212)",
			missing(laneSec, [["--lane-size", /--lane-size/], ["the no-size refusal item", /a launch with no `?--lane-size`? once the roster sets `?largerBuilder`?/]]), []);
		out("(t) pack README extension table: a nana-roster-notice row (§3.8)", /^\| `nana-roster-notice` \|/m.test(pack), true);
		const seeSec = sectionOf(pack, "## What you will see");
		const widgetItem = sectionRaw(pack, "## What you will see").split(/\n- /).map(collapse).find((item) => /widget/i.test(item) && /roster/i.test(item)) ?? "";
		out("(t) pack README What you will see: a widget item (the roster notice above the editor, builders, reviewer and land by model and thinking, never a provider or the scout, roster unknown while PI_CODING_AGENT_DIR is relative), and the compaction toast still shown beside it (§3.8)",
			[...missing(widgetItem, [["the widget item", /widget/i], ["above the editor", /above the editor/i], ["builder", /\bbuilders?\b/], ["reviewer", /\breviewer\b/], ["land", /\bland\b/], ["model", /\bmodel\b/], ["thinking", /\bthinking\b/], ["no provider", /\bprovider\b/], ["no scout", /\bscout\b/], ["roster unknown", /roster unknown/], ["PI_CODING_AGENT_DIR relative", /PI_CODING_AGENT_DIR/]]), ...missing(seeSec, [["the compaction toast still shows (a widget, not a toast)", /(toast[^.]*widget|widget[^.]*toast)/i]])], []);
		const rootRd = text("README.md") ?? "";
		out("(t) root README: no \"seven extensions\" left and \"eight extensions\" at least twice (the packages bullet and the pack-only install comment, §3.8)", [occurrences(rootRd, "seven extensions"), (rootRd.match(/\beight extensions\b/g) ?? []).length >= 2], [0, true]);
		const setupLines = lines(text("packages/nana-setup/README.md"));
		const setupRow = (...parts) => setupLines.find((l) => l.startsWith("| ") && parts.every((p) => l.includes(p))) ?? "";
		out("(t) nana-setup README: the What it installs hooks row names claude/hooks/nana-roster-notice.mjs, and the win32-degrade row says six win32 settings entries, not five (§3.8)",
			[setupRow("claude/hooks/nana-objective.mjs", "`~/.claude/hooks/`").includes("claude/hooks/nana-roster-notice.mjs"), /\bsix win32 settings entries\b/.test(setupRow("| `tests/win32-degrade.test.mjs` |")), /\bfive win32 settings entries\b/.test(setupRow("| `tests/win32-degrade.test.mjs` |"))], [true, true, false]);
		const smi = text("packages/nana-setup/lib/shared-memory-input.mjs") ?? "";
		const smiPurpose = collapse((/@purpose([\s\S]*?)\n\s*\*\s*@inputs/.exec(smi)?.[1] ?? "").replace(/\n\s*\*/g, " "));
		out("(t) shared-memory-input.mjs's @purpose names both SessionStart hooks, shared memory and the roster notice (§3.5, §4)", [/shared[- ]memory/i.test(smiPurpose), /roster notice/i.test(smiPurpose)], [true, true], smiPurpose);
		const rootPkg = (() => { try { return JSON.parse(text("package.json")).description; } catch { return ""; } })();
		const packPkg = (() => { try { return JSON.parse(text("packages/nana-pack/package.json")).description; } catch { return ""; } })();
		const rootReadme = text("README.md") ?? "";
		const bullet = rootReadme.match(/- `packages\/` —[\s\S]*?(?=\n- )/)?.[0] ?? "";
		out("(t) both package descriptions and the root README's packages bullet name the roster notice; the descriptions say eight (R-658)",
			[/roster notice/.test(rootPkg), /\beight\b/i.test(rootPkg), /roster notice/.test(packPkg), /\beight\b/i.test(packPkg), /roster notice/.test(bullet)], [true, true, true, true, true]);
		// Each surface list by its matrix line's head phrase (a count over the whole file passes with mentions elsewhere).
		const deskLines = lines(text("apps/desk/README.md"));
		out("(t) the desk README's runtime matrix names the roster notice in each of its three surface lists: default spawn, narrowed spawn, app children (R-685, §3.8)",
			["Default desk spawn |", "Narrowed desk spawn |", "Current basketball and edge children"].filter((head) => !(deskLines.find((l) => l.includes(head)) ?? "").includes("roster notice")), []);
		out("(t) skill-claims.mjs EXEMPTIONS gains the hook's name (§3.8)", /EXEMPTIONS\s*=\s*\[[\s\S]*?nana-roster-notice\.mjs[\s\S]*?\];/.test(text("packages/nana-pack/tests/skill-claims.mjs") ?? ""), true);
	}
} finally {
	for (const undo of restore) { try { undo(); } catch { /* best effort */ } }
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (e) rows
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const planRows = new Map(delta.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], { change: c[2], text: c[3] }]; }));
const NEW = Array.from({ length: 26 }, (_, k) => `R-${1190 + k}`);
const REWORDED = ["R-1120", "R-1121", "R-1122", "R-1123", "R-961", "R-1124", "R-301", "R-1051", "R-1063", "R-1055", "R-1056", "R-658"];
const ROW = /^\|\s*([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|/;
const reqLines = lines(text("REQUIREMENTS.md"));
const baseReqLines = lines(atBase("REQUIREMENTS.md"));
const rowAt = (id, ls = reqLines) => ls.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id, ls = reqLines) => { const i = rowAt(id, ls); return i < 0 ? [] : ls[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const shalls = (s) => ((s ?? "").replace(/`[^`]*`/g, "").match(/\bshall\b/gi) ?? []).length;
out("(harness) CHANGE §2 gives one-shall text for each of R-1190 to R-1215, and the lane adds 26 rows", [NEW.filter((id) => shalls(planRows.get(id)?.text) !== 1), NEW.filter((id) => planRows.has(id)).length, ST.LANE_ROWS_ADDED], [[], 26, 26]);
out("(harness) R-1190 to R-1215 are unused at the base", baseReqLines.filter((l) => /\bR-(119\d|120\d|121[0-5])\b/.test(l)).length, 0);
for (const id of NEW) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
	out(`(e) ${id} is one row carrying CHANGE §2's text, one "shall", status implemented`, [rows.length, cells(id)[2] ?? null, shalls(cells(id)[2]), cells(id)[3] ?? null], [1, planRows.get(id)?.text ?? "(no plan text)", 1, "implemented"]);
}
{
	const TM = await import(pathToFileURL(rel("scripts/requirements-tree.mjs")).href);
	const parsed = TM.parseLedger(text("REQUIREMENTS.md") ?? "");
	const homeOf = new Map(TM.readRequirementRows(parsed).map((r) => [r.id, r.heading]));
	const named = (id) => /(FEAT-\d{3}|SUB-\d{3})/.exec(planRows.get(id)?.change ?? "")?.[1] ?? null;
	const under = (id) => { const h = homeOf.get(id); const want = named(id); return Boolean(h && want && (h.id === want || (want.startsWith("FEAT-") && h.parent?.id === want))); };
	out("(harness) each feature §2 names for a new row is a heading in REQUIREMENTS.md", [...new Set(NEW.map(named))].filter((f) => !parsed.headings.some((h) => h.id === f)), []);
	out("(e) each new row sits under the feature or subgroup §2 names (placed by ID, §2)", NEW.filter((id) => !under(id)), []);
}
{
	// The reworded rows: §2's change applied to the base text.
	const baseCell = (id) => cells(id, baseReqLines)[2] ?? "";
	const becomes = (id) => { const m = /"(.+?)" becomes "(.+?)"/.exec(planRows.get(id)?.text ?? ""); return m ? [m[1], m[2]] : null; };
	const applyBecomes = (id) => {
		const bc = becomes(id); if (!bc) return null;
		const [a, b] = bc; const aw = a.split(" "), bw = b.split(" ");
		const now = bw.length >= aw.length ? b : [...bw, ...aw.slice(bw.length)].join(" ");
		return occurrences(baseCell(id), a) === 1 ? baseCell(id).replace(a, now) : `(base lacks "${a}")`;
	};
	const tail = (id, anchor) => { const t = (planRows.get(id)?.text ?? "").replace(/^…/, ""); const i = baseCell(id).indexOf(anchor); return i < 0 ? `(base lacks "${anchor}")` : baseCell(id).slice(0, i) + t; };
	const r1124 = (() => { const t = planRows.get("R-1124")?.text ?? ""; const m = /`, with (.+?)`default` for a null thinking/.exec(t); const anchor = "`, with `default` for a null thinking"; return m && occurrences(baseCell("R-1124"), anchor) === 1 ? baseCell("R-1124").replace(anchor, `\`, with ${m[1]}\`default\` for a null thinking`) : "(R-1124 change unread)"; })();
	const want = {
		"R-1121": planRows.get("R-1121")?.text,
		"R-1122": tail("R-1122", "or its roster is not an object"),
		"R-1123": planRows.get("R-1123")?.text,
		"R-961": applyBecomes("R-961"),
		"R-1124": r1124,
		"R-301": applyBecomes("R-301"),
		"R-1051": tail("R-1051", "shall wire"),
		"R-1055": applyBecomes("R-1055"),
		"R-1056": applyBecomes("R-1056"),
		"R-658": applyBecomes("R-658"),
	};
	for (const [id, w] of Object.entries(want)) out(`(e) ${id} reworded: §2's change on the base text, one "shall", still implemented`, [cells(id)[2] ?? null, shalls(cells(id)[2]), cells(id)[3] ?? null], [w ?? "(no plan text)", 1, "implemented"]);
	// R-1120 (D1): "no larger-lane builder," after the builder; under D1's other answer, the Claude Code model `sonnet`.
	const r1120 = cells("R-1120")[2] ?? "";
	const alt = [baseCell("R-1120").replace(/(, builder \S+ \S+ \S+, )/, "$1no larger-lane builder, "), baseCell("R-1120").replace(/(, builder \S+ \S+ \S+, )/, "$1larger-lane builder the Claude Code model `sonnet`, ")];
	out("(e) R-1120 reworded: the base text with \"no larger-lane builder,\" after the builder (or D1's other insert), one \"shall\", its evidence cell unchanged", [alt.includes(r1120), shalls(r1120), cells("R-1120")[4] === cells("R-1120", baseReqLines)[4]], [true, 1, true], r1120.slice(0, 200));
	// R-1063: the roster notice clause after the shared-memory clause (punctuation around the insert is the builder's).
	const phrase = (/Adds "(.+?)" after the shared-memory clause/.exec(planRows.get("R-1063")?.text ?? "") ?? [])[1] ?? null;
	const r1063 = cells("R-1063")[2] ?? "";
	const norm = (s) => s.replace(/,/g, "").replace(/\band\b/g, "").replace(/\s+/g, " ").replace(/ \./g, ".").trim();
	out("(e) R-1063 reworded: the roster notice clause added after the shared-memory clause, the rest the base's, one \"shall\"", [Boolean(phrase) && r1063.includes(phrase), r1063.indexOf(phrase ?? "\u0000") > r1063.indexOf("index line"), norm(r1063.replace(phrase ?? "\u0000", "")) === norm(baseCell("R-1063")), shalls(r1063)], [true, true, true, 1], r1063.slice(-240));
	out("(guard) R-1075's requirement text and status are the base's (evidence only, §2)", [cells("R-1075")[2] === baseCell("R-1075"), cells("R-1075")[3]], [true, "implemented"]);
}
{
	// Evidence: each new row cites every §5 title whose marker names it; the reworded rows cite their new checks; the renamed titles replace the old.
	const { entries, tree } = ST.required("1", root);
	const titleCache = new Map();
	const sourcesOf = (file, title) => { if (!titleCache.has(file)) titleCache.set(file, ST.checkTitles(rel(file)) ?? new Map()); return (titleCache.get(file).get(title) ?? []).map((x) => `${file}::${x.cite}`); };
	const cites = (s) => [...(s ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
	const wantCites = (id) => [...new Set(entries.filter(([, , rows]) => rows.includes(id)).flatMap(([file, title]) => { const s = sourcesOf(file, title); return s.length ? s : [`${file}::${title} (not in the test file)`]; }))];
	out("(harness) every new row has at least one §5 title in seat-titles.mjs", NEW.filter((id) => wantCites(id).length === 0), []);
	for (const id of NEW) out(`(e) ${id}'s evidence cites its §5 title(s) as the rail reads them`, wantCites(id).filter((c) => !cites(cells(id)[4]).includes(c)), []);
	for (const id of ["R-1121", "R-1122", "R-1123", "R-961", "R-1124", "R-1051", "R-1063", "R-658", "R-1075"]) {
		out(`(e) ${id}'s evidence cites the new check that pins its clause (§2: "each reworded row's evidence cell gains the new check")`, wantCites(id).filter((c) => !cites(cells(id)[4]).includes(c)), []);
	}
	const oldCites = ST.RENAMED.filter(([, , , rows]) => rows.length).map(([file, old, , rows]) => [rows[0], `${file}::${old}`]);
	out("(e) no row cites a renamed title's old name (R-1051, R-1075, R-658; §2, §5.2)", oldCites.filter(([id, c]) => cites(cells(id)[4]).includes(c)).map(([id]) => id), []);
	const baseIds = baseReqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
	const headIds = reqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
	out("(guard) no base row outside §2's twelve reworded rows changes its requirement text or status", baseIds.filter((id) => !REWORDED.includes(id)).filter((id) => { const a = cells(id, baseReqLines), b = cells(id); return a[2] !== b[2] || a[3] !== b[3]; }), []);
	out(`(e) the row set is the base's plus R-1190 to R-1215, each once (${baseIds.length} → ${baseIds.length + 26})`, { added: headIds.filter((id) => !baseIds.includes(id)).sort(), removed: baseIds.filter((id) => !headIds.includes(id)), count: headIds.length }, { added: [...NEW].sort(), removed: [], count: baseIds.length + 26 });
	out("(harness) R-291's base leaf total equals the base's row count (seat-titles reads it)", tree.error ? tree.error : tree.beforeTotal, baseIds.length);
	const node = (args) => spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 300_000, env: cleanEnv(), maxBuffer: 64 * 1024 * 1024 });
	const rail = node(["scripts/requirements-trace.mjs"]);
	out("(guard) the trace rail is green: node scripts/requirements-trace.mjs exits 0", rail.status, 0, (rail.stdout + rail.stderr).split("\n").filter((l) => /^\s{2}\S/.test(l)).slice(0, 5).join(" | "));
	for (const [label, args] of [["node scripts/requirements-tree.mjs --check", ["scripts/requirements-tree.mjs", "--check"]], ["map:check (node scripts/code-map.mjs --check)", ["scripts/code-map.mjs", "--check"]], ["readme:check (node scripts/readme-check.mjs)", ["scripts/readme-check.mjs"]]]) {
		const r = node(args);
		out(`(guard) ${label} exits 0`, r.status, 0, (r.stdout + r.stderr).slice(-300));
	}
}

// ---------------------------------------------------------------- (f) scope (§4, §3.9)
const REVIEW = "docs/reviews/roster-notice-2026-10-16/";
const SCOPE = [
	// §4 In, new
	LIB_REL, CONFIG_REL, EXT_REL, "packages/nana-pack/tests/roster-notice.test.mjs", HOOK_REL, "packages/nana-setup/tests/roster-notice-hook.test.mjs",
	// §4 In, changed code and text
	// Seat amendment 1 (2026-10-16): the home-path fix (R-1204) changes the shared tilde helper.
	"packages/nana-setup/lib/paths.mjs", "packages/nana-setup/tests/paths.test.mjs",
	"packages/nana-pack/bin/worker-config.mjs", "packages/nana-pack/bin/nana-roster.mjs", "packages/nana-pack/bin/pi-worker.mjs",
	"packages/nana-setup/lib/settings.mjs", "packages/nana-setup/lib/steps.mjs", "packages/nana-setup/lib/state-manifest.mjs", "packages/nana-setup/lib/install-check-config.mjs", "packages/nana-setup/lib/install-check.mjs",
	"packages/nana-setup/lib/doctor.mjs", "packages/nana-pack/extensions/nana-writing.ts", "packages/nana-setup/lib/shared-memory-input.mjs",
	SHARED, "AGENTS.md", "packages/nana-pack/tests/skill-claims.mjs", "package.json", "packages/nana-pack/package.json",
	"README.md", "packages/nana-pack/README.md", "packages/nana-setup/README.md", "apps/desk/README.md",
	// §5.1 and §5.2's tests
	"packages/nana-setup/tests/settings-merge.test.mjs", "packages/nana-setup/tests/install-check.test.mjs", "packages/nana-setup/tests/uninstall.test.mjs", "packages/nana-setup/tests/state-manifest.test.mjs",
	"packages/nana-setup/tests/restore.test.mjs", "packages/nana-setup/tests/win32-degrade.test.mjs", "packages/nana-setup/tests/hooks-win32-exec.test.mjs", "packages/nana-setup/tests/install.test.mjs",
	"packages/nana-pack/tests/config-handlers-malformed.test.mjs", "packages/nana-pack/tests/templates-render.test.mjs", "packages/nana-pack/tests/nana-roster.test.mjs", "packages/nana-pack/tests/readme-check.test.mjs",
	"packages/nana-pack/tests/requirements-tree.test.mjs", "packages/nana-pack/tests/worker-lane.test.mjs",
	// rows, generated maps, frontier
	"REQUIREMENTS.md", "docs/requirements-tree.md", "docs/code-map.md", "HANDOFF.md", "docs/sessions/2026-10.md",
];
const diff = git("diff", "--name-only", `${base}..HEAD`);
const changed = diff.stdout.split("\n").filter(Boolean);
out(`(guard) git diff --name-only ${base.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`, diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(REVIEW)) : `git exit ${diff.status}`, []);
const FORBIDDEN = ["packages/nana-setup/claude/hooks/nana-objective.mjs", "packages/nana-setup/claude/hooks/nana-adoption.mjs", "packages/nana-setup/claude/hooks/nana-shared-memory.mjs", "packages/nana-setup/claude/hooks/verifier-pipe.mjs",
	"packages/nana-setup/claude/hooks/context-size-check.sh", "packages/nana-pack/extensions/nana-lifecycle.ts", "packages/nana-pack/bin/pi-review.mjs", "packages/nana-pack/bin/pi-watchdog.mjs", "packages/nana-pack/prompts/builder-preamble.md",
	"packages/nana-setup/claude/rules/nana-soul.md", "packages/nana-pack/extensions/nana-objective.ts", "packages/nana-pack/lib/objective.ts", "packages/nana-pack/bin/nana-objective.mjs"];
out("(guard) the merge-base diff touches nothing §3.9 names: the other hooks, lifecycle, pi-review, the watchdog, the builder preamble, nana-soul, the objective, desk code", changed.filter((p) => FORBIDDEN.includes(p) || (p.startsWith("apps/desk/") && p !== "apps/desk/README.md")), []);
out("(f) HANDOFF.md and the session entry docs/sessions/2026-10.md are in the lane's diff (§4 In; the seat writes them before the final round)", ["HANDOFF.md", "docs/sessions/2026-10.md"].filter((p) => !changed.includes(p)), []);
out("(f) HANDOFF.md carries the D1 carry (a largerBuilder for this machine after the land, residual 6)", /largerBuilder/.test(text("HANDOFF.md") ?? ""), true);
{
	const TAGS = ["@module", "@purpose", "@inputs", "@outputs", "@effects", "@errors"];
	const NEW_SOURCES = [LIB_REL, CONFIG_REL, EXT_REL, HOOK_REL, "packages/nana-pack/tests/roster-notice.test.mjs", "packages/nana-setup/tests/roster-notice-hook.test.mjs"];
	out("(f) every new module opens with the six-tag header (nana-standards; map:check)", NEW_SOURCES.filter((p) => { const t = (text(p) ?? "").slice(0, 2000); return !TAGS.every((tag) => t.includes(tag)); }), []);
	const lib = text(LIB_REL) ?? "";
	out("(f) roster-notice.mjs's header gives §3.4's @purpose and @effects none", [/@purpose Compose the one-line session-start roster notice from a roster result and the roster file/.test(collapse(lib.replace(/\n\s*\*\s?/g, " "))), /@effects none\b/.test(lib)], [true, true]);
	// Nothing the lane writes adds an owner name, the absolute home path, the host name or this machine's roster providers
	// (§3.9). The strings are read at run time and never printed; only file names are reported.
	const secretish = [];
	// The owner's name, read at run time: the base HANDOFF's "Open for <name>" heading, git's user.name and the base commit's author.
	for (const name of [/^## Open for (\S+)/m.exec(atBase("HANDOFF.md") ?? "")?.[1], git("config", "user.name").stdout.trim(), git("log", "-1", "--format=%an", base).stdout.trim()]) if (name && name.length >= 3) secretish.push(name);
	secretish.push(os.homedir());
	if (os.hostname().replace(/\.local$/, "").length >= 6) secretish.push(os.hostname().replace(/\.local$/, ""));
	try {
		// The machine's own agent dir through the repo's one resolver (R-190: no second resolver anywhere, seat scripts included).
		const { piAgentDir } = await import(pathToFileURL(path.join(root, "packages", "nana-pack", "lib", "agent-dir.mjs")).href);
		const real = JSON.parse(fs.readFileSync(path.join(piAgentDir(), "nana-pack.json"), "utf8").replace(/^\uFEFF/, ""));
		for (const v of Object.values(real?.roster ?? {})) if (v && typeof v.provider === "string" && v.provider.length >= 3) secretish.push(v.provider);
	} catch { /* no machine roster: nothing more to count */ }
	const grew = changed.filter((p) => !p.startsWith(REVIEW)).filter((p) => { const now = text(p) ?? "", was = atBase(p) ?? ""; return secretish.some((s) => occurrences(now, s) > occurrences(was, s)); });
	out("(guard) no file the lane changes outside this review folder gains an owner name, the absolute home path, the host name or this machine's roster provider (§3.9)", grew, []);
}
out("(guard) the build is committed: no uncommitted or untracked path outside this review folder (§4)", lines(statusBefore).filter((l) => !l.slice(3).startsWith(REVIEW)), []);

// ---------------------------------------------------------------- (g) the §5 titles print PASS
{
	const { entries, loops } = ST.required("1", root);
	const CHM = "packages/nana-pack/tests/config-handlers-malformed.test.mjs";
	const FILES = [ST.RN, ST.RH, ST.NR, ST.WL, ST.TR, ST.IC, ST.SM, ST.RC, ST.RT, ST.IN, ST.WD, CHM];
	const runs = new Map();
	for (const file of FILES) {
		const exists = fs.existsSync(rel(file));
		const r = exists ? spawnSync(process.execPath, ["--experimental-strip-types", file], { cwd: root, encoding: "utf8", timeout: 300_000, env: cleanEnv(), maxBuffer: 64 * 1024 * 1024 }) : { status: null, stdout: "", stderr: "absent" };
		runs.set(file, r);
		const isNew = file === ST.RN || file === ST.RH;
		out(`${isNew ? "(g)" : "(guard)"} ${file} exits 0`, r.status, 0, lines(r.stdout).filter((l) => /^FAIL /.test(l)).slice(0, 3).join(" | ") + own(r.stderr).slice(-2).join(" | "));
	}
	const printed = (file, word, title) => lines(runs.get(file)?.stdout).filter((l) => l.startsWith(`${word} ${title}`) && l.slice(word.length + 1 + title.length).trim() === "").length;
	const mac = entries.filter(([file]) => !ST.WINDOWS_ONLY.includes(file));
	out("(g) every macOS §5 title prints PASS exactly once and never FAIL or SKIP", mac.filter(([file, title]) => printed(file, "PASS", title) !== 1 || printed(file, "FAIL", title) || printed(file, "SKIP", title)).map(([, title]) => title.slice(0, 70)), [], `${mac.length} titles`);
	// §5.1's macOS loop instances, and the existing win32-degrade loops over desiredHooks and steps HOOKS (§5.2 "green with
	// no edit", lines 210-238 covering R-1056's six), which print one more instance each once the hook is wired: the label
	// is (i)'s `SessionStart roster notice`. Each template is read from the base's file, so a typo here reads red there.
	const RN_LABEL = "SessionStart roster notice";
	const WD_TEMPLATES = [
		["win32: exactly one ${w.label} entry, exec form (command \"node\", args array, no shell key)", RN_LABEL],
		["win32: ${w.label} args[0] is absolute, exists, and ends with the entry's script", RN_LABEL],
		["win32 doctor: ${label} reads skipped (win32)", `hook ${HOOK_NAME}`],
		["win32 doctor: settings ${w.label} is ✓", RN_LABEL],
		["win32 doctor: a stale ${w.label} target reads ✗", RN_LABEL],
		["win32: stale ${w.label} install exits 0", RN_LABEL],
		["win32: stale ${w.label} is repaired in place to this checkout, no twin", RN_LABEL],
		["win32 doctor: settings ${w.label} reads ✓ after repair", RN_LABEL],
	];
	const wdBase = atBase(ST.WD) ?? "";
	out("(harness) each win32-degrade loop template is in the base's win32-degrade.test.mjs", WD_TEMPLATES.filter(([tpl]) => !wdBase.includes(tpl)).map(([tpl]) => tpl), []);
	const instances = [
		...loops.filter(([file]) => !ST.WINDOWS_ONLY.includes(file)).map(([file, tpl, name]) => [file, ST.loopPrinted(tpl, name)]),
		...WD_TEMPLATES.map(([tpl, name]) => [ST.WD, ST.loopPrinted(tpl, name)]),
	];
	out("(g) every macOS loop instance prints PASS exactly once and never FAIL: install's hook link, win32-degrade's skipped and created lines, and the existing win32 loops' roster notice instances, the stale-entry repair in place included (§5.1, R-1056, R-1055)",
		instances.filter(([file, title]) => printed(file, "PASS", title) !== 1 || printed(file, "FAIL", title)).map(([, title]) => title.slice(0, 90)), [], `${instances.length} instances`);
	for (const [file, title] of entries.filter(([f]) => ST.WINDOWS_ONLY.includes(f))) windowsLeg(`(g) read from the PR's Windows leg, PASS required: ${file} — "${title}"`);
	windowsLeg(`(g) read from the PR's Windows leg, PASS required: ${ST.XW} — doctor: "settings SessionStart roster notice" is ✓; and CI's Windows install check passes the roster notice row (DOCTOR_NOTES included)`);
}

out("(harness) the run wrote nothing inside the checkout (git status unchanged)", statusOf() === statusBefore, true);
console.log(`cases: ${n - bad}/${n} (build cases red: ${badBuild}/${nBuild}; guard and harness red: ${bad - badBuild}/${n - nBuild})`);
console.log(`roster-notice acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
