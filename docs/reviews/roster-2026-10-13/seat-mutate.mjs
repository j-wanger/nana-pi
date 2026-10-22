#!/usr/bin/env node
// Seat mutation runner for lane roster (frozen table; CHANGE.md §5 "Wrong code first", pairs 1-52 as
// renumbered by the "Seat amendment (2026-10-13): Node entry" section, plus kept-clause pairs K1-K7).
// v2 (2026-10-14, written against build 2, 4686b54): adds N1-N3 (build 2's new cases, CODE mutations
// only), makes X1 a judged pair, rewrites seat correction (a), and re-anchors 14 and 44 (see below).
// For each pair: apply the wrong CODE or shipped TEXT (never a test assertion) in a detached scratch
// worktree of the lane tip, refuse when an anchor does not occur exactly once (ANCHOR-MISS = runner
// bug), syntax-check every mutated module, run the named test files with node exactly as
// scripts/test.mjs does (package-dir cwd, fresh HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_*
// and PI_CODING_AGENT_DIR scrubbed, --experimental-strip-types), and print RED / GREEN (SURVIVED) /
// WINONLY. A RED line also lists every named title that stayed GREEN and every UNNAMED red, so "reds
// exactly the titles named" is judged, not assumed.
//
// WINONLY: the runner's Windows-only title list is WIN_TITLES (every T.Win* title, seven in v2). Six
// of them print SKIP off Windows; build 2's "Windows: a refused launch writes its reason to --out" is
// missing from win32-launch.test.mjs's own WINDOWS_TITLES SKIP list, so off Windows it prints neither
// PASS nor SKIP. The baseline accepts a WIN_TITLES title that prints nothing only when its exact
// quoted title occurs in a named test file's source, and logs a BASELINE NOTE for it; any other
// title must still be a PASS or SKIP line. A pair whose every named title is not a PASS line here is
// still applied, syntax-checked and run against its macOS files; if nothing on macOS goes red it is
// recorded WINONLY (its red belongs to the Windows leg), never GREEN and never RED. A pair with any
// macOS-runnable named title is judged here as usual.
// The forced-win32 piLaunch titles run on every leg, so pairs 40-50 and N1 are judged here.
//
// Seat corrections to §5 (declared before the run): (a) §5 says shared-text pairs "edit the shared
// file, the region and nana-soul alike". Since build 2, R-1128's title reads both bullets from the
// shared file itself (no literal copy in the test), so a pair that edits the shared file, the region
// and nana-soul alike leaves nana-soul matching the shared bullets and does NOT red R-1128 by itself.
// No pair declares R-1128 (or anything else) as "also (declared)" any more; if a shared-text pair
// still reds R-1128, the runner prints it as an UNNAMED red — listed, never hidden. Only a pair that
// makes nana-soul differ from the shared file (34, 35, X1) names R-1128. (b) K7 reds by file: every
// FAIL in worker-lane, immutable-review, handoff-writer-role and review-ledger is expected; the
// runner lists them. Pairs W1-W3 are §5's "Windows-only clauses" (no numbered pair), X1 is a seat
// extra probing R-1128's byte-for-byte clause (SURVIVED at c7c7690; expected RED since build 2), and
// N1-N3 are seat pairs for build 2's three new cases; none of them is one of §5's numbered or K pairs.
//
// piLaunch anchors: pairs 40 and K7 inject after the function signature (matched by a regex on the
// signature line, so a later edit to the defaults or body leaves them applicable); pair 50 wraps the
// function by its name. The rest anchor on the one expression they change.
// Re-anchored in v2 (build 2 rewrote the two expressions; each mutation is unchanged in effect):
// 14 drops `\s` from build 2's `[\s\x00-\x1f\x7f-\x9f]` class (the C1 range stays, so only the
// whitespace refusal goes); 44 drops build 2's string-`bin` arm from the new three-line `bin`
// expression (the object arm stays), so a string bin is still ignored exactly as before.
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch
// worktree under the OS temp folder, removed at the end.
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] node seat-mutate-v2.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const LANE_REPO = "/Users/example/nana-pi-wt/roster";
// The tip under test: SEAT_MUTATE_TIP, else the lane branch head (v1 written against c7c7690; v2 against 4686b54).
const TIP = process.env.SEAT_MUTATE_TIP || "feat/roster";
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "roster-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const TIMEOUT_MS = 10 * 60 * 1000;

// ── test files ──────────────────────────────────────────────────────────────────────────────
const T_DIR = "packages/nana-pack/tests/";
const NR = T_DIR + "nana-roster.test.mjs";
const WL = T_DIR + "worker-lane.test.mjs";
const W32 = T_DIR + "win32-launch.test.mjs";
const TR = T_DIR + "templates-render.test.mjs";
const SC = T_DIR + "skill-claims.test.mjs";
const IR = T_DIR + "immutable-review.test.mjs";
const HW = T_DIR + "handoff-writer-role.test.mjs";
const RL = T_DIR + "review-ledger.test.mjs";
const RS = T_DIR + "review-standard.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const B = "packages/nana-pack/bin/";
const CONFIG = B + "worker-config.mjs";
const ROSTER = B + "nana-roster.mjs";
const WORKER = B + "pi-worker.mjs";
const WATCHDOG = B + "pi-watchdog.mjs";
const SHARED = "templates/_shared/working-under-nana-pi.md";
const AGENTS = "AGENTS.md"; // CLAUDE.md is a symlink to it; lines 5 (Support) and the marker region copy (R-859)
const SOUL = "packages/nana-setup/claude/rules/nana-soul.md";

