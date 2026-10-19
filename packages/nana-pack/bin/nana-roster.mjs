#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-roster.mjs
 * @purpose Resolve and print this machine's roster from the user-scope nana-pack.json.
 * @inputs an agent dir (the CLI reads pi's active one) and its nana-pack.json, when present
 * @outputs resolveRoster(agentDir) -> {ok:true, roster, source} | {ok:false, file, problem};
 *  orderedRoster(roster) -> the roster with every slot in SLOT_PRINT_ORDER; the CLI prints one
 *  line per slot and a source line on stdout, or with --json one JSON object {roster: ...}, or
 *  the refusal on stderr
 * @effects disk (reads the user-scope nana-pack.json; the CLI's `set` subcommand, dynamically
 *  loaded, replaces it and may write nana-pack.json.bak)
 * @errors resolveRoster never throws; the CLI exits 1 on a refused roster or a refused `set`
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBounded, BOUNDED_READ_CAP } from '../lib/bounded-read.mjs';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { ROSTER_DEFAULTS, ROSTER_SLOTS, NULLABLE_SLOTS, OPTIONAL_SLOTS, CLAUDE_CODE_SLOTS, CLAUDE_CODE_RUNTIME, CLAUDE_CODE_SUBAGENT_MODELS, SLOT_PRINT_ORDER, THINKING_LEVELS, SLOT_NULL_TOKENS, DEFAULT_THINKING_TOKEN } from './worker-config.mjs';

const ENTRY_FIELDS = Object.freeze(['provider', 'model', 'thinking']);

function isLink(p) {
  try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; }
}

/** Read the user-scope file. Returns {kind:'absent'} | {kind:'refused', problem} | {kind:'read', text}. */
function readRosterFile(file) {
  let buf;
  try {
    buf = readBounded(file, BOUNDED_READ_CAP);
  } catch (err) {
    const code = err?.code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      // Absent only when nothing is there at all. A dangling symlink EXISTS as a policy file
      // that cannot be read, so it is refused, never silently treated as absent.
      if (isLink(file)) return { kind: 'refused', problem: `dangling symlink: ${file}` };
      return { kind: 'absent' };
    }
    if (code === 'EISDIR') return { kind: 'refused', problem: `${file} is a directory, not a regular file` };
    if (code === 'ERR_NOT_REGULAR') return { kind: 'refused', problem: `${file} is not a regular file` };
    if (code === 'ERR_TOO_LARGE') return { kind: 'refused', problem: `${file} exceeds the ${BOUNDED_READ_CAP}-byte bounded read cap` };
    return { kind: 'refused', problem: `${file} is unreadable (${code ?? err?.message ?? 'error'})` };
  }
  return { kind: 'read', text: buf.toString('utf8') };
}

function kindOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value;
}

/** Validate one Claude Code entry ({runtime, model}). Returns a problem string or null. */
function claudeCodeEntryProblem(slot, value) {
  const keys = Object.keys(value);
  const extra = keys.filter((k) => !['runtime', 'model'].includes(k));
  if (extra.length) return `roster.${slot} has an unexpected field ${extra.join(', ')}`;
  if (!('model' in value)) return `roster.${slot} is missing model`;
  if (!CLAUDE_CODE_SUBAGENT_MODELS.includes(value.model)) {
    return `roster.${slot}.model must be one of the Claude Code subagent model names (got ${JSON.stringify(value.model)})`;
  }
  return null;
}

/**
 * Validate one entry (or, for a nullable or optional slot, null). A slot in CLAUDE_CODE_SLOTS
 * whose value carries a `runtime` field is read as a Claude Code entry; every other slot, and
 * every other value, is read as a pi entry, so a stray `runtime` field on a pi-only slot is
 * refused as an unexpected field rather than silently accepted. Returns a problem string or null.
 */
function entryProblem(slot, value) {
  if (value === null) {
    return NULLABLE_SLOTS.includes(slot) || OPTIONAL_SLOTS.includes(slot) ? null : `roster.${slot} is not an entry (null)`;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return `roster.${slot} is not an entry (got ${kindOf(value)})`;
  }
  if (CLAUDE_CODE_SLOTS.includes(slot) && 'runtime' in value) {
    if (value.runtime !== CLAUDE_CODE_RUNTIME) {
      return `roster.${slot}.runtime must be "${CLAUDE_CODE_RUNTIME}" (got ${JSON.stringify(value.runtime)})`;
    }
    return claudeCodeEntryProblem(slot, value);
  }
  const keys = Object.keys(value);
  const missing = ENTRY_FIELDS.filter((f) => !(f in value));
  if (missing.length) return `roster.${slot} is missing ${missing.join(', ')}`;
  const extra = keys.filter((k) => !ENTRY_FIELDS.includes(k));
  if (extra.length) return `roster.${slot} has an unexpected field ${extra.join(', ')}`;
  for (const field of ['provider', 'model']) {
    const v = value[field];
    if (typeof v !== 'string' || v.length === 0 || /[\s\x00-\x1f\x7f-\x9f]/.test(v)) {
      return `roster.${slot}.${field} must be a non-empty string with no whitespace or control character (got ${JSON.stringify(v)})`;
    }
  }
  if (value.thinking !== null && !THINKING_LEVELS.includes(value.thinking)) {
    return `roster.${slot}.thinking must be one of pi's thinking levels or null (got ${JSON.stringify(value.thinking)})`;
  }
  return null;
}

