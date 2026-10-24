#!/usr/bin/env node
// Seat wrong-code pairs for lane project-check-line (hook), written by the seat 2026-10-23 after build 1, at tip 91ea70fe.
// They are must-meet.md's "Wrong-code pairs": the draft's pairs 1 to 17 (plan-draft.md), pair 18 reworded as
// "the role guard removed" (R-2626), and the attack's 19 to 25 (plan-attack.md), each mapped onto the code at the tip:
// lib/project-rows.mjs (projectFileRows, byHand, readText), lib/stale-copies.mjs (projectStaleLine) and lib/project.mjs
// (checkProject). Run from the lane worktree root, with CLAUDE_CONFIG_DIR unset (the mutation runner does not scrub it)
// and a scratch TMPDIR:
//   SEAT_MUTATE_DRY=1 node docs/reviews/project-check-line-2026-10-23/seat-mutate.mjs
//   SEAT_MUTATE_OUT=<file> node docs/reviews/project-check-line-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SC = "packages/nana-setup/lib/stale-copies.mjs";
const ROWS = "packages/nana-setup/lib/project-rows.mjs";
const T_PS = "packages/nana-setup/tests/project-stale.test.mjs";
const T_ODD = "packages/nana-setup/tests/project-odd-seeds.test.mjs";
const T_PROJ = "packages/nana-setup/tests/project.test.mjs";
const T_WR = "packages/nana-setup/tests/project-working-region.test.mjs";

// Exact titles (seat-titles.mjs and the files' PASS lines); the runner matches a FAIL line that starts with the title and a space.
const R_2623 = "R-2623: a session in a project whose working section differs gets one project-stale line naming nana-setup project for its root";
const R_2625 = "R-2625: a pi session in a drifted project gets the producer's project-stale line as its section, gone after a refresh and a reload";
const R_2626 = "R-2626: reviewer and worker children get no project-stale line in either seat, and the same folder with no role does";
const R_2627 = "R-2627: deciding the project-stale line starts no child process and loads no TypeScript in either seat";
const R_2760 = "R-2760: a repository with neither an objective file nor a nana working-region marker gets no project line in either seat, whatever its check fails";
const R_2761 = "R-2761: an adopted project missing frontier seeds gets one project line naming each missing row in the check's order, in both seats";
const R_2762 = "R-2762: the project line names exactly the file rows project --check marks ✗";
const R_2763 = "R-2763: rows the check leaves to the owner are named as fixes by hand with the check command, and the line carries nothing read from the entry";
const R_2764 = "R-2764: no repository, a linked worktree, a nana-pi checkout and a dismissed root get no project line even with every seed missing";
const R_2765 = "R-2765: an unreadable, invalid UTF-8 or over-cap AGENTS.md leaves the working section out and the other failing rows in";
const R_2422 = "R-2422: --check names the entry at each seed path or on its folder path, CLAUDE.md included, and says to move or remove it";

const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// Anchors in projectStaleLine (lib/stale-copies.mjs at 91ea70fe).
const ROLE = "if (LAUNCHER_ROLES.includes(env?.NANA_ROLE)) return \"\";";
const ROOT = "const root = repoRootOf(session);";
const GIT = "const git = fs.lstatSync(path.join(root, \".git\"));";
const GIT_FILE = "if (git.isFile()) return \"\";";
const NANA_PI = "fs.lstatSync(path.join(root, \"templates\", \"_shared\", WORKING_FILE));";
const DISMISSED = "fs.lstatSync(path.join(root, MARKER));";
const AGENTS_TEXT = "let agentsText = null;";
const AGENTS_REGULAR = "if (agentsState?.isFile() && !agentsState.isSymbolicLink()) {";
const GATE_READ = "agentsText = new TextDecoder(\"utf-8\", { fatal: true, ignoreBOM: true }).decode(readBounded(agents));";
const GATE_CATCH = "} catch { /* an unreadable AGENTS.md cannot supply the marker gate or a region row */ }";
const OBJECTIVE = "const hasObjectiveEntry = Boolean(lstat(path.join(root, \"OBJECTIVE.md\")));";
const MARKER_ARM = "const hasMarker = agentsText !== null && markerLines(agentsText).length > 0;";
const GATE = "if (!hasObjectiveEntry && !hasMarker) return \"\";";
const ROW_READ = "return new TextDecoder(\"utf-8\", { fatal: true, ignoreBOM: true }).decode(readBounded(file));";
const FAILING = "const failing = projectFileRows(root, { readText }).filter((row) => row.ok === false && !row.note);";
const ROWS_CALL = "projectFileRows(root, { readText })";
const LABELS = "const labels = failing.map((row) => row.label === \"AGENTS.md working region\" ? PROJECT_STALE_LABEL : row.label);";
const BY_HAND = "const byHand = failing.filter((row) => row.byHand)";
const SPAN_GUARD = "if (![...PROJECT_STALE_NO_PATH_CHARS].some((character) => root.includes(character)) && printable(root)) {";
const IMPORT_ROWS = "import { lstat, projectFileRows } from \"./project-rows.mjs\";";
const IMPORT_CHECK = `${IMPORT_ROWS}\nimport { checkProject } from "./project.mjs";`;
const REGULAR_AGENTS = "Boolean(agentsState?.isFile() && !agentsState.isSymbolicLink())";

