#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/claude-review.mjs
 * @purpose Launch the roster's Claude Code reviewer through review-ledger with the shared review prompt on standard input.
 * @inputs argv (--item, --tree, --brief relative to --tree, --out, optional --role and --over-cap), the user roster, the brief, review standard and HEAD's tree movement.
 * @outputs the review-ledger run stderr and output file, one recorded round on success, and review-ledger's exit status.
 * @effects disk (reads roster, brief and standard; review-ledger writes its output and records), process (computes movement with git and scripts/requirements-moved.mjs, then spawns review-ledger and its Claude Code child).
 * @errors exit 1 for bad arguments, a refused roster or non-Claude reviewer, an unreadable or blank input, or review-ledger failure; no stack is printed.
 */
import { readFileSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { readReviewStandard } from '../lib/review-standard.mjs';
import { reviewMovementSection } from '../lib/review-movement.mjs';
import { resolveRoster } from './nana-roster.mjs';
import { project } from './review-round.mjs';
import { startLaneWatcher } from '../lib/lane-watcher.mjs';
import { CLAUDE_CODE_RUNTIME, DEFAULT_THINKING_TOKEN, CLAUDE_SETTING_SOURCES_FLAG, CLAUDE_BUILDER_SETTING_SOURCES, CLAUDE_SETTINGS_FLAG, CLAUDE_STRICT_MCP_FLAG, CLAUDE_EFFORT_FLAG, CLAUDE_BUILDER_CHILD_ENV, REVIEWER_CHILD_ENV } from './worker-config.mjs';
import { readClaudeBuilderSettings, writeClaudeBuilderSettings } from '../lib/claude-settings-carry.mjs';
import { reviewKnownBugSection } from '../lib/known-bug-digest.mjs';
import { appendContextLoad, contextPart } from '../lib/context-load-log.mjs';
import {
  CLAUDE_BIN,
  CLAUDE_PRINT_FLAG,
  CLAUDE_MODEL_FLAG,
  CLAUDE_ALLOW_FLAG,
  CLAUDE_DENY_FLAG,
  REVIEWER_ALLOWED_TOOLS,
  REVIEWER_DENIED_TOOLS,
  REVIEW_SLOT,
  STANDARD_HEADING,
  renderReviewerSentence,
} from '../lib/claude-review-config.mjs';

const USAGE = 'usage: claude-review.mjs --item <slug> --tree <path> --brief <file-relative-to-tree> --out <file> [--role R] [--over-cap WHY]\n';
const LEDGER = fileURLToPath(new URL('./review-ledger.mjs', import.meta.url));
const REQUIRED = ['--item', '--tree', '--brief', '--out'];
const OPTIONAL = ['--role', '--over-cap'];
const ALLOWED = new Set([...REQUIRED, ...OPTIONAL]);
const die = (message) => {
  process.stderr.write(`claude-review: ${message}\n`);
  process.exit(1);
};

function parseArgs(argv) {
  const values = new Map();
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i];
    const value = argv[i + 1];
    if (!ALLOWED.has(name)) return { problem: name ? `unknown option ${name}` : 'missing option' };
    if (values.has(name)) return { problem: `${name} was given more than once` };
    if (value === undefined || value.length === 0 || value.startsWith('--')) return { problem: `${name} needs a value` };
    values.set(name, value);
  }
  for (const name of REQUIRED) if (!values.has(name)) return { problem: `${name} is required` };
  return { values };
}

function readRequiredFile(path, label) {
  try {
    if (!statSync(path).isFile()) return { problem: `${label} ${path} is not a regular file` };
    const text = readFileSync(path, 'utf8');
    if (!text.trim()) return { problem: `${label} ${path} is blank` };
    return { text };
  } catch (error) {
    return { problem: error?.code === 'ENOENT' ? `${label} ${path} is missing` : `${label} ${path} is unreadable (${String(error?.message ?? error)})` };
  }
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.problem) die(`${parsed.problem}\n${USAGE.trimEnd()}`);
const value = (name) => parsed.values.get(name);
const tree = resolve(process.cwd(), value('--tree'));
const briefPath = resolve(tree, value('--brief'));

