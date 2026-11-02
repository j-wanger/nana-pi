/**
 * @module packages/nana-pack/tests/review-ledger-fixture.mjs
 * @purpose Shared setup of the review-ledger test files: the stub pi, the temp home, repos A and B, and the launchers
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME
 * @outputs the helpers each review-ledger test file imports, and finish() that removes the temp folder and exits with the failure count
 * @effects disk (temp HOME, git repositories), process (git; the stub pi is written once per importing file)
 * @errors a failed check prints FAIL and counts; finish() exits with the count
 */
// Gate: the per-item review ledger (T2b + fix round after sol r1), executed through REAL processes
// — pi-review / pi-worker with a stub `pi` on PATH, and review-ledger run/check — against real git
// repositories and worktrees, under a temp HOME. Each sol r1 bypass is pinned as a refusal here.
// Run: node packages/nana-pack/tests/review-ledger.test.mjs (and its -launch, -verdicts and -state siblings)
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
export const PI_REVIEW = path.join(bin, "pi-review.mjs");
export const PI_WORKER = path.join(bin, "pi-worker.mjs");
export const LEDGER_CLI = path.join(bin, "review-ledger.mjs");
export const mod = await import(pathToFileURL(path.join(bin, "review-round.mjs")).href);
export const tmp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "review-ledger-test-")));
export const stubs = path.join(tmp, "stubs");
export const outs = path.join(tmp, "outs");
for (const d of [stubs, outs]) fs.mkdirSync(d, { recursive: true });
// the stub `pi`: STUB=verdict prints a verdict; fail = infra failure; stall = 0-CPU hang;
// plain = an ordinary worker reply with NO review token, counting its invocations in $COUNT.
// win32 has no sh and no findPi match for an extensionless script (R-1125): lay out the npm
// shape piLaunch expects instead, through the shared helper, with a Node port of the same
// modes. `sleeper` and `ignorer` (section 7, process-group signals) stay POSIX-only — that
// section is already gated off on win32 below — so the port carries every other mode.
if (process.platform === "win32") {
	writeFakePi(stubs, `const fs = require("node:fs");
if (process.env.INVOKED) fs.appendFileSync(process.env.INVOKED, "invoked\\n");
switch (process.env.STUB) {
  case "fail": console.log("503 upstream"); process.exit(1); break;
  case "stall": setTimeout(() => {}, 30000); break;
  case "plain": if (process.env.COUNT) fs.appendFileSync(process.env.COUNT, "run\\n"); console.log("Implemented the change; edited src/a.ts."); break;
  case "plain-review": process.stdout.write(process.env.STUB_TEXT ?? ""); break;
  default: console.log("VERDICT: LAND");
}
`);
} else {
	fs.writeFileSync(path.join(stubs, "pi"),
		'#!/bin/sh\n[ -z "$INVOKED" ] || echo invoked >> "$INVOKED"\ncase "$STUB" in fail) echo "503 upstream" ; exit 1;; stall) exec sleep 30;; sleeper) echo $$ > "$CHILD_PID"; exec sleep 30;; ignorer) trap "" INT TERM HUP; sleep 30 & echo $! > "$CHILD_PID"; wait;; plain) echo run >> "$COUNT"; echo "Implemented the change; edited src/a.ts.";; plain-review) printf "%s" "$STUB_TEXT";; *) echo "VERDICT: LAND";; esac\n');
	fs.chmodSync(path.join(stubs, "pi"), 0o755);
}

