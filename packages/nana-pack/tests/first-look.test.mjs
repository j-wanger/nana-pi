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
import { ACCESSIBILITY_DIFF_MAX_LINES, PAGE_SHAPING_PATHS, PRODUCT_VIEWS, VIEWPORT_WIDTHS } from "../../../scripts/first-look-config.mjs";

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
await test("R-3040: builds both checkouts, captures both widths and writes compact diffs only for changed views", async () => {
  const dir = await temp();
  try {
    const calls = { reports: [], viewports: [], urls: [], shots: [], trees: [], readCount: 0 };
    const code = await runFirstLook(defaultArgs(path.join(dir, "out")), {
      root: dir, mergeBase: "base-sha", changedPaths: ["scripts/product-report/template.html"],
      runReport: async (root, out) => { calls.reports.push(root); await fs.writeFile(out, "fake html"); return `file://${out}`; },
      browser: async () => fakeBrowser(calls),
      readTree: async (page, view) => {
        calls.trees.push(view);
        const side = calls.readCount++ < PRODUCT_VIEWS.length + 1 ? "before" : "after";
        const content = view === "overview" ? `${side} heading` : `${view} unchanged`;
        return `${content}\r\nshared tree\t`;
      },
      stdout: () => {},
    });
    assert.equal(code, 0);
    assert.deepEqual(calls.reports, ["base-sha", dir]);
    assert.deepEqual(calls.shots.map((file) => path.basename(file)), ["before-380.png", "before-1280.png", "after-380.png", "after-1280.png"]);
    assert.deepEqual(calls.trees, [...PRODUCT_VIEWS, "FEAT-039", ...PRODUCT_VIEWS, "FEAT-039"]);
    assert.deepEqual(VIEWPORT_WIDTHS, [380, 1280]);
    const diff = await fs.readFile(path.join(dir, "out", "accessibility-diff.txt"), "utf8");
    assert.match(diff, /## overview/);
    assert.match(diff, /-before heading/);
    assert.match(diff, /\+after heading/);
    assert.doesNotMatch(diff, /## decisions/);
    assert.match(diff, /1 views changed; 7 views unchanged/);
    assert.equal(ACCESSIBILITY_DIFF_MAX_LINES, 40);
    assert.ok(diff.split("\n").length < ACCESSIBILITY_DIFF_MAX_LINES);
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

// req: R-3133
await test('R-3133: hive URL capture waits for drawing, reduces motion and names empty or timed-out canvases', async () => {
  const { HIVE_READY_TIMEOUT_MS, HIVE_BACKGROUND, HIVE_PROBE_FRACTION } = await import('../../../scripts/first-look-config.mjs');
  assert.equal(HIVE_READY_TIMEOUT_MS, 15000); assert.equal(HIVE_BACKGROUND, '#171b19'); assert.equal(HIVE_PROBE_FRACTION, 0.5);
  for (const mode of ['drawn', 'empty', 'timeout']) {
    const dir = await temp(); const events = []; const lines = [];
    try {
      const browser = { async newPage() { return {
        async emulateMedia(value) { events.push(['motion', value]); },
        async goto() { events.push(['goto']); },
        async waitForSelector(selector, options) { events.push(['ready', selector, options]); if (mode === 'timeout') throw new Error('timeout'); },
        async evaluate() { events.push(['pixels']); return mode !== 'empty'; },
        async setViewportSize({ width }) { events.push(['width', width]); },
        async screenshot() { assert.equal(events.at(-1)[0], 'pixels'); events.push(['shot']); },
        async close() {},
      }; }, async close() {} };
      const code = await runFirstLook(['--page', 'url', '--hive', '--before', 'http://127.0.0.1:1', '--after', 'http://127.0.0.1:1'], { outputDir: dir, browser: async () => browser, readTree: async () => 'Renderer: webgl', stdout: line => lines.push(line) });
      assert.equal(code, mode === 'drawn' ? 0 : 1);
      if (mode === 'drawn') {
        assert.deepEqual(events.filter(e => e[0] === 'width').map(e => e[1]), [380, 1280, 380, 1280]); assert.equal(events.filter(e => e[0] === 'shot').length, 4);
        assert(events.filter(e => e[0] === 'motion').every(e => e[1].reducedMotion === 'reduce')); assert.equal(events.filter(e => e[0] === 'motion').length, 2);
        assert(events.filter(e => e[0] === 'ready').every(e => e[1] === 'html[data-hive-ready]' && e[2].timeout === HIVE_READY_TIMEOUT_MS));
      } else assert.deepEqual(lines, [mode === 'empty' ? 'first-look: the hive canvas is empty' : 'first-look: the hive ready wait timed out']);
    } finally { await fs.rm(dir, { recursive: true, force: true }); }
  }
  const dir = await temp(); try {
    const calls = { viewports: [], urls: [], shots: [] };
    assert.equal(await runFirstLook(['--page', 'desk', '--before', 'http://localhost:1', '--after', 'http://localhost:2'], { outputDir: dir, browser: async () => fakeBrowser(calls), stdout: () => {} }), 0);
    assert.equal(calls.shots.length, 4);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

if (!process.exitCode) console.log(`${passed} first-look checks passed`);
