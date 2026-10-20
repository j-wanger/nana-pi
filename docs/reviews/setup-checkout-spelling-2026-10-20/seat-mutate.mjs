#!/usr/bin/env node
// Seat wrong-code pairs for lane setup-checkout-spelling (install, hook or gate lane), written by the seat 2026-10-20
// after build 1, on the shared runner. Each pair M1-M13 reverts one product site the lane changed to main's form
// (must-meet.md "Design"; build-brief-1.md W1-W10); M14 reverts every site at once, which is main's code.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/setup-checkout-spelling-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CS = "packages/nana-setup/tests/checkout-spelling.test.mjs";
const PATHS = "packages/nana-setup/lib/paths.mjs";
const STALE = "packages/nana-setup/lib/stale-copies.mjs";
const DOCTOR = "packages/nana-setup/lib/doctor.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const HEALTH = "packages/nana-setup/lib/hook-health.mjs";
const SETTINGS = "packages/nana-setup/lib/settings.mjs";
const UNINSTALL = "packages/nana-setup/lib/uninstall.mjs";
const R1980 = "R-1980: doctor through a second spelling of the checkout gives the same rows as through its on-disk spelling";
const R1981 = "R-1981: install through a second spelling of the checkout exits 0 and refuses none of its own links";
const R1982 = "R-1982: install through a second spelling of the checkout leaves the home byte-identical";
const R1983 = "R-1983: after installs through both spellings the stale-copy producer prints nothing through either";
const R1984 = "R-1984: links, hook entries and pi entries written through another spelling of the checkout still read as this checkout's";
const R1985 = "R-1985: uninstall --dry-run would unlink every link written through another spelling of the checkout";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const REALPATH_SAFE_WALK = [
	"\tlet cur = path.resolve(p);",
	"\tconst tail = [];",
	"\tfor (;;) {",
	"\t\ttry {",
	"\t\t\treturn path.join(fs.realpathSync(cur), ...tail);",
	"\t\t} catch {",
	"\t\t\tconst parent = path.dirname(cur);",
	"\t\t\tif (parent === cur) return path.resolve(p);",
	"\t\t\ttail.unshift(path.basename(cur));",
	"\t\t\tcur = parent;",
	"\t\t}",
	"\t}",
].join("\n");

// One site each, main's form; M14 applies them all.
const SITE = {
	pkgRoot: [one(PATHS, 'export const pkgRoot = realPath(path.resolve(fileURLToPath(new URL(".", import.meta.url)), ".."));', 'export const pkgRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");')],
	linkOk: [one(STALE, "return realPath(target, { mustExist: true }) === realPath(source, { mustExist: true });", "return fs.realpathSync(target) === fs.realpathSync(source);")],
	skillLinkState: [
		one(DOCTOR, "try { current = realPath(target, { mustExist: true }); } catch { /* dangling link */ }", "try { current = fs.realpathSync(target); } catch { /* dangling link */ }"),
		one(DOCTOR, "try { canonicalSource = realPath(source, { mustExist: true }); } catch { /* missing pack source */ }", "try { canonicalSource = fs.realpathSync(source); } catch { /* missing pack source */ }"),
	],
	linkSkill: [
		one(STEPS, "try { current = realPath(target, { mustExist: true }); } catch { /* broken foreign link */ }", "try { current = fs.realpathSync(target); } catch { /* broken foreign link */ }"),
		one(STEPS, "try { canonicalSource = realPath(source, { mustExist: true }); } catch { /* missing pack source */ }", "try { canonicalSource = fs.realpathSync(source); } catch { /* missing pack source */ }"),
	],
	retiredOwned: [one(STEPS, 'realPath(targetParent, { mustExist: true }) === realPath(path.join(pkgRoot, "claude", "hooks"), { mustExist: true })', 'fs.realpathSync(targetParent) === fs.realpathSync(path.join(pkgRoot, "claude", "hooks"))')],
	retiredLegacy: [
		one(STEPS, "try { target = realPath(legacyHook, { mustExist: true }); } catch { /* dangling */ }", "try { target = fs.realpathSync(legacyHook); } catch { /* dangling */ }"),
		one(STEPS, "const root = realPath(repoRoot, { mustExist: true });", "const root = fs.realpathSync(repoRoot);"),
	],
	pathVisibleNode: [one(STEPS, "try { if (realPath(candidate, { mustExist: true }) === expected) return candidate; } catch { /* next PATH entry */ }", "try { if (fs.realpathSync(candidate) === expected) return candidate; } catch { /* next PATH entry */ }")],
	realpathSafe: [one(STEPS, "\treturn realPath(p);", REALPATH_SAFE_WALK)],
	hookHealth: [
		one(HEALTH, 'import { realPath } from "../../nana-pack/lib/real-path.mjs";', 'import * as fs from "node:fs";\nimport { realPath } from "../../nana-pack/lib/real-path.mjs";'),
		one(HEALTH, "const real = realPath(target, { mustExist: true });", "const real = fs.realpathSync(target);"),
		one(HEALTH, "const root = realPath(repoRoot, { mustExist: true });", "const root = fs.realpathSync(repoRoot);"),
	],
	knowledgeHook: [
		one(SETTINGS, "const real = realPath(target, { mustExist: true });", "const real = fs.realpathSync(target);"),
		one(SETTINGS, "const root = realPath(repoRoot, { mustExist: true });", "const root = fs.realpathSync(repoRoot);"),
	],
	repoReal: [one(UNINSTALL, "const repoReal = realPath(repoRoot, { mustExist: true });", "const repoReal = fs.realpathSync(repoRoot);")],
	preflight: [one(UNINSTALL, "const target = realPath(row.path, { mustExist: true });", "const target = fs.realpathSync(row.path);")],
	perLink: [one(UNINSTALL, "try { target = realPath(row.path, { mustExist: true }); } catch {", "try { target = fs.realpathSync(row.path); } catch {")],
};

