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
import { ACCESSIBILITY_DIFF_MAX_LINES, PAGE_SHAPING_PATHS, PRODUCT_VIEWS, VIEWPORT_WIDTHS, REFERENCE_FRAME_CAP, ACCEPTED_IMAGE_EXTENSIONS, MAX_SPEC_LINES } from "../../../scripts/first-look-config.mjs";

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
  assert.equal(HIVE_READY_TIMEOUT_MS, 15000); assert.equal(HIVE_BACKGROUND, '#d7d9d5'); assert.equal(HIVE_PROBE_FRACTION, 0.5);
  for (const mode of ['drawn', 'empty', 'timeout']) {
    const dir = await temp(); const events = []; const lines = [];
    try {
      const browser = { async newPage({ viewport }) { events.push(['width', viewport.width]); return {
        async emulateMedia(value) { events.push(['motion', value]); },
        async goto() { events.push(['goto']); },
        async waitForSelector(selector, options) { events.push(['ready', selector, options]); if (mode === 'timeout') throw new Error('timeout'); },
        async evaluate() { events.push(['pixels']); return mode !== 'empty'; },
        async setViewportSize({ width }) { events.push(['width', width]); },
        async screenshot() { assert(['pixels', 'shot'].includes(events.at(-1)[0])); events.push(['shot']); },
        async close() {},
      }; }, async close() {} };
      const code = await runFirstLook(['--page', 'url', '--hive', '--before', 'http://127.0.0.1:1', '--after', 'http://127.0.0.1:1', '--out', path.join(dir, 'out')], { root: path.join(dir, 'repo'), browser: async () => browser, readTree: async () => 'Renderer: webgl', stdout: line => lines.push(line) });
      assert.equal(code, mode === 'drawn' ? 0 : 1);
      if (mode === 'drawn') {
        assert.deepEqual(events.filter(e => e[0] === 'width').map(e => e[1]), [380, 1280, 380, 1280]); assert.equal(events.filter(e => e[0] === 'shot').length, 8);
        assert.equal(events.filter(e => e[0] === 'pixels').length, 4);
        assert(events.filter(e => e[0] === 'motion').every(e => e[1].reducedMotion === 'reduce')); assert.equal(events.filter(e => e[0] === 'motion').length, 4);
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

// req: R-3142
await test("R-3142: reference mode captures page frames, copies ordered references and writes manifest and side-by-side HTML", async () => {
  const dir = await temp(); const root = path.join(dir, "repo"); const out = path.join(dir, "out");
  const refs = path.join(dir, "refs"); const spec = path.join(dir, "spec.md");
  await fs.mkdir(root); await fs.mkdir(refs);
  for (const [name, value] of [["b.JPG", "ref-b"], ["a.png", "ref-a"], ["c.jpeg", "ref-c"], ["d.png", "ref-d"], ["e.jpg", "ref-e"], ["z.png", "ref-z"], ["ignore.gif", "ignore"]]) await fs.writeFile(path.join(refs, name), value);
  await fs.writeFile(spec, "1. Look \r\n2. Type\t");
  const calls = { viewport: [], pages: [], screenshots: [], motion: 0 };
  const browser = { async newPage({ viewport }) { calls.viewport.push(viewport); return {
    async goto(url) { calls.pages.push(url); }, async emulateMedia(options) { assert.deepEqual(options, { reducedMotion: "reduce" }); calls.motion++; },
    async screenshot(options) { calls.screenshots.push(options); await fs.writeFile(options.path, "shot"); }, async close() {},
  }; }, async close() {} };
  try {
    const code = await runFirstLook(["--page", "url", "--after", "https://example.test", "--reference", refs, "--spec", spec, "--out", out], { root, browser: async () => browser, stdout: () => {} });
    assert.equal(code, 0); assert.deepEqual(calls.viewport.map((v) => v.width), VIEWPORT_WIDTHS);
    assert.deepEqual(calls.screenshots.map((s) => [path.basename(s.path), s.fullPage]), [["page-380-full.png", true], ["page-380.png", false], ["page-1280-full.png", true], ["page-1280.png", false]]);
    assert.equal(calls.motion, VIEWPORT_WIDTHS.length);
    assert.deepEqual((await fs.readdir(out)).sort(), ["manifest.json", "page-1280-full.png", "page-1280.png", "page-380-full.png", "page-380.png", "reference-1.png", "reference-2.JPG", "reference-3.jpeg", "reference-4.png", "reference-5.jpg", "side-by-side.html", "spec.md"].sort());
    assert.equal(await fs.readFile(path.join(out, "reference-1.png"), "utf8"), "ref-a");
    assert.equal(await fs.readFile(path.join(out, "reference-5.jpg"), "utf8"), "ref-e");
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8")), { pageFrames: [{ width: 380, file: "page-380.png" }, { width: 1280, file: "page-1280.png" }], referenceFrames: ["reference-1.png", "reference-2.JPG", "reference-3.jpeg", "reference-4.png", "reference-5.jpg"], spec: "spec.md" });
    const html = await fs.readFile(path.join(out, "side-by-side.html"), "utf8");
    for (const name of ["page-380.png", "page-1280.png", "reference-1.png", "reference-2.JPG", "reference-3.jpeg", "reference-4.png", "reference-5.jpg"]) assert.ok(html.includes(name));
    await assert.rejects(fs.access(path.join(out, "reference-6.png")));
    assert.ok(!html.includes("side-by-side.png"));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

// req: R-3143
await test("R-3143: invalid url-mode inputs refuse in one line before browser launch", async () => {
  const dir = await temp(); const root = path.join(dir, "repo"); await fs.mkdir(root);
  const refs = path.join(dir, "refs"); await fs.mkdir(refs); await fs.writeFile(path.join(refs, "readme.txt"), "not image");
  const spec = path.join(dir, "empty.md"); await fs.writeFile(spec, "no numbered item\r\n");
  const out = path.join(dir, "out"); let launches = 0;
  const cases = [
    [["--page", "url", "--after", "u", "--out", out], "first-look: url mode needs --reference with --spec, or --before"],
    [["--page", "url", "--after", "u", "--reference", refs, "--out", out], "first-look: --reference requires --spec and cannot be used with --before"],
    [["--page", "url", "--after", "u", "--reference", refs, "--spec", spec, "--out", out], "first-look: spec has no numbered lines"],
    [["--page", "url", "--after", "u", "--reference", refs, "--spec", path.join(dir, "too-many.md"), "--out", out], "first-look: spec has too many numbered lines"],
    [["--page", "url", "--after", "u", "--reference", refs, "--spec", path.join(dir, "one.md"), "--out", out], "first-look: reference folder has no PNG or JPEG images"],
    [["--page", "url", "--after", "u", "--before", "b", "--out", path.join(root, "inside")], "first-look: --out must be outside the repository"],
  ];
  await fs.writeFile(path.join(dir, "too-many.md"), Array.from({ length: MAX_SPEC_LINES + 1 }, (_, i) => `${i + 1}. spec`).join("\n"));
  await fs.writeFile(path.join(dir, "one.md"), "1. spec");
  for (const [args, refusal] of cases) {
    const lines = []; const code = await runFirstLook(args, { root, browser: async () => { launches++; return fakeBrowser({ viewports: [], urls: [], shots: [] }); }, stdout: (line) => lines.push(line) });
    assert.equal(code, 2); assert.deepEqual(lines, [refusal]);
  }
  assert.equal(launches, 0);
  await fs.rm(dir, { recursive: true, force: true });
});

// req: R-3148
await test("R-3148: first-look seals reference limits with provenance", async () => {
  assert.equal(REFERENCE_FRAME_CAP, 5); assert.equal(MAX_SPEC_LINES, 12);
  assert.deepEqual(ACCEPTED_IMAGE_EXTENSIONS, [".png", ".jpg", ".jpeg"]);
});

if (!process.exitCode) console.log(`${passed} first-look checks passed`);
