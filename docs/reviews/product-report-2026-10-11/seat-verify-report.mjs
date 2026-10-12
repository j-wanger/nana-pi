// Seat acceptance for the product-report lane (frozen; the builder runs it from the worktree root and
// writes its output to seat-verify-report-output.txt). It drives the lane's OWN report command,
// `node scripts/product-report.mjs --root <repo> --out <file>`, against scratch git repositories, and
// reads the page and the exit status like a user would. Every case prints ok or MISS; exit 1 on any
// MISS. CHANGE.md is the contract. Round 2 scope: the page, refusals, determinism, the commit stamp
// and hostile text; stamps, schema and packets are added in later rounds.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const W = process.cwd();
const SCRIPT = join(W, "scripts/product-report.mjs");
const ROOT = mkdtempSync(join(tmpdir(), "seat-report-"));
const env = { ...process.env, GIT_AUTHOR_NAME: "seat", GIT_AUTHOR_EMAIL: "seat@test", GIT_COMMITTER_NAME: "seat", GIT_COMMITTER_EMAIL: "seat@test", GIT_AUTHOR_DATE: "2026-10-11T09:00:00+00:00", GIT_COMMITTER_DATE: "2026-10-11T09:00:00+00:00" };

let mismatches = 0;
const out = (label, got, want) => {
  const pass = String(got) === String(want);
  if (!pass) mismatches++;
  console.log(`${pass ? "ok  " : "MISS"} ${label}: ${got} (want ${want})`);
};
const git = (cwd, ...args) => {
  const r = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};

const HEAD = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|";
const LEDGER = [
  "# Requirements — fixture", "",
  "# CAP-01 · Zebra capability", "Purpose: Zebracap purpose words.", "Outcome: Zebracap outcome words.", "",
  "## FEAT-001 · Quokka feature", "Purpose: Quokkafeat purpose words.", "Status: active", "",
  HEAD,
  "| R-001 | The tool shall quokka one. | implemented | `tests/a.test.mjs::one` |",
  "| R-002 | The tool shall quokka two. | violated | Violatedrow evidence words. |",
  "| R-1000 | The tool shall quokka four digits. | untested | — |", "",
  "## FEAT-002 · Wombat feature", "Purpose: Wombatfeat purpose words.", "Status: active", "Also applies: R-001", "",
  HEAD,
  "| R-003 | The tool shall wombat three. | planned | — |", "",
].join("\n");
const HANDOFF = [
  "# Handoff — fixture", "",
  "## Open for Jake (each ask: blocking, optional or parked, and since when)", "",
  "- **[optional, since 2026-10-10] Narwhal title.** Narwhalbody words that hold the decision.",
  "- **[blocking, since 2026-10-09] Ocelot title.** Ocelotbody words.", "",
].join("\n");

let n = 0;
function repo(files) {
  const dir = join(ROOT, `r${++n}`);
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  git(dir, "add", ".");
  git(dir, "commit", "-qm", "fixture");
  return dir;
}
function report(root, outFile = join(ROOT, `page-${++n}.html`)) {
  const p = spawnSync("node", [SCRIPT, "--root", root, "--out", outFile], { cwd: W, env, encoding: "utf8" });
  return { code: p.status, text: `${p.stdout}${p.stderr}`, page: existsSync(outFile) ? readFileSync(outFile, "utf8") : null, outFile };
}

// ── The page shows the ledger and HANDOFF (R-1014–R-1018) ──
{
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": HANDOFF });
  const a = report(r);
  out("the report runs on a valid fixture", `${a.code}/${a.page !== null}`, "0/true");
  const page = a.page ?? "";
  for (const [label, token] of [
    ["capability purpose", "Zebracap purpose words"], ["capability outcome", "Zebracap outcome words"],
    ["feature purpose", "Quokkafeat purpose words"], ["a second feature", "Wombatfeat purpose words"],
    ["a row's text", "The tool shall quokka one."], ["a four-digit row", "R-1000"], ["a row's evidence", "Violatedrow evidence words"],
    ["an ask's title", "Narwhal title"], ["an ask's body", "Narwhalbody words that hold the decision"], ["a second ask's body", "Ocelotbody words"],
  ]) out(`page shows ${label}`, page.includes(token), "true");
  const head = git(r, "rev-parse", "HEAD");
  const date = git(r, "log", "-1", "--format=%cI");
  out("page states the full commit hash", page.includes(head), "true");
  out("page states the commit date", page.includes(date), "true");
  const b = report(r);
  out("two runs at one commit are byte-identical", a.page !== null && a.page === b.page, "true");
}

