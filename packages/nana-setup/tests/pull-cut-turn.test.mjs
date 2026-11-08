/**
 * @module packages/nana-setup/tests/pull-cut-turn.test.mjs
 * @purpose Prove the live offline turn needs no knowledge delivery and retains each other judge.
 * @inputs Installed pi, the existing faux provider, temporary setup home and judge function.
 * @outputs One awaited bounded PASS or FAIL result.
 * @effects disk (temporary home), process (offline pi only)
 * @errors Assertions and bounded child failures fail the case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpDir } from "./tmp-dir.mjs";
import { check } from '../../nana-pack/tests/profile-fixture.mjs';
import { resolveLayout, repoRoot } from '../lib/paths.mjs';
import { install } from '../lib/steps.mjs';
import { buildEnvironment, judgePiTurn } from '../lib/install-check.mjs';
import { findPi } from '../../nana-pack/lib/win-command.mjs';
import { piInvocation } from '../lib/pi-invocation.mjs';
import { PI_TURN, SAMPLE_INPUTS } from '../lib/install-check-config.mjs';
// req: R-3866
await check('R-3866: real offline turn needs no knowledge and retains four independent judges', async () => {
 const home = tmpDir(path.join(os.tmpdir(), 'pull-cut-turn-'));
 try {
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.knowledgeHome, { recursive: true }); fs.writeFileSync(path.join(layout.knowledgeHome, 'index.db'), 'fixture');
  install(layout);
  const agent = path.join(home, '.pi/agent');
  fs.writeFileSync(path.join(agent, 'settings.json'), JSON.stringify({ packages: [repoRoot] }));
  const token = 'cut_turn_token';
  fs.writeFileSync(path.join(agent, 'nana-objective.md'), `**Objective (since 2026-11-07):** ${token}.\n\n**Current priority (since 2026-11-07):** ${token}.\n`);
  const project = path.join(home, 'project'); fs.mkdirSync(project);
  const env = buildEnvironment(process.env, home, process.platform);
  const args = [...PI_TURN.args.map(a => a === PI_TURN.fixture ? path.join(repoRoot, a) : a), `${SAMPLE_INPUTS.prompt} ${token}`];
  const pi = process.platform === 'win32' ? findPi({ env, cwd: project }) : 'pi';
  assert.ok(pi, 'pi must be installed');
  const spec = piInvocation(pi, args, { win32: process.platform === 'win32', env, cwd: project });
  assert.ok(!spec.refused, spec.refused);
  const launch = spawnSync(spec.command, spec.args, { ...spec.options, cwd: project, env, encoding: 'utf8', timeout: 60000 });
  assert.equal(launch.status, 0, launch.stderr);
  const record = JSON.parse(fs.readFileSync(path.join(home, PI_TURN.record), 'utf8'));
  assert.ok(!record.userMessages.some(m => m.startsWith(PI_TURN.knowledgeMarker)));
  const judge = record => judgePiTurn({ record, status: 0, token });
  assert.equal(judge(record).passed, true, JSON.stringify(judge(record)));
  for (const [field, code] of [['rulingsHeading', 'missing-rulings'], ['seatGuideHeading', 'missing-seat-guide'], ['writingTag', 'missing-writing']]) {
   const broken = structuredClone(record); broken.system = broken.system.replaceAll(PI_TURN[field], '');
   assert.equal(judge(broken).code, code);
  }
  assert.equal(judge({ ...record, toolResults: [] }).code, 'missing-gate-block');
 } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
