/**
 * @module packages/nana-pack/lib/roster-set.mjs
 * @purpose Replace one roster slot in the user-scope nana-pack.json by renaming a fully written temporary file over the real target, keeping every other member and a backup.
 * @inputs pi's active agent dir, the `set` command's slot and token arguments, and optionally an env object plus a writeTemp(fd, text) and a rename(from, to) seam for tests
 * @outputs setRosterSlot(agentDir, args, opts) -> {ok:true, file, roster, previousTokens} | {ok:false, problem}
 * @effects disk (reads the user-scope nana-pack.json, writes a temporary file in the real target's folder, may write nana-pack.json.bak in the agent dir, and replaces the user-scope nana-pack.json)
 * @errors never throws; every failure, including a mid-write throw, is caught and returned as {ok:false, problem} naming the guard, the slot or field, or the file
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readBounded, BOUNDED_READ_CAP } from './bounded-read.mjs';
import { parseJsonBytes } from './json-text.mjs';
import { resolveRoster, validateRosterShape, orderedRoster, formatRosterLines } from '../bin/nana-roster.mjs';
import { PI_MODEL_SHELL_ENV, SLOT_NULL_TOKENS, DEFAULT_THINKING_TOKEN, CLAUDE_CODE_RUNTIME, SLOT_PRINT_ORDER } from '../bin/worker-config.mjs';

// chosen: the mode a brand-new nana-pack.json gets when none exists yet, matching this repo's
// "what Claude Code itself writes" default (packages/nana-setup/lib/steps.mjs:357). An existing
// file's own mode is read and kept instead (known limit 9: kept, not pinned).
const NEW_FILE_MODE = 0o600;

/** The value `set`'s tokens describe for one already-known slot, or a problem naming it. */
function parseEntry(slot, tokens) {
  if (tokens.length === 3) {
    const [provider, model, thinking] = tokens;
    return { value: { provider, model, thinking: thinking === DEFAULT_THINKING_TOKEN ? null : thinking } };
  }
  if (tokens.length === 2 && tokens[0] === CLAUDE_CODE_RUNTIME) {
    return { value: { runtime: CLAUDE_CODE_RUNTIME, model: tokens[1] } };
  }
  if (tokens.length === 1 && tokens[0] === SLOT_NULL_TOKENS[slot]) {
    return { value: null };
  }
  return { problem: `${slot}: tokens are not a printed entry (set <slot>[:] <provider> <model> <level|default>, "claude-code <model>", or the printed null token)` };
}

/** The tokens `nana-roster` would print for one slot of an already-resolved roster. */
function slotTokens(roster, slot) {
  const line = formatRosterLines(roster, '').find((candidate) => candidate.startsWith(`${slot}: `));
  return line.slice(slot.length + 2);
}

/**
 * Replace one roster slot in the user-scope nana-pack.json (Design's ten steps): (1) the
 * pi-model-shell guard; (2) resolve the current roster, re-prefixing any refusal; (3) parse the
 * slot and its tokens into a candidate entry; (4) the previous roster with that slot replaced,
 * in print order; (5) validate the whole candidate roster's shape; (6) read the raw top-level
 * object (BOM stripped; `{}` when absent) and replace its `roster` member; (7) serialize it;
 * (8) write a temporary file in the real target's own folder; (9) back up an existing target;
 * (10) rename the temporary file over the real target. Any throw from (6) on removes the
 * temporary file and refuses, naming the file.
 */
export function setRosterSlot(agentDir, args, {
  env = process.env,
  writeTemp = (fd, text) => fs.writeFileSync(fd, text, 'utf8'),
  rename = (from, to) => fs.renameSync(from, to),
} = {}) {
  if (env[PI_MODEL_SHELL_ENV]) {
    return { ok: false, problem: `refused inside a pi model shell: ${PI_MODEL_SHELL_ENV} is set` };
  }

  const file = path.join(agentDir, 'nana-pack.json');
  const base = resolveRoster(agentDir);
  if (!base.ok) return { ok: false, problem: `${base.file}: ${base.problem}` };

  const [rawSlot, ...tokens] = args;
  const slot = rawSlot ? rawSlot.replace(/:$/, '') : '';
  if (!slot) return { ok: false, problem: 'no slot named' };
  if (!SLOT_PRINT_ORDER.includes(slot)) return { ok: false, problem: `no such roster slot ${slot}` };

  const parsed = parseEntry(slot, tokens);
  if (parsed.problem) return { ok: false, problem: parsed.problem };

  const nextRoster = orderedRoster({ ...base.roster, [slot]: parsed.value });
  const { roster: validated, problem } = validateRosterShape(nextRoster);
  if (problem) return { ok: false, problem };

  let raw = {};
  let existed = false;
  let targetPath = file;
  let mode = NEW_FILE_MODE;
  try {
    targetPath = fs.realpathSync(file);
    existed = true;
    mode = fs.statSync(targetPath).mode & 0o777;
    const buf = readBounded(targetPath, BOUNDED_READ_CAP);
    raw = parseJsonBytes(buf);
  } catch (err) {
    if (err?.code !== 'ENOENT') return { ok: false, problem: `${file}: ${String(err?.message ?? err)}` };
    raw = {};
    existed = false;
    targetPath = file;
  }
  raw.roster = validated;
  const text = `${JSON.stringify(raw, null, 2)}\n`;

  const targetDir = path.dirname(targetPath);
  const temp = path.join(targetDir, `.nana-pack.json.${process.pid}.tmp`);
  let tempCreated = false;
  try {
    const fd = fs.openSync(temp, 'wx', mode);
    tempCreated = true;
    try {
      writeTemp(fd, text);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    if (existed) fs.copyFileSync(targetPath, path.join(agentDir, 'nana-pack.json.bak'));
    rename(temp, targetPath);
  } catch (err) {
    if (tempCreated) { try { fs.unlinkSync(temp); } catch { /* best effort */ } }
    return { ok: false, problem: `${file}: ${String(err?.message ?? err)}` };
  }

  return { ok: true, file, roster: validated, previousTokens: slotTokens(base.roster, slot) };
}
