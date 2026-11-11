/**
 * @module packages/nana-pack/tests/first-look.test.mjs
 * @purpose Pins first-look report building, page-change detection, browser fallback and its sealed page inputs.
 * @inputs First-look implementation and temporary test directories.
 * @outputs PASS/FAIL lines and a nonzero exit when a contract fails.
 * @effects disk (OS temporary fixtures only)
 * @errors A failed assertion exits 1.
 */
import assert from "node:assert/strict";
import { tmpDir } from "./tmp-dir.mjs";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runFirstLook } from "../../../scripts/first-look.mjs";
import { ACCESSIBILITY_DIFF_MAX_LINES, PRODUCT_VIEWS, VIEWPORT_WIDTHS } from "../../../scripts/first-look-config.mjs";

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
const temp = () => tmpDir(path.join(os.tmpdir(), "nana-first-look-"));
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

// req: R-3040 R-3779
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
    const diff = await fs.readFile(path.join(dir, "out", "accessibility-diff.txt"), "utf8");
    assert.match(diff, /## overview/);
    assert.match(diff, /-before heading/);
    assert.match(diff, /\+after heading/);
    assert.doesNotMatch(diff, /## decisions/);
    assert.match(diff, /1 views changed; 7 views unchanged/);
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
  const out = path.join(dir, "out"); let launches = 0;
  const cases = [
    [["--page", "url", "--after", "u", "--out", out], "first-look: url mode needs --reference with --spec, or --before"],
    [["--page", "url", "--after", "u", "--before", "b", "--out", path.join(root, "inside")], "first-look: --out must be outside the repository"],
  ];
  for (const [args, refusal] of cases) {
    const lines = []; const code = await runFirstLook(args, { root, browser: async () => { launches++; return fakeBrowser({ viewports: [], urls: [], shots: [] }); }, stdout: (line) => lines.push(line) });
    assert.equal(code, 2); assert.deepEqual(lines, [refusal]);
  }
  assert.equal(launches, 0);
  await fs.rm(dir, { recursive: true, force: true });
});

const root = fileURLToPath(new URL('../../../', import.meta.url));
const browser = () => ({
  async newPage() { return { async goto() {}, async evaluate() { return []; }, async emulateMedia() {}, async setViewportSize() {}, locator() { return { async ariaSnapshot() { return 'page'; } }; }, async screenshot({ path: file }) { await fs.writeFile(file, 'shot'); }, async close() {} }; }, async close() {},
});
const capture = (args, options = {}) => runFirstLook(args, { browser: async () => browser(), stdout() {}, ...options });
// req: R-3781
await test('R-3781: surviving capture modes write files and retired options never launch', async () => {
  const dir = await temp();
  try {
    const options = { root: path.join(dir, 'repo') }; const out = path.join(dir, 'out');
    assert.equal(await capture(['--page', 'url', '--before', 'before', '--after', 'after', '--out', out], options), 0);
    for (const side of ['before', 'after']) for (const width of VIEWPORT_WIDTHS) for (const suffix of ['', '-full']) await fs.access(path.join(out, `${side}-${width}${suffix}.png`));
    for (const args of [['--page', 'hive', '--out', out], ['--page', 'url', '--hive', '--before', 'before', '--after', 'after', '--out', out]]) {
      let launches = 0; assert.equal(await capture(args, { ...options, browser: async () => { launches++; return browser(); } }), 2); assert.equal(launches, 0);
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

if (!process.exitCode) console.log(`${passed} first-look checks passed`);
