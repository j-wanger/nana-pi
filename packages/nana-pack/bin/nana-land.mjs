#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-land.mjs
 * @purpose Land reviewed tips or their eligible clean merge with current main by fast-forward, and safely remove contained lane worktrees.
 * @inputs Merge or cleanup arguments, review storage, and injectable git, command, gh, clock, lock, release-status, and CI-record readers.
 * @outputs Named helpers and command results naming reviews, CI runs, retained records, slow files, release status, and the land-record attempt.
 * @effects process (runs git, gh, and a suite command), network (through gh), disk (git merge, land/CI record storage, and worktree cleanup).
 * @errors Invalid arguments, missing review evidence, failed preconditions, unreadable or red CI, suite failures, and git failures return a named refusal.
 */
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { realpathSync, readFileSync, lstatSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalItem, reviewTextEvidence, withReviewLedgerLock, repoKeyOf } from "./review-round.mjs";
import { releaseStatus } from "../lib/release-status.mjs";
import { realPath } from "../lib/real-path.mjs";
import { changedSuitePaths, ciScope, githubRepoOf, judgeRuns, proveCiSuite } from "../lib/land-ci.mjs";
import { ciReadiness, ciTarget, ciRunJobs, classifyRun } from "../lib/ci-wait.mjs";
import { budgetedGh, keepLandCiRecords } from "../lib/land-ci-records.mjs";
import { readCiRecords } from "../lib/ci-records.mjs";
import { CHILD_OUTPUT_MAX_BYTES, CI_HOST, CI_READ_TIMEOUT_MS, CI_RECORDS_BUDGET_MS, CI_RUN_LIST_RETRIES, SUITE_LINE_PREFIX, CI_REMOTE, CI_RUNS_PAGE_SIZE, CI_RUNS_PATH, CI_WORKFLOW_DIR, CI_ADVISORY_WORKFLOW, CI_DONE_STATUS, CI_PASS_CONCLUSION, TIP_DIGITS, LAND_NOTE_PREFIX, LAND_TIP_ENV } from "../lib/land-config.mjs";
import { CLEAN_MERGE_MESSAGE, CLEAN_MERGE_PREFIX, CLEAN_MERGE_NAME_CAP, CLEAN_MERGE_GENERATED_PATHS, CLEAN_MERGE_GIT_CONFIG, CLEAN_MERGE_REMEDY, CLEAN_MERGE_REASONS } from "../lib/land-config.mjs";
import { GENERATOR_CONTRACT, GENERATOR_TIMEOUT_MS, GENERATOR_REASONS } from "../lib/land-config.mjs";
import { CI_RECORDS_KEEP, CI_SLOW_SHARE } from "../lib/suite-records-config.mjs";
import { appendLandRecord, landCiWaitMs, landRecordsPath, readLandLedger, renderLandLaneLine, renderLandRecordLine } from "../lib/land-records.mjs";
import { LAND_LEDGER_READ_MAX_BYTES, LAND_REASON_MAX_CHARS, LAND_RECORD_LINE_PREFIX, LAND_RECORD_SCHEMA } from "../lib/land-records-config.mjs";
import { errorText } from "../lib/record-ledger.mjs";
import { ghDefault, ghEnvironment } from "../lib/gh-runner.mjs";
export { ghDefault, ghEnvironment } from "../lib/gh-runner.mjs";

