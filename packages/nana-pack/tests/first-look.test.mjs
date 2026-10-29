/**
 * @module packages/nana-pack/tests/first-look.test.mjs
 * @purpose Pins first-look report building, page-change detection, browser fallback and its sealed page inputs.
 * @inputs First-look implementation and temporary test directories.
 * @outputs PASS/FAIL lines and a nonzero exit when a contract fails.
 * @effects disk (OS temporary fixtures only)
 * @errors A failed assertion exits 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runFirstLook } from "../../../scripts/first-look.mjs";
import { PAGE_SHAPING_PATHS, PRODUCT_VIEWS, VIEWPORT_WIDTHS } from "../../../scripts/first-look-config.mjs";

let passed = 0;
const CASE_LIMIT_MS = 20_000; // chosen: bounds an individual fake-browser case.
async function test(title, fn) {
  let timer;
  try {
    await Promise.race([fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS); })]);
    passed++; console.log("PASS", title);
  } catch (error) { console.log("FAIL", title, error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
const temp = () => fs.mkdtemp(path.join(os.tmpdir(), "nana-first-look-"));
const fakeBrowser = (calls) => ({
  async newPage({ viewport }) {
    calls.viewports.push(viewport.width);
    return {
      async goto(url) { calls.urls.push(url); },
      async evaluate() { return ["FEAT-039"]; },
      locator() { return { async ariaSnapshot() { return `tree ${calls.urls.at(-1)} ${calls.viewports.at(-1)}`; } }; },
      async screenshot({ path: file }) { await fs.writeFile(file, "fake png"); calls.shots.push(file); },
      async setViewportSize({ width }) { calls.viewports.push(width); },
      async close() {},
    };
  },
  async close() {},
});
const defaultArgs = (out) => ["--page", "product", "--out", out];

// req: R-3040
await test("R-3040: builds both checkouts and captures both widths plus every report-view tree", async () => {
  const dir = await temp();
  try {
    const calls = { reports: [], viewports: [], urls: [], shots: [], trees: [] };
    const code = await runFirstLook(defaultArgs(path.join(dir, "out")), {
      root: dir, mergeBase: "base-sha", changedPaths: ["scripts/product-report/template.html"],
      runReport: async (root, out) => { calls.reports.push(root); await fs.writeFile(out, "fake html"); return `file://${out}`; },
      browser: async () => fakeBrowser(calls),
      readTree: async (page, view) => { calls.trees.push(view); return `${view}\r\n${await page.locator("body").ariaSnapshot()}\t`; },
      stdout: () => {},
    });
    assert.equal(code, 0);
    assert.deepEqual(calls.reports, ["base-sha", dir]);
    assert.deepEqual(calls.shots.map((file) => path.basename(file)), ["before-380.png", "before-1280.png", "after-380.png", "after-1280.png"]);
    assert.deepEqual(calls.trees, [...PRODUCT_VIEWS, "FEAT-039", ...PRODUCT_VIEWS, "FEAT-039"]);
    assert.deepEqual(VIEWPORT_WIDTHS, [380, 1280]);
    const diff = await fs.readFile(path.join(dir, "out", "accessibility-diff.txt"), "utf8");
    assert.ok(diff.includes("overview"));
    assert.ok(diff.includes("\t"));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

// req: R-3041
await test("R-3041: page-unrelated changes produce one line and no output", async () => {
  const dir = await temp();
  try {
    const lines = [];
    const code = await runFirstLook(defaultArgs(path.join(dir, "out")), {
      root: dir, mergeBase: "base", changedPaths: ["REQUIREMENTS.md", "HANDOFF.md"],
      stdout: (line) => lines.push(line),
    });
    assert.equal(code, 0);
    assert.equal(lines.length, 1);
    assert.match(lines[0], /no page-shaping changes/);
    await assert.rejects(fs.access(path.join(dir, "out")));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

// req: R-3042
await test("R-3042: absent browser and launch failure each degrade with one install line", async () => {
  for (const browser of [null, async () => { throw new Error("missing browser executable"); }]) {
    const dir = await temp();
    try {
      const lines = [];
      const code = await runFirstLook(defaultArgs(path.join(dir, "out")), {
        root: dir, mergeBase: "base", changedPaths: ["scripts/product-report/template.html"],
        runReport: async (root, out) => { await fs.writeFile(out, "fake html"); return `file://${out}`; },
        browser, stdout: (line) => lines.push(line),
      });
      assert.equal(code, 0);
      assert.equal(lines.length, 1);
      assert.match(lines[0], /install.*Playwright/i);
    } finally { await fs.rm(dir, { recursive: true, force: true }); }
  }
});

// req: R-3043
await test("R-3043: sealed page-shaping paths name renderer, template and report model modules", async () => {
  assert.deepEqual(PAGE_SHAPING_PATHS, [
    "scripts/product-report.mjs", "scripts/product-report/", "scripts/deliverables.mjs",
    "scripts/requirements-tree.mjs", "scripts/requirements-trace.mjs", "scripts/requirements-moved.mjs",
    "packages/nana-pack/lib/handoff-asks.mjs", "packages/nana-pack/lib/handoff-issues.mjs",
    "packages/nana-pack/lib/land-config.mjs", "packages/nana-pack/lib/runtime-map.mjs",
    "packages/nana-pack/lib/runtime-map-config.mjs", "packages/nana-pack/lib/land-ci.mjs",
    "packages/nana-pack/lib/suite-records.mjs", "packages/nana-pack/lib/build-records.mjs",
    "apps/bench/lib/checkers.mjs",
  ]);
  assert.deepEqual(VIEWPORT_WIDTHS, [380, 1280]);
});

if (!process.exitCode) console.log(`${passed} first-look checks passed`);
