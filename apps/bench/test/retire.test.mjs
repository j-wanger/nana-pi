/**
 * @module apps/bench/test/retire.test.mjs
 * @purpose Pin the eight study-runner retirement contracts while preserving live anatomy and report consumers.
 * @inputs This checkout, its pre-retirement git revision and synthetic OS-temp fixtures.
 * @outputs Eight bounded PASS/FAIL cases and a failing exit code on regression.
 * @effects disk (OS-temp fixtures only), process (offline git and tested CLIs; no model calls)
 * @errors Assertion failures set exit 1.
 */
import assert from "node:assert/strict";
import { tmpDir } from "./tmp-dir.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const base = "a562ff9a6a7eda7b06a75a5b58dac18bf977a25c";
const cuts = ["run.mjs", "aggregate.mjs", "catch-ledger.mjs", "ext/bench-nested-usage.ts", ...["nested", "pi-exports", "profiles", "catch-extract", "eval-module", "fixture", "agentdir", "plan", "checkers", "catch-stats"].map(n => `lib/${n}.mjs`)].map(p => `apps/bench/${p}`);
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const run = (args, cwd = root) => {
 const r = spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 120000, maxBuffer: 32 << 20 });
 assert.equal(r.error, undefined); return r;
};
const git = (...args) => {
 const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: 30000, maxBuffer: 32 << 20 });
 assert.equal(r.status, 0, r.stderr); return r.stdout;
};
const temp = () => tmpDir(path.join(os.tmpdir(), "bench-retire-"));
async function test(title, fn) {
 let timer;
 try {
  await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case limit")), 180000); })]);
  console.log("PASS", title);
 } catch (error) { console.log("FAIL", title, error.message); process.exitCode = 1; }
 finally { clearTimeout(timer); }
}
const suiteFiles = files => {
 for (const file of files) { const r = run(["--experimental-strip-types", file]); assert.equal(r.status, 0, `${file}\n${r.stdout}\n${r.stderr}`); assert.match(r.stdout, /PASS/); assert.doesNotMatch(r.stdout, /^FAIL/m); }
};
// Load the current consumer with only its glob import replaced by the pre-move function.
// Relative imports and import.meta.url retain their original meaning; nothing is written in the checkout.
async function withOriginalGlob(file, globUrl, overrides = {}) {
 const url = pathToFileURL(path.join(root, file));
 const source = read(file).replaceAll("import.meta.url", JSON.stringify(url.href)).replace(/(from\s+)(["'])(\.[^"']+)\2/g, (_, prefix, quote, spec) => {
  const target = spec.endsWith("/glob-match.mjs") || spec.endsWith("/checkers.mjs") ? globUrl : overrides[spec] ?? new URL(spec, url).href;
  return `${prefix}${JSON.stringify(target)}`;
 });
 const data = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
 return { module: await import(data), url: data };
}

// req: R-3783
await test("R-3783: runner modules are gone without live imports", async () => {
 for (const file of cuts) assert.equal(fs.existsSync(path.join(root, file)), false, file);
 const { parseRelativeImports } = await import("../../../templates/typescript/template/scripts/code-map.mjs");
 for (const file of git("ls-files", "-z").split("\0").filter(p => /\.(mjs|ts|js)$/.test(p) && !/^(docs\/|research\/|apps\/bench\/studies\/)/.test(p) && fs.existsSync(path.join(root, p)))) {
  for (const spec of parseRelativeImports(read(file))) {
   const target = path.relative(root, path.resolve(path.dirname(path.join(root, file)), spec)).split(path.sep).join("/");
   assert.ok(!cuts.includes(target), `${file} imports ${target}`);
  }
 }
});

// req: R-3784
await test("R-3784: report consumers keep byte-identical output", async () => {
 const original = git("show", `${base}:apps/bench/lib/checkers.mjs`);
 const start = original.indexOf("export function globMatch(");
 const body = original.slice(start, original.indexOf("\n}\n", start) + 3);
 assert.ok(body.endsWith("\n}\n"));
 const globUrl = `data:text/javascript;base64,${Buffer.from(body).toString("base64")}`;
 const oldDeliverables = await withOriginalGlob("scripts/deliverables.mjs", globUrl);
 const oldReport = await withOriginalGlob("scripts/product-report.mjs", globUrl, { "./deliverables.mjs": oldDeliverables.url });
 const currentDeliverables = await import("../../../scripts/deliverables.mjs");
 const currentReport = await import("../../../scripts/product-report.mjs");
 const { parseLedger } = await import("../../../scripts/requirements-tree.mjs");
 const parsed = parseLedger(read("REQUIREMENTS.md"));
 const gitRunner = (args, options) => spawnSync("git", args, { ...options, encoding: "utf8" });
 assert.ok(JSON.stringify(currentDeliverables.deliverableReport(parsed, root, gitRunner)) === JSON.stringify(oldDeliverables.module.deliverableReport(parsed, root, gitRunner)), "deliverables output differs");
 const dir = temp();
 try {
  const options = { root, gitRunner, readIssues: async () => ({ items: [], url: "https://example.invalid/issues" }), env: {} };
  await oldReport.module.generateReport({ ...options, out: path.join(dir, "before.html") });
  await currentReport.generateReport({ ...options, out: path.join(dir, "after.html") });
  assert.deepEqual(fs.readFileSync(path.join(dir, "after.html")), fs.readFileSync(path.join(dir, "before.html")));
 } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// req: R-3785
await test("R-3785: memory shaping and anatomy labeller retain behavior", async () => {
 suiteFiles(["packages/nana-pack/tests/memory-shaping.test.mjs", "apps/bench/test/anatomy-labels.test.mjs"]);
 const { readJsonl } = await import("../lib/jsonl.mjs");
 const dir = temp();
 try {
  for (const ending of ["\n", "\r\n", " \t\r\n", " \t"]) {
   const file = path.join(dir, "rows.jsonl"); const text = `{"id":1} \t\r\n{"id":2}${ending}`;
   fs.writeFileSync(file, text);
   assert.deepEqual(await readJsonl(file, { repair: false }), { rows: [{ id: 1 }, { id: 2 }], quarantined: 0 });
   assert.equal(fs.readFileSync(file, "utf8"), text);
  }
 } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// req: R-3786
await test("R-3786: every anatomy CLI subcommand preserves fixture output", async () => {
 const { runAnatomy } = await import("../lib/anatomy.mjs");
 const { segmentPart } = await import("../lib/anatomy-spans.mjs");
 const dir = temp();
 try {
  const input = path.join(dir, "input"); fs.mkdirSync(input);
  const raw = "Do the synthetic task.\r\n \t";
  const spans = segmentPart(raw, "brief", "fixture");
  const context = { id: "fixture", lane: "alpha", buildNumber: 1, model: "fixture", verdict: "none", tokens: 0, wallMinutes: 0, landed: false, pulls: [], parts: [{ name: "brief", raw, spans }] };
  fs.writeFileSync(path.join(input, "contexts.jsonl"), JSON.stringify(context));
  const sheet = path.join(dir, "sheet.jsonl"); fs.writeFileSync(sheet, spans.filter(s => s.kind === "unit").map(s => JSON.stringify({ id: s.id, label: s.label })).join("\r\n"));
  const repo = path.join(dir, "repo"), sessions = path.join(dir, "sessions"); fs.mkdirSync(repo); fs.mkdirSync(sessions);
  const init = spawnSync("git", ["init", "-q", repo], { encoding: "utf8", timeout: 10000 }); assert.equal(init.status, 0);
  const empty = path.join(dir, "empty"); fs.mkdirSync(empty); fs.writeFileSync(path.join(empty, "contexts.jsonl"), "");
  const cases = [
   ["segment", "--repo", repo, "--sessions", sessions], ["report", "--in", input],
   ["sample", "--in", input, "--seed", "fixture"], ["agree", "--in", input, "--a", sheet, "--b", sheet],
   ["assemble", "--in", input, "--context", "fixture"], ["label", "--in", empty],
  ];
  for (const args of cases) {
   const writer = ["segment", "sample", "assemble", "label"].includes(args[0]);
   let stdout = "", stderr = "";
   const expected = await runAnatomy([...args, ...(writer ? ["--out", path.join(dir, `${args[0]}-before`)] : [])], { stdout: s => { stdout += s; }, stderr: s => { stderr += s; }, runModel: () => { throw new Error("no calls"); } });
   assert.equal(expected, 0, `${args[0]}: ${stderr}`);
   const actual = run(["apps/bench/anatomy.mjs", ...args, ...(writer ? ["--out", path.join(dir, `${args[0]}-after`)] : [])]);
   assert.equal(actual.status, expected, `${args[0]}: ${actual.stderr}`); assert.equal(actual.stdout, stdout); assert.equal(actual.stderr, stderr);
   if (writer) {
    const before = path.join(dir, `${args[0]}-before`), after = path.join(dir, `${args[0]}-after`);
    assert.deepEqual(fs.readdirSync(after), fs.readdirSync(before));
    for (const name of fs.readdirSync(before)) assert.deepEqual(fs.readFileSync(path.join(after, name)), fs.readFileSync(path.join(before, name)));
   }
  }
 } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// req: R-3787
await test("R-3787: records contracts and repository checks stay valid", async () => {
 const { loadRequirements } = await import("../../../templates/typescript/template/tests/requirements-trace.ts");
 const rows = loadRequirements(read("REQUIREMENTS.md"));
 const oldRows = loadRequirements(git("show", `${base}:REQUIREMENTS.md`));
 for (const [id, row] of oldRows) {
  if (row.local.some(c => c.startsWith("apps/bench/test/")) && !row.local.some(c => c.includes("anatomy"))) assert.equal(rows.get(id).status, "retired", id);
 }
 for (const doc of ["README.md", "AGENTS.md", "apps/bench/README.md"]) assert.ok(!/(?:node )?apps\/bench\/(?:run|aggregate|catch-ledger)\.mjs/.test(read(doc)), doc);
 for (const args of [["scripts/code-map.mjs", "--check"], ["scripts/requirements-tree.mjs", "--check"], ["scripts/readme-check.mjs"], ["scripts/component-audit.mjs", "--check"]]) {
  const result = run(args); assert.equal(result.status, 0, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
 }
 assert.match(git("ls-files", "apps/bench/studies/"), /VERDICT\.md/); assert.match(git("ls-files", "apps/bench/studies/"), /RESULTS/);
});

// req: R-3788
await test("R-3788: tree and regroup fixture copies use relocated helper", async () => {
 for (const file of ["packages/nana-pack/tests/requirements-tree.test.mjs", "packages/nana-pack/tests/requirements-regroup.test.mjs"]) {
  assert.ok(read(file).includes("glob-match.mjs"), file); suiteFiles([file]);
 }
});

// req: R-3789
await test("R-3789: first-look captures a helper-only change", async () => {
 const { runFirstLook } = await import("../../../scripts/first-look.mjs");
 const { PAGE_SHAPING_PATHS } = await import("../../../scripts/first-look-config.mjs");
 assert.ok(PAGE_SHAPING_PATHS.includes("scripts/glob-match.mjs"));
 const dir = temp(); const lines = []; let reports = 0, shots = 0;
 try {
  const code = await runFirstLook(["--page", "product", "--out", path.join(dir, "out")], {
   root: path.join(dir, "repo"), mergeBase: "base", changedPaths: ["scripts/glob-match.mjs"], stdout: s => lines.push(s),
   runReport: async (_root, out) => { reports++; fs.writeFileSync(out, "fixture"); return pathToFileURL(out).href; },
   browser: async () => ({ async newPage() { return { async goto() {}, async evaluate() { return []; }, async setViewportSize() {}, async screenshot() { shots++; }, async close() {} }; }, async close() {} }),
   readTree: async () => "fixture",
  });
  assert.equal(code, 0); assert.equal(reports, 2); assert.equal(shots, 4); assert.ok(!lines.some(s => s.includes("no page-shaping changes")));
 } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// req: R-3790
await test("R-3790: all tracked study paths retain their base bytes", async () => {
 const prefix = "apps/bench/studies/";
 assert.equal(git("diff", "--name-status", base, "--", prefix), "");
 assert.equal(git("ls-files", "--others", "--exclude-standard", "--", prefix), "");
 assert.deepEqual(git("ls-files", "--", prefix).trim().split("\n"), git("ls-tree", "-r", "--name-only", base, "--", prefix).trim().split("\n"));
});
