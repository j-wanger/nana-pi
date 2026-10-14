// Seat acceptance for lane seat-guide (frozen; written by the seat 2026-10-14 before the build, from CHANGE.md §5
// "Seat acceptance" (a)–(f), with §2 rows, §3 design, §4 scope and the "Base update (2026-10-14)"). Run from anywhere
// inside the checkout under test; the build is read from the cwd's git root, the spec (CHANGE.md, the two proposed
// files, seat-titles.mjs) from this script's own folder:
//   node docs/reviews/seat-guide-2026-10-14/acceptance.mjs
// (a) seat-titles 1 prints `seat-titles 1: 0 missing`.
// (b) the guide equals nana-seat.proposed.md with \r stripped, has 8 bullets, and nana-writing.mjs (no --report)
//     reads it and prints over=0 passive=0 banned=0 (a missing file also prints zeros, so sentences>0 is required).
// (c) the template and the AGENTS.md region each hold the pointer once (pointer.proposed.txt), right after the Seat
//     land review bullet, each the base copy plus that one line; the file the pointer names exists here.
// (d) in scratch --home dirs: install links the rule and doctor prints `✓ rule nana-seat.md`; under
//     NANA_SETUP_PLATFORM=win32 it is a byte-equal regular file; `uninstall --yes` removes the link install made.
// (e) R-301 names four rules (CHANGE §2's text); R-1140–R-1142 carry §2's text, sit where §2 says and cite §5's titles
//     (read from seat-titles.mjs, the one title list); R-350 gains its title; rows §2 keeps keep their text;
//     R-1143–R-1149 unused.
// (f) `git diff --name-only <base>..HEAD` ⊆ §4 In; the only code is one list line each in steps.mjs and
//     state-manifest.mjs; one setup README row after the nana-standards row.
// <base> is `git merge-base main HEAD` (484329c when written), so a merge of a newer main moves it with the lane.
// POSIX only (uninstall is POSIX-only). Every --home, HOME and the pi stub live in one scratch folder under the OS temp
// dir, removed at the end; nothing is written inside the checkout (the last case checks git status). No suite test may
// import or run this file.
// Before the land only: after it, `git merge-base main HEAD` is the tip itself and every build case reads red.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LANE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SEAT_TITLES = path.join(LANE_DIR, "seat-titles.mjs");
const { required, repoRoot } = await import(pathToFileURL(SEAT_TITLES).href);
const root = repoRoot();
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md")) || !fs.existsSync(path.join(root, "packages/nana-setup/bin/nana-setup.mjs"))) {
	console.error("run inside a nana-pi checkout: node <lane>/docs/reviews/seat-guide-2026-10-14/acceptance.mjs");
	process.exit(2);
}
if (process.platform === "win32") {
	console.error("POSIX only: nana-setup uninstall is POSIX-only; the Windows copy path is checked here under NANA_SETUP_PLATFORM=win32");
	process.exit(2);
}
let bad = 0, n = 0;
const out = (title, got, want, detail = "") => {
	n++;
	const ok = JSON.stringify(got) === JSON.stringify(want);
	if (!ok) bad++;
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got).slice(0, 300)} (want ${JSON.stringify(want).slice(0, 300)})${detail ? ` [${String(detail).replace(/\s+/g, " ").slice(0, 400)}]` : ""}`}`);
};
const text = (rel) => { try { return fs.readFileSync(path.join(root, rel), "utf8"); } catch { return null; } };
const spec = (name) => fs.readFileSync(path.join(LANE_DIR, name), "utf8");
const lines = (s) => (s ?? "").replace(/\r/g, "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));
const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
const statusOf = () => git("status", "--porcelain=v1", "-uall").stdout;
const statusBefore = statusOf();

const base = git("merge-base", "main", "HEAD").stdout.trim();
const atBase = (rel) => { const r = git("show", `${base}:${rel}`); return r.status === 0 ? r.stdout : null; };

const GUIDE = "packages/nana-setup/claude/rules/nana-seat.md";
const SHARED = "templates/_shared/working-under-nana-pi.md";
const SETUP_README = "packages/nana-setup/README.md";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const MANIFEST = "packages/nana-setup/lib/state-manifest.mjs";
const BEGIN = "<!-- nana:working-under-nana-pi begin -->";
const END = "<!-- nana:working-under-nana-pi end -->";
const SEAT_LAND = "- Seat land review:";

const change = spec("CHANGE.md");
const proposedGuide = spec("nana-seat.proposed.md").replace(/\r/g, "");
const pointer = spec("pointer.proposed.txt").replace(/\r/g, "").replace(/\n$/, "");

// ---------------------------------------------------------------- harness: the spec files agree with CHANGE §3
out("(harness) git merge-base main HEAD resolves", /^[0-9a-f]{40}$/.test(base), true, base);
const design = change.slice(change.indexOf("## 3. Design"), change.indexOf("## 4. Scope"));
const blocks = [...design.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1]);
out("(harness) pointer.proposed.txt is CHANGE §3's pointer block: one line starting `- Seat guide:`", [blocks[0] === `${pointer}\n`, lines(pointer).length, pointer.startsWith("- Seat guide:")], [true, 1, true]);
out("(harness) nana-seat.proposed.md is CHANGE §3's guide block, 8 bullets", [blocks[1] === proposedGuide, lines(proposedGuide).filter((l) => l.startsWith("- ")).length], [true, 8]);

