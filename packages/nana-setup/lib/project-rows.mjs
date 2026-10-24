/**
 * @module packages/nana-setup/lib/project-rows.mjs
 * @purpose Decide the project check's file-state rows from the project's files alone.
 * @inputs a project directory, date, text reader, Node filesystem and path APIs, and the canonical working region.
 * @outputs lstat(), seedEntry(), today(), projectFileRows(), CLAUDE_IMPORT and PLACEHOLDER_RE.
 * @effects disk (lstats entries, lists the sessions directory, resolves links and reads through the supplied text reader).
 * @errors AGENTS.md read errors propagate; CLAUDE.md read errors become a failing row.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { readSharedWorking, regionVerdict } from "./working-region.mjs";

export function today(d = new Date()) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function lstat(p) {
	try {
		return fs.lstatSync(p);
	} catch {
		return null;
	}
}

/** Classify a seed without crossing an odd entry. Live links to intermediate folders remain valid. */
export function seedEntry(dir, rel) {
	const parts = rel.split("/");
	let current = dir;
	for (let i = 0; i < parts.length; i++) {
		current = path.join(current, parts[i]);
		const st = lstat(current);
		if (!st) return { kind: "absent" };
		const last = i === parts.length - 1;
		if (last) {
			if (st.isFile() && !st.isSymbolicLink()) return { kind: "file" };
			if (st.isSymbolicLink()) {
				let target = "?";
				try { target = fs.readlinkSync(current); } catch { /* unreadable link */ }
				return { kind: "odd", found: `a symlink -> ${target}` };
			}
			if (st.isDirectory()) return { kind: "odd", found: "a directory" };
			return { kind: "odd", found: "not a regular file" };
		}
		if (st.isDirectory() && !st.isSymbolicLink()) continue;
		const folder = parts.slice(0, i + 1).join("/");
		if (st.isSymbolicLink()) {
			let target = "?";
			try { target = fs.readlinkSync(current); } catch { /* unreadable link */ }
			try {
				if (fs.statSync(current).isDirectory()) continue;
			} catch { /* dangling or unreadable */ }
			return { kind: "odd", found: `a symlink -> ${target} at ${folder}` };
		}
		if (st.isFile()) return { kind: "odd", found: `a file at ${folder}` };
		return { kind: "odd", found: `not a directory at ${folder}` };
	}
	return { kind: "absent" };
}

/** The one-line import, on every platform. */
export const CLAUDE_IMPORT = "@AGENTS.md\n";

/** Exactly the placeholder produced when Git checks out a CLAUDE.md link without link support. */
export const PLACEHOLDER_RE = /^AGENTS\.md\r?\n?$/;

