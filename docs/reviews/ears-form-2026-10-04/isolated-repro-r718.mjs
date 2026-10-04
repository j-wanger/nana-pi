#!/usr/bin/env node
/**
 * Isolated reproduction of review-ledger.test.mjs block 7's "complete(B) recorded; the item
 * has 3 rounds, never 4" check, against a MUTATED TEMP COPY of review-round.mjs (mine forced
 * to `false`) -- evidence for this lane, NOT a suite test. Run standalone because forcing
 * `mine=false` breaks every legitimate completion throughout the full 748-line file (nearly
 * every block relies on at least one successful completion somewhere), too destructive to
 * run as a full-suite mutation; this isolates just the one fact (R-718: "a completion shall
 * own a live reservation") the mutation is meant to pin.
 *
 * Set BASELINE=1 to run the same script against the unmutated source (confirms PASS).
 *
 * Run: node docs/reviews/ears-form-2026-10-04/isolated-repro-r718.mjs
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const bin = path.join(ROOT, "packages", "nana-pack", "bin");
const src = fs.readFileSync(path.join(bin, "review-round.mjs"), "utf8");
const needle = "const mine = st && held && held.id === r.id && held.pid === r.pid && sameItem(held, r) && held.revision === r.revision;";
if (!src.includes(needle)) { console.log("FAIL: needle not found, source drifted"); process.exit(1); }
const mutated = process.env.BASELINE === "1" ? src : src.replace(needle, "const mine = false;");
// Write the (possibly mutated) copy INTO bin/ under a temp name so its relative
// `./review-shape.mjs` import resolves naturally; removed in the finally block below.
const tmpPath = path.join(bin, `review-round-mutated-${Date.now()}.mjs`);
fs.writeFileSync(tmpPath, mutated);

let exitCode = 1;
try {
	const mod = await import(tmpPath);

	const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "r718-probe-")));
	const home = path.join(tmp, "home-7");
	fs.mkdirSync(home, { recursive: true });
	const gitIn = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();
	const repo = path.join(tmp, "A");
	fs.mkdirSync(repo);
	gitIn(repo, "init", "-q");
	const shas = [];
	for (let i = 0; i < 2; i++) {
		fs.writeFileSync(path.join(repo, "f"), `v${i}`);
		gitIn(repo, "add", "f");
		gitIn(repo, "commit", "-qm", `c${i}`);
		shas.push(gitIn(repo, "rev-parse", "HEAD"));
	}

	// A single live, matching reservation (the real test's "B") admitted and then completed.
	gitIn(repo, "checkout", "-q", "--detach", shas[1]);
	const b = mod.admit(["--item", "exp"], { launcher: "test", home, cwd: repo });
	const cb = mod.complete(b.res, "b.md", { home });

	// The real check's directly relevant half: a live, matching reservation's completion must
	// be recorded (cb.ok). The real check's "never 4" / "===3" half is particular to the real
	// test's own prior two genuine rounds for the same item and is not reproduced here.
	const ok = cb.ok === true;
	console.log(ok ? "PASS" : "FAIL", "complete(B) recorded; the item has 3 rounds, never 4",
		ok ? "" : `(cb=${JSON.stringify(cb)})`);
	fs.rmSync(tmp, { recursive: true, force: true });
	exitCode = ok ? 0 : 1;
} finally {
	fs.rmSync(tmpPath, { force: true });
}
process.exit(exitCode);
