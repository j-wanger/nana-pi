/**
 * @module apps/bench/lib/replay-isolation.mjs
 * @purpose Build historical-only workspaces, filesystem profiles and filtered environments and detect live machine owners.
 * @inputs Explicit repository tip, run paths, allowed runtime paths, ledger and suite-lock locations.
 * @outputs One-commit clones, Seatbelt text, child environment and busy decisions.
 * @effects disk (run folder), process (bounded git, tar and pid queries)
 * @errors Unsupported platforms and failed start-tree preparation refuse launch.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readBuildLedger } from "../../../packages/nana-pack/lib/build-records.mjs";
import { pidAlive } from "../../../packages/nana-pack/lib/process-tree.mjs";
import { DEFAULT_LOCK_DIR } from "../../../scripts/test-locked.mjs";
import { killTree } from "../../../scripts/runtime-measure.mjs";
import { GIT_MS, SYSTEM_READ_PATHS, SYSTEM_WRITE_PATHS } from "./replay-config.mjs";

export { DEFAULT_LOCK_DIR } from "../../../scripts/test-locked.mjs";
export function requireBackend(platform = process.platform) { if (platform !== "darwin") throw new Error("replay: no isolation backend"); }
const real = p => { const resolved = path.resolve(p); try { return fs.realpathSync(resolved); } catch { const parent = path.dirname(resolved); return parent === resolved ? resolved : path.join(real(parent), path.basename(resolved)); } };
const quote = p => JSON.stringify(real(p));
export function sandboxProfile({ runDir, readPaths = [], suiteLock = DEFAULT_LOCK_DIR }) {
 const read = [...new Set([...SYSTEM_READ_PATHS, runDir, suiteLock, ...readPaths].map(real))];
 // Match only quarantine siblings and their contents, not the shared lock parent.
 const staleLock = `^${real(suiteLock).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\.stale-[^/]+(/.*)?$`;
 return `(version 1)\n(deny default)\n(allow process* signal sysctl-read mach-lookup ipc-posix* network* file-read-metadata)\n(allow file-read* (literal "/"))\n${read.map(p => `(allow file-read* (subpath ${quote(p)}))`).join("\n")}\n${[runDir, suiteLock, ...SYSTEM_WRITE_PATHS].map(p => `(allow file-write* (subpath ${quote(p)}))`).join("\n")}\n(allow file-write* (regex ${JSON.stringify(staleLock)}))\n`;
}
/** Nothing ambient reaches the child, including git credentials and provider/shell hooks. */
export function replayEnv({ home, temp, agentDir, suiteLock = DEFAULT_LOCK_DIR, bin, parent = process.env }) {
 return { HOME: home, USERPROFILE: home, TMPDIR: temp, TMP: temp, TEMP: temp, PATH: bin ?? "/usr/bin:/bin:/usr/sbin:/sbin", LANG: "en_US.UTF-8", TERM: "dumb", PI_CODING_AGENT_DIR: agentDir, PI_CODING_AGENT_SESSION_DIR: path.join(home, "sessions"), PI_SKIP_VERSION_CHECK: "1", PI_OFFLINE: "1", PI_TELEMETRY: "0", NANA_ROLE: "worker", NANA_HANDOFF: "off", NANA_SUITE_LOCK_DIR: suiteLock, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(home, "gitconfig"), ...(parent.SystemRoot ? { SystemRoot: parent.SystemRoot } : {}) };
}
function checked(command, args, options) {
 const r = spawnSync(command, args, { ...options, encoding: "utf8", timeout: GIT_MS, windowsHide: true });
 if (r.status !== 0 || r.error) throw new Error("replay: start tree failed");
 return r.stdout;
}
/** Git archive never copies the source object database, index, remotes, hooks or later commits. */
export async function createStartTree(repo, tip, clone, { branch, lane = "replay" } = {}) {
 if (!/^[a-f0-9]{40,64}$/u.test(tip ?? "")) throw new Error("replay: invalid start tip");
 fs.mkdirSync(clone, { recursive: true, mode: 0o700 });
 const run = path.dirname(clone), archive = path.join(run, "start.tar"), config = path.join(run, "gitconfig");
 fs.writeFileSync(config, "", { mode: 0o600 });
 const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: config };
 checked("git", ["archive", "--format=tar", `--output=${archive}`, tip], { cwd: repo, env });
 checked("tar", ["-xf", archive, "-C", clone], { cwd: run, env }); fs.unlinkSync(archive);
 const git = args => checked("git", args, { cwd: clone, env });
 git(["init", "-q", "-b", branch || `feat/${lane}`]); git(["config", "core.hooksPath", path.join(run, "no-hooks")]); git(["add", "--all"]);
 git(["-c", "user.name=Replay", "-c", "user.email=replay@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "historical replay start"]);
 if ((branch || `feat/${lane}`) !== "main") git(["branch", "main"]);
 return clone;
}
/** Reuse the suite's descendant walk without signalling; never copy its private tree parser. */
export const snapshotTargets = pid => pid ? killTree(pid, { kill: () => {} }) : { pids: [], groups: [] };
function replayHolder(holder, replayPids) {
 if (replayPids.includes(holder)) return true;
 const group = Number(spawnSync("ps", ["-o", "pgid=", "-p", String(holder)], { encoding: "utf8", timeout: GIT_MS }).stdout?.trim());
 return replayPids.some(pid => { const targets = snapshotTargets(pid); return targets.pids.includes(holder) || targets.groups.includes(group); });
}
export function machineBusy({ ledger, suiteLock = DEFAULT_LOCK_DIR, replayPids = [] } = {}) {
 if (ledger && fs.existsSync(ledger)) {
  const records = readBuildLedger(ledger).records, ended = new Set(records.filter(r => r.kind === "end").map(r => r.build));
  if (records.some(r => r.kind === "start" && !ended.has(r.build) && (!Number.isInteger(r.pid) || pidAlive(r.pid)))) return true;
 }
 try {
  const holder = Number(fs.readFileSync(path.join(suiteLock, "pid"), "utf8").trim());
  if (pidAlive(holder) && !replayHolder(holder, replayPids)) return true;
 } catch (error) { if (error.code !== "ENOENT") return true; }
 return false;
}