// ── The clean flag (R-1013) ──
{
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": HANDOFF });
  const clean = report(r).page ?? "";
  writeFileSync(join(r, "HANDOFF.md"), `${HANDOFF}\n`);
  const tracked = report(r).page ?? "";
  git(r, "checkout", "--", "HANDOFF.md");
  writeFileSync(join(r, "untracked.txt"), "x\n");
  const untracked = report(r).page ?? "";
  out("a clean tree and a tracked change give different pages", clean !== tracked && clean.length > 0, "true");
  out("an untracked file also marks the tree not clean", clean !== untracked && untracked.length > 0, "true");
}

// ── Refusals write no page (R-1026, R-1030) ──
{
  const bad = LEDGER.replace("# CAP-01 · Zebra capability", "| R-099 | The tool shall stray. | untested | — |\n\n# CAP-01 · Zebra capability");
  const r = repo({ "REQUIREMENTS.md": bad, "HANDOFF.md": HANDOFF });
  const a = report(r);
  out("a row outside any feature: refused, no page, problem named", `${a.code !== 0}/${a.page === null}/${/R-099/.test(a.text)}`, "true/true/true");
}
{
  const badAsk = HANDOFF.replace("- **[blocking, since 2026-10-09] Ocelot title.** Ocelotbody words.", "- an ask with no tag and no title");
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": badAsk });
  const a = report(r);
  const line = badAsk.split("\n").findIndex((l) => l.startsWith("- an ask with no tag")) + 1;
  out("a malformed ask: refused, no page, its line named", `${a.code !== 0}/${a.page === null}/${a.text.includes(String(line))}`, "true/true/true");
}

// ── Hostile text stays text (R-1019, the data half) ──
{
  const hostile = LEDGER.replace("The tool shall quokka one.", "The tool shall quokka </script><img src=x onerror=alert(1)> one.");
  const r = repo({ "REQUIREMENTS.md": hostile, "HANDOFF.md": HANDOFF });
  const a = report(r);
  const page = a.page ?? "";
  out("hostile ledger text: the report runs", a.code, "0");
  out("the raw `</script><img` sequence never appears in the page", page.includes("</script><img"), "false");
  out("the hostile text is still carried (escaped)", /onerror=alert\(1\)/.test(page), "true");
}

// ── CRLF and trailing whitespace in the ledger still read (normalised before parsing) ──
{
  const crlf = LEDGER.split("\n").map((l) => `${l}  `).join("\r\n");
  const r = repo({ "REQUIREMENTS.md": crlf, "HANDOFF.md": HANDOFF });
  const a = report(r);
  out("a CRLF ledger with trailing spaces: the report runs and shows its rows", `${a.code}/${(a.page ?? "").includes("The tool shall wombat three.")}`, "0/true");
}