// ── titles (exact, as frozen in seat-titles.mjs / the suite) ────────────────────────────────
const T = {
	R1120s: "sealed default roster is luna high builder, sol reviewer, astra land and no scout",
	R1120a: "absent user nana-pack.json yields the default roster",
	R1120n: "user nana-pack.json without a roster yields the default roster",
	R1121v: "a valid machine roster replaces every slot, keeping a null scout and a null land",
	R1121b: "a machine roster saved with a byte-order mark and CRLF line endings is read",
	R1121e: "the roster is read from PI_CODING_AGENT_DIR, not the home agent dir",
	R1121p: "a project .pi/nana-pack.json roster is never read",
	R1121l: "lane ignores a roster in project .pi/nana-pack.json",
	R1122s: "each invalid roster shape is refused naming the slot or field",
	R1122f: "an unreadable or malformed user nana-pack.json is refused naming the file",
	R1122c1: "a provider or model holding a C1 control character is refused naming the slot and field",
	R1123p: "roster command prints one line per slot and the source",
	R1123r: "roster command prints a refused roster on stderr and exits 1",
	R961refit: "lane passes only the sealed roster and fixed brief instruction",
	R961m: "lane passes the machine roster builder to pi, each flag once",
	R961o: "lane omits --thinking when the machine roster builder thinking is null",
	R961r: "lane refuses a refused roster before starting pi, naming the file",
	R961order: "verified lane passes preamble and validated brief as ordered file paths",
	R961caller: "lane mode refuses all caller pi arguments before lock or spawn",
	R961tools: "lane refuses caller tools without edit and write",
	R961tc: "lane refuses tool-control forms -t, --tools, --exclude-tools, --no-tools",
	R961rd: "lane refuses resource-disabling forms -nc, --no-context-files, -ne, --no-extensions, -na, --no-approve",
	R961retry: "lane refuses retries before launch",
	R1124: "lane prints the resolved builder and roster source on stderr before starting pi",
	R1125entry: "win32 launch runs the npm pi package's bin entry with the running node and the arguments unchanged",
	R1125exe: "win32 launch starts a pi.exe directly",
	R1125ref: "win32 launch refuses with a named reason when pi, its package, its bin or its entry is missing",
	R1125posix: "non-win32 launch is pi by name with the arguments unchanged",
	R1125bin: "win32 launch refuses with a named reason, without throwing, when pi's bin is not a string",
	WinLane: "Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv",
	WinRaw: "Windows: non-lane pi-worker hands pi line breaks, %, !, quotes and a trailing backslash unchanged",
	WinReview: "Windows: pi-review hands the review standard to pi as text",
	WinBusy: "Windows: a busy pi is not stopped as stalled",
	WinNoPkg: "Windows: a pi.cmd with no npm package beside it starts nothing and leaves no capture directory",
	WinAltPath: "Windows: lane pi-worker starts pi from a short or differently cased worktree path",
	WinRefusedOut: "Windows: a refused launch writes its reason to --out",
	RLworker: "pi-worker runs a worker under the watchdog (exit 0, output written)",
	R1126: "shared working pattern makes the pattern the default with the machine roster",
	R1127: "shared working pattern gives the land review to the seat when the roster sets no land model",
	R1128: "nana-soul carries the shared default-pattern and seat land review bullets",
	R684: "three front doors carry one identical scoped platform claim",
	R598sc: "checkout shared-section claim paths resolve",
	R598py: "python scaffold: all declared skill paths resolve independently",
	R598ts: "typescript scaffold: all declared skill paths resolve independently",
	R598pa: "python adopt: all declared skill paths resolve independently",
	R598ta: "typescript adopt: all declared skill paths resolve independently",
};

// The runner's Windows-only title list (header, WINONLY).
const WIN_TITLES = new Set(Object.entries(T).filter(([k]) => k.startsWith("Win")).map(([, v]) => v));

const one = (file, anchor, replacement) => ({ file, anchor, replacement });
// Shared-text pairs edit the shared file, the AGENTS.md region and nana-soul alike (§5), so R-859 stays green.
const all3 = (anchor, replacement) => [SHARED, AGENTS, SOUL].map((file) => one(file, anchor, replacement));
const regionOnly = (anchor, replacement) => [SHARED, AGENTS].map((file) => one(file, anchor, replacement));

