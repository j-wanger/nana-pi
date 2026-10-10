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

// Accepted line endings (sol and astra build r1): CRLF ledgers and test files, and spaces or a tab
// after the closing pipe, for three- and four-digit IDs, in both files and both rails.
{
  const rows = ["| R-001 | The tool shall work. | untested | — |", "| R-1000 | The tool shall accept four digits. | untested | — |"];
  const g = "| G-001 | Every module shall carry a header. | untested | — |";
  const crlf = (s) => s.replace(/\n/g, "\r\n");
  const C1 = project({ "REQUIREMENTS.md": crlf(`# f\n\n${HEAD}\n${g}\n${rows.join("\n")}\n`), "REQUIREMENTS-general.md": crlf(`# g\n\n${HEAD}\n${g}\n`) });
  both("CRLF ledger and general file: rows read and clean", C1, (r) => `${r.has("R-001")}/${r.has("R-1000")}/${r.ok}${r.ok ? "" : " " + r.text.slice(0, 100)}`, "true/true/true");
  const C2 = project({ "REQUIREMENTS.md": `# f\n\n${HEAD}\n${g}  \n${rows[0]}   \n${rows[1]}\t\n`, "REQUIREMENTS-general.md": `# g\n\n${HEAD}\n${g} \t\n` });
  both("spaces or a tab after the closing pipe: rows read and clean", C2, (r) => `${r.has("R-001")}/${r.has("R-1000")}/${r.ok}${r.ok ? "" : " " + r.text.slice(0, 100)}`, "true/true/true");
  const C3 = project({ "REQUIREMENTS.md": crlf(`# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | untested | —\n`) });
  both("CRLF row missing its closing pipe still fails", C3, at("REQUIREMENTS.md", 5), "true/names REQUIREMENTS.md:5");
  const tsC = project({
    "REQUIREMENTS.md": crlf(`# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | implemented | \`tests/a.test.mjs::four digit\` |\n`),
    "tests/a.test.mjs": crlf(`// req: R-1000\ntest("four digit", () => {});\n`),
  });
  out("TS CRLF test file: four-digit marker traces its row", ((r) => `${r.ok}${r.ok ? "" : " " + r.text.slice(0, 120)}`)(ts(tsC)), "true");
  const pyC = project({
    "REQUIREMENTS.md": crlf(`# f\n\n${HEAD}\n| R-1000 | The tool shall accept four digits. | implemented | \`tests/test_a.py::test_four_digit\` |\n`),
    "tests/test_a.py": crlf(`# req: R-1000\ndef test_four_digit():\n    pass\n`),
  });
  const pc = py(pyC); out("PY CRLF test file: four-digit marker traces its row", pc.ok === null ? pc.text : `${pc.ok}${pc.ok ? "" : " " + pc.text.slice(0, 120)}`, "true");
}

