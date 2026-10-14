// Seat acceptance for lane tree (frozen; written by the seat 2026-10-14 before the build, from CHANGE.md §5 "Seat
// acceptance", the observable clauses of §2's rows R-1150 to R-1161, §3's design, §3.5 and §4's scope, plan frozen at
// afb4c01). Run from anywhere inside the checkout under test; the build is read from the cwd's git root, the spec
// (CHANGE.md, seat-titles.mjs) from this script's own folder:
//   node docs/reviews/tree-2026-10-14/acceptance.mjs
// (a) seat-titles 1 prints `seat-titles 1: 0 missing`.
// (b) copier renders all four modes at the lane tip (`--vcs-ref HEAD`, the form templates-render.test.mjs uses) and at
//     the merge base. On each tip render: `requirements-tree.mjs --root <render>` exits 0 printing 0 problems and
//     the render's own row and feature counts, and so does a CRLF copy; a UTF-16LE copy is refused naming the NUL byte
//     and UTF-16 and never prints `0 problems` (R-1150, R-1157, R-1158, R-1160). Every G row sits in FEAT-900 under
//     CAP-90, in SUB-900 to SUB-904 as G1 to G5 held them at the base, byte-identical, with no R row there (R-1151);
//     adopt carries a proposed product feature with no row (R-1152); the seed's four phrases (R-1153); §3.1's shape.
// (c) the Python scaffold render, committed to a new repo, gives `product-report.mjs --root <render> --out <outside>`
//     exit 0 and a page.
// (d) checker and report on temp ledgers: --root on a tree and a broken tree (R-1157); CRLF (R-1158); 1,000 flat rows
//     and one real flat project ledger on this Mac, copied first (R-1159); UTF-16 and no rows through --root, through
//     nana-pi's own --check/--write in a temp mirror of scripts/, and through the report (R-1160); near-miss
//     headings (R-1161).
// (e) rows R-1150 to R-1161 carry §2's text with one `shall`, sit where §2 says, cite their §5 titles (read from
//     seat-titles.mjs, the one title list) and read implemented; R-291 cites its renamed title; no base row changes text
//     or status; the row set is the base's plus these twelve; the tree headings are the base's; R-1162 to R-1169 are
//     unused; the trace rail is green.
// (f) `git diff --name-only <base>..HEAD` ⊆ §4 In plus this review folder; §3.5's files are untouched;
//     product-report.mjs changes only buildReport's one ledgerReadProblem call; both main guards stay; README and
//     map/readme/tree checks; the seat's HANDOFF and session items; the build is committed.
// (s) the requirements skill and the five scaffold and adopt skills carry §3.4's phrases (R-1154 to R-1156).
// (g) the three test files exit 0 and print PASS once for every §5 title.
// <base> is `git merge-base main HEAD` (484329c when written), so a merge of a newer main moves it with the lane.
// Cases marked (guard) hold at the base too and catch a regression; (harness) cases check this script's inputs; every
// other case depends on the build and reads red at the base. Every render, copy and fixture lives in one scratch
// folder under the OS temp dir, removed at the end; nothing is written inside the checkout (the last case checks git
// status) or inside the real project whose ledger is read. No suite test may import or run this file.
// Before the land only: after it, `git merge-base main HEAD` is the tip itself and every build case reads red.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LANE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SEAT_TITLES = path.join(LANE_DIR, "seat-titles.mjs");
const { required, repoRoot, checkTitles, treeTitles, LANE_ROWS_ADDED, TR, RT, PR } = await import(pathToFileURL(SEAT_TITLES).href);
const root = repoRoot();
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md")) || !fs.existsSync(path.join(root, "scripts/requirements-tree.mjs"))) {
	console.error("run inside a nana-pi checkout: node <lane>/docs/reviews/tree-2026-10-14/acceptance.mjs");
	process.exit(2);
}
let bad = 0, n = 0, badBuild = 0, nBuild = 0;
const out = (title, got, want, detail = "") => {
	n++;
	const ok = JSON.stringify(got) === JSON.stringify(want);
	const isBuild = !/^\((harness|guard)\)/.test(title);
	if (isBuild) nBuild++;
	if (!ok) { bad++; if (isBuild) badBuild++; }
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got).slice(0, 300)} (want ${JSON.stringify(want).slice(0, 300)})${detail ? ` [${String(detail).replace(/\s+/g, " ").slice(0, 400)}]` : ""}`}`);
	return ok;
};
const text = (rel) => { try { return fs.readFileSync(path.join(root, rel), "utf8"); } catch { return null; } };
const spec = (name) => fs.readFileSync(path.join(LANE_DIR, name), "utf8");
const lines = (s) => (s ?? "").replace(/\r/g, "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));
const collapse = (s) => (s ?? "").replace(/\s+/g, " ");
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^GIT_/.test(k)) delete env[k]; return env; };
const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
const gitIn = (cwd, ...args) => spawnSync("git", ["-c", "user.name=seat", "-c", "user.email=seat@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8", env: cleanEnv() });
const statusOf = () => git("status", "--porcelain=v1", "-uall").stdout;
const statusBefore = statusOf();
const base = git("merge-base", "main", "HEAD").stdout.trim();
const atBase = (rel) => { const r = git("show", `${base}:${rel}`); return r.status === 0 ? r.stdout : null; };
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const TREE = path.join(root, "scripts/requirements-tree.mjs");
const REPORT = path.join(root, "scripts/product-report.mjs");
const PR_SCRIPT = "scripts/product-report.mjs";
const RT_SCRIPT = "scripts/requirements-tree.mjs";
const CHECKER_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .';
const REPORT_SKILL_CMD = 'node "$HOME/nana-pi/scripts/product-report.mjs" --root .';
const ROW = /^\|\s*([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|/;
const TREE_HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;
// Node's own warning block (MODULE_TYPELESS_PACKAGE_JSON on the report's .ts import); T11 reads stderr "less Node's
// own (node: warning lines", and so does every one-line count below.
const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const node = (args, cwd = root, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 300_000, env: cleanEnv(), ...extra });
const tree = (dir, cwd) => node([TREE, "--root", dir], cwd);

/** An independent read of a ledger: tree headings (outside fences), each row's home, feature statuses and purposes. */
function readTree(src) {
	const ls = (src ?? "").replace(/^\ufeff/, "").replace(/\r/g, "").split("\n");
	const headings = [], rows = [], ordinary = [];
	let fence = null, cap = null, feat = null, sub = null, last = null;
	ls.forEach((l, i) => {
		const f = /^ {0,3}(`{3,}|~{3,})/.exec(l);
		if (fence) { if (f && f[1][0] === fence[0] && f[1].length >= fence.length && /^ {0,3}(`{3,}|~{3,})[ \t]*$/.test(l)) fence = null; return; }
		if (f) { fence = f[1]; return; }
		const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/.exec(l);
		if (atx) {
			const t = TREE_HEADING.exec(l);
			const level = atx[1].length;
			if (t) {
				const h = { line: i + 1, level, id: t[2], label: t[3], cap: null, feat: null, purpose: null, outcome: null, status: null, rows: [] };
				if (level === 1) { cap = h; feat = null; sub = null; }
				else if (level === 2) { feat = h; sub = null; h.cap = cap?.id ?? null; }
				else { sub = h; h.cap = cap?.id ?? null; h.feat = feat?.id ?? null; }
				headings.push(h); last = h;
			} else {
				ordinary.push({ line: i + 1, level, text: (atx[2] ?? "").trim() });
				if (level <= 1) cap = null;
				if (level <= 2) feat = null;
				if (level <= 3) sub = null;
				last = null;
			}
			return;
		}
		if (last && /^Purpose:/.test(l) && last.purpose === null) last.purpose = l.slice(8).trim();
		if (last && /^Outcome:/.test(l) && last.outcome === null) last.outcome = l.slice(8).trim();
		if (last && /^Status:/.test(l) && last.status === null) last.status = l.slice(7).trim();
		const r = ROW.exec(l);
		if (r) {
			rows.push({ id: r[1], line: i + 1, text: l, cap: cap?.id ?? null, feat: feat?.id ?? null, sub: sub?.id ?? null });
			(sub ?? feat)?.rows.push(r[1]);
			if (sub && feat) feat.rows.push(r[1]);
		}
	});
	return { lines: ls, headings, rows, ordinary };
}

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "tree-accept-")));
try {
	out("(harness) git merge-base main HEAD resolves", /^[0-9a-f]{40}$/.test(base), true, base);
	out("(harness) the scratch folder is outside the checkout", path.relative(fs.realpathSync(root), scratch).startsWith(".."), true, scratch);
	const copierVersion = spawnSync("uvx", ["copier", "--version"], { cwd: root, encoding: "utf8" });
	out("(harness) uvx copier is available", copierVersion.status, 0, copierVersion.stderr);

	// ---------------------------------------------------------------- (a) the title check
	const titles = node([SEAT_TITLES, "1"]);
	const titleLines = lines(titles.stdout);
	out("(a) seat-titles 1 prints `seat-titles 1: 0 missing` and exits 0", [titleLines.at(-1) ?? null, titles.status], ["seat-titles 1: 0 missing", 0],
		titleLines.filter((l) => !/^(ok|gone) /.test(l)).join(" | ") + titles.stderr);

	// ---------------------------------------------------------------- (b) renders at the tip and at the base
	// Answers mirror templates-render.test.mjs LANGS; the command mirrors its render(): copier copy --trust --vcs-ref
	// <ref> --defaults -d language=… -d <answer>… <repo> <dest>, run in the repo.
	const ANSWERS = {
		typescript: { project_name: "Tpl TS", description: "A rendered TypeScript project." },
		python: { project_name: "Tpl PY", description: "A rendered Python project.", package_name: "tpl_py" },
	};
	const render = (language, mode, ref, label) => {
		const dest = path.join(scratch, `${label}-${language}-${mode}`);
		const args = ["copier", "copy", "--trust", "--vcs-ref", ref, "--defaults", "-d", `language=${language}`];
		for (const [k, v] of Object.entries({ ...ANSWERS[language], adopt: mode === "adopt" ? "true" : "false" })) args.push("-d", `${k}=${v}`);
		args.push(root, dest);
		const r = spawnSync("uvx", args, { cwd: root, encoding: "utf8", timeout: 300_000, env: cleanEnv() });
		return { dest, ok: r.status === 0 && fs.existsSync(path.join(dest, "REQUIREMENTS.md")), log: `${r.stdout}${r.stderr}` };
	};
	const fileList = (dir) => { const acc = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else acc.push(`${path.relative(dir, p)} ${sha(fs.readFileSync(p)).slice(0, 12)}`); } }; walk(dir); return acc.sort(); };
	const copyLedger = (label, content) => { const d = path.join(scratch, label); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, "REQUIREMENTS.md"), content); return d; };
	const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, "utf16le")]);
	const crlf = (s) => s.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
	const SUBS = ["SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"];
	const tipRenders = {};
	for (const language of ["typescript", "python"]) for (const mode of ["scaffold", "adopt"]) {
		const tag = `${language} ${mode}`;
		const tip = render(language, mode, "HEAD", "tip");
		const was = render(language, mode, base, "base");
		out(`(harness) ${tag}: copier renders at the tip and at the base`, [tip.ok, was.ok], [true, true], (tip.ok ? "" : tip.log.slice(-300)) + (was.ok ? "" : was.log.slice(-300)));
		if (!tip.ok) continue;
		tipRenders[tag] = tip.dest;
		const req = fs.readFileSync(path.join(tip.dest, "REQUIREMENTS.md"), "utf8");
		const baseReq = was.ok ? fs.readFileSync(path.join(was.dest, "REQUIREMENTS.md"), "utf8") : "";
		const t = readTree(req);
		const feats = t.headings.filter((h) => h.id.startsWith("FEAT-"));

		// R-1150 / R-1157: the checker passes the render, prints its own counts and adds no file to it.
		const before = fileList(tip.dest);
		const r = tree(tip.dest, scratch);
		const want = `requirements tree: 0 problems; rows ${t.rows.length}; features ${feats.length}`;
		out(`(b) ${tag}: --root <render> exits 0, prints \`${want}\` only, and adds or changes no file in the render (R-1150, R-1157)`,
			[r.status, lines(r.stdout), own(r.stderr), JSON.stringify(fileList(tip.dest)) === JSON.stringify(before)], [0, [want], [], true], r.stderr);
		out(`(b) ${tag}: the render has a capability besides CAP-90 and a feature besides FEAT-900 (R-1150)`,
			[t.headings.some((h) => h.level === 1 && h.id !== "CAP-90"), feats.some((h) => h.id !== "FEAT-900")], [true, true], t.headings.map((h) => h.id).join(","));
		// R-1158: the CRLF copy reads the same.
		const rc = tree(copyLedger(`crlf-${language}-${mode}`, crlf(req)), scratch);
		out(`(b) ${tag}: a CRLF copy exits 0 with the same output (R-1158)`, [rc.status, lines(rc.stdout), own(rc.stderr)], [0, [want], []], rc.stderr);
		// R-1160: the UTF-16LE copy is refused, naming why.
		const ru = tree(copyLedger(`utf16-${language}-${mode}`, utf16(req)), scratch);
		const uErr = own(ru.stderr).join("\n");
		out(`(b) ${tag}: a UTF-16LE copy exits 1 naming the NUL byte, UTF-16 and UTF-8, never \`0 problems\` (R-1160)`,
			[ru.status, /NUL/.test(uErr), /UTF-16/.test(uErr), /UTF-8/.test(uErr), /\b0 problems\b/.test(ru.stdout + ru.stderr)], [1, true, true, true, false], ru.stdout + ru.stderr);

		// R-1151: the G rows' homes, matching G1–G5 at the base, rows byte-identical.
		const gRows = t.rows.filter((x) => x.id.startsWith("G-"));
		const wantG = Array.from({ length: 22 }, (_, i) => `G-${String(i + 1).padStart(3, "0")}`);
		out(`(guard) ${tag}: all 22 G rows are present once`, [...gRows.map((x) => x.id)].sort(), wantG);
		out(`(b) ${tag}: every G row sits in FEAT-900 under CAP-90, in SUB-900 to SUB-904, and no R row sits in CAP-90 (R-1151)`,
			[gRows.filter((x) => x.cap !== "CAP-90" || x.feat !== "FEAT-900" || !SUBS.includes(x.sub)).map((x) => `${x.id}@${x.cap}/${x.feat}/${x.sub}`), t.rows.filter((x) => x.id.startsWith("R-") && (x.feat === "FEAT-900" || x.cap === "CAP-90")).map((x) => x.id), gRows.length > 0],
			[[], [], true]);
		const baseSections = new Map(); // G row → its base G section number, and each section's label
		const baseLabels = [];
		{ let sec = null; for (const l of baseReq.split("\n")) { const h = /^## G(\d)\. (.+)$/.exec(l); if (h) { sec = Number(h[1]); baseLabels[sec - 1] = h[2]; continue; } const m = ROW.exec(l); if (m && m[1].startsWith("G-")) baseSections.set(m[1], sec); } }
		out(`(harness) ${tag}: the base render holds 22 G rows in sections G1 to G5`, [baseSections.size, baseLabels.filter(Boolean).length], [22, 5]);
		out(`(b) ${tag}: each G row sits in the SUB-90n that matches its base section G(n+1)`, gRows.filter((x) => x.sub !== `SUB-90${(baseSections.get(x.id) ?? 99) - 1}`).map((x) => `${x.id}@${x.sub}`), []);
		const subHeads = t.headings.filter((h) => h.level === 3 && SUBS.includes(h.id));
		out(`(b) ${tag}: SUB-900 to SUB-904 are under FEAT-900, keep G1–G5's labels and each has a Purpose: line`,
			subHeads.map((h) => [h.id, h.feat, h.label, Boolean(h.purpose)]), SUBS.map((id, i) => [id, "FEAT-900", baseLabels[i] ?? "?", true]));
		const cap90 = t.headings.filter((h) => h.cap === "CAP-90" && h.level === 2);
		const capHead = t.headings.find((h) => h.id === "CAP-90"), featHead = t.headings.find((h) => h.id === "FEAT-900");
		out(`(b) ${tag}: CAP-90 holds one feature, FEAT-900; both have Purpose:, CAP-90 an Outcome:, FEAT-900 Status: active (S2)`,
			[cap90.map((h) => h.id), Boolean(capHead?.purpose), Boolean(capHead?.outcome), Boolean(featHead?.purpose), featHead?.status ?? null], [["FEAT-900"], true, true, true, "active"]);
		out(`(guard) ${tag}: the G row lines are byte-identical to the base render's, in order`,
			JSON.stringify(gRows.map((x) => x.text)) === JSON.stringify(baseReq.split("\n").filter((l) => /^\|\s*G-/.test(l))), true);

		// R-1152 and the product feature.
		const product = feats.filter((h) => h.id !== "FEAT-900");
		if (mode === "adopt") {
			out(`(b) ${tag}: a product feature reads Status: proposed and holds no row; no R row anywhere (R-1152)`,
				[product.some((h) => h.status === "proposed" && h.rows.length === 0), t.rows.filter((x) => x.id.startsWith("R-")).length], [true, 0], product.map((h) => `${h.id}:${h.status}:${h.rows.length}`).join(","));
		} else {
			const home = product.find((h) => h.rows.includes("R-001"));
			out(`(b) ${tag}: R-001 sits in a product feature under a product capability that reads Status: active (§3.1)`, [home?.status ?? null, Boolean(home?.cap) && home.cap !== "CAP-90"], ["active", true]);
		}
		const productCaps = t.headings.filter((h) => h.level === 1 && h.id !== "CAP-90");
		out(`(b) ${tag}: a product capability and feature exist and their purposes start "DRAFT —" (S10)`,
			[productCaps.length > 0 && product.length > 0, [...productCaps, ...product].filter((h) => !(h.purpose ?? "").startsWith("DRAFT —")).map((h) => `${h.id}: ${h.purpose}`)], [true, []]);

		// R-1153: the seed says how rows are grouped, where a new row goes, who decides and how to check.
		const flat = collapse(req);
		out(`(b) ${tag}: REQUIREMENTS.md carries R-1153's four phrases`,
			["capability → feature → subgroup", "Add each new row to the table of the feature it serves", "The project owner decides every change to the tree", CHECKER_SKILL_CMD].filter((p) => !flat.includes(p)), []);
		out(`(b) ${tag}: REQUIREMENTS.md names no Jake, no ~/nana-pi/ and no Part G (S9, §3.1)`, ["Jake", "~/nana-pi/", "Part G"].filter((p) => flat.includes(p)), []);

		// §3.1's shape.
		const firstCap = t.headings.find((h) => h.level === 1);
		const organized = t.ordinary.find((h) => h.level === 2 && h.text === "How this file is organized");
		out(`(b) ${tag}: an ordinary \`## How this file is organized\` comes before the first capability (§3.1)`, Boolean(organized && firstCap && organized.line < firstCap.line), true);
		const closing = t.ordinary.find((h) => h.level === 1 && h.text === "Open questions and deliberate omissions");
		const lastRowLine = Math.max(0, ...t.rows.map((x) => x.line)), lastTreeLine = Math.max(0, ...t.headings.map((h) => h.line));
		const after = (txt) => t.ordinary.find((h) => h.level === 2 && h.text === txt && closing && h.line > closing.line);
		out(`(b) ${tag}: \`# Open questions and deliberate omissions\` closes the file after every row and tree heading, holding both sections (§3.1)`,
			[Boolean(closing), Boolean(closing && closing.line > lastRowLine && closing.line > lastTreeLine), Boolean(after("Open questions")), Boolean(after("Deliberate omissions"))], [true, true, true, true]);
		out(`(b) ${tag}: CAP-90 is the last capability (S2)`, t.headings.filter((h) => h.level === 1).at(-1)?.id ?? null, "CAP-90");
		out(`(guard) ${tag}: no \`Also applies:\` line and no outline in the render (§3.5)`, [/^Also applies:/m.test(req), fs.existsSync(path.join(tip.dest, "docs/requirements-tree.md"))], [false, false]);
		const appended = tree(copyLedger(`appended-${language}-${mode}`, `${req.replace(/\n*$/, "\n")}\n## FEAT-899 · Appended late\nPurpose: a feature appended after the closing heading.\nStatus: active\n`), scratch);
		out(`(b) ${tag}: a feature appended after the closing heading fails nesting (§3.1, R-290)`, [appended.status, own(appended.stderr).some((l) => l.includes("FEAT-899") && l.includes("nested under"))], [1, true], appended.stderr);
		const general = (() => { try { return fs.readFileSync(path.join(tip.dest, "REQUIREMENTS-general.md"), "utf8"); } catch { return ""; } })();
		const gt = readTree(general);
		out(`(b) ${tag}: REQUIREMENTS-general.md carries the same CAP-90, FEAT-900 and SUB-900 to SUB-904 headings and G rows (§3.1)`,
			[gt.headings.map((h) => h.id), gt.headings.map((h) => `${h.id} · ${h.label}`), gt.rows.map((x) => x.text)],
			[["CAP-90", "FEAT-900", ...SUBS], t.headings.filter((h) => h.id === "CAP-90" || h.cap === "CAP-90").map((h) => `${h.id} · ${h.label}`), gRows.map((x) => x.text)]);
	}

	// ---------------------------------------------------------------- (c) the report on the committed Python scaffold
	const py = tipRenders["python scaffold"];
	if (py) {
		const init = [gitIn(py, "init", "-q"), gitIn(py, "add", "-A"), gitIn(py, "commit", "-qm", "scaffold")];
		out("(harness) the Python scaffold render commits to a new repo", init.map((r) => r.status), [0, 0, 0], init.map((r) => r.stderr).join(" "));
		const page = path.join(scratch, "report-out", "python-scaffold.html");
		const rep = node([REPORT, "--root", py, "--out", page], scratch);
		const html = (() => { try { return fs.readFileSync(page, "utf8"); } catch { return ""; } })();
		out("(c) product-report.mjs --root <python scaffold> --out <outside it> exits 0 and writes a page holding CAP-01, FEAT-001 and FEAT-900",
			[rep.status, ["CAP-01", "FEAT-001", "FEAT-900"].every((id) => html.includes(id))], [0, true], own(rep.stderr).join(" | "));
		out("(guard) the report leaves the render's working tree clean", gitIn(py, "status", "--porcelain").stdout, "");
	} else out("(c) product-report.mjs --root <python scaffold> --out <outside it> exits 0", "no python scaffold render", "a render");

	// ---------------------------------------------------------------- (d) checker and report on temp ledgers
	const TREE1 = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n";
	const OUTSIDE = `${TREE1}\n| R-002 | Another thing shall work. | untested | — |\n`;
	const NOROWS = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n";
	const TWO = `${TREE1}\n## FEAT-002 · Second\nStatus: active\n\n| R-002 | Another thing shall work. | untested | — |\n`;
	const NEAR = "# CAP-01 - Cap\nPurpose: capability\n\n## FEAT-001 - Feature\nPurpose: feature\nStatus: active\n\n### SUB-001 - Sub\nPurpose: subgroup\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n| R-002 | The other thing shall work. | untested | — |\n";
	const flatLedger = (count) => {
		let s = "# A flat ledger\n\n## 1. Things\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";
		for (let i = 1; i <= count; i++) s += `| R-${String(i).padStart(3, "0")} | The thing numbered ${i} shall work. | untested | — |\n`;
		return s;
	};
	const FLAT = flatLedger(1000);

	// R-1157
	const t1 = copyLedger("t1", TREE1);
	fs.mkdirSync(path.join(t1, "docs"));
	fs.writeFileSync(path.join(t1, "docs/requirements-tree.md"), "not an outline\n");
	const decoy = copyLedger("decoy-cwd", OUTSIDE); // the run's cwd holds a broken ledger: --root must read <dir>, not the cwd
	const t1Before = fileList(t1);
	const r1 = tree(t1, decoy);
	out("(d) --root <tree ledger>, run from a folder holding a broken ledger, exits 0 printing `requirements tree: 0 problems; rows 1; features 1`; a junk docs/requirements-tree.md is neither read nor written and no file appears (R-1157)",
		[r1.status, lines(r1.stdout), own(r1.stderr), JSON.stringify(fileList(t1)) === JSON.stringify(t1Before)], [0, ["requirements tree: 0 problems; rows 1; features 1"], [], true], r1.stderr);
	// The skill's documented form is `--root .` run inside the project (R-1156): `.` must resolve against the cwd, never nana-pi.
	const rel = node([TREE, "--root", "."], t1);
	out("(d) --root . run inside the project checks that project's ledger, not nana-pi's (R-1156 form, R-1157)",
		[rel.status, lines(rel.stdout)], [0, ["requirements tree: 0 problems; rows 1; features 1"]], rel.stderr);
	const relBad = node([TREE, "--root", "."], decoy);
	out("(d) --root . run inside a project with a row outside its feature exits 1 naming it (R-1157)",
		[relBad.status, own(relBad.stderr).some((l) => /R-002 is not in a feature or subgroup table/.test(l))], [1, true], relBad.stdout + relBad.stderr);
	const r2 = tree(copyLedger("outside", OUTSIDE), scratch);
	out("(d) --root <ledger with a row outside its feature> exits 1 and names it on stderr, no `0 problems` (R-1157)",
		[r2.status, own(r2.stderr).some((l) => /R-002 is not in a feature or subgroup table/.test(l)), /\b0 problems\b/.test(r2.stdout)], [1, true, false], r2.stdout + r2.stderr);
	const shapes = [["--root", t1, "--write"], ["--root", t1, "--check"], ["--root"], ["--root", t1, "--root", t1]];
	const shapeRuns = shapes.map((a) => node([TREE, ...a], scratch));
	out("(d) --root <dir> --write, --root <dir> --check, a bare --root and a doubled --root each exit 2 with a usage line naming --root <dir> (R-1157, §3.2)",
		[shapeRuns.map((r) => r.status), shapeRuns.map((r) => /--root <dir>/.test(r.stderr))], [[2, 2, 2, 2], [true, true, true, true]], shapeRuns.map((r) => r.stderr).join(" | "));
	const self = node([TREE, "--root", root], scratch);
	const selfT = readTree(text("REQUIREMENTS.md"));
	out("(d) --root <this checkout> exits 0 with this ledger's counts", [self.status, lines(self.stdout)],
		[0, [`requirements tree: 0 problems; rows ${selfT.rows.length}; features ${selfT.headings.filter((h) => h.id.startsWith("FEAT-")).length}`]], self.stderr);

	// R-1158
	const lf2 = tree(copyLedger("two-lf", TWO), scratch), cr2 = tree(copyLedger("two-crlf", crlf(TWO)), scratch);
	const twoLines = own(lf2.stderr);
	out("(d) the two-problem ledger exits 1 naming FEAT-002's missing Purpose: and R-002 outside a table", [lf2.status, twoLines.length, twoLines.some((l) => /FEAT-002/.test(l) && /Purpose/.test(l)), twoLines.some((l) => /R-002 is not in a feature or subgroup table/.test(l))], [1, 2, true, true], lf2.stderr);
	out("(d) its CRLF copy exits 1 with the same two problems at the same line numbers (R-1158)", [cr2.status, own(cr2.stderr).length, JSON.stringify(own(cr2.stderr)) === JSON.stringify(twoLines)], [1, 2, true], `${own(cr2.stderr).join(" | ")} vs ${twoLines.join(" | ")}`);
	const ownLedger = text("REQUIREMENTS.md");
	const selfLf = tree(copyLedger("self-lf", ownLedger.replace(/\r\n/g, "\n")), scratch), selfCr = tree(copyLedger("self-crlf", crlf(ownLedger)), scratch);
	const selfWant = [`requirements tree: 0 problems; rows ${selfT.rows.length}; features ${selfT.headings.filter((h) => h.id.startsWith("FEAT-")).length}`];
	out("(d) nana-pi's ledger copied as LF and as CRLF: both exit 0 with this ledger's counts (R-1158)", [selfLf.status, lines(selfLf.stdout), selfCr.status, lines(selfCr.stdout)], [0, selfWant, 0, selfWant], selfCr.stderr.slice(0, 300));

	// R-1159
	const fl = tree(copyLedger("flat1000", FLAT), scratch);
	const flLines = own(fl.stderr);
	out("(d) 1,000 flat rows: exit 1 and stderr is one line naming `1000 requirement rows`, no requirements tree yet and the requirements skill (R-1159)",
		[fl.status, flLines.length, /\b1000 requirement rows\b/.test(flLines[0] ?? ""), /no requirements tree yet/.test(flLines[0] ?? ""), /requirements skill/.test(flLines[0] ?? ""), flLines.some((l) => /not in a feature or subgroup table/.test(l))],
		[1, 1, true, true, true, false], `${flLines.length} lines; first: ${flLines[0] ?? ""}`);
	const flc = tree(copyLedger("flat1000-crlf", crlf(FLAT)), scratch);
	const flcLines = own(flc.stderr);
	out("(d) 1,000 flat rows with CRLF line endings: the same one line (R-1159, R-1158; the trigger was a Windows seat)",
		[flc.status, flcLines.length, /\b1000 requirement rows\b/.test(flcLines[0] ?? ""), /no requirements tree yet/.test(flcLines[0] ?? "")], [1, 1, true, true], `${flcLines.length} lines; first: ${flcLines[0] ?? ""}`);
	const REAL = path.join(os.homedir(), "basketball-geek", "REQUIREMENTS.md");
	// Read the committed ledger (stable while that project is being edited); the guard below checks the working file.
	const realHead = spawnSync("git", ["-C", path.dirname(REAL), "show", "HEAD:REQUIREMENTS.md"], { encoding: "buffer" });
	const realBytes = realHead.status === 0 ? realHead.stdout : null;
	const realWorking = (() => { try { return fs.readFileSync(REAL); } catch { return null; } })();
	if (realBytes) {
		const realText = realBytes.toString("utf8");
		const realT = readTree(realText);
		const realRows = realText.split("\n").filter((l) => ROW.test(l)).length;
		out("(harness) the real flat ledger holds rows and no tree or near-miss heading", [realRows > 0, realT.headings.length, /^#{1,3}\s*(CAP|FEAT|SUB)-\d/m.test(realText)], [true, 0, false]);
		const rr = tree(copyLedger("real-flat", realBytes), scratch);
		const rrLines = own(rr.stderr);
		out(`(d) a copy of ${REAL.replace(os.homedir(), "~")}: exit 1 and one line naming \`${realRows} requirement rows\` and no requirements tree yet (R-1159)`,
			[rr.status, rrLines.length, new RegExp(`\\b${realRows} requirement rows\\b`).test(rrLines[0] ?? ""), /no requirements tree yet/.test(rrLines[0] ?? "")], [1, 1, true, true], `${rrLines.length} lines; first: ${rrLines[0] ?? ""}`);
		out("(guard) the real project's working ledger is unchanged by the run (read-only)", realWorking ? sha(fs.readFileSync(REAL)) : "missing", realWorking ? sha(realWorking) : "missing");
	} else out(`(d) a real flat project ledger on this Mac gives R-1159's one line`, `missing ${REAL}`, "present");

	// R-1161
	const nr = tree(copyLedger("near", NEAR), scratch);
	const nrLines = own(nr.stderr);
	const named = (n, kind) => nrLines.some((l) => new RegExp(`\\bline ${n}\\b`).test(l) && l.includes(`${kind}-`) && l.includes("·"));
	out("(d) near-miss CAP, FEAT and SUB headings (\" - \" for \" · \"): exit 1, each named with its line and the · form, no no-tree line, no per-row line (R-1161)",
		[nr.status, named(1, "CAP"), named(4, "FEAT"), named(8, "SUB"), nrLines.some((l) => /no requirements tree yet/.test(l)), nrLines.some((l) => /not in a feature or subgroup table/.test(l))],
		[1, true, true, true, false, false], nrLines.join(" | "));

	// R-1161 inside a valid tree: the scan must not live only in the no-tree branch.
	const MIX = `${TREE1}\n## FEAT-002 - Near miss\nPurpose: p\nStatus: proposed\n`;
	const mixLine = MIX.split("\n").indexOf("## FEAT-002 - Near miss") + 1;
	const mx = tree(copyLedger("near-mixed", MIX), scratch);
	out(`(d) a valid tree with one near-miss FEAT heading: exit 1 naming line ${mixLine} and the · form (R-1161)`,
		[mx.status, own(mx.stderr).some((l) => new RegExp(`\\bline ${mixLine}\\b`).test(l) && l.includes("FEAT-") && l.includes("·"))], [1, true], mx.stdout + mx.stderr);

	// R-1160 through --root
	const u1 = tree(copyLedger("t1-utf16", utf16(TREE1)), scratch);
	const u1Err = own(u1.stderr).join("\n");
	out("(d) --root <UTF-16LE tree ledger with BOM>: exit 1 naming the NUL byte, UTF-16 and UTF-8, no `0 problems` (R-1160)",
		[u1.status, /NUL/.test(u1Err), /UTF-16/.test(u1Err), /UTF-8/.test(u1Err), /\b0 problems\b/.test(u1.stdout + u1.stderr)], [1, true, true, true, false], u1.stdout + u1.stderr);
	const nr0 = tree(copyLedger("norows", NOROWS), scratch);
	out("(d) --root <tree with no row>: exit 1 saying no requirement rows, no `0 problems` (R-1160)",
		[nr0.status, own(nr0.stderr).some((l) => /no requirement rows/.test(l)), /\b0 problems\b/.test(nr0.stdout + nr0.stderr)], [1, true, false], nr0.stdout + nr0.stderr);

	// R-1160 through nana-pi's own --check and --write, in a temp mirror of scripts/ (never this checkout's ledger).
	const mirror = path.join(scratch, "mirror");
	fs.cpSync(path.join(root, "scripts"), path.join(mirror, "scripts"), { recursive: true });
	fs.mkdirSync(path.join(mirror, "templates/typescript/template/tests"), { recursive: true });
	fs.copyFileSync(path.join(root, "templates/typescript/template/tests/requirements-trace.ts"), path.join(mirror, "templates/typescript/template/tests/requirements-trace.ts"));
	fs.mkdirSync(path.join(mirror, "docs"));
	const mirrorOutline = path.join(mirror, "docs/requirements-tree.md");
	const runMirror = (ledger, mode) => { fs.writeFileSync(path.join(mirror, "REQUIREMENTS.md"), ledger); fs.writeFileSync(mirrorOutline, "junk outline\n"); return node([path.join(mirror, "scripts/requirements-tree.mjs"), mode], scratch); };
	const mc = runMirror(utf16(TREE1), "--check");
	const mw = runMirror(utf16(TREE1), "--write");
	const mwOutline = fs.readFileSync(mirrorOutline, "utf8");
	const m0 = runMirror(NOROWS, "--check");
	out("(d) nana-pi's own --check and --write refuse a UTF-16 ledger naming UTF-16, and --write writes no outline (R-1160, §3.2)",
		[mc.status, ...["NUL", "UTF-16", "UTF-8"].map((w) => own(mc.stderr).join("\n").includes(w)), mw.status, ...["NUL", "UTF-16", "UTF-8"].map((w) => own(mw.stderr).join("\n").includes(w)), mwOutline], [1, true, true, true, 1, true, true, true, "junk outline\n"], `${mc.stderr} | ${mw.stderr}`);
	out("(d) nana-pi's own --check refuses a ledger with no row (R-1160, §3.2)", [m0.status, own(m0.stderr).some((l) => /no requirement rows/.test(l))], [1, true], m0.stderr);

	// R-1159 and R-1160 through the report: each ledger in a committed repo with the seed HANDOFF.md, so a refusal is
	// the ledger's and not a missing HANDOFF or git.
	const seedHandoff = text("templates/_shared/HANDOFF.md") ?? "# Handoff\n\n## Open\n\n1. none\n";
	const reportOn = (label, ledger) => {
		const d = copyLedger(`report-${label}`, ledger);
		fs.writeFileSync(path.join(d, "HANDOFF.md"), seedHandoff);
		gitIn(d, "init", "-q"); gitIn(d, "add", "-A"); gitIn(d, "commit", "-qm", "fixture");
		const page = path.join(scratch, "report-out", `${label}.html`);
		const r = node([REPORT, "--root", d, "--out", page], scratch);
		return { r, err: own(r.stderr), page: fs.existsSync(page) };
	};
	const rf = reportOn("flat1000", FLAT);
	out("(d) the report on 1,000 flat rows: exit 1, a header line plus R-1159's one line, no per-row line, no page (R-1159, R-1025)",
		[rf.r.status, rf.err.length, rf.err.some((l) => /\b1000 requirement rows\b/.test(l) && /no requirements tree yet/.test(l) && /requirements skill/.test(l)), rf.err.some((l) => /not in a feature or subgroup table/.test(l)), rf.page],
		[1, 2, true, false, false], `${rf.err.length} lines: ${rf.err.slice(0, 3).join(" | ")}`);
	const ru16 = reportOn("utf16", utf16(TREE1));
	out("(d) the report on a UTF-16LE ledger: exit 1 naming the NUL byte, UTF-16 and UTF-8, no page (R-1160)",
		[ru16.r.status, /NUL/.test(ru16.err.join("\n")), /UTF-16/.test(ru16.err.join("\n")), /UTF-8/.test(ru16.err.join("\n")), ru16.page], [1, true, true, true, false], ru16.err.join(" | ") || ru16.r.stdout);
	const rfc = reportOn("flat1000-crlf", crlf(FLAT));
	out("(d) the report on 1,000 flat CRLF rows: exit 1 with R-1159's one line, no page (R-1159)",
		[rfc.r.status, rfc.err.some((l) => /\b1000 requirement rows\b/.test(l) && /no requirements tree yet/.test(l)), rfc.page], [1, true, false], rfc.err.slice(0, 3).join(" | "));
	const rnr = reportOn("norows", NOROWS);
	out("(d) the report on a tree with no row: exit 1 saying no requirement rows, no page (R-1160)",
		[rnr.r.status, rnr.err.some((l) => /no requirement rows/.test(l)), rnr.page], [1, true, false], rnr.err.join(" | ") || rnr.r.stdout);
	const rt1 = reportOn("tree1", TREE1);
	out("(guard) the report on the same committed one-row tree ledger exits 0 and writes its page (the fixtures are sound)", [rt1.r.status, rt1.page], [0, true], rt1.err.join(" | "));
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (s) the skills' text (R-1154 to R-1156, §3.4)
// Phrases run on whitespace-collapsed text, so a wrapped line cannot hide one. The carve-out is §3.4's quoted sentence.
const CARVE = "A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept byte-identical, then a regroup into capabilities and features that the owner approves.";
const skillText = (name) => collapse(text(`packages/nana-pack/skills/${name}/SKILL.md`));
const reqSkill = skillText("requirements");
out("(s) the requirements skill names the owner, the feature a row serves and §3.4's flat-ledger carve-out (R-1154)",
	["The project owner decides every change to the tree", "the table of the feature it serves", CARVE].filter((p) => !reqSkill.includes(p)), []);
out("(s) the requirements skill drops \"Jake decides\", \"In this ledger,\", the numbered-sections audit brief and the separate Part (R-1154)",
	["Jake decides", "In this ledger,", "the numbered sections the worker must cover", "at the end as its own Part"].filter((p) => reqSkill.includes(p)), []);
out("(s) the requirements skill quotes R-1159's line, `no requirements tree yet` (§3.4)", reqSkill.includes("no requirements tree yet"), true);
out("(s) the requirements skill names both R-1156 commands exactly (R-1156)", [CHECKER_SKILL_CMD, REPORT_SKILL_CMD].filter((p) => !reqSkill.includes(p)), []);
const FIVE = ["scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts", "adopt-structure"];
out("(s) each of the five scaffold and adopt skills puts a row in the table of the feature it serves, carries the carve-out and names no Part G (R-1155)",
	FIVE.map((name) => { const t = skillText(name); return [name, t.includes("the table of the feature it serves"), t.includes(CARVE), t.includes("Part G")]; }),
	FIVE.map((name) => [name, true, true, false]));

// ---------------------------------------------------------------- (e) rows
const change = spec("CHANGE.md");
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const drafts = new Map(delta.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], c[3]]; }));
const NEW = Array.from({ length: 12 }, (_, i) => `R-${1150 + i}`);
const shalls = (s) => ((s ?? "").replace(/`[^`]*`/g, "").match(/\bshall\b/gi) ?? []).length;
out("(harness) CHANGE §2 gives one-shall text for each of R-1150 to R-1161, and the lane adds twelve rows", [NEW.map((id) => shalls(drafts.get(id))), drafts.size, LANE_ROWS_ADDED], [NEW.map(() => 1), 12, 12]);
const reqLines = lines(text("REQUIREMENTS.md"));
const baseReqLines = lines(atBase("REQUIREMENTS.md"));
const rowAt = (id, ls = reqLines) => ls.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id, ls = reqLines) => { const i = rowAt(id, ls); return i < 0 ? [] : ls[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const headingOf = (i) => { for (let k = i; k >= 0; k--) if (/^#{1,3} /.test(reqLines[k])) return reqLines[k].replace(/ ·.*$/, "").replace(/^#+ /, ""); return null; };
for (const id of NEW) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
	out(`(e) ${id} is one row carrying CHANGE §2's text with exactly one "shall"`, [rows.length, shalls(cells(id)[2]), cells(id)[2] ?? null], [1, 1, drafts.get(id) ?? "(no draft)"]);
}
const BLOCKS = [["R-738", "SUB-019", NEW.slice(0, 4)], ["R-657", "FEAT-032", NEW.slice(4, 7)], ["R-294", "FEAT-028", NEW.slice(7)]];
for (const [anchor, home, ids] of BLOCKS) {
	const chain = [anchor, ...ids];
	out(`(e) ${ids[0]}–${ids.at(-1)} follow ${anchor} line by line in ${home}`,
		[ids.filter((id, k) => rowAt(id) < 0 || rowAt(id) !== rowAt(chain[k]) + 1), ids.filter((id) => headingOf(rowAt(id)) !== home)], [[], []]);
}
const { entries, tree: rtTitles } = required("1", root);
const sourceCache = new Map();
const sourcesOf = (file, title) => { if (!sourceCache.has(file)) sourceCache.set(file, checkTitles(path.join(root, file)) ?? new Map()); return (sourceCache.get(file).get(title) ?? []).map((x) => `${file}::${x.cite}`); };
const cites = (s) => [...(s ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
for (const id of NEW) {
	const mine = entries.filter(([, , rows]) => rows.includes(id));
	const want = [...new Set(mine.flatMap(([file, title]) => { const s = sourcesOf(file, title); return s.length ? s : [`${file}::${title} (not in the test file)`]; }))];
	const ev = cites(cells(id)[4]);
	out(`(e) ${id}'s evidence cites its ${mine.length} §5 title(s) as the rail reads them`, want.length ? want.filter((c) => !ev.includes(c)) : "no §5 title for this row", []);
}
out("(e) R-1150 to R-1161 and R-291 read implemented", [...NEW, "R-291"].filter((id) => (cells(id)[3] ?? "") !== "implemented"), []);
// R-291's base evidence cites none of its leaf-total title (it cites the outline-fields check), so the rename needs no
// evidence edit; its evidence may gain the renamed title but keeps every other base citation.
out("(guard) R-291's evidence keeps every base citation other than the base leaf-total title", rtTitles.error ? rtTitles.error : cites(cells("R-291", baseReqLines)[4]).filter((c) => !c.endsWith(rtTitles.before) && !cites(cells("R-291")[4]).includes(c)), []);
const baseIds = baseReqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
const headIds = reqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
out("(guard) no base row changes its Requirement text or Status", baseIds.filter((id) => { const a = cells(id, baseReqLines), b = cells(id); return a[2] !== b[2] || a[3] !== b[3]; }), []);
out(`(e) the row set is the base's plus R-1150 to R-1161, each once: leaf total ${baseIds.length} → ${baseIds.length + LANE_ROWS_ADDED}`,
	{ added: headIds.filter((id) => !baseIds.includes(id)).sort(), removed: baseIds.filter((id) => !headIds.includes(id)), count: headIds.length }, { added: [...NEW].sort(), removed: [], count: baseIds.length + NEW.length });
out("(e) the leaf totals agree with R-291's renamed title", rtTitles.error ? rtTitles.error : [rtTitles.beforeTotal, rtTitles.afterTotal], [baseIds.length, headIds.length]);
const treeHeads = (ls) => ls.filter((l) => /^#{1,3} (CAP|FEAT|SUB)-/.test(l));
out(`(guard) nana-pi's tree headings are the base's (${treeHeads(baseReqLines).length})`, treeHeads(reqLines), treeHeads(baseReqLines));
const unusedRe = /\bR-116[2-9]\b/;
const reqMarkers = git("grep", "--untracked", "-nE", "req:.*\\bR-116[2-9]\\b", "--", "packages", "scripts", "templates", "apps");
out("(guard) R-1162 to R-1169 are unused: no REQUIREMENTS.md mention, no req: marker", [reqLines.filter((l) => unusedRe.test(l)).length, reqMarkers.stdout.split("\n").filter(Boolean)], [0, []]);
const rail = node(["scripts/requirements-trace.mjs"]);
out("(guard) the trace rail is green: node scripts/requirements-trace.mjs exits 0", rail.status, 0, (rail.stdout + rail.stderr).split("\n").filter((l) => /^\s{2}\S/.test(l)).slice(0, 5).join(" | "));

// ---------------------------------------------------------------- (f) scope
// §4 "In.", quoted: "Code: `scripts/requirements-tree.mjs`; `scripts/product-report.mjs` (`buildReport` calls
// `ledgerReadProblem`, R-1160). Templates: both `REQUIREMENTS.md.jinja`, `templates/_shared/requirements-general.md`.
// Skills: requirements, scaffold-py, scaffold-ts, adopt-py, adopt-ts, adopt-structure. Tests: `templates-render.test.mjs`,
// `requirements-tree.test.mjs`, `product-report.test.mjs` (`packages/nana-pack/tests/`). Docs: `README.md` … Also
// `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`, the session entry, the corpus, and `HANDOFF.md`".
const SKILL = (name) => `packages/nana-pack/skills/${name}/SKILL.md`;
const SCOPE = [
	RT_SCRIPT, PR_SCRIPT,
	"templates/python/template/REQUIREMENTS.md.jinja", "templates/typescript/template/REQUIREMENTS.md.jinja", "templates/_shared/requirements-general.md",
	// Seat amendment 2026-10-14: build brief 3 moved the organization section into one shared source (astra r1 SHOULD;
	// the AGENTS.md Layout rule), so the In list gains it.
	"templates/_shared/requirements-organization.md",
	...["requirements", "scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts", "adopt-structure"].map(SKILL),
	TR, RT, PR,
	"README.md", "REQUIREMENTS.md", "docs/requirements-tree.md", "docs/code-map.md", "docs/sessions/2026-10.md", "HANDOFF.md",
];
const SCOPE_PREFIX = "docs/reviews/tree-2026-10-14/";
const diff = git("diff", "--name-only", `${base}..HEAD`);
const changed = diff.stdout.split("\n").filter(Boolean);
out(`(guard) git diff --name-only ${base.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`, diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);
// §3.5 "Leave unchanged: the shared working section, AGENTS.md, CLAUDE.md, nana-soul, copier.yml, both rails,
// packages/nana-setup/**, the pack's bin list, handoff-asks.mjs, … template.html, both main guards, nana-pi's tree
// headings, the assessments store."
const FROZEN = ["templates/_shared/working-under-nana-pi.md", "AGENTS.md", "CLAUDE.md", "copier.yml",
	"templates/typescript/template/tests/requirements-trace.ts", "templates/python/template/tests/conftest.py",
	"packages/nana-pack/package.json", "packages/nana-pack/lib/handoff-asks.mjs", "scripts/product-report/template.html", "docs/product-report/assessments.json"];
const FROZEN_PREFIX = ["packages/nana-setup/", "packages/nana-pack/bin/"];
out("(guard) the merge-base diff touches no §3.5 file", changed.filter((p) => FROZEN.includes(p) || FROZEN_PREFIX.some((x) => p.startsWith(x))), []);
const guardLine = (src) => (src ?? "").split("\n").filter((l) => /^if \(process\.argv\[1\]/.test(l)).at(-1) ?? null;
out("(guard) both main guards are the base's lines, unchanged (§3.5)", [RT_SCRIPT, PR_SCRIPT].filter((rel) => { const g = guardLine(atBase(rel)); return !g || !(text(rel) ?? "").split("\n").includes(g); }), []);
// product-report.mjs: outside buildReport only the requirements-tree import gains ledgerReadProblem; inside it every
// base line survives in order and the one addition is a ledgerReadProblem call ahead of the HANDOFF.md read.
const prSplit = (src) => {
	const ls = (src ?? "").split("\n");
	const s = ls.findIndex((l) => l.startsWith("export async function buildReport("));
	const e = s < 0 ? -1 : ls.findIndex((l, i) => i > s && /^(export )?(async )?function /.test(l));
	if (s < 0 || e < 0) return null;
	const names = new Set();
	const outside = [];
	for (const l of [...ls.slice(0, s), "<buildReport>", ...ls.slice(e)]) {
		const m = /^import \{([^}]*)\} from "\.\/requirements-tree\.mjs";$/.exec(l);
		if (m) { m[1].split(",").map((x) => x.trim()).filter(Boolean).forEach((x) => names.add(x)); if (!outside.includes("<tree import>")) outside.push("<tree import>"); continue; }
		outside.push(l);
	}
	return { outside, names: [...names].sort(), body: ls.slice(s, e) };
};
const prBase = prSplit(atBase(PR_SCRIPT)), prHead = prSplit(text(PR_SCRIPT));
const subsequence = (small, big) => { let k = 0; for (const l of big) if (k < small.length && l === small[k]) k++; return k === small.length; };
const added = prHead && prBase ? (() => { const rest = []; let k = 0; for (const l of prHead.body) { if (k < prBase.body.length && l === prBase.body[k]) k++; else rest.push(l); } return rest; })() : [];
const callAt = prHead ? prHead.body.findIndex((l) => /ledgerReadProblem\(/.test(l)) : -1;
const handoffAt = prHead ? prHead.body.findIndex((l) => l.includes('"HANDOFF.md"')) : -1;
out("(f) product-report.mjs changes only buildReport's one ledgerReadProblem call (and its import), ahead of the HANDOFF.md read (§3.3, §3.5)",
	prBase && prHead ? [JSON.stringify(prHead.outside) === JSON.stringify(prBase.outside), prHead.names.join(",") === [...prBase.names, "ledgerReadProblem"].sort().join(","), subsequence(prBase.body, prHead.body), added.join("\n").match(/ledgerReadProblem\(/g)?.length ?? 0, callAt >= 0 && handoffAt >= 0 && callAt < handoffAt] : "buildReport not found",
	[true, true, true, 1, true], added.join(" ⏎ ").slice(0, 300));
const exportsProbe = node(["--input-type=module", "-e", `import * as m from ${JSON.stringify(pathToFileURL(TREE).href)}; console.log(["checkTree","noTreeProblem","ledgerReadProblem"].map((k) => typeof m[k]).join(","));`]);
out("(f) requirements-tree.mjs exports checkTree, noTreeProblem and ledgerReadProblem (§3.2)", lines(exportsProbe.stdout).at(-1) ?? null, "function,function,function", own(exportsProbe.stderr).join(" "));
const readme = text("README.md") ?? "";
out("(f) README names the checker's --root beside requirements-tree.mjs (§4, :64)", readme.split(/\n\s*\n/).some((p) => p.includes("requirements-tree.mjs") && p.includes("--root")), true);
out("(f) README's report section says \"on any nana project with the tree:\" and gives R-1156's report form (§4, :243)",
	[collapse(readme).includes("on any nana project with the tree:"), collapse(readme).includes(REPORT_SKILL_CMD)], [true, true]);
for (const [label, args] of [["node scripts/requirements-tree.mjs --check", [RT_SCRIPT, "--check"]], ["map:check (node scripts/code-map.mjs --check)", ["scripts/code-map.mjs", "--check"]], ["readme:check (node scripts/readme-check.mjs)", ["scripts/readme-check.mjs"]]]) {
	const r = node(args);
	out(`(guard) ${label} exits 0`, r.status, 0, (r.stdout + r.stderr).slice(-300));
}
const handoff = collapse(text("HANDOFF.md"));
out("(f, seat item) HANDOFF drops the LF-only tree checker line and the \"Now: the tree for every project\" line",
	[handoff.includes("The tree checker still splits lines on LF without CR handling"), handoff.includes("Now: the tree for every project")], [false, false]);
// Seat amendment 2026-10-14: the queue line says "the lift" in plain words (the writing rule keeps code names out of
// HANDOFF prose), so the case reads the word, not the lane name.
out("(f, seat item) HANDOFF carries §6's queue (the lift, the regroup) and residual 14's Windows `nana-setup install` line",
	[/\blift\b/i.test(handoff), /regroup/.test(handoff), lines(text("HANDOFF.md")).some((l) => l.includes("nana-setup install") && /Windows/.test(l) && /requirements skill/.test(l))], [true, true, true]);
out("(f, seat item) the session entry docs/sessions/2026-10.md is in the lane's diff", changed.includes("docs/sessions/2026-10.md"), true);
// The build must be committed: an untracked or modified path outside this review folder would pass every case above
// that reads the working tree, and copier renders only committed template text at --vcs-ref HEAD.
out("(guard) the build is committed: no uncommitted or untracked path outside this review folder", lines(statusBefore).filter((l) => !l.slice(3).startsWith(SCOPE_PREFIX)), []);

// ---------------------------------------------------------------- (g) the §5 titles print PASS
const runs = new Map();
for (const file of [TR, RT, PR]) {
	const r = node(["--experimental-strip-types", file], root, { env: { ...cleanEnv(), NANA_TEST_REQUIRE_COPIER: "1" } });
	runs.set(file, r);
	out(`(guard) ${file} exits 0`, r.status, 0, lines(r.stdout).filter((l) => /^FAIL /.test(l)).slice(0, 3).join(" | ") + own(r.stderr).slice(-2).join(" | "));
}
const printed = (file, word, title) => lines(runs.get(file)?.stdout).filter((l) => l.startsWith(`${word} ${title}`) && l.slice(word.length + 1 + title.length).trim() === "").length;
out("(g) every §5 title prints PASS exactly once and never FAIL or SKIP", entries.filter(([file, title]) => printed(file, "PASS", title) !== 1 || printed(file, "FAIL", title) || printed(file, "SKIP", title)).map(([, title]) => title), [],
	`${entries.length} titles`);

out("(harness) the run wrote nothing inside the checkout (git status unchanged)", statusOf() === statusBefore, true);
console.log(`cases: ${n - bad}/${n} (build cases red: ${badBuild}/${nBuild}; guard and harness red: ${bad - badBuild}/${n - nBuild})`);
console.log(`tree acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