export function projectFileRows(dir, { date = new Date(), readText = (file) => fs.readFileSync(file, "utf8") } = {}) {
	const fileState = (rel) => {
		const entry = seedEntry(dir, rel);
		return entry.kind === "file"
			? { ok: true, found: null }
			: { ok: false, found: entry.kind === "odd" ? entry.found : null };
	};
	const seed = (rel, meaning, label = rel) => {
		const state = fileState(rel);
		return {
			label,
			ok: state.ok,
			byHand: Boolean(state.found),
			detail: state.found ? `${state.found} is there — not a readable ${rel}; move or remove it by hand` : meaning,
		};
	};
	const monthFiles = (() => {
		try {
			return fs.readdirSync(path.join(dir, "docs", "sessions"), { withFileTypes: true })
				.filter((entry) => entry.isFile() && /^\d{4}-(0[1-9]|1[0-2])\.md$/.test(entry.name))
				.map((entry) => entry.name).sort();
		} catch { return []; }
	})();
	const monthRel = `docs/sessions/${today(date).slice(0, 7)}.md`;
	const monthState = fileState(monthRel);
	const rows = [
		seed("OBJECTIVE.md", "the two lines the session-start hook prints (labelled UNTRUSTED DATA while no usable affirmative trust record is confirmed for this folder; the label names the next step it can see)"),
		seed("HANDOFF.md", "the frontier"),
		seed("docs/sessions/README.md", "the narrative's rules"),
		{
			label: "docs/sessions/YYYY-MM.md",
			projectLabel: monthRel,
			ok: monthFiles.length > 0,
			byHand: !monthFiles.length && Boolean(monthState.found),
			detail: monthFiles.length
				? monthFiles.join(", ")
				: monthState.found
					? `${monthState.found} is there — not a readable ${monthRel}; move or remove it by hand`
					: "no docs/sessions/YYYY-MM.md file",
		},
	];

	const agentPath = path.join(dir, "AGENTS.md");
	const agentState = lstat(agentPath);
	if (agentState?.isFile() && !agentState.isSymbolicLink()) {
		// Deliberately unguarded: project --check has always surfaced an AGENTS.md read error.
		const body = readText(agentPath);
		if (body !== null) {
			const verdict = regionVerdict(body, readSharedWorking());
			if (verdict === "malformed") {
				rows.push({ label: "AGENTS.md working region", ok: false, note: true, byHand: false, detail: "markers absent or malformed — wrap the section once with the nana markers" });
			} else {
				rows.push({ label: "AGENTS.md working region", ok: verdict === "match", byHand: false, detail: verdict === "match" ? "matches shared section" : `differs — fix: nana-setup project ${dir}` });
			}
		}
	} else if (agentState?.isSymbolicLink()) {
		rows.push({ label: "AGENTS.md working region", ok: false, byHand: true, detail: "AGENTS.md is a symlink — left alone; move or remove it by hand" });
	}

	const agents = fileState("AGENTS.md");
	const claude = fileState("CLAUDE.md");
	if (agents.ok) rows.push({ label: "AGENTS.md", ok: true, byHand: false, detail: "the navigation file" });
	else if (agents.found) rows.push({ label: "AGENTS.md", ok: false, byHand: true, detail: `${agents.found} is there — not a readable AGENTS.md; move or remove it by hand` });
	else rows.push({
		label: "AGENTS.md",
		ok: claude.ok,
		byHand: !claude.ok && Boolean(claude.found),
		detail: claude.ok
			? "CLAUDE.md, the project's own — no AGENTS.md by design"
			: claude.found
				? `AGENTS.md (or a CLAUDE.md the project already had) — ${claude.found} is at CLAUDE.md; move or remove it by hand`
				: "AGENTS.md (or a CLAUDE.md the project already had)",
	});

	const claudePath = path.join(dir, "CLAUDE.md");
	const st = lstat(claudePath);
	if (agents.ok && st) {
		if (st.isSymbolicLink()) {
			const raw = (() => {
				try { return fs.readlinkSync(claudePath); }
				catch { return null; }
			})();
			const real = (p) => {
				try { return fs.realpathSync(p); }
				catch { return null; }
			};
			const resolved = real(claudePath);
			const want = real(path.join(dir, "AGENTS.md"));
			const linked = Boolean(resolved && want && resolved === want);
			rows.push({
				label: "CLAUDE.md",
				ok: linked,
				byHand: !linked,
				detail: linked ? "-> AGENTS.md" : `a symlink -> ${raw ?? "?"} — ${resolved ? "not this project's AGENTS.md" : "dangling"}; move or remove it by hand`,
			});
		} else if (st.isFile()) {
			const bytes = (() => {
				try { return readText(claudePath); }
				catch { return null; }
			})();
			const ok = bytes === CLAUDE_IMPORT;
			const placeholder = bytes !== null && PLACEHOLDER_RE.test(bytes);
			rows.push({
				label: "CLAUDE.md",
				ok,
				byHand: !ok && !placeholder,
				detail: ok
					? "the one-line import @AGENTS.md"
					: placeholder
						? "holds the AGENTS.md placeholder text — a symlink checked out without symlink support; run nana-setup project to replace it"
						: "not the one-line import @AGENTS.md — fold this project's own CLAUDE.md into AGENTS.md and leave only the line @AGENTS.md here by hand",
			});
		} else {
			rows.push({ label: "CLAUDE.md", ok: false, byHand: true, detail: "a directory is there; move or remove it by hand" });
		}
	}
	return rows;
}