// Anchors in projectFileRows (lib/project-rows.mjs at 91ea70fe).
const SEED_DETAIL = "not a readable ${rel}; move or remove it by hand";
const HANDOFF_ROW = "seed(\"HANDOFF.md\", \"the frontier\"),";
const ROWS_OPEN = "const rows = [";
const MONTH_OK = "ok: monthFiles.length > 0,";
const MONTH_BY_HAND = "byHand: !monthFiles.length && Boolean(monthState.found),";
const AGENTS_READ = "const body = readText(agentPath);";
const ABSENT_BY_HAND = "byHand: !claude.ok && Boolean(claude.found),";

const DECLARED = [
	"(plan) pairs 1 to 17 follow the draft's wrong-code list, 18 is the must-meet's rewording (the role guard removed, R-2626), 19 to 25 are the attack's; 5 is split into 5a fenced, 5b through a link and 5c past the cap; 13 into its four skips; 16 into 16a (checkProject called on the session folder beside the rows) and 16b (its async result used as the rows); 17 into 17a (one detail) and 17b (the order); 19 into 19a (gate read) and 19b (row read); 21 into 21a (existsSync) and 21b (isFile), each the plan's own variants",
	"(seat) each pair names every title its edit must turn red, beyond the plan's first name",
	"(seat) pair 8's draft text names R-2762's docs-a-file case, but R-2762 compares labels only and a leaf-only seed copy gives the same labels there (both mark docs/sessions/README.md and the month row); the pair names R-2763, whose docs-file case compares the by-hand split with the check's summary",
	"(seat) pair 8 adds a leaf-only copy of the three seed rows inside projectStaleLine, the second copy the 2026-10-22 rule forbids; pair 14 returns an empty line on an EACCES or EPERM gate read; pair 15 adds a differing region row on that error",
	"(seat) pairs 7, 17a, 17b, 20, 24 and 25 edit the shared projectFileRows: 7, 17a, 17b and 25 also change project --check; 20 and 24 change only the byHand field the check ignores",
	"(seat) pair 13d takes two edits: with `if (!root)` dropped alone, the .git lstat throws on a null root and the outer catch still returns an empty line, so the mutant falls back to the session folder as root and tolerates a missing .git",
	"(seat) pairs 17a, 17b and 25 also run project.test.mjs and project-odd-seeds.test.mjs (17b and 25 also project-working-region.test.mjs) to show which project test titles see a changed check; by grep, no project test file pins the check's row order or its AGENTS.md read error, so 17b names R-2623 and 25 names R-2762",
	"(non-pair) setupProject's dry run on the session folder, the draft's other pair-16 shape: 16a stands for both, since the plan names the same R-2627 spawn count for each and stale-copies.mjs would import either the same way",
	"(non-pair) dropping `&& printable(root)` from the span guard: codeSpan refuses the same control, separator, bidi and backtick characters, so only printable's MAX_ROOT length bound differs, and no row pins it",
	"(non-pair) an unbounded CLAUDE.md read on the producer path: an over-cap CLAUDE.md reads as neither the import nor the placeholder either way, so the line is the same; only the read's cost differs",
];