// ---------------------------------------------------------------- (a) the title check
const titles = spawnSync(process.execPath, [SEAT_TITLES, "1"], { cwd: root, encoding: "utf8" });
const titleLines = lines(titles.stdout);
out("(a) seat-titles 1 prints `seat-titles 1: 0 missing` and exits 0", [titleLines.at(-1) ?? null, titles.status], ["seat-titles 1: 0 missing", 0],
	titleLines.filter((l) => !/^(ok|gone) /.test(l)).join(" | ") + titles.stderr);

// ---------------------------------------------------------------- (b) the guide
const guideStat = (() => { try { return fs.lstatSync(path.join(root, GUIDE)); } catch { return null; } })();
out(`(b) ${GUIDE} is a regular file in the checkout`, Boolean(guideStat?.isFile()), true);
const guide = text(GUIDE);
out("(b) the guide equals nana-seat.proposed.md with \\r stripped", guide !== null && guide.replace(/\r/g, "") === proposedGuide, true,
	guide === null ? "absent" : `guide ${Buffer.byteLength(guide)} bytes, proposed ${Buffer.byteLength(proposedGuide)}`);
out("(b) the guide has 8 bullets", guide === null ? "absent" : lines(guide).filter((l) => l.startsWith("- ")).length, 8);
const writing = spawnSync(process.execPath, ["packages/nana-pack/bin/nana-writing.mjs", GUIDE], { cwd: root, encoding: "utf8" });
const summary = /^summary .*$/m.exec(writing.stdout)?.[0] ?? "";
const field = (k) => new RegExp(`\\b${k}=(\\S+)`).exec(summary)?.[1] ?? null;
out("(b) nana-writing.mjs <guide> (no --report) reads the guide and prints over=0 passive=0 banned=0",
	[/error:/.test(writing.stdout + writing.stderr), Number(field("sentences")) > 0, field("over"), field("passive"), field("banned")], [false, true, "0", "0", "0"],
	`${writing.stdout} ${writing.stderr}`);

