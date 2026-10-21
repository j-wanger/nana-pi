// Seat acceptance for lane fresh-install (frozen; written by the seat 2026-10-13 before the build, after the plan
// review; run on macOS from the worktree root, Node only, no dependencies):
//   node docs/reviews/fresh-install-2026-10-13/acceptance.mjs
// Optional: SEAT_PWSH=<pwsh binary> (and SEAT_PWSH_SIM=<folder holding npm's own npm.ps1>, default <pwsh dir>/sim)
// for the PowerShell rerun of step 2; without a pwsh that case is a MISS.
// Black-box where possible: it reads PI_VERSION and PI_BEFORE from ci.yml with its own anchored regexes (never
// pi-pin), runs doctor, install, the bench loader, npm and the install check like a user, and reads their output.
// Case (e)'s fault run and every `git diff` read COMMITTED HEAD (scratch worktree, merge base with main); case (h)
// also counts uncommitted and untracked paths. Cases (a)–(h) are the seat brief's; (i) and (j) are CHANGE §5's
// title and note-list checks. Each case prints `ok` or `MISS → reason`.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { GONE, REQUIRED, report as titleReport } from "./seat-titles.mjs";

const root = process.cwd();
const REVIEW = "docs/reviews/fresh-install-2026-10-13";
const PKG = "@earendil-works/pi-coding-agent";
let bad = 0, n = 0;
const out = (title, ok, why = "") => {
  n++;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${String(why).replace(/\s+/g, " ").slice(0, 400)}`}`);
};
const read = (rel) => { try { return fs.readFileSync(path.join(root, rel), "utf8"); } catch { return null; } };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const git = (...args) => sh("git", args, { cwd: root });
const scratch = (tag) => fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), `seat-fi-${tag}-`)));
const cleanEnv = (extra = {}) => {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (/^(NANA_|PI_CODING_AGENT_DIR$|CLAUDE_CONFIG_DIR$|npm_config_|BENCH_|DESK_PI_)/i.test(k)) delete e[k];
  return { ...e, ...extra };
};

