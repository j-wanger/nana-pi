#!/usr/bin/env node
// Seat wrong-code pairs for lane checkout-spelling-converge (install, hook or gate lane), written by the seat
// 2026-10-20 on tip 29b83bf4 (build 8d6af832 plus the merge of main c7f582ad), on the shared runner. Each pair
// reverts one site the lane changed to today's main form or the obvious wrong form (build-brief-1.md W1-W8,
// plus one pair per remaining branch). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/checkout-spelling-converge-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CC = "packages/nana-setup/tests/checkout-converge.test.mjs";
const SM = "packages/nana-setup/tests/settings-merge.test.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const SE = "packages/nana-setup/lib/settings.mjs";
const UN = "packages/nana-setup/lib/uninstall.mjs";
const R2200 = "R-2200: install converges same-checkout skill links to the on-disk spelling";
const R2201 = "R-2201: install preserves skill links to another checkout copy as foreign";
const R2202 = "R-2202: install converges the knowledge command to the on-disk spelling";
const R2203 = "R-2203: uninstall removes a respelled knowledge entry without a variant row";
const R2204 = "R-2204: uninstall preserves foreign and customized respelled knowledge entries";
const HEALTHY = "every group is scanned regardless of matcher: a healthy knowledge entry under matcher \"*\" is found and left alone, no twin";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const FOREIGN = "return { status: PROBLEM, detail: `foreign link at ${target} -> ${current} — left untouched` };";

const LANE_PRESERVE = [
	"\t\tif (o.preserveForeignLink && current !== resolved) {",
	"\t\t\ttry {",
	"\t\t\t\tif (realPath(target, { mustExist: true }) !== realPath(source, { mustExist: true }))",
	`\t\t\t\t\t${FOREIGN}`,
	"\t\t\t} catch {",
	`\t\t\t\t${FOREIGN}`,
	"\t\t\t}",
	"\t\t}",
].join("\n");
const MAIN_PRESERVE = [
	"\t\tif (o.preserveForeignLink) {",
	"\t\t\ttry { current = realPath(target, { mustExist: true }); } catch { /* broken foreign link */ }",
	"\t\t\tlet canonicalSource = resolved;",
	"\t\t\ttry { canonicalSource = realPath(source, { mustExist: true }); } catch { /* missing pack source */ }",
	"\t\t\tif (current === canonicalSource) return { status: UNCHANGED, detail: null };",
	`\t\t\t${FOREIGN}`,
	"\t\t}",
].join("\n");
const DANGLING_CATCH = ["\t\t\t} catch {", `\t\t\t\t${FOREIGN}`, "\t\t\t}"].join("\n");

const DECLARED = [
	"(a) every pair runs on macOS, where the link and letter-case spellings both exist; each check runs both",
	"(b) P5 and P10 name the nearest guard: no must-meet check plants a dangling newly managed skill link or a respelled knowledge entry whose target is missing",
	"(c) no pair for the scripts/test.mjs SKIPS entry (it acts only on the win32 leg) or the comment beside the healthy check; the args, marker and equal-command tests in the respelling predicate and the posix-form test in mergeRepoHooks are equivalent on POSIX and forced win32 (the wanted win32 entry has args, so its command names no knowledge target), so they have no pair",
];

