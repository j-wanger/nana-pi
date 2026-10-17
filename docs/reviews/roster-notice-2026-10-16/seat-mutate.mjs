#!/usr/bin/env node
// Seat mutation runner for lane roster-notice (CHANGE.md §5.4 "Wrong code first": 68 pairs, numbered 1 to 68, as seat
// revisions 3 to 6 and "The owner's answers" at its end leave them; the owner took D1's null default, so no pair moves).
// Form copied from docs/reviews/regroup-2026-10-15/seat-mutate.mjs, plus a built-in split into parallel shards.
// For each pair: apply the wrong code or shipped text (never a test assertion) in a detached scratch worktree of the
// lane tip, refuse when an anchor does not occur the stated number of times (ANCHOR-MISS = runner bug), syntax-check
// every mutated module (a .ts one with type stripping), run the named test files with node exactly as scripts/test.mjs
// does (package-dir cwd, fresh HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and PI_CODING_AGENT_DIR
// scrubbed, gc.auto=0 through GIT_CONFIG_*, --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig
// that `npm test` exports when the runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED
// line also lists every named title that stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is
// judged, not assumed.
//
// Pair ids are §5.4's row numbers, "1" to "68"; each row is one pair, its edits applied together.
//
// Seat readings (declared before the run; each prints as a DECLARED line, never hidden): see DECLARED.
//
// Split: SEAT_MUTATE_SHARDS=N (default 5) runs the selected pairs as N parallel child runs of this script: pair ids are
// dealt round-robin in table order, child k starts (k-1) × SEAT_MUTATE_STAGGER_SECS (default 4) seconds after the
// first, and each child has its own scratch worktree and writes its own part file. The parent then writes one merged
// output: its header, the DECLARED lines once, each shard's own lines (header, BASELINE, notes, its RESULT) prefixed
// [k/N], every pair line in table order, and one overall RESULT line summed from the shards' tallies. A selected pair
// that no shard printed reads MISSING. SEAT_MUTATE_SHARDS=1 runs every pair in this process.
//
// Never touches the lane worktree or the main checkout: each run (each shard) applies its pairs in one detached scratch
// worktree in a mkdtemp folder under os.tmpdir() (never inside the lane folder; copier-based suite tests break in a
// nested worktree), removed at the end (SEAT_MUTATE_KEEP=1 keeps it for inspection); git writes only its worktree
// metadata into the shared .git.
// SEAT_MUTATE_DRY=1 applies and syntax-checks every pair's edits and runs no test (an anchor check).
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_SHARDS=N]
//        [SEAT_MUTATE_STAGGER_SECS=S] [SEAT_MUTATE_LOGDIR=<dir>] [SEAT_MUTATE_KEEP=1] node seat-mutate.mjs [pair-id ...]
// Part files: <SEAT_MUTATE_OUT>.part<k>of<N> and its tally <…>.json, kept beside the merged output; without
// SEAT_MUTATE_OUT they go to a mkdtemp folder under os.tmpdir(), named on the last line.
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/roster-notice";
const LANE_BRANCH = "feat/roster-notice";
const TIP = process.env.SEAT_MUTATE_TIP || "59db91d44305d31fd00d3df9482346248d2c582c";
const SCRIPT = fileURLToPath(import.meta.url);
const HERE = path.dirname(SCRIPT);
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const DRY = process.env.SEAT_MUTATE_DRY === "1";
const LOGDIR = process.env.SEAT_MUTATE_LOGDIR || null; // per-pair test output, for evidence
if (LOGDIR) fs.mkdirSync(LOGDIR, { recursive: true });
// chosen: the regroup runner's per-file bound.
const TIMEOUT_MS = 10 * 60 * 1000;
// "k/N" on a shard child only (set by the parent); a child never splits again.
const SHARD = process.env.SEAT_MUTATE_SHARD || null;
// chosen (seat, 2026-10-16): five shards by default; at most two lanes run on this machine, and five test processes
// at once is the load the seat asked for.
const SHARDS_DEFAULT = "5";
// chosen: a few seconds between shard starts, so five `git worktree add` calls and five first test files do not all
// begin in the same second.
const STAGGER_SECS_DEFAULT = "4";

const DECLARED = [
	"(g) build brief 2 (seat, 2026-10-16): pairs 69 and 70 cover the home-path fix and the small lane with largerBuilder set; every other build-2 change strengthens the tests behind pairs 1-68",
	"(a) pair ids are §5.4's row numbers 1-68, one pair per row, each row's edits applied together; pairs 57, 60, 63, 64 and 67 edit templates/_shared/working-under-nana-pi.md and nana-pi's regenerated AGENTS.md region alike (CLAUDE.md is a link to AGENTS.md), as §5.4 says, so templates-render's byte-identical check stays green",
	"(b) test sets: each pair runs only the files its named titles live in — roster-notice.test.mjs (1-23, 62, 66, 68, and 27 for L15), roster-notice-hook.test.mjs (24-31, 65), settings-merge (32, 33), win32-degrade (33, 35; forced platform, so it runs on macOS), uninstall (34), state-manifest (34, 35), install.test (35), install-check (36-39), nana-roster (40-49), worker-lane (50-56, 61), templates-render (57, 59, 60, 63, 64, 67), readme-check (58)",
	"(c) outside the runner (Windows leg only, §5.4): X1 and X2 (hooks-win32-exec.test.mjs; no pair names them) and pair 33's hooks-win32-exec.test.mjs instance `doctor: \"settings SessionStart roster notice\" is ✓`; pair 33 runs here and is judged on its macOS titles only",
	"(d) install.test.mjs's space-in-home instance for this hook (plan :333, pair 35) prints `space in home: `<first 40 characters of the command>…` runs cleanly`; those characters hold the run's temp home path and are the same for every SessionStart command, so pair 35 names that title by pattern, and a FAIL on it cannot say which hook failed (under pair 35 only the roster notice's link is missing)",
	"(e) label forms the code shape forces: 12 compares the roster's JSON with ROSTER_DEFAULTS (imported for the pair); 16 keeps the placeholder for the cut but puts the raw path back and runs tildeify once over the whole refused text, which rewrites only a leading home path; 23 drops everything from ' · change: ' on in the extension's own line; 28 marks an empty input as a source of its own, so only the empty-input case loses the user message; 29 sets exitCode 1 in the catch and the CLI entry exits with it; 44 swaps the subagent-name check for the pi provider/model string rule; 45 reorders only the command's printed lines (SLOT_PRINT_ORDER, which --json reads, is unchanged); 46 removes the Claude Code print case, so the entry prints in the pi form with a provider column; 47 sets ROSTER_DEFAULTS.largerBuilder to D1's other answer, the Claude Code entry sonnet; 50 keeps the larger-lane label and starts roster.builder; 52 skips the refusal and starts pi with the entry's model under the builder's provider; 53 keeps the refusal text and laneFailure, moved to just after acquireLaneLock; 59 drops \"roster notice\" from all three desk matrix rows; 65 moves the input read out of its own try into the module try, the JSON parse still guarded",
	"(f) expected by reading, not yet run (the plan names these titles and the runner judges them as named): pair 1 leaves L1 GREEN (L1 checks that the model and thinking text are present, never that a provider is absent); pair 3 leaves L1 GREEN (L1 has no one-line check; L10's line-feed case reds); pair 27 crashes roster-notice.test.mjs in L15's block (runHookOnce's JSON.parse throws on the plain first line), so L15 reads NOT REACHED with a CRASH note; pair 33 crashes settings-merge at :278 (w32.find returns undefined for the dropped row and throws), so :302, :304, :392 and :799 read NOT REACHED; pair 36 leaves I1 GREEN (I1 calls rosterNoticeOutputOk directly and reads no HOOKS row); pair 53 leaves W3 GREEN (laneFailure releases the lock it took before exiting, so W3's no-lock-file check cannot tell after-the-lock from before it)",
];

