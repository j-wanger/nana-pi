#!/usr/bin/env node
/**
 * @module scripts/visual-reader.mjs
 * @purpose Ask the roster's cold Claude Code reviewer to judge first-look frames against a numbered visual spec.
 * @inputs First-look manifest, prompt template, roster reviewer, watchdog and optional test seams.
 * @outputs External prompt and answer files plus a bounded visual verdict and item lines.
 * @effects disk (external output and temporary folder), process (Claude Code through runWatchdog).
 * @errors Usage and invalid-input exits are bounded; run failures print one line and exit 1.
 */
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { outsideRepo, splitNumbered } from "./reader-common.mjs";
import { runWatchdog } from "../packages/nana-pack/bin/pi-watchdog.mjs";
import { resolveRoster } from "../packages/nana-pack/bin/nana-roster.mjs";
import { piAgentDir } from "../packages/nana-pack/lib/agent-dir.mjs";
import {
  CLAUDE_BIN, CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, CLAUDE_ALLOW_FLAG, REVIEW_SLOT,
} from "../packages/nana-pack/lib/claude-review-config.mjs";
import {
  CLAUDE_CODE_RUNTIME, CLAUDE_TOOLS_FLAG, CLAUDE_STRICT_MCP_FLAG, CLAUDE_BUILDER_STALL_SECS,
  CLAUDE_BUILDER_CHILD_ENV, REVIEWER_CHILD_ENV,
} from "../packages/nana-pack/bin/worker-config.mjs";
import { reviewLaunch } from "../packages/nana-pack/bin/review-launch.mjs";
import {
  PROMPT_PATH, INSTRUCTION, MAX_SPEC_LINES, REFERENCE_FRAME_CAP,
  CLAUDE_RESTRICTED_FLAG, CLAUDE_DISABLE_SLASH_FLAG, CLAUDE_NO_SESSION_FLAG,
  RETRIES, MAX_SECS, POLL_SECS,
} from "./visual-reader-config.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!["--from", "--out", "--control", "--model"].includes(flag)) return null;
    if (flag === "--control") { if (result[flag]) return null; result[flag] = true; continue; }
    if (result[flag] || !argv[i + 1] || argv[i + 1].startsWith("--")) return null;
    result[flag] = argv[++i];
  }
  return result["--from"] && result["--out"] ? result : null;
}
function safeName(name) {
  return typeof name === "string" && name !== "" && path.basename(name) === name && !name.includes("..") ? name : null;
}
function specLines(text) {
  return String(text).split(/\r?\n/).filter((line) => /^\s*\d+[.)]\s+/.test(line));
}
async function readInputs(from, control) {
  const manifestPath = path.join(from, "manifest.json");
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
  catch { return { problem: "visual-reader: first-look manifest is missing" }; }
  if (!manifest || !Array.isArray(manifest.pageFrames) || !Array.isArray(manifest.referenceFrames) || !safeName(manifest.spec)) return { problem: "visual-reader: first-look manifest is invalid" };
  if (!manifest.referenceFrames.length || manifest.referenceFrames.length > REFERENCE_FRAME_CAP) return { problem: "visual-reader: first-look manifest is invalid" };
  const specName = safeName(manifest.spec);
  let spec;
  try { spec = await readFile(path.join(from, specName), "utf8"); } catch { return { problem: "visual-reader: first-look manifest is invalid" }; }
  const lines = specLines(spec);
  if (!lines.length || lines.length > MAX_SPEC_LINES) return { problem: "visual-reader: first-look manifest is invalid" };
  const pageFrames = control ? [] : manifest.pageFrames.map((frame) => ({ width: frame.width, file: safeName(frame.file) }));
  if (pageFrames.some((frame) => !frame.file || !Number.isSafeInteger(frame.width))) return { problem: "visual-reader: first-look manifest is invalid" };
  const references = manifest.referenceFrames.map(safeName);
  if (references.some((name) => !name)) return { problem: "visual-reader: first-look manifest is invalid" };
  if (control) pageFrames.push(...references.map((file) => ({ width: null, file })));
  return { spec, lines, pageFrames, references };
}
function renderPrompt(template, spec, attachments) {
  const list = attachments.map((item, index) => `${index + 1}. ${item.role} image ${item.file}${item.width === null ? "" : ` at ${item.width}px`}`).join("\n");
  return `${template.trimEnd()}\n\n## Art spec\n${spec.trimEnd()}\n\n## Attached images\n${list}\n`;
}
function verdictOf(answer, expectedCount) {
  const text = String(answer).replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  while (lines.at(-1) === "") lines.pop();
  const last = lines.at(-1);
  const verdict = last === "Verdict: holds up" ? "holds up" : last === "Verdict: reads as a demo against the reference" ? "reads as a demo against the reference" : null;
  const items = splitNumbered(text);
  const byNumber = new Map(); const unknown = [];
  for (const item of items) {
    const status = /\b(PASS|FAIL|UNJUDGED)\b/i.exec(item.text)?.[1]?.toUpperCase();
    if (item.number < 1 || item.number > expectedCount) { unknown.push(item.number); continue; }
    const entries = byNumber.get(item.number) ?? []; entries.push(status ?? null); byNumber.set(item.number, entries);
  }
  let failures = 0; let unanswered = 0; let passes = 0; const unjudged = [];
  for (let number = 1; number <= expectedCount; number++) {
    const statuses = byNumber.get(number) ?? [];
    if (statuses.includes("UNJUDGED")) unjudged.push(number);
    if (statuses.length !== 1 || !statuses[0]) { unanswered++; continue; }
    if (statuses[0] === "FAIL") failures++;
    else if (statuses[0] === "PASS") passes++;
  }
  const passed = failures === 0 && unanswered === 0 && unknown.length === 0 && passes > 0 && verdict === "holds up";
  return { passed, failures, unanswered, unknown, unjudged, verdict, items };
}
export async function runVisualReader(argv = [], injected = {}) {
  const stdout = injected.stdout ?? console.log;
  const args = parseArgs(argv);
  if (!args) { stdout("Usage: visual-reader --from <first-look folder> [--control] --out <folder> [--model <model>]"); return 2; }
  const root = path.resolve(injected.root ?? process.cwd()); const from = path.resolve(root, args["--from"]); const output = path.resolve(root, args["--out"]);
  if (!outsideRepo(root, output)) { stdout("visual-reader: --out must be outside the repository"); return 2; }
  const rosterResult = (injected.roster ?? (() => resolveRoster(piAgentDir())))();
  const reviewer = rosterResult?.ok ? rosterResult.roster?.[REVIEW_SLOT] : null;
  if (reviewer?.runtime !== CLAUDE_CODE_RUNTIME) { stdout("visual-reader: no Claude Code reviewer in roster; skipped"); return 0; }
  const input = await readInputs(from, Boolean(args["--control"]));
  if (input.problem) { stdout(input.problem); return 2; }
  const templatePath = path.join(ROOT, PROMPT_PATH);
  const template = await readFile(templatePath, "utf8");
  const attachments = [
    ...input.pageFrames.map((frame) => ({ ...frame, role: "page" })),
    ...input.references.map((file) => ({ file, width: null, role: "reference" })),
  ];
  const childAttachments = attachments.map((item, index) => ({ ...item, file: `image-${index + 1}${path.extname(item.file) || ".png"}` }));
  await mkdir(output, { recursive: true });
  const prompt = renderPrompt(template, input.spec, childAttachments);
  const promptFile = path.join(output, "prompt.md"); const answerFile = path.join(output, "reader.md");
  await writeFile(promptFile, prompt, "utf8"); await rm(answerFile, { force: true });
  let cwd;
  try {
    cwd = await import("node:fs/promises").then(({ mkdtemp }) => mkdtemp(path.join(os.tmpdir(), "nana-visual-reader-")));
    for (let index = 0; index < attachments.length; index++) {
      await copyFile(path.join(from, attachments[index].file), path.join(cwd, childAttachments[index].file));
    }
    await writeFile(path.join(cwd, "prompt.md"), prompt, "utf8");
    const model = args["--model"] ?? reviewer.model;
    const claudeArgs = [CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, model, CLAUDE_RESTRICTED_FLAG, CLAUDE_STRICT_MCP_FLAG, CLAUDE_DISABLE_SLASH_FLAG, CLAUDE_NO_SESSION_FLAG, `${CLAUDE_TOOLS_FLAG}=Read`, `${CLAUDE_ALLOW_FLAG}=Read`];
    let result;
    try {
      result = await (injected.watchdog ?? runWatchdog)("visual-reader", {
        piArgs: [...claudeArgs, INSTRUCTION], cwd,
        childEnv: { ...REVIEWER_CHILD_ENV, ...CLAUDE_BUILDER_CHILD_ENV },
        stallSecs: CLAUDE_BUILDER_STALL_SECS, retries: RETRIES, maxSecs: MAX_SECS, pollSecs: POLL_SECS,
        accept: (text) => Boolean(String(text).trim()),
        launch: (childArgs, options = {}) => reviewLaunch([CLAUDE_BIN, ...childArgs], options),
      });
    } catch { /* bounded below */ }
    if (!result?.ok || result.ceiling || !result.text?.trim()) { await rm(answerFile, { force: true }); stdout("visual-reader: the reader run failed"); return 1; }
    await writeFile(answerFile, result.text, "utf8");
    const checked = verdictOf(result.text, input.lines.length);
    if (checked.passed) stdout("visual-reader: pass");
    else {
      const verdict = checked.verdict ? `verdict ${checked.verdict}` : "no verdict";
      stdout(`visual-reader: fail; ${checked.failures} FAIL, ${checked.unanswered} unanswered, ${checked.unknown.length} unknown; ${verdict}`);
    }
    if (checked.unjudged.length) stdout(`unjudged: ${checked.unjudged.join(", ")}`);
    if (checked.verdict === "reads as a demo against the reference") stdout("visual-reader: the page reads as a demo against the reference");
    for (const item of checked.items) stdout(item.text);
    return checked.passed ? 0 : 1;
  } catch {
    await rm(answerFile, { force: true }); stdout("visual-reader: the reader run failed"); return 1;
  } finally { if (cwd) await rm(cwd, { recursive: true, force: true }).catch(() => {}); }
}
if (process.argv[1] && existsSync(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await runVisualReader(process.argv.slice(2));