export let home, agent, tallyFile, auditFile, resDir;
export const freshHome = (name) => {
	home = path.join(tmp, "home-" + name);
	agent = path.join(home, ".pi", "agent");
	tallyFile = path.join(agent, "review-ledger.rounds.jsonl");
	auditFile = path.join(agent, "review-ledger.jsonl");
	resDir = path.join(agent, "review-ledger.reservations");
	fs.mkdirSync(home, { recursive: true });
};
export const env = (extra = {}) => ({ ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, '.pi/agent'), PATH: `${stubs}${path.delimiter}${process.env.PATH}`, ...extra });
// Printed in the detail of a check the plan names as blocked, until W7c's product fix, by the
// repo-key/--out short-vs-long split (R-705/R-724): the same path through JS realpathSync (which
// on a Windows CI runner keeps the short RUNNER~1 TEMP, kept on purpose here) against its native
// real path (the long form git itself reports) — WR1's "short and long paths it compared".
export const pathForms = (p) => {
	let short = p, long = p;
	try { short = fs.realpathSync(p); } catch { /* keep the raw path */ }
	try { long = fs.realpathSync.native(p).replace(/^\\\\\?\\/, ""); } catch { /* keep the raw path */ }
	return `short=${short} long=${long}`;
};
export const jsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : []);
export const roundsOf = (item) => [...new Map(jsonl(tallyFile).filter((r) => r.item === item).map((r) => [r.revision, r])).values()];
export const verdictsOf = (item) => jsonl(auditFile).filter((r) => r.kind === "verdict" && r.item === item);
export const storedTextFile = (homeDir, hash) => {
	const store = mod.ledgerPaths(homeDir).texts;
	return store && hash ? path.join(store, `${hash}.md`) : null;
};

let fails = 0;
export const check = (n, ok, info = "") => {
	if (typeof ok === "function") {
		ok = false;
		info = "check takes a boolean, got a function";
	}
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : info);
	if (!ok) fails++;
};

// a git repository with n commits; at(i) detaches HEAD at commit i
export const gitIn = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" }).stdout.trim();
export function repo(name, n = 6) {
	const d = path.join(tmp, name);
	fs.mkdirSync(d);
	gitIn(d, "init", "-q");
	const shas = [];
	for (let i = 0; i < n; i++) {
		fs.writeFileSync(path.join(d, "f"), `${name}${i}`);
		gitIn(d, "add", "f");
		gitIn(d, "commit", "-qm", `c${i}`);
		shas.push(gitIn(d, "rev-parse", "HEAD"));
	}
	return { d, shas, at: (i, cwd = d) => gitIn(cwd, "checkout", "-q", "--detach", shas[i]) };
}
export const A = repo("A"), B = repo("B");
export const plain = path.join(tmp, "plain"); // NOT a git repo: --revision is the fallback there
fs.mkdirSync(plain);

let n = 0;
export const out = () => path.join(outs, `o${++n}.md`);
export const piReview = (args, { stub = "verdict", cwd = A.d, extra = "", extraEnv = {} } = {}) =>
	spawnSync(process.execPath, [PI_REVIEW, "--poll", "1", "--stall-secs", "1", "--retries", "0", ...args, "--", "-p", "x"],
		{ cwd, env: env({ STUB: stub, STUB_TEXT: extra, ...extraEnv }), encoding: "utf8", timeout: 30000 });
export const VERDICT_CMD = [process.execPath, "-e", "console.log('VERDICT: LAND')"];
export const ledgerRun = (args, { cwd = A.d, cmd = VERDICT_CMD, extraEnv = {}, outFile = out() } = {}) =>
	spawnSync(process.execPath, [LEDGER_CLI, "run", ...args, "--out", outFile, "--", ...cmd], { cwd, env: env(extraEnv), encoding: "utf8", timeout: 30000 });
export const ledgerCheck = (args, cwd = A.d) => spawnSync(process.execPath, [LEDGER_CLI, "check", ...args], { cwd, env: env(), encoding: "utf8" });
export const ledgerKeep = (args, cwd = A.d) => spawnSync(process.execPath, [LEDGER_CLI, "keep", ...args], { cwd, env: env(), encoding: "utf8" });
export const noStack = (r) => !/\n\s+at .+:\d+:\d+/.test(r.stderr);
export const reviewAt = (item, i, extra = [], r = A) => { r.at(i); return ledgerRun(["--item", item, ...extra], { cwd: r.d }); };


export function finish() {
	fs.rmSync(tmp, { recursive: true, force: true });
	process.exit(fails);
}
