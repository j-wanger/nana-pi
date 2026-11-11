#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/claude-review.mjs
 * @purpose Launch and record the roster's Claude Code reviewer with the shared prompt on standard input.
 * @inputs Review argv, user roster, brief, known bugs, review standard and carried Claude settings.
 * @outputs Review bytes, a version-2 verdict, diagnostics and the reviewer status.
 * @effects disk (settings, output and review store), process (Claude child and reservation heartbeat).
 * @errors Nonzero for bad inputs, launch or recording failure; preserves a nonzero reviewer status.
 */
import { readFileSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { resolve, join } from 'node:path';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { credentialStripEnv } from '../lib/credential-strip.mjs';
import { readReviewStandard } from '../lib/review-standard.mjs';
import { runReview } from '../lib/review-run.mjs';
import { resolveRoster } from './nana-roster.mjs';
import { admit, release, treeScope } from './review-round.mjs';
import { startLaneWatcher } from '../lib/lane-watcher.mjs';
import { CLAUDE_CODE_RUNTIME, DEFAULT_THINKING_TOKEN, CLAUDE_SETTING_SOURCES_FLAG, CLAUDE_BUILDER_SETTING_SOURCES, CLAUDE_SETTINGS_FLAG, CLAUDE_STRICT_MCP_FLAG, CLAUDE_EFFORT_FLAG, CLAUDE_BUILDER_CHILD_ENV, REVIEWER_CHILD_ENV } from './worker-config.mjs';
import { readClaudeBuilderSettings, writeClaudeBuilderSettings } from '../lib/claude-settings-carry.mjs';
import { reviewKnownBugSection } from '../lib/known-bug-digest.mjs';
import { appendContextLoad, contextPart, claudeInstructionParts } from '../lib/context-load-log.mjs';
import {
  CLAUDE_BIN,
  CLAUDE_PRINT_FLAG,
  CLAUDE_MODEL_FLAG,
  CLAUDE_ALLOW_FLAG,
  CLAUDE_DENY_FLAG,
  CLAUDE_SESSION_FLAG,
  CLAUDE_RESUME_FLAG,
  VERDICT_CONFIRMATION_PROMPT,
  REVIEWER_ALLOWED_TOOLS,
  REVIEWER_DENIED_TOOLS,
  REVIEW_SLOT,
  STANDARD_HEADING,
  renderReviewerSentence,
} from '../lib/claude-review-config.mjs';

const USAGE = 'usage: claude-review.mjs --item <slug> --tree <path> --brief <absolute-or-tree-relative-file> --out <file> [--role R]\n';
const REQUIRED = ['--item', '--tree', '--brief', '--out'];
const OPTIONAL = ['--role'];
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

if (process.argv.slice(2).some(arg => arg === '--over-cap' || arg.startsWith('--over-cap='))) die('--over-cap is retired: round caps were removed.');
const parsed = parseArgs(process.argv.slice(2));
if (parsed.problem) die(`${parsed.problem}\n${USAGE.trimEnd()}`);
const value = (name) => parsed.values.get(name);
if (value('--role') === 'land') die('--role land is retired; every lane has one reviewer plus CI.');
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
const knownBugs = reviewKnownBugSection(tree, null, brief.text);
const prompt = `${brief.text}\n\n${knownBugs.text === null ? '' : `${knownBugs.text}\n\n`}${STANDARD_HEADING}\n\n${standard.text}\n\n${renderReviewerSentence(value('--item'), tree)}\n`;
const ownArgs = ['--item', value('--item'), '--out', resolve(value('--out')), '--tree', tree];
for (const name of OPTIONAL) if (parsed.values.has(name)) ownArgs.push(name, value(name));
try { treeScope(tree); } catch (error) { die(error.message); }
// Admission precedes settings reads; the reservation belongs to this launcher, not an intermediary.
const admission = admit(ownArgs, { launcher: 'claude-review', model: reviewer.model, attempts: 1 });
if (!admission.ok) die(admission.message);
process.once('exit', () => release(admission.id));
const carry = readClaudeBuilderSettings({ ...CLAUDE_BUILDER_CHILD_ENV, ...REVIEWER_CHILD_ENV, ...credentialStripEnv(process.env) }, 'claude-review', reviewer.model, tree);
carry.effort = reviewer.effort ?? carry.effort;
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
const command = [CLAUDE_BIN, CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, reviewer.model, CLAUDE_ALLOW_FLAG, REVIEWER_ALLOWED_TOOLS, CLAUDE_DENY_FLAG, REVIEWER_DENIED_TOOLS,
  CLAUDE_SETTING_SOURCES_FLAG, CLAUDE_BUILDER_SETTING_SOURCES, CLAUDE_SETTINGS_FLAG, settingsFile, CLAUDE_STRICT_MCP_FLAG,
  ...(carry.effort ? [CLAUDE_EFFORT_FLAG, carry.effort] : [])];
const session = randomUUID();
const retryCommand = [...command, CLAUDE_RESUME_FLAG, session, '--tools', ''];
command.push(CLAUDE_SESSION_FLAG, session);
const parts = [contextPart('brief', briefPath, brief.text), ...knownBugs.parts, ...claudeInstructionParts({ cwd: tree }),
  contextPart('standard', standard.path, standard.text),
  { name: 'settings', source: carry.source, fullChars: carry.fullChars, deliveredChars: JSON.stringify(carry.settings).length }];
const status = await runReview(ownArgs, command, { admission, input: prompt,
  unreadRetry: { command: retryCommand, input: VERDICT_CONFIRMATION_PROMPT },
  onSpawn: () => appendContextLoad({ launcher: 'claude-review', role: 'reviewer', runtime: CLAUDE_CODE_RUNTIME, model: reviewer.model, effort: carry.effort, cwd: tree, item: value('--item'), parts }) });
process.exitCode = status;
cleanup();
