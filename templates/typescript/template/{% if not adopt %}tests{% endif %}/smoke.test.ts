/**
 * @module tests/smoke.test.ts
 * @purpose Scaffold smoke test, to be replaced by real feature tests.
 * @inputs the package entry point
 * @outputs a vitest assertion
 * @effects none
 * @errors none
 */
// The `req:` comment below is the trace rail: it says which REQUIREMENTS.md rows
// this test evidences. Every test that pins a requirement carries one.
import { expect, test } from "vitest";

import { VERSION } from "../src/index.js";

// req: R-001
test("package exports version", () => {
	expect(VERSION).toBe("0.1.0");
});
