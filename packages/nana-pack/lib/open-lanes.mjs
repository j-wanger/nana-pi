/**
 * @module packages/nana-pack/lib/open-lanes.mjs
 * @purpose Identify extant unfinished or recently active unlanded lane worktrees.
 * @inputs Project root, clock and injectable read-only git runner; clone build and land ledgers.
 * @outputs Sorted open lane names.
 * @effects disk (ledgers and worktree existence), process (read-only git)
 * @errors Ledger and git failures propagate for the hook's fail-open boundary.
 */
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { buildRecordsPath, readBuildLedger } from "./build-records.mjs";
import { landRecordsPath, readLandLedger } from "./land-records.mjs";
import { pairRecordViews } from "./record-ledger.mjs";
import { OPEN_LANE_AGE_MS, WAKING_GIT_TIMEOUT_MS } from "./waking-config.mjs";

function git(root, args) {
 return spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: WAKING_GIT_TIMEOUT_MS, windowsHide: true });
}

/** Unfinished builds count before main containment; absent worktrees never count. */
export function openLanes({ root, now = Date.now(), runGit = git } = {}) {
 const text = (args) => {
  const result = runGit(root, args);
  if (result.error || result.status !== 0) throw new Error("waking git unavailable");
  return result.stdout;
 };
 const common = resolve(root, text(["rev-parse", "--git-common-dir"]).trim());
 const builds = pairRecordViews(readBuildLedger(buildRecordsPath(common)).records, record => record.build).views;
 const lands = pairRecordViews(readLandLedger(landRecordsPath(common)).records, record => record.attempt).views;
 const trees = [];
 let tree = {};
 for (const field of text(["worktree", "list", "--porcelain", "-z"]).split("\0")) {
  if (!field) { if (tree.worktree) trees.push(tree); tree = {}; continue; }
  const space = field.indexOf(" ");
  if (space > 0) tree[field.slice(0, space)] = field.slice(space + 1);
 }
 const open = [];
 for (const tree of trees) {
  if (!tree.branch?.startsWith("refs/heads/feat/")) continue;
  try { if (!statSync(tree.worktree).isDirectory()) continue; } catch (error) { if (error.code === "ENOENT") continue; throw error; }
  const lane = tree.branch.slice("refs/heads/feat/".length);
  const selectedBuilds = builds.filter(view => view.start.lane === lane && Number.isFinite(Date.parse(view.start.startedAt)));
  const selectedLands = lands.filter(view => view.start.lane === lane && Number.isFinite(Date.parse(view.start.startedAt)));
  if (selectedBuilds.some(view => !view.end)) { open.push(lane); continue; }
  if (selectedLands.some(view => view.end?.outcome === "landed")) continue;
  const newest = Math.max(...[...selectedBuilds, ...selectedLands].flatMap(view => [Date.parse(view.start.startedAt), Date.parse(view.end?.endedAt)]).filter(Number.isFinite));
  if (now - newest >= OPEN_LANE_AGE_MS) continue;
  const contained = runGit(root, ["merge-base", "--is-ancestor", tree.HEAD, "refs/heads/main"]);
  if (contained.error || ![0, 1].includes(contained.status)) throw new Error("waking containment unavailable");
  if (contained.status === 1) open.push(lane);
 }
 return open.sort();
}
