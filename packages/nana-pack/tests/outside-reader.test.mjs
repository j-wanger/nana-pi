/**
 * @module packages/nana-pack/tests/outside-reader.test.mjs
 * @purpose Pins the cold outside reader's inputs, launch, quote checks and bounded outcomes.
 * @inputs Fake browser, objective and watchdog; recorded one-off fixtures.
 * @outputs Awaited PASS/FAIL cases.
 * @effects disk (OS temporary fixtures only)
 * @errors Assertion failures exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { runOutsideReader, checkQuotes } from "../../../scripts/outside-reader.mjs";
import * as C from "../../../scripts/outside-reader-config.mjs";
import { PRODUCT_VIEWS, VIEWPORT_WIDTHS } from "../../../scripts/first-look-config.mjs";
import { REVIEWER_CHILD_ENV } from "../bin/worker-config.mjs";
import { KNOWN_BUGS_DIR } from "../lib/known-bugs-config.mjs";
let passed = 0;
async function test(title, fn) {
  let timer;
  try {
    await Promise.race([fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case exceeded 20000 ms")), 20_000); })]);
    passed++; console.log("PASS", title);
  } catch (error) { console.log("FAIL", title, error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
async function fixture(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "nana-reader-test-"));
  const root = path.join(dir, "repo"); const out = path.join(dir, "out"); const from = path.join(dir, "look");
  await fs.mkdir(path.join(root, KNOWN_BUGS_DIR), { recursive: true }); await fs.mkdir(from);
  await fs.writeFile(path.join(root, KNOWN_BUGS_DIR, `${C.KNOWN_BUG_FEATURE}.md`), "# header\r\n- older bug  \r\n- newest bug\t");
  await fs.writeFile(path.join(from, "after-report.html"), "fake");
  await fs.writeFile(path.join(from, "accessibility-diff.txt"), "changed heading\r\nlast line\t");
  const urls = []; const launches = []; const lines = []; const widths = [];
  const seams = {
    root, stdout: (line) => lines.push(line), objective: async () => "bounded objective",
    roster: () => ({ ok: true, roster: { scout: { runtime: "claude-code", model: "skip" }, land: { provider: "fake-provider", model: "fake-model", thinking: "high" }, builder: { provider: "wrong", model: "wrong" } } }),
    browser: async () => ({ async newPage({ viewport }) { widths.push(viewport.width); return {
      async goto(url) { urls.push(url); }, async evaluate() { return `landing text\r\nacross elements\t ${"x".repeat(C.PHONE_LANDING_TEXT_CAP + 20)}`; }, async close() {},
    }; }, async close() {} }),
    watchdog: async (tag, options) => { launches.push({ tag, ...options, entries: await fs.readdir(options.cwd) }); return { ok: true, text: '1. "landing text" helps.' }; },
  };
  try { await fn({ dir, root, out, from, seams, urls, launches, lines, widths, args: ["--from", from, "--out", out] }); }
  finally { await fs.rm(dir, { recursive: true, force: true }); }
}

// req: R-3060
await test("R-3060: prompt orders bounded purpose, bugs, diff and both-width page views", async () => {
  await fixture(async ({ root, out, from, seams, args, urls, widths }) => {
    assert.equal(await runOutsideReader(args, seams), 0);
    const prompt = await fs.readFile(path.join(out, "prompt.md"), "utf8");
    const template = await fs.readFile(new URL(`../../../${C.PROMPT_PATH}`, import.meta.url), "utf8");
    assert.ok(prompt.startsWith(template.replaceAll("{{MAX_FINDINGS}}", String(C.MAX_FINDINGS))));
    const positions = ["## Purpose", "bounded objective", "## Known bugs", "- newest bug", "- older bug", "## Change", "changed heading", "## Page text", "landing text"].map((s) => prompt.indexOf(s));
    assert.ok(positions.every((p, i) => p >= 0 && (!i || p > positions[i - 1])));
    assert.ok(!prompt.includes("# header"));
    assert.deepEqual(widths, VIEWPORT_WIDTHS);
    for (const width of VIEWPORT_WIDTHS) for (const view of C.READER_VIEWS) assert.ok(prompt.includes(`===== ${width}px · ${view || "(landing)"} =====`));
    const sections = prompt.split(/===== \d+px · .*? =====\n/).slice(1);
    for (const [i, section] of sections.entries()) assert.ok(section.trimEnd().length <= (i === 0 ? C.PHONE_LANDING_TEXT_CAP : C.VIEW_TEXT_CAP));
    const bugs = Array.from({ length: C.KNOWN_BUG_CAP }, (_, i) => `- bug ${i} ${"b".repeat(60)}`);
    await fs.writeFile(path.join(root, KNOWN_BUGS_DIR, `${C.KNOWN_BUG_FEATURE}.md`), bugs.join("\r\n") + "\t");
    await fs.writeFile(path.join(from, "accessibility-diff.txt"), "d".repeat(C.DIFF_CAP + 30));
    assert.equal(await runOutsideReader(args, seams), 0);
    const capped = await fs.readFile(path.join(out, "prompt.md"), "utf8");
    assert.match(capped, /\d+ earlier known-bug lines left out/);
    const kept = capped.split("## Known bugs\n")[1].split("\n## Change")[0];
    assert.ok(kept.split("\n").filter((l) => l.startsWith("- ")).join("\n").length <= C.KNOWN_BUG_CAP);
    assert.ok(kept.includes(`- bug ${bugs.length - 1} `)); assert.ok(!kept.includes("- bug 0 "));
    assert.ok(capped.includes("d".repeat(C.DIFF_CAP))); assert.ok(!capped.includes("d".repeat(C.DIFF_CAP + 1)));
    urls.length = 0;
    assert.equal(await runOutsideReader(["--url", path.join(from, "after-report.html"), "--out", out], seams), 0);
    assert.equal(urls[0], pathToFileURL(path.join(from, "after-report.html")).href);
    assert.ok(!(await fs.readFile(path.join(out, "prompt.md"), "utf8")).includes("## Change"));
  });
});

// req: R-3061
await test("R-3061: pi runs once cold through the sealed watchdog in an empty external cwd", async () => {
  await fixture(async ({ out, root, seams, args, launches }) => {
    assert.equal(await runOutsideReader(args, seams), 0); assert.equal(launches.length, 1);
    const launch = launches[0];
    assert.deepEqual(launch.piArgs, ["-p", "--no-tools", "--no-session", "-ne", "-ns", "-nc", "-np", "--provider", "fake-provider", "--model", "fake-model", "--thinking", "high", `@${path.join(out, "prompt.md")}`, "go"]);
    assert.deepEqual(launch.entries, []); assert.ok(path.relative(root, launch.cwd).startsWith(".."));
    assert.equal(launch.stallSecs, C.STALL_SECS); assert.equal(launch.retries, C.RETRIES); assert.equal(launch.maxSecs, C.MAX_SECS); assert.equal(launch.pollSecs, C.POLL_SECS);
    assert.deepEqual(launch.childEnv, REVIEWER_CHILD_ENV); assert.equal(launch.accept(""), false); assert.equal(launch.accept("none"), true);
    assert.equal(await fs.readFile(path.join(out, "reader.md"), "utf8"), '1. "landing text" helps.');
    launches.length = 0;
    assert.equal(await runOutsideReader([...args, "--provider", "override", "--model", "chosen", "--thinking", "low"], seams), 0);
    assert.ok(launches[0].piArgs.includes("chosen")); assert.ok(launches[0].piArgs.includes("override")); assert.ok(launches[0].piArgs.includes("low"));
  });
});

// req: R-3062
await test("R-3062: recorded honest quotes pass and an invented finding is marked", async () => {
  const answer = await fs.readFile(new URL("./fixtures/outside-reader/reader-out.md", import.meta.url), "utf8");
  const page = await fs.readFile(new URL("./fixtures/outside-reader/page-text.txt", import.meta.url), "utf8");
  const findings = checkQuotes(answer, page);
  assert.equal(findings.length, 4); assert.ok(findings.every((f) => f.matched)); assert.ok(!findings[0].text.includes("DONE"));
  const invented = `${answer}\r\n5. “wholly invented words”\t`;
  assert.equal(checkQuotes(invented, page).filter((f) => !f.matched).length, 1);
  assert.ok(checkQuotes('1) "one\n two" and “absent”\r\n2. no quotation\t', "one\r\n two")[0].matched);
  await fixture(async ({ out, args, seams, lines }) => {
    let offset = 0;
    seams.browser = async () => { offset = 0; return { async newPage() { return { async goto() {}, async evaluate() { const chunk = page.slice(offset, offset + C.VIEW_TEXT_CAP); offset = (offset + C.VIEW_TEXT_CAP) % page.length; return chunk; }, async close() {} }; }, async close() {} }; };
    for (const [text, missing] of [[answer, 0], [invented, 1], ['1. no quote', 1]]) {
      seams.watchdog = async () => ({ ok: true, text }); lines.length = 0;
      assert.equal(await runOutsideReader(args, seams), 0);
      assert.equal(lines[0], `outside-reader: ${checkQuotes(text, page).length} findings, ${missing} quotes not found; saved in ${out}`);
      assert.equal(lines.slice(1).filter((l) => l.includes("quote not found on the page")).length, missing);
    }
  });
});

// req: R-3063
await test("R-3063: none prints only zero findings and asks for nothing", async () => {
  await fixture(async ({ seams, args, lines }) => {
    seams.watchdog = async () => ({ ok: true, text: "None. No new weaknesses found." });
    assert.equal(await runOutsideReader(args, seams), 0);
    assert.deepEqual(lines, ["outside-reader: 0 findings; nothing to show the owner"]);
  });
});

// req: R-3064
await test("R-3064: missing browser, model or objective degrades without a launch", async () => {
  for (const mode of ["missing browser", "failed browser", "model", "objective"]) await fixture(async ({ seams, args, lines, launches }) => {
    if (mode === "missing browser") seams.browser = null;
    if (mode === "failed browser") seams.browser = async () => { throw new Error("raw launch error"); };
    if (mode === "model") seams.roster = () => ({ ok: true, roster: { scout: null, land: { runtime: "claude-code", model: "skip" }, builder: null } });
    if (mode === "objective") seams.objective = async () => " \r\n";
    assert.equal(await runOutsideReader(args, seams), 0); assert.equal(launches.length, 0); assert.equal(lines.length, 1);
    if (mode.includes("browser")) assert.match(lines[0], /Playwright.*install.*chromium/);
    if (mode === "model") assert.equal(lines[0], "outside-reader: no pi roster entry; supply --model");
    if (mode === "objective") assert.equal(lines[0], "outside-reader: objective is empty; nothing to read against");
  });
});

// req: R-3065
await test("R-3065: failed, empty and timed-out attempts keep only the prompt and fail in one line", async () => {
  for (const result of [{ ok: false, text: "raw failure" }, { ok: true, text: " " }, { ok: false, text: "partial", ceiling: true }]) await fixture(async ({ seams, args, out, lines }) => {
    await fs.mkdir(out); await fs.writeFile(path.join(out, "reader.md"), "stale answer");
    seams.watchdog = async () => result;
    assert.equal(await runOutsideReader(args, seams), 1);
    assert.deepEqual(lines, ["outside-reader: the reader run failed"]);
    await fs.access(path.join(out, "prompt.md")); await assert.rejects(fs.access(path.join(out, "reader.md")));
  });
});

// req: R-3066
await test("R-3066: outside-reader values retain their sealed provenance", async () => {
  assert.equal(C.MAX_FINDINGS, 3); assert.deepEqual(C.READER_VIEWS, ["", "overview", "product", "decisions", "issues"]);
  assert.ok(C.READER_VIEWS.slice(1).every((v) => PRODUCT_VIEWS.includes(v)));
  assert.equal(C.VIEW_TEXT_CAP, 4000); assert.equal(C.PHONE_LANDING_TEXT_CAP, 6000);
  assert.equal(C.DIFF_CAP, 4000); assert.equal(C.KNOWN_BUG_CAP, 6000);
  assert.equal(C.PROMPT_PATH, "packages/nana-pack/prompts/outside-reader.md"); assert.equal(C.KNOWN_BUG_FEATURE, "FEAT-039");
  assert.deepEqual(C.ROSTER_SLOT_ORDER, ["scout", "land", "builder"]);
  assert.equal(C.STALL_SECS, Infinity); assert.equal(C.RETRIES, 0); assert.equal(C.MAX_SECS, 600); assert.equal(C.VIEWPORT_HEIGHT, 1000); assert.equal(C.POLL_SECS, 15);
  assert.equal(C.VIEWPORT_WIDTHS, VIEWPORT_WIDTHS);
});
if (!process.exitCode) console.log(`${passed} outside-reader checks passed`);
