/**
 * @module packages/nana-setup/tests/fsops.test.mjs
 * @purpose Pins writeIfChanged's non-destructive contract: a symlink (live or dangling) in the way is left untouched and reported SKIPPED, with no read targeting the link or its destination and no write through it
 * @inputs lib/fsops.mjs writeIfChanged, throwaway scratch directories with real symlinks, and (for the no-read instrumentation) a global spy on fs.readFileSync installed via require('fs') + syncBuiltinESMExports()
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway scratch dir, files and symlinks, removed on exit); process-global (readFileSync is monkeypatched and restored within a single synchronous call, via node:module's syncBuiltinESMExports)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: fsops.mjs's own module header says "@errors none typed ... a symlink or directory in
// the way is returned as SKIPPED and never written through" (line 15) — the invariant linkFile
// and seedFile already hold. writeIfChanged read straight through a symlink with
// fs.readFileSync and wrote straight through it with fs.writeFileSync: it could overwrite a
// symlink's target, or materialize a dangling link's target, contrary to that contract
// (pi-1.0-2026-10-04 review claim, confirmed by astra r1 MUST 1/3).
//
// astra r1 MUST 2: the first cut of this file pinned status and byte-content, but not the
// "instead of reading ... through it" clause — astra's mutation (a caught fs.readFileSync of
// `target` inserted before the lstat guard) left all ten checks green despite violating that
// clause. Node's `import * as fs from "node:fs"` namespace CAN be live-patched from outside the
// module after all (astra r1 SHOULD, corrected from this file's earlier, wrong claim): mutate
// the CommonJS `require("fs")` exports object, then call `syncBuiltinESMExports()` from
// node:module to re-sync the ESM binding every other module (including fsops.mjs) reads through.
// That lets this test install a real spy on the ACTUAL fs.readFileSync for the duration of one
// call and assert nothing in the production code path reads the link or its destination.
import { tmpDir } from "./tmp-dir.mjs";
import { createRequire } from "node:module";
import { syncBuiltinESMExports } from "node:module";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { writeIfChanged, SKIPPED } = await import(new URL("../lib/fsops.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const require = createRequire(import.meta.url);
const fsCjs = require("fs");

/**
 * Run `fn`, recording every path passed to the REAL fs.readFileSync while it runs. Restores
 * the original immediately after, success or throw. Patch installation AND the first
 * syncBuiltinESMExports() call live INSIDE the protected try (astra r2 MUST 1): if that sync
 * call itself throws — e.g. because something else on the process installed a throwing getter
 * on an unrelated fs export — `finally` still runs and still restores the CJS binding, rather
 * than leaking the spy because the throw happened before a try block existed to catch it.
 */
function recordingReads(fn) {
	const calls = [];
	let orig;
	try {
		orig = fsCjs.readFileSync;
		fsCjs.readFileSync = (...args) => {
			calls.push(args[0]);
			return orig.apply(fsCjs, args);
		};
		syncBuiltinESMExports();
		const value = fn();
		return { value, calls };
	} finally {
		fsCjs.readFileSync = orig;
		syncBuiltinESMExports();
	}
}

const tmp = tmpDir(path.join(os.tmpdir(), "nana-fsops-writeifchanged-"));

/* --- a live symlink pointing at a file OUTSIDE the target path: writing must not touch it ---- */
{
	const victim = path.join(tmp, "victim.txt");
	fs.writeFileSync(victim, "the owner's original content\n");
	const link = path.join(tmp, "link.txt");
	fs.symlinkSync(victim, link);

	const { value: r, calls } = recordingReads(() => writeIfChanged(link, "installer-owned content\n"));
	// req: R-379
	check("a live symlink in the way is reported SKIPPED, not written", r.status === SKIPPED, JSON.stringify(r));
	// req: R-379
	check("the symlink's target is byte-identical — nothing was written through it", fs.readFileSync(victim, "utf8") === "the owner's original content\n");
	// req: R-379
	check("no read targets the live symlink or its destination", !calls.some((p) => path.resolve(String(p)) === path.resolve(link) || path.resolve(String(p)) === path.resolve(victim)), JSON.stringify(calls));
	// req: R-379
	check("the live symlink's destination path is unchanged", path.resolve(path.dirname(link), fs.readlinkSync(link)) === path.resolve(victim));
}

/* --- a DANGLING symlink: writing must not materialize the missing target --------------------- */
{
	const missing = path.join(tmp, "nowhere.txt");
	const dangling = path.join(tmp, "dangling.txt");
	fs.symlinkSync(missing, dangling);

	const { value: r, calls } = recordingReads(() => writeIfChanged(dangling, "installer-owned content\n"));
	// req: R-379
	check("a dangling symlink is reported SKIPPED, not written", r.status === SKIPPED, JSON.stringify(r));
	// req: R-379
	check("the dangling link's target was NOT created", !fs.existsSync(missing));
	// req: R-379
	check("no read targets the dangling symlink or its (missing) destination", !calls.some((p) => path.resolve(String(p)) === path.resolve(dangling) || path.resolve(String(p)) === path.resolve(missing)), JSON.stringify(calls));
	// req: R-379
	check("the dangling symlink's destination path is unchanged", path.resolve(path.dirname(dangling), fs.readlinkSync(dangling)) === path.resolve(missing));
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails);
