#!/usr/bin/env node
/**
 * Isolated, byte-faithful reproduction of review-ledger.test.mjs block 10's "lock path is a
 * directory" case (lines ~336-342) -- evidence for this lane, NOT a suite test. Run standalone
 * only because the full 748-line file takes an extra ~31s for this one case (correct, not a
 * hang -- see below) and the full file is otherwise slow to iterate on.
 *
 * NO ADDED TIMEOUT (astra r1 SHOULD, correcting this worker's earlier claim): the cited
 * call already runs under `spawnSync(..., { timeout: 30000 })`, exactly as `ledgerRun()`
 * does in the real file. Under the mutation (removing withLock's `if (!st.isFile()) throw`
 * for a lock-path directory), the retry loop never reaches its own internal deadline check
 * (`readFileSync` on a directory throws EISDIR, caught by `catch { continue; }`, which loops
 * back to `openSync` before the loop's own `Date.now() > deadline` test), so it is spawnSync's
 * OWN 30000ms timeout that eventually kills the child -- the real test fails correctly after
 * ~31s (confirmed against the real file), it does not hang forever as this worker first
 * claimed.
 *
 * Run: node docs/reviews/ears-form-2026-10-04/isolated-repro-r723.mjs
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const bin = path.join(ROOT, "packages", "nana-pack", "bin");
const LEDGER_CLI = path.join(bin, "review-ledger.mjs");

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lockdir-repro-")));
const home = path.join(tmp, "home-10-lockdir");
const agent = path.join(home, ".pi", "agent");
fs.mkdirSync(agent, { recursive: true });
fs.mkdirSync(path.join(agent, "review-ledger.lock"), { recursive: true });

const gitIn = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();
const repo = path.join(tmp, "A");
fs.mkdirSync(repo);
gitIn(repo, "init", "-q");
fs.writeFileSync(path.join(repo, "f"), "x");
gitIn(repo, "add", "f");
gitIn(repo, "commit", "-qm", "c0");

const outs = path.join(tmp, "outs");
fs.mkdirSync(outs);
const VERDICT_CMD = [process.execPath, "-e", "console.log('VERDICT: LAND')"];
const env = { ...process.env, HOME: home, USERPROFILE: home };

const t0 = Date.now();
// Exactly ledgerRun(["--item", "ld"], { cwd: repo }) from the real file, same timeout.
const ld = spawnSync(process.execPath, [LEDGER_CLI, "run", "--item", "ld", "--out", path.join(outs, "o.md"), "--", ...VERDICT_CMD],
	{ cwd: repo, env, encoding: "utf8", timeout: 30000 });
const noStack = (r) => !/\n\s+at .+:\d+:\d+/.test(r.stderr ?? "");

// The real check, verbatim.
const ok = ld.status === 1 && /lock path .* is not a regular file/.test(ld.stderr) && Date.now() - t0 < 3000 && noStack(ld);
console.log(ok ? "PASS" : "FAIL", "lock path is a directory: refused at once (<3s) with a message, no stack",
	ok ? "" : `(elapsed=${Date.now() - t0}ms, status=${ld.status}, signal=${ld.signal}, stderr=${JSON.stringify((ld.stderr ?? "").slice(0, 200))})`);

fs.rmSync(tmp, { recursive: true, force: true });
process.exit(ok ? 0 : 1);