const PAIRS = [
	{ n: "P1", name: "(W1) linkSkill's preserve branch is main's: a same-real-path link reads unchanged and keeps its old text", edits: [
		one(ST, LANE_PRESERVE, MAIN_PRESERVE),
	], tests: [CC], expectRed: [R2200] },
	{ n: "P2", name: "(W2) the preserve branch is skipped: any newly managed link whose text differs is relinked", edits: [
		one(ST, "if (o.preserveForeignLink && current !== resolved) {", "if (false) {"),
	], tests: [CC], expectRed: [R2201] },
	{ n: "P3", name: "(W3) a link is owned when its text ends in the pack's skill folder suffix", edits: [
		one(ST, "if (o.preserveForeignLink && current !== resolved) {", "if (o.preserveForeignLink && !current.endsWith(`/packages/nana-pack/skills/${path.basename(target)}`)) {"),
	], tests: [CC], expectRed: [R2201] },
	{ n: "P4", name: "the preserve branch compares the link's resolved text, not its real path, with the source's real path", edits: [
		one(ST, "if (realPath(target, { mustExist: true }) !== realPath(source, { mustExist: true }))", "if (current !== realPath(source, { mustExist: true }))"),
	], tests: [CC], expectRed: [R2200] },
	{ n: "P5", name: "a dangling newly managed link falls through to the relink instead of reading foreign", edits: [
		one(ST, DANGLING_CATCH, "\t\t\t} catch { /* dangling: relink */ }"),
	], tests: [CC], expectRed: [R2201] },
	{ n: "P6", name: "(W5) removeInstallerHooks removes exact entries only", edits: [
		one(SE, " || respelledKnowledgeEntry(entry, item));", ");"),
	], tests: [CC], expectRed: [R2203] },
	{ n: "P7", name: "(W6) the respelling predicate ignores every key but the command", edits: [
		one(SE, "if (JSON.stringify(canonical({ ...entry, command: wanted.entry.command })) !== JSON.stringify(canonical(wanted.entry))) return false;", "/* other keys ignored */"),
	], tests: [CC], expectRed: [R2204] },
	{ n: "P8", name: "(W7) the respelling predicate owns any installer-form knowledge entry whose target exists", edits: [
		one(SE, "return realPath(target, { mustExist: true }) === realPath(wantedTarget, { mustExist: true });", "return fs.existsSync(target);"),
	], tests: [CC], expectRed: [R2204] },
	{ n: "P9", name: "the respelling predicate compares targets by the JS realpath, which keeps a typed letter case", edits: [
		one(SE, "return realPath(target, { mustExist: true }) === realPath(wantedTarget, { mustExist: true });", "return fs.realpathSync(target) === fs.realpathSync(wantedTarget);"),
	], tests: [CC], expectRed: [R2203] },
	{ n: "P10", name: "the respelling predicate owns an entry whose target is missing", edits: [
		one(SE, "\t} catch {\n\t\treturn false;\n\t}\n}\n\n/** Remove exact desired hook entries", "\t} catch {\n\t\treturn true;\n\t}\n}\n\n/** Remove exact desired hook entries"),
	], tests: [CC], expectRed: [R2204] },
	{ n: "P11", name: "(W4) mergeRepoHooks keeps a healthy entry that names the same file through another command (main)", edits: [
		one(SE, "if (item.healthy && (!win32 || item.form === \"win32-exec\") && !item.sameFile) continue;", "if (item.healthy && (!win32 || item.form === \"win32-exec\")) continue;"),
	], tests: [CC], expectRed: [R2202] },
	{ n: "P12", name: "mergeRepoHooks' same-file test compares the typed target text, not real paths", edits: [
		one(SE, "sameFile = wantedTarget !== null && realPath(match.target, { mustExist: true }) === realPath(wantedTarget, { mustExist: true });", "sameFile = wantedTarget !== null && match.target === wantedTarget;"),
	], tests: [CC], expectRed: [R2202] },
	{ n: "P13", name: "mergeRepoHooks' same-file test also takes the installer's exact command, so a normal install rewrites its own healthy entry", edits: [
		one(SE, "if (match.form === \"posix\" && hook.command !== w.entry.command) {", "if (match.form === \"posix\") {"),
	], tests: [SM], expectRed: [HEALTHY] },
	{ n: "P14", name: "(W8) settingsVariants reads the settings before removal", edits: [
		one(UN, "const variants = settingsVariants(previewSettings, layout);", "const variants = settingsVariants(initial.settings, layout);"),
	], tests: [CC], expectRed: [R2203] },
];

process.exitCode = await runMutations({ lane: "checkout-spelling-converge", self: import.meta.url, tip: "d901a045", declared: DECLARED, pairs: PAIRS });
