#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-worker.mjs
 * @purpose Run a pi worker under a liveness watchdog, with optional linked-worktree lane checks and build records.
 * @inputs argv (--out, watchdog knobs, optional lane options, then `--` and pi args), and in lane
 *  mode the brief, worktree HEAD, feature known bugs, machine roster, git common folder, and pi sessions
 * @outputs worker output, result diagnostics, and lane-mode start/end records plus a final lane line
 * @effects disk (writes output and clone-shared build records), process (spawns and may kill the pi child process group)
 * @errors exit 1 on bad args, invalid lane, refused brief precedent, invalid or disallowed
 *  --lane-size, refused roster, failed worker, output failure, or exceeded lane ceiling; record failures only report
 */
import { accessSync, closeSync, constants, existsSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';
import { LANE_DEFAULTS, LANE_MAX_SECS, CLAUDE_CODE_RUNTIME, LANE_SIZE_SLOTS, LARGER_BUILDER_LABEL } from './worker-config.mjs';
import { resolveRoster } from './nana-roster.mjs';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { checkBriefForLaunch } from '../lib/brief-precedent.mjs';
import { appendBuildRecord, buildBriefPath, buildRecordsPath, buildSessionDir, collectBuildUsage, readBuildLedger, renderLaneLine } from '../lib/build-records.mjs';
import { BUILD_LEDGER_READ_MAX_BYTES, BUILD_RECORD_LINE_PREFIX, BUILD_RECORD_SCHEMA, REPORT_COST_DIGITS, REPORT_MILLISECONDS_PER_MINUTE, WORKER_TAG } from '../lib/build-records-config.mjs';

const USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const LANE_USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries 0] [--poll N] --lane <name> --brief <file> [--max-secs N] [--lane-size <small|larger>]\n';
const LANE_ONLY_FLAGS = ['--lane', '--brief', '--max-secs', '--lane-size'];
const all = process.argv;
const separator = all.indexOf('--');
const own = separator < 0 ? all : all.slice(0, separator);
const ownOptionNames = new Set(['--out', '--stall-secs', '--retries', '--poll', '--lane', '--brief', '--max-secs', '--lane-size']);
const ownValues = new Map();
let duplicateOwnOption = null;
for (let i = 2; i < own.length; i++) {
	const flag = own[i];
	if (!ownOptionNames.has(flag)) continue;
	if (ownValues.has(flag)) duplicateOwnOption ??= flag;
	const next = own[i + 1];
	const takesValue = next !== undefined && !ownOptionNames.has(next);
	ownValues.set(flag, takesValue ? next : null);
	if (takesValue) i++;
}
const value = (flag) => ownValues.get(flag) ?? null;
const lanePresent = ownValues.has('--lane');
const briefPresent = ownValues.has('--brief');
const maxPresent = ownValues.has('--max-secs');
const laneSizePresent = ownValues.has('--lane-size');
const laneMode = lanePresent;
const lane = value('--lane');
const brief = value('--brief');
const maxRaw = value('--max-secs');
const maxSecs = maxRaw === null ? LANE_MAX_SECS : Number(maxRaw);
const laneSizeRaw = value('--lane-size');
const filteredOwn = own.filter((arg, i) => !LANE_ONLY_FLAGS.includes(arg) && !LANE_ONLY_FLAGS.includes(own[i - 1]));
const argv = [...filteredOwn, ...(separator < 0 ? [] : ['--', ...all.slice(separator + 1)])];

function git(...args) {
	return execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function laneFailure(reason) {
	if (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true });
	if (laneLock) releaseLaneLock(laneLock);
	process.stderr.write(`pi-worker: lane refused: ${reason}\n`);
	process.exit(1);
}
function trusted(worktree) {
	const reader = new URL('../lib/objective.ts', import.meta.url).href;
	const shared = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `import { trustRecord } from ${JSON.stringify(reader)}; process.stdout.write(String(trustRecord(process.argv[1]).vouched));`, worktree], { encoding: 'utf8', env: process.env });
	return shared.status === 0 && shared.stdout.trim() === 'true';
}

