#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-worker.mjs
 * @purpose Run a pi worker under a liveness watchdog, with an optional fail-closed linked-worktree lane mode.
 * @inputs argv (--out, watchdog knobs, optional lane options, then `--` and pi args)
 * @outputs worker output written to --out and SUCCESS / FAILED diagnostics on stderr
 * @effects disk (writes output), process (spawns and may kill the pi child process group)
 * @errors exit 1 on bad args, invalid lane, failed worker, or exceeded lane ceiling
 */
import { accessSync, closeSync, constants, existsSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';
import { LANE_DEFAULTS, LANE_MAX_SECS } from './worker-config.mjs';

const USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const LANE_USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries 0] [--poll N] --lane <name> --brief <file> [--max-secs N]\n';
const all = process.argv;
const separator = all.indexOf('--');
const own = separator < 0 ? all : all.slice(0, separator);
const value = (flag) => { const at = own.indexOf(flag); return at < 0 ? null : own[at + 1] ?? null; };
const lanePresent = own.includes('--lane');
const briefPresent = own.includes('--brief');
const maxPresent = own.includes('--max-secs');
const laneMode = lanePresent;
const lane = value('--lane');
const brief = value('--brief');
const maxRaw = value('--max-secs');
const maxSecs = maxRaw === null ? LANE_MAX_SECS : Number(maxRaw);
const filteredOwn = own.filter((arg, i) => !['--lane', '--brief', '--max-secs'].includes(arg) && !['--lane', '--brief', '--max-secs'].includes(own[i - 1]));
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

let childEnv = {};
let maxArg;
let laneRoot, laneGitDir, briefPath, preambleFile, laneLock;
let validateLaneAttempt = () => null;
for (const [flag, present, arg] of [['--lane', lanePresent, lane], ['--brief', briefPresent, brief], ['--max-secs', maxPresent, maxRaw]]) {
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
	const retryAt = own.indexOf('--retries');
	if (retryAt >= 0 && Number(own[retryAt + 1]) > 0) laneFailure('--retries greater than zero is refused in lane mode');
	if (!Number.isSafeInteger(maxSecs) || maxSecs < 1) laneFailure('--max-secs must be a positive whole number');
	briefPath = fsReal(path.resolve(cwd, brief));
	try {
		if (!statSync(briefPath).isFile()) laneFailure('brief must be a readable regular file');
		accessSync(briefPath, constants.R_OK);
	} catch { laneFailure('brief must be a readable regular file'); }
	if (separator >= 0 && all.slice(separator + 1).length) laneFailure('caller pi arguments are refused in lane mode');
	const preamblePath = new URL('../prompts/builder-preamble.md', import.meta.url);
	const preamble = readFileSync(preamblePath, 'utf8').replaceAll('{{WORKTREE}}', cwd).replaceAll('{{BRANCH}}', branch);
	laneRoot = cwd; laneGitDir = dirs[0];
	const preambleDir = mkdtempSync(path.join(tmpdir(), 'nana-lane-preamble-'));
	preambleFile = path.join(preambleDir, 'preamble.md');
	writeFileSync(preambleFile, preamble);
	const piArgs = ['--provider', LANE_DEFAULTS.provider, '--model', LANE_DEFAULTS.model, '--thinking', LANE_DEFAULTS.thinking, '-t', LANE_DEFAULTS.tools, '--append-system-prompt', preambleFile, '--append-system-prompt', briefPath, '-p', `Do the work in your brief for lane ${lane}. Your cwd is the lane worktree. Finish with the report shape the brief gives.`];
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
function fsReal(p) { return realpathSync(p); }

const w = parseWatchdogArgv(argv, { defaultRetries: 0 });
if (w.error) { if (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true }); process.stderr.write(w.error === 'usage' ? (laneMode || own.some((arg) => ['--lane', '--brief', '--max-secs'].includes(arg)) ? LANE_USAGE : USAGE) : `pi-worker: ${w.error}\n`); process.exit(1); }
if (laneMode && w.retries > 0) laneFailure('--retries greater than zero is refused in lane mode');
const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));
if (reviewFlag) {
	process.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\n`);
	process.exit(1);
}
if (w.retriesExplicit && !laneMode) process.stderr.write(RETRIES_NOTICE('pi-worker', w.retries));
if (w.retries > 0 && !laneMode) process.stderr.write(`pi-worker: --retries ${w.retries} — a re-attempt REPEATS any file mutations the failed attempt already made\n`);
if (laneMode) acquireLaneLock(laneGitDir);
let r;
try {
	if (laneMode) {
		const preambleDir = path.dirname(preambleFile);
		try { r = await runWatchdog('pi-worker', { ...w, maxSecs: maxArg, childEnv, validateAttempt: validateLaneAttempt }); }
		finally { rmSync(preambleDir, { recursive: true, force: true }); }
	} else r = await runWatchdog('pi-worker', { ...w, childEnv });
} catch (error) { if (laneLock) releaseLaneLock(laneLock); throw error; }
try { if (r.text.trim()) writeFileSync(w.outPath, r.text); }
finally { if (laneLock) { releaseLaneLock(laneLock); laneLock = null; } }
if (r.signal) { process.stderr.write(`[pi-worker] aborted by ${r.signal}\n`); process.exit({ SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[r.signal] ?? 1); }
process.stderr.write(r.ok
	? `[pi-worker] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath})\n`
	: r.ceiling ? `[pi-worker] FAILED: wall-clock ceiling ${maxArg}s reached\n` : `[pi-worker] FAILED after ${w.retries + 1} attempt(s) (endpoint likely in a bad stretch)\n`);
process.exit(r.ok ? 0 : 1);

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