// ── test files ──────────────────────────────────────────────────────────────────────────────
const RN = "packages/nana-pack/tests/roster-notice.test.mjs";
const RH = "packages/nana-setup/tests/roster-notice-hook.test.mjs";
const IC = "packages/nana-setup/tests/install-check.test.mjs";
const NR = "packages/nana-pack/tests/nana-roster.test.mjs";
const WL = "packages/nana-pack/tests/worker-lane.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const RC = "packages/nana-pack/tests/readme-check.test.mjs";
const SM = "packages/nana-setup/tests/settings-merge.test.mjs";
const WD = "packages/nana-setup/tests/win32-degrade.test.mjs";
const UN = "packages/nana-setup/tests/uninstall.test.mjs";
const SMF = "packages/nana-setup/tests/state-manifest.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const NOTICE = "packages/nana-pack/lib/roster-notice.mjs";
const NOTICE_CFG = "packages/nana-pack/lib/roster-notice-config.mjs";
const EXT = "packages/nana-pack/extensions/nana-roster-notice.ts";
const HOOK = "packages/nana-setup/claude/hooks/nana-roster-notice.mjs";
const SETTINGS = "packages/nana-setup/lib/settings.mjs";
const STATE = "packages/nana-setup/lib/state-manifest.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const ICC = "packages/nana-setup/lib/install-check-config.mjs";
const ICL = "packages/nana-setup/lib/install-check.mjs";
const ROSTER = "packages/nana-pack/bin/nana-roster.mjs";
const WCFG = "packages/nana-pack/bin/worker-config.mjs";
const WORKER = "packages/nana-pack/bin/pi-worker.mjs";
const SHARED = "templates/_shared/working-under-nana-pi.md";
const AGENTS = "AGENTS.md";
const ROOT_README = "README.md";
const DESK_README = "apps/desk/README.md";

// ── titles (exact, as the suite prints them; seat-titles.mjs and the test files at 59db91d) ──
// New checks (CHANGE.md §5.1).
const L1 = "roster notice: one line that starts with the prefix and names the builders, reviewer and land by model and thinking";
const L2 = "roster notice: each entry shows its model and thinking and never its provider field, for a default, a file and a Claude Code roster and a model id that contains its provider";
const L3 = "roster notice: sealed values — prefix, size labels, Claude Code mark, default mark, refusal head and cut, change pointer, relative-dir text, shown start sources and widget key";
const L4 = "roster notice: a larger-lane builder is named for larger lanes before the builder for small lanes";
const L5 = "roster notice: a Claude Code entry's model is followed by the Claude Code mark, and a pi entry's is not";
const L6 = "roster notice: a null land reads land seat";
const L7 = "roster notice: a scout is never named, set or null";
const L8 = "roster notice: a lone builder carries no size label";
const L9 = "roster notice: only the default roster is marked default, and a file roster equal to the default is not";
const L10 = "roster notice: every refusal kind shows the problem cut before its first ' (' with no echoed value or line break, and a roster path holding ' (' stays whole";
const L11 = "roster notice: every notice, refused ones included, ends with the change pointer and the roster file";
const PATHS = "packages/nana-setup/lib/paths.mjs";
const PATHS_T = "packages/nana-setup/tests/paths.test.mjs";
const W7 = "lane size small starts pi with the builder even when largerBuilder is set";
const L12 = "roster notice: the roster file shows the home folder as ~ wherever it appears";
const L13 = "extension: with a UI, startup, new, resume and fork each set exactly one widget above the editor holding only the notice, a refused roster included, and raise no notify";
const L14 = "extension: no UI, and the reload reason, each set no widget and raise nothing";
const L15 = "parity: the hook and the extension show the same notice for a default, a file and a refused roster";
const L16 = "relative agent dir: the hook and the extension each show the unknown line and the change pointer, naming no lineup, for a file and a refused roster";
const H1 = "roster notice hook: one JSON object with the notice as SessionStart context on every source and with no source, and exit 0";
const H2 = "roster notice hook: the notice is a user message for startup, resume, clear and fork, for a missing or unreadable source and for an input that fails on read, and not for compact";
const H3 = "roster notice hook: a copy that cannot load its modules prints the unavailable notice in both fields with no path, and exits 0";
const I1 = "roster notice: plain text, two objects, a missing user message, a missing SessionStart context or the unavailable notice each fail";
const N1 = "a machine roster without largerBuilder reads it as null, and one with a pi or a Claude Code entry keeps it as written";
const N2 = "each invalid largerBuilder, and a runtime field in any other slot, is refused naming the slot or field";
const N3 = "roster command prints largerBuilder after the builder: claude-code and the model, a pi entry's three fields, or none";
const N4 = "roster command --json prints one roster object whose roster value, set as the roster member of a file holding the installer's seed, the resolver reads back as the same roster, for the default and a file roster";
const N5 = "roster command --json prints a refused roster on stderr with empty stdout and exits 1";
const W1 = "lane size larger starts pi with the larger-lane builder's provider, model and thinking, each flag once";
const W2 = "lane size larger with no larger-lane builder starts pi with the builder";
const W3 = "lane size larger refuses a Claude Code larger-lane builder before lock or spawn, naming roster.largerBuilder and both ways out as the user's choice";
const W4 = "lane size with a missing or unknown value refuses before pi spawn";
const W5 = "lane size larger prints the larger-lane builder line before starting pi";
const W6 = "with a larger-lane builder set, a launch with no lane size, the --lane-size=larger form included, is refused before lock or spawn, naming largerBuilder and both sizes";
const T1 = "shared working pattern sends a larger or riskier lane to the roster's larger-lane builder, a pi entry through lane size larger and a Claude Code entry as a subagent in the lane worktree";
const T2 = "shared working pattern says a seat that cannot start the larger-lane builder stops and asks the user";
const T3 = "shared working pattern says the builder builds every lane when the roster sets no larger-lane builder";
// Loop instances (CHANGE.md §5.1); the hooks-win32-exec one is Windows-leg only (DECLARED c).
const IN99 = "hook nana-roster-notice.mjs is a symlink into the repo";
const WD61 = "win32: hook nana-roster-notice.mjs reports skipped (win32)";
const WD69 = "win32: settings SessionStart roster notice is created, not skipped";
// install.test.mjs's space-in-home loop: the title carries the command's first 40 characters (DECLARED d).
const IN333 = /^space in home: `.*…` runs cleanly(?: |$)/;
// Existing checks (CHANGE.md §5.2, §5.4), under their names at 59db91d; the plan's line numbers are at 2dbc817.
const SM35 = "six active hook entries are wanted";
const SM117 = "empty settings: all six active entries added";
const SM138 = "the other six are added";
const SM142 = "nana SessionStart hooks appended to the same group";
const SM278 = "win32 desiredHooks: the five hook entries name packages/nana-setup/claude/hooks/";
const SM302 = "POSIX desiredHooks deep-equals today's fixture";
const SM304 = "desiredHooks with no platform deep-equals the same fixture";
const SM392 = "forced-win32 removeInstallerHooks removes exactly the six entries";
const SM799 = "install migrates the three exact legacy commands in place without disturbing foreign objects";
const UN253 = "install --desk then uninstall restores the independent home snapshot";
const UN276 = "released context entry is retired by install and its link is removed on uninstall";
const UN292 = "dry-run lists manifest pieces without writes and repeated uninstall is empty";
const SMF65 = "every path created by install maps to a nana-setup-owned manifest row";
const IC45 = "sealed hook table and allowed entry shape";
const IC474 = "pin R-1074 R-1082: the hook table with its form columns and the allowed entry keys";
const IC289 = "spawn: every child goes through the injected spawn (git init twice, Git Bash discovery, install, pi install, pi list, pi session, each hook hit and miss, doctor)";
const IC321 = "platform: NANA_SETUP_PLATFORM in the caller changes nothing";
const IC517 = "dispatch: each hook runs in the fixture project with CLAUDE_PROJECT_DIR set to it";
const IC758 = "pin R-1081: the doctor note list";
const NR40 = "sealed default roster is luna high builder, sol reviewer, astra land and no scout";
const NR209 = "roster command prints one line per slot and the source";
const TR342 = "shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory";
const TR407 = "desk matrix states nana resources for every spawn class and the terminal trust step";
const RC75 = "front-door descriptions name both runtimes and all eight extensions";

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
// The shared file and nana-pi's regenerated region carry the same text (DECLARED a).
const both = (anchor, replacement) => [one(SHARED, anchor, replacement), one(AGENTS, anchor, replacement)];

