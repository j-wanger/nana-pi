/**
 * @module packages/nana-setup/tests/waking-stop.test.mjs
 * @purpose Pin the unarmed open-lane Stop failure through the real hook entry.
 * @inputs Temporary build records and Stop stdin.
 * @outputs PASS line or assertion failure.
 * @effects disk (temporary repo), process (hook and git)
 * @errors Assertion failures fail the test.
 */
import assert from "node:assert/strict";
import { fixture, invoke, test } from "./waking-fixture.mjs";

// req: R-3970
await test("R-3970: an open lane without a recurring wake blocks turn end", { timeout: 45000 }, () => {
 for (const ending of ["\n", " \r\n", "\t\r\n", ""]) {
  const result = invoke(fixture(ending), { hook_event_name: "Stop", session_crons: [] });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, "block");
  assert.match(output.reason, /wake-test/);
  assert.match(output.reason, /CronCreate/);
  assert.match(output.reason, /recurring wake/);
 }
});