// ---- the declared values, read from ci.yml's workflow env with this script's own regexes
const ciText = read(".github/workflows/ci.yml") ?? "";
const ciLines = ciText.split(/\r?\n/);
const V = ciLines.map((l) => /^  PI_VERSION: ?["']?(\d+\.\d+\.\d+)["']?\s*$/.exec(l)?.[1]).find(Boolean) ?? "<no PI_VERSION>";
const B = ciLines.map((l) => /^  PI_BEFORE: ?"(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)"\s*$/.exec(l)?.[1]).find(Boolean) ?? "<no PI_BEFORE>";
out(`(0) ci.yml declares PI_VERSION (${V}) and PI_BEFORE (${B})`, !V.startsWith("<") && !B.startsWith("<"), "values not found");
const IGN = `npm i -g --ignore-scripts ${PKG}@${V} --before=${B}`; // step 2, the setup README, the missing-pi hint
const PLAIN = `npm i -g ${PKG}@${V} --before=${B}`; // desk, bench, the bench fix line
/** Problems with one pi install command: every package spec at @V, and an unquoted --before=B. */
const pinProblems = (cmd) => {
  const p = [];
  if (new RegExp(`${esc(PKG)}(?!@${esc(V)}(?:\\s|$))`).test(cmd)) p.push(`a ${PKG} spec not at @${V}`);
  if (!new RegExp(`(?:^|\\s)--before=${esc(B)}(?=\\s|$)`).test(cmd)) p.push(`no unquoted --before=${B}`);
  return p;
};

// ---- (a) README scan: every line, any Markdown form (inline span, fenced, indented, continued)
/** Every npm i / npm install command in a Markdown text: [{ line, cmd }]. */
function npmCommands(text) {
  const lines = text.split(/\r?\n/);
  const found = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence && new RegExp(`^ {0,3}${esc(fence[0])}{${fence.length},}\\s*$`).test(line)) { fence = null; continue; }
    const open = !fence && /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (open) { fence = open[1]; continue; }
    const code = Boolean(fence) || /^(?: {4}|\t)/.test(line);
    const re = /\bnpm\s+(?:i|install)\b/g;
    let m;
    while ((m = re.exec(line))) {
      let cmd;
      const inSpan = !fence && ((line.slice(0, m.index).match(/`/g) ?? []).length % 2 === 1);
      if (inSpan) {
        // an inline code span: up to its closing backtick, which may sit on a later line of the paragraph
        let rest = line.slice(m.index), k = i;
        while (!rest.includes("`") && k + 1 < lines.length && k < i + 5) rest += `\n${lines[++k]}`;
        cmd = rest.split("`")[0];
      } else {
        // a code line or prose: to the end of the line, following \ (any) and ` or ^ (code) continuations
        let rest = line.slice(m.index), k = i;
        const cont = code ? /\s(?:\\|`|\^)\s*$/ : /\s\\\s*$/;
        while (cont.test(rest) && k + 1 < lines.length) rest = rest.replace(cont, " ") + lines[++k];
        cmd = rest;
      }
      found.push({ line: i + 1, cmd: cmd.replace(/\s+/g, " ").trim() });
    }
  }
  return found;
}
const piCommands = (text) => npmCommands(text ?? "").filter((c) => c.cmd.includes(PKG));
let readmes = [];
try { readmes = JSON.parse(read("readme-check.config.json")).readmes; } catch {}
out(`(a) the readme check covers ${readmes.length} READMEs, including the four that install pi`, ["README.md", "packages/nana-setup/README.md", "apps/desk/README.md", "apps/bench/README.md"].every((r) => readmes.includes(r)), JSON.stringify(readmes));
const byReadme = Object.fromEntries(readmes.map((r) => [r, piCommands(read(r))]));
for (const r of readmes) {
  const offenders = byReadme[r].map((c) => ({ ...c, p: pinProblems(c.cmd) })).filter((c) => c.p.length);
  out(`(a) ${r}: every pi install command carries @${V} and an unquoted --before=${B} (${byReadme[r].length} found)`, offenders.length === 0, offenders.map((c) => `:${c.line} "${c.cmd}" (${c.p.join("; ")})`).join(" | "));
}
const readme = read("README.md") ?? "";
const heading = "### Fresh machine (macOS), in order";
const checklist = readme.includes(heading) ? readme.slice(readme.indexOf(heading) + heading.length).split(/\n### /)[0] : "";
const step2Line = checklist.split(/\r?\n/).find((l) => /^\s*2\.\s/.test(l)) ?? "";
const step2 = piCommands(step2Line)[0]?.cmd ?? null;
out("(a) README.md step 2 holds a pi install command (non-vacuity)", step2 !== null, JSON.stringify(step2Line.slice(0, 160)));
for (const [r, form] of [["README.md", IGN], ["packages/nana-setup/README.md", IGN], ["apps/desk/README.md", PLAIN], ["apps/bench/README.md", PLAIN]]) {
  const cmds = byReadme[r] ?? [];
  const off = cmds.filter((c) => c.cmd !== form);
  out(`(a) ${r}: its pi install commands are exactly "${form}"`, cmds.length > 0 && off.length === 0, cmds.length ? off.map((c) => `:${c.line} "${c.cmd}"`).join(" | ") : "none found");
}

// ---- (b) the missing-pi hint, from doctor and install run with a PATH that has no pi; the bench fix line
const noPiBin = scratch("bin");
const npmReal = fs.realpathSync(path.join(path.dirname(process.execPath), "npm"));
fs.symlinkSync(process.execPath, path.join(noPiBin, "node"));
fs.symlinkSync(npmReal, path.join(noPiBin, "npm"));
const NO_PI_PATH = [noPiBin, "/usr/bin", "/bin", "/usr/sbin", "/sbin"].join(path.delimiter);
const piOn = NO_PI_PATH.split(path.delimiter).filter((d) => { try { fs.accessSync(path.join(d, "pi"), fs.constants.X_OK); return true; } catch { return false; } });
out("(b) harness: the scratch PATH has node and npm and no pi", piOn.length === 0, `pi in ${piOn.join(", ")}`);
const SETUP = path.join(root, "packages/nana-setup/bin/nana-setup.mjs");
const hintChecks = (who, hint) => {
  out(`(b) ${who}: the hint carries @${V} and an unquoted --before=${B}`, hint !== null && pinProblems(hint).length === 0, hint === null ? "no hint found" : `"${hint}": ${pinProblems(hint).join("; ")}`);
  out(`(b) ${who}: the hint equals README step 2's command`, hint !== null && hint === step2, `"${hint}" vs "${step2}"`);
};
{
  const home = scratch("doctor-home");
  const r = sh(process.execPath, [SETUP, "doctor", "--home", home], { cwd: root, env: cleanEnv({ PATH: NO_PI_PATH }), timeout: 120000 });
  const row = (r.stdout ?? "").split(/\r?\n/).find((l) => /\bpi executable\b/.test(l)) ?? null;
  out("(b) harness: doctor --home <scratch> ran and printed its pi executable row", row !== null, `exit ${r.status}; ${(r.stderr ?? "").slice(-200)}`);
  hintChecks("doctor", row === null ? null : /install: (.+)$/.exec(row)?.[1]?.trim() ?? null);
  fs.rmSync(home, { recursive: true, force: true });
}
{
  // `install --home` skips pi registration ("--home override in play") and prints no hint, so install runs in
  // real-home mode inside a scratch HOME, as the install check runs it.
  const home = scratch("install-home");
  const r = sh(process.execPath, [SETUP, "install"], { cwd: root, env: cleanEnv({ PATH: NO_PI_PATH, HOME: home, USERPROFILE: home }), timeout: 600000 });
  const row = (r.stdout ?? "").split(/\r?\n/).find((l) => /\bpi packages\b/.test(l)) ?? null;
  out("(b) harness: install in a scratch HOME ran and printed its pi packages row", row !== null && /pi is not on PATH/.test(row), `exit ${r.status}; row ${JSON.stringify(row)}; ${(r.stderr ?? "").slice(-200)}`);
  hintChecks("install", row === null ? null : /`([^`]+)`/.exec(row)?.[1]?.trim() ?? null);
  fs.rmSync(home, { recursive: true, force: true });
}
{
  const r = sh(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(path.join(root, "packages/nana-setup/lib/steps.mjs")).href)}); process.stdout.write(JSON.stringify(m.PI_INSTALL_HINT));`], { cwd: root, env: cleanEnv(), timeout: 60000 });
  let hint = null; try { hint = JSON.parse(r.stdout); } catch {}
  out("(b) steps.mjs PI_INSTALL_HINT equals README step 2's command", hint !== null && hint === step2, `"${hint}" vs "${step2}" ${(r.stderr ?? "").slice(-200)}`);
}
{
  const r = sh(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(path.join(root, "apps/bench/lib/pi-exports.mjs")).href)}); try { await m.loadPiExports({ piBin: null }); console.log("NO-THROW"); } catch (e) { console.log(e.message); }`], { cwd: root, env: cleanEnv({ BENCH_PI_ROOT: "/definitely/not/a/pi/install" }), timeout: 60000 });
  const fix = /^Fix: (.+?)(?:\s{2,}\(or set .*)?$/m.exec(r.stdout ?? "")?.[1]?.trim() ?? null;
  out("(b) harness: the bench loader with a wrong BENCH_PI_ROOT printed a Fix line", fix !== null, (r.stdout ?? r.stderr ?? "").slice(0, 200));
  out(`(b) bench: the fix line's command carries @${V} and an unquoted --before=${B}`, fix !== null && pinProblems(fix).length === 0, `"${fix}"`);
  out(`(b) bench: the fix line's command is exactly "${PLAIN}"`, fix === PLAIN, `"${fix}"`);
}
fs.rmSync(noPiBin, { recursive: true, force: true });

// ---- (c) the reader's fallback: a scratch copy of nana-setup (and nana-pack, which it imports) under a fake root
{
  const fake = scratch("reader");
  for (const p of ["packages/nana-setup", "packages/nana-pack"]) fs.cpSync(path.join(root, p), path.join(fake, p), { recursive: true });
  const ciPath = path.join(fake, ".github", "workflows", "ci.yml");
  const hintFor = (text) => {
    fs.rmSync(path.join(fake, ".github"), { recursive: true, force: true });
    if (text !== null) { fs.mkdirSync(path.dirname(ciPath), { recursive: true }); fs.writeFileSync(ciPath, text); }
    const r = sh(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(path.join(fake, "packages/nana-setup/lib/steps.mjs")).href)}); process.stdout.write(JSON.stringify(m.PI_INSTALL_HINT));`], { cwd: fake, env: cleanEnv(), timeout: 60000 });
    try { return JSON.parse(r.stdout); } catch { return `(import failed: ${(r.stderr ?? "").trim().split("\n").pop()})`; }
  };
  const lf = ciText.replace(/\r\n/g, "\n");
  const swap = (re, line) => lf.replace(re, line);
  const BEFORE_LINE = /^  PI_BEFORE:.*$/m, VERSION_LINE = /^  PI_VERSION:.*$/m;
  const placeholder = (h) => typeof h === "string" && h.includes(`${PKG}@<version>`) && /(?:^|\s)--before=<cutoff>(?=\s|$)/.test(h) && !/--before=(?:\s|$|["'])/.test(h) && !h.includes(`@${V}`) && !h.includes(B);
  const control = hintFor(lf);
  out("(c) harness: the scratch copy's steps.mjs imports and exports a hint", typeof control === "string" && !control.startsWith("(import failed"), control);
  out(`(c) control: the copy with the real ci.yml gives "${IGN}"`, control === IGN, `"${control}"`);
  out("(c) a CRLF ci.yml gives the same values", hintFor(lf.replace(/\n/g, "\r\n")) === IGN, `"${hintFor(lf.replace(/\n/g, "\r\n"))}"`);
  {
    const h = hintFor(swap(VERSION_LINE, "  PI_VERSION: 1.0.3").replace(BEFORE_LINE, '  PI_BEFORE: "2026-10-06T00:00:00Z"'));
    out("(c) a retuned pair in ci.yml reaches the hint by name, with no code change", h === `npm i -g --ignore-scripts ${PKG}@1.0.3 --before=2026-10-06T00:00:00Z`, `"${h}"`);
  }
  const variants = [
    ["no ci.yml", null],
    ["ci.yml without PI_BEFORE", lf.replace(/^  PI_BEFORE:.*\n/m, "")],
    ["PI_BEFORE with a space (\"2026-10-04 06:57:57Z\")", swap(BEFORE_LINE, '  PI_BEFORE: "2026-10-04 06:57:57Z"')],
    ["PI_BEFORE empty", swap(BEFORE_LINE, '  PI_BEFORE: ""')],
    ["PI_BEFORE not a date", swap(BEFORE_LINE, '  PI_BEFORE: "not-a-date"')],
    ["PI_BEFORE a rollover date (\"2026-02-30T06:57:57Z\")", swap(BEFORE_LINE, '  PI_BEFORE: "2026-02-30T06:57:57Z"')],
    ["PI_BEFORE with a shell metacharacter", swap(BEFORE_LINE, '  PI_BEFORE: "2026-10-04T06:57:57Z;id"')],
    ["ci.yml without PI_VERSION", lf.replace(/^  PI_VERSION:.*\n/m, "")],
    ["PI_VERSION empty", swap(VERSION_LINE, "  PI_VERSION:")],
  ];
  for (const [name, text] of variants) {
    const h = hintFor(text);
    out(`(c) ${name}: <version> and <cutoff> placeholders, never an empty --before=`, placeholder(h), `"${h}"`);
  }
  fs.rmSync(fake, { recursive: true, force: true });
}

// ---- (f) docs
{
  const setup = read("packages/nana-setup/README.md") ?? "";
  const sentences = setup.split(/(?<=[.!?])\s+/);
  const gitBash = sentences.filter((s) => /Git Bash/.test(s) && /dispatch|depends? on|\bneeds?\b|\brequires?\b|through Git Bash/i.test(s));
  out("(f) setup README: no sentence says hooks dispatch through, or the check needs, Git Bash", gitBash.length === 0, gitBash.map((s) => s.slice(0, 160)).join(" | "));
  out("(f) setup README: the Windows sentence says installed hooks run directly in exec form", /installed hooks? directly in exec form/i.test(setup), "phrase not found");
  out("(f) setup README: it says a FAIL prints the hooks block and the last knowledge-pull record", /FAIL[^.]*hooks block[^.]*knowledge-pull record/i.test(setup), "phrase not found");
  const jake = read("docs/reviews/cc-hooks-windows-2026-10-12/owner-windows-check.md") ?? "";
  const sec2 = jake.split(/\r?\n## /).find((s) => /^2\. /.test(s)) ?? "";
  const label = sec2.split(/\r?\n/).slice(1).find((l) => l.trim()) ?? "";
  out("(f) Jake's page: step 2 is labelled PowerShell-only", label === "In PowerShell, from the checkout:", JSON.stringify(label));
}

// ---- scope helpers (committed diff against the merge base with main; (h) adds uncommitted and untracked paths)
const mainRef = git("rev-parse", "--verify", "--quiet", "main").status === 0 ? "main" : "origin/main";
const base = git("merge-base", mainRef, "HEAD").stdout.trim();
const atBase = (rel) => { const r = git("show", `${base}:${rel}`); return r.status === 0 ? r.stdout : null; };
const oneLineChange = (rel) => {
  const a = (atBase(rel) ?? "").split("\n"), b = (read(rel) ?? "").split("\n");
  const diffs = a.length === b.length ? a.filter((l, i) => l !== b[i]).length : -1;
  return { ok: diffs === 1, why: diffs < 0 ? `line count ${a.length} → ${b.length}` : `${diffs} lines differ` };
};
{
  const j = oneLineChange("docs/reviews/cc-hooks-windows-2026-10-12/owner-windows-check.md");
  out("(f) Jake's page differs from main in exactly one line", j.ok, j.why);
  const d = oneLineChange("apps/desk/README.md");
  out("(f) apps/desk/README.md differs from main in exactly one line (the runtime row)", d.ok, d.why);
}

// ---- (g) the ledger
{
  const ledger = read("REQUIREMENTS.md") ?? "";
  const baseLedger = atBase("REQUIREMENTS.md") ?? "";
  const rowsOf = (text) => {
    const rows = new Map(); let headingId = null;
    for (const line of text.split(/\r?\n/)) {
      const h = /^#{1,4} ((?:CAP|FEAT|SUB)-\d+) ·/.exec(line);
      if (h) { headingId = h[1]; continue; }
      const r = /^\| ((?:R|G)-\d+) \| (.*) \| ([a-z]+) \|(.*)\|\s*$/.exec(line);
      if (r) rows.set(r[1], { text: r[2], status: r[3], evidence: r[4].trim(), heading: headingId });
    }
    return rows;
  };
  const now = rowsOf(ledger), then = rowsOf(baseLedger);
  for (const [id, home] of [["R-1093", "SUB-011"], ["R-1094", "SUB-011"], ["R-1095", "FEAT-034"], ["R-1096", "FEAT-015"]]) {
    const row = now.get(id);
    const shalls = (row?.text.match(/\bshall\b/g) ?? []).length;
    out(`(g) ${id} exists under ${home} with exactly one "shall"`, row && row.heading === home && shalls === 1, row ? `under ${row.heading}, ${shalls} shall` : "no row");
  }
  out("(g) R-1097 is unused", !/\bR-1097\b/.test(ledger), "R-1097 appears in REQUIREMENTS.md");
  const leaves = (ledger.match(/^\| (?:R|G)-\d+ \|/gm) ?? []).length;
  out("(g) the ledger holds 1,104 rows (1,092 + the process lane's 12, merged 2026-10-13)", leaves === 1104, `${leaves} rows`);
  const changed = [...then].filter(([id, r]) => !now.has(id) || now.get(id).text !== r.text || now.get(id).status !== r.status).map(([id]) => id);
  out("(g) no existing row changed its text or status, and none was removed", then.size > 0 && changed.length === 0, changed.join(", ") || "base ledger unreadable");
  const missing = [];
  for (const [file, title, rows] of REQUIRED["1"]) for (const id of rows) if (id !== "R-291" && !(now.get(id)?.evidence ?? "").includes(`\`${file}::${title}\``)) missing.push(`${id} ⟵ ${title}`);
  out("(g) each row's evidence cites every listed test whose marker names it (R-291 excepted)", missing.length === 0, missing.join(" | "));
  const stale = GONE["1"].filter(([, title]) => ledger.includes(`::${title}\``)).map(([, t]) => t);
  out("(g) no row still cites a renamed title", stale.length === 0, stale.join(" | "));
  const tree = sh(process.execPath, ["scripts/requirements-tree.mjs", "--check"], { cwd: root, timeout: 120000 });
  out("(g) node scripts/requirements-tree.mjs --check exits 0", tree.status === 0, `${tree.status}: ${(tree.stdout + tree.stderr).trim().slice(-300)}`);
}