import { LANE_NAME_PATTERN } from '../lib/land-config.mjs';
import { startMemory } from '../lib/memory-run.mjs';
import { WORDS as MEMORY_WORDS } from '../lib/memory-run-config.mjs';
const gitDefault = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: CHILD_OUTPUT_MAX_BYTES });
const commandDefault = (command, cwd, { env = process.env } = {}) => spawnSync(command, { cwd, env, shell: true, encoding: "utf8", maxBuffer: CHILD_OUTPUT_MAX_BYTES });
const resultText = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}`;
const landNotes = (result) => [result.stdout ?? "", result.stderr ?? ""]
	.flatMap((text) => text.split(/\r?\n/))
	.filter((line) => line.startsWith(LAND_NOTE_PREFIX));
const git = (runner, cwd, ...args) => {
	const r = runner(cwd, args);
	if (r.error || r.status !== 0) throw new Error(`git ${args.join(" ")} failed in ${cwd} (exit ${r.status ?? r.signal ?? "unknown"}): ${(r.stderr ?? r.error?.message ?? "").trim()}`);
	return (r.stdout ?? "").trim();
};
const assertCleanTracked = (runner, cwd, label) => {
	const r = runner(cwd, ["diff", "--quiet", "HEAD", "--"]);
	if (r.error || r.status !== 0) throw new Error(`${label} has tracked changes (git diff exit ${r.status ?? r.signal ?? "unknown"})`);
};
const isAncestor = (runner, ancestor, descendent, cwd) => {
	const r = runner(cwd, ["merge-base", "--is-ancestor", ancestor, descendent]);
	if (r.error || ![0, 1].includes(r.status)) throw new Error(`git ancestor check failed: ${r.error?.message ?? r.signal ?? r.status ?? "unknown"}`);
	return r.status === 0;
};

const mergeRefusal = (reason, detail) => new Error(`${CLEAN_MERGE_REASONS[reason] ?? GENERATOR_REASONS[reason]}${detail ? `: ${detail}` : ""}; ${CLEAN_MERGE_REMEDY}`);
const objectId = (value) => /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);

/** Guard generator configuration without loading or executing merged code. */
function guardGeneratorConfiguration(folder) {
 const inside = file => {
  if (typeof file !== "string" || !file) throw new Error("invalid source root");
  let resolved = path.resolve(folder, file);
  // Resolve existing symlink ancestors even for a not-yet-created output or source root.
  const suffix = [];
  while (true) {
   try { lstatSync(resolved); break; }
   catch (error) { if (error.code !== "ENOENT") throw error; }
   suffix.unshift(path.basename(resolved)); const parent = path.dirname(resolved); if (parent === resolved) break; resolved = parent;
  }
  resolved = path.resolve(realpathSync(resolved), ...suffix);
  const relative = path.relative(realpathSync(folder), resolved);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`outside temporary tree: ${file}`);
 };
 try {
  const config = JSON.parse(readFileSync(path.join(folder, "code-map.config.json"), "utf8"));
  if (config.mapPath !== GENERATOR_CONTRACT[0].path) throw new Error(`code-map mapPath: ${config.mapPath}`);
  if (!Array.isArray(config.roots) || !config.roots.length) throw new Error("code-map roots missing");
  for (const root of config.roots) inside(typeof root === "string" ? root : root?.path);
  // requirements-tree has no external output configuration: its target is declared in its script.
  const source = readFileSync(path.join(folder, GENERATOR_CONTRACT[1].write[0]), "utf8");
  const target = /const\s+target\s*=\s*resolve\(REPO_ROOT,\s*["']([^"']+)["']\s*\)/.exec(source)?.[1];
  if (target !== GENERATOR_CONTRACT[1].path) throw new Error(`requirements-tree target: ${target ?? "unrecognized"}`);
  for (const entry of GENERATOR_CONTRACT) inside(entry.path);
 } catch (error) { throw mergeRefusal("generatorScope", error.message); }
}

/** Rebuild a conflicted tree in an unregistered checkout and a private index; cleanup owns only this temp folder. */
function regenerateTree(runGit, main, mergedTree, conflicts, { generatorContract, generatorTimeoutMs, runGenerator }) {
 const folder = mkdtempSync(path.join(os.tmpdir(), "nana land generated-"));
 const checkout = path.join(folder, "tree");
 try {
  mkdirSync(checkout);
  const env = { ...process.env, GIT_DIR: git(runGit, main, "rev-parse", "--absolute-git-dir"), GIT_WORK_TREE: checkout, GIT_INDEX_FILE: path.join(folder, "index") };
  const privateGit = (_cwd, args) => spawnSync("git", ["-c", "core.autocrlf=false", "-c", "core.bare=false", ...args], { cwd: checkout, env, encoding: "utf8", maxBuffer: CHILD_OUTPUT_MAX_BYTES });
  const run = (...args) => git(privateGit, checkout, ...args);
  run("read-tree", mergedTree); run("checkout-index", "--all", "--force");
  guardGeneratorConfiguration(checkout);
  const command = (argv, reason) => {
   const result = runGenerator(argv, checkout, { env, shell: false, timeout: generatorTimeoutMs, encoding: "utf8", maxBuffer: CHILD_OUTPUT_MAX_BYTES });
   // Diagnostics (including HEAD-based deliverable notes) do not validate the merged tree.
   if (result.error || result.status !== 0) throw mergeRefusal(reason, `${argv.join(" ")}: exit ${result.status ?? result.signal ?? result.error?.code ?? "unknown"}${resultText(result) ? `: ${resultText(result).slice(0, LAND_REASON_MAX_CHARS).trim()}` : ""}`);
  };
  for (const entry of generatorContract) if (conflicts.includes(entry.path)) command(entry.write, "generatorFailed");
  for (const entry of generatorContract) command(entry.check, "generatorCheck");
  const allowed = new Set(generatorContract.map(entry => entry.path));
  // Check worktree changes before staging: index-only changes are checked separately against mergedTree.
  const changed = run("diff", "--name-only", "-z").split("\0").filter(Boolean);
  const untracked = run("ls-files", "--others", "-z").split("\0").filter(Boolean); // includes ignored files
  const outside = [...changed, ...untracked].filter(file => !allowed.has(file));
  if (outside.length) throw mergeRefusal("generatorScope", `generator changed non-generated file: ${outside.join(", ")}`);
  run("add", "--", ...generatorContract.map(entry => entry.path));
  const finalTree = run("write-tree");
  const treeChanges = run("diff", "--no-renames", "--name-only", "-z", mergedTree, finalTree).split("\0").filter(Boolean).filter(file => !allowed.has(file));
  if (treeChanges.length) throw mergeRefusal("generatorScope", `generator changed non-generated file: ${treeChanges.join(", ")}`);
  return finalTree;
 } finally { rmSync(folder, { recursive: true, force: true }); }
}

/** Compute an eligible textual or regenerated merge without touching a ref, shared index or checkout. */
function cleanMergeTree(runGit, main, tip, capturedMain, generators) {
	const base = git(runGit, main, "merge-base", tip, capturedMain);
	const changed = (from, to) => git(runGit, main, "diff", "--no-renames", "--name-only", "-z", from, to).split("\0").filter(Boolean);
	const lanePaths = changed(base, tip), mainPaths = changed(base, capturedMain);
	const attribute = [...lanePaths, ...mainPaths].find((file) => path.posix.basename(file) === ".gitattributes");
	if (attribute) throw mergeRefusal("unsupported", `${attribute} differs between merge base and parents`);
	// --no-renames includes every source and destination, even across different names.
	const changedPaths = [...new Set([...lanePaths, ...mainPaths])];
	const paths = changedPaths.length ? changedPaths : [".gitattributes"];
	// Probe even without changes so old git fails explicitly rather than guessing support.
	for (const parent of [tip, capturedMain]) {
		let output;
		try { output = git(runGit, main, "check-attr", `--source=${parent}`, "-z", "merge", "--", ...paths); }
		catch (error) { throw mergeRefusal("unsupported", `git check-attr --source needs git >= 2.40: ${error.message}`); }
		const fields = output.split("\0");
		if (fields.at(-1) === "") fields.pop();
		if (fields.length !== paths.length * 3) throw mergeRefusal("unsupported", "git check-attr --source returned malformed output");
		for (let i = 0; i < fields.length; i += 3) {
			if (fields[i] !== paths[i / 3] || fields[i + 1] !== "merge" || !fields[i + 2]) throw mergeRefusal("unsupported", "git check-attr --source returned malformed output");
			if (changedPaths.length && fields[i + 2] !== "unspecified") throw mergeRefusal("unsupported", `${fields[i]} has merge attribute ${fields[i + 2]} in ${parent}`);
		}
	}
	const result = runGit(main, [...CLEAN_MERGE_GIT_CONFIG.flatMap((setting) => ["-c", setting]), "merge-tree", "--write-tree", "--name-only", "--no-messages", tip, capturedMain]);
	const lines = String(result.stdout ?? "").split(/\r?\n/).map((line) => line.trimEnd());
	if (lines.at(-1) === "") lines.pop();
	if (result.error || ![0, 1].includes(result.status) || !objectId(lines[0] ?? "") ||
		(result.status === 0 ? lines.length !== 1 : lines.length < 2 || lines.slice(1).some((line) => !line))) {
		throw mergeRefusal("git", `exit ${result.status ?? result.signal ?? "unknown"}: ${String(result.stderr ?? result.error?.message ?? "malformed output").trim()}`);
	}
	if (result.status === 1) {
  const conflicts = lines.slice(1);
  if (conflicts.some(file => !GENERATOR_CONTRACT.some(entry => entry.path === file))) throw mergeRefusal("conflict", `${conflicts.slice(0, CLEAN_MERGE_NAME_CAP).join(", ")}${conflicts.length > CLEAN_MERGE_NAME_CAP ? ", …" : ""}`);
  return { tree: regenerateTree(runGit, main, lines[0], conflicts, generators), base, regenerated: conflicts };
 }
	// Preserve the clean-merge refusal for separate-hunk generated edits; only conflicts regenerate.
	const generated = CLEAN_MERGE_GENERATED_PATHS.find((file) => lanePaths.includes(file) && mainPaths.includes(file));
	if (generated) throw mergeRefusal("unsupported", `generated path ${generated} changed on both sides`);
	return { tree: lines[0], base };
}

/** Parse land CLI arguments, preserving repeated reviewed specifications. */
export function parseLandArgs(args) {
	const mode = args[0];
	if (mode !== "merge" && mode !== "cleanup") throw new Error("usage: nana-land merge|cleanup …");
	const positional = mode === "cleanup" ? args[1] : null;
	const options = { mode, lane: positional, reviewed: [] };
	for (let i = mode === "cleanup" ? 2 : 1; i < args.length; i++) {
		const key = args[i];
		if (!["--tree", "--main", "--suite", "--reviewed"].includes(key)) throw new Error(`unknown option ${key}`);
		const value = args[++i];
		if (!value || value.startsWith("--")) throw new Error(`${key} needs a value`);
		if (key === "--reviewed") options.reviewed.push(value);
		else options[key.slice(2)] = value;
	}
	if (!options.main) throw new Error("--main is required");
	if (mode === "merge" && (!options.tree || !options.suite)) throw new Error("merge requires --tree and --suite");
	if (mode === "cleanup" && (!options.lane || !LANE_NAME_PATTERN.test(options.lane))) throw new Error("cleanup needs a safe lane name");
	if (mode === "merge" && !options.reviewed.length) throw new Error("merge requires --reviewed");
	return options;
}

function reviewedPairs(pairs) {
	return pairs.map((pair) => {
		const at = pair.indexOf("=");
		if (at < 1 || at === pair.length - 1) throw new Error(`invalid --reviewed ${JSON.stringify(pair)}; expected <sha>=<item>`);
		return { sha: pair.slice(0, at), item: pair.slice(at + 1) };
	});
}

/** Run a fail-closed merge; process and state readers are injectable for controlled callers and tests. */
function runLandCore({ tree, main, suite, reviewed = [], home = os.homedir(), runGit = gitDefault, runCommand = commandDefault, runGh = ghDefault({ timeoutMs: CI_READ_TIMEOUT_MS }), withReviewLedgerLock: lockReviews = withReviewLedgerLock, readReleaseStatus = releaseStatus, keepLandCiRecords: keepCiRecords = keepLandCiRecords, platform = process.platform, recordsNow = () => performance.now(), now = () => new Date(), generatorContract = GENERATOR_CONTRACT, generatorTimeoutMs = GENERATOR_TIMEOUT_MS, runGenerator = (argv, cwd, options) => spawnSync(process.execPath, argv, { ...options, cwd }), lifecycle }) {
	try {
		tree = path.resolve(tree); main = path.resolve(main);
		const repo = repoKeyOf(tree);
		if (repo !== (lifecycle.mainRepoKey ?? repoKeyOf(main))) throw new Error("--tree and --main must share one git repository");
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main");
		assertCleanTracked(runGit, main, "main checkout");
		assertCleanTracked(runGit, tree, "source tree");
		const capturedMain = git(runGit, main, "rev-parse", "refs/heads/main");
		const tip = git(runGit, tree, "rev-parse", "HEAD^{commit}");
		const needsMerge = !isAncestor(runGit, capturedMain, tip, main);
		if (needsMerge && isAncestor(runGit, tip, capturedMain, main)) throw new Error("source tip is already contained in main");
		let landedTip = tip;
		const refs = reviewedPairs(reviewed).map(({ sha, item }) => {
			if (!/^[0-9a-f]{40,64}$/i.test(sha)) throw new Error(`review revision ${sha} is not a plain commit SHA`);
			if (git(runGit, tree, "cat-file", "-t", sha) !== "commit") throw new Error(`review revision ${sha} is not a plain commit SHA`);
			const canonicalSha = git(runGit, tree, "rev-parse", "--verify", `${sha}^{commit}`).toLowerCase();
			const canonical = canonicalItem(item);
			if (!isAncestor(runGit, canonicalSha, tip, tree)) throw new Error(`review revision ${canonicalSha} is not an ancestor of source tip`);
			return { sha: canonicalSha, item: canonical };
		});
		const reviewRefs = refs.map((r) => r.sha);
		const firstRead = lockReviews(home, ({ rounds, reservations }) => ({ rounds: rounds.filter((r) => r.repo === repo), reservations: reservations.filter((r) => r.repo === repo) }));
		const textName = (evidence, row) => evidence.file ? path.basename(evidence.file) : `${row.text?.sha256 ?? "malformed-text-reference"}.md`;
		const checkRecords = (rounds, reservations) => {
			const notes = [], relied = [];
			for (const { sha, item } of refs) {
				const matching = rounds.filter((r) => r.v === 2 && r.revision === sha && r.item === item && r.verdict === "LAND" && r.unverified !== true);
				if (!matching.length) throw new Error(`no verified version-2 LAND review for item ${item} at revision ${sha}`);
				let holds = 0;
				for (const row of matching) {
					if (!Object.hasOwn(row, "text")) {
						holds++;
						notes.push(`${LAND_NOTE_PREFIX} note: pre-store LAND record has no kept text for item ${item} at revision ${sha}`);
						continue;
					}
					const evidence = reviewTextEvidence(home, row.text);
					if (evidence.status === "intact") {
						holds++;
						relied.push(textName(evidence, row));
					} else {
						notes.push(`${LAND_NOTE_PREFIX} note: ${evidence.status} kept review text ${textName(evidence, row)} for item ${item} at revision ${sha}`);
					}
				}
				if (!holds) throw new Error(`item ${item} at revision ${sha} has no matching verified LAND record with an intact kept text or a pre-store record; re-run that review on the same revision to recover it`);
				const bad = rounds.filter((r) => r.unverified !== true && (r.revision === sha || r.head === sha) && Object.hasOwn(r, "verdict") && r.verdict !== "LAND");
				if (bad.length) throw new Error(`non-LAND verdict record(s) for ${sha}: ${bad.map((r) => `${r.item}/${r.revision}/${r.verdict ?? "empty"}`).join(", ")}`);
				const inflight = reservations.filter((r) => r.revision === sha || String(r.revision).split("+snap:")[0] === sha);
				if (inflight.length) throw new Error(`review in flight for ${sha}`);
			}
			return { notes, relied };
		};
		checkRecords(firstRead.rounds, firstRead.reservations);
		const unreviewed = git(runGit, tree, "rev-list", tip, "--not", capturedMain, ...reviewRefs).split(/\r?\n/).filter(Boolean);
		if (unreviewed.length) {
			const named = unreviewed.map((sha) => `${sha} ${git(runGit, tree, "show", "-s", "--format=%s", sha)}`);
			throw new Error(`uncovered commits (get it reviewed with a new round on the tip or drop it): ${named.join("; ")}`);
		}
		const merge = needsMerge ? cleanMergeTree(runGit, main, tip, capturedMain, { generatorContract, generatorTimeoutMs, runGenerator }) : null;
		if (needsMerge) {
			const laneProof = changedSuitePaths(git(runGit, tree, "diff", "--no-renames", "--name-only", merge.base, tip));
			if (!laneProof.ok) throw mergeRefusal("proof", "lane contribution");
			const mainProof = changedSuitePaths(git(runGit, main, "diff", "--no-renames", "--name-only", tip, merge.tree));
			if (!mainProof.ok) throw mergeRefusal("proof", "main contribution");
		}
		lifecycle.stage = "ci";
		const remoteNames = git(runGit, main, "remote");
		const hasOrigin = remoteNames.split(/\r?\n/).map((name) => name.trim()).includes(CI_REMOTE);
		const originUrl = hasOrigin ? git(runGit, main, "remote", "get-url", CI_REMOTE) : "";
		const repository = githubRepoOf(originUrl);
		const workflowPaths = repository ? git(runGit, tree, "ls-tree", "-z", "--name-only", tip, "--", `${CI_WORKFLOW_DIR}/`) : "";
		const scope = ciScope({ remoteNames, originUrl, workflowPaths });
		const readRuns = () => {
			const apiPath = CI_RUNS_PATH.replace("<owner>", scope.repository.owner).replace("<repo>", scope.repository.repo);
			const args = ["api", "--hostname", CI_HOST, `${apiPath}?head_sha=${tip}&per_page=${CI_RUNS_PAGE_SIZE}`];
			const env = ghEnvironment(process.env);
			let response;
			for (let attempt = 0; attempt <= CI_RUN_LIST_RETRIES; attempt++) {
				response = runGh(main, args, { env });
				if (response?.error || response?.status === 0 || response?.signal || !Number.isInteger(response?.status)) break;
			}
			const firstErrorLine = String(response?.stderr ?? "").split(/\r?\n/)[0].trim();
			if (response?.error?.code === "ETIMEDOUT" || response?.signal && response?.status === null) throw new Error(`CI read timed out after ${response?.nanaTimeoutMs ?? CI_READ_TIMEOUT_MS} ms${firstErrorLine ? `: ${firstErrorLine}` : ""}`);
			if (response?.error) {
				if (response.error.code === "ENOENT") throw new Error(`cannot start gh from PATH: ${response.error.message}`);
				throw new Error(`gh could not start: ${response.error.message}`);
			}
			if (response?.status !== 0) throw new Error(`gh CI read failed (exit ${response?.status ?? response?.signal ?? "unknown"})${firstErrorLine ? `: ${firstErrorLine}` : ""}`);
			const verdict = judgeRuns(response.stdout, tip, scope.repository);
			if (!verdict.ok) {
				const remedy = `nana-ci-wait --tip ${tip}`;
				if (verdict.runs?.length === 0) {
					let diagnosis;
					try {
						const target = ciTarget({ cwd: tree, tip, runGit });
						diagnosis = ciReadiness({ ...target, cwd: main, runGh, reads: 1, env });
					} catch (error) { diagnosis = { ok: false, message: error.message }; }
					throw new Error(`${verdict.message}; ${diagnosis.ok ? "PR is ready; wait for CI to start" : diagnosis.message}; ${remedy}`);
				}
				for (const run of verdict.runs ?? []) {
					if (run.status !== CI_DONE_STATUS || run.conclusion === CI_PASS_CONCLUSION) continue;
					let kind;
					try {
						const jobs = ciRunJobs(run, { cwd: main, repository: scope.repository, runGh, env });
						const workflow = runGit(tree, ["show", `${tip}:${CI_ADVISORY_WORKFLOW}`]);
						const workflowText = workflow.status === 0 ? workflow.stdout : "";
						kind = classifyRun(run, jobs, { workflowText });
					} catch { /* Missing evidence preserves the original red refusal. */ }
					if (kind === "capacity-cancelled") throw new Error(`CI at ${tip.slice(0, TIP_DIGITS)}: ${run.name} run ${run.id} attempt ${run.run_attempt} is ${run.conclusion} (capacity-cancelled); ${remedy}`);
				}
				throw new Error(verdict.message);
			}
			return verdict;
		};
		let judgedRuns;
		let ciLines = [];
		let ciNote = null;
		let ciReadPassed = false;
		let suiteProof = { ok: false, reason: scope.note };
		if (!scope.applies) {
			if (needsMerge) throw mergeRefusal("noCi", scope.note);
			lifecycle.ci = "skipped";
			ciNote = `${LAND_NOTE_PREFIX} note: CI not read: ${scope.note}`;
		} else {
			lifecycle.ci = "refused";
			const verdict = readRuns();
			judgedRuns = verdict.runs;
			const env = ghEnvironment(process.env);
			ciLines = verdict.lines;
			ciReadPassed = true;
			lifecycle.ci = "passed";
			lifecycle.ciWaitMs = landCiWaitMs(verdict.runs);
			suiteProof = needsMerge ? { ok: true } : changedSuitePaths(git(runGit, tree, "diff", "--no-renames", "--name-only", capturedMain, tip));
			if (suiteProof.ok) {
				try {
					const budget = budgetedGh({ runGh: (cwd, args, options = {}) => runGh(cwd, args, { ...options, env }), now: recordsNow });
					const records = readCiRecords([tip], { cwd: tree, runGit, runGh: budget.runGh, writeLine: () => {} });
					suiteProof = proveCiSuite({ ...records, budgetStopped: budget.budgetStopped }, verdict.runs, platform);
				} catch { suiteProof = { ok: false, reason: "CI suite records could not be read" }; }
			}
		}
		if (needsMerge && !suiteProof.ok) throw mergeRefusal("suite", suiteProof.reason);
		lifecycle.stage = "suite";
		lifecycle.suite = suiteProof.ok ? "ci" : "local";
		lifecycle.suiteWhy = suiteProof.ok ? null : suiteProof.reason;
		const suiteLine = suiteProof.ok
			? `${SUITE_LINE_PREFIX} ci ${suiteProof.records.map((item) => `run ${item.run.id} attempt ${item.attempt} platform ${platform}`).join("; ")}`
			: `${SUITE_LINE_PREFIX} local ${suiteProof.reason}`;
		let suiteResult = {};
		if (!suiteProof.ok) {
			const suiteStarted = now();
			suiteResult = runCommand(suite, tree, { env: { ...process.env, [LAND_TIP_ENV]: tip } });
			const suiteEnded = now();
			lifecycle.suiteMs = suiteEnded.getTime() - suiteStarted.getTime();
			const suiteCode = suiteResult.status ?? (suiteResult.signal ? 128 : 1);
			if (suiteResult.error || suiteCode !== 0) return { code: 1, text: `suite failed (exit ${suiteResult.status ?? suiteResult.signal ?? "unknown"})\n${resultText(suiteResult)}` };
		}
		lifecycle.stage = "merge";
		let reviewEvidence;
		if (needsMerge) {
			landedTip = git(runGit, main, "commit-tree", merge.tree, "-p", tip, "-p", capturedMain, "-m", CLEAN_MERGE_MESSAGE);
			if (!objectId(landedTip)) throw mergeRefusal("git", "git commit-tree returned malformed output");
			const identities = (runs) => runs.map((run) => `${run.workflow_id}/${run.id}/${run.run_attempt}`).sort();
			try {
				const latest = readRuns();
				if (JSON.stringify(identities(latest.runs)) !== JSON.stringify(identities(judgedRuns))) throw new Error("newest run id or attempt changed");
			} catch (error) { throw mergeRefusal("ciChanged", error.message); }
		}
		lockReviews(home, ({ rounds, reservations }) => {
			const repoRounds = rounds.filter((r) => r.repo === repo);
			reviewEvidence = checkRecords(repoRounds, reservations.filter((r) => r.repo === repo));
			const tipBlobs = new Set(git(runGit, tree, "ls-tree", "-r", tip).split(/\r?\n/).filter(Boolean).map((line) => line.match(/^\d+\s+blob\s+(\S+)/)?.[1]).filter(Boolean));
			const reviewedItems = new Set(refs.map((r) => r.item));
			const seenEarlier = new Set();
			for (const row of repoRounds) {
				if (!reviewedItems.has(row.item) || row.revision === tip || !Object.hasOwn(row, "text")) continue;
				const evidence = reviewTextEvidence(home, row.text);
				if (evidence.status !== "intact" || seenEarlier.has(row.text.sha256)) continue;
				seenEarlier.add(row.text.sha256);
				const blob = git(runGit, tree, "hash-object", evidence.file);
				if (!tipBlobs.has(blob)) reviewEvidence.notes.push(`${LAND_NOTE_PREFIX} note: earlier kept review text ${textName(evidence, row)} for item ${row.item} is not in the tip's tree`);
			}
			if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main immediately before merge");
			assertCleanTracked(runGit, main, "main checkout");
			if (git(runGit, main, "rev-parse", "HEAD") !== capturedMain) throw new Error("main checkout HEAD changed during suite");
			assertCleanTracked(runGit, tree, "source tree");
			if (git(runGit, tree, "rev-parse", "HEAD^{commit}") !== tip) throw new Error("source tip changed during suite");
			git(runGit, main, "merge", "--ff-only", landedTip);
			if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout switched away from branch main during merge");
			if (git(runGit, main, "rev-parse", "refs/heads/main") !== landedTip) throw new Error("main ref does not equal landed tip after merge");
		});
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main after merge");
		if (git(runGit, main, "rev-parse", "refs/heads/main") !== landedTip) throw new Error("main ref does not equal landed tip after merge");
		assertCleanTracked(runGit, main, "main checkout after merge");
		if (!isAncestor(runGit, tip, "refs/heads/main", main)) throw new Error("containment check failed: landed tip is not an ancestor of main");
		let releaseLine;
		try { releaseLine = readReleaseStatus({ repo: main, runGit }).line; }
		catch (error) { releaseLine = `release status unavailable (${error?.message ?? "unknown error"})`; }
		let recordLines = [], recordNotes = [];
		if (ciReadPassed) {
			try {
				const result = keepCiRecords({
					main,
					tip,
					runGh: (cwd, args, options = {}) => runGh(cwd, args, { ...options, env: ghEnvironment(process.env) }),
					budgetMs: CI_RECORDS_BUDGET_MS,
					keep: CI_RECORDS_KEEP,
					share: CI_SLOW_SHARE,
				});
				if (!result || !Array.isArray(result.lines) || !Array.isArray(result.notes)) throw new Error("CI-record keeper returned a malformed result");
				recordLines = result.lines.map(String); recordNotes = result.notes.map(String);
			} catch (error) { recordNotes = [`${LAND_NOTE_PREFIX} note: CI records failed: ${error?.message ?? "unknown error"}`]; }
		}
		const notes = [...(ciNote ? [ciNote] : []), ...landNotes(suiteResult), ...(reviewEvidence?.notes ?? []), ...recordNotes];
		const relied = [...new Set(reviewEvidence?.relied ?? [])].map((name) => `review text relied on: ${name}`);
		return { code: 0, text: `${notes.length ? `${notes.join("\n")}\n` : ""}${relied.length ? `${relied.join("\n")}\n` : ""}${ciLines.length ? `${ciLines.join("\n")}\n` : ""}${recordLines.length ? `${recordLines.join("\n")}\n` : ""}${needsMerge ? `${CLEAN_MERGE_PREFIX} ${capturedMain} into ${tip} as ${landedTip}\n` : ""}${merge?.regenerated ? `regenerated: ${merge.regenerated.join(", ")}\n` : ""}${suiteLine}\npush command: git push\nrelease status: ${releaseLine}\n` };
	} catch (error) { return { code: 1, text: `refused: ${error.message}\n` }; }
}

