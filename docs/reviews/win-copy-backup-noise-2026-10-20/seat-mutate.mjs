#!/usr/bin/env node
// Seat wrong-code pairs for lane win-copy-backup-noise (install lane), written by the seat 2026-10-20 after build 1,
// on the shared runner. Each pair reverts one product site the lane changed (paths, copy-record, fsops, steps,
// state-manifest) to today's main form or the obvious wrong implementation (must-meet.md; plan-attack.md;
// build-brief-1.md "Wrong code to try"). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-copy-backup-noise-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CRT = "packages/nana-setup/tests/copy-record.test.mjs";
const SMT = "packages/nana-setup/tests/state-manifest.test.mjs";
const UNT = "packages/nana-setup/tests/uninstall.test.mjs";
const PA = "packages/nana-setup/lib/paths.mjs";
const CR = "packages/nana-setup/lib/copy-record.mjs";
const FS = "packages/nana-setup/lib/fsops.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const SM = "packages/nana-setup/lib/state-manifest.mjs";
const R2310 = "R-2310: two source changes refresh unedited rule, skill and pi rulings copies with no dated backup";
const R2311 = "R-2311: owner-edited rule, skill and pi rulings copies each get exactly one dated backup holding the owner's bytes";
const R2312 = "R-2312: an absent, unparseable or non-object copy record falls back to one dated backup per changed copy";
const R2313 = "R-2313: a home installed before the record existed refreshes with no dated backup after one install";
const R2315 = "R-2315: dry run reports an unedited copy's refresh with no backup and changes nothing";
const R2316 = "R-2316: a directory or read-only file at the copy-record path leaves install finishing with one skipped copy-record row";
const R954 = "every path created by install maps to a nana-setup-owned manifest row";
const R955 = "every resolved layout path except declared containers is inventoried";
const R903 = "install --desk then uninstall restores the independent home snapshot";
const R660 = "released context entry is retired by install and its link is removed on uninstall";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const REMEMBER_IF = "if (win() && !o.dryRun && [CREATED, UPDATED, UNCHANGED].includes(result.status))";
const OPEN_RECORD = "const copyRecord = win() ? openCopyRecord(layout.copyRecord) : null;";
const UNEDITED_CMP = "earlier[target] === digest(fs.readFileSync(target))";
const ROW = 'rebuild("copy record", layout.copyRecord, "file");';

const DECLARED = [
	"(a) every pair runs on macOS; the copy-record checks force NANA_SETUP_PLATFORM=win32, so the native Windows leg is not run here",
	"(b) no pair, inferred survivors (not run): the record read's lstat guard (no test puts a symlink at the record path), the shape check's absolute-path and 64-hex entry test, save keeping earlier entries, save's nothing-remembered guard, and fsops' regular-file condition on refresh (copy-record's predicate already requires a regular file)",
	"(c) the win32 gates at the record open and in rememberCopy are each redundant on POSIX alone; M17 removes both, with the POSIX source reads",
];