const DECLARED = [
	"(a) every pair runs on macOS in POSIX form and forced win32 through the case spelling; the lowercase-drive and 8.3 spellings exist only on the Windows leg",
	"(b) R-1981 and R-1983 have no single-site pair (plan-attack amendment 4); M14, main's code, is their pair here, as the tests-first commit 8fa24d53 is",
	"(c) M5, M6 and M7 (the retired-hook compares and pathVisibleNode's candidate) have no must-meet check (must-meet.md Known limits) and are expected to survive",
	"(d) M11 (uninstall's repoReal) is expected to survive: with pkgRoot canonical, repoRoot is already the on-disk spelling, and the check runs uninstall only through it",
	"(e) the case-fold alternative (build-brief-1.md W11) has no pair: it is red only on the Windows 8.3 spelling",
];

const PAIRS = [
	{ n: "M1", name: "pkgRoot keeps the spelling node was started through", edits: SITE.pkgRoot, tests: [CS], expectRed: [R1980, R1982] },
	{ n: "M2", name: "linkOk compares JS realpaths", edits: SITE.linkOk, tests: [CS], expectRed: [R1984] },
	{ n: "M3", name: "skillLinkState compares JS realpaths", edits: SITE.skillLinkState, tests: [CS], expectRed: [R1984] },
	{ n: "M4", name: "linkSkill's foreign-link test compares JS realpaths", edits: SITE.linkSkill, tests: [CS], expectRed: [R1984] },
	{ n: "M5", name: "the retired-hook ownership compare uses JS realpaths", edits: SITE.retiredOwned, tests: [CS], expectRed: [R1984] },
	{ n: "M6", name: "the retired context-size-check link compare uses JS realpaths", edits: SITE.retiredLegacy, tests: [CS], expectRed: [R1984] },
	{ n: "M7", name: "pathVisibleNode resolves its PATH candidate by JS realpath", edits: SITE.pathVisibleNode, tests: [CS], expectRed: [R1982] },
	{ n: "M8", name: "realpathSafe walks to an ancestor with JS realpath", edits: SITE.realpathSafe, tests: [CS], expectRed: [R1984] },
	{ n: "M9", name: "the win32 hook settings rows compare JS realpaths", edits: SITE.hookHealth, tests: [CS], expectRed: [R1984] },
	{ n: "M10", name: "knowledgeHookHealthy compares JS realpaths", edits: SITE.knowledgeHook, tests: [CS], expectRed: [R1984] },
	{ n: "M11", name: "uninstall's repoReal is a JS realpath", edits: SITE.repoReal, tests: [CS], expectRed: [R1985] },
	{ n: "M12", name: "uninstall's preflight resolves link targets by JS realpath", edits: SITE.preflight, tests: [CS], expectRed: [R1985] },
	{ n: "M13", name: "uninstall's per-link removal resolves its target by JS realpath", edits: SITE.perLink, tests: [CS], expectRed: [R1985] },
	{ n: "M14", name: "every site in main's form (main's code)", edits: Object.values(SITE).flat(), tests: [CS], expectRed: [R1980, R1981, R1982, R1983, R1984, R1985] },
];

process.exitCode = await runMutations({ lane: "setup-checkout-spelling", self: import.meta.url, tip: "15491d2", declared: DECLARED, pairs: PAIRS });
