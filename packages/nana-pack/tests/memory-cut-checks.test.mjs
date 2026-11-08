/**
 * @module packages/nana-pack/tests/memory-cut-checks.test.mjs
 * @purpose Prove memory artifacts are retired without deliverable check notes.
 * @inputs Checkout requirements ledger and deliverables report.
 * @outputs One awaited bounded PASS or FAIL case.
 * @effects disk (reads checkout), process (deliverables git inventory)
 * @errors Assertion failures fail the case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseLedger } from '../../../scripts/requirements-tree.mjs';
import { deliverableReport } from '../../../scripts/deliverables.mjs';
import { fileURLToPath } from 'node:url';
import { check } from './profile-fixture.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
// req: R-3864
await check('R-3864: memory artifacts are retired without deliverable check notes', async () => {
 const parsed = parseLedger(fs.readFileSync(path.join(root, 'REQUIREMENTS.md'), 'utf8'));
 const report = deliverableReport(parsed, root);
 assert.ok(report.check.checkedDeliverables > 0);
 for (const id of ['A-044', 'A-095', 'A-097']) assert.equal(report.check.artifacts.get(id)?.retired, true, id);
 assert.deepEqual(report.check.notes, []);
});
