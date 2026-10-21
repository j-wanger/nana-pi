#!/usr/bin/env node
// Seat script for lane known-bugs (2026-10-21): move HANDOFF.md's Carried residuals, one line each and word for word,
// into docs/known-bugs/<feature>.md, and leave HANDOFF a Known bugs pointer section. Run once from the worktree root
// on the plan commit's parent:
//   node docs/reviews/known-bugs-2026-10-21/move.mjs [--dry-run]
// Placement, first match wins, for each line:
//   1. a lane named in the tag's parentheses whose review briefs carry `Feature: FEAT-nnn` (the most named feature);
//   2. else that lane's own commits' added REQUIREMENTS.md rows, by the feature each row sits in at HEAD;
//   3. else the area itself, as a lane name or as its slug (for example "Clean revision" -> clean-revision);
//   4. else docs/known-bugs/unplaced.md.
// Only an active or frozen feature receives lines. FIXED lines leave as fixed by this lane; POINTER lines become the
// pointer section's text. conserve.mjs proves every other line lands exactly once.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseLedger, readRequirementRows } from "../../../scripts/requirements-tree.mjs";

export const KNOWN_BUGS_DIR = "docs/known-bugs";
export const UNPLACED_FILE = "unplaced.md";
export const CARRIED_HEADING = "## Carried residuals";
// Lines this lane fixes: the move itself ends the whole-file size finding and brings the file under one Claude Code read.
export const FIXED = [
	"- Frontier checks (frontier-first, plan): the whole-file size finding stays until known bugs move to one file per feature.",
	"- Frontier checks (frontier-first, plan): Claude Code still cannot read this file in one call.",
];
// A pointer, not a bug: it becomes part of the Known bugs section's text.
export const POINTER = ["- Desk residuals live in `apps/desk/README.md` Known limits."];
const NOT_LANES = new Set(["audit", "process", "plan", "review", "reviews", "final", "independent", "check", "land", "wrong-code", "pairs", "seat", "both", "build", "re-check"]);

const root = process.cwd();
const dry = process.argv.includes("--dry-run");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 }).stdout;