/**
 * Validate the whole roster value (the parsed `roster` field). Returns {roster} or {problem}.
 * The returned roster is a NORMALISED copy: an absent optional slot (R-1121) reads back as null,
 * so every reader — the roster command, pi-worker and the notice — sees one form.
 */
export function validateRosterShape(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { problem: `roster must be an object with ${ROSTER_SLOTS.join(', ')} (got ${kindOf(value)})` };
  }
  const keys = Object.keys(value);
  const missing = ROSTER_SLOTS.filter((s) => !(s in value));
  if (missing.length) return { problem: `roster is missing ${missing.join(', ')}` };
  const allowedSlots = [...ROSTER_SLOTS, ...OPTIONAL_SLOTS];
  const extra = keys.filter((k) => !allowedSlots.includes(k));
  if (extra.length) return { problem: `roster has an unexpected field ${extra.join(', ')}` };
  for (const slot of allowedSlots) {
    if (!(slot in value)) continue;
    const problem = entryProblem(slot, value[slot]);
    if (problem) return { problem };
  }
  const normalised = { ...value };
  for (const slot of OPTIONAL_SLOTS) if (!(slot in normalised)) normalised[slot] = null;
  return { roster: normalised };
}

/**
 * Resolve the roster for one agent dir. Never throws. Absent file or a file with no `roster` key
 * yields the default roster (R-1120); a valid roster replaces every slot exactly as written
 * (R-1121); anything else is refused, naming the file and the failing slot or field (R-1122).
 */
export function resolveRoster(agentDir) {
  const file = path.join(agentDir, 'nana-pack.json');
  const state = readRosterFile(file);
  if (state.kind === 'absent') return { ok: true, roster: ROSTER_DEFAULTS, source: 'default' };
  if (state.kind === 'refused') return { ok: false, file, problem: state.problem };
  let raw;
  try {
    raw = JSON.parse(state.text.replace(/^﻿/, ''));
  } catch (err) {
    return { ok: false, file, problem: `invalid JSON (${String(err?.message ?? err).slice(0, 160)})` };
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, file, problem: `top level is not an object (got ${kindOf(raw)})` };
  }
  if (raw.roster === undefined) return { ok: true, roster: ROSTER_DEFAULTS, source: 'default' };
  const { roster, problem } = validateRosterShape(raw.roster);
  if (problem) return { ok: false, file, problem };
  return { ok: true, roster, source: file };
}

/** Format the resolved roster as R-1123's lines: one per slot, in print order, then the source. */
export function formatRosterLines(roster, source) {
  const lines = SLOT_PRINT_ORDER.map((slot) => {
    const value = roster[slot];
    if (value === null) return `${slot}: ${SLOT_NULL_TOKENS[slot]}`;
    if (value.runtime === CLAUDE_CODE_RUNTIME) return `${slot}: ${CLAUDE_CODE_RUNTIME} ${value.model}`;
    return `${slot}: ${value.provider} ${value.model} ${value.thinking ?? DEFAULT_THINKING_TOKEN}`;
  });
  lines.push(`source: ${source}`);
  return lines;
}

/** The resolved roster with every slot in SLOT_PRINT_ORDER (R-1192). */
export function orderedRoster(roster) {
  return Object.fromEntries(SLOT_PRINT_ORDER.map((slot) => [slot, roster[slot]]));
}

async function main() {
  if (process.argv[2] === 'set') {
    const { setRosterSlot } = await import('../lib/roster-set.mjs');
    const setArgs = process.argv.slice(3);
    const result = setRosterSlot(piAgentDir(), setArgs);
    if (!result.ok) {
      process.stderr.write(`nana-roster: set refused: ${result.problem}\n`);
      process.exit(1);
    }
    for (const line of formatRosterLines(result.roster, result.file)) process.stdout.write(`${line}\n`);
    const slot = (setArgs[0] ?? '').replace(/:$/, '');
    process.stderr.write(`nana-roster: ${slot} was: ${result.previousTokens}\n`);
    process.exit(0);
  }
  const json = process.argv.includes('--json');
  const result = resolveRoster(piAgentDir());
  if (!result.ok) {
    process.stderr.write(`nana-roster: roster refused: ${result.file}: ${result.problem}\n`);
    process.exit(1);
  }
  if (json) {
    process.stdout.write(`${JSON.stringify({ roster: orderedRoster(result.roster) })}\n`);
    process.exit(0);
  }
  for (const line of formatRosterLines(result.roster, result.source)) process.stdout.write(`${line}\n`);
  process.exit(0);
}

if (process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
