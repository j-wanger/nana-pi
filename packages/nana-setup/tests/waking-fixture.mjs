/**
 * @module packages/nana-setup/tests/waking-fixture.mjs
 * @purpose Provide isolated repositories and stdin invocations for waking hook tests.
 * @inputs Hook payloads and record line endings.
 * @outputs Temporary repository paths and bounded child results.
 * @effects disk (temporary fixtures), process (git and hook children)
 * @errors Throws on git failure.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

/** Await each case under its own limit and emit the suite runner's PASS grammar. */
export async function test(title, { timeout }, run) {
 let timer;
 try {
  await Promise.race([
   Promise.resolve().then(run),
   new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case timeout")), timeout); }),
  ]);
  console.log(`PASS ${title}`);
 } finally { clearTimeout(timer); }
}

export const hook = fileURLToPath(new URL("../claude/hooks/nana-waking.mjs", import.meta.url));
export function fixture(ending = "\n") {
 const root = tmpDir(join(tmpdir(), "nana-waking-"));
 for (const args of [["init", "-b", "main"], ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-m", "fixture"], ["checkout", "-b", "feat/wake-test"]]) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: 10000 });
  if (r.status !== 0) throw new Error(r.stderr);
 }
 mkdirSync(join(root, ".git", "nana"));
 writeFileSync(join(root, ".git", "nana", "build-records.jsonl"), `bad partial${ending || "\n"}${JSON.stringify({ v: 1, kind: "start", build: "b", lane: "wake-test", cwd: root, startedAt: new Date().toISOString() })}${ending}`);
 return root;
}
export function invoke(root, payload) {
 return spawnSync(process.execPath, [hook], { cwd: root, encoding: "utf8", timeout: 10000, input: JSON.stringify(payload), env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, CLAUDE_PROJECT_DIR: root } });
}
