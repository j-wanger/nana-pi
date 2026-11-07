/**
 * @module packages/nana-pack/lib/roster-set.mjs
 * @purpose Replace one roster slot in the user-scope nana-pack.json by renaming a fully written temporary file over the real target, keeping every other member and a backup.
 * @inputs pi's active agent dir, the `set` command's slot and token arguments, and optionally an env object plus a writeTemp(fd, text) and a rename(from, to) seam for tests
 * @outputs setRosterSlot(agentDir, args, opts) -> {ok:true, file, roster, lanes, previousTokens} | {ok:false, problem}
 * @effects disk (reads the user-scope nana-pack.json, writes a temporary file in the real target's folder, may write nana-pack.json.bak in the agent dir, and replaces the user-scope nana-pack.json)
 * @errors never throws; every failure, including a mid-write throw, is caught and returned as {ok:false, problem} naming the guard, the slot or field, or the file
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseJsonBytes } from './json-text.mjs';
import { writePackConfigMember } from './pack-config-write.mjs';
import { resolveRoster, validateRosterShape, orderedRoster, formatRosterLines } from '../bin/nana-roster.mjs';
import { PI_MODEL_SHELL_ENV, SLOT_NULL_TOKENS, DEFAULT_THINKING_TOKEN, CLAUDE_CODE_RUNTIME, SLOT_PRINT_ORDER, ROSTER_SLOTS, LEGACY_ROSTER_SLOTS } from '../bin/worker-config.mjs';

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
  writeTemp,
  rename,
} = {}) {
  if (env[PI_MODEL_SHELL_ENV]) {
    return { ok: false, problem: `refused inside a pi model shell: ${PI_MODEL_SHELL_ENV} is set` };
  }

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

  // Preserve the old write shape and raw legacy values; normalization must not opt
  // another checkout into new optional roles or remove its required land member.
  let raw;
  try { raw = parseJsonBytes(readFileSync(join(agentDir, 'nana-pack.json'))); }
  catch (error) { if (error?.code !== 'ENOENT') return { ok: false, problem: `${join(agentDir, 'nana-pack.json')}: ${error.message}` }; }
  const writeSlots = new Set([...ROSTER_SLOTS, ...Object.keys(raw?.roster ?? {}), slot]);
  const written = { ...Object.fromEntries(Object.entries(validated).filter(([key]) => writeSlots.has(key))), land: raw?.roster?.land ?? null };
  for (const legacy of LEGACY_ROSTER_SLOTS) if (Object.hasOwn(raw?.roster ?? {}, legacy)) written[legacy] = raw.roster[legacy];
  const result = writePackConfigMember(agentDir, 'roster', written, { writeTemp, rename });
  if (!result.ok) return result;
  return { ...result, roster: validated, lanes: base.lanes, previousTokens: slotTokens(base.roster, slot) };
}
