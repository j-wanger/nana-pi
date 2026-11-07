/**
 * @module apps/desk/test/test-case.mjs
 * @purpose Emit repository-runner check lines for bounded Node test cases.
 * @inputs A case title, Node test options and an awaited case body.
 * @outputs Named test wrapper returning Node's test promise and PASS/SKIP lines.
 * @effects process (test reporting)
 * @errors Node's test runner reports body failures and timeouts with a failing exit code.
 */
import { test as nodeTest } from 'node:test';
export function test(title, options, body) {
  if (options.skip) console.log('SKIP', title, options.skip);
  return nodeTest(title, options, async () => {
    try { await body(); console.log('PASS', title); }
    catch (error) { console.log('FAIL', title, error.message); throw error; }
  });
}
