// Seat verification for the four-digit ID lane (frozen; the builder runs it from the worktree root
// with `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` and pastes the output verbatim).
// Every fixture lives in the OS temp dir. Each line ends with what is wanted. Both rails are driven
// directly: TypeScript through nana-pi's shim, Python through the template conftest under uvx.
// It exits 1 on any mismatch; a skipped Python run counts as a mismatch (both rows claim both rails).
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const W = resolve(process.cwd());
const rail = await import(join(W, "scripts/requirements-trace.mjs"));
const tree = await import(join(W, "scripts/requirements-tree.mjs"));
const CONFTEST = join(W, "templates/python/template/tests/conftest.py");
const HEAD = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|";
const GROW = "| G-001 | Every module shall carry a header. | untested | — |";
const roots = [];

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), "seat-ids-"));
  roots.push(dir);
  mkdirSync(join(dir, "tests"));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}
function ts(dir) {
  try {
    const r = rail.check(dir, { testRoots: ["tests"] });
    return { ok: r.problems.length === 0, text: r.problems.join(" | "), has: (id) => r.requirements.has(id) };
  } catch (e) { return { ok: false, text: String(e.message || e), has: () => false }; }
}
const UVX = spawnSync("uvx", ["--with", "pytest", "python", "-c", "import pytest"], { encoding: "utf8" }).status === 0;
function py(dir) {
  if (!UVX) return { ok: null, text: "SKIP (uvx with pytest unavailable)", has: () => false };
  const code = [
    "import runpy,sys,json; from pathlib import Path; import pytest",
    "m=runpy.run_path(sys.argv[2])",
    "try:",
    "  r=m['check'](Path(sys.argv[1]), test_roots=('tests',))",
    "  probs=list(r[2]); ids=sorted(r[0].keys())",
    "  print(json.dumps({'ok':not probs,'text':' | '.join(map(str,probs)),'ids':ids}))",
    "except pytest.UsageError as e:",
    "  print(json.dumps({'ok':False,'text':str(e),'ids':[]}))",
  ].join("\n");
  const p = spawnSync("uvx", ["--with", "pytest", "python", "-c", code, dir, CONFTEST], { encoding: "utf8", cwd: dir });
  try { const j = JSON.parse(p.stdout.trim().split("\n").pop()); return { ok: j.ok, text: j.text, has: (id) => j.ids.includes(id) }; }
  catch { return { ok: false, text: `python run failed: ${(p.stderr || p.stdout).slice(-300)}`, has: () => false }; }
}
let mismatches = 0;
const out = (label, got, want) => {
  const g = String(got), w = String(want);
  const pass = w === ">0" ? Number(g) > 0 : g === w;
  if (!pass) mismatches++;
  console.log(`${pass ? "ok  " : "MISS"} ${label}: ${g} (want ${w})`);
};
const both = (label, dir, fn, want) => {
  out(`TS ${label}`, fn(ts(dir)), want);
  const p = py(dir); out(`PY ${label}`, p.ok === null ? p.text : fn(p), want);
};
const at = (file, line) => (r) => `${!r.ok}/${new RegExp(`${file.replace(".", "\\.")}:${line}\\b`).test(r.text) ? "names " + file + ":" + line : "wrong or no location"}`;