const withLandRecordLine = (text, line) => `${text}${text && !text.endsWith("\n") ? "\n" : ""}${line}\n`;

/** Run a merge with a best-effort start/end record lifecycle that never changes its verdict or earlier output. */
function runRecordedLand(options) {
	const now = options.now ?? (() => new Date());
	const lifecycle = { stage: "preflight", ci: "not reached", ciWaitMs: null, suiteMs: null, suite: null, suiteWhy: null };
	let common = null;
	let start = null;
	let startKept = false;
	let recordFailure = null;
	try {
		const resolvedMain = path.resolve(options.main);
		const resolvedTree = path.resolve(options.tree);
		lifecycle.mainRepoKey = repoKeyOf(resolvedMain);
		common = lifecycle.mainRepoKey.replace(/^git:/, "");
		const startedAt = now().toISOString();
		let lane = null;
		let tip = null;
		try {
			const branch = git(options.runGit ?? gitDefault, resolvedTree, "branch", "--show-current");
			const match = /^feat\/(.+)$/.exec(branch);
			lane = match && LANE_NAME_PATTERN.test(match[1]) ? match[1] : null;
		} catch { lane = null; }
		try { tip = git(options.runGit ?? gitDefault, resolvedTree, "rev-parse", "HEAD^{commit}"); }
		catch { tip = null; }
		start = { v: LAND_RECORD_SCHEMA, kind: "start", attempt: randomUUID(), startedAt, lane, tip };
		const kept = appendLandRecord(common, start);
		startKept = kept.ok;
		if (!kept.ok) recordFailure = { file: kept.file, error: kept.error };
	} catch (error) {
		if (common) recordFailure = { file: landRecordsPath(common), error };
	}

	const result = runLandCore({ ...options, now, lifecycle });
	if (!common) return result;
	if (!startKept) {
		const detail = recordFailure ?? { file: landRecordsPath(common), error: new Error("start record was not kept") };
		return { ...result, text: withLandRecordLine(result.text, `${LAND_RECORD_LINE_PREFIX} not kept: ${detail.file}: ${errorText(detail.error)}`) };
	}

	let end;
	try {
		const endedAt = now().toISOString();
		const firstLine = String(result.text ?? "").split(/\r?\n/).find(Boolean) ?? "unknown refusal";
		const reason = result.code === 0 ? null : firstLine.replace(/^refused:\s*/, "").slice(0, LAND_REASON_MAX_CHARS);
		end = {
			v: LAND_RECORD_SCHEMA,
			kind: "end",
			attempt: start.attempt,
			endedAt,
			durationMs: Date.parse(endedAt) - Date.parse(start.startedAt),
			outcome: result.code === 0 ? "landed" : "refused",
			stage: result.code === 0 ? null : lifecycle.stage,
			reason,
			ci: lifecycle.ci,
			ciWaitMs: lifecycle.ci === "passed" ? lifecycle.ciWaitMs : null,
			suiteMs: lifecycle.suiteMs,
			suite: lifecycle.suite,
			suiteWhy: lifecycle.suiteWhy,
		};
		const kept = appendLandRecord(common, end);
		if (!kept.ok) {
			return { ...result, text: withLandRecordLine(result.text, `${LAND_RECORD_LINE_PREFIX} not kept: ${kept.file}: ${errorText(kept.error)}`) };
		}
	} catch (error) {
		return { ...result, text: withLandRecordLine(result.text, `${LAND_RECORD_LINE_PREFIX} not kept: ${landRecordsPath(common)}: ${errorText(error)}`) };
	}

	let laneLine;
	if (start.lane === null) laneLine = "no lane";
	else {
		try {
			const ledger = readLandLedger(landRecordsPath(common), { maxBytes: options.landLedgerReadMaxBytes ?? LAND_LEDGER_READ_MAX_BYTES });
			laneLine = renderLandLaneLine(ledger.records, start.lane);
		} catch (error) {
			laneLine = `lane line unavailable: ${error?.code === "ERR_TOO_LARGE" ? error.message : errorText(error)}`;
		}
	}
	return { ...result, text: withLandRecordLine(result.text, renderLandRecordLine(end, laneLine)) };
}