/** The Carried residuals section: its heading index, its end index, and its list items in order. */
export function carriedItems(lines) {
	const start = lines.findIndex((l) => l.replace(/\r$/, "").startsWith(CARRIED_HEADING));
	if (start < 0) throw new Error("no Carried residuals heading");
	let end = lines.length;
	for (let i = start + 1; i < lines.length; i++) if (/^#{1,2} /.test(lines[i])) { end = i; break; }
	const items = [];
	for (let i = start + 1; i < end; i++) if (lines[i].startsWith("- ")) items.push({ index: i, text: lines[i].replace(/\r$/, "") });
	return { start, end, items };
}

const ledger = parseLedger(read("REQUIREMENTS.md"));
const features = new Map(ledger.headings.filter((h) => /^FEAT-\d{3}$/.test(String(h.id))).map((h) => [h.id, h]));
const live = (id) => { const h = features.get(id); return !!h && (h.status === "active" || String(h.status).startsWith("frozen")); };
const featureOf = (heading) => { let h = heading; while (h && !/^FEAT-\d{3}$/.test(String(h.id))) h = h.parent; return h?.id ?? null; };
const rowFeature = new Map(readRequirementRows(ledger).map((r) => [r.id, featureOf(r.heading)]));

const corpora = new Map();
for (const d of fs.readdirSync(path.join(root, "docs/reviews"))) {
	const lane = d.replace(/-\d{4}-\d{2}-\d{2}$/, "");
	corpora.set(lane, [...(corpora.get(lane) ?? []), d]);
}
const laneCommits = new Map();
for (const l of git(["log", "--format=%H %s", "HEAD"]).trim().split("\n")) {
	const m = /^([0-9a-f]{40}) ([a-z0-9][a-z0-9.-]*[a-z0-9]):\s/.exec(l);
	if (m) laneCommits.set(m[2], [...(laneCommits.get(m[2]) ?? []), m[1]]);
}
const knownLanes = new Set([...corpora.keys(), ...laneCommits.keys()]);
const ranked = (counts) => [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([f]) => f);
const memo = new Map();
function laneFeature(lane) {
	if (memo.has(lane)) return memo.get(lane);
	const fromBriefs = new Map();
	for (const d of corpora.get(lane) ?? []) {
		const dir = path.join(root, "docs/reviews", d);
		for (const f of fs.readdirSync(dir)) {
			const p = path.join(dir, f);
			if (!fs.statSync(p).isFile()) continue;
			for (const m of fs.readFileSync(p, "utf8").matchAll(/Feature:\s*`?(?:SUB-\d{3} in\s+)?(FEAT-\d{3})/g)) fromBriefs.set(m[1], (fromBriefs.get(m[1]) ?? 0) + 1);
		}
	}
	let found = { feature: ranked(fromBriefs).find(live) ?? null, how: "brief" };
	if (!found.feature) {
		const fromRows = new Map();
		for (const c of laneCommits.get(lane) ?? []) {
			for (const line of git(["show", "--format=", "--unified=0", c, "--", "REQUIREMENTS.md"]).split("\n")) {
				const m = /^\+\|\s*(R-\d+)\s*\|/.exec(line);
				const f = m && rowFeature.get(m[1]);
				if (f) fromRows.set(f, (fromRows.get(f) ?? 0) + 1);
			}
		}
		found = { feature: ranked(fromRows).find(live) ?? null, how: "rows" };
	}
	memo.set(lane, found);
	return found;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Place one item: { feature (or null for unplaced), how, lane }. */
export function place(text) {
	const head = text.slice(2).split(/:\s/)[0].slice(0, 200);
	const area = head.replace(/\s*\(.*$/, "").trim();
	const paren = /\(([^)]*)\)/.exec(head)?.[1] ?? "";
	const lanes = paren.split(/[,;]\s*|\s+/).map((t) => t.trim()).filter((t) => knownLanes.has(t) && !NOT_LANES.has(t));
	for (const lane of lanes) { const f = laneFeature(lane); if (f.feature) return { ...f, lane }; }
	for (const lane of [area, slug(area)]) if (knownLanes.has(lane)) { const f = laneFeature(lane); if (f.feature) return { ...f, how: `area-${f.how}`, lane }; }
	return { feature: null, how: "unplaced", lane: lanes[0] ?? null };
}

const fileHeading = (id) => `# ${id} — known bugs\n\n*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*\n\n`;
const UNPLACED_HEADING = "# Unplaced — known bugs\n\n*One line per known bug that no feature owns yet, moved from HANDOFF.md on 2026-10-21 and kept word for word. Move a line to its feature's file when you next work there.*\n\n";
export const POINTER_SECTION = [
	"## Known bugs",
	"",
	"Known bugs live one line each in `docs/known-bugs/`, one file per feature of the requirements tree, plus `docs/known-bugs/unplaced.md` for a line no feature owns. Desk known limits live in `apps/desk/README.md`.",
	"",
];

if (import.meta.url === `file://${process.argv[1]}`) {
	const raw = read("HANDOFF.md");
	const lines = raw.split("\n");
	const { start, end, items } = carriedItems(lines);
	const byFile = new Map();
	const report = [];
	for (const item of items) {
		if (FIXED.some((f) => item.text.startsWith(f))) { report.push(["fixed", item.text]); continue; }
		if (POINTER.includes(item.text)) { report.push(["pointer", item.text]); continue; }
		const p = place(item.text);
		const file = p.feature ? `${p.feature}.md` : UNPLACED_FILE;
		byFile.set(file, [...(byFile.get(file) ?? []), item.text]);
		report.push([`${file} ${p.how}${p.lane ? ` ${p.lane}` : ""}`, item.text]);
	}
	const summary = [...byFile.entries()].map(([f, l]) => `${f} ${l.length}`).sort();
	console.log(`items ${items.length}; files ${byFile.size}; ${summary.join(", ")}`);
	console.log(`fixed ${report.filter((r) => r[0] === "fixed").length}; pointer ${report.filter((r) => r[0] === "pointer").length}`);
	fs.writeFileSync(path.join(root, "docs/reviews/known-bugs-2026-10-21/placement.tsv"), report.map(([w, t]) => `${w}\t${t}`).join("\n") + "\n");
	if (dry) process.exit(0);
	fs.mkdirSync(path.join(root, KNOWN_BUGS_DIR), { recursive: true });
	for (const [file, list] of byFile) {
		const heading = file === UNPLACED_FILE ? UNPLACED_HEADING : fileHeading(file.replace(/\.md$/, ""));
		fs.writeFileSync(path.join(root, KNOWN_BUGS_DIR, file), heading + list.join("\n") + "\n");
	}
	const out = [...lines.slice(0, start), ...POINTER_SECTION, ...lines.slice(end)];
	while (out.length > 1 && out[out.length - 1] === "" && out[out.length - 2] === "") out.pop();
	fs.writeFileSync(path.join(root, "HANDOFF.md"), out.join("\n").replace(/\n*$/, "\n"));
}