// ---------------------------------------------------------------- (c) the pointer in the template and AGENTS.md
const shared = text(SHARED);
const agents = text("AGENTS.md");
const regionOf = (s) => { if (s === null) return null; const b = s.indexOf(`${BEGIN}\n`), e = s.indexOf(`\n${END}`, b + 1); return b < 0 || e < 0 ? null : s.slice(b + BEGIN.length + 1, e + 1); };
const region = regionOf(agents);
const once = (s) => s === null ? "absent" : [lines(s).filter((l) => l === pointer).length, lines(s).filter((l) => l.startsWith("- Seat guide:")).length];
out("(c) the template holds the pointer line once and no other `- Seat guide:` line", once(shared), [1, 1]);
out("(c) the AGENTS.md region holds the pointer line once and no other `- Seat guide:` line", once(region), [1, 1]);
const insertAfterSeatLand = (s) => {
	if (s === null) return null;
	const ls = s.split("\n");
	const at = ls.findIndex((l) => l.startsWith(SEAT_LAND));
	return at < 0 ? null : [...ls.slice(0, at + 1), pointer, ...ls.slice(at + 1)].join("\n");
};
const baseShared = atBase(SHARED), baseAgents = atBase("AGENTS.md");
out("(harness) the base template and base AGENTS.md each have one Seat land review bullet",
	[baseShared, baseAgents].map((s) => lines(s).filter((l) => l.startsWith(SEAT_LAND)).length), [1, 1]);
out("(c) the template is the base copy plus the pointer, right after the Seat land review bullet", shared !== null && shared === insertAfterSeatLand(baseShared), true,
	shared === null ? "absent" : `now ${shared.length} bytes, expected ${(insertAfterSeatLand(baseShared) ?? "").length}`);
out("(c) AGENTS.md is the base copy plus the pointer, right after its Seat land review bullet", agents !== null && agents === insertAfterSeatLand(baseAgents), true,
	agents === null ? "absent" : `now ${agents.length} bytes, expected ${(insertAfterSeatLand(baseAgents) ?? "").length}`);