// ---- (h) scope
{
  const committed = git("diff", "--name-only", `${base}`, "HEAD").stdout.split("\n").filter(Boolean);
  const working = git("diff", "--name-only", "HEAD").stdout.split("\n").filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard").stdout.split("\n").filter(Boolean);
  const all = [...new Set([...committed, ...working, ...untracked])].sort();
  const ALLOWED = new Set([
    // CHANGE §4: code (5), tests (6), docs, ledger and generated files
    "packages/nana-setup/lib/pi-pin.mjs", "packages/nana-setup/lib/steps.mjs", "packages/nana-setup/lib/install-check.mjs",
    "packages/nana-setup/lib/install-check-config.mjs", "apps/bench/lib/pi-exports.mjs",
    "packages/nana-setup/tests/pi-install-pin.test.mjs", "packages/nana-setup/tests/install-check.test.mjs",
    "packages/nana-setup/tests/fresh-machine.test.mjs", "packages/nana-pack/tests/ci-workflow.test.mjs",
    "packages/nana-pack/tests/requirements-tree.test.mjs", "apps/bench/test/usage.test.mjs",
    "README.md", "packages/nana-setup/README.md", "apps/desk/README.md", "apps/bench/README.md",
    "docs/reviews/cc-hooks-windows-2026-10-12/owner-windows-check.md", "docs/sessions/2026-10.md", "HANDOFF.md",
    "REQUIREMENTS.md", "docs/requirements-tree.md", "docs/code-map.md",
    // plan review NOTE: the two R-1037 tests gain R-1093 in their markers (§4 listed this file as NOT; the plan
    // review's later decision wins, markers only)
    "packages/nana-setup/tests/doctor-runtime.test.mjs",
  ]);
  const outside = all.filter((p) => !ALLOWED.has(p) && !p.startsWith(`${REVIEW}/`));
  out(`(h) every changed path is in CHANGE §4 or the lane's review folder (${all.length} paths)`, outside.length === 0, outside.join(", "));
  const touched = (pred) => all.filter(pred);
  out("(h) .github/ is unchanged", touched((p) => p.startsWith(".github/")).length === 0, touched((p) => p.startsWith(".github/")).join(", "));
  out("(h) apps/desk changes only README.md", touched((p) => p.startsWith("apps/desk/") && p !== "apps/desk/README.md").length === 0, touched((p) => p.startsWith("apps/desk/") && p !== "apps/desk/README.md").join(", "));
  for (const p of ["packages/nana-setup/lib/doctor.mjs", "packages/nana-pack/lib/win-command.mjs", "packages/nana-setup/bin/install-check.mjs", "packages/nana-setup/tests/pi-registration.test.mjs"]) out(`(h) ${p} is unchanged`, !all.includes(p), "changed");
  out("(h) templates/ and the bench studies are unchanged", touched((p) => p.startsWith("templates/") || p.startsWith("apps/bench/studies/")).length === 0, touched((p) => p.startsWith("templates/") || p.startsWith("apps/bench/studies/")).join(", "));
  if (working.length || untracked.filter((p) => !p.startsWith(`${REVIEW}/`)).length) console.log(`note: uncommitted paths outside the review folder: ${[...working, ...untracked].filter((p) => !p.startsWith(`${REVIEW}/`)).join(", ") || "none"}`);
}

