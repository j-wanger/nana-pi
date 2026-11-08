/**
 * @module packages/nana-setup/tests/memory-pause.test.mjs
 * @purpose Prove setup retires automatic memory dispatch on old and fresh homes.
 * @inputs Temporary homes, released hook shapes, installer, doctor and uninstaller.
 * @outputs Awaited bounded PASS or FAIL cases.
 * @effects disk (temporary homes), process (doctor probes)
 * @errors Assertion failures fail the owning case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tmpDir } from "./tmp-dir.mjs";
import { check } from '../../nana-pack/tests/profile-fixture.mjs';
import { resolveLayout, repoRoot } from '../lib/paths.mjs';
import { install } from '../lib/steps.mjs';
import { uninstall } from '../lib/uninstall.mjs';
import { diagnose } from '../lib/doctor.mjs';
import { shq } from '../lib/settings.mjs';
import { HOOKS } from '../lib/install-check-config.mjs';
import { withPiStub } from './stub-pi.mjs';
const file = 'nana-memory-end.mjs';
const foreign = { type: 'command', command: 'echo foreign', timeout: 7 };
function fixture(body) {
 const home = tmpDir(path.join(os.tmpdir(), 'memory-pause-'));
 const previous = process.env.NANA_SETUP_PLATFORM;
 try {
  const layout = resolveLayout({ home }); fs.mkdirSync(layout.hooksDir, { recursive: true });
  fs.mkdirSync(layout.knowledgeHome, { recursive: true }); fs.writeFileSync(path.join(layout.knowledgeHome, 'index.db'), 'fixture');
  const link = path.join(layout.hooksDir, file);
  fs.symlinkSync(path.join(repoRoot, 'packages/nana-setup/claude/hooks', file), link);
  const hook = { type: 'command', command: `node ${shq(link)}`, timeout: 1.5, statusMessage: 'nana: memory' };
  const exec = { ...hook, command: 'node', args: [`C:/old checkout/packages/nana-setup/claude/hooks/${file}`] };
  fs.writeFileSync(layout.claudeSettings, JSON.stringify({ hooks: { SessionEnd: [{ hooks: [hook, exec, foreign] }] } }));
  const read = () => JSON.parse(fs.readFileSync(layout.claudeSettings, 'utf8'));
  return body({ layout, link, read });
 } finally { if (previous === undefined) delete process.env.NANA_SETUP_PLATFORM; else process.env.NANA_SETUP_PLATFORM = previous; fs.rmSync(home, { recursive: true, force: true }); }
}
// req: R-3862
await check('R-3862: install retires memory dispatch and doctor names the repair', () => {
 fixture(({ layout, link, read }) => {
  process.env.NANA_SETUP_PLATFORM = 'darwin';
  const rows = withPiStub(() => diagnose(layout, { projectDir: layout.base }));
  const row = rows.find(r => r.label === 'settings SessionEnd retired hook');
  assert.equal(row?.status, 'fail'); assert.ok(row.detail.includes(file)); assert.ok(row.detail.includes('nana-setup install'));
  install(layout);
  assert.deepEqual(read().hooks.SessionEnd, [{ hooks: [foreign] }]);
  assert.throws(() => fs.lstatSync(link), { code: 'ENOENT' });
  assert.ok(!HOOKS.some(h => h.event === 'SessionEnd' || h.label === 'hook memory making'));
 });
});
// req: R-3865
await check('R-3865: uninstall directly retires pre-cut memory hooks and preserves foreign entries', () => {
 fixture(({ layout, link, read }) => {
  process.env.NANA_SETUP_PLATFORM = 'darwin';
  uninstall(layout);
  assert.deepEqual(read().hooks.SessionEnd, [{ hooks: [foreign] }]);
  assert.throws(() => fs.lstatSync(link), { code: 'ENOENT' });
 });
});