const rosterResult = resolveRoster(piAgentDir());
if (!rosterResult.ok) die(`roster refused: ${rosterResult.file}: ${rosterResult.problem}`);
const reviewer = rosterResult.roster[REVIEW_SLOT];
if (reviewer?.runtime !== CLAUDE_CODE_RUNTIME) {
  const entry = reviewer && typeof reviewer === 'object'
    ? `${reviewer.provider} ${reviewer.model} ${reviewer.thinking ?? DEFAULT_THINKING_TOKEN}`
    : JSON.stringify(reviewer);
  die(`roster.${REVIEW_SLOT} is not a Claude Code entry (got ${entry}); use pi-review for this entry, or run nana-roster set reviewer claude-code <model>`);
}

const brief = readRequiredFile(briefPath, 'brief');
if (brief.problem) die(brief.problem);
const standard = readReviewStandard();
if (standard.problem) die(`review standard refused: ${standard.problem}`);
const movement = reviewMovementSection(tree);
const knownBugs = reviewKnownBugSection(tree, movement, brief.text);
const prompt = `${brief.text}\n\n${movement === null ? '' : `${movement}\n\n`}${knownBugs.text === null ? '' : `${knownBugs.text}\n\n`}${STANDARD_HEADING}\n\n${standard.text}\n\n${renderReviewerSentence(value('--item'), tree)}\n`;

const ledgerArgs = [LEDGER, 'run', '--item', value('--item'), '--out', value('--out'), '--tree', tree];
for (const name of OPTIONAL) if (parsed.values.has(name)) ledgerArgs.push(name, value(name));
// Reuse the ledger's non-mutating refusal checks before creating credential-bearing flag settings.
// The actual admission remains authoritative, including an explicit over-cap override.
const preflight = project(ledgerArgs.slice(2));
if (!preflight.ok && !(parsed.values.has('--over-cap') && preflight.message.includes('over the cap'))) die(preflight.message);
const carry = readClaudeBuilderSettings({ ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV }, 'claude-review', reviewer.model);
process.stderr.write(`${carry.line}\n`);
const folder = mkdtempSync(join(tmpdir(), 'nana-claude-review-'));
const settingsFile = join(folder, 'reviewer-settings.json');
// Windows SIGTERM is a forced process stop, so exit handlers cannot remove credentials.
// Reuse the precedent's cleanup-only mode (no build and no builder pid record). The absent
// lock sentinel is inside this private folder, so the watcher can never release a lane lock.
if (process.platform === 'win32') startLaneWatcher({ folder, lock: join(folder, 'unused-reviewer.lock'), workerPid: process.pid, commonDir: folder, cwd: tree });
const cleanup = () => { try { rmSync(folder, { recursive: true, force: true }); } catch {} };
process.once('exit', cleanup);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(signal, () => { cleanup(); process.exit({ SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[signal]); });
writeClaudeBuilderSettings(settingsFile, carry);
ledgerArgs.push('--', CLAUDE_BIN, CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, reviewer.model, CLAUDE_ALLOW_FLAG, REVIEWER_ALLOWED_TOOLS, CLAUDE_DENY_FLAG, REVIEWER_DENIED_TOOLS,
  CLAUDE_SETTING_SOURCES_FLAG, CLAUDE_BUILDER_SETTING_SOURCES, CLAUDE_SETTINGS_FLAG, settingsFile, CLAUDE_STRICT_MCP_FLAG,
  ...(carry.effort ? [CLAUDE_EFFORT_FLAG, carry.effort] : []));
const parts = [contextPart('brief', briefPath, brief.text), ...knownBugs.parts,
  contextPart('standard', standard.path, standard.text),
  { name: 'settings', source: carry.source, fullChars: carry.fullChars, deliveredChars: JSON.stringify(carry.settings).length }];
if (movement !== null) parts.push(contextPart('movement', tree, movement));
const child = spawn(process.execPath, ledgerArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
child.once('spawn', () => appendContextLoad({ launcher: 'claude-review', role: 'reviewer', runtime: CLAUDE_CODE_RUNTIME, model: reviewer.model, effort: carry.effort, cwd: tree, item: value('--item'), parts }));
child.stdin.on('error', () => { /* review-ledger may refuse or fail before reading the prompt */ });
child.on('error', (error) => die(`cannot start review-ledger: ${error.code ?? error.message}`));
child.stdin.end(prompt);
const status = await new Promise((done) => child.on('close', (code) => done(code)));
process.exit(status ?? 1);