/** Post-merge making is independent of record retention and cannot change the land verdict. */
export function runLand(options) {
 let lane = null;
 try {
  const branch = git(options.runGit ?? gitDefault, path.resolve(options.tree), 'branch', '--show-current');
  const match = /^feat\/(.+)$/.exec(branch);
  if (match && LANE_NAME_PATTERN.test(match[1])) lane = match[1];
 } catch {}
 const result = runRecordedLand(options);
 if (result.code !== 0 || !lane || typeof options.startMemory !== 'function') return result;
 let line;
 try { line = options.startMemory({repo:path.resolve(options.main),lane}); }
 catch { line = MEMORY_WORDS.notStarted; }
 return {...result,text:withLandRecordLine(result.text,line ?? MEMORY_WORDS.notStarted)};
}

/** Safely remove a landed lane worktree and its feat branch; refuses force and dirty trees. */
export function runCleanup(lane, { main, worktree, runGit = gitDefault } = {}) {
	try {
		main = path.resolve(main);
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main");
		if (typeof lane !== "string" || !LANE_NAME_PATTERN.test(lane)) throw new Error("cleanup needs a safe lane name");
		const branch = `feat/${lane}`;
		const exists = runGit(main, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
		if (exists.error || exists.status !== 0) throw new Error(`branch ${branch} does not exist`);
		const listed = git(runGit, main, "worktree", "list", "--porcelain");
		const blocks = listed.split(/\n\n/).filter(Boolean);
		const matches = blocks.filter((b) => b.split(/\r?\n/).includes(`branch refs/heads/${branch}`));
		if (matches.length > 1) throw new Error(`branch ${branch} is checked out in multiple worktrees`);
		const match = matches[0];
		if (!match) throw new Error(`branch ${branch} has no registered worktree (or its worktree was deleted)`);
		const registeredPath = match.match(/^worktree (.+)$/m)?.[1];
		if (!registeredPath) throw new Error(`cannot resolve worktree for ${branch}`);
		worktree = path.resolve(worktree ?? registeredPath);
		try {
			if (realPath(worktree, { mustExist: true }) !== realPath(registeredPath, { mustExist: true })) throw new Error(`worktree path does not match registered branch ${branch}`);
		} catch (error) { throw new Error(error.message.includes("does not match") ? error.message : `worktree for ${branch} is missing or unavailable: ${error.message}`); }
		const status = git(runGit, worktree, "status", "--porcelain");
		if (status) throw new Error(`worktree ${worktree} is dirty`);
		const branchSha = git(runGit, main, "rev-parse", branch);
		if (!isAncestor(runGit, branchSha, "refs/heads/main", main)) throw new Error(`branch ${branch} is not contained in main`);
		// Remove by git's OWN registered spelling (not the possibly differently spelled --worktree
		// argument): worktree remove must match what git registered, or it refuses on some platforms.
		git(runGit, main, "worktree", "remove", registeredPath);
		git(runGit, main, "branch", "-d", branch);
		return { code: 0, text: `removed ${registeredPath} and ${branch}\n` };
	} catch (error) { return { code: 1, text: `refused: ${error.message}\n` }; }
}

export function main(args = process.argv.slice(2)) {
	try {
		const options = parseLandArgs(args);
		return options.mode === "merge" ? runLand({ ...options, startMemory }) : runCleanup(options.lane, options);
	} catch (error) { return { code: 1, text: `refused: ${error.message}\n` }; }
}
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const result = main(); process.stdout.write(result.text); process.exitCode = result.code;
}