// One line definition in both rails (seat, build r2; whitespace list from sol build r2): a line is
// the text between "\n" characters. A row whose cell holds another Unicode line or paragraph
// separator, a form feed or a lone carriage return is still one row. Whitespace after the closing
// pipe is ignored; any other character there (here a letter) makes a near-miss.
{
  for (const [label, ch] of [["U+2028 line separator", " "], ["U+2029 paragraph separator", " "], ["U+0085 next line", "\u0085"], ["form feed", "\f"], ["lone carriage return", "\r"]]) {
    const L = project({ "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-001 | The tool shall work${ch} well. | untested | — |\n| R-1000 | The tool shall accept four digits. | untested | — |\n` });
    both(`${label} inside a cell: the row is read and clean`, L, (r) => `${r.has("R-001")}/${r.has("R-1000")}/${r.ok}${r.ok ? "" : " " + r.text.slice(0, 100)}`, "true/true/true");
  }
  const N = project({ "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-001 | The tool shall work. | untested | — |\u00a0\u3000\n` });
  both("no-break and ideographic space after the closing pipe: row read and clean", N, (r) => `${r.has("R-001")}/${r.ok}${r.ok ? "" : " " + r.text.slice(0, 100)}`, "true/true");
  const X = project({ "REQUIREMENTS.md": `# f\n\n${HEAD}\n| R-001 | The tool shall work. | untested | — |x\n` });
  both("a letter after the closing pipe fails", X, at("REQUIREMENTS.md", 5), "true/names REQUIREMENTS.md:5");
}

// Cross-rail parity (sol build r2): both rails give the SAME outcome on the same input — the rows
// read, the IDs traced, or a failure at the same line. One rule in both: a file's single leading
// U+FEFF is removed before lines are split; every whitespace test in the row, candidate and marker
// grammars, cell trimming and line-end stripping uses ONE explicit list, the union of JavaScript's
// and Python's own: tab, LF, VT, FF, CR, U+001C-U+001F, space, U+0085, U+00A0, U+1680,
// U+2000-U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF; a marker's ID list splits on runs
// of that whitespace and commas. Declared residual pinned here: a character outside the list (here
// U+200B) between the opening pipe and the ID makes the line neither a row nor a candidate.
{
  function tsFull(dir) {
    try { const r = rail.check(dir, { testRoots: ["tests"] }); return { err: null, rows: [...r.requirements.keys()].sort().join(","), traced: [...r.traced.keys()].sort().join(",") }; }
    catch (e) { return { err: String(e.message || e) }; }
  }
  function pyFull(dir) {
    if (!UVX) return null;
    const code = [
      "import runpy,sys,json; from pathlib import Path; import pytest",
      "m=runpy.run_path(sys.argv[2])",
      "try:",
      "  r=m['check'](Path(sys.argv[1]), test_roots=('tests',))",
      "  print(json.dumps({'err':None,'rows':','.join(sorted(r[0])),'traced':','.join(sorted(r[1]))}))",
      "except pytest.UsageError as e:",
      "  print(json.dumps({'err':str(e)}))",
    ].join("\n");
    const p = spawnSync("uvx", ["--with", "pytest", "python", "-c", code, dir, CONFTEST], { encoding: "utf8", cwd: dir });
    try { return JSON.parse(p.stdout.trim().split("\n").pop()); } catch { return { err: `python run failed: ${(p.stderr || p.stdout).slice(-200)}` }; }
  }
  const norm = (o) => {
    if (o === null) return "SKIP (uvx with pytest unavailable)";
    if (o.err) { const m = o.err.match(/:(\d+):/); return m ? `fails at line ${m[1]}` : "fails"; }
    return `rows ${o.rows || "none"}; traced ${o.traced || "none"}`;
  };
  const parity = (label, tsDir, pyDir, want) => { out(`TS ${label}`, norm(tsFull(tsDir)), want); out(`PY ${label}`, norm(pyFull(pyDir)), want); };
  const r001 = "| R-001 | The tool shall work. | untested | — |";
  const r1000 = "| R-1000 | The tool shall accept four digits. | untested | — |";
  const g001 = "| G-001 | Every module shall carry a header. | untested | — |";
  const ledger = (rows, pre = "") => `${pre}# f\n\n${HEAD}\n${rows.join("\n")}\n`;
  const same = (files) => { const d = project(files); return [d, d]; };
  const ODD = [["U+0085", "\u0085"], ["U+FEFF", "﻿"], ["no-break space", " "], ["U+2028", " "], ["U+001F", "\u001f"], ["U+3000", "　"]];

  let d;
  d = same({ "REQUIREMENTS.md": ledger([r001, r1000], "﻿") });
  parity("BOM before the ledger title", ...d, "rows R-001,R-1000; traced none");
  d = same({ "REQUIREMENTS.md": `﻿${r1000}\n${r001}\n` });
  parity("BOM directly before a first-line row", ...d, "rows R-001,R-1000; traced none");
  d = same({ "REQUIREMENTS.md": `\ufeff\ufeff| R-0123 | The tool shall work. | untested | — |\n${r001}\n` });
  parity("two BOMs before a first-line row: one is removed, the line is not a row in either rail (declared)", ...d, "rows R-001; traced none");
  d = same({ "REQUIREMENTS.md": `\ufeff\ufeff${r1000}\n${r001}\n` });
  parity("two BOMs before a valid first-line row: not a row in either rail (declared)", ...d, "rows R-001; traced none");
  d = same({ "REQUIREMENTS.md": ledger([g001, r001]), "REQUIREMENTS-general.md": `﻿# g\n\n${HEAD}\n${g001}\n` });
  parity("BOM before the general file's title", ...d, "rows G-001,R-001; traced none");
  for (const [name, ch] of ODD) {
    d = same({ "REQUIREMENTS.md": ledger([r001, `|${ch}R-1000 | The tool shall accept four digits. | untested | — |`]) });
    parity(`${name} between the opening pipe and the ID: the row is read`, ...d, "rows R-001,R-1000; traced none");
    d = same({ "REQUIREMENTS.md": ledger([`| R-1000${ch}| The tool shall accept four digits. | untested | — |`, r001]) });
    parity(`${name} after the ID: the row is read`, ...d, "rows R-001,R-1000; traced none");
    d = same({ "REQUIREMENTS.md": ledger([`| R-1000 | The tool shall accept four digits. |${ch}untested | — |`]) });
    parity(`${name} padding the status cell: the row is read`, ...d, "rows R-1000; traced none");
    d = same({ "REQUIREMENTS.md": ledger([`| R-1000 | The tool shall accept four digits. | untested | — |${ch}`]) });
    parity(`${name} after the closing pipe: the row is read`, ...d, "rows R-1000; traced none");
  }
  d = same({ "REQUIREMENTS.md": ledger([r001, `|​R-1000 | The tool shall accept four digits. | untested | — |`]) });
  parity("U+200B (not whitespace) before the ID: not a row in either rail (declared)", ...d, "rows R-001; traced none");
  d = same({ "REQUIREMENTS.md": ledger([`| R-1000 | The tool shall accept four digits. | untested | — |​`]) });
  parity("U+200B (not whitespace) after the closing pipe fails at its line", ...d, "fails at line 5");

  const markerCase = (label, list, want, pre = "") => {
    const t = project({ "REQUIREMENTS.md": ledger([r001, r1000]), "tests/a.test.mjs": `${pre}// req: ${list}\ntest("four", () => {});\n` });
    const p = project({ "REQUIREMENTS.md": ledger([r001, r1000]), "tests/test_a.py": `${pre}# req: ${list}\ndef test_four():\n    pass\n` });
    parity(label, t, p, want);
  };
  markerCase("BOM before a first-line marker", "R-1000", "rows R-001,R-1000; traced R-1000", "﻿");
  markerCase("comma-joined marker list", "R-1000,R-001", "rows R-001,R-1000; traced R-001,R-1000");
  markerCase("comma and space marker list", "R-1000, R-001", "rows R-001,R-1000; traced R-001,R-1000");
  markerCase("tab-separated marker list", "R-1000\tR-001", "rows R-001,R-1000; traced R-001,R-1000");
  for (const [name, ch] of [...ODD, ["U+2029", " "]]) {
    markerCase(`${name} separating a marker list`, `R-1000${ch}R-001`, "rows R-001,R-1000; traced R-001,R-1000");
    markerCase(`${name} after req:`, `${ch}R-1000`, "rows R-001,R-1000; traced R-1000");
  }
  markerCase("U+200B (not whitespace) inside a marker list fails at its line", "R-1000​R-001", "fails at line 1");
}

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

// The tree checker reads rows with the rail's whitespace list and its one-BOM rule (sol and astra
// build r3): a row the rail loads is counted and placed by the tree, never silently dropped.
for (const [name, ch] of [["U+0085", "\u0085"], ["U+001F", "\u001f"], ["U+FEFF", "\ufeff"], ["no-break space", "\u00a0"], ["U+2028", "\u2028"], ["U+3000", "\u3000"]]) {
  const inFeature = ledger.replace("| R-1000 | The tool shall b.", `|${ch}R-1000${ch}| The tool shall b.`);
  const tw = tree.checkTree(inFeature);
  out(`tree: ${name} around the ID inside a feature: problems / rows`, `${tw.problems.length} / ${/Rows: 3 ·/.test(tw.outline.split("\n").find((l) => l.includes("Parent: CAP-01")) || "")}`, "0 / true");
  const outside = ["# CAP-01 · C", "Purpose: c", "Outcome: o", "", HEAD, `|${ch}R-1000 | The tool shall b. | untested | — |`, ""].join("\n");
  out(`tree: ${name} before the ID outside any feature is refused`, tree.checkTree(outside).problems.length > 0, "true");
}
{
  const tb = tree.checkTree(`\ufeff${ledger}`);
  out("tree: one BOM before the first heading: problems / rows", `${tb.problems.length} / ${/Rows: 3 ·/.test(tb.outline.split("\n").find((l) => l.includes("Parent: CAP-01")) || "")}`, "0 / true");
}

// The tree counts a line as a row only when the rail does (sol build r4): it calls the rail's own
// row test, so a malformed candidate is never counted or rendered, and the rail fails it by line.
for (const [label, bad] of [
  ["a candidate missing its closing pipe", "| R-1000 | The tool shall b. | untested | —"],
  ["U+0085 around the ID, missing its closing pipe", "|\u0085R-1000\u001f| The tool shall b. | untested | —"],
  ["a letter after the closing pipe", "| R-1000 | The tool shall b. | untested | — |x"],
  ["five cells", "| R-1000 | The tool shall b. | untested | — | extra |"],
]) {
  const malformed = ledger.replace("| R-1000 | The tool shall b. | untested | — |", bad);
  const tm = tree.checkTree(malformed);
  out(`tree: ${label} is not counted`, /Rows: 2 ·/.test(tm.outline.split("\n").find((l) => l.includes("Parent: CAP-01")) || ""), "true");
  both(`rail: ${label} in a feature table fails`, project({ "REQUIREMENTS.md": malformed }), at("REQUIREMENTS.md", 12), "true/names REQUIREMENTS.md:12");
}

// nana-pi's own ledger: every candidate line is a valid row (the new rule finds nothing to fail).
const lines = readFileSync(join(W, "REQUIREMENTS.md"), "utf8").split("\n");
const cand = lines.filter((l) => /^\|\s*[RG]-\S/.test(l));
const valid = cand.filter((l) => /^\|\s*[RG]-(?:[0-9]{3}|[1-9][0-9]{3})\s*\|(?:[^|]*\|){3}\s*$/.test(l));
out("real ledger: candidate lines that are valid rows", valid.length === cand.length ? "all of them" : `${valid.length} of ${cand.length}`, "all of them");

for (const d of roots) rmSync(d, { recursive: true, force: true });
console.log(`python rail: ${UVX ? "exercised" : "SKIPPED (uvx with pytest unavailable) — counted as mismatches"}`);
console.log(`seat-verify-ids: ${mismatches} mismatch(es)`);
process.exit(mismatches ? 1 : 0);
