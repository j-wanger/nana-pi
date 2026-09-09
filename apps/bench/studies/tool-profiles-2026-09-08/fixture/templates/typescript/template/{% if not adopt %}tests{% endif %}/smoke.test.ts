// Scaffold smoke test — replace with real feature tests.
import { expect, test } from "vitest";

import { VERSION } from "../src/index.js";

test("package exports version", () => {
	expect(VERSION).toBe("0.1.0");
});