// ── Round 3: the assessment store (R-1020, R-1022, R-1023, R-1024, R-1026, R-1027) ──
// The seat computes fingerprints itself (SHA-256 over the JSON array [id, requirement, status]) and
// calls the lane's exported `validateStore({ root, storePath, gitRunner })`, which returns a list of
// problem strings (empty when the store is valid).
const { createHash } = await import("node:crypto");
const mod = await import(new URL(`file://${SCRIPT}`).href);
const sha = (id, req, status) => createHash("sha256").update(JSON.stringify([id, req, status])).digest("hex");
function stampFor(commit, { mark1000 = "own", status1 = "implemented" } = {}) {
  return {
    commit, purpose: "Quokkafeat purpose words.", status: "active",
    rows: [
      { id: "R-001", mark: "own", status: status1, sha256: sha("R-001", "The tool shall quokka one.", status1) },
      { id: "R-002", mark: "own", status: "violated", sha256: sha("R-002", "The tool shall quokka two.", "violated") },
      { id: "R-1000", mark: mark1000, status: "untested", sha256: sha("R-1000", "The tool shall quokka four digits.", "untested") },
    ],
  };
}
function assessment(commit, over = {}) {
  return { id: "FEAT-001", what_it_does: "It keeps quokkas in order.", maturity: "partial", maturity_reason: "Some rows are not tested yet.", gaps: ["A gap."], risks: ["A risk."], decisions: ["A decision."], next_step: "Test the rest.", written_by: "seat", checked_by: "seat", date: "2026-10-11", stamp: stampFor(commit), ...over };
}
function storeRepo(storeFor) {
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": HANDOFF });
  const commit = git(r, "rev-parse", "HEAD");
  const store = storeFor(commit);
  mkdirSync(join(r, "docs/product-report"), { recursive: true });
  writeFileSync(join(r, "docs/product-report/assessments.json"), `${JSON.stringify(store, null, 2)}\n`);
  return { r, commit };
}
const problems = (r) => {
  try { const p = mod.validateStore({ root: r, storePath: join(r, "docs/product-report/assessments.json") }); return Array.isArray(p) ? p : [`not a list: ${typeof p}`]; }
  catch (e) { return [`threw: ${e.message}`]; }
};
{
  const { r } = storeRepo((c) => ({ version: 1, features: [assessment(c)] }));
  out("a store stamped from the ledger at its commit is valid", problems(r).join(" | ") || "none", "none");
}
for (const [label, make, pattern] of [
  ["a forged row status in the stamp", (c) => { const a = assessment(c); a.stamp.rows[0].status = "untested"; return { version: 1, features: [a] }; }, /R-001/],
  ["a stamp commit the clone lacks", () => ({ version: 1, features: [assessment("0".repeat(40))] }), /0{40}.*fetch full history|fetch full history.*0{40}/i],
  ["a digit in prose", (c) => ({ version: 1, features: [assessment(c, { next_step: "Test the other 2." })] }), /digit|next_step/i],
  ["solid with an untested own row", (c) => ({ version: 1, features: [assessment(c, { maturity: "solid" })] }), /solid/i],
  ["a second assessment for one feature", (c) => ({ version: 1, features: [assessment(c), assessment(c)] }), /FEAT-001|duplicate/i],
  ["a row twice in one stamp", (c) => { const a = assessment(c); a.stamp.rows.push(a.stamp.rows[0]); return { version: 1, features: [a] }; }, /R-001|duplicate/i],
  ["an unknown field", (c) => ({ version: 1, features: [assessment(c, { extra: "x" })] }), /extra|unknown|field/i],
  ["a rating outside the enum", (c) => ({ version: 1, features: [assessment(c, { maturity: "great" })] }), /great|rating|maturity/i],
  ["an own row marked shared (mark mismatch)", (c) => { const a = assessment(c); a.stamp.rows[2].mark = "shared"; return { version: 1, features: [a] }; }, /R-1000|mark/i],
]) {
  const { r } = storeRepo(make);
  const p = problems(r);
  out(`store check refuses ${label}`, `${p.length > 0}/${pattern.test(p.join(" | "))}`, "true/true");
}
{
  // R-1022: a stamp computed from LF text validates against the same ledger committed with CRLF and trailing spaces.
  const r = repo({ "REQUIREMENTS.md": LEDGER.split("\n").map((l) => `${l}  `).join("\r\n"), "HANDOFF.md": HANDOFF });
  const commit = git(r, "rev-parse", "HEAD");
  mkdirSync(join(r, "docs/product-report"), { recursive: true });
  writeFileSync(join(r, "docs/product-report/assessments.json"), `${JSON.stringify({ version: 1, features: [assessment(commit)] }, null, 2)}\n`);
  out("fingerprints are equal for a CRLF, trailing-space ledger", problems(r).join(" | ") || "none", "none");
}