// Accepted: four-digit R and G rows, read and clean.
const ok = project({ "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | untested | — |\n| G-1000 | Every tool shall accept four digits. | untested | — |\n` });
both("R-1000 and G-1000 rows read and clean", ok, (r) => `${r.has("R-1000")}/${r.has("G-1000")}/${r.ok}`, "true/true/true");

// Accepted: four-digit markers trace their rows (one fixture per language: each rail reads only its own tests).
const tsMarkers = project({
  "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | implemented | \`tests/a.test.mjs::four digit\` |\n| G-1000 | Every tool shall accept four digits. | implemented | \`tests/a.test.mjs::four digit\` |\n`,
  "tests/a.test.mjs": `// req: R-1000 G-1000\ntest("four digit", () => {});\n`,
});
out("TS R-1000 and G-1000 markers trace their rows", ((r) => `${r.ok}${r.ok ? "" : " " + r.text.slice(0, 140)}`)(ts(tsMarkers)), "true");
const pyMarkers = project({
  "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | implemented | \`tests/test_a.py::test_four_digit\` |\n| G-1000 | Every tool shall accept four digits. | implemented | \`tests/test_a.py::test_four_digit\` |\n`,
  "tests/test_a.py": `# req: R-1000 G-1000\ndef test_four_digit():\n    pass\n`,
});
const pm = py(pyMarkers); out("PY R-1000 and G-1000 markers trace their rows", pm.ok === null ? pm.text : `${pm.ok}${pm.ok ? "" : " " + pm.text.slice(0, 140)}`, "true");

// Rejected near-misses, each in REQUIREMENTS.md and in REQUIREMENTS-general.md, at an exact line.
const bad = [
  ["leading zero", "| R-0123 | The tool shall do a thing. | untested | — |"],
  ["five digits", "| R-10000 | The tool shall do a thing. | untested | — |"],
  ["non-ASCII digits", "| R-１２３ | The tool shall do a thing. | untested | — |"],
  ["missing closing pipe", "| R-1001 | The tool shall do a thing. | untested | —"],
  ["fenced example", "```\n| R-01 | example | untested | — |\n```"],
  ["unrelated table (R-)", "| R-squared | 0.9 |"],
  ["unrelated table (G-)", "| G-squared | 0.9 |"],
];
for (const [label, text] of bad) {
  const pre = `# f\n\n${HEAD}\n${GROW}\n`; // the bad line is line 6 (line 7 inside a fence)
  const line = label === "fenced example" ? 7 : 6;
  const inProject = project({ "REQUIREMENTS.md": `${pre}${text}\n` });
  both(`near-miss in REQUIREMENTS.md (${label}) fails`, inProject, at("REQUIREMENTS.md", line), `true/names REQUIREMENTS.md:${line}`);
  const inGeneral = project({ "REQUIREMENTS.md": `# f\n\n${HEAD}\n${GROW}\n`, "REQUIREMENTS-general.md": `${pre}${text}\n` });
  both(`near-miss in REQUIREMENTS-general.md (${label}) fails`, inGeneral, at("REQUIREMENTS-general.md", line), `true/names REQUIREMENTS-general.md:${line}`);
}

// Rejected markers: leading zero, five digits, non-ASCII digits — in both languages.
for (const [label, id] of [["leading-zero", "R-0123"], ["five-digit", "R-10000"], ["non-ASCII-digit", "R-１２３"]]) {
  const M = project({
    "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | untested | — |\n`,
    "tests/a.test.mjs": `// req: ${id}\ntest("bad", () => {});\n`,
    "tests/test_a.py": `# req: ${id}\ndef test_bad():\n    pass\n`,
  });
  const file = (lang) => (lang === "TS" ? "tests/a.test.mjs" : "tests/test_a.py");
  const tsr = ts(M), pyr = py(M);
  const proves = (r, lang) => `${!r.ok}/${/bad requirement id/.test(r.text) && new RegExp(`${file(lang).replace(".", "\\.")}:1\\b`).test(r.text) ? "bad requirement id at " + file(lang) + ":1" : "other failure"}`;
  out(`TS ${label} marker refused`, proves(tsr, "TS"), "true/bad requirement id at tests/a.test.mjs:1");
  out(`PY ${label} marker refused`, pyr.ok === null ? pyr.text : proves(pyr, "PY"), "true/bad requirement id at tests/test_a.py:1");
}

// The tree checker sees four-digit rows and renders a range across R-999 to R-1001.
const ledger = [
  "# CAP-01 · C", "Purpose: c", "Outcome: o", "",
  "## FEAT-001 · F", "Purpose: f", "Status: active", "",
  HEAD,
  "| R-999 | The tool shall a. | untested | — |",
  "| R-1000 | The tool shall b. | untested | — |",
  "| R-1001 | The tool shall c. | untested | — |", "",
].join("\n");
const t = tree.checkTree(ledger);
out("tree checker four-digit rows: problems", t.problems.length, "0");
out("tree checker counts all three rows in the feature", /Rows: 3 ·/.test(t.outline.split("\n").find((l) => l.includes("Parent: CAP-01")) || ""), "true");
out("tree outline range across R-999 to R-1001", /R-999–R-1001/.test(t.outline), "true");
const shared = ledger + ["## FEAT-002 · G", "Purpose: g", "Status: active", "Also applies: R-1000", "",
  HEAD, "| R-998 | The tool shall d. | untested | — |", ""].join("\n");
const ts2 = tree.checkTree(shared);
out("tree checker accepts Also applies: R-1000 from another feature", ts2.problems.length, "0");

// nana-pi's own ledger: every candidate line is a valid row (the new rule finds nothing to fail).
const lines = readFileSync(join(W, "REQUIREMENTS.md"), "utf8").split("\n");
const cand = lines.filter((l) => /^\|\s*[RG]-\S/.test(l));
const valid = cand.filter((l) => /^\|\s*[RG]-(?:[0-9]{3}|[1-9][0-9]{3})\s*\|(?:[^|]*\|){3}\s*$/.test(l));
out("real ledger: candidate lines that are valid rows", valid.length === cand.length ? "all of them" : `${valid.length} of ${cand.length}`, "all of them");

for (const d of roots) rmSync(d, { recursive: true, force: true });
console.log(`python rail: ${UVX ? "exercised" : "SKIPPED (uvx with pytest unavailable) — counted as mismatches"}`);
console.log(`seat-verify-ids: ${mismatches} mismatch(es)`);
process.exit(mismatches ? 1 : 0);