const PAIRS = [
	{ n: "M1", name: "the copy record sits in the pi agent folder instead of beside the Claude copies", edits: [
		one(PA, 'copyRecord: path.join(claudeHome, "nana-setup-copies.json"),', 'copyRecord: path.join(piHome, "nana-setup-copies.json"),'),
	], tests: [CRT], expectRed: [R2310, R2312, R2316] },
	{ n: "M2", name: "any record entry counts as unedited, whatever the copy holds", edits: [
		one(CR, UNEDITED_CMP, "earlier[target] !== undefined"),
	], tests: [CRT], expectRed: [R2311] },
	{ n: "M3", name: "an absent, unparseable or non-object record owns every copy (fails open)", edits: [
		one(CR, 'if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") return {};', 'if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") return null;'),
		one(CR, "catch {\n\t\treturn {};", "catch {\n\t\treturn null;"),
		one(CR, UNEDITED_CMP, `(earlier === null || ${UNEDITED_CMP})`),
	], tests: [CRT], expectRed: [R2312] },
	{ n: "M4", name: "the record keys copies by file name, so the five SKILL.md mirrors share one key", edits: [
		one(CR, "remembered[target] = digest(bytes);", "remembered[path.basename(target)] = digest(bytes);"),
		one(CR, UNEDITED_CMP, "earlier[path.basename(target)] === digest(fs.readFileSync(target))"),
		one(CR, "path.isAbsolute(target) && typeof hash", "typeof hash"),
	], tests: [CRT], expectRed: [R2310, R2313] },
	{ n: "M5", name: "a SKIPPED save result passes through without naming the record or the next-update backups", edits: [
		one(CR, "if (result.status === SKIPPED) return skippedRow(file, result.detail);", ""),
	], tests: [CRT], expectRed: [R2316] },
	{ n: "M6", name: "a save error escapes install", edits: [
		one(CR, "return skippedRow(file, error?.message ?? String(error));", "throw error;"),
	], tests: [CRT], expectRed: [R2316] },
	{ n: "M7", name: "the dry run remembers copies and saves the record", edits: [
		one(CR, "if (o.dryRun || Object.keys(remembered).length === 0) return [];", "if (Object.keys(remembered).length === 0) return [];"),
		one(ST, REMEMBER_IF, "if (win() && [CREATED, UPDATED, UNCHANGED].includes(result.status))"),
	], tests: [CRT], expectRed: [R2315] },
	{ n: "M8", name: "linkFile drops the unedited predicate on copyInstead (main's form)", edits: [
		one(FS, '{ dryRun, action: "copy", unedited });', '{ dryRun, action: "copy" });'),
	], tests: [CRT], expectRed: [R2310, R2313, R2315] },
	{ n: "M9", name: "a real run still backs up an unedited copy (no refresh branch)", edits: [
		one(FS, '} else if (refresh) {\n\t\tdetail = "refreshed managed copy";\n\t} else if (st) {', "} else if (st) {"),
	], tests: [CRT], expectRed: [R2310, R2313] },
	{ n: "M10", name: "the dry run keeps main's backup wording for an unedited copy", edits: [
		one(FS, 'if (refresh) return { status: UPDATED, detail: "would refresh the managed copy" };', ""),
	], tests: [CRT], expectRed: [R2315] },
	{ n: "M11", name: "remember skips an UPDATED copy", edits: [
		one(ST, "[CREATED, UPDATED, UNCHANGED].includes(result.status)", "[CREATED, UNCHANGED].includes(result.status)"),
	], tests: [CRT], expectRed: [R2310] },
	{ n: "M12", name: "remember skips an UNCHANGED copy", edits: [
		one(ST, "[CREATED, UPDATED, UNCHANGED].includes(result.status)", "[CREATED, UPDATED].includes(result.status)"),
	], tests: [CRT], expectRed: [R2313] },
	{ n: "M13", name: "stepRules passes no unedited predicate (main's form)", edits: [
		one(ST, "unedited: o.copyRecord?.unedited(target),", ""),
	], tests: [CRT], expectRed: [R2310, R2313, R2315] },
	{ n: "M14", name: "the linkSkill win32 file loop passes no unedited predicate (main's form)", edits: [
		one(ST, "copyInstead: true, unedited: o.copyRecord?.unedited(fileTarget) });", "copyInstead: true });"),
	], tests: [CRT], expectRed: [R2310, R2313] },
	{ n: "M15", name: "stepPiConfig's rulings copy passes no unedited predicate (main's form)", edits: [
		one(ST, "copyInstead: win(), unedited: o.copyRecord?.unedited(layout.piRulings) });", "copyInstead: win() });"),
	], tests: [CRT], expectRed: [R2310, R2313, R2315] },
	{ n: "M16", name: "install opens the record only inside the lock, so the dry run has none", edits: [
		one(ST, OPEN_RECORD, "const copyRecord = win() && lockHeld ? openCopyRecord(layout.copyRecord) : null;"),
	], tests: [CRT], expectRed: [R2315] },
	{ n: "M17", name: "POSIX install opens, remembers and writes the record", edits: [
		one(ST, OPEN_RECORD, "const copyRecord = openCopyRecord(layout.copyRecord);"),
		one(ST, REMEMBER_IF, "if (!o.dryRun && [CREATED, UPDATED, UNCHANGED].includes(result.status))"),
		one(ST, "const sourceBytes = win() ? fs.readFileSync(source) : null;", "const sourceBytes = fs.readFileSync(source);"),
		one(ST, "const rulingsBytes = win() ? fs.readFileSync(rulingsSource) : null;", "const rulingsBytes = fs.readFileSync(rulingsSource);"),
	], tests: [UNT], expectRed: [R903, R660] },
	{ n: "M18", name: "the copy record has no inventory row", edits: [
		one(SM, ROW, ""),
	], tests: [SMT], expectRed: [R955, R954] },
	{ n: "M19", name: "the copy record's inventory row has kind generated, which uninstall deletes", edits: [
		one(SM, ROW, 'rebuild("copy record", layout.copyRecord, "generated");'),
	], tests: [SMT], expectRed: [R954] },
];

process.exitCode = await runMutations({ lane: "win-copy-backup-noise", self: import.meta.url, tip: "dfe54123", declared: DECLARED, pairs: PAIRS });
