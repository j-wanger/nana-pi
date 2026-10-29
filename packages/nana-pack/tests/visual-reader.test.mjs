/**
 * @module packages/nana-pack/tests/visual-reader.test.mjs
 * @purpose Pins the cold visual judge prompt, launch, answer accounting and bounded failures.
 * @inputs Temporary first-look fixtures, injected roster and watchdog; recorded judge answers.
 * @outputs Awaited PASS/FAIL cases.
 * @effects disk (OS temporary fixtures only)
 * @errors Assertion failures exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runVisualReader } from "../../../scripts/visual-reader.mjs";
import * as C from "../../../scripts/visual-reader-config.mjs";
import { CLAUDE_BIN, CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, CLAUDE_ALLOW_FLAG, REVIEW_SLOT } from "../lib/claude-review-config.mjs";
import { CLAUDE_CODE_RUNTIME, CLAUDE_TOOLS_FLAG, CLAUDE_STRICT_MCP_FLAG, CLAUDE_BUILDER_STALL_SECS, CLAUDE_BUILDER_CHILD_ENV, REVIEWER_CHILD_ENV } from "../bin/worker-config.mjs";
let passed = 0;
const CASE_LIMIT_MS = 20_000;
const splitCount = (answer) => [...String(answer).matchAll(/^\\s*\\d+[.)]\\s+/gm)].length;
async function test(title, fn) {
  let timer;
  try { await Promise.race([fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS); })]); passed++; console.log("PASS", title); }
  catch (error) { console.log("FAIL", title, error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
async function fixture(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nana-visual-reader-test-"));
  const root = path.join(dir, "repo"); const from = path.join(root, "shots"); const out = path.join(dir, "out");
  await fs.mkdir(from, { recursive: true }); await fs.writeFile(path.join(from, "page-380.png"), "page");
  await fs.writeFile(path.join(from, "reference-1.png"), "reference");
  await fs.writeFile(path.join(from, "spec.md"), "Context\r\n1. Scene\t\r\n2) Type\r\n");
  await fs.writeFile(path.join(from, "manifest.json"), JSON.stringify({ pageFrames: [{ width: 380, file: "page-380.png" }], referenceFrames: ["reference-1.png"], spec: "spec.md" }));
  const lines = []; const launches = []; const roster = () => ({ ok: true, roster: { [REVIEW_SLOT]: { runtime: CLAUDE_CODE_RUNTIME, model: "opus" } } });
  const seams = { root, stdout: (line) => lines.push(line), roster, watchdog: async (tag, options) => { const files = await fs.readdir(options.cwd); const contents = {}; for (const file of files.filter((name) => name.startsWith("image-"))) contents[file] = await fs.readFile(path.join(options.cwd, file), "utf8"); launches.push({ tag, ...options, files, contents, promptText: await fs.readFile(path.join(options.cwd, "prompt.md"), "utf8"), cwd: options.cwd }); return { ok: true, text: "1. PASS — yes\n2. PASS — yes\nVerdict: holds up" }; } };
  try { await fn({ dir, root, from, out, lines, launches, seams }); } finally { await fs.rm(dir, { recursive: true, force: true }); }
}

// req: R-3144
await test("R-3144: launches once with cold Claude reviewer flags in an empty external folder", async () => {
  await fixture(async ({ root, from, out, launches, seams }) => {
    assert.equal(await runVisualReader(["--from", from, "--out", out], seams), 0); assert.equal(launches.length, 1);
    const run = launches[0]; assert.equal(run.tag, "visual-reader"); assert.deepEqual(run.files.sort(), ["image-1.png", "image-2.png", "prompt.md"]);
    assert.deepEqual(run.contents, { "image-1.png": "page", "image-2.png": "reference" });
    assert.ok(path.relative(root, run.cwd).startsWith(".."));
    assert.equal(run.stallSecs, CLAUDE_BUILDER_STALL_SECS); assert.equal(run.retries, C.RETRIES); assert.equal(run.maxSecs, C.MAX_SECS); assert.equal(run.pollSecs, C.POLL_SECS);
    assert.deepEqual(run.childEnv, { ...REVIEWER_CHILD_ENV, ...CLAUDE_BUILDER_CHILD_ENV });
    assert.deepEqual(run.piArgs, [CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, "opus", C.CLAUDE_RESTRICTED_FLAG, CLAUDE_STRICT_MCP_FLAG, C.CLAUDE_DISABLE_SLASH_FLAG, C.CLAUDE_NO_SESSION_FLAG, `${CLAUDE_TOOLS_FLAG}=Read`, `${CLAUDE_ALLOW_FLAG}=Read`, C.INSTRUCTION]);
    const launched = run.launch(run.piArgs, { cwd: run.cwd });
    assert.equal(launched.command, CLAUDE_BIN); assert.deepEqual(launched.args, run.piArgs);
    const prompt = await fs.readFile(path.join(out, "prompt.md"), "utf8");
    assert.equal(run.promptText, prompt);
    assert.ok(prompt.includes("1. page image image-1.png at 380px")); assert.ok(prompt.includes("2. reference image image-2.png"));
    assert.ok(prompt.includes("1. Scene")); assert.ok(prompt.includes("2) Type"));
    assert.equal(await fs.readFile(path.join(out, "reader.md"), "utf8"), "1. PASS — yes\n2. PASS — yes\nVerdict: holds up");
  });
});

// req: R-3145
await test("R-3145: recorded answers enforce pass, fail, unjudged, skipped and demo verdicts", async () => {
  const cases = [
    ["1. PASS — yes\n2. PASS — yes\nVerdict: holds up", ["visual-reader: pass"]],
    ["1. PASS — yes\n2. fAiL — no\nVerdict: holds up", ["visual-reader: fail; 1 FAIL, 0 unanswered, 0 unknown; verdict holds up"]],
    ["1. UNJUDGED — no narrow evidence\n2. PASS — yes\nVerdict: holds up", ["visual-reader: pass", "unjudged: 1"]],
    ["1. PASS — yes\n3. PASS — unknown\nVerdict: holds up", ["visual-reader: fail; 0 FAIL, 1 unanswered, 1 unknown; verdict holds up"]],
    ["1. FAIL — poor\n2. FAIL — poor\nVerdict: reads as a demo against the reference", ["visual-reader: fail; 2 FAIL, 0 unanswered, 0 unknown; verdict reads as a demo against the reference", "visual-reader: the page reads as a demo against the reference"]],
    ["1. PASS — yes\n2. PASS — yes\nVerdict: probably okay", ["visual-reader: fail; 0 FAIL, 0 unanswered, 0 unknown; no verdict"]],
  ];
  for (const [answer, expected] of cases) await fixture(async ({ from, out, lines, seams }) => {
    seams.watchdog = async () => ({ ok: true, text: `Preamble\r\n${answer}\r\n` });
    assert.equal(await runVisualReader(["--from", from, "--out", out], seams), expected[0].includes("pass") && !expected[0].includes("fail;") ? 0 : 1);
    assert.deepEqual(lines.slice(0, expected.length), expected);
    assert.equal(lines.filter((line) => /^\\d+[.)] /.test(line)).length, splitCount(answer));
  });
});

// req: R-3146
await test("R-3146: positive control uses reference images as page and reference", async () => {
  await fixture(async ({ from, out, seams, launches }) => {
    await runVisualReader(["--from", from, "--control", "--out", out], seams);
    const run = launches[0]; assert.deepEqual(run.files.sort(), ["image-1.png", "image-2.png", "prompt.md"]);
    assert.deepEqual(run.contents, { "image-1.png": "reference", "image-2.png": "reference" });
    const prompt = await fs.readFile(path.join(out, "prompt.md"), "utf8");
    assert.ok(prompt.includes("1. page image image-1.png")); assert.ok(prompt.includes("2. reference image image-2.png"));
    assert.equal((prompt.match(/reference image/g) ?? []).length, 1); assert.ok(!prompt.includes("page-380.png"));
  });
});

// req: R-3147
await test("R-3147: missing roster, manifest and in-repo output refuse without watchdog; failed runs retain only prompt", async () => {
  await fixture(async ({ root, from, out, seams, lines, launches }) => {
    for (const [change, expected, code] of [
      [() => { seams.roster = () => ({ ok: true, roster: {} }); }, "visual-reader: no Claude Code reviewer in roster; skipped", 0],
      [() => fs.rm(path.join(from, "manifest.json")), "visual-reader: first-look manifest is missing", 2],
      [() => {}, "visual-reader: --out must be outside the repository", 2],
    ]) {
      lines.length = 0; launches.length = 0;
      if (expected.includes("manifest")) seams.roster = () => ({ ok: true, roster: { [REVIEW_SLOT]: { runtime: CLAUDE_CODE_RUNTIME, model: "opus" } } });
      if (expected.includes("--out")) assert.equal(await runVisualReader(["--from", from, "--out", path.join(root, "inside")], seams), code);
      else { await change(); assert.equal(await runVisualReader(["--from", from, "--out", out], seams), code); }
      assert.deepEqual(lines, [expected]); assert.equal(launches.length, 0);
    }
  });
  for (const result of [{ ok: false, text: "raw" }, { ok: true, text: " " }, { ok: false, text: "partial", ceiling: true }]) await fixture(async ({ from, out, seams, lines }) => {
    seams.watchdog = async () => result; await fs.mkdir(out); await fs.writeFile(path.join(out, "reader.md"), "stale");
    assert.equal(await runVisualReader(["--from", from, "--out", out], seams), 1);
    assert.deepEqual(lines, ["visual-reader: the reader run failed"]); await fs.access(path.join(out, "prompt.md")); await assert.rejects(fs.access(path.join(out, "reader.md")));
  });
});

// req: R-3148
await test("R-3148: reader seals prompt, instruction, spec cap, five-frame cap and cold Claude options", async () => {
  assert.equal(C.PROMPT_PATH, "packages/nana-pack/prompts/visual-reader.md");
  assert.equal(C.INSTRUCTION, "Read prompt.md in this folder and answer it."); assert.equal(C.MAX_SPEC_LINES, 12); assert.equal(C.REFERENCE_FRAME_CAP, 5);
  const prompt = await fs.readFile(new URL(`../../../${C.PROMPT_PATH}`, import.meta.url), "utf8");
  assert.ok(prompt.includes("The reference frames set the quality bar: finish, detail and care. The spec sets the look. Do not fail a line or call the page a demo only because its style differs from the reference."));
  assert.ok(prompt.includes("Answer one numbered item per spec line, as `<spec number>. PASS|FAIL|UNJUDGED — reason`. Write UNJUDGED when no attached image lets you judge that line."));
  assert.ok(prompt.endsWith("Then one last line, exactly `Verdict: holds up` or `Verdict: reads as a demo against the reference`.\n"));
  assert.equal(C.RETRIES, 0); assert.equal(C.MAX_SECS, 600); assert.equal(C.POLL_SECS, 15);
  assert.deepEqual([C.CLAUDE_RESTRICTED_FLAG, C.CLAUDE_DISABLE_SLASH_FLAG, C.CLAUDE_NO_SESSION_FLAG], ["--restricted", "--disable-slash-commands", "--no-session-persistence"]);
});
if (!process.exitCode) console.log(`${passed} visual-reader checks passed`);
