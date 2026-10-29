#!/usr/bin/env node
/**
 * @module scripts/first-look.mjs
 * @purpose Captures before and after product or desk pages for a lane's first visual review.
 * @inputs CLI options, git checkout state, report children, Playwright and an optional injected test seam.
 * @outputs Four screenshots, an accessibility-tree diff, or one bounded no-change/browser note.
 * @effects disk (temporary reports/worktree and requested output), process (git, report children and browser).
 * @errors Usage errors exit 2; report/browser setup failures are bounded and never expose raw errors.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PAGE_SHAPING_PATHS, PRODUCT_VIEWS, VIEWPORT_WIDTHS, HIVE_READY_TIMEOUT_MS, HIVE_PROBE_FRACTION, HIVE_BACKGROUND } from "./first-look-config.mjs";

import { resolvePlaywright } from "./playwright-resolve.mjs";
const INSTALL_LINE = "first-look: Playwright is unavailable; install it with `npm install --no-save playwright` and `npx playwright install chromium`.";
const runGit = (cwd, args) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("git command failed");
  return String(result.stdout ?? "").trim();
};
function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--hive' && !result[flag]) { result[flag] = true; continue; }
    if (!["--page", "--out", "--before", "--after"].includes(flag) || !argv[i + 1] || result[flag]) return null;
    result[flag] = argv[++i];
  }
  if (!result["--page"] || !["product", "desk", "url"].includes(result["--page"])) return null;
  if (result["--page"] === "product" && (!result["--out"] || result["--before"] || result["--after"] || result['--hive'])) return null;
  if (result["--page"] !== "product" && (!result["--before"] || !result["--after"])) return null;
  if (result["--page"] === "desk" && result["--out"]) return null;
  return result;
}
function changedPagePath(file) {
  return PAGE_SHAPING_PATHS.some((entry) => entry.endsWith("/") ? file.startsWith(entry) : file === entry);
}
async function childReport(root, output) {
  const result = spawnSync(process.execPath, [path.join(root, "scripts/product-report.mjs"), "--root", root, "--out", output], {
    cwd: root, encoding: "utf8", windowsHide: true, stdio: "ignore",
  });
  if (result.status !== 0) throw new Error("report build failed");
  return pathToFileURL(output).href;
}
function withoutProvenance(snapshot) {
  return String(snapshot).split(/\r?\n/).filter((line) => !/(?:Commit|Working tree):|\b20\d\d-\d\d-\d\d\b/.test(line)).join("\n");
}
function diffOperations(before, after) {
  const a = before.split("\n"); const b = after.split("\n");
  let v = new Map([[1, 0]]); const trace = [];
  for (let d = 0; d <= a.length + b.length; d++) {
    trace.push(new Map(v));
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && (v.get(k - 1) ?? -1) < (v.get(k + 1) ?? -1))
        ? (v.get(k + 1) ?? 0) : (v.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < a.length && y < b.length && a[x] === b[y]) { x++; y++; }
      v.set(k, x);
      if (x >= a.length && y >= b.length) {
        const operations = []; let cx = a.length; let cy = b.length;
        for (let depth = d; depth >= 0; depth--) {
          const prior = trace[depth]; const diagonal = cx - cy;
          const priorDiagonal = diagonal === -depth || (diagonal !== depth && (prior.get(diagonal - 1) ?? -1) < (prior.get(diagonal + 1) ?? -1))
            ? diagonal + 1 : diagonal - 1;
          const px = prior.get(priorDiagonal) ?? 0; const py = px - priorDiagonal;
          while (cx > px && cy > py) operations.push({ type: " ", line: a[--cx] }), cy--;
          if (depth > 0) {
            if (cx === px) operations.push({ type: "+", line: b[--cy] });
            else operations.push({ type: "-", line: a[--cx] });
          }
        }
        return operations.reverse();
      }
    }
  }
  return [];
}
function unifiedViewDiff(view, before, after) {
  if (before === after) return "";
  const operations = diffOperations(before, after); const context = 3; const ranges = [];
  for (let i = 0; i < operations.length; i++) if (operations[i].type !== " ") {
    const start = Math.max(0, i - context); const end = Math.min(operations.length, i + context + 1);
    const last = ranges.at(-1);
    if (last && start <= last[1]) last[1] = end; else ranges.push([start, end]);
  }
  const chunks = [`## ${view}`, `--- ${view} (before)`, `+++ ${view} (after)`];
  for (const [start, end] of ranges) {
    let oldLine = 0; let newLine = 0;
    for (let i = 0; i < start; i++) { if (operations[i].type !== "+") oldLine++; if (operations[i].type !== "-") newLine++; }
    let oldCount = 0; let newCount = 0;
    for (const operation of operations.slice(start, end)) { if (operation.type !== "+") oldCount++; if (operation.type !== "-") newCount++; }
    chunks.push(`@@ -${oldLine + 1},${oldCount} +${newLine + 1},${newCount} @@`);
    for (const operation of operations.slice(start, end)) chunks.push(`${operation.type}${operation.line}`);
  }
  return chunks.join("\n");
}
function accessibilityDiff(before, after, views) {
  const changed = views.map((view) => unifiedViewDiff(view, before[view] ?? "", after[view] ?? "")).filter(Boolean);
  const unchanged = views.length - changed.length;
  return `${changed.join("\n\n")}\n\n${changed.length} views changed; ${unchanged} views unchanged\n`;
}
async function snapshotViews(browser, url, pageName, side, readTree, product, hive) {
  const page = await browser.newPage({ viewport: { width: VIEWPORT_WIDTHS[0], height: 1000 } });
  if (hive) await page.emulateMedia({ reducedMotion: 'reduce' });
  const waitReady = async () => {
    if (!hive) return;
    try { await page.waitForSelector('html[data-hive-ready]', { timeout: HIVE_READY_TIMEOUT_MS }); }
    catch { throw new Error('first-look: the hive ready wait timed out'); }
  };
  const checkCanvas = async () => {
    if (!hive) return;
    const drawn = await page.evaluate(({ background, fraction }) => {
      const canvas = document.querySelector('canvas');
      if (!canvas || !canvas.width || !canvas.height) return false;
      const probe = document.createElement('canvas'); probe.width = canvas.width; probe.height = canvas.height;
      const ctx = probe.getContext('2d'); ctx.drawImage(canvas, 0, 0);
      const w = Math.max(1, Math.floor(canvas.width * fraction)); const h = Math.max(1, Math.floor(canvas.height * fraction));
      const pixels = ctx.getImageData(Math.floor((canvas.width - w) / 2), Math.floor((canvas.height - h) / 2), w, h).data;
      const rgb = background.slice(1).match(/../g).map(c => parseInt(c, 16));
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] && rgb.some((v, j) => pixels[i + j] !== v)) return true;
      return false;
    }, { background: HIVE_BACKGROUND, fraction: HIVE_PROBE_FRACTION });
    if (!drawn) throw new Error('first-look: the hive canvas is empty');
  };
  const trees = {};
  const landing = product ? `${url}#overview` : url;
  await page.goto(landing, { waitUntil: "load" });
  const features = product ? await page.evaluate(() => JSON.parse(document.getElementById("report-data").textContent).features.map((feature) => feature.id)) : [];
  for (const view of product ? [...PRODUCT_VIEWS, ...features] : ["desk"]) {
    await page.goto(product ? `${url}#${view}` : url, { waitUntil: "load" });
    await waitReady();
    trees[view] = withoutProvenance(await readTree(page, view));
  }
  for (const width of VIEWPORT_WIDTHS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(landing, { waitUntil: "load" });
    await waitReady();
    await checkCanvas();
    await page.screenshot({ path: path.join(pageName, `${side}-${width}.png`), fullPage: true });
  }
  await page.close();
  return trees;
}
export async function runFirstLook(argv = [], injected = {}) {
  const args = parseArgs(argv);
  if (!args) { (injected.stdout ?? console.log)("Usage: first-look --page product --out <dir> | --page desk --before <url> --after <url> | --page url [--hive] --before <url> --after <url> [--out <dir>]"); return 2; }
  const root = path.resolve(injected.root ?? process.cwd());
  const stdout = injected.stdout ?? console.log;
  let base = injected.mergeBase;
  let changed = injected.changedPaths;
  let tempRoot = null;
  let output = null;
  let browser;
  try {
    if (args["--page"] === "product") {
      base ??= runGit(root, ["merge-base", "main", "HEAD"]);
      changed ??= runGit(root, ["diff", "--name-only", "-z", base, "--", ...PAGE_SHAPING_PATHS]).split("\0").filter(Boolean);
      changed = changed.filter(changedPagePath);
      if (!changed.length) { stdout("first-look: no page-shaping changes; nothing to show"); return 0; }
      output = path.resolve(root, args["--out"]);
    } else output = path.resolve(args['--out'] ?? injected.outputDir ?? path.join(os.tmpdir(), `first-look-desk-${process.pid}`));
    try {
      browser = injected.browser !== undefined ? await injected.browser?.() : await resolvePlaywright(injected.env ?? process.env, root)?.chromium?.launch();
    } catch { stdout(INSTALL_LINE); return 0; }
    if (!browser) { stdout(INSTALL_LINE); return 0; }
    await mkdir(output, { recursive: true });
    const readTree = injected.readTree ?? (async (page) => page.locator("body").ariaSnapshot());
    let beforeUrl; let afterUrl;
    if (args["--page"] === "product") {
      if (injected.runReport) {
        beforeUrl = await injected.runReport(base, path.join(output, "before-report.html"));
      } else {
        tempRoot = await mkdtemp(path.join(os.tmpdir(), "nana-first-look-wt-"));
        await rm(tempRoot, { recursive: true, force: true });
        const add = spawnSync("git", ["worktree", "add", "--detach", tempRoot, base], { cwd: root, stdio: "ignore", windowsHide: true });
        if (add.status !== 0) throw new Error("temporary worktree failed");
        beforeUrl = await childReport(tempRoot, path.join(output, "before-report.html"));
      }
      afterUrl = injected.runReport ? await injected.runReport(root, path.join(output, "after-report.html")) : await childReport(root, path.join(output, "after-report.html"));
    } else { beforeUrl = args["--before"]; afterUrl = args["--after"]; }
    const product = args["--page"] === "product";
    const before = await snapshotViews(browser, beforeUrl, output, "before", readTree, product, args['--hive']);
    const after = await snapshotViews(browser, afterUrl, output, "after", readTree, product, args['--hive']);
    const views = product ? [...new Set([...PRODUCT_VIEWS, ...Object.keys(before).filter((key) => !PRODUCT_VIEWS.includes(key))])] : ["desk"];
    const diff = accessibilityDiff(before, after, views);
    await (injected.writeDiff ? injected.writeDiff(output, diff) : import("node:fs/promises").then(({ writeFile }) => writeFile(path.join(output, "accessibility-diff.txt"), diff, "utf8")));
    stdout(`first-look: saved screenshots and accessibility diff in ${output}`);
    return 0;
  } catch (error) {
    stdout(['first-look: the hive canvas is empty', 'first-look: the hive ready wait timed out'].includes(error.message) ? error.message : "first-look: report or page capture failed");
    return 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tempRoot) {
      spawnSync("git", ["worktree", "remove", "--force", tempRoot], { cwd: root, stdio: "ignore", windowsHide: true });
      await rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    }
  }
}
if (process.argv[1] && existsSync(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await runFirstLook(process.argv.slice(2));
