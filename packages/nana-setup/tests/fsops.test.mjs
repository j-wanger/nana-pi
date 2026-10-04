/**
 * @module packages/nana-setup/tests/fsops.test.mjs
 * @purpose Pins writeIfChanged's non-destructive contract: a symlink (live or dangling) in the way is left untouched and reported SKIPPED, never read or written through
 * @inputs lib/fsops.mjs writeIfChanged, and throwaway scratch directories with real symlinks
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway scratch dir, files and symlinks, removed on exit)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: fsops.mjs's own module header says "@errors none typed ... a symlink or directory in
// the way is returned as SKIPPED and never written through" (line 15) — the invariant linkFile
// and seedFile already hold. writeIfChanged read straight through a symlink with
// fs.readFileSync and wrote straight through it with fs.writeFileSync: it could overwrite a
// symlink's target, or materialize a dangling link's target, contrary to that contract
// (pi-1.0-2026-10-04 review claim).
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { writeIfChanged, SKIPPED, UNCHANGED, CREATED, UPDATED } = await import(new URL("../lib/fsops.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nana-fsops-writeifchanged-"));

/* --- a live symlink pointing at a file OUTSIDE the target path: writing must not touch it ---- */
{
	const victim = path.join(tmp, "victim.txt");
	fs.writeFileSync(victim, "the owner's original content\n");
	const link = path.join(tmp, "link.txt");
	fs.symlinkSync(victim, link);

	const r = writeIfChanged(link, "installer-owned content\n");
	// req: R-379
	check("a live symlink in the way is reported SKIPPED, not written", r.status === SKIPPED, JSON.stringify(r));
	// req: R-379
	check("the symlink's target is byte-identical — nothing was written through it", fs.readFileSync(victim, "utf8") === "the owner's original content\n");
	check("the link itself is still a symlink", fs.lstatSync(link).isSymbolicLink());
}

/* --- a DANGLING symlink: writing must not materialize the missing target --------------------- */
{
	const missing = path.join(tmp, "nowhere.txt");
	const dangling = path.join(tmp, "dangling.txt");
	fs.symlinkSync(missing, dangling);

	const r = writeIfChanged(dangling, "installer-owned content\n");
	// req: R-379
	check("a dangling symlink is reported SKIPPED, not written", r.status === SKIPPED, JSON.stringify(r));
	// req: R-379
	check("the dangling link's target was NOT created", !fs.existsSync(missing));
	check("the link is still dangling (still a symlink)", fs.lstatSync(dangling).isSymbolicLink());
}

/* --- the ordinary cases still work (regression) ----------------------------------------------- */
{
	const plain = path.join(tmp, "plain.txt");
	const r1 = writeIfChanged(plain, "v1\n");
	check("absent -> CREATED", r1.status === CREATED);
	const r2 = writeIfChanged(plain, "v1\n");
	check("same content -> UNCHANGED", r2.status === UNCHANGED);
	const r3 = writeIfChanged(plain, "v2\n");
	check("changed content -> UPDATED", r3.status === UPDATED);
	check("content actually updated", fs.readFileSync(plain, "utf8") === "v2\n");
}

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails);