// ── anchors ─────────────────────────────────────────────────────────────────────────────────
// pi-watchdog: the piLaunch signature line, whatever its defaults (inject after it).
const PILAUNCH_SIG = /^export function piLaunch\([^\n]*\{\n/m;
const afterSig = (inject) => ({ file: WATCHDOG, anchorRe: PILAUNCH_SIG, inject });
const EXE_BRANCH = "if (ext === '.exe' || ext === '.com') return { command: found, args: piArgs };";
// pi-worker: the builder line, the roster refusal, the piArgs pieces.
const BUILDER_LINE = "\tprocess.stderr.write(`pi-worker: builder: ${builder.provider} ${builder.model} ${builder.thinking ?? 'default'}; source: ${rosterResult.source}\\n`);\n";
const RUN_CATCH = "} catch (error) { if (laneLock) releaseLaneLock(laneLock); throw error; }\n";
const ROSTER_REFUSAL = "\tif (!rosterResult.ok) laneFailure(`roster refused: ${rosterResult.file}: ${rosterResult.problem}`);\n";
// shipped text
const DP_HEAD = "- Default pattern: a change that touches code with tests goes through the pattern; questions and one-line fixes get a direct answer.";
const ROSTER_CMD = "`node \"$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs\"`";
const WORKER_CMD = "`node \"$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs\"`";
const REVIEW_CMD = "`node \"$HOME/nana-pi/packages/nana-pack/bin/pi-review.mjs\"`";
const tilde = (cmd) => cmd.replace("\"$HOME/", "~/").replace(".mjs\"`", ".mjs`");
const SEAT_LAND_LINE = "- Seat land review: when the roster sets no land model (it prints `land: seat`), the seat writes its land review as `docs/reviews/<lane>-<date>/seat-land.md` in the lane's reviewed change before the final round; the independent slice review still covers every land.\n";
const SUPPORT_NEW = "and the review and builder launchers run through node from the checkout with an npm-installed pi;";
// build 2 (4686b54): the roster's provider/model character class and piLaunch's bin expression.
const CHAR_CLASS = "/[\\s\\x00-\\x1f\\x7f-\\x9f]/.test(v)";
const BIN_EXPR = "const bin = typeof packageJson.bin === 'string'\n    ? packageJson.bin\n    : (packageJson.bin !== null && typeof packageJson.bin === 'object' && typeof packageJson.bin[PI_BIN_NAME] === 'string' ? packageJson.bin[PI_BIN_NAME] : undefined);";
const BIN_EXPR_STRING_ARM = "const bin = typeof packageJson.bin === 'string'\n    ? packageJson.bin\n    : (";
const REFUSED_TEXT = "return { ok: false, text: `pi launch refused: ${launch.refused}` };";

// Frozen table. `edits` are applied in order; `expectRed` are the exact titles §5 says go red;
// `alsoRed` are the seat's declared corrections (header); `expectRedFiles` makes every FAIL in those
// files expected (K7 only).
const NR_WL = [NR, WL];
const CONF_T = [NR, WL, W32];
const WD_T = [W32, WL];
const PAIRS = [
	// R-1120 → sealed-default title only (1-3); 4 absent title; 5 no-roster title
	{ n: "1", name: "retune ROSTER_DEFAULTS.reviewer.model", edits: [one(CONFIG, "reviewer: Object.freeze({ provider: 'openai-codex', model: 'gpt-5.6-sol', thinking: null }),", "reviewer: Object.freeze({ provider: 'openai-codex', model: 'gpt-5.6-sol-mini', thinking: null }),")], tests: CONF_T, expectRed: [T.R1120s] },
	{ n: "2", name: "retune LANE_DEFAULTS.model", edits: [one(CONFIG, "  model: 'gpt-6-luna',\n", "  model: 'gpt-6-luna-mini',\n")], tests: CONF_T, expectRed: [T.R1120s] },
	{ n: "3", name: "set ROSTER_DEFAULTS.scout to the builder", edits: [one(CONFIG, "  scout: null,\n", "  scout: Object.freeze({ provider: LANE_DEFAULTS.provider, model: LANE_DEFAULTS.model, thinking: LANE_DEFAULTS.thinking }),\n")], tests: CONF_T, expectRed: [T.R1120s] },
	{ n: "4", name: "ENOTDIR counted present (refused, not absent)", edits: [one(ROSTER, "if (code === 'ENOENT' || code === 'ENOTDIR') {", "if (code === 'ENOENT') {")], tests: NR_WL, expectRed: [T.R1120a] },
	{ n: "5", name: "a file without `roster` is refused", edits: [one(ROSTER, "if (raw.roster === undefined) return { ok: true, roster: ROSTER_DEFAULTS, source: 'default' };", "if (raw.roster === undefined) return { ok: false, file, problem: 'no roster key' };")], tests: NR_WL, expectRed: [T.R1120n] },
	// R-1121
	{ n: "6", name: "a null scout or land takes the default slot", edits: [one(ROSTER, "  return { roster: value };\n", "  return { roster: { ...value, scout: value.scout ?? ROSTER_DEFAULTS.scout, land: value.land ?? ROSTER_DEFAULTS.land } };\n")], tests: NR_WL, expectRed: [T.R1121v, T.R1123p] },
	{ n: "7", name: "no BOM strip", edits: [one(ROSTER, "JSON.parse(state.text.replace(/^﻿/, ''))", "JSON.parse(state.text)")], tests: NR_WL, expectRed: [T.R1121b] },
	{ n: "8", name: "the CLI passes os.homedir()/.pi/agent", edits: [one(ROSTER, "import * as path from 'node:path';\n", "import * as path from 'node:path';\nimport * as os from 'node:os';\n"), one(ROSTER, "const result = resolveRoster(piAgentDir());", "const result = resolveRoster(path.join(os.homedir(), '.pi', 'agent'));")], tests: NR_WL, expectRed: [T.R1121e, T.R1123p, T.R1123r] },
	{ n: "9", name: "the cwd project .pi/nana-pack.json is read", edits: [one(ROSTER, "  const file = path.join(agentDir, 'nana-pack.json');\n", "  const projectFile = path.join(process.cwd(), '.pi', 'nana-pack.json');\n  const file = fs.existsSync(projectFile) ? projectFile : path.join(agentDir, 'nana-pack.json');\n")], tests: NR_WL, expectRed: [T.R1121p, T.R1121l] },
	// R-1122 → shapes title (10-15); file-refusal title (16-18)
	{ n: "10", name: "a missing slot takes the default", edits: [one(ROSTER, "  if (missing.length) return { problem: `roster is missing ${missing.join(', ')}` };\n", "  for (const s of missing) value = { ...value, [s]: ROSTER_DEFAULTS[s] };\n")], tests: NR_WL, expectRed: [T.R1122s] },
	{ n: "11", name: "any thinking accepted", edits: [one(ROSTER, "if (value.thinking !== null && !THINKING_LEVELS.includes(value.thinking)) {", "if (false) {")], tests: NR_WL, expectRed: [T.R1122s] },
	{ n: "12", name: "an extra entry field (`tools`) accepted", edits: [one(ROSTER, "  if (extra.length) return `roster.${slot} has an unexpected field ${extra.join(', ')}`;\n", "")], tests: NR_WL, expectRed: [T.R1122s] },
	{ n: "13", name: "a null builder accepted", edits: [one(ROSTER, "return NULLABLE_SLOTS.includes(slot) ? null : `roster.${slot} is not an entry (null)`;", "return null;")], tests: NR_WL, expectRed: [T.R1122s] },
	{ n: "14", name: "whitespace in a model accepted", edits: [one(ROSTER, CHAR_CLASS, "/[\\x00-\\x1f\\x7f-\\x9f]/.test(v)")], tests: NR_WL, expectRed: [T.R1122s] },
	{ n: "15", name: "the provider/model refusal omits the field", edits: [one(ROSTER, "return `roster.${slot}.${field} must be", "return `roster.${slot} must be")], tests: NR_WL, expectRed: [T.R1122s] },
	{ n: "16", name: "a dangling symlink counts as absent", edits: [one(ROSTER, "      if (isLink(file)) return { kind: 'refused', problem: `dangling symlink: ${file}` };\n", "")], tests: NR_WL, expectRed: [T.R1122f] },
	{ n: "17", name: "no bounded-read cap", edits: [one(ROSTER, "buf = readBounded(file, BOUNDED_READ_CAP);", "buf = readBounded(file, Number.MAX_SAFE_INTEGER);")], tests: NR_WL, expectRed: [T.R1122f] },
	{ n: "18", name: "a top-level `[]` read as no roster", edits: [one(ROSTER, "  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {\n", "  if (Array.isArray(raw)) return { ok: true, roster: ROSTER_DEFAULTS, source: 'default' };\n  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {\n")], tests: NR_WL, expectRed: [T.R1122f] },
	// R-1123
	{ n: "19", name: "`none` for a null land", edits: [one(ROSTER, "`${slot}: ${slot === 'scout' ? 'none' : 'seat'}`", "`${slot}: none`")], tests: NR_WL, expectRed: [T.R1123p] },
	{ n: "20", name: "no source line", edits: [one(ROSTER, "  lines.push(`source: ${source}`);\n", "")], tests: NR_WL, expectRed: [T.R1123p] },
	{ n: "21", name: "exit 0 on a refusal", edits: [one(ROSTER, "    process.exit(1);\n  }\n  for (const line of formatRosterLines", "    process.exit(0);\n  }\n  for (const line of formatRosterLines")], tests: NR_WL, expectRed: [T.R1123r] },
	{ n: "22", name: "refusal on stdout", edits: [one(ROSTER, "process.stderr.write(`nana-roster: roster refused:", "process.stdout.write(`nana-roster: roster refused:")], tests: NR_WL, expectRed: [T.R1123r] },
	// R-961
	{ n: "23", name: "lane falls back to the default builder on a refused roster", edits: [one(WORKER, ROSTER_REFUSAL, "\tif (!rosterResult.ok) Object.assign(rosterResult, { ok: true, roster: { builder: { provider: LANE_DEFAULTS.provider, model: LANE_DEFAULTS.model, thinking: LANE_DEFAULTS.thinking } }, source: 'default' });\n")], tests: [WL], expectRed: [T.R961r] },
	{ n: "24", name: "provider from LANE_DEFAULTS, not the roster", edits: [one(WORKER, "'--provider', builder.provider,", "'--provider', LANE_DEFAULTS.provider,")], tests: [WL], expectRed: [T.R961m] },
	{ n: "25", name: "`--thinking null` passed", edits: [one(WORKER, "...(builder.thinking === null ? [] : ['--thinking', builder.thinking])", "'--thinking', String(builder.thinking)")], tests: [WL], expectRed: [T.R961o] },
	{ n: "26", name: "drop `write` from LANE_DEFAULTS.tools", edits: [one(CONFIG, "tools: 'read,grep,find,bash,edit,write',", "tools: 'read,grep,find,bash,edit',")], tests: CONF_T, expectRed: [T.R961refit] },
	// R-1126 (27-29), R-1127 (30-33), R-1128 (34-35)
	{ n: "27", name: "delete \"a change that touches code with tests goes through the pattern\"", edits: all3(DP_HEAD, "- Default pattern: questions and one-line fixes get a direct answer."), tests: [TR], expectRed: [T.R1126] },
	{ n: "28", name: "delete \"questions and one-line fixes get a direct answer\"", edits: all3(DP_HEAD, "- Default pattern: a change that touches code with tests goes through the pattern."), tests: [TR], expectRed: [T.R1126] },
	{ n: "29", name: "`\"$HOME/` → `~/` in the roster command", edits: all3(ROSTER_CMD, tilde(ROSTER_CMD)), tests: [TR], expectRed: [T.R1126] },
	{ n: "30", name: "delete \"when the roster sets no land model\"", edits: all3("- Seat land review: when the roster sets no land model (it prints `land: seat`), the seat writes", "- Seat land review: the seat writes"), tests: [TR], expectRed: [T.R1127] },
	{ n: "31", name: "the seat-land.md path → a scratch path", edits: all3("`docs/reviews/<lane>-<date>/seat-land.md`", "`<scratch>/seat-land.md`"), tests: [TR], expectRed: [T.R1127] },
	{ n: "32", name: "delete \"before the final round\"", edits: all3("in the lane's reviewed change before the final round;", "in the lane's reviewed change;"), tests: [TR], expectRed: [T.R1127] },
	{ n: "33", name: "delete \"the independent slice review still covers every land\"", edits: all3("before the final round; the independent slice review still covers every land.", "before the final round."), tests: [TR], expectRed: [T.R1127] },
	{ n: "34", name: "nana-soul alone loses bullet 2", edits: [one(SOUL, SEAT_LAND_LINE, "")], tests: [TR], expectRed: [T.R1128] },
	{ n: "35", name: "nana-soul alone writes `~/`", edits: [one(SOUL, ROSTER_CMD, tilde(ROSTER_CMD))], tests: [TR], expectRed: [T.R1128] },
	// R-1124 → builder-line title
	{ n: "36", name: "print the builder line after the run", edits: [one(WORKER, BUILDER_LINE, "\tglobalThis.__seatBuilderLine = `pi-worker: builder: ${builder.provider} ${builder.model} ${builder.thinking ?? 'default'}; source: ${rosterResult.source}\\n`;\n"), one(WORKER, RUN_CATCH, RUN_CATCH + "if (globalThis.__seatBuilderLine) process.stderr.write(globalThis.__seatBuilderLine);\n")], tests: [WL], expectRed: [T.R1124] },
	{ n: "37", name: "always `source: default`", edits: [one(WORKER, "; source: ${rosterResult.source}\\n`);", "; source: default\\n`);")], tests: [WL], expectRed: [T.R1124] },
	{ n: "38", name: "print LANE_DEFAULTS, not the resolved builder", edits: [one(WORKER, "`pi-worker: builder: ${builder.provider} ${builder.model} ${builder.thinking ?? 'default'};", "`pi-worker: builder: ${LANE_DEFAULTS.provider} ${LANE_DEFAULTS.model} ${LANE_DEFAULTS.thinking};")], tests: [WL], expectRed: [T.R1124] },
	{ n: "39", name: "drop the thinking field from the builder line", edits: [one(WORKER, "${builder.model} ${builder.thinking ?? 'default'}; source:", "${builder.model}; source:")], tests: [WL], expectRed: [T.R1124] },
	// R-1125 → entry title (40-45; 40 also .exe and refusal); .exe title (46); refusal title (47-50)
	{ n: "40", name: "win32 returns `pi` by name, no findPi", edits: [afterSig("  return { command: 'pi', args: piArgs };\n")], tests: WD_T, expectRed: [T.R1125entry, T.R1125exe, T.R1125ref] },
	{ n: "41", name: "retune PI_PACKAGE", edits: [one(CONFIG, "export const PI_PACKAGE = '@earendil-works/pi-coding-agent';", "export const PI_PACKAGE = '@earendil-works/pi-coding-agent-next';")], tests: CONF_T, expectRed: [T.R1125entry] },
	{ n: "42", name: "package folder from %APPDATA%\\npm or the cwd, not the shim's folder", edits: [one(WATCHDOG, "const shimDir = win.dirname(found);", "const shimDir = env.APPDATA ? win.join(env.APPDATA, 'npm') : cwd;")], tests: WD_T, expectRed: [T.R1125entry] },
	{ n: "43", name: "run the .cmd through winCommand and ComSpec", edits: [one(WATCHDOG, "import { findPi } from '../lib/win-command.mjs';", "import { findPi, winCommand } from '../lib/win-command.mjs';"), one(WATCHDOG, EXE_BRANCH + "\n", EXE_BRANCH + "\n  { const wc = winCommand(found, piArgs, { comspec: env.ComSpec }); return wc.refused ? { refused: wc.refused } : { command: wc.command, args: wc.args }; }\n")], tests: WD_T, expectRed: [T.R1125entry] },
	{ n: "44", name: "ignore a string `bin`", edits: [one(WATCHDOG, BIN_EXPR_STRING_ARM, "const bin = (")], tests: WD_T, expectRed: [T.R1125entry] },
	{ n: "45", name: "drop the node_modules\\.bin layout", edits: [one(WATCHDOG, "const isDotBinLayout = lastTwo.length === 2 && lastTwo[0] === NPM_DIRS[0] && lastTwo[1] === NPM_DIRS[1];", "const isDotBinLayout = false;")], tests: WD_T, expectRed: [T.R1125entry] },
	{ n: "46", name: "start a .exe through node", edits: [one(WATCHDOG, EXE_BRANCH, "if (ext === '.exe' || ext === '.com') return { command: execPath, args: [found, ...piArgs] };")], tests: WD_T, expectRed: [T.R1125exe] },
	{ n: "47", name: "drop the package name check", edits: [one(WATCHDOG, " || packageJson.name !== PI_PACKAGE) {", ") {")], tests: WD_T, expectRed: [T.R1125ref] },
	{ n: "48", name: "drop the bin containment check", edits: [one(WATCHDOG, "if (relative.startsWith('..') || win.isAbsolute(relative)) {", "if (false) {")], tests: WD_T, expectRed: [T.R1125ref] },
	{ n: "49", name: "drop the entry-file check", edits: [one(WATCHDOG, "  if (!isFile(entry)) return { refused: `pi entry ${entry} is not a file` };\n", "")], tests: WD_T, expectRed: [T.R1125ref] },
	{ n: "50", name: "fall back to `pi` by name on every refusal", edits: [one(WATCHDOG, "export function piLaunch(", "export function piLaunch(piArgs, opts) { const r = piLaunchInner(piArgs, opts); return r.refused ? { command: 'pi', args: piArgs } : r; }\nfunction piLaunchInner(")], tests: WD_T, expectRed: [T.R1125ref] },
	// R-1126 extras
	{ n: "51", name: "delete the pi-review launcher command", edits: all3(` and ${REVIEW_CMD} with the same arguments.`, " with the same arguments."), tests: [TR], expectRed: [T.R1126] },
	{ n: "52", name: "`\"$HOME/` → `~/` in the pi-worker launcher command", edits: all3(WORKER_CMD, tilde(WORKER_CMD)), tests: [TR], expectRed: [T.R1126] },
	// Kept clauses K1-K7
	{ n: "K1", name: "delete the caller-pi-arguments refusal", edits: [one(WORKER, "\tif (separator >= 0 && all.slice(separator + 1).length) laneFailure('caller pi arguments are refused in lane mode');\n", "")], tests: [WL], expectRed: [T.R961caller, T.R961tools, T.R961tc, T.R961rd] },
	{ n: "K2", name: "delete the retries refusal (both checks)", edits: [one(WORKER, "\tif (ownValues.has('--retries') && Number(value('--retries')) > 0) laneFailure('--retries greater than zero is refused in lane mode');\n", ""), one(WORKER, "if (laneMode && w.retries > 0) laneFailure('--retries greater than zero is refused in lane mode');\n", "")], tests: [WL], expectRed: [T.R961retry] },
	{ n: "K3", name: "brief before preamble", edits: [one(WORKER, "'--append-system-prompt', preambleFile, '--append-system-prompt', briefPath,", "'--append-system-prompt', briefPath, '--append-system-prompt', preambleFile,")], tests: [WL], expectRed: [T.R961order] },
	{ n: "K4", name: "alter the fixed lane instruction", edits: [one(WORKER, "`Do the work in your brief for lane ${lane}. Your cwd", "`Do the work in your brief for lane ${lane} now. Your cwd")], tests: [WL], expectRed: [T.R961refit] },
	{ n: "K5", name: "add a bare `nana-roster.mjs` to bullet 1", edits: all3(`printed by ${ROSTER_CMD}.`, `printed by ${ROSTER_CMD} (\`nana-roster.mjs\`).`), tests: [SC, TR], expectRed: [T.R598sc, T.R598py, T.R598ts, T.R598pa, T.R598ta] },
	{ n: "K6", name: "restore \"the review and builder launchers are unavailable\" in AGENTS.md alone", edits: [one(AGENTS, SUPPORT_NEW, "and the review and builder launchers are unavailable;")], tests: [TR], expectRed: [T.R684] },
	{ n: "K7", name: "apply the win32 launch on every platform", edits: [afterSig("  platform = 'win32';\n")], tests: [W32, WL, IR, HW, RL, RS], expectRed: [T.R961order, T.RLworker, T.R1125posix], expectRedFiles: [WL, IR, HW, RL] },
	// §5's Windows-only clauses (no numbered pair; expected WINONLY)
	{ n: "W1", name: "a launch refusal leaves its capture dir behind", edits: [one(WATCHDOG, "    try { rmSync(dirname(tmp), { recursive: true, force: true }); } catch { /* best-effort cleanup */ }\n    process.stderr.write(`[${tag}] pi launch refused:", "    process.stderr.write(`[${tag}] pi launch refused:")], tests: WD_T, expectRed: [T.WinNoPkg] },
	{ n: "W2", name: "win32 lane paths by the JS realpath, not the native one", edits: [one(WORKER, "function fsReal(p) { return process.platform === 'win32' ? realpathSync.native(p) : realpathSync(p); }", "function fsReal(p) { return realpathSync(p); }")], tests: [WL, W32], expectRed: [T.WinAltPath] },
	{ n: "W3", name: "win32 spawns through a shell (cmd.exe becomes the child)", edits: [one(WATCHDOG, "detached: true, env: { ...process.env, NANA_HANDOFF: 'off', ...childEnv } });", "detached: true, shell: process.platform === 'win32', env: { ...process.env, NANA_HANDOFF: 'off', ...childEnv } });")], tests: WD_T, expectRed: [T.WinRaw, T.WinReview, T.WinLane] },
	// Seat extra: R-1128's "byte for byte" — the shared bullets drift from nana-soul in an unpinned word
	// (SURVIVED at c7c7690; since build 2 R-1128 reads the bullets from the shared file, so it is judged).
	{ n: "X1", name: "shared file and region alone: \"with the same arguments\" → \"with the same flags\" (nana-soul untouched)", edits: regionOnly("with the same arguments.", "with the same flags."), tests: [TR], expectRed: [T.R1128] },
	// Seat pairs for build 2's new cases (CODE only, never a test)
	{ n: "N1", name: "restore the old `bin` expression (a non-string object bin reaches win.resolve)", edits: [one(WATCHDOG, BIN_EXPR, "const bin = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.[PI_BIN_NAME];")], tests: WD_T, expectRed: [T.R1125bin] },
	{ n: "N2", name: "the provider/model class back to `[\\s\\x00-\\x1f\\x7f]` (C1 accepted)", edits: [one(ROSTER, CHAR_CLASS, "/[\\s\\x00-\\x1f\\x7f]/.test(v)")], tests: NR_WL, expectRed: [T.R1122c1] },
	{ n: "N3", name: "a refused launch returns empty text (nothing reaches --out)", edits: [one(WATCHDOG, REFUSED_TEXT, "return { ok: false, text: '' };")], tests: WD_T, expectRed: [T.WinRefusedOut] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const git = (...args) => sh("git", args);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
const BASE_ENV = (() => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	return e;
})();
let runSeq = 0;

function addWorktree(dir, ref) {
	if (fs.existsSync(dir)) { git("-C", LANE_REPO, "worktree", "remove", "--force", dir); fs.rmSync(dir, { recursive: true, force: true }); }
	git("-C", LANE_REPO, "worktree", "prune");
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", dir, ref);
	if (r.status !== 0) throw new Error(`worktree add ${ref} failed: ${r.stderr}`);
}
function removeWorktree(dir) {
	git("-C", LANE_REPO, "worktree", "remove", "--force", dir);
	fs.rmSync(dir, { recursive: true, force: true });
	git("-C", LANE_REPO, "worktree", "prune");
}
function resetWorktree() {
	git("-C", WT, "checkout", "--", ".");
	git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
	const st = git("-C", WT, "status", "--porcelain");
	if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
}

/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
function runTest(rel) {
	const file = path.join(WT, rel);
	const cwd = path.dirname(path.dirname(file)); // the package dir (every file here is <pkg>/tests/x)
	const id = ++runSeq;
	const home = path.join(RUNS, `home-${id}`);
	const tmp = path.join(RUNS, `tmp-${id}`);
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(tmp, { recursive: true });
	const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
	const t0 = Date.now();
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ["--experimental-strip-types", file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
		let out = "";
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { out += d; });
		let timedOut = false;
		const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, TIMEOUT_MS);
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			try { process.kill(-child.pid, "SIGKILL"); } catch {} // stray group members (a mutated launcher's child)
			fs.rmSync(home, { recursive: true, force: true });
			fs.rmSync(tmp, { recursive: true, force: true });
			resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
		});
	});
}
const lineTitles = (out, tag) => out.split("\n").filter((l) => l.startsWith(`${tag} `)).map((l) => l.slice(tag.length + 1).trim());
const isTitle = (t, title) => t === title || t.startsWith(`${title} `);
const short = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
// The file itself died on an uncaught throw when node's crash footer is its LAST line (a child's
// crash quoted inside a FAIL detail is followed by the test's own later lines).
const fileCrashed = (out) => /^Node\.js v\d+\.\d+\.\d+$/.test(out.trim().split("\n").at(-1) ?? "");

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