let childEnv = { NANA_ROLE: 'worker' };
let maxArg;
let laneRoot, laneGitDir, laneCommonDir, briefPath, preambleFile, laneLock, knownBugPath;
let selectedBuilder, selectedLaneSize, selectedSlot, selectedFeature;
let buildStart = null, buildStartKept = false, buildEnd = null, buildEndKept = false;
let precedentLine = '';
let validateLaneAttempt = () => null;
// Duplicates are refused only in lane mode; non-lane parsing stays byte-identical to the
// pre-lane launcher (first occurrence wins) — astra land r7 on t3-launcher.
if (duplicateOwnOption && laneMode) laneFailure(`duplicate option ${duplicateOwnOption}`);
for (const [flag, present, arg] of [['--lane', lanePresent, lane], ['--brief', briefPresent, brief], ['--max-secs', maxPresent, maxRaw], ['--lane-size', laneSizePresent, laneSizeRaw]]) {
	if (present && (arg === null || arg === '' || arg.startsWith('-'))) laneFailure(`${flag} requires a value`);
}
if (laneMode) {
	if (!lane || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(lane)) laneFailure('lane name is missing or invalid');
	let cwd, root, branch, dirs;
	try {
		cwd = fsReal(process.cwd());
		root = fsReal(git('rev-parse', '--show-toplevel'));
		branch = git('branch', '--show-current');
		dirs = git('rev-parse', '--git-dir', '--git-common-dir').split(/\r?\n/).map((p) => fsReal(path.resolve(cwd, p)));
	} catch { laneFailure('cannot resolve repository root, linked-worktree metadata, or branch'); }
	if (cwd !== root) laneFailure('cwd is not the repository root');
	if (dirs[0] === dirs[1]) laneFailure('main checkout is not a linked worktree');
	if (branch !== `feat/${lane}`) laneFailure(`checked-out branch is ${branch || '(detached)'}, expected feat/${lane}`);
	if (!brief || !existsSync(path.resolve(cwd, brief))) laneFailure('brief file does not exist');
	if (ownValues.has('--retries') && Number(value('--retries')) > 0) laneFailure('--retries greater than zero is refused in lane mode');
	if (!Number.isSafeInteger(maxSecs) || maxSecs < 1) laneFailure('--max-secs must be a positive whole number');
	briefPath = fsReal(path.resolve(cwd, brief));
	try {
		if (!statSync(briefPath).isFile()) laneFailure('brief must be a readable regular file');
		accessSync(briefPath, constants.R_OK);
	} catch { laneFailure('brief must be a readable regular file'); }
	const briefCheck = checkBriefForLaunch({
		briefPath,
		worktreeRoot: cwd,
		gitRunner: (args, options = {}) => execFileSync('git', args, {
			cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options,
		}),
	});
	if (!briefCheck.ok) laneFailure(briefCheck.reason);
	precedentLine = briefCheck.line;
	knownBugPath = briefCheck.knownBugPath ? fsReal(briefCheck.knownBugPath) : undefined;
	selectedFeature = briefCheck.feature;
	if (separator >= 0 && all.slice(separator + 1).length) laneFailure('caller pi arguments are refused in lane mode');
	const rosterResult = resolveRoster(piAgentDir());
	if (!rosterResult.ok) laneFailure(`roster refused: ${rosterResult.file}: ${rosterResult.problem}`);
	const roster = rosterResult.roster;
	if (laneSizePresent && laneSizeRaw !== 'small' && laneSizeRaw !== 'larger') laneFailure(`--lane-size must be small or larger (got ${JSON.stringify(laneSizeRaw)})`);
	// R-1212: once the slot is set, every launch on this machine must name a size — the notice
	// reaches every project at once, but the shared bullet (R-1193) reaches only a project whose
	// marker region is refreshed.
	if (!laneSizePresent && roster.largerBuilder !== null) laneFailure('roster sets largerBuilder: pass --lane-size larger for a larger or riskier lane, or --lane-size small for a small one');
	const laneSize = laneSizePresent ? laneSizeRaw : 'small';
	let builder;
	let builderLabel = 'builder';
	if (laneSize === 'larger' && roster.largerBuilder !== null) {
		if (roster.largerBuilder.runtime === CLAUDE_CODE_RUNTIME) {
			// R-1191: pi-worker starts pi entries only; both ways out are the user's choice,
			// never an order to edit the user's file (CHANGE.md 3.2, 3.7).
			laneFailure('roster.largerBuilder is a Claude Code entry; pi-worker starts pi entries only: ask the user to start it as a subagent from a Claude Code seat, or to put a pi entry in largerBuilder');
		}
		builder = roster.largerBuilder;
		builderLabel = LARGER_BUILDER_LABEL;
	} else {
		builder = roster[LANE_SIZE_SLOTS.small];
	}
	process.stderr.write(`pi-worker: ${builderLabel}: ${builder.provider} ${builder.model} ${builder.thinking ?? 'default'}; source: ${rosterResult.source}\n`);
	process.stderr.write(`${precedentLine}\n`);
	const preamblePath = new URL('../prompts/builder-preamble.md', import.meta.url);
	const preamble = readFileSync(preamblePath, 'utf8').replaceAll('{{WORKTREE}}', cwd).replaceAll('{{BRANCH}}', branch);
	laneRoot = cwd; laneGitDir = dirs[0]; laneCommonDir = dirs[1];
	selectedBuilder = builder; selectedLaneSize = laneSize; selectedSlot = builderLabel === LARGER_BUILDER_LABEL ? 'largerBuilder' : 'builder';
	const preambleDir = mkdtempSync(path.join(tmpdir(), 'nana-lane-preamble-'));
	preambleFile = path.join(preambleDir, 'preamble.md');
	writeFileSync(preambleFile, preamble);
	const piArgs = ['--provider', builder.provider, '--model', builder.model, ...(builder.thinking === null ? [] : ['--thinking', builder.thinking]), '-t', LANE_DEFAULTS.tools, '--append-system-prompt', preambleFile, '--append-system-prompt', briefPath, ...(knownBugPath ? ['--append-system-prompt', knownBugPath] : []), '-p', `Do the work in your brief for lane ${lane}. Your cwd is the lane worktree. Finish with the report shape the brief gives.`];
	const argvSeparator = argv.indexOf('--');
	if (argvSeparator >= 0) argv.splice(argvSeparator + 1, argv.length, ...piArgs);
	else argv.push('--', ...piArgs);
	childEnv = { NANA_WORKTREE_ROOT: cwd, NANA_ROLE: 'worker' };
	maxArg = maxSecs;
	if (!trusted(cwd)) process.stderr.write(`trust: none for ${cwd} — project post-edit checks are inert (nana-setup trust ${cwd})\n`);
	function validateLane() {
		try {
			const nowCwd = fsReal(process.cwd());
			const nowRoot = fsReal(git('rev-parse', '--show-toplevel'));
			const nowBranch = git('branch', '--show-current');
			const nowDirs = git('rev-parse', '--git-dir', '--git-common-dir').split(/\r?\n/).map((p) => fsReal(path.resolve(nowCwd, p)));
			if (nowCwd !== laneRoot || nowRoot !== laneRoot) return 'cwd is no longer the repository root';
			if (nowDirs[0] === nowDirs[1] || nowDirs[0] !== laneGitDir) return 'linked-worktree metadata changed';
			if (nowBranch !== `feat/${lane}`) return `checked-out branch is ${nowBranch || '(detached)'}, expected feat/${lane}`;
			return null;
		} catch { return 'cannot resolve repository root, linked-worktree metadata, or branch'; }
	}
	validateLaneAttempt = validateLane;
}
// R-1125: win32 resolves a lane's paths by native real path, which keeps an 8.3 or differently
// cased form the way git itself sees it; POSIX keeps the JS implementation, as landed.
function fsReal(p) { return process.platform === 'win32' ? realpathSync.native(p) : realpathSync(p); }
function errorText(error) { return `${error?.code ? `${error.code}: ` : ''}${error?.message ?? String(error)}`; }
function workerExit(result) {
	if (result.signal) return { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[result.signal] ?? 1;
	return result.ok ? 0 : 1;
}
function keepBuildStart(outPath) {
	try {
	const startedAt = new Date().toISOString();
	let tip;
	try { tip = git('rev-parse', 'HEAD'); } catch { tip = null; }
	buildStart = {
		v: BUILD_RECORD_SCHEMA,
		kind: 'start',
		build: randomUUID(),
		lane,
		brief: buildBriefPath(briefPath, laneRoot),
		feature: selectedFeature,
		tip,
		startedAt,
		pid: process.pid,
		lock: laneLock,
		laneSize: selectedLaneSize,
		slot: selectedSlot,
		provider: selectedBuilder.provider,
		model: selectedBuilder.model,
		thinking: selectedBuilder.thinking,
		cwd: process.cwd(),
		sessionDir: buildSessionDir(process.cwd()),
		out: path.resolve(process.cwd(), outPath),
	};
	const kept = appendBuildRecord(laneCommonDir, buildStart);
	buildStartKept = kept.ok;
	if (!kept.ok) process.stderr.write(`${BUILD_RECORD_LINE_PREFIX} not kept: ${kept.file}: ${errorText(kept.error)}\n`);
	} catch (error) {
		buildStartKept = false;
		process.stderr.write(`${BUILD_RECORD_LINE_PREFIX} not kept: ${buildRecordsPath(laneCommonDir)}: ${errorText(error)}\n`);
	}
}
function keepBuildEnd(result, outputError) {
	try {
	const endedAt = new Date().toISOString();
	const exit = outputError ? 1 : workerExit(result);
	const outcome = outputError ? 'failed' : result.signal ? 'stopped' : result.ceiling ? 'ceiling' : result.ok ? 'ok' : 'failed';
	let tip = null, tipError = null;
	try { tip = git('rev-parse', 'HEAD'); } catch (error) { tipError = errorText(error); }
	const found = collectBuildUsage(buildStart);
	buildEnd = {
		v: BUILD_RECORD_SCHEMA,
		kind: 'end',
		build: buildStart.build,
		endedAt,
		durationMs: Date.parse(endedAt) - Date.parse(buildStart.startedAt),
		attempts: Number(result.attempt) || 1,
		exit,
		outcome,
		signal: result.signal ?? null,
		tip,
		tipError,
		usage: found.usage,
		cost: found.cost,
		costReason: found.costReason,
		sessions: found.sessions,
		sessionBadLines: found.sessionBadLines,
		outputError: outputError ? errorText(outputError) : null,
	};
	const kept = appendBuildRecord(laneCommonDir, buildEnd);
	buildEndKept = kept.ok;
	if (!kept.ok) process.stderr.write(`${BUILD_RECORD_LINE_PREFIX} not kept: ${kept.file}: ${errorText(kept.error)}\n`);
	} catch (error) {
		buildEndKept = false;
		process.stderr.write(`${BUILD_RECORD_LINE_PREFIX} not kept: ${buildRecordsPath(laneCommonDir)}: ${errorText(error)}\n`);
	}
}
function buildEndLine() {
	let laneLine;
	try {
		laneLine = renderLaneLine(readBuildLedger(buildRecordsPath(laneCommonDir), { maxBytes: BUILD_LEDGER_READ_MAX_BYTES }).records, lane);
	} catch (error) {
		laneLine = error?.code === 'ERR_TOO_LARGE' ? `lane line unavailable: ledger over ${BUILD_LEDGER_READ_MAX_BYTES} bytes` : `lane line unavailable: ${errorText(error)}`;
	}
	const mins = Math.floor(buildEnd.durationMs / REPORT_MILLISECONDS_PER_MINUTE);
	const cost = buildEnd.cost === null ? `cost unknown: ${buildEnd.costReason}` : `$${buildEnd.cost.toFixed(REPORT_COST_DIGITS)}`;
	return `${BUILD_RECORD_LINE_PREFIX} ${buildEnd.outcome}, exit ${buildEnd.exit}, ${mins} min, ${cost}; ${laneLine}`;
}

const w = parseWatchdogArgv(argv, { defaultRetries: 0 });
if (w.error) { if (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true }); process.stderr.write(w.error === 'usage' ? (laneMode || own.some((arg) => LANE_ONLY_FLAGS.includes(arg)) ? LANE_USAGE : USAGE) : `pi-worker: ${w.error}\n`); process.exit(1); }
if (laneMode && w.retries > 0) laneFailure('--retries greater than zero is refused in lane mode');
const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));
if (reviewFlag) {
	process.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\n`);
	process.exit(1);
}
if (w.retriesExplicit && !laneMode) process.stderr.write(RETRIES_NOTICE('pi-worker', w.retries));
if (w.retries > 0 && !laneMode) process.stderr.write(`pi-worker: --retries ${w.retries} — a re-attempt REPEATS any file mutations the failed attempt already made\n`);
if (laneMode) {
	acquireLaneLock(laneGitDir);
	keepBuildStart(w.outPath);
}
let r;
try {
	if (laneMode) {
		const preambleDir = path.dirname(preambleFile);
		try { r = await runWatchdog(WORKER_TAG, { ...w, maxSecs: maxArg, childEnv, validateAttempt: validateLaneAttempt }); }
		finally { rmSync(preambleDir, { recursive: true, force: true }); }
	} else r = await runWatchdog('pi-worker', { ...w, childEnv });
} catch (error) { if (laneLock) releaseLaneLock(laneLock); throw error; }
let outputError = null;
try {
	if (r.text.trim()) writeFileSync(w.outPath, r.text);
} catch (error) {
	outputError = error;
} finally {
	if (buildStartKept) keepBuildEnd(r, outputError);
	if (laneLock) { releaseLaneLock(laneLock); laneLock = null; }
}
const exit = outputError ? 1 : workerExit(r);
if (r.signal) process.stderr.write(`[pi-worker] aborted by ${r.signal}\n`);
else if (outputError) process.stderr.write(`[pi-worker] FAILED: cannot write ${w.outPath}: ${errorText(outputError)}\n`);
else process.stderr.write(r.ok
	? `[pi-worker] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath})\n`
	: r.ceiling ? `[pi-worker] FAILED: wall-clock ceiling ${maxArg}s reached\n` : `[pi-worker] FAILED after ${w.retries + 1} attempt(s) (endpoint likely in a bad stretch)\n`);
if (buildEndKept) process.stderr.write(`${buildEndLine()}\n`);
process.exit(exit);

function acquireLaneLock(gitDir) {
	laneLock = path.join(gitDir, 'nana-lane.lock');
	let fd;
	try {
		fd = openSync(laneLock, 'wx');
		writeFileSync(fd, `${process.pid}\n`);
		closeSync(fd);
		return;
	} catch (error) {
		if (fd !== undefined) { try { closeSync(fd); } catch {} }
		if (error.code === 'EEXIST') {
			let recordedPid = 'unreadable';
			try {
				const pid = Number(readFileSync(laneLock, 'utf8').trim());
				if (Number.isSafeInteger(pid) && pid > 0) recordedPid = String(pid);
			} catch { /* name the existing path and require explicit operator verification */ }
			laneFailure(`worktree lock ${laneLock} exists (recorded pid ${recordedPid}); confirm no builder and no pi process group for this worktree is running before removing the lock file by hand`);
		}
		laneFailure(`cannot acquire worktree lock ${laneLock}: ${error.message}`);
	}
}
function releaseLaneLock(lock) {
	if (!lock) return;
	try { if (Number(readFileSync(lock, 'utf8').trim()) === process.pid) rmSync(lock, { force: true }); } catch { /* best-effort handled-exit cleanup */ }
}