out("(c) the AGENTS.md region equals the template (R-859, S5)", region !== null && region === shared, true);
const named = /`\$HOME\/nana-pi\/([^`]+)`/.exec(pointer)?.[1] ?? null;
out("(harness) the pointer names the guide under $HOME/nana-pi/", named, GUIDE);
out("(c) the file the pointer names exists in this checkout", named !== null && (() => { try { return fs.statSync(path.join(root, named)).isFile(); } catch { return false; } })(), true);

// ---------------------------------------------------------------- (d) install, doctor, win32 copy, uninstall
const CLI = path.join(root, "packages/nana-setup/bin/nana-setup.mjs");
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "seat-guide-accept-")));
try {
	out("(harness) the scratch folder is outside the checkout", path.relative(fs.realpathSync(root), scratch).startsWith(".."), true, scratch);
	const stubBin = path.join(scratch, "stub-bin");
	fs.mkdirSync(stubBin);
	fs.writeFileSync(path.join(stubBin, "pi"), "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then printf '1.0.2\\n'; exit 0; fi\nprintf 'pi stub rejects %s\\n' \"$1\" >&2\nexit 1\n");
	fs.chmodSync(path.join(stubBin, "pi"), 0o755);
	const newHome = (label) => {
		const h = path.join(scratch, label);
		fs.mkdirSync(path.join(h, ".pi", "agent", "nana-knowledge"), { recursive: true });
		fs.writeFileSync(path.join(h, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
		return h;
	};
	const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^(NANA_|GIT_|PI_CODING_AGENT_DIR$|CLAUDE_CONFIG_DIR$)/.test(k)) delete env[k]; return env; };
	const setup = (args, home, extra = {}) => spawnSync(process.execPath, [CLI, ...args, "--home", home],
		{ cwd: scratch, encoding: "utf8", timeout: 180_000, env: { ...cleanEnv(), HOME: home, USERPROFILE: home, PATH: `${stubBin}${path.delimiter}${process.env.PATH}`, ...extra } });
	const guideReal = (() => { try { return fs.realpathSync(path.join(root, GUIDE)); } catch { return null; } })();
	const ruleAt = (home) => path.join(home, ".claude", "rules", "nana-seat.md");
	const lst = (p) => { try { return fs.lstatSync(p); } catch { return null; } };
	const DOCTOR_ROW = /^\s*✓ rule nana-seat\.md\s/m;

	const home = newHome("home-posix");
	const inst = setup(["install"], home, { NANA_SETUP_PLATFORM: "darwin" });
	out("(d) install --home <tmp> exits 0", inst.status, 0, inst.stderr);
	const link = lst(ruleAt(home));
	out("(d) install links ~/.claude/rules/nana-seat.md to the checkout's guide", [Boolean(link?.isSymbolicLink()), guideReal !== null && link !== null && fs.realpathSync(ruleAt(home)) === guideReal], [true, true],
		inst.stdout.split("\n").filter((l) => l.includes("rule ")).join(" | "));
	const doc = setup(["doctor"], home, { NANA_SETUP_PLATFORM: "darwin" });
	out("(d) doctor prints `✓ rule nana-seat.md`", DOCTOR_ROW.test(doc.stdout), true, doc.stdout.split("\n").filter((l) => l.includes("rule ")).join(" | "));
	const linkedBefore = Boolean(lst(ruleAt(home))?.isSymbolicLink());
	const un = setup(["uninstall", "--yes"], home, { NANA_SETUP_PLATFORM: "darwin" });
	out("(d) uninstall --yes exits 0 and removes the nana-seat.md link install made", [linkedBefore, un.status, lst(ruleAt(home)) === null], [true, 0, true],
		un.stdout.split("\n").filter((l) => l.includes("rule")).join(" | ") + un.stderr);

	const homeW = newHome("home-win32");
	const instW = setup(["install"], homeW, { NANA_SETUP_PLATFORM: "win32" });
	out("(d) win32: install --home <tmp> exits 0", instW.status, 0, instW.stderr);
	const copy = lst(ruleAt(homeW));
	const sameBytes = (() => { try { return fs.readFileSync(ruleAt(homeW)).equals(fs.readFileSync(path.join(root, GUIDE))); } catch { return false; } })();
	out("(d) win32: ~/.claude/rules/nana-seat.md is a regular file byte-equal to the checkout's guide", [Boolean(copy?.isFile()), Boolean(copy?.isSymbolicLink()), sameBytes], [true, false, true],
		instW.stdout.split("\n").filter((l) => l.includes("rule ")).join(" | "));
	const docW = setup(["doctor"], homeW, { NANA_SETUP_PLATFORM: "win32" });
	out("(d) win32: doctor prints `✓ rule nana-seat.md`", DOCTOR_ROW.test(docW.stdout), true, docW.stdout.split("\n").filter((l) => l.includes("rule ")).join(" | "));
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (e) rows
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const drafts = new Map(delta.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], c[3].replace(/\s*Evidence gains .*$/, "")]; }));
const shalls = (s) => ((s ?? "").match(/\bshall\b/gi) ?? []).length;
out("(harness) CHANGE §2 gives one-shall draft text for R-301 and R-1140–R-1142", ["R-301", "R-1140", "R-1141", "R-1142"].map((id) => shalls(drafts.get(id))), [1, 1, 1, 1]);
const reqLines = lines(text("REQUIREMENTS.md"));
const baseReqLines = lines(atBase("REQUIREMENTS.md"));
const rowAt = (id, ls = reqLines) => ls.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id, ls = reqLines) => { const i = rowAt(id, ls); return i < 0 ? [] : ls[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const headingOf = (i) => { for (let k = i; k >= 0; k--) if (/^#{2,3} /.test(reqLines[k])) return reqLines[k].replace(/ ·.*$/, "").replace(/^#+ /, ""); return null; };
const OLD_RULES = "the three rules (nana-soul.md, nana-standards.md, nana-writing.md)";
const NEW_RULES = "the four rules (nana-soul.md, nana-standards.md, nana-writing.md, nana-seat.md)";
out("(harness) R-301's draft is the base text with the rule list grown to four", (cells("R-301", baseReqLines)[2] ?? "").replace(OLD_RULES, NEW_RULES) === drafts.get("R-301"), true);
for (const id of ["R-1140", "R-1141", "R-1142"]) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
	out(`(e) ${id} is one row with exactly one "shall"`, [rows.length, shalls(cells(id)[2])], [1, 1]);
	out(`(e) ${id}'s text is CHANGE §2's`, cells(id)[2] ?? null, drafts.get(id) ?? "(no draft)");
}
const r301 = cells("R-301")[2] ?? "";
out("(e) R-301 names four rules including nana-seat.md, in CHANGE §2's text", [r301.includes(NEW_RULES), r301.includes(OLD_RULES), r301 === drafts.get("R-301")], [true, false, true], r301);
const SECTION = { "R-1140": "FEAT-006", "R-1141": "FEAT-006", "R-1142": "SUB-019" };
out("(e) each new row sits under the heading §2 names", Object.entries(SECTION).filter(([id, h]) => rowAt(id) < 0 || headingOf(rowAt(id)) !== h).map(([id]) => id), []);
const AFTER = [["R-1140", "R-1110"], ["R-1142", "R-1127"]];
out("(e) R-1140 follows R-1110 and R-1142 follows R-1127, each on the next line", AFTER.filter(([id, prev]) => rowAt(id) < 0 || rowAt(prev) < 0 || rowAt(id) !== rowAt(prev) + 1).map(([id, prev]) => `${id} after ${prev}`), []);
const { entries } = required("1", root);
const cites = (s) => [...(s ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
for (const id of ["R-1140", "R-1141", "R-1142", "R-301", "R-350"]) {
	const want = entries.filter(([, , rows]) => rows.includes(id)).map(([file, title]) => `${file}::${title}`);
	const ev = cites(cells(id)[4]);
	out(`(e) ${id}'s evidence cites its ${want.length} §5 title(s)`, want.length > 0 ? want.filter((c) => !ev.includes(c)) : "no §5 title for this row", []);
}
out("(e) R-1140, R-1141, R-1142, R-301 and R-350 read implemented", ["R-1140", "R-1141", "R-1142", "R-301", "R-350"].filter((id) => (cells(id)[3] ?? "").trim() !== "implemented"), []);
for (const id of ["R-301", "R-350"]) {
	const ev = cites(cells(id)[4]);
	out(`(e) ${id}'s evidence keeps every base citation (it gains, never loses)`, cites(cells(id, baseReqLines)[4]).filter((c) => !ev.includes(c)), []);
}
const KEEP = ["R-350", "R-954", "R-903", "R-904", "R-905", "R-906", "R-907", "R-1128"];
out("(e) R-350, R-954, R-903–R-907 and R-1128 keep their base text", KEEP.filter((id) => !cells(id, baseReqLines)[2] || cells(id)[2] !== cells(id, baseReqLines)[2]), []);
const unusedRe = /\bR-114[3-9]\b/;
const reqMarkers = git("grep", "--untracked", "-nE", "req:.*\\bR-114[3-9]\\b", "--", "packages", "scripts", "templates", "apps");
out("(e) R-1143–R-1149 are unused: no REQUIREMENTS.md mention, no req: marker", [reqLines.filter((l) => unusedRe.test(l)).length, reqMarkers.stdout.split("\n").filter(Boolean)], [0, []]);

