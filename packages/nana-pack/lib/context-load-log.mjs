/**
 * @module packages/nana-pack/lib/context-load-log.mjs
 * @purpose Count actual pi session sections or Claude instruction sources and append private best-effort context delivery records outside git worktrees.
 * @inputs Prompt composition, Claude instruction tree, delivery metadata, log path or agent dir, clock and diagnostic sink.
 * @outputs Source/count parts and one versioned JSON line or one skip diagnostic and result.
 * @effects disk (reads instruction sources, checks path ancestors and appends a log), process (stderr diagnostic)
 * @errors Never throws; all append and path failures become one skip diagnostic.
 */
import { createReadStream, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { claudeConfigHome } from '../../nana-setup/lib/claude-config-home.mjs';
import { CLAUDE_ANCESTOR_MEMORY_PATHS } from '../bin/worker-config.mjs';
import { locatePiPackage } from './pi-package.mjs';
import { piAgentDir, piAgentDirIsCwdRelative } from './agent-dir.mjs';
import { realPath } from './real-path.mjs';
import { appendLedgerRecord } from './record-ledger.mjs';

export const CONTEXT_LOAD_FILE = 'nana-context-loads.jsonl'; // contract: A-089, R-3215
export function contextPart(name, source, full, delivered = full) {
  return { name, source, fullChars: full?.length ?? 'unavailable', deliveredChars: delivered?.length ?? 'unavailable' };
}

/** Read only through the first system sections record. No reconstructed prompt or source parts. */
export async function appendPiSessionLoad(record, { sessionFile, attempt, reason = null, cwd = process.cwd(), env = process.env } = {}) {
  let parts, piVersion = null;
  let input, lines;
  try {
    try { piVersion = locatePiPackage({ cwd, env }).packageJson?.version ?? null; } catch {}
    if (reason) throw new Error(reason);
    input = createReadStream(sessionFile, { encoding: 'utf8' });
    lines = createInterface({ input, crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line.trim()) continue;
      const entry = JSON.parse(line);
      const message = entry.type === 'message' ? entry.message : null;
      if (message?.role !== 'system' || !message.sections) continue;
      parts = Object.entries(message.sections).map(([name, text]) => {
        if (typeof text !== 'string') throw new Error('invalid first sections record');
        return contextPart(name, sessionFile, text);
      });
      const tools = Array.isArray(message.toolsAdded) ? JSON.stringify(message.toolsAdded) : null;
      parts.push({ ...contextPart('toolsAdded', sessionFile, tools), ...(tools === null ? { status: 'toolsAdded missing' } : {}) });
      break;
    }
    if (!parts) throw new Error('first sections record missing');
  } catch (error) {
    parts = [{ ...contextPart('session: unavailable', sessionFile ?? 'pi session', null), status: String(error?.code ?? error?.message ?? 'session read failed').replace(/[\r\n]/g, ' ') }];
  } finally {
    lines?.close();
    input?.destroy();
  }
  // Only session-derived parts: brief/preamble/known bugs already occur inside addendum.
  return appendContextLoad({ ...record, parts, piVersion, attempt, sessionFile });
}

/** Claude's tree-local instructions and user memory; ancestors are excluded by flag settings.
 * Imports are relative to their containing file. A visited set bounds cycles and counts each
 * source once. Missing optional entry points are absent; failed imports remain unavailable.
 * Path-scoped rules are measurable sources, but their delivery depends on later tool paths.
 */
export function claudeInstructionParts({ cwd, home = homedir(), env = process.env } = {}) {
  const parts = [], seen = new Set();
  const user = claudeConfigHome(home, env);
  const tree = resolve(cwd);
  const excludedUser = (() => { for (let p = dirname(tree);; p = dirname(p)) { if (resolve(user) === join(p, '.claude')) return true; if (p === dirname(p)) return false; } })();
  const visit = (file, { optional = false, excluded = false, rule = false } = {}) => {
    file = resolve(file);
    const canonical = realPath(file);
    if (seen.has(canonical)) return;
    seen.add(canonical);
    let text;
    try {
      try { lstatSync(file); } catch (error) { if (optional && error.code === 'ENOENT') return; throw error; }
      if (!statSync(file).isFile()) throw new Error('not a regular file');
      text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file));
    } catch (error) {
      parts.push(contextPart('Claude instruction', file, null)); return;
    }
    const part = contextPart('Claude instruction', file, text);
    if (excluded) { part.deliveredChars = 0; part.status = 'excluded ancestor'; }
    else if (rule && /^---\r?\n[\s\S]*?\bpaths\s*:/u.test(text)) { part.deliveredChars = 'unavailable'; part.status = 'path conditional'; }
    parts.push(part);
    // Claude ignores imports in code blocks and inline code. Preserve whitespace elsewhere.
    const prose = text.replace(/^\s*(`{3,}|~{3,})[^\n]*\r?\n[\s\S]*?^\s*\1[^\n]*(?:\n|$)/gm, '').replace(/`[^`\r\n]*`/g, '');
    for (const match of prose.matchAll(/(?:^|\s)@([^\s]+)/g)) {
      const target = match[1];
      visit(target.startsWith('~/') ? join(home, target.slice(2)) : resolve(dirname(file), target), { excluded });
    }
  };
  const rules = (dir, excluded = false) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name)); }
    catch (error) { if (error.code !== 'ENOENT') parts.push(contextPart('Claude instruction', dir, null)); return; }
    for (const entry of entries) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) rules(file, excluded);
      else if (entry.name.endsWith('.md')) visit(file, { excluded, rule: true });
    }
  };
  for (const suffix of CLAUDE_ANCESTOR_MEMORY_PATHS) {
    if (suffix.endsWith('/**')) rules(join(tree, suffix.slice(0, -3)));
    else visit(join(tree, suffix), { optional: true });
  }
  visit(join(user, 'CLAUDE.md'), { optional: true, excluded: excludedUser });
  rules(join(user, 'rules'), excludedUser);
  return parts;
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
