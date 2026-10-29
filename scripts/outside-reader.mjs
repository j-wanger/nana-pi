#!/usr/bin/env node
/**
 * @module scripts/outside-reader.mjs
 * @purpose Gives a cold model a bounded product-page read and checks its quoted evidence.
 * @inputs CLI from/url and out, optional model overrides, objective child, known bugs, browser and watchdog seams.
 * @outputs External prompt.md, page-text.txt, reader.md and checked findings on stdout.
 * @effects disk (external output and temporary empty cwd), process (objective child, browser and watchdog)
 * @errors Usage exits 2; missing capabilities exit 0 with a note; capture/model failures exit 1 bounded.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolvePlaywright } from "./playwright-resolve.mjs";
import { outsideRepo, splitNumbered } from "./reader-common.mjs";
import { runWatchdog } from "../packages/nana-pack/bin/pi-watchdog.mjs";
import { resolveRoster } from "../packages/nana-pack/bin/nana-roster.mjs";
import { piAgentDir } from "../packages/nana-pack/lib/agent-dir.mjs";
import { REVIEWER_CHILD_ENV } from "../packages/nana-pack/bin/worker-config.mjs";
import { KNOWN_BUGS_DIR } from "../packages/nana-pack/lib/known-bugs-config.mjs";
import { MAX_FINDINGS, READER_VIEWS, VIEW_TEXT_CAP, PHONE_LANDING_TEXT_CAP, DIFF_CAP, KNOWN_BUG_CAP, PROMPT_PATH, KNOWN_BUG_FEATURE, ROSTER_SLOT_ORDER, STALL_SECS, RETRIES, MAX_SECS, POLL_SECS, VIEWPORT_WIDTHS, VIEWPORT_HEIGHT } from "./outside-reader-config.mjs";

const SOURCE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const INSTALL_LINE = "outside-reader: Playwright is unavailable; install it with `npm install --no-save playwright` and `npx playwright install chromium`.";
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!["--from", "--url", "--out", "--provider", "--model", "--thinking"].includes(flag) || !argv[i + 1] || argv[i + 1].startsWith("--") || args[flag]) return null;
    args[flag] = argv[++i];
  }
  return args["--out"] && Boolean(args["--from"]) !== Boolean(args["--url"]) ? args : null;
}
function objectiveBlock(root) {
  const result = spawnSync(process.execPath, [path.join(SOURCE_ROOT, "packages/nana-pack/bin/nana-objective.mjs"), "--cwd", root], { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error("objective failed");
  return String(result.stdout ?? "").trim();
}
async function knownBugs(root) {
  let text;
  try { text = await readFile(path.join(root, KNOWN_BUGS_DIR, `${KNOWN_BUG_FEATURE}.md`), "utf8"); }
  catch (error) { if (error.code === "ENOENT") return ""; throw error; }
  const bullets = text.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.startsWith("- ")).reverse();
  const kept = []; let size = 0;
  for (const line of bullets) {
    const next = line.length + (kept.length ? 1 : 0);
    if (size + next > KNOWN_BUG_CAP) break;
    kept.push(line); size += next;
  }
  const left = bullets.length - kept.length;
  return `${kept.join("\n")}${left ? `\n${left} earlier known-bug lines left out` : ""}`;
}
const normalise = (text) => String(text).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
/** Numbered findings only; any honest matching quote is enough, not every phrase must match. */
export function checkQuotes(answer, pageText) {
  const page = normalise(pageText);
  return splitNumbered(answer).map(({ text }) => {
    const quotes = [...normalise(text).matchAll(/"([^"]+)"/g)].map((match) => match[1].replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, ""));
    return { text, matched: quotes.some((quote) => quote.length > 0 && page.includes(quote)) };
  });
}
async function capture(browser, url) {
  const sections = []; const texts = [];
  for (const width of VIEWPORT_WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
    try {
      for (const view of READER_VIEWS) {
        const target = new URL(url); target.hash = view;
        await page.goto(target.href, { waitUntil: "load" });
        const raw = await page.evaluate(() => document.body.innerText);
        if (!String(raw).trim()) throw new Error("empty view");
        const cap = width === VIEWPORT_WIDTHS[0] && view === "" ? PHONE_LANDING_TEXT_CAP : VIEW_TEXT_CAP;
        const text = String(raw).slice(0, cap);
        texts.push(text); sections.push(`===== ${width}px · ${view || "(landing)"} =====\n${text}`);
      }
    } finally { await page.close(); }
  }
  return { text: sections.join("\n\n"), evidence: texts.join("\n") };
}
export async function runOutsideReader(argv = [], injected = {}) {
  const stdout = injected.stdout ?? console.log;
  const args = parseArgs(argv);
  if (!args) { stdout("Usage: outside-reader --from <first-look folder> | --url <url or path> --out <dir> [--provider <id>] [--model <id>] [--thinking <level>]"); return 2; }
  const root = path.resolve(injected.root ?? process.cwd());
  const output = path.resolve(root, args["--out"]);
  if (!outsideRepo(root, output)) {
    stdout("outside-reader: --out must be outside the repository"); return 2;
  }
  let browser; let cwd;
  try {
    const objective = String(await (injected.objective ?? objectiveBlock)(root)).trim();
    if (!objective) { stdout("outside-reader: objective is empty; nothing to read against"); return 0; }
    const resolved = (injected.roster ?? (() => resolveRoster(piAgentDir())))();
    const entry = resolved.ok ? ROSTER_SLOT_ORDER.map((slot) => resolved.roster[slot]).find((item) => item?.provider && item?.model && !item.runtime) : null;
    const model = args["--model"] ?? entry?.model;
    const provider = args["--provider"] ?? entry?.provider;
    const thinking = args["--thinking"] ?? entry?.thinking;
    if (!model) { stdout("outside-reader: no pi roster entry; supply --model"); return 0; }
    try {
      browser = injected.browser !== undefined ? await injected.browser?.() : await resolvePlaywright(injected.env ?? process.env, root)?.chromium?.launch();
    } catch { stdout(INSTALL_LINE); return 0; }
    if (!browser) { stdout(INSTALL_LINE); return 0; }
    const from = args["--from"] ? path.resolve(root, args["--from"]) : null;
    const input = from ? path.join(from, "after-report.html") : args["--url"];
    const url = /^(?:https?|file):\/\//i.test(input) ? input : pathToFileURL(path.resolve(root, input)).href;
    const page = await capture(browser, url);
    await browser.close(); browser = null;
    const template = await readFile(path.join(SOURCE_ROOT, PROMPT_PATH), "utf8");
    const bugs = await knownBugs(root);
    const diff = from ? `\n## Change\n${(await readFile(path.join(from, "accessibility-diff.txt"), "utf8")).slice(0, DIFF_CAP)}\n` : "";
    const prompt = `${template.replaceAll("{{MAX_FINDINGS}}", String(MAX_FINDINGS))}\n## Purpose\n${objective}\n\n## Known bugs\n${bugs}\n${diff}\n## Page text\n${page.text}\n`;
    await mkdir(output, { recursive: true });
    const promptFile = path.join(output, "prompt.md"); const answerFile = path.join(output, "reader.md");
    await writeFile(promptFile, prompt, "utf8"); await writeFile(path.join(output, "page-text.txt"), page.text, "utf8");
    await rm(answerFile, { force: true });
    cwd = await mkdtemp(path.join(os.tmpdir(), "nana-outside-reader-"));
    const piArgs = ["-p", "--no-tools", "--no-session", "-ne", "-ns", "-nc", "-np", ...(provider ? ["--provider", provider] : []), "--model", model, ...(thinking ? ["--thinking", thinking] : []), `@${promptFile}`, "go"];
    let result;
    try {
      result = await (injected.watchdog ?? runWatchdog)("outside-reader", { piArgs, cwd, childEnv: REVIEWER_CHILD_ENV, stallSecs: STALL_SECS, retries: RETRIES, maxSecs: MAX_SECS, pollSecs: POLL_SECS, accept: (text) => Boolean(text.trim()) });
    } catch { /* bounded below, never expose model or spawn error text */ }
    if (!result?.ok || result.ceiling || !result.text?.trim()) { stdout("outside-reader: the reader run failed"); return 1; }
    await writeFile(answerFile, result.text, "utf8");
    const findings = checkQuotes(result.text, page.evidence);
    if (!findings.length) { stdout("outside-reader: 0 findings; nothing to show the owner"); return 0; }
    const missing = findings.filter((finding) => !finding.matched).length;
    stdout(`outside-reader: ${findings.length} findings, ${missing} quotes not found; saved in ${output}`);
    for (const finding of findings) stdout(`${finding.text}${finding.matched ? "" : "\nquote not found on the page"}`);
    return 0;
  } catch { stdout("outside-reader: purpose or page capture failed"); return 1; }
  finally {
    if (browser) await browser.close().catch(() => {});
    if (cwd) await rm(cwd, { recursive: true, force: true }).catch(() => {});
  }
}
if (process.argv[1] && existsSync(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await runOutsideReader(process.argv.slice(2));
