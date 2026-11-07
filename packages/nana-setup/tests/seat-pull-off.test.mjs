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
import { desiredHooks, shq, removeInstallerHooks } from '../lib/settings.mjs';
import { stepSettings, readClaudeSettings } from '../lib/steps.mjs';
import { resolveLayout, repoRoot } from '../lib/paths.mjs';
import { diagnose } from '../lib/doctor.mjs';
import { withPiStub } from './stub-pi.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { HOOKS, PI_TURN } from '../lib/install-check-config.mjs';
import { mapHookEntries, judgePiTurn } from '../lib/install-check.mjs';

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
    assert.equal(wanted.length, 6);
    assert.deepEqual(wanted.map(w => w.spec.script), ['nana-objective.mjs', 'nana-adoption.mjs', 'nana-shared-memory.mjs', 'nana-roster-notice.mjs', 'verifier-pipe.mjs', 'nana-memory-end.mjs']);
    for (const w of wanted) assert.deepEqual(after.hooks[w.event].find(g => g.matcher === w.matcher).hooks.find(h => h.statusMessage === w.entry.statusMessage), w.entry);
  });
});

// req: R-3740
await test('R-3740: install removes shell and exec knowledge entries and preserves foreign entries', options, () => {
  for (const platform of ['darwin', 'win32']) fixture(layout => {
    const foreign = [{ ...entry(), timeout: 9 }, { ...entry(), async: true }, { ...entry(), args: [] }, { ...entry(), type: 'prompt' }, { ...entry('C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', true), args: ['C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', 'hook', '--owner'] }, { type: 'command', command: 'echo foreign', timeout: 17 }, { ...entry(), statusMessage: 'owner knowledge' }];
    const after = installSettings(layout, { hooks: { UserPromptSubmit: [{ hooks: [entry(), entry('C:/old checkout/packages/nana-knowledge/bin/nana-knowledge.ts', true), ...foreign] }] } }, platform);
    assert.equal(JSON.stringify(promptEntries(after)), JSON.stringify(foreign));
  });
});

// req: R-3741
await test('R-3741: doctor names retired knowledge commands and install repair, but not absence', options, () => {
  fixture(layout => {
    for (const hook of [entry(knowledge), entry(knowledge, true), { ...entry(knowledge), args: [] }]) {
      fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [hook] }] } }));
      const rows = withPiStub(() => diagnose(layout, { projectDir: layout.base }));
      const row = rows.find(r => r.label === 'settings UserPromptSubmit retired hook');
      assert.equal(row?.status, 'fail');
      assert.ok(row.detail.includes(hook.command));
      if (hook.args) assert.ok(row.detail.includes(knowledge));
      assert.ok(row.detail.includes('nana-setup install'));
      assert.ok(!rows.some(r => r.label === 'settings UserPromptSubmit knowledge pull'));
    }
    fs.writeFileSync(layout.claudeSettings, '{}');
    const rows = withPiStub(() => diagnose(layout, { projectDir: layout.base }));
    assert.ok(!rows.some(r => /knowledge|retired hook/.test(r.label) && r.label.startsWith('settings')));
    assert.ok(rows.some(r => r.label === 'knowledge index'));
    assert.ok(rows.some(r => r.label === 'knowledge sources'));
  });
});

// req: R-3742
await test('R-3742: uninstall still removes the previous installer knowledge entry', options, () => {
  fixture(layout => {
    const foreign = { type: 'command', command: 'echo foreign' };
    const settings = { hooks: { UserPromptSubmit: [{ hooks: [entry(knowledge), foreign] }] } };
    const removed = removeInstallerHooks(settings, { hooksDir: layout.hooksDir, repoRoot });
    assert.ok(removed.includes('UserPromptSubmit knowledge pull'));
    assert.deepEqual(promptEntries(settings), [foreign]);
  });
});

// req: R-3743
await test('R-3743: install-check omits the Claude knowledge hook and still checks pi knowledge', options, () => {
  assert.ok(!HOOKS.some(h => h.event === 'UserPromptSubmit' || h.script === 'nana-knowledge.ts'));
  for (const platform of ['darwin', 'win32']) {
    const settings = {};
    for (const w of desiredHooks({ hooksDir: '/h', repoRoot: '/r', platform })) {
      settings[w.event] ??= [];
      settings[w.event].push({ matcher: w.matcher, hooks: [w.entry] });
    }
    const mapped = mapHookEntries(Object.entries(settings).flatMap(([event, groups]) => groups.map(group => ({ event, group }))), platform);
    assert.deepEqual(mapped.failures, []);
  }
  const record = { system: `token ${PI_TURN.rulingsHeading} ${PI_TURN.seatGuideHeading} ${PI_TURN.writingTag}`, userMessages: [`${PI_TURN.knowledgeMarker} ${PI_TURN.noteFile}`], toolResults: [{ toolName: PI_TURN.tool, isError: true, text: PI_TURN.gateBlockPrefix }] };
  assert.equal(judgePiTurn({ record, status: 0, token: 'token' }).passed, true);
  record.userMessages = [];
  assert.equal(judgePiTurn({ record, status: 0, token: 'token' }).code, 'missing-knowledge');
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

// req: R-3745
await test('R-3745: install retains matcher siblings and drops only groups emptied by removal', options, () => {
  fixture(layout => {
    const sibling = { command: 'echo sibling', type: 'command', timeout: 11 };
    const empty = { matcher: 'preexisting', hooks: [] };
    const after = installSettings(layout, { hooks: { UserPromptSubmit: [{ matcher: '*', hooks: [entry(), sibling] }, { matcher: 'alone', hooks: [entry()] }, empty] } }, 'darwin');
    assert.equal(JSON.stringify(after.hooks.UserPromptSubmit), JSON.stringify([{ matcher: '*', hooks: [sibling] }, empty]));
  });
});

// req: R-3746
await test('R-3746: knowledge README retires Claude wiring and points to explicit query', options, () => {
  const readme = fs.readFileSync(new URL('../../nana-knowledge/README.md', import.meta.url), 'utf8');
  const section = readme.split('## The hook')[1].split('## The pi extension')[0];
  assert.match(section, /Claude Code.*retired/);
  assert.match(section, /2%/);
  assert.match(section, /#342/);
  assert.match(section, /nana-knowledge query/);
  assert.ok(!section.includes('"UserPromptSubmit"'));
});
