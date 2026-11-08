/**
 * @module packages/nana-pack/tests/memory-cut-checks.test.mjs
 * @purpose Prove retirement keeps the repository's structural checks green.
 * @inputs Map, README, tree, trace, audit and deliverables commands.
 * @outputs One awaited bounded PASS or FAIL case.
 * @effects process (read-only checker children)
 * @errors A nonzero child status fails the case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseLedger } from '../../../scripts/requirements-tree.mjs';
import { deliverableReport } from '../../../scripts/deliverables.mjs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { check } from './profile-fixture.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
// req: R-3864
await check('R-3864: memory retirement leaves structural checks green', async () => {
 for (const args of [['scripts/code-map.mjs', '--check'], ['scripts/readme-check.mjs'], ['scripts/requirements-tree.mjs'], ['scripts/requirements-trace.mjs'], ['scripts/component-audit.mjs']]) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
 }
 const parsed = parseLedger(fs.readFileSync(path.join(root, 'REQUIREMENTS.md'), 'utf8'));
 const report = deliverableReport(parsed, root);
 assert.ok(report.check.checkedDeliverables > 0);
 for (const id of ['A-044', 'A-095', 'A-097']) assert.equal(report.check.artifacts.get(id)?.retired, true, id);
 assert.deepEqual(report.check.notes, []);
});