// ── Round 4: staleness on the page (R-1021) and the real store (migration) ──
// `buildReport({ root })` returns a model whose `features` each carry `assessmentState`
// ("current" | "out of date" | "unassessed") and `differences`
// ({ added, removed, changed, purpose, status }) as CHANGE §4 declares.
async function stateAfter(change) {
  const { r } = storeRepo((c) => ({ version: 1, features: [assessment(c)] }));
  if (change) { change(r); git(r, "add", "."); git(r, "commit", "-qm", "change"); }
  const model = await mod.buildReport({ root: r });
  const f = (model.features ?? []).find((x) => x.id === "FEAT-001");
  return f ? { state: f.assessmentState, d: f.differences ?? {} } : { state: "missing feature", d: {} };
}
const edit = (r, from, to) => writeFileSync(join(r, "REQUIREMENTS.md"), readFileSync(join(r, "REQUIREMENTS.md"), "utf8").replace(from, to));
{
  const s = await stateAfter(null);
  out("an untouched stamped assessment is current", s.state, "current");
}
for (const [label, change, check] of [
  ["a row's text changes", (r) => edit(r, "The tool shall quokka one.", "The tool shall quokka one, carefully."), (s) => (s.d.changed ?? []).includes("R-001")],
  ["a row's status changes", (r) => edit(r, "| R-1000 | The tool shall quokka four digits. | untested |", "| R-1000 | The tool shall quokka four digits. | implemented |"), (s) => (s.d.changed ?? []).includes("R-1000")],
  ["a row is added to the feature", (r) => edit(r, "| R-1000 | The tool shall quokka four digits. | untested | — |", "| R-1000 | The tool shall quokka four digits. | untested | — |\n| R-004 | The tool shall quokka more. | untested | — |"), (s) => (s.d.added ?? []).includes("R-004")],
  ["a row is shared into the feature", (r) => edit(r, "Purpose: Quokkafeat purpose words.\nStatus: active", "Purpose: Quokkafeat purpose words.\nStatus: active\nAlso applies: R-003"), (s) => (s.d.added ?? []).includes("R-003")],
  ["the feature's purpose changes", (r) => edit(r, "Purpose: Quokkafeat purpose words.", "Purpose: Quokkafeat purpose, reworded."), (s) => Boolean(s.d.purpose)],
  ["the feature's status changes", (r) => edit(r, "## FEAT-001 · Quokka feature\nPurpose: Quokkafeat purpose words.\nStatus: active", "## FEAT-001 · Quokka feature\nPurpose: Quokkafeat purpose words.\nStatus: frozen (seat fixture)"), (s) => Boolean(s.d.status)],
  ["a row moves home and is shared back", (r) => {
    edit(r, "| R-1000 | The tool shall quokka four digits. | untested | — |\n", "");
    edit(r, "| R-003 | The tool shall wombat three. | planned | — |", "| R-003 | The tool shall wombat three. | planned | — |\n| R-1000 | The tool shall quokka four digits. | untested | — |");
    edit(r, "Purpose: Quokkafeat purpose words.\nStatus: active", "Purpose: Quokkafeat purpose words.\nStatus: active\nAlso applies: R-1000");
  }, (s) => (s.d.changed ?? []).includes("R-1000")],
]) {
  const s = await stateAfter(change);
  out(`out of date when ${label}, and it is named`, `${s.state}/${check(s)}`, "out of date/true");
}
{
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": HANDOFF });
  const model = await mod.buildReport({ root: r });
  out("a feature with no assessment is unassessed", (model.features ?? []).find((x) => x.id === "FEAT-002")?.assessmentState, "unassessed");
}
{
  const realStore = join(W, "docs/product-report/assessments.json");
  out("the real store exists after migration", existsSync(realStore), "true");
  const p = existsSync(realStore) ? mod.validateStore({ root: W }) : ["missing"];
  out("the real store validates against the ledger history", p.join(" | ") || "none", "none");
  const store = existsSync(realStore) ? JSON.parse(readFileSync(realStore, "utf8")) : { features: [] };
  out("the real store holds the 38 migrated assessments", store.features?.length, "38");
  // Final reviews r1 (astra S1): FEAT-013 was refreshed through the guide in build 11; every OTHER
  // migrated assessment keeps the migration stamp, and FEAT-013 must carry a later stamp that validates.
  out("every migrated assessment except the refreshed FEAT-013 is stamped at c4332ec", (store.features ?? []).length > 0 && store.features.filter((f) => f.id !== "FEAT-013").every((f) => f.stamp?.commit === "c4332ecb9b9d22d45083fb52b9631c5f1b41fa67"), "true");
  out("the refreshed FEAT-013 carries a later stamp", (store.features ?? []).some((f) => f.id === "FEAT-013" && f.stamp?.commit !== "c4332ecb9b9d22d45083fb52b9631c5f1b41fa67"), "true");
}

