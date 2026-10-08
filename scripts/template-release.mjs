/**
 * @module scripts/template-release.mjs
 * @purpose Gate a contained template commit before creating or pushing its next annotated version tag.
 * @inputs CLI ref and push option, injectable Git runner, and injectable acceptance gate.
 * @outputs Release status and a process exit code.
 * @effects process (Git and acceptance children), disk (annotated Git tag).
 * @errors Git, containment, gate, tag, or push failures return status 1.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { RELEASE_BRANCH_REF, RELEASE_REMOTE_REF, RELEASE_SURFACE, RELEASE_TAG_PATTERN, selectReleaseTag } from "../packages/nana-pack/lib/release-status.mjs";

const defaultGit = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8" });
const defaultGate = (cwd, sha) => spawnSync(process.execPath, [path.join(cwd, "scripts/template-acceptance.mjs"), "--src", cwd, "--ref", sha], { cwd, encoding: "utf8", stdio: "inherit" }).status;
function call(runGit, repo, args) {
  try { const result = runGit(repo, args); return { ok: result?.status === 0 && !result?.error, out: String(result?.stdout ?? "").trim(), error: result?.stderr || result?.error?.message || "git failed" }; }
  catch (error) { return { ok: false, out: "", error: error?.message ?? "git failed" }; }
}
function cli(argv) {
  let ref = "HEAD", push = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ref" && argv[i + 1]) ref = argv[++i];
    else if (argv[i] === "--push") push = true;
    else throw new Error("usage: template-release.mjs [--ref <rev>] [--push]");
  }
  return { ref, push };
}
export function runRelease({ repo, ref = "HEAD", push = false, runGit = defaultGit, gate = defaultGate, log = console.log }) {
  const resolved = call(runGit, repo, ["rev-parse", "--verify", `${ref}^{commit}`]);
  if (!resolved.ok || !/^[0-9a-f]{40}$/i.test(resolved.out)) { log(`release failed: cannot resolve commit (${resolved.error})`); return 1; }
  const sha = resolved.out;
  const contained = call(runGit, repo, ["merge-base", "--is-ancestor", sha, RELEASE_REMOTE_REF]);
  if (!contained.ok) { log("release refused: commit is not contained in origin/main"); return 1; }
  const tagsAtCommit = call(runGit, repo, ["tag", "--points-at", sha]);
  if (!tagsAtCommit.ok) { log(`release failed: ${tagsAtCommit.error}`); return 1; }
  if (tagsAtCommit.out.split(/\r?\n/).some((tag) => RELEASE_TAG_PATTERN.test(tag))) return 0;
  const tags = call(runGit, repo, ["for-each-ref", "--sort=-v:refname", "--format=%(refname:short)", "refs/tags/v*"]);
  if (!tags.ok) { log(`release failed: ${tags.error}`); return 1; }
  const latest = selectReleaseTag(tags.out.split(/\r?\n/).filter(Boolean));
  if (!latest) { log("release failed: no plain version tag exists"); return 1; }
  const count = call(runGit, repo, ["rev-list", "--count", `${latest}..${sha}`, "--", ...RELEASE_SURFACE]);
  if (!count.ok || !/^\d+$/.test(count.out)) { log("release failed: template commit count unavailable"); return 1; }
  if (Number(count.out) === 0) { log("nothing to release"); return 0; }
  const accepted = gate(repo, sha);
  if (accepted !== 0) { log("release failed: template acceptance gate failed"); return 1; }
  const [major, minor, patch] = latest.slice(1).split(".").map(Number);
  const next = `v${major}.${minor}.${patch + 1}`;
  const tagged = call(runGit, repo, ["tag", "-a", next, sha, "-m", `Release templates ${next}`]);
  if (!tagged.ok) { log(`release failed: could not create ${next} (${tagged.error})`); return 1; }
  if (push) {
    const pushed = call(runGit, repo, ["push", "origin", `refs/tags/${next}`]);
    if (!pushed.ok) { log(`release failed: could not push ${next} (${pushed.error})`); return 1; }
  }
  log(`released ${next} at ${sha}`); return 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try { process.exitCode = runRelease({ repo: process.cwd(), ...cli(process.argv.slice(2)) }); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
}
