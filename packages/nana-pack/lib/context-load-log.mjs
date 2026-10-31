/**
 * @module packages/nana-pack/lib/context-load-log.mjs
 * @purpose Append private best-effort context delivery measurements outside every git worktree.
 * @inputs Delivery metadata, explicit log path or active agent dir, clock and diagnostic sink.
 * @outputs One versioned JSON line or one skip diagnostic and result.
 * @effects disk (checks path ancestors and appends a log), process (stderr diagnostic)
 * @errors Never throws; all append and path failures become one skip diagnostic.
 */
import { lstatSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { piAgentDir, piAgentDirIsCwdRelative } from './agent-dir.mjs';
import { realPath } from './real-path.mjs';
import { appendLedgerRecord } from './record-ledger.mjs';

export const CONTEXT_LOAD_FILE = 'nana-context-loads.jsonl'; // contract: A-089, R-3215
export function contextPart(name, source, full, delivered = full) {
  return { name, source, fullChars: full.length, deliveredChars: delivered.length };
}
export function appendContextLoad(record, { file = join(piAgentDir(), CONTEXT_LOAD_FILE), relative = piAgentDirIsCwdRelative(), now = () => new Date().toISOString(), warn = text => process.stderr.write(`${text}\n`) } = {}) {
  try {
    if (relative) throw new Error('cwd-relative agent dir');
    let parent = dirname(realPath(file));
    for (;;) {
      try { lstatSync(join(parent,'.git')); throw new Error('log path is inside a git worktree'); }
      catch (e) { if (!['ENOENT','ENOTDIR'].includes(e.code)) throw e; }
      const next = dirname(parent); if (next === parent) break; parent = next;
    }
    const result = appendLedgerRecord(file, { ...record, v: 1, at: now() });
    if (!result.ok) throw result.error;
    return result;
  } catch (error) {
    const reason = String(error?.code ?? error?.message ?? 'unknown').replace(/[\r\n]/g,' ');
    try { warn(`nana context load skipped: ${reason}`); } catch {}
    return { ok: false, file, reason };
  }
}