// ── Round 5: packets (R-1029) ──
// `node scripts/product-report.mjs --root <repo> --packets <dir>` writes one `<feature id>.json` per
// out-of-date or unassessed feature in CHANGE §4's packet shape, and refuses a non-empty directory.
// An unassessed feature's packet has `assessment: null` and empty differences. Each packet carries
// `stamp`: the feature's stamp at HEAD, so a candidate (prose + packet.stamp) validates clean.
function packets(root, dir) {
  const p = spawnSync("node", [SCRIPT, "--root", root, "--packets", dir], { cwd: W, env, encoding: "utf8" });
  const files = existsSync(dir) ? readdirSync(dir).sort() : [];
  return { code: p.status, text: `${p.stdout}${p.stderr}`, files, read: (f) => readFileSync(join(dir, f), "utf8") };
}
const keys = (o) => (o && typeof o === "object" ? Object.keys(o).sort().join(",") : String(o));
const parse = (t) => { try { return JSON.parse(t); } catch { return null; } };
{
  const { r, commit } = storeRepo((c) => ({ version: 1, features: [assessment(c)] }));
  edit(r, "The tool shall quokka one.", "The tool shall quokka one, carefully."); git(r, "add", "."); git(r, "commit", "-qm", "change");
  const dir = join(ROOT, `packets-${++n}`);
  const a = packets(r, dir);
  out("packets: runs on an absent directory", a.code, 0);
  out("packets: exactly one per out-of-date or unassessed feature", a.files.join(","), "FEAT-001.json,FEAT-002.json");
  const p1 = a.files.includes("FEAT-001.json") ? parse(a.read("FEAT-001.json")) : null;
  const p2 = a.files.includes("FEAT-002.json") ? parse(a.read("FEAT-002.json")) : null;
  out("packet: top-level keys", keys(p1), "assessment,differences,feature,rows,stamp,version");
  out("packet: version", p1?.version, 1);
  out("packet: feature keys", keys(p1?.feature), "id,label,purpose,status");
  out("packet: feature purpose and status are current", `${p1?.feature?.purpose}/${p1?.feature?.status}`, "Quokkafeat purpose words./active");
  out("packet: row keys", keys(p1?.rows?.[0]), "evidence,id,mark,requirement,status");
  out("packet: own rows of a stale feature", (p1?.rows ?? []).map((x) => `${x.id}:${x.mark}`).sort().join(","), "R-001:own,R-002:own,R-1000:own");
  out("packet: row text is current", (p1?.rows ?? []).find((x) => x.id === "R-001")?.requirement, "The tool shall quokka one, carefully.");
  out("packet: row evidence is carried", (p1?.rows ?? []).find((x) => x.id === "R-002")?.evidence, "Violatedrow evidence words.");
  out("packet: the stored assessment is carried with its old stamp", `${p1?.assessment?.id}/${p1?.assessment?.stamp?.commit === commit}`, "FEAT-001/true");
  out("packet: differences keys", keys(p1?.differences), "added,changed,purpose,removed,status");
  out("packet: the changed row is named", (p1?.differences?.changed ?? []).includes("R-001"), "true");
  out("packet: an unassessed feature has a null assessment", p2 ? p2.assessment === null : "no packet", "true");
  out("packet: an unassessed feature carries own and shared rows", (p2?.rows ?? []).map((x) => `${x.id}:${x.mark}`).sort().join(","), "R-001:shared,R-003:own");
  out("packet: an unassessed feature has empty differences", JSON.stringify(p2?.differences), JSON.stringify({ added: [], removed: [], changed: [], purpose: null, status: null }));
  const head = git(r, "rev-parse", "HEAD");
  out("packet: the ready stamp is at HEAD", `${p1?.stamp?.commit === head}/${p2?.stamp?.commit === head}`, "true/true");
  // Round trip: a model's candidates (the packet's prose fields + packet.stamp) validate clean.
  const prose = { what_it_does: "It keeps quokkas in order.", maturity: "partial", maturity_reason: "Some rows are not tested yet.", gaps: ["A gap."], risks: ["A risk."], decisions: ["A decision."], next_step: "Test the rest.", written_by: "seat", checked_by: "seat", date: "2026-10-11" };
  const candidates = { version: 1, features: [{ id: "FEAT-001", ...prose, stamp: p1?.stamp }, { id: "FEAT-002", ...prose, stamp: p2?.stamp }] };
  writeFileSync(join(r, "docs/product-report/assessments.json"), `${JSON.stringify(candidates, null, 2)}\n`);
  out("packet round trip: candidates stamped from packets validate", problems(r).join(" | ") || "none", "none");
  git(r, "checkout", "--", "docs/product-report/assessments.json");
  const dir2 = join(ROOT, `packets-${++n}`);
  mkdirSync(dir2);
  const b = packets(r, dir2);
  out("packets: runs on an empty directory", b.code, 0);
  out("packets: byte-identical across runs at one commit", a.files.length > 0 && a.files.every((f) => b.files.includes(f) && a.read(f) === b.read(f)), "true");
  const before = a.files.map((f) => a.read(f)).join("\u0000");
  const c = packets(r, dir);
  out("packets: a non-empty directory is refused", c.code !== 0, "true");
  out("packets: a refused run leaves the directory as it was", c.files.join(",") === a.files.join(",") && c.files.map((f) => c.read(f)).join("\u0000") === before, "true");
}
{
  const { r } = storeRepo((c) => ({ version: 1, features: [assessment(c)] }));
  const dir = join(ROOT, `packets-${++n}`);
  const a = packets(r, dir);
  out("packets: a current feature gets no packet", a.files.join(","), "FEAT-002.json");
}