function applyEdits(p) {
	for (const e of p.edits) {
		const abs = path.join(WT, e.file);
		const text = fs.readFileSync(abs, "utf8");
		if (e.anchorRe) {
			const re = new RegExp(e.anchorRe.source, e.anchorRe.flags.includes("g") ? e.anchorRe.flags : e.anchorRe.flags + "g");
			const hits = [...text.matchAll(re)];
			if (hits.length !== 1) return `${e.file}: anchor ${e.anchorRe} matches ${hits.length}×`;
			const at = hits[0].index + hits[0][0].length;
			fs.writeFileSync(abs, text.slice(0, at) + e.inject + text.slice(at));
		} else {
			const c = count(text, e.anchor);
			if (c !== 1) return `${e.file}: anchor occurs ${c}× — ${short(JSON.stringify(e.anchor), 90)}`;
			fs.writeFileSync(abs, text.replace(e.anchor, () => e.replacement));
		}
	}
	return null;
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.rmSync(RUNS, { recursive: true, force: true });
fs.mkdirSync(RUNS, { recursive: true });
const tipSha = git("-C", LANE_REPO, "rev-parse", TIP).stdout.trim();
log(`seat-mutate: lane roster, tip ${tipSha}, ${pairs.length} pairs, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
addWorktree(WT, tipSha);

const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, winOnly: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
const survivors = [], winOnly = [];
const basePass = {}, baseSkip = {};
try {
	// Baseline: every named file, unmutated, must exit 0 with no FAIL line.
	const files = [...new Set(pairs.flatMap((p) => p.tests))];
	let baselineOk = true;
	for (const rel of files) {
		const r = await runTest(rel);
		const fl = lineTitles(r.out, "FAIL");
		const ok = r.code === 0 && !r.timedOut && fl.length === 0;
		basePass[rel] = lineTitles(r.out, "PASS");
		baseSkip[rel] = lineTitles(r.out, "SKIP");
		log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${basePass[rel].length} PASS, ${baseSkip[rel].length} SKIP, ${fl.length} FAIL, ${r.secs}s)${ok ? "" : " — " + fl.slice(0, 3).map((t) => short(t)).join(" | ")}`);
		if (!ok) baselineOk = false;
	}
	// Every expected title must be a PASS line (judged here) or a SKIP line (Windows leg) in the baseline.
	for (const p of pairs) for (const title of [...p.expectRed, ...(p.alsoRed ?? [])]) {
		const pass = p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)));
		const skip = p.tests.some((rel) => baseSkip[rel].some((t) => isTitle(t, title)));
		if (!pass && !skip) {
			const inSource = p.tests.some((rel) => fs.readFileSync(path.join(WT, rel), "utf8").includes(JSON.stringify(title)));
			if (WIN_TITLES.has(title) && inSource) log(`BASELINE NOTE pair ${p.n}: Windows-leg title ${JSON.stringify(title)} prints neither PASS nor SKIP on ${process.platform} (not in the test's WINDOWS_TITLES SKIP list); its check is in the source, so it is judged as Windows-leg only`);
			else { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${JSON.stringify(title)} is neither a PASS nor a SKIP line in ${p.tests.join(", ")}`); }
		}
	}
	resetWorktree();
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			resetWorktree();
			const miss = applyEdits(p);
			if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
			const diff = git("-C", WT, "diff", "--shortstat").stdout.trim();
			let bad = null;
			for (const f of new Set(p.edits.map((e) => e.file))) {
				if (!/\.(mjs|js)$/.test(f)) continue;
				const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
				if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
			}
			if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
			tally.runnable++;
			const skipHere = (title) => !p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)));
			const winTitles = p.expectRed.filter(skipHere);
			const judged = p.expectRed.filter((s) => !skipHere(s));
			const declared = p.alsoRed ?? [];
			const allFails = [], passTitles = [], crashed = [];
			for (const rel of p.tests) {
				const r = await runTest(rel);
				passTitles.push(...lineTitles(r.out, "PASS"));
				allFails.push(...lineTitles(r.out, "FAIL").map((t) => ({ rel, t })));
				// An uncaught throw ends the file early: checks after it never print, so a named case
				// that is absent from the output was NOT green — it was never reached.
				if (fileCrashed(r.out)) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(r.out.trim().split("\n").filter((l) => /^[A-Za-z]*Error\b/.test(l)).at(-1) ?? "", 120)}`);
				else if ((r.code !== 0 || r.timedOut) && !lineTitles(r.out, "FAIL").length) crashed.push(`${path.basename(rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
			}
			const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
			const matched = judged.filter(failed);
			const namedGreen = judged.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
			const notReached = judged.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
			const declaredRed = declared.filter(failed);
			const byFile = allFails.filter(({ rel, t }) => (p.expectRedFiles ?? []).includes(rel) && !judged.some((s) => isTitle(t, s)));
			const unnamed = allFails.filter(({ rel, t }) => ![...judged, ...declared].some((s) => isTitle(t, s)) && !(p.expectRedFiles ?? []).includes(rel));
			const extra = `${winTitles.length ? `; Windows-leg titles (not judged here): ${winTitles.map((s) => JSON.stringify(s)).join(", ")}` : ""}${declaredRed.length ? `; also (declared): ${declaredRed.map((s) => short(s, 70)).join(" | ")}` : ""}${byFile.length ? `; by file (expected): ${byFile.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 80)}`).join(" | ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 90)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
			if (!judged.length && !allFails.length && !crashed.length) {
				tally.winOnly++;
				winOnly.push(p.n);
				log(`WINONLY ${p.n} ${p.name} — applied and syntax-checked; every named title is Windows-leg only and nothing on ${process.platform} went red${extra}`);
			} else if (matched.length) {
				tally.red++;
				if (namedGreen.length || notReached.length) tally.namedGreen++;
				if (unnamed.length) tally.unnamedRed++;
				if (!namedGreen.length && !notReached.length && !unnamed.length) tally.exact++;
				log(`RED ${p.n} ${p.name} — ${matched.map((t) => short(t, 90)).join(" | ")}${extra}`);
			} else if (allFails.length || crashed.length) {
				tally.red++;
				if (judged.length) tally.namedGreen++;
				if (unnamed.length) tally.unnamedRed++;
				log(`RED ${p.n} ${p.name} — (no named case)${extra}`);
			} else {
				tally.survived++;
				survivors.push(p.n);
				log(`GREEN ${p.n} ${p.name} — SURVIVED${extra}`);
			}
		}
	}
} finally {
	try { resetWorktree(); } catch (e) { log(`seat-mutate: reset failed at cleanup: ${e.message}`); }
	removeWorktree(WT);
	fs.rmSync(SCRATCH, { recursive: true, force: true });
}
log(`RESULT: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}, ${tally.winOnly} WINONLY${winOnly.length ? ` [${winOnly.join(", ")}]` : ""}${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
