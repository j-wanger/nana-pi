/**
 * @module packages/nana-setup/tests/seat-pull-off.test.mjs
 * @purpose Pin Claude Code knowledge-hook retirement while retaining search and pi pulls.
 * @inputs Installer, doctor, settings and install-check modules and OS-temporary homes.
 * @outputs Awaited bounded test cases and TAP results.
 * @effects disk (temporary fixtures), process (bounded installer and query children).
 * @errors Assertions and child failures fail the owning case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { desiredHooks, shq } from '../lib/settings.mjs';
import { stepSettings, readClaudeSettings } from '../lib/steps.mjs';
import { resolveLayout, repoRoot } from '../lib/paths.mjs';
import { tmpDir } from "./tmp-dir.mjs";

const limit = 20_000;
const options = { timeout: limit };
async function test(title, { timeout }, body) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(body), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case timeout')), timeout); })]);
    console.log('PASS', title);
  } catch (error) { console.log('FAIL', title, error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
const cli = fileURLToPath(new URL('../bin/nana-setup.mjs', import.meta.url));
const knowledge = `${repoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts`;
function fixture(body) {
  const home = tmpDir(path.join(os.tmpdir(), 'nana-pull-off-'));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  try { return body(layout); } finally { fs.rmSync(home, { recursive: true, force: true }); }
}
function entry(target = '/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', exec = false) {
  return { type: 'command', ...(exec ? { command: 'node', args: [target, 'hook'] } : { command: `NODE_NO_WARNINGS=1 node ${shq(target)} hook` }), timeout: 5, statusMessage: 'nana: knowledge pull' };
}
function installSettings(layout, settings, platform) {
  fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
  const previous = process.env.NANA_SETUP_PLATFORM;
  process.env.NANA_SETUP_PLATFORM = platform;
  try { stepSettings(layout, { dryRun: false }, readClaudeSettings(layout)); }
  finally { if (previous === undefined) delete process.env.NANA_SETUP_PLATFORM; else process.env.NANA_SETUP_PLATFORM = previous; }
  return JSON.parse(fs.readFileSync(layout.claudeSettings, 'utf8'));
}
const promptEntries = settings => (settings.hooks?.UserPromptSubmit ?? []).flatMap(group => group.hooks ?? []);
function child(script, args, home) {
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  delete env.PI_CODING_AGENT_DIR;
  delete env.NANA_SETUP_PLATFORM;
  const result = spawnSync(process.execPath, [script, ...args], { env, encoding: 'utf8', timeout: limit });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

// req: R-3739
await test('R-3739: fresh POSIX and win32 installs omit only the knowledge entry', options, () => {
  for (const platform of ['darwin', 'win32']) fixture(layout => {
    const after = installSettings(layout, {}, platform);
    assert.equal(promptEntries(after).length, 0);
    const wanted = desiredHooks({ hooksDir: layout.hooksDir, repoRoot, platform });
    assert.equal(wanted.length, 5);
    assert.deepEqual(wanted.map(w => w.spec.script), ['nana-objective.mjs', 'nana-adoption.mjs', 'nana-shared-memory.mjs', 'nana-roster-notice.mjs', 'nana-rm-guard.mjs']);
    for (const w of wanted) assert.deepEqual(after.hooks[w.event].find(g => g.matcher === w.matcher).hooks.find(h => h.statusMessage === w.entry.statusMessage), w.entry);
  });
});

// req: R-3740 R-653
await test('R-3740: install removes shell and exec knowledge entries and preserves foreign entries', options, () => {
  for (const platform of ['darwin', 'win32']) fixture(layout => {
    const customized = { type: 'command', command: 'NANA_KNOWLEDGE_HOME=/custom node /old-clone/packages/nana-knowledge/bin/nana-knowledge.ts hook', timeout: 5, statusMessage: 'nana: knowledge pull' };
    const foreign = [customized, { ...entry(), timeout: 9 }, { ...entry(), async: true }, { ...entry(), args: [] }, { ...entry(), type: 'prompt' }, { ...entry('C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', true), args: ['C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', 'hook', '--owner'] }, { type: 'command', command: 'echo foreign', timeout: 17 }, { ...entry(), statusMessage: 'owner knowledge' }];
    const after = installSettings(layout, { hooks: { UserPromptSubmit: [{ hooks: [entry(), entry('C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', true), ...foreign] }] } }, platform);
    assert.equal(JSON.stringify(promptEntries(after)), JSON.stringify(foreign));
  });
});

// req: R-3744
await test('R-3744: query returns index results after install', options, () => {
  fixture(layout => {
    const notes = path.join(layout.base, 'notes');
    fs.mkdirSync(notes);
    fs.writeFileSync(path.join(notes, 'evidence.md'), '# Zircon retrieval\nZircon retrieval evidence.\n');
    fs.mkdirSync(layout.knowledgeHome, { recursive: true });
    fs.writeFileSync(path.join(layout.knowledgeHome, 'sources.json'), JSON.stringify({ roots: [{ path: notes, kind: 'articles' }] }));
    child(cli, ['install', '--home', layout.base], layout.base);
    const output = child(knowledge, ['query', 'zircon retrieval', '--json'], layout.base);
    assert.ok(output.includes('evidence.md'), output);
  });
});