// ---------------------------------------------------------------- (f) scope: the branch diff against §4
// §4 "In.", quoted: "`packages/nana-setup/claude/rules/nana-seat.md` (new); one list entry each in
// `packages/nana-setup/lib/steps.mjs` and `packages/nana-setup/lib/state-manifest.mjs` (the only code); the pointer in
// `templates/_shared/working-under-nana-pi.md` and `AGENTS.md`; one row after `packages/nana-setup/README.md:39`; new
// `packages/nana-setup/tests/seat-rule.test.mjs`; `install`, `win32-degrade`, `state-manifest` (`:57`, `:61`
// `Array(17)`), `uninstall` (`:288`), `restore` (`:52`), `templates-render` and `requirements-tree` (`:38`, `:52`,
// `:53`) tests; `REQUIREMENTS.md`; regenerated tree and code map; `HANDOFF.md` and `docs/sessions/2026-10.md` (seat,
// before the final round); this review corpus."
const SCOPE = [
	GUIDE,
	STEPS,
	MANIFEST,
	SHARED,
	"AGENTS.md",
	SETUP_README,
	"packages/nana-setup/tests/seat-rule.test.mjs",
	"packages/nana-setup/tests/install.test.mjs",
	"packages/nana-setup/tests/win32-degrade.test.mjs",
	"packages/nana-setup/tests/state-manifest.test.mjs",
	"packages/nana-setup/tests/uninstall.test.mjs",
	"packages/nana-setup/tests/restore.test.mjs",
	"packages/nana-pack/tests/templates-render.test.mjs",
	"packages/nana-pack/tests/requirements-tree.test.mjs",
	"REQUIREMENTS.md",
	"docs/requirements-tree.md",
	"docs/code-map.md",
	"HANDOFF.md",
	"docs/sessions/2026-10.md",
];
const SCOPE_PREFIX = "docs/reviews/seat-guide-2026-10-14/";
const diff = git("diff", "--name-only", `${base}..HEAD`);
const changed = diff.stdout.split("\n").filter(Boolean);
out(`(f) git diff --name-only ${base.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`, diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);
// The build must be committed: an untracked or modified path outside this review folder would pass every case above
// (they read the working tree) and still never reach main (seat verify, 2026-10-14).
out("(f) the build is committed: no uncommitted or untracked path outside this review folder", lines(statusBefore).filter((l) => !l.slice(3).startsWith(SCOPE_PREFIX)), []);
const added = lines(git("diff", "--name-status", `${base}..HEAD`).stdout).filter((l) => l.startsWith("A\t")).map((l) => l.slice(2));
out("(f) the guide and its test file are added in the lane's commits", ["packages/nana-setup/claude/rules/nana-seat.md", "packages/nana-setup/tests/seat-rule.test.mjs"].filter((p) => !added.includes(p)), []);
// "the only code": each file's diff changes exactly one non-comment line, the list line, which gains "nana-seat.md".
const codeDiff = (rel) => {
	const r = git("diff", "-U0", `${base}..HEAD`, "--", rel);
	const isComment = (l) => /^\s*(\/\/|\/\*\*?|\*)/.test(l) || l.trim() === "";
	const body = r.stdout.split("\n").filter((l) => !l.startsWith("+++") && !l.startsWith("---"));
	return { removed: body.filter((l) => l.startsWith("-")).map((l) => l.slice(1)).filter((l) => !isComment(l)), added: body.filter((l) => l.startsWith("+")).map((l) => l.slice(1)).filter((l) => !isComment(l)) };
};
const grownLine = (rel, marker) => { const l = lines(atBase(rel)).find((x) => x.includes(marker)) ?? null; return l === null ? null : { old: l, new: l.replace('"nana-writing.md"]', '"nana-writing.md", "nana-seat.md"]') }; };
for (const [rel, marker, what] of [[STEPS, "export const CLAUDE_RULES = [", "CLAUDE_RULES gains \"nana-seat.md\"; ruleSource and every other code line stay (S3)"], [MANIFEST, "rebuild(`rule link ${name}`", "the rule-link list gains \"nana-seat.md\"; every other code line stays"]]) {
	const want = grownLine(rel, marker);
	out(`(f) ${rel} changes one code line: ${what}`, codeDiff(rel), want === null ? "no base line" : { removed: [want.old], added: [want.new] });
}
const readmeLines = lines(text(SETUP_README));
const seatRows = readmeLines.map((l, i) => [l, i]).filter(([l]) => l.startsWith("| `claude/rules/nana-seat.md`"));
out("(f) the setup README has one `claude/rules/nana-seat.md` row, right after the nana-standards row", [seatRows.length, seatRows.length === 1 && (readmeLines[seatRows[0][1] - 1] ?? "").startsWith("| `claude/rules/nana-standards.md`")], [1, true]);

out("(harness) the run wrote nothing inside the checkout (git status unchanged)", statusOf() === statusBefore, true);
console.log(`cases: ${n - bad}/${n}`);
console.log(`seat-guide acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
