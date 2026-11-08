/**
 * @module packages/nana-pack/tests/data-pack-land.test.mjs
 * @purpose Guard the eight data-check contracts without running template release acceptance.
 * @inputs Current data-check source and temporary Python fixtures.
 * @outputs One awaited bounded PASS/FAIL verdict.
 * @effects disk (temporary fixtures), process (bounded Python child).
 * @errors Failed assertions set exit status 1.
 */
import { py } from "./data-pack.test.mjs";
import { check } from "./pack-fixtures.mjs";
// req: R-3841
await check("M2 eight checks detect defects and accept clean fixtures", () => { py("contracts"); });
