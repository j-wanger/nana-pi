#!/usr/bin/env node
// Seat check for lane known-bugs (2026-10-21): every known-bug line in the base revision's HANDOFF.md Carried
// residuals lands, word for word and at least as many times, in a docs/known-bugs/ file, unless move.mjs names it as
// FIXED by this lane or as POINTER text. Lines in the files that the base does not hold are listed as added. Re-run it at
// the final tip, and again after every merge of main, from the worktree root:
//   node docs/reviews/known-bugs-2026-10-21/conserve.mjs [--base <rev>]   (default: git merge-base HEAD main)
// Exit 0 when nothing is lost; 1 with each lost line named.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const CARRIED = "## Carried residuals";
const DIR = "docs/known-bugs";
const FIXED = [
	"- Frontier checks (frontier-first, plan): the whole-file size finding stays until known bugs move to one file per feature.",
	"- Frontier checks (frontier-first, plan): Claude Code still cannot read this file in one call.",
];
const POINTER = ["- Desk residuals live in `apps/desk/README.md` Known limits."];

const root = process.cwd();
const git = (args) => {
	const r = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
	if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.trim()}`);
	return r.stdout;
};
const at = process.argv.indexOf("--base");
const base = at > 0 ? process.argv[at + 1] : git(["merge-base", "HEAD", "main"]).trim();

const count = (list) => list.reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());
const items = (text, from) => {
	const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
	let start = 0, end = lines.length;
	if (from) {
		start = lines.findIndex((l) => l.startsWith(from));
		if (start < 0) return null;
		for (let i = start + 1; i < lines.length; i++) if (/^#{1,2} /.test(lines[i])) { end = i; break; }
	}
	return lines.slice(start, end).filter((l) => l.startsWith("- "));
};

const baseItems = items(git(["show", `${base}:HANDOFF.md`]), CARRIED);
if (!baseItems) { console.log(`conserve: ${base.slice(0, 8)}'s HANDOFF.md has no Carried residuals section; nothing to conserve`); process.exit(0); }
const files = fs.existsSync(path.join(root, DIR)) ? fs.readdirSync(path.join(root, DIR)).filter((f) => f.endsWith(".md")).sort() : [];
const current = files.flatMap((f) => items(fs.readFileSync(path.join(root, DIR, f), "utf8"), null));
const left = items(fs.readFileSync(path.join(root, "HANDOFF.md"), "utf8"), CARRIED) ?? [];

const have = count(current);
const lost = [], fixed = [], pointer = [];
for (const [line, n] of count(baseItems)) {
	if (FIXED.some((f) => line.startsWith(f))) { fixed.push(line); continue; }
	if (POINTER.includes(line)) { pointer.push(line); continue; }
	if ((have.get(line) ?? 0) < n) lost.push(`${n - (have.get(line) ?? 0)}x ${line}`);
}
const baseSet = new Set(baseItems);
const added = current.filter((l) => !baseSet.has(l));
console.log(`conserve: base ${base.slice(0, 8)} holds ${baseItems.length} known-bug lines; ${files.length} files hold ${current.length}; fixed ${fixed.length}, pointer ${pointer.length}, added ${added.length}, lost ${lost.length}, left in HANDOFF ${left.length}`);
for (const l of fixed) console.log(`FIXED ${l.slice(0, 160)}`);
for (const l of added) console.log(`ADDED ${l.slice(0, 160)}`);
for (const l of lost) console.log(`LOST ${l.slice(0, 200)}`);
for (const l of left) console.log(`LEFT ${l.slice(0, 160)}`);
process.exit(lost.length || left.length ? 1 : 0);