const PAIRS = [
	{ n: "1", name: "no gate: the line is keyed on failing rows alone", edits: [
		one(SC, GATE, "/* mutation: no gate */"),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "2", name: "the gate counts any seed, so HANDOFF.md opts in", edits: [
		one(SC, OBJECTIVE, "const hasObjectiveEntry = [\"OBJECTIVE.md\", \"HANDOFF.md\", \"docs/sessions/README.md\"].some((rel) => Boolean(lstat(path.join(root, ...rel.split(\"/\")))));"),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "3", name: "the gate drops the objective arm", edits: [
		one(SC, OBJECTIVE, "const hasObjectiveEntry = false;"),
	], tests: [T_PS], expectRed: [R_2760, R_2761, R_2762, R_2763, R_2765] },
	{ n: "4", name: "the gate drops the marker arm", edits: [
		one(SC, MARKER_ARM, "const hasMarker = false;"),
	], tests: [T_PS], expectRed: [R_2623, R_2760, R_2762] },
	{ n: "5a", name: "the gate counts fenced markers", edits: [
		one(SC, MARKER_ARM, "const hasMarker = agentsText !== null && agentsText.split(/\\r?\\n/).some((line) => markerLines(line).length > 0);"),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "5b", name: "the gate reads markers through an AGENTS.md link", edits: [
		one(SC, AGENTS_REGULAR, "if (agentsState) {"),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "5c", name: "the gate reads markers past the bounded read cap", edits: [
		one(SC, MARKER_ARM, `const hasMarker = (() => { try { return ${REGULAR_AGENTS} && markerLines(agentsText ?? new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(fs.readFileSync(agents))).length > 0; } catch { return false; } })();`),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "6", name: "! note rows are named", edits: [
		one(SC, FAILING, "const failing = projectFileRows(root, { readText }).filter((row) => row.ok === false);"),
	], tests: [T_PS], expectRed: [R_2760, R_2761, R_2762] },
	{ n: "7", name: "the month row requires this month's file", edits: [
		one(ROWS, MONTH_OK, "ok: monthState.ok,"),
	], tests: [T_PS], expectRed: [R_2623, R_2760, R_2761, R_2765, R_2626, R_2627] },
	{ n: "8", name: "a second seed-row copy in stale-copies.mjs that drops the odd-folder walk", edits: [
		one(SC, FAILING, `const leafOnly = (row) => { if (!["OBJECTIVE.md", "HANDOFF.md", "docs/sessions/README.md"].includes(row.label)) return row; const st = lstat(path.join(root, ...row.label.split("/"))); const file = Boolean(st?.isFile() && !st.isSymbolicLink()); return { ...row, ok: file, byHand: Boolean(st) && !file }; };\n\t\tconst failing = projectFileRows(root, { readText }).map(leafOnly).filter((row) => row.ok === false && !row.note);`),
	], tests: [T_PS], expectRed: [R_2763] },
	{ n: "9", name: "byHand ignored, so every row gets the project command", edits: [
		one(SC, BY_HAND, "const byHand = failing.filter(() => false)"),
	], tests: [T_PS], expectRed: [R_2760, R_2763] },
	{ n: "10", name: "row details carrying a link target copied into the line", edits: [
		one(SC, LABELS, "const labels = failing.map((row) => (row.label === \"AGENTS.md working region\" ? PROJECT_STALE_LABEL : row.label) + (String(row.detail).includes(\"symlink ->\") ? ` (${row.detail})` : \"\"));"),
	], tests: [T_PS], expectRed: [R_2760, R_2762, R_2763] },
	{ n: "11", name: "the working section rendered with the check's label", edits: [
		one(SC, LABELS, "const labels = failing.map((row) => row.label);"),
	], tests: [T_PS], expectRed: [R_2623, R_2760, R_2761, R_2765, R_2626] },
	{ n: "12", name: "rows out of the check's order: the region first", edits: [
		one(SC, FAILING, "const failing = projectFileRows(root, { readText }).filter((row) => row.ok === false && !row.note).sort((a, b) => Number(b.label === \"AGENTS.md working region\") - Number(a.label === \"AGENTS.md working region\"));"),
	], tests: [T_PS], expectRed: [R_2623, R_2760, R_2761, R_2765] },
	{ n: "13a", name: "the dismissal skip dropped", edits: [
		one(SC, DISMISSED, "throw new Error(\"mutation: dismissal skip dropped\");"),
	], tests: [T_PS], expectRed: [R_2764] },
	{ n: "13b", name: "the .git-file (linked worktree) skip dropped", edits: [
		one(SC, GIT_FILE, "if (false) return \"\";"),
	], tests: [T_PS], expectRed: [R_2764] },
	{ n: "13c", name: "the nana-pi checkout skip dropped", edits: [
		one(SC, NANA_PI, "throw new Error(\"mutation: nana-pi checkout skip dropped\");"),
	], tests: [T_PS], expectRed: [R_2764] },
	{ n: "13d", name: "the no-repository skip dropped: the session folder stands in as root", edits: [
		one(SC, ROOT, "const root = repoRootOf(session) ?? session;"),
		one(SC, GIT, "const git = lstat(path.join(root, \".git\")) ?? { isFile: () => false };"),
	], tests: [T_PS], expectRed: [R_2764] },
	{ n: "14", name: "an unreadable AGENTS.md returns an empty line, as on main", edits: [
		one(SC, GATE_CATCH, "} catch (error) { if (error?.code === \"EACCES\" || error?.code === \"EPERM\") return \"\"; }"),
	], tests: [T_PS], expectRed: [R_2765] },
	{ n: "15", name: "an unreadable AGENTS.md counted as a differing working section", edits: [
		one(SC, AGENTS_TEXT, "let agentsText = null;\n\t\tlet agentsUnreadable = false;"),
		one(SC, GATE_CATCH, "} catch (error) { if (error?.code === \"EACCES\" || error?.code === \"EPERM\") agentsUnreadable = true; }"),
		one(SC, FAILING, "const failing = projectFileRows(root, { readText }).filter((row) => row.ok === false && !row.note).concat(agentsUnreadable ? [{ label: \"AGENTS.md working region\", ok: false, byHand: false, detail: \"differs\" }] : []);"),
	], tests: [T_PS], expectRed: [R_2765] },
	{ n: "16a", name: "checkProject called on the session folder beside the rows", edits: [
		one(SC, IMPORT_ROWS, IMPORT_CHECK),
		one(SC, FAILING, `void checkProject(session).catch(() => {});\n\t\t${FAILING}`),
	], tests: [T_PS], expectRed: [R_2627] },
	{ n: "16b", name: "checkProject's async result on the session folder used as the rows", edits: [
		one(SC, IMPORT_ROWS, IMPORT_CHECK),
		one(SC, ROWS_CALL, "checkProject(session).catch(() => [])"),
	], tests: [T_PS], expectRed: [R_2623, R_2760, R_2761, R_2762, R_2763, R_2764, R_2765, R_2625, R_2626, R_2627] },
	{ n: "17a", name: "the lift changes one check detail: the seed rows drop 'by hand'", edits: [
		one(ROWS, SEED_DETAIL, "not a readable ${rel}; move or remove it"),
	], tests: [T_ODD, T_PROJ, T_PS], expectRed: [R_2422] },
	{ n: "17b", name: "the lift changes the check's order: HANDOFF.md before OBJECTIVE.md", edits: [
		one(ROWS, HANDOFF_ROW, ""),
		one(ROWS, ROWS_OPEN, `${ROWS_OPEN}${HANDOFF_ROW}`),
	], tests: [T_PS, T_ODD, T_PROJ, T_WR], expectRed: [R_2623] },
	{ n: "18", name: "the role guard removed", edits: [
		one(SC, ROLE, "/* mutation: no role guard */"),
	], tests: [T_PS], expectRed: [R_2626] },
	{ n: "19a", name: "the gate read strips a BOM", edits: [
		one(SC, GATE_READ, "agentsText = new TextDecoder(\"utf-8\", { fatal: true, ignoreBOM: false }).decode(readBounded(agents));"),
	], tests: [T_PS], expectRed: [R_2762] },
	{ n: "19b", name: "the rows' readText strips a BOM", edits: [
		one(SC, ROW_READ, "return new TextDecoder(\"utf-8\", { fatal: true, ignoreBOM: false }).decode(readBounded(file));"),
	], tests: [T_PS], expectRed: [R_2762] },
	{ n: "20", name: "byHand false for AGENTS.md absent with CLAUDE.md odd", edits: [
		one(ROWS, ABSENT_BY_HAND, "byHand: false,"),
	], tests: [T_PS], expectRed: [R_2763] },
	{ n: "21a", name: "the objective arm uses existsSync", edits: [
		one(SC, OBJECTIVE, "const hasObjectiveEntry = fs.existsSync(path.join(root, \"OBJECTIVE.md\"));"),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "21b", name: "the objective arm uses isFile", edits: [
		one(SC, OBJECTIVE, "const hasObjectiveEntry = Boolean(lstat(path.join(root, \"OBJECTIVE.md\"))?.isFile());"),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "22", name: "the special-character guard skipped on the --check span", edits: [
		one(SC, SPAN_GUARD, "if (check || (![...PROJECT_STALE_NO_PATH_CHARS].some((character) => root.includes(character)) && printable(root))) {"),
	], tests: [T_PS], expectRed: [R_2763] },
	{ n: "23", name: "the gate decodes AGENTS.md non-fatally", edits: [
		one(SC, MARKER_ARM, `const hasMarker = (() => { try { return ${REGULAR_AGENTS} && markerLines(new TextDecoder("utf-8", { ignoreBOM: true }).decode(readBounded(agents))).length > 0; } catch { return false; } })();`),
	], tests: [T_PS], expectRed: [R_2760] },
	{ n: "24", name: "the month row's byHand taken from the README's state", edits: [
		one(ROWS, MONTH_BY_HAND, "byHand: !monthFiles.length && Boolean(fileState(\"docs/sessions/README.md\").found),"),
	], tests: [T_PS], expectRed: [R_2763] },
	{ n: "25", name: "projectFileRows swallows the check's AGENTS.md read error", edits: [
		one(ROWS, AGENTS_READ, "let body; try { body = readText(agentPath); } catch { body = null; }"),
	], tests: [T_PS, T_PROJ, T_ODD, T_WR], expectRed: [R_2762] },
];

process.exitCode = await runMutations({
	lane: "project-check-line",
	branch: "feat/project-check-line",
	self: import.meta.url,
	tip: "91ea70fe",
	declared: DECLARED,
	pairs: PAIRS,
});
