#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-worker.mjs
 * @purpose Run a pi worker under a liveness watchdog, with an optional fail-closed linked-worktree lane mode.
 * @inputs argv (--out, watchdog knobs, optional lane options, then `--` and pi args)
 * @outputs worker output written to --out and SUCCESS / FAILED diagnostics on stderr
 * @effects disk (writes output), process (spawns and may kill the pi child process group)
 * @errors exit 1 on bad args, invalid lane, failed worker, or exceeded lane ceiling
 */
import { accessSync, constants, existsSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';
import { LANE_DEFAULTS, LANE_MAX_SECS } from './worker-config.mjs';

const USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries 0] [--poll N] [--lane <name> --brief <file> [--max-secs N]] -- <pi args...>\n';
const all = process.argv;
const separator = all.indexOf('--');
const own = separator < 0 ? all : all.slice(0, separator);
const value = (flag) => { const at = own.indexOf(flag); return at < 0 ? null : own[at + 1] ?? null; };
const lane = value('--lane');
const brief = value('--brief');
const maxRaw = value('--max-secs');
const maxSecs = maxRaw === null ? LANE_MAX_SECS : Number(maxRaw);
const filteredOwn = own.filter((arg, i) => !['--lane', '--brief', '--max-secs'].includes(arg) && !['--lane', '--brief', '--max-secs'].includes(own[i - 1]));
const argv = [...filteredOwn, ...(separator < 0 ? [] : ['--', ...all.slice(separator + 1)])];

function git(...args) {
	return execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function laneFailure(reason) { process.stderr.write(`pi-worker: lane refused: ${reason}\n`); process.exit(1); }
function trusted(worktree) {
	const reader = new URL('../lib/objective.ts', import.meta.url).href;
	const shared = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `import { trustRecord } from ${JSON.stringify(reader)}; process.stdout.write(String(trustRecord(process.argv[1]).vouched));`, worktree], { encoding: 'utf8', env: process.env });
	return shared.status === 0 && shared.stdout.trim() === 'true';
}

let childEnv = {};
let maxArg;
if (lane !== null) {
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
	if (!Number.isSafeInteger(maxSecs) || maxSecs < 1) laneFailure('--max-secs must be a positive whole number');
	const briefPath = path.resolve(cwd, brief);
	let briefText;
	try {
		if (!statSync(briefPath).isFile()) laneFailure('brief must be a readable regular file');
		accessSync(briefPath, constants.R_OK);
		briefText = readFileSync(briefPath, 'utf8');
	} catch { laneFailure('brief must be a readable regular file'); }
	const preamblePath = new URL('../prompts/builder-preamble.md', import.meta.url);
	const preamble = readFileSync(preamblePath, 'utf8').replaceAll('{{WORKTREE}}', cwd).replaceAll('{{BRANCH}}', branch);
	const piArgs = argv.slice(argv.indexOf('--') + 1);
	const option = (flags) => flags.some((flag) => piArgs.includes(flag));
	for (const [flag, value] of [['--provider', LANE_DEFAULTS.provider], ['--model', LANE_DEFAULTS.model], ['--thinking', LANE_DEFAULTS.thinking]]) {
		if (!option([flag])) piArgs.unshift(flag, value);
	}
	const toolFlag = piArgs.findIndex((arg) => arg === '-t' || arg === '--tools');
	if (toolFlag < 0) piArgs.unshift('-t', LANE_DEFAULTS.tools);
	else {
		const tools = (piArgs[toolFlag + 1] ?? '').split(',');
		if (!tools.includes('edit') || !tools.includes('write')) laneFailure('tool list must include edit and write');
	}
	const existing = piArgs.indexOf('--append-system-prompt');
	const insert = existing < 0 ? piArgs.length : existing;
	piArgs.splice(insert, 0, '--append-system-prompt', preamble, '--append-system-prompt', briefText);
	argv.splice(argv.indexOf('--') + 1, argv.length, ...piArgs);
	childEnv = { NANA_WORKTREE_ROOT: cwd, NANA_ROLE: 'worker' };
	maxArg = maxSecs;
	if (!trusted(cwd)) process.stderr.write(`trust: none for ${cwd} — project post-edit checks are inert (nana-setup trust ${cwd})\n`);
}
function fsReal(p) { return realpathSync(p); }

const w = parseWatchdogArgv(argv, { defaultRetries: 0 });
if (w.error) { process.stderr.write(w.error === 'usage' ? USAGE : `pi-worker: ${w.error}\n`); process.exit(1); }
const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));
if (reviewFlag) {
	process.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\n`);
	process.exit(1);
}
if (w.retriesExplicit) process.stderr.write(RETRIES_NOTICE('pi-worker', w.retries));
if (w.retries > 0) process.stderr.write(`pi-worker: --retries ${w.retries} — a re-attempt REPEATS any file mutations the failed attempt already made\n`);
const r = await runWatchdog('pi-worker', { ...w, ...(maxArg ? { maxSecs: maxArg } : {}), childEnv });
if (r.text.trim()) writeFileSync(w.outPath, r.text);
if (r.signal) { process.stderr.write(`[pi-worker] aborted by ${r.signal}\n`); process.exit({ SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[r.signal] ?? 1); }
process.stderr.write(r.ok
	? `[pi-worker] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath})\n`
	: r.ceiling ? `[pi-worker] FAILED: wall-clock ceiling ${maxArg}s reached\n` : `[pi-worker] FAILED after ${w.retries + 1} attempt(s) (endpoint likely in a bad stretch)\n`);
process.exit(r.ok ? 0 : 1);
