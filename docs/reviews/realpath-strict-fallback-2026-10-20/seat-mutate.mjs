#!/usr/bin/env node
// Seat wrong-code pairs for lane realpath-strict-fallback (install, hook or gate lane), written by the seat 2026-10-20 on
// the tip 9c16aca1 (build dd684f3f plus the seat's merge of main aa5f25cd), on the shared runner. The lane changes one
// product site, realPath's catch for a native error other than a missing file. Each pair puts that site back to today's
// main behaviour or to an obvious wrong form (build-brief-1.md "Wrong code to try" W1, W2, W3, W5, plus a fallback that
// skips the JavaScript lookup). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/realpath-strict-fallback-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RP = "packages/nana-pack/lib/real-path.mjs";
const RPT = "packages/nana-pack/tests/real-path.test.mjs";
const RFT = "packages/nana-setup/tests/realpath-fallback.test.mjs";
const R2180 = "R-2180: typed realpath is used for every sampled non-missing native error with and without mustExist";
const R2181 = "R-2181: when native and typed realpath both fail on an aliased symlink loop mustExist throws the native code and the default returns the input";
const R2182 = "R-2182: doctor row labels and statuses match control when native realpath fails inside the checkout";
const R2183 = "R-2183: the stale-copy producer stays silent in control and native-realpath-failure runs";
const R2184 = "R-2184: uninstall dry-run keeps the control would-unlink rows when native realpath fails inside the checkout";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const FALLBACK = "    try {\n      return realpathSync(abs);\n    } catch {\n      if (mustExist) throw e;\n      return abs;\n    }";
const BOTH_FAIL = "      if (mustExist) throw e;\n      return abs;";

const DECLARED = [
	"(a) every pair runs on macOS; R-2182 and R-2183 run their POSIX and forced-win32 forms here, and R-2184 runs its POSIX form",
	"(b) W4 (real-path unchanged, a JavaScript fallback inside linkOk only) has no pair: it leaves real-path as M1 does and edits a site this lane does not change",
	"(c) W6 (a no-op preload) edits the test, not product code, so it has no pair",
];

const PAIRS = [
	{ n: "M1", name: "main's catch: under mustExist, rethrow the native error before the JavaScript lookup", edits: [
		one(RP, FALLBACK, "    if (mustExist) throw e;\n    try { return realpathSync(abs); } catch { return abs; }"),
	], tests: [RPT, RFT], expectRed: [R2180, R2182, R2183, R2184] },
	{ n: "M2", name: "under mustExist, fall back only on EISDIR (the narrow ImDisk fix)", edits: [
		one(RP, FALLBACK, `    if (mustExist && e.code !== 'EISDIR') throw e;\n${FALLBACK}`),
	], tests: [RPT], expectRed: [R2180] },
	{ n: "M3", name: "under mustExist, return the unresolved path when both lookups fail", edits: [
		one(RP, BOTH_FAIL, "      return abs;"),
	], tests: [RPT], expectRed: [R2181] },
	{ n: "M4", name: "without mustExist, canonicalize the existing ancestor when both lookups fail", edits: [
		one(RP, BOTH_FAIL, "      if (mustExist) throw e;\n      return canonicalizeMissing(abs);"),
	], tests: [RPT], expectRed: [R2181] },
	{ n: "M5", name: "the fallback returns the unresolved path instead of the JavaScript lookup's result", edits: [
		one(RP, "      return realpathSync(abs);\n    } catch {", "      return abs;\n    } catch {"),
	], tests: [RPT, RFT], expectRed: [R2180, R2182, R2183, R2184] },
];

process.exitCode = await runMutations({ lane: "realpath-strict-fallback", self: import.meta.url, tip: "f38af41b", declared: DECLARED, pairs: PAIRS });