// ── Round 6: the rendered page (R-1014–R-1019) ──
// The renderer is `renderInto(document, model, { hash })` exported by scripts/product-report.mjs; the
// page inlines the SAME source. It renders the view the hash names ("" → decisions; "#decisions",
// "#product", "#features", "#shared", "#issues", "#requirements"; "#FEAT-xxx" → that feature's
// detail; anything else → decisions) into document.getElementById("report"), using only:
// document.createElement/createTextNode/getElementById, node.appendChild/append/replaceChildren/
// setAttribute/addEventListener, and plain property assignment (textContent, value, checked, hidden).
const SINKS = ["innerHTML", "outerHTML", "srcdoc"];
function stubDocument() {
  const violations = [];
  const make = (kind, tag, text) => {
    const node = { kind, tag, children: [], attrs: {}, listeners: [], _text: text ?? "" };
    node.appendChild = (c) => { node.children.push(typeof c === "string" ? make("text", null, c) : c); return c; };
    node.append = (...cs) => { for (const c of cs.flat(Infinity)) if (c !== null && c !== undefined && c !== false) node.appendChild(typeof c === "object" ? c : String(c)); };
    node.replaceChildren = (...cs) => { node.children = []; node.append(...cs); };
    node.setAttribute = (k, v) => { node.attrs[k] = String(v); };
    node.getAttribute = (k) => node.attrs[k] ?? null;
    node.removeAttribute = (k) => { delete node.attrs[k]; };
    node.addEventListener = (type, fn) => { node.listeners.push({ type, fn }); };
    Object.defineProperty(node, "textContent", { get: () => text_(node), set: (v) => { node.children = [make("text", null, String(v))]; } });
    for (const sink of SINKS) Object.defineProperty(node, sink, { get: () => "", set: () => violations.push(sink) });
    Object.defineProperty(node, "insertAdjacentHTML", { value: () => violations.push("insertAdjacentHTML") });
    return node;
  };
  const text_ = (node) => node.kind === "text" ? node._text : node.children.map(text_).join("");
  const root = make("el", "main");
  const document = {
    createElement: (tag) => make("el", String(tag).toLowerCase()),
    createTextNode: (t) => make("text", null, String(t)),
    getElementById: (id) => (id === "report" ? root : null),
    write: () => violations.push("document.write"),
  };
  return { document, root, violations, text: () => text_(root) };
}
const walk = (node, fn) => { fn(node); for (const c of node.children ?? []) walk(c, fn); };
async function render(r, hash) {
  const model = (await mod.buildReport({ root: r })).model;
  const stub = stubDocument();
  let error = null;
  try { mod.renderInto(stub.document, model, { hash }); } catch (e) { error = e.message; }
  const longest = (() => { let m = 0; walk(stub.root, (n) => { if (n.kind === "text") m = Math.max(m, n._text.length); }); return m; })();
  const tags = (tag) => { const out = []; walk(stub.root, (n) => { if (n.tag === tag) out.push(n); }); return out.map((n) => { let t = ""; walk(n, (x) => { if (x.kind === "text") t += x._text; }); return t; }); };
  return { error, text: stub.text(), violations: stub.violations, longest, tags, model };
}
{
  const spanLedger = LEDGER.replace("| R-003 | The tool shall wombat three. | planned | — |", "| R-003 | The tool shall wombat `three-code` and **three-bold**. | planned | — |");
  const { r } = (() => { const r = repo({ "REQUIREMENTS.md": spanLedger, "HANDOFF.md": HANDOFF }); const commit = git(r, "rev-parse", "HEAD"); mkdirSync(join(r, "docs/product-report"), { recursive: true }); writeFileSync(join(r, "docs/product-report/assessments.json"), `${JSON.stringify({ version: 1, features: [assessment(commit)] }, null, 2)}\n`); git(r, "add", "."); git(r, "commit", "-qm", "store"); return { r }; })();
  const views = {};
  for (const hash of ["", "#decisions", "#product", "#features", "#shared", "#issues", "#requirements", "#FEAT-001", "#FEAT-002", "#constructor", "#__proto__", "#nonsense"]) views[hash] = await render(r, hash);
  out("render: every view renders without throwing", Object.entries(views).filter(([, v]) => v.error).map(([h, v]) => `${h || "(none)"}: ${v.error}`).join(" | ") || "none", "none");
  out("render: no HTML sink is ever used", [...new Set(Object.values(views).flatMap((v) => v.violations))].join(",") || "none", "none");
  out("render: no view is a raw JSON dump (longest text node under 600 characters)", Object.entries(views).filter(([, v]) => v.longest >= 600).map(([h, v]) => `${h}:${v.longest}`).join(",") || "none", "none");
  out("render: no view shows the model's JSON keys", Object.entries(views).filter(([, v]) => /"assessmentState"|"features":|"capabilities":/.test(v.text)).map(([h]) => h || "(none)").join(",") || "none", "none");
  const d = views[""].text;
  for (const [label, token] of [["an ask's kind", "optional"], ["an ask's since-date", "2026-10-10"], ["an ask's title", "Narwhal title"], ["an ask's full body", "Narwhalbody words that hold the decision"], ["a second ask", "Ocelot title"]]) out(`render default (decisions) shows ${label}`, d.includes(token), "true");
  const p = views["#product"].text;
  for (const [label, token] of [["capability purpose", "Zebracap purpose words"], ["capability outcome", "Zebracap outcome words"], ["its features", "Quokka feature"], ["its second feature", "Wombat feature"]]) out(`render #product shows ${label}`, p.includes(token), "true");
  const f1 = views["#FEAT-001"].text;
  for (const [label, token] of [["feature purpose", "Quokkafeat purpose words"], ["feature status", "active"], ["a row's text", "The tool shall quokka one."], ["a four-digit row", "R-1000"], ["a row's evidence", "Violatedrow evidence words"], ["the assessment prose", "It keeps quokkas in order."], ["the assessment's rating", "partial"], ["the assessment state", "current"]]) out(`render #FEAT-001 shows ${label}`, f1.includes(token), "true");
  const f2 = views["#FEAT-002"].text;
  out("render #FEAT-002 shows its own row", f2.includes("R-003"), "true");
  out("render #FEAT-002 shows the shared-in row", f2.includes("R-001"), "true");
  out("render #FEAT-002 says it is unassessed", /unassessed/i.test(f2), "true");
  out("render: backtick span becomes a code element", views["#FEAT-002"].tags("code").includes("three-code"), "true");
  out("render: bold span becomes a b element", views["#FEAT-002"].tags("b").includes("three-bold"), "true");
  out("render: no literal backticks or asterisks around spans", /`three-code`|\*\*three-bold\*\*/.test(f2), "false");
  out("render #issues lists the violated row", views["#issues"].text.includes("R-002") && views["#issues"].text.includes("The tool shall quokka two."), "true");
  const q = views["#requirements"].text;
  out("render #requirements lists every row", ["R-001", "R-002", "R-1000", "R-003"].every((id) => q.includes(id)), "true");
  out("render #shared names the share", views["#shared"].text.includes("R-001") && views["#shared"].text.includes("FEAT-002"), "true");
  for (const h of ["#constructor", "#__proto__", "#nonsense"]) out(`render ${h} falls back to the decisions view`, views[h].text === views[""].text, "true");
  const page = report(r).page ?? "";
  out("the page inlines the tested renderer's source", page.includes(String(mod.renderInto)), "true");
  out("render: views differ (the decisions view does not carry every row's text)", !views[""].text.includes("The tool shall quokka four digits.") && views["#product"].text !== views["#requirements"].text, "true");
  // Round 7: the page a reader meets — assessment first, human labels, linked features.
  const f1Text = views["#FEAT-001"].text;
  const at = (t) => f1Text.indexOf(t);
  out("render #FEAT-001: the assessment comes before the requirement rows", at("It keeps quokkas in order.") >= 0 && at("It keeps quokkas in order.") < at("The tool shall quokka one."), "true");
  out("render: no raw store field names in any view", Object.entries(views).filter(([, v]) => /what_it_does|maturity_reason|next_step|written_by|checked_by/.test(v.text)).map(([h]) => h || "(none)").join(",") || "none", "none");
  {
    const links = []; const st = stubDocument(); mod.renderInto(st.document, views["#features"].model, { hash: "#features" });
    walk(st.root, (n) => { if (n.tag === "a" && /^#FEAT-\d{3}$/.test(n.attrs.href ?? "")) links.push(n.attrs.href); });
    out("render #features: each feature links to its detail", ["#FEAT-001", "#FEAT-002"].every((h) => links.includes(h)), "true");
  }
  // Round 8: one title per detail view; list fields as list items; no joined ".;" text.
  {
    const st = stubDocument(); mod.renderInto(st.document, views["#FEAT-001"].model, { hash: "#FEAT-001" });
    const heads = []; const items = [];
    walk(st.root, (n) => { if (/^h[1-6]$/.test(n.tag ?? "")) { let t = ""; walk(n, (x) => { if (x.kind === "text") t += x._text; }); heads.push(t); } if (n.tag === "li") { let t = ""; walk(n, (x) => { if (x.kind === "text") t += x._text; }); items.push(t); } });
    out("render #FEAT-001: the feature title appears once", heads.filter((h) => h.includes("FEAT-001") && h.includes("Quokka feature")).length, 1);
    out("render #FEAT-001: gaps, risks and decisions are list items", ["A gap.", "A risk.", "A decision."].every((t) => items.includes(t)), "true");
    out("render: no list joined into prose (no \".;\")", Object.entries(views).filter(([, v]) => v.text.includes(".;")).map(([h]) => h || "(none)").join(",") || "none", "none");
  }
  // Final reviews r1: the feature filter must show a feature's own AND shared-in rows; Issues pills.
  {
    const st = stubDocument(); mod.renderInto(st.document, views["#requirements"].model, { hash: "#requirements" });
    let select = null; walk(st.root, (n) => { if (n.tag === "select" && /feature/i.test(n.attrs["aria-label"] ?? "")) select = n; });
    let shown = "";
    if (select) {
      select.value = "FEAT-002";
      for (const l of select.listeners) if (l.type === "change" || l.type === "input") l.fn({ target: select });
      shown = st.text();
    }
    out("render #requirements: filtering FEAT-002 shows its shared-in row R-001 and its own R-003", Boolean(select) && shown.includes("The tool shall quokka one.") && /R-003/.test(shown), "true");
    out("render #requirements: filtering FEAT-002 hides FEAT-001's own unshared row", Boolean(select) && !shown.includes("The tool shall quokka two."), "true");
  }
  out("render #issues: each violated row shows its status, never undefined", views["#issues"].text.includes("violated") && !/undefined/.test(views["#issues"].text), "true");
  const ff = views["#features"].text;
  out("render #features lists every feature with its state", ff.includes("FEAT-001") && ff.includes("FEAT-002") && /unassessed/i.test(ff), "true");
}
{
  // Stale state and its named differences reach the page.
  const { r } = storeRepo((c) => ({ version: 1, features: [assessment(c)] }));
  edit(r, "The tool shall quokka one.", "The tool shall quokka one, carefully."); git(r, "add", "."); git(r, "commit", "-qm", "change");
  const v = await render(r, "#FEAT-001");
  out("render: a stale feature says out of date and names the changed row", /out of date/i.test(v.text) && v.text.includes("R-001"), "true");
}
{
  // Packets refuse a ledger that differs from HEAD (rows and stamp must describe one ledger).
  const { r } = storeRepo((c) => ({ version: 1, features: [assessment(c)] }));
  edit(r, "The tool shall quokka one.", "The tool shall quokka one, uncommitted.");
  const dir = join(ROOT, `packets-${++n}`);
  const a = packets(r, dir);
  out("packets: refused while REQUIREMENTS.md differs from HEAD", `${a.code !== 0}/${a.files.length}`, "true/0");
}

console.log(`seat-verify-report: ${mismatches} mismatch(es)`);
rmSync(ROOT, { recursive: true, force: true });
process.exitCode = mismatches ? 1 : 0;
