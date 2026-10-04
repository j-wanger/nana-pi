#!/usr/bin/env node
/**
 * Isolated reproduction of review-ledger.test.mjs block 8's "the tally never rotates" check
 * -- evidence for this lane, NOT a suite test. Run standalone because the mutation under
 * review (force-rotating the tally after every append in complete()) corrupts bookkeeping
 * that OTHER blocks in the full 748-line file depend on (each later block assumes the
 * tally it just read from is still the one it appended to), crashing the harness with a
 * TypeError well before this specific block is reached.
 *
 * FAITHFUL TO THE REAL ASSERTION (astra r1 SHOULD): the real check is
 *   `!fs.existsSync(tallyFile + ".1") && roundsOf("rot").length === 3`
 * -- both conjuncts are reproduced here, not just the `.1`-absence half. Setup (three
 * admit+complete rounds for one item, matching the real block's own shape) is reproduced
 * directly against review-round.mjs's own admit()/complete(), not re-implemented.
 *
 * Run: node docs/reviews/ears-form-2026-10-04/isolated-repro-r721.mjs
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const bin = path.join(ROOT, "packages", "nana-pack", "bin");
const mod = await import(path.join(bin, "review-round.mjs"));

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "tallyrot-probe-")));
const home = path.join(tmp, "home-8");
const agent = path.join(home, ".pi", "agent");
fs.mkdirSync(home, { recursive: true });
const tallyFile = path.join(agent, "review-ledger.rounds.jsonl");

const gitIn = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();
const repo = path.join(tmp, "A");
fs.mkdirSync(repo);
gitIn(repo, "init", "-q");
const shas = [];
for (let i = 0; i < 3; i++) {
	fs.writeFileSync(path.join(repo, "f"), `v${i}`);
	gitIn(repo, "add", "f");
	gitIn(repo, "commit", "-qm", `c${i}`);
	shas.push(gitIn(repo, "rev-parse", "HEAD"));
}

const jsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : []);
const roundsOf = (item) => jsonl(tallyFile).filter((r) => r.item === item);

for (let i = 0; i < 3; i++) {
	gitIn(repo, "checkout", "-q", "--detach", shas[i]);
	const res = mod.admit(["--item", "rot"], { launcher: "test", home, cwd: repo });
	if (!res.ok) { console.log("ADMIT FAILED at round", i + 1, res.message); process.exit(1); }
	const c = mod.complete(res.res, "out.md", { home });
	if (!c.ok) { console.log("COMPLETE FAILED at round", i + 1, c.message); process.exit(1); }
}

// The real check, both conjuncts, verbatim.
const ok = !fs.existsSync(tallyFile + ".1") && roundsOf("rot").length === 3;
console.log(ok ? "PASS" : "FAIL", "the tally never rotates",
	ok ? "" : `(tally.1 exists=${fs.existsSync(tallyFile + ".1")}, roundsOf('rot').length=${roundsOf("rot").length})`);

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
