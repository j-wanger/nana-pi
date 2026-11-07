/**
 * @module packages/nana-pack/tests/ledger-repo.mjs
 * @purpose Build caller-scoped temporary requirement-ledger repositories.
 * @inputs A caller-supplied temporary folder and ledger text.
 * @outputs Git runner, ledger writer and commit helper.
 * @effects disk (temporary repositories), process (bounded git commands)
 * @errors Git setup and file errors throw.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const TABLE = '| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n';
export function ledgerText(rows = '| R-001 | Row one. | untested | — |\n') {
  return `# CAP-01 · Cap\nPurpose: cap\n\n## FEAT-001 · Alpha\nPurpose: alpha\nStatus: active\n\n${TABLE}${rows}`;
}
export function ledgerRepo(dir) {
  mkdirSync(dir, { recursive: true });
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
  function git(...args) {
    return spawnSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { cwd: dir, encoding: 'utf8', env, timeout: 30_000 });
  }
  function writeLedger(text) { writeFileSync(join(dir, 'REQUIREMENTS.md'), text); }
  function commit(message) {
    const add = git('add', '-A'); if (add.status !== 0) throw new Error(`git add failed: ${add.stderr}`);
    const made = git('commit', '-qm', message); if (made.status !== 0) throw new Error(`git commit failed: ${made.stderr}`);
  }
  return { git, writeLedger, commit, env };
}