// ---- (i) titles (seat-titles.mjs session 1, which also requires the renamed titles gone)
{
  const lines = [];
  const missing = titleReport("1", (l) => lines.push(l));
  out("(i) seat-titles 1: every title once, with its rows, and the old titles gone", missing === 0, `${missing} missing: ${lines.filter((l) => !/^(ok|gone) /.test(l) && !l.startsWith("seat-titles")).slice(0, 4).join(" | ")}`);
}

// ---- (j) the doctor note list retune (R-1081's sealed value)
{
  const r = sh(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(path.join(root, "packages/nana-setup/lib/install-check-config.mjs")).href)}); process.stdout.write(JSON.stringify(m.DOCTOR_NOTES.win32));`], { cwd: root, timeout: 60000 });
  let notes = []; try { notes = JSON.parse(r.stdout); } catch {}
  out("(j) win32 doctor notes: 17, without the two skills doctor never notes, keeping skill spec", notes.length === 17 && !notes.includes("skill requirements") && !notes.includes("skill nana-standards") && notes.includes("skill spec"), `${notes.length}: ${notes.filter((x) => /^skill /.test(x)).join(", ")}`);
}

// ---- (d) pinned scratch installs of both README commands, run as written
const piTree = (lsJson) => {
  const set = new Set();
  const pi = lsJson?.dependencies?.[PKG];
  const walk = (name, d) => { const k = `${name}@${d.version}`; if (set.has(k) && !d.dependencies) return; set.add(k); for (const [m, e] of Object.entries(d.dependencies ?? {})) walk(m, e); };
  if (pi) walk(PKG, pi);
  return set;
};
const seatLs = sh("npm", ["ls", "-g", "--all", "--json"], { cwd: os.tmpdir(), env: cleanEnv(), timeout: 120000 });
let seatTree = new Set(); try { seatTree = piTree(JSON.parse(seatLs.stdout)); } catch {}
for (const [name, cmd] of [["README step 2", step2], ["the desk README", byReadme["apps/desk/README.md"]?.[0]?.cmd ?? null]]) {
  if (!cmd) { out(`(d) ${name}: a command to run`, false, "none found"); continue; }
  const prefix = scratch("prefix");
  const r = sh("/bin/sh", ["-c", `${cmd} --prefix '${prefix}'`], { cwd: prefix, env: cleanEnv(), timeout: 600000 });
  out(`(d) harness: ${name}'s command ran into a scratch --prefix ("${cmd}")`, r.status === 0, `exit ${r.status}: ${(r.stderr ?? "").trim().split("\n").slice(-2).join(" ")}`);
  const ls = sh("npm", ["ls", "--prefix", prefix, "-g", "--all", "--json"], { cwd: prefix, env: cleanEnv(), timeout: 120000 });
  let tree = new Set(); try { tree = piTree(JSON.parse(ls.stdout)); } catch {}
  const ew = [...tree].filter((k) => k.startsWith("@earendil-works/"));
  const off = ew.filter((k) => !k.endsWith(`@${V}`));
  out(`(d) ${name}: every @earendil-works package is at ${V} (${ew.length} found)`, ew.length > 0 && off.length === 0, off.join(", ") || "none installed");
  const onlyScratch = [...tree].filter((k) => !seatTree.has(k)), onlySeat = [...seatTree].filter((k) => !tree.has(k));
  out(`(d) ${name}: the tree equals the seat's global pi tree (${tree.size} vs ${seatTree.size})`, tree.size > 0 && onlyScratch.length === 0 && onlySeat.length === 0, `scratch only: ${onlyScratch.slice(0, 6).join(", ")}; seat only: ${onlySeat.slice(0, 6).join(", ")}`);
  let entry = null;
  try {
    const dir = path.join(prefix, "lib", "node_modules", ...PKG.split("/"));
    const pj = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    const ex = pj.exports?.["."] ?? pj.exports;
    entry = path.join(dir, (typeof ex === "string" ? ex : ex?.import ?? ex?.default) ?? pj.main);
  } catch {}
  const imp = entry ? sh(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(entry).href)}); process.exit(0);`], { cwd: prefix, env: cleanEnv(), timeout: 120000 }) : { status: "no entry", stderr: "" };
  out(`(d) ${name}: pi's main entry imports`, imp.status === 0, `${imp.status}: ${(imp.stderr ?? "").trim().split("\n").filter((l) => /Error|error/.test(l)).slice(0, 2).join(" ")}`);
  fs.rmSync(prefix, { recursive: true, force: true });
}
{
  // PowerShell: step 2 as written, through npm's own npm.ps1 when SEAT_PWSH_SIM holds it (dry run), and the
  // placeholder form of the same command, which must install nothing.
  const pwsh = process.env.SEAT_PWSH || (sh("/bin/sh", ["-c", "command -v pwsh"]).stdout.trim() || null);
  const sim = process.env.SEAT_PWSH_SIM || (pwsh ? path.join(path.dirname(pwsh), "sim") : null);
  if (!pwsh || !fs.existsSync(pwsh) || !step2) out("(d) PowerShell: a pwsh to run step 2 in", false, !step2 ? "no step 2 command" : "no pwsh: set SEAT_PWSH");
  else {
    const prefix = scratch("pwsh-prefix");
    fs.mkdirSync(path.join(prefix, "lib"), { recursive: true }); // a global dry run lstats <prefix>/lib
    const run = (cmd) => {
      const ps1 = path.join(prefix, "run.ps1");
      const simLine = sim && fs.existsSync(path.join(sim, "npm.ps1")) ? `$env:PATH = ${JSON.stringify(sim)} + [IO.Path]::PathSeparator + $env:PATH\n` : "";
      fs.writeFileSync(ps1, `${simLine}${cmd} --dry-run --prefix '${prefix}' 2>&1 | ForEach-Object { "$_" }\n"seat-exit: $LASTEXITCODE"\n`);
      const r = sh(pwsh, ["-NoProfile", "-NonInteractive", "-File", ps1], { cwd: prefix, env: cleanEnv(), timeout: 600000 });
      return { text: `${r.stdout ?? ""}${r.stderr ?? ""}`, exit: /seat-exit: (\S*)/.exec(r.stdout ?? "")?.[1] ?? `pwsh ${r.status}` };
    };
    const good = run(step2);
    const adds = [...good.text.matchAll(/add (@earendil-works\/\S+) (\S+)/g)].map((m) => `${m[1]}@${m[2]}`);
    out(`(d) PowerShell${sim && fs.existsSync(path.join(sim, "npm.ps1")) ? " via npm.ps1" : ""}: step 2 as written resolves every @earendil-works package at ${V} (dry run, exit 0)`, good.exit === "0" && adds.length > 0 && adds.every((a) => a.endsWith(`@${V}`)), `exit ${good.exit}; ${adds.filter((a) => !a.endsWith(`@${V}`)).slice(0, 4).join(", ") || good.text.trim().split("\n").slice(-2).join(" ")}`);
    const ph = run(step2.replace(`${PKG}@${V}`, `${PKG}@<version>`).replace(`--before=${B}`, "--before=<cutoff>"));
    out("(d) PowerShell: the placeholder form exits non-zero and adds nothing", ph.exit !== "0" && !/add @earendil-works\//.test(ph.text), `exit ${ph.exit}`);
    fs.rmSync(prefix, { recursive: true, force: true });
  }
}

// ---- (e) the install check: a clean run here, then a fault run in a scratch worktree at HEAD
const RESULT = /^(PASS|FAIL|XFAIL) /;
const runCheck = (cwd) => sh(process.execPath, [path.join(cwd, "packages/nana-setup/bin/install-check.mjs")], { cwd, env: cleanEnv(), timeout: 20 * 60 * 1000 });
{
  const r = runCheck(root);
  const lines = (r.stdout ?? "").split(/\r?\n/).filter((l) => l.trim());
  const results = lines.filter((l) => RESULT.test(l));
  out("(e) a clean run here exits 0 with only PASS result lines", r.status === 0 && results.length > 0 && results.every((l) => l.startsWith("PASS ")), `exit ${r.status}; ${results.filter((l) => !l.startsWith("PASS ")).join(" | ").slice(0, 300)}`);
  out("(e) a clean run prints no diagnostics lines", !lines.some((l) => /^(settings hooks|last pull\.log record):/.test(l)), "diagnostics printed on a PASS-only run");
  const kept = /install-check home retained: (.+)$/m.exec(r.stderr ?? "")?.[1]; if (kept) fs.rmSync(kept.trim(), { recursive: true, force: true });
}
{
  const head = git("rev-parse", "HEAD").stdout.trim();
  const wt = scratch("fault-wt"); fs.rmSync(wt, { recursive: true, force: true });
  const add = git("worktree", "add", "--detach", wt, head);
  if (add.status !== 0) out("(e) harness: a scratch worktree at HEAD", false, add.stderr);
  else {
    const file = path.join(wt, "packages/nana-setup/claude/hooks/nana-shared-memory.mjs");
    const src = fs.readFileSync(file, "utf8");
    const broken = src.replace(/from "(\.\.\/\.\.\/lib\/[^"]+)"/, 'from "$1.BROKEN"');
    out("(e) harness: a scratch worktree at HEAD with the shared-memory hook's import broken", broken !== src, "the fault did not apply");
    fs.writeFileSync(file, broken);
    const r = runCheck(wt);
    const lines = (r.stdout ?? "").split(/\r?\n/).filter((l) => l.trim());
    const lastResult = lines.reduce((at, l, i) => (RESULT.test(l) ? i : at), -1);
    out("(e) harness: the fault run exits non-zero and FAILs hook shared memory", r.status !== 0 && lines.some((l) => /^FAIL hook shared memory\b/.test(l)), `exit ${r.status}; ${lines.filter((l) => /shared memory/.test(l)).join(" | ")}`);
    const tail = lines.slice(-2);
    out("(e) the last two lines are `settings hooks:` then `last pull.log record:`, after every result line", lines.length >= 3 && lastResult >= 0 && lastResult < lines.length - 2 && tail[0].startsWith("settings hooks: ") && tail[1].startsWith("last pull.log record: "), `tail ${JSON.stringify(tail)}; last result line at ${lastResult} of ${lines.length}`);
    const home = /install-check home retained: (.+)$/m.exec(r.stderr ?? "")?.[1]?.trim() ?? null;
    out("(e) harness: the fault run kept its temporary home and named it", home !== null && fs.existsSync(home), (r.stderr ?? "").trim().slice(-200));
    if (home) {
      let want; try { want = JSON.stringify(JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8")).hooks ?? null); } catch (e) { want = `could not be read (${e.code ?? e.name})`; }
      const got = tail[0]?.startsWith("settings hooks: ") ? tail[0].slice("settings hooks: ".length) : null;
      out("(e) the settings hooks line holds the kept home's hooks block as one-line JSON", got !== null && got === want, `got ${String(got).slice(0, 120)}; want ${want.slice(0, 120)}`);
      let rec; try { const t = fs.readFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "pull.log"), "utf8"); rec = t.split(/\r?\n/).filter((l) => l.trim()).at(-1) ?? "none"; } catch (e) { rec = `could not be read (${e.code ?? e.name})`; }
      const gotRec = tail[1]?.startsWith("last pull.log record: ") ? tail[1].slice("last pull.log record: ".length) : null;
      out("(e) the pull.log line holds the kept home's last non-empty pull.log line", gotRec !== null && gotRec.trim() === rec.trim(), `got ${String(gotRec).slice(0, 120)}; want ${rec.slice(0, 120)}`);
      fs.rmSync(home, { recursive: true, force: true });
    }
  }
  git("worktree", "remove", "--force", wt);
}

console.log(`cases: ${n - bad}/${n}`);
console.log(`fresh-install acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
