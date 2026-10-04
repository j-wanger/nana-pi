#!/usr/bin/env node
/**
 * Isolated, byte-faithful reproduction of review-ledger.test.mjs's block 19 (toctou), lines
 * 613-634 -- evidence for this lane, NOT a suite test. Run standalone because the R-852
 * mutation under review (forcing withLock's `stale` check to `true` unconditionally, so a
 * lock is taken over even from a LIVE holder) makes the child steal-and-release the lock
 * before the real test's own `fs.unlinkSync(lockFile)` (its line 630) runs, which then
 * throws ENOENT and crashes the harness one check before this one (line 634) would print.
 *
 * ADAPTATION DISCLOSED (astra r1 SHOULD): setup (repo, admit, writing the live-pid lock
 * file, spawning the child, the 1.5s wait, the `blocked` boolean) and the check() call are
 * copied verbatim from the real file. The only change is that this script's own cleanup
 * (the equivalent of the real file's lines 629-630) wraps `fs.unlinkSync(lockFile)` in a
 * try/catch so THIS script can still print the check's result when the mutation has
 * already removed the lock file; the real file does not have or need that guard, because
 * under correct code the lock is never stolen and the file is always still there.
 *
 * Run: node docs/reviews/ears-form-2026-10-04/isolated-repro-r837.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const bin = path.join(ROOT, "packages", "nana-pack", "bin");
const mod = await import(path.join(bin, "review-round.mjs"));

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "toctou-iso-")));
const home = path.join(tmp, "home-19");
const agent = path.join(home, ".pi", "agent");
fs.mkdirSync(home, { recursive: true });
const gitIn = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();

// repo("L", 1)
const Ld = path.join(tmp, "L");
fs.mkdirSync(Ld);
gitIn(Ld, "init", "-q");
fs.writeFileSync(path.join(Ld, "f"), "L0");
gitIn(Ld, "add", "f");
gitIn(Ld, "commit", "-qm", "c0");
const Lsha0 = gitIn(Ld, "rev-parse", "HEAD");

const outs = path.join(tmp, "outs");
fs.mkdirSync(outs);

const res = mod.admit(["--item", "toctou", "--out", path.join(outs, "toctou.md")], { launcher: "test", home, cwd: Ld });
console.log("toctou: admitted at the clean HEAD", res.ok && res.res.revision === Lsha0);

const lockFile = path.join(agent, "review-ledger.lock");
fs.writeFileSync(lockFile, String(process.pid)); // a LIVE holder: the child must wait, never take it over
const script = `const m = await import(${JSON.stringify(path.join(bin, "review-round.mjs"))});` +
	`const c = m.complete(${JSON.stringify(res.res)}, "toctou.md", { home: ${JSON.stringify(home)} });` +
	`process.stdout.write(JSON.stringify(c));`;
let cout = "";
const env = { ...process.env, HOME: home, USERPROFILE: home };
const kid = spawn(process.execPath, ["--input-type=module", "-e", script], { env, stdio: ["ignore", "pipe", "inherit"] });
kid.stdout.on("data", (c) => (cout += c));
const exited = new Promise((r) => kid.on("close", r));
await new Promise((r) => setTimeout(r, 1500)); // the child is now blocked on the lock (pre-fix it had already derived)
const blocked = kid.exitCode === null;

// The real test's next two lines (629-630) run here verbatim; only the unlink is guarded
// (ADAPTATION, disclosed above) so this script can still report the result under the mutation.
fs.writeFileSync(path.join(Ld, "f"), "edited while completion waits on the lock");
let unlinkThrew = null;
try { fs.unlinkSync(lockFile); } catch (e) { unlinkThrew = e.code; }

await exited;
const ok = blocked;
console.log(ok ? "PASS" : "FAIL", "toctou: the completion was blocked on the lock when the tree was edited", ok ? "" : `(blocked=${blocked}; the real test's own fs.unlinkSync(lockFile) at its line 630 would throw ${unlinkThrew ?? "nothing"} here, crashing the harness before this check ever printed)`);

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