const PI_ENTRY = "\treturn entry.thinking ? `${entry.model} ${entry.thinking}` : entry.model;";
const PAYLOAD_CONTEXT = "\t\t\thookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notice },\n";
const SHOW_AS_MESSAGE = "const showAsMessage = source === null || SHOW_SOURCES.includes(source);";
const EXT_REASON = "if (!reason || !(SHOW_SOURCES as readonly string[]).includes(reason)) return;";
const EXT_WIDGET = "\t\t\tctx.ui.setWidget(WIDGET_KEY, [notice]);";
const CC_REFUSAL = "roster.largerBuilder is a Claude Code entry; pi-worker starts pi entries only: ask the user to start it as a subagent from a Claude Code seat, or to put a pi entry in largerBuilder";

// Frozen table. `expectRed` are the checks §5.4's "Reds" column names, macOS leg only (DECLARED c).
const PAIRS = [
	// The notice (R-1194 to R-1204, R-1215): 1-18, 66, 68
	{ n: "1", name: "the notice prints each provider before its model", edits: [one(NOTICE, PI_ENTRY, "\treturn entry.thinking ? `${entry.provider} ${entry.model} ${entry.thinking}` : `${entry.provider} ${entry.model}`;")], tests: [RN], expectRed: [L1, L2] },
	{ n: "2", name: "the notice drops the thinking level", edits: [one(NOTICE, PI_ENTRY, "\treturn entry.model;")], tests: [RN], expectRed: [L1] },
	{ n: "3", name: "segments join with a line feed instead of ' · '", edits: [one(NOTICE, "\treturn `${head} · ${pointer}`;", "\treturn `${head}\\n${pointer}`;")], tests: [RN], expectRed: [L1, L10] },
	{ n: "4", name: "NOTICE_PREFIX changed in the config", edits: [one(NOTICE_CFG, "export const NOTICE_PREFIX = 'nana active · roster';", "export const NOTICE_PREFIX = 'nana active - roster';")], tests: [RN], expectRed: [L3] },
	{ n: "5", name: "CHANGE_POINTER changed in the config", edits: [one(NOTICE_CFG, "export const CHANGE_POINTER = 'change: \"roster\" in';", "export const CHANGE_POINTER = 'change \"roster\" in';")], tests: [RN], expectRed: [L3] },
	{ n: "6", name: "the small-lane builder is named first", edits: [one(NOTICE, "? `builders ${entryText(roster.largerBuilder)} ${SIZE_LABELS.larger} and ${entryText(roster.builder)} ${SIZE_LABELS.small}`", "? `builders ${entryText(roster.builder)} ${SIZE_LABELS.small} and ${entryText(roster.largerBuilder)} ${SIZE_LABELS.larger}`")], tests: [RN], expectRed: [L4] },
	{ n: "7", name: "the size labels stay when largerBuilder is null", edits: [one(NOTICE, ": `builder ${entryText(roster.builder)}`);", ": `builder ${entryText(roster.builder)} ${SIZE_LABELS.small}`);")], tests: [RN], expectRed: [L8] },
	{ n: "8", name: "the Claude Code mark is left out", edits: [one(NOTICE, "\tif (entry.runtime === CLAUDE_CODE_RUNTIME) return `${entry.model} ${CLAUDE_CODE_MARK}`;", "\tif (entry.runtime === CLAUDE_CODE_RUNTIME) return entry.model;")], tests: [RN], expectRed: [L5] },
	{ n: "9", name: "pi entries get the Claude Code mark too", edits: [one(NOTICE, PI_ENTRY, "\treturn entry.thinking ? `${entry.model} ${CLAUDE_CODE_MARK} ${entry.thinking}` : `${entry.model} ${CLAUDE_CODE_MARK}`;")], tests: [RN], expectRed: [L5] },
	{ n: "10", name: "a null land prints nothing", edits: [one(NOTICE, "\tparts.push(`land ${roster.land === null ? 'seat' : entryText(roster.land)}`);", "\tif (roster.land !== null) parts.push(`land ${entryText(roster.land)}`);")], tests: [RN], expectRed: [L6] },
	{ n: "11", name: "the notice names a set scout", edits: [one(NOTICE, "\tconst parts = [];\n", "\tconst parts = [];\n\tif (roster.scout !== null) parts.push(`scout ${entryText(roster.scout)}`);\n")], tests: [RN], expectRed: [L7] },
	{ n: "12", name: "a file roster equal to the default is marked (default)", edits: [one(NOTICE, "import { CLAUDE_CODE_RUNTIME } from '../bin/worker-config.mjs';", "import { CLAUDE_CODE_RUNTIME, ROSTER_DEFAULTS } from '../bin/worker-config.mjs';"), one(NOTICE, "\tconst mark = source === 'default' ? ` ${DEFAULT_MARK}` : '';", "\tconst mark = source === 'default' || JSON.stringify(roster) === JSON.stringify(ROSTER_DEFAULTS) ? ` ${DEFAULT_MARK}` : '';")], tests: [RN], expectRed: [L9] },
	{ n: "13", name: "the whole refusal is shown, value echo included", edits: [one(NOTICE, "\tconst cut = cutAt === -1 ? withPlaceholder : withPlaceholder.slice(0, cutAt);", "\tconst cut = withPlaceholder;")], tests: [RN], expectRed: [L10] },
	{ n: "14", name: "the problem text skips displayText, so a key holding a line feed survives", edits: [one(NOTICE, "\tconst bounded = displayText(cut);", "\tconst bounded = cut;")], tests: [RN], expectRed: [L10] },
	{ n: "15", name: "the cut runs before the path is set aside, so a path holding ' (' is cut in half", edits: [one(NOTICE, "\tconst withPlaceholder = file ? String(problem).split(file).join(PATH_PLACEHOLDER) : String(problem);\n\tconst cutAt = withPlaceholder.indexOf(REFUSAL_CUT);\n\tconst cut = cutAt === -1 ? withPlaceholder : withPlaceholder.slice(0, cutAt);", "\tconst __raw = String(problem);\n\tconst __at = __raw.indexOf(REFUSAL_CUT);\n\tconst __early = __at === -1 ? __raw : __raw.slice(0, __at);\n\tconst cut = file ? __early.split(file).join(PATH_PLACEHOLDER) : __early;")], tests: [RN], expectRed: [L10] },
	{ n: "16", name: "the path goes through tildeify alone, so a dangling-symlink refusal keeps the absolute path", edits: [one(NOTICE, "${bounded.split(PATH_PLACEHOLDER).join(tildeify(file))}`;", "${tildeify(bounded.split(PATH_PLACEHOLDER).join(file))}`;")], tests: [RN], expectRed: [L12] },
	{ n: "17", name: "the change pointer prints the absolute path", edits: [one(NOTICE, "\tconst pointer = `${CHANGE_POINTER} ${tildeify(file)}`;", "\tconst pointer = `${CHANGE_POINTER} ${file}`;")], tests: [RN], expectRed: [L12] },
	{ n: "18", name: "a refused notice leaves out the change pointer", edits: [one(NOTICE, "\treturn `${head} · ${pointer}`;", "\treturn result.ok || relative ? `${head} · ${pointer}` : head;")], tests: [RN], expectRed: [L11] },
	// The pi extension (R-1210, R-1211): 19-23, 62
	{ n: "19", name: "the extension sets the widget with no UI", edits: [one(EXT, "\t\t\tif (!ctx.hasUI) return;", "\t\t\tif (false && !ctx.hasUI) return;")], tests: [RN], expectRed: [L14] },
	{ n: "20", name: "the extension sets the widget on reload", edits: [one(EXT, EXT_REASON, "if (!reason || (reason !== \"reload\" && !(SHOW_SOURCES as readonly string[]).includes(reason))) return;")], tests: [RN], expectRed: [L14] },
	{ n: "21", name: "the extension skips fork", edits: [one(EXT, EXT_REASON, "if (!reason || reason === \"fork\" || !(SHOW_SOURCES as readonly string[]).includes(reason)) return;")], tests: [RN], expectRed: [L13] },
	{ n: "22", name: "the extension shows a refused roster as a warning notify instead of the widget", edits: [one(EXT, EXT_WIDGET, "\t\t\tif (!result.ok) ctx.ui.notify(notice, \"warning\");\n\t\t\telse ctx.ui.setWidget(WIDGET_KEY, [notice]);")], tests: [RN], expectRed: [L13] },
	{ n: "23", name: "the extension formats its own line without the change pointer", edits: [one(EXT, "\t\t\tconst notice = rosterNotice(result, file, relative);", "\t\t\tconst notice = rosterNotice(result, file, relative).replace(/ · change: .*$/, \"\");")], tests: [RN], expectRed: [L15] },
	// The Claude Code hook (R-1205 to R-1207): 24-31, 65
	{ n: "24", name: "the hook sets systemMessage on compact", edits: [one(HOOK, SHOW_AS_MESSAGE, "const showAsMessage = source === null || SHOW_SOURCES.includes(source) || source === 'compact';")], tests: [RH], expectRed: [H2] },
	{ n: "25", name: "the hook drops the context on compact", edits: [one(HOOK, PAYLOAD_CONTEXT, "\t\t\t...(source === 'compact' ? {} : { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: notice } }),\n")], tests: [RH], expectRed: [H1] },
	{ n: "26", name: "the hook puts additionalContext at the top level", edits: [one(HOOK, PAYLOAD_CONTEXT, "\t\t\thookSpecificOutput: { hookEventName: 'SessionStart' },\n\t\t\tadditionalContext: notice,\n")], tests: [RH], expectRed: [H1] },
	{ n: "27", name: "the hook prints a plain line before the JSON", edits: [one(HOOK, "\t\twrite(`${JSON.stringify(payload)}", "\t\twrite(`${notice}\\n${JSON.stringify(payload)}")], tests: [RH, RN], expectRed: [H1, L15] },
	{ n: "28", name: "the hook leaves out systemMessage when its input is empty", edits: [one(HOOK, "\t\t\tconst text = await readHookInput(input);\n", "\t\t\tconst text = await readHookInput(input);\n\t\t\tif (!text) source = 'empty';\n")], tests: [RH], expectRed: [H2] },
	{ n: "29", name: "the fail-open path exits 1", edits: [one(HOOK, "\t} catch (error) {\n", "\t} catch (error) {\n\t\tprocess.exitCode = 1;\n"), one(HOOK, "\tawait runRosterNoticeHook();\n\tprocess.exit(0);", "\tawait runRosterNoticeHook();\n\tprocess.exit(process.exitCode ?? 0);")], tests: [RH], expectRed: [H3] },
	{ n: "30", name: "the fail-open path prints plain text", edits: [one(HOOK, "write(`${JSON.stringify(unavailablePayload(error?.code ?? error?.name ?? 'Error'))}", "write(`${unavailablePayload(error?.code ?? error?.name ?? 'Error').systemMessage}")], tests: [RH], expectRed: [H3] },
	{ n: "31", name: "the fail-open reason is the error message, which holds the module path", edits: [one(HOOK, "unavailablePayload(error?.code ?? error?.name ?? 'Error')", "unavailablePayload(error?.message ?? 'Error')")], tests: [RH], expectRed: [H3] },
	// The installer and the install check (R-1208, R-1209, census rows): 32-39
	{ n: "32", name: "the roster notice entry gets timeout 10", edits: [one(SETTINGS, "spec: rosterNotice.spec, entry: rosterNotice.entry },", "spec: rosterNotice.spec, entry: { ...rosterNotice.entry, timeout: 10 } },")], tests: [SM], expectRed: [SM302, SM304] },
	{ n: "33", name: "desiredHooks leaves out the roster notice row", edits: [one(SETTINGS, "\t\t{ event: \"SessionStart\", label: \"SessionStart roster notice\", marker: \"nana-roster-notice.mjs\", spec: rosterNotice.spec, entry: rosterNotice.entry },\n", "")], tests: [SM, WD], expectRed: [SM35, SM117, SM138, SM142, SM278, SM302, SM304, SM392, SM799, WD69] },
	{ n: "34", name: "the state manifest leaves the hook out", edits: [one(STATE, "\"nana-shared-memory.mjs\", \"nana-roster-notice.mjs\", \"verifier-pipe.mjs\"]) rebuild(", "\"nana-shared-memory.mjs\", \"verifier-pipe.mjs\"]) rebuild(")], tests: [UN, SMF], expectRed: [UN253, UN276, UN292, SMF65] },
	{ n: "35", name: "steps.HOOKS leaves the hook out", edits: [one(STEPS, "export const HOOKS = [\"nana-objective.mjs\", \"nana-adoption.mjs\", \"nana-shared-memory.mjs\", \"nana-roster-notice.mjs\", \"verifier-pipe.mjs\"];", "export const HOOKS = [\"nana-objective.mjs\", \"nana-adoption.mjs\", \"nana-shared-memory.mjs\", \"verifier-pipe.mjs\"];")], tests: [IN, SMF, WD], expectRed: [IN99, IN333, SMF65, WD61] },
	{ n: "36", name: "the install-check table drops the roster notice row", edits: [one(ICC, "  { label: \"hook roster notice\", shortLabel: \"roster notice\", event: \"SessionStart\", matcher: \"startup\", script: \"nana-roster-notice.mjs\", timeout: 5, form: { darwin: \"shell\", linux: \"shell\", win32: \"exec\" } },\n", "")], tests: [IC], expectRed: [I1, IC45, IC474, IC289, IC321, IC517] },
	{ n: "37", name: "the roster notice branch accepts plain text", edits: [one(ICL, "  try { parsed = JSON.parse(lines[0]); } catch { return false; }", "  try { parsed = JSON.parse(lines[0]); } catch { return lines[0].startsWith(ROSTER_NOTICE_PREFIX); }")], tests: [IC], expectRed: [I1] },
	{ n: "38", name: "the roster notice branch accepts the unavailable notice", edits: [one(ICL, " && !message.startsWith(ROSTER_NOTICE_UNAVAILABLE_PREFIX)", "")], tests: [IC], expectRed: [I1] },
	{ n: "39", name: "DOCTOR_NOTES.win32 leaves the hook out", edits: [one(ICC, "\"hook nana-shared-memory.mjs\", \"hook nana-roster-notice.mjs\", \"hook verifier-pipe.mjs\"", "\"hook nana-shared-memory.mjs\", \"hook verifier-pipe.mjs\"")], tests: [IC], expectRed: [IC758] },
	// The roster and lane mode (R-1120 to R-1124, R-1190 to R-1192, R-1212, R-960, R-961): 40-56, 61
	{ n: "40", name: "the resolver returns the file's object as written, so an absent largerBuilder reads as undefined", edits: [one(ROSTER, "  return { roster: normalised };", "  return { roster: value };")], tests: [NR], expectRed: [N1] },
	{ n: "41", name: "runtime claude is accepted", edits: [one(ROSTER, "    if (value.runtime !== CLAUDE_CODE_RUNTIME) {", "    if (false && value.runtime !== CLAUDE_CODE_RUNTIME) {")], tests: [NR], expectRed: [N2] },
	{ n: "42", name: "a runtime field on builder is accepted", edits: [one(ROSTER, "  const extra = keys.filter((k) => !ENTRY_FIELDS.includes(k));", "  const extra = keys.filter((k) => !ENTRY_FIELDS.includes(k) && k !== 'runtime');")], tests: [NR], expectRed: [N2] },
	{ n: "43", name: "a Claude Code entry with thinking is accepted", edits: [one(ROSTER, "  const extra = keys.filter((k) => !['runtime', 'model'].includes(k));", "  const extra = keys.filter((k) => !['runtime', 'model', 'thinking'].includes(k));")], tests: [NR], expectRed: [N2] },
	{ n: "44", name: "a Claude Code entry's model gets only the pi string rule, so a full model name is accepted", edits: [one(ROSTER, "  if (!CLAUDE_CODE_SUBAGENT_MODELS.includes(value.model)) {", "  if (typeof value.model !== 'string' || value.model.length === 0 || /[\\s\\x00-\\x1f\\x7f-\\x9f]/.test(value.model)) {")], tests: [NR], expectRed: [N2] },
	{ n: "45", name: "the command prints largerBuilder after the reviewer", edits: [one(ROSTER, "  const lines = SLOT_PRINT_ORDER.map((slot) => {", "  const lines = ['scout', 'builder', 'reviewer', 'largerBuilder', 'land'].map((slot) => {")], tests: [NR], expectRed: [N3, NR209] },
	{ n: "46", name: "the command prints a Claude Code entry with a provider column", edits: [one(ROSTER, "    if (value.runtime === CLAUDE_CODE_RUNTIME) return `${slot}: ${CLAUDE_CODE_RUNTIME} ${value.model}`;\n", "")], tests: [NR], expectRed: [N3] },
	{ n: "47", name: "ROSTER_DEFAULTS.largerBuilder changed (to D1's other answer, sonnet)", edits: [one(WCFG, "  largerBuilder: null,\n", "  largerBuilder: Object.freeze({ runtime: 'claude-code', model: 'sonnet' }),\n")], tests: [NR], expectRed: [NR40, NR209] },
	{ n: "48", name: "--json prints the roster without the roster key", edits: [one(ROSTER, "JSON.stringify({ roster: orderedRoster(result.roster) })", "JSON.stringify(orderedRoster(result.roster))")], tests: [NR], expectRed: [N4] },
	{ n: "49", name: "--json prints a refused roster's problem on stdout and exits 0", edits: [one(ROSTER, "  if (!result.ok) {\n    process.stderr.write(`nana-roster: roster refused:", "  if (!result.ok) {\n    if (json) { process.stdout.write(`nana-roster: roster refused: ${result.file}: ${result.problem}\\n`); process.exit(0); }\n    process.stderr.write(`nana-roster: roster refused:")], tests: [NR], expectRed: [N5] },
	{ n: "50", name: "--lane-size larger starts the builder although largerBuilder holds a pi entry", edits: [one(WORKER, "\t\tbuilder = roster.largerBuilder;\n", "\t\tbuilder = roster.builder;\n")], tests: [WL], expectRed: [W1, W5] },
	{ n: "51", name: "--lane-size larger refuses a null largerBuilder instead of falling back", edits: [one(WORKER, "\tif (laneSize === 'larger' && roster.largerBuilder !== null) {", "\tif (laneSize === 'larger' && roster.largerBuilder === null) laneFailure('--lane-size larger needs a largerBuilder in the roster');\n\tif (laneSize === 'larger' && roster.largerBuilder !== null) {")], tests: [WL], expectRed: [W2] },
	{ n: "52", name: "lane mode passes a Claude Code entry's model to pi", edits: [one(WORKER, "\t\tif (roster.largerBuilder.runtime === CLAUDE_CODE_RUNTIME) {", "\t\tif (false && roster.largerBuilder.runtime === CLAUDE_CODE_RUNTIME) {"), one(WORKER, "\t\tbuilder = roster.largerBuilder;\n", "\t\tbuilder = roster.largerBuilder.runtime === CLAUDE_CODE_RUNTIME ? { provider: roster.builder.provider, model: roster.largerBuilder.model, thinking: null } : roster.largerBuilder;\n")], tests: [WL], expectRed: [W3] },
	{ n: "53", name: "the Claude Code refusal comes after the lock is taken", edits: [one(WORKER, `\t\t\tlaneFailure('${CC_REFUSAL}');\n\t\t}\n\t\tbuilder = roster.largerBuilder;\n`, `\t\t\tglobalThis.__ccRefusal = '${CC_REFUSAL}';\n\t\t}\n\t\tbuilder = globalThis.__ccRefusal ? roster.builder : roster.largerBuilder;\n`), one(WORKER, "if (laneMode) acquireLaneLock(laneGitDir);\n", "if (laneMode) acquireLaneLock(laneGitDir);\nif (laneMode && globalThis.__ccRefusal) laneFailure(globalThis.__ccRefusal);\n")], tests: [WL], expectRed: [W3] },
	{ n: "54", name: "the Claude Code refusal leaves out the pi-entry way out", edits: [one(WORKER, ", or to put a pi entry in largerBuilder');", "');")], tests: [WL], expectRed: [W3] },
	{ n: "55", name: "an unknown lane size runs as small", edits: [one(WORKER, "\tif (laneSizePresent && laneSizeRaw !== 'small' && laneSizeRaw !== 'larger') laneFailure(", "\tif (false) laneFailure(")], tests: [WL], expectRed: [W4] },
	{ n: "56", name: "the larger-lane line prints builder:", edits: [one(WORKER, "\t\tbuilderLabel = LARGER_BUILDER_LABEL;", "\t\tbuilderLabel = 'builder';")], tests: [WL], expectRed: [W5] },
	// Text (R-1193, R-1213, R-1214, R-680, R-685, R-658): 57-60
	{ n: "57", name: "the shared matrix and the regenerated region drop the hook name", edits: both("No nana notify; SessionStart `nana-roster-notice.mjs` hook shows the roster notice", "No nana notify; a SessionStart hook shows the roster notice"), tests: [TR], expectRed: [TR342] },
	{ n: "58", name: "the front-door package bullet leaves out the roster notice", edits: [one(ROOT_README, "objective, writing, roster notice), plus scaffold +", "objective, writing), plus scaffold +")], tests: [RC], expectRed: [RC75] },
	{ n: "59", name: "the desk README matrix drops \"roster notice\"", edits: [one(DESK_README, "lifecycle, notify, and roster notice are present only", "lifecycle, and notify are present only"), one(DESK_README, "lifecycle, notify, roster notice) is available", "lifecycle, notify) is available"), one(DESK_README, "lifecycle, notify, or roster notice unless", "lifecycle, or notify unless")], tests: [TR], expectRed: [TR407] },
	{ n: "60", name: "the larger-lanes bullet says a seat that cannot start that builder uses the builder instead", edits: both("A seat that cannot start that builder stops and asks the user rather than starting another.", "A seat that cannot start that builder uses the builder instead."), tests: [TR], expectRed: [T2] },
	// Appended pairs 61-68 (seat revisions 3 to 6)
	{ n: "61", name: "lane mode with no --lane-size runs the builder although largerBuilder is set", edits: [one(WORKER, "\tif (!laneSizePresent && roster.largerBuilder !== null) laneFailure(", "\tif (false) laneFailure(")], tests: [WL], expectRed: [W6] },
	{ n: "62", name: "the extension also raises the notice as an info notify, which erases nana-handoff's startup notice", edits: [one(EXT, EXT_WIDGET, `${EXT_WIDGET}\n\t\t\tctx.ui.notify(notice, "info");`)], tests: [RN], expectRed: [L13] },
	{ n: "63", name: "the larger-lanes bullet sends a pi entry through plain pi-worker --lane", edits: both("a pi entry through `pi-worker --lane-size larger`,", "a pi entry through `pi-worker --lane`,"), tests: [TR], expectRed: [T1] },
	{ n: "64", name: "the larger-lanes bullet leaves out its sentence for a roster with no largerBuilder", edits: both(" With no `largerBuilder`, the builder builds every lane.", ""), tests: [TR], expectRed: [T3] },
	{ n: "65", name: "the hook reads its input inside the module try, so an input read error prints the unavailable notice", edits: [one(HOOK, "\t\tlet source = null;\n\t\ttry {\n\t\t\tconst text = await readHookInput(input);\n", "\t\tlet source = null;\n\t\tconst __text = await readHookInput(input);\n\t\ttry {\n\t\t\tconst text = __text;\n")], tests: [RH], expectRed: [H2] },
	{ n: "66", name: "the notice removes each provider string from the line, so model acme-large under provider acme prints as -large", edits: [one(NOTICE, PI_ENTRY, "\tconst __model = entry.provider ? String(entry.model).split(entry.provider).join('') : entry.model;\n\treturn entry.thinking ? `${__model} ${entry.thinking}` : __model;")], tests: [RN], expectRed: [L2] },
	{ n: "67", name: "the larger-lanes bullet leaves out the small-lane route through pi-worker --lane-size small", edits: both("; a small lane goes through `pi-worker --lane-size small`.", "."), tests: [TR], expectRed: [T1] },
	{ n: "68", name: "the notice ignores its relative argument, so a relative PI_CODING_AGENT_DIR shows the lineup or the refusal", edits: [one(NOTICE, "\tconst head = relative\n", "\tconst head = false && relative\n")], tests: [RN], expectRed: [L16] },
	// Build brief 2 (seat, 2026-10-16): two behaviours build 2 added.
	{ n: "69", name: "a home folder ending in a separator stops the ~ rewrite again (R-1204)", edits: [one(PATHS, 'const h = os.homedir().replace(/[\\\\/]+$/, "");', "const h = os.homedir();")], tests: [RN], expectRed: [L12] },
	{ n: "70", name: "--lane-size small with largerBuilder set starts the larger-lane builder", edits: [one(WORKER, "const laneSize = laneSizePresent ? laneSizeRaw : 'small';", "const laneSize = laneSizePresent ? (roster.largerBuilder ? 'larger' : laneSizeRaw) : 'small';")], tests: [WL], expectRed: [W7] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
let baseEnvCache = null;
function baseEnv() {
	if (baseEnvCache) return baseEnvCache;
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k) || /^SEAT_MUTATE_/.test(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	// The suite runs as `npm test` / `npm run test:locked`, and npm exports its resolved config to the runner and so to
	// every test child. When this runner is started by plain node, it supplies the same three values `npm run` exports,
	// read once under the caller's own HOME.
	for (const key of ["prefix", "globalconfig", "userconfig"]) {
		const name = `npm_config_${key}`;
		if (e[name]) continue;
		const v = sh("npm", ["config", "get", key], { env: process.env }).stdout?.trim();
		if (v && v !== "undefined") e[name] = v;
	}
	if (e.npm_config_prefix && !e.npm_config_global_prefix) e.npm_config_global_prefix = e.npm_config_prefix;
	baseEnvCache = e;
	return e;
}

const lineTitles = (out, tag) => out.split("\n").filter((l) => l.startsWith(`${tag} `)).map((l) => l.slice(tag.length + 1).trim());
// A title is a string (exact, or followed by the check's detail) or a RegExp (DECLARED d).
const isTitle = (t, title) => (title instanceof RegExp ? title.test(t) : t === title || t.startsWith(`${title} `));
const show = (title) => (title instanceof RegExp ? String(title) : JSON.stringify(title));
const short = (s, n = 110) => { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const fileCrashed = (out) => /^Node\.js v\d+\.\d+\.\d+$/.test(out.trim().split("\n").at(-1) ?? "");
const PAIR_LINE = /^(?:RED|GREEN|ANCHOR-MISS|SYNTAX|DRY ok) (\S+) /;

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

function resolveTip() {
	const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
	const mergeBase = tipSha ? git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim() : "";
	const branchHead = git("-C", LANE_REPO, "rev-parse", LANE_BRANCH).stdout.trim();
	return { tipSha, mergeBase, branchHead };
}

/** One run over `pairs` in this process, in its own scratch worktree. Writes SEAT_MUTATE_TALLY when set. */
async function runSingle(pairs, { tipSha, mergeBase, branchHead }) {
	const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "roster-notice-seat-mutate-"));
	const WT = path.join(SCRATCH, "wt");
	const RUNS = path.join(SCRATCH, "runs");
	fs.mkdirSync(RUNS, { recursive: true });
	let runSeq = 0;
	let current = null; // the running test child, for a signal stop

	const removeWorktree = () => {
		git("-C", LANE_REPO, "worktree", "remove", "--force", WT);
		fs.rmSync(WT, { recursive: true, force: true });
	};
	const resetWorktree = () => {
		// Refuse before any reset or clean when WT is not the scratch worktree's own root (a missing WT or .git file
		// would otherwise let git search upward and clean a parent).
		const top = git("-C", WT, "rev-parse", "--show-toplevel");
		if (top.status !== 0 || fs.realpathSync(top.stdout.trim()) !== fs.realpathSync(WT)) throw new Error(`scratch worktree is gone or not its own root: ${(top.stderr || top.stdout).trim()}`);
		git("-C", WT, "reset", "-q", "--hard", tipSha);
		git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
		const head = git("-C", WT, "rev-parse", "HEAD").stdout.trim();
		if (head !== tipSha) throw new Error(`scratch HEAD ${head} is not the tip ${tipSha} after reset`);
		const st = git("-C", WT, "status", "--porcelain");
		if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
	};
	/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
	const runTest = (rel) => {
		const file = path.join(WT, rel);
		const cwd = path.dirname(path.dirname(file)); // the package dir (every test file here is <pkg>/tests/x)
		const id = ++runSeq;
		const home = path.join(RUNS, `home-${id}`);
		const tmp = path.join(RUNS, `tmp-${id}`);
		fs.mkdirSync(home, { recursive: true });
		fs.mkdirSync(tmp, { recursive: true });
		const env = { ...baseEnv(), HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
		const t0 = Date.now();
		return new Promise((resolve) => {
			const child = spawn(process.execPath, ["--experimental-strip-types", file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
			current = child;
			let out = "";
			child.stdout.on("data", (d) => { out += d; });
			child.stderr.on("data", (d) => { out += d; });
			let timedOut = false;
			const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, TIMEOUT_MS);
			child.on("close", (code, signal) => {
				clearTimeout(timer);
				current = null;
				try { process.kill(-child.pid, "SIGKILL"); } catch {} // stray group members
				fs.rmSync(home, { recursive: true, force: true });
				fs.rmSync(tmp, { recursive: true, force: true });
				resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
			});
		});
	};
	const applyEdits = (p) => {
		for (const e of p.edits) {
			const abs = path.join(WT, e.file);
			const text = fs.readFileSync(abs, "utf8");
			const c = count(text, e.anchor);
			if (c !== e.times) return `${e.file}: anchor occurs ${c}× (want ${e.times}) — ${short(JSON.stringify(e.anchor), 90)}`;
			fs.writeFileSync(abs, text.split(e.anchor).join(e.replacement));
		}
		return null;
	};
	const syntaxProblem = (p) => {
		for (const f of new Set(p.edits.map((e) => e.file))) {
			const args = /\.(mjs|js)$/.test(f) ? ["--check", path.join(WT, f)] : /\.ts$/.test(f) ? ["--experimental-strip-types", "--check", path.join(WT, f)] : null;
			if (!args) continue;
			const chk = sh(process.execPath, args);
			if (chk.status !== 0) return `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`;
		}
		return null;
	};

	let stopping = false;
	const onSignal = (sig) => {
		if (stopping) return;
		stopping = true;
		if (current) { try { process.kill(-current.pid, "SIGKILL"); } catch {} }
		log(`seat-mutate: ${sig} — stopping${KEEP ? `; KEEP — scratch left at ${SCRATCH}` : ", removing the scratch worktree"}`);
		if (!KEEP) { try { removeWorktree(); } catch {} fs.rmSync(SCRATCH, { recursive: true, force: true }); }
		process.exit(sig === "SIGINT" ? 130 : 143);
	};
	process.on("SIGINT", () => onSignal("SIGINT"));
	process.on("SIGTERM", () => onSignal("SIGTERM"));

	log(`seat-mutate: lane roster-notice${SHARD ? `, shard ${SHARD}` : ""}, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
	if (!SHARD) for (const d of DECLARED) log(`DECLARED ${d}`);
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", WT, tipSha);
	if (r.status !== 0) { log(`seat-mutate: worktree add ${tipSha} failed: ${r.stderr.trim()}`); fs.rmSync(SCRATCH, { recursive: true, force: true }); return { exitCode: 2, tally: null }; }

	const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
	const survivors = [];
	const basePass = {};
	let baselineOk = true;
	let exitCode = 0;
	try {
		if (!DRY) {
			// Baseline: every named file, unmutated, must exit 0 with no FAIL line. Other jobs share this machine, so a
			// red baseline file is re-run once alone before the runner concludes; the retry's result stands, both logged.
			const files = [...new Set(pairs.flatMap((p) => p.tests))];
			for (const rel of files) {
				let ok = false;
				for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
					resetWorktree();
					const res = await runTest(rel);
					const fl = lineTitles(res.out, "FAIL");
					ok = res.code === 0 && !res.timedOut && fl.length === 0;
					basePass[rel] = lineTitles(res.out, "PASS");
					log(`BASELINE${attempt === 2 ? " RETRY" : ""} ${ok ? "ok  " : "FAIL"} ${rel} (exit ${res.code}, ${basePass[rel].length} PASS, ${fl.length} FAIL, ${lineTitles(res.out, "SKIP").length} SKIP, ${res.secs}s)${ok ? "" : " — " + (fl.slice(0, 3).map((t) => short(t)).join(" | ") || short(res.out.trim().split("\n").slice(-3).join(" / "), 200))}`);
					if (!ok && LOGDIR) fs.writeFileSync(path.join(LOGDIR, `baseline-${SHARD ? SHARD.replace("/", "of") + "-" : ""}${path.basename(rel)}${attempt === 2 ? "-retry" : ""}.log`), res.out);
				}
				if (!ok) baselineOk = false;
			}
			// Every named title must be a PASS line in the baseline of one of the pair's files.
			for (const p of pairs) for (const title of [...p.expectRed, ...(p.alsoRed ?? [])]) {
				if (!p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)))) { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${show(title)} is not a PASS line in ${p.tests.join(", ")}`); }
			}
			resetWorktree();
		}
		if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); exitCode = 2; }
		else {
			for (const p of pairs) {
				resetWorktree();
				const miss = applyEdits(p);
				if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
				const diff = git("-C", WT, "diff", "--shortstat").stdout.trim() || "no tracked change";
				const bad = syntaxProblem(p);
				if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
				if (DRY) { log(`DRY ok ${p.n} ${p.name} (${diff})`); continue; }
				tally.runnable++;
				const judged = p.expectRed;
				const declared = p.alsoRed ?? [];
				const allFails = [], passTitles = [], crashed = [];
				for (const rel of p.tests) {
					const res = await runTest(rel);
					if (LOGDIR) fs.writeFileSync(path.join(LOGDIR, `${p.n}--${path.basename(rel)}.log`), res.out);
					passTitles.push(...lineTitles(res.out, "PASS"));
					allFails.push(...lineTitles(res.out, "FAIL").map((t) => ({ rel, t })));
					if (fileCrashed(res.out)) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(res.out.trim().split("\n").filter((l) => /^[A-Za-z]*Error\b/.test(l)).at(-1) ?? "", 120)}`);
					else if ((res.code !== 0 || res.timedOut) && !lineTitles(res.out, "FAIL").length) crashed.push(`${path.basename(rel)} exit ${res.code}${res.timedOut ? " (timeout)" : ""}: ${short(res.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
					else if (res.code === 0 && lineTitles(res.out, "FAIL").length) crashed.push(`${path.basename(rel)} printed FAIL lines but exited 0`);
				}
				const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
				const matched = judged.filter(failed);
				const namedGreen = judged.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
				const notReached = judged.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
				const declaredRed = declared.filter(failed);
				const declaredGreen = declared.filter((s) => !failed(s));
				const unnamed = allFails.filter(({ t }) => ![...judged, ...declared].some((s) => isTitle(t, s)));
				const extra = `${declaredRed.length ? `; also (declared): ${declaredRed.map((s) => short(s, 80)).join(" | ")}` : ""}${declaredGreen.length ? `; declared but GREEN: ${declaredGreen.map(show).join(", ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map(show).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map(show).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 110)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
				if (matched.length) {
					tally.red++;
					if (namedGreen.length || notReached.length) tally.namedGreen++;
					if (unnamed.length) tally.unnamedRed++;
					if (!namedGreen.length && !notReached.length && !unnamed.length) tally.exact++;
					log(`RED ${p.n} ${p.name} — ${matched.length}/${judged.length} named: ${matched.map((t) => short(t, 100)).join(" | ")}${extra}`);
				} else if (allFails.length || crashed.length) {
					tally.red++;
					tally.namedGreen++;
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
		if (KEEP) log(`seat-mutate: KEEP — scratch left at ${SCRATCH}`);
		else {
			try { resetWorktree(); } catch (e) { log(`seat-mutate: reset failed at cleanup: ${e.message}`); }
			removeWorktree();
			fs.rmSync(SCRATCH, { recursive: true, force: true });
		}
	}
	log(resultLine(pairs.length, tally, survivors, { missing: 0, shards: 0 }));
	if (tally.anchorMiss || tally.syntax) exitCode = 3;
	return { exitCode, tally, survivors, baselineOk };
}

function resultLine(total, tally, survivors, { missing, shards, interrupted = false }) {
	const tail = `${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}${missing ? `, ${missing} MISSING` : ""}${shards ? `, across ${shards} shards` : ""}${interrupted ? " (INTERRUPTED)" : ""}`;
	if (DRY) return `RESULT (DRY): ${total - tally.anchorMiss - tally.syntax - missing}/${total} pairs apply${tail}`;
	return `RESULT: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}${tail}`;
}

/** Split `pairs` round-robin into `n` child runs of this script, then merge their part files into one output. */
async function runSharded(pairs, n, staggerMs, { tipSha, mergeBase, branchHead }) {
	const groups = Array.from({ length: n }, () => []);
	pairs.forEach((p, i) => groups[i % n].push(p.n));
	const outFile = process.env.SEAT_MUTATE_OUT || null;
	const partDir = outFile ? null : fs.mkdtempSync(path.join(os.tmpdir(), "roster-notice-seat-mutate-parts-"));
	const partOf = (k) => (outFile ? `${outFile}.part${k}of${n}` : path.join(partDir, `part${k}of${n}.txt`));
	const header = `seat-mutate: lane roster-notice, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs in ${n} shards (${groups.map((g) => g.length).join("+")}, round-robin, ${staggerMs / 1000}s apart)${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`;
	console.log(header);
	for (const d of DECLARED) console.log(`DECLARED ${d}`);

	const kids = new Set();
	let interrupted = false;
	const forward = (sig) => { interrupted = true; for (const c of kids) { try { c.kill(sig); } catch {} } };
	process.on("SIGINT", () => forward("SIGINT"));
	process.on("SIGTERM", () => forward("SIGTERM"));

	const runShard = (k, ids) => new Promise((resolve) => {
		const part = partOf(k);
		for (const f of [part, `${part}.json`]) fs.rmSync(f, { force: true });
		if (interrupted) { resolve({ k, code: null, signal: "not started" }); return; }
		const env = { ...process.env, SEAT_MUTATE_SHARD: `${k}/${n}`, SEAT_MUTATE_SHARDS: "1", SEAT_MUTATE_OUT: part, SEAT_MUTATE_TALLY: `${part}.json` };
		const child = spawn(process.execPath, [SCRIPT, ...ids], { env, stdio: ["ignore", "pipe", "pipe"] });
		kids.add(child);
		readline.createInterface({ input: child.stdout }).on("line", (l) => console.log(`[${k}/${n}] ${l}`));
		readline.createInterface({ input: child.stderr }).on("line", (l) => console.error(`[${k}/${n}] ${l}`));
		child.on("close", (code, signal) => { kids.delete(child); resolve({ k, code, signal }); });
	});
	const ends = await Promise.all(groups.map((ids, i) => new Promise((resolve) => setTimeout(() => resolve(runShard(i + 1, ids)), i * staggerMs))));

	// Merge: shard notes, every pair line in table order, one RESULT summed from the shard tallies.
	const total = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
	const survivors = [];
	const pairLines = new Map();
	const notes = [];
	let shardFailed = false;
	for (const end of ends) {
		const part = partOf(end.k);
		const lines = fs.existsSync(part) ? fs.readFileSync(part, "utf8").split("\n").filter(Boolean) : [];
		for (const l of lines) {
			const m = PAIR_LINE.exec(l);
			if (m) pairLines.set(m[1], l);
			else if (!l.startsWith("DECLARED ")) notes.push(`[${end.k}/${n}] ${l}`);
		}
		let t = null;
		try { t = JSON.parse(fs.readFileSync(`${part}.json`, "utf8")); } catch {}
		if (t?.tally) { for (const key of Object.keys(total)) total[key] += t.tally[key] ?? 0; survivors.push(...(t.survivors ?? [])); }
		if (end.code !== 0 && end.code !== 3) { shardFailed = true; notes.push(`[${end.k}/${n}] seat-mutate: shard exited ${end.code ?? end.signal}${t ? "" : " with no tally"}`); }
	}
	const order = new Map(PAIRS.map((p, i) => [p.n, i]));
	survivors.sort((a, b) => order.get(a) - order.get(b));
	const shardOf = new Map(groups.flatMap((ids, i) => ids.map((id) => [id, i + 1])));
	const merged = [header, ...DECLARED.map((d) => `DECLARED ${d}`), ...notes];
	let missing = 0;
	for (const p of pairs) {
		if (pairLines.has(p.n)) merged.push(pairLines.get(p.n));
		else { missing++; merged.push(`MISSING ${p.n} ${p.name} — shard ${shardOf.get(p.n)}/${n} printed no line for it`); }
	}
	const result = resultLine(pairs.length, total, survivors, { missing, shards: n, interrupted });
	merged.push(result);
	if (outFile) fs.writeFileSync(outFile, merged.join("\n") + "\n");
	for (const l of merged.slice(1 + DECLARED.length + notes.length)) console.log(l);
	console.log(`seat-mutate: merged output ${outFile ?? "(console only)"}; part files ${outFile ? `${outFile}.part<k>of${n}` : partDir}`);
	if (total.anchorMiss || total.syntax) return 3;
	if (missing || shardFailed || interrupted) return 2;
	return 0;
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const unknown = only.filter((id) => !PAIRS.some((p) => p.n === id));
if (unknown.length) { console.error(`seat-mutate: unknown pair id ${unknown.join(", ")} (ids are 1 to ${PAIRS.length})`); process.exit(2); }
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
const shardsRaw = SHARD ? "1" : process.env.SEAT_MUTATE_SHARDS ?? SHARDS_DEFAULT;
const shards = Number(shardsRaw);
const staggerSecs = Number(process.env.SEAT_MUTATE_STAGGER_SECS ?? STAGGER_SECS_DEFAULT);
if (!Number.isSafeInteger(shards) || shards < 1) { console.error(`seat-mutate: SEAT_MUTATE_SHARDS must be a whole number of 1 or more (got ${JSON.stringify(shardsRaw)})`); process.exit(2); }
if (!Number.isFinite(staggerSecs) || staggerSecs < 0) { console.error(`seat-mutate: SEAT_MUTATE_STAGGER_SECS must be 0 or more (got ${JSON.stringify(process.env.SEAT_MUTATE_STAGGER_SECS)})`); process.exit(2); }
const tip = resolveTip();
if (!tip.tipSha || !tip.mergeBase) { console.error(`seat-mutate: tip ${TIP} or its merge-base with main did not resolve in ${LANE_REPO}`); process.exit(2); }
const n = Math.min(shards, pairs.length);
if (n > 1) process.exitCode = await runSharded(pairs, n, staggerSecs * 1000, tip);
else {
	logFile = process.env.SEAT_MUTATE_OUT || null;
	if (logFile) fs.writeFileSync(logFile, "");
	const res = await runSingle(pairs, tip);
	if (process.env.SEAT_MUTATE_TALLY && res.tally) fs.writeFileSync(process.env.SEAT_MUTATE_TALLY, JSON.stringify({ tally: res.tally, survivors: res.survivors, pairs: pairs.length, baselineOk: res.baselineOk }));
	process.exitCode = res.exitCode;
}
