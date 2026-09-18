// File operations shared by the steps. Every one of them reports what it did rather than
// doing it silently, and none of them destroys anything: a regular file in the way is backed
// up before a symlink replaces it.
import * as fs from "node:fs";
import * as path from "node:path";

export const CREATED = "created";
export const UPDATED = "updated";
export const UNCHANGED = "unchanged";
export const SKIPPED = "skipped";

export function stamp(d = new Date()) {
	return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

/** `<name>.bak-<YYYYMMDD>`, with a counter when that already exists. */
export function backupPath(target, d = new Date()) {
	const base = `${target}.bak-${stamp(d)}`;
	if (!fs.existsSync(base)) return base;
	for (let i = 2; i < 100; i++) {
		const p = `${base}-${i}`;
		if (!fs.existsSync(p)) return p;
	}
	return `${base}-${Date.now()}`;
}

function lstat(p) {
	try {
		return fs.lstatSync(p);
	} catch {
		return null;
	}
}

/**
 * Symlink `target` -> `source`. Idempotent: an existing link to the same source is left alone.
 * A REGULAR file (or directory) in the way is backed up first and the backup is reported.
 * On a platform without usable symlinks the file is copied instead, and says so.
 */
export function linkFile(target, source, { dryRun = false, copyInstead = false } = {}) {
	const st = lstat(target);
	const resolved = path.resolve(source);
	if (copyInstead) {
		// The copy path owes the same no-destruction guarantee as the symlink path (sol r1):
		// back up a regular file first, and NEVER write through a symlink — that would silently
		// overwrite whatever the link points at.
		const want = fs.readFileSync(source);
		if (st?.isFile() && !st.isSymbolicLink() && fs.readFileSync(target).equals(want)) return { status: UNCHANGED, detail: "copy" };
		if (dryRun) {
			if (!st) return { status: CREATED, detail: "would copy" };
			return { status: UPDATED, detail: st.isSymbolicLink() ? "would replace a symlink with a copy" : `would back up to ${path.basename(backupPath(target))} and copy` };
		}
		fs.mkdirSync(path.dirname(target), { recursive: true });
		let detail = "copied (no symlink on this platform)";
		if (st?.isSymbolicLink()) {
			fs.unlinkSync(target);
			detail = "replaced a symlink with a copy (the link's target was not written through)";
		} else if (st) {
			const bak = backupPath(target);
			fs.renameSync(target, bak);
			detail = `backed up ${path.basename(target)} -> ${path.basename(bak)}, then copied`;
		}
		fs.writeFileSync(target, want);
		return { status: st ? UPDATED : CREATED, detail };
	}
	if (st?.isSymbolicLink()) {
		const current = path.resolve(path.dirname(target), fs.readlinkSync(target));
		if (current === resolved) return { status: UNCHANGED, detail: null };
		if (dryRun) return { status: UPDATED, detail: `would relink (was ${current})` };
		fs.unlinkSync(target);
		fs.symlinkSync(resolved, target);
		return { status: UPDATED, detail: `relinked (was ${current})` };
	}
	if (st) {
		const bak = backupPath(target);
		if (dryRun) return { status: UPDATED, detail: `would back up to ${path.basename(bak)} and link` };
		fs.renameSync(target, bak);
		fs.symlinkSync(resolved, target);
		return { status: UPDATED, detail: `backed up ${path.basename(target)} -> ${path.basename(bak)}` };
	}
	if (dryRun) return { status: CREATED, detail: "would link" };
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.symlinkSync(resolved, target);
	return { status: CREATED, detail: null };
}

/**
 * Write `contents` only when `target` does not exist. Never overwrites, never diffs.
 *
 * Existence is decided by `lstat`, NOT `existsSync` (sol r1, HIGH): `existsSync` follows the
 * link, so a DANGLING symlink reads as absent — and writing "the missing file" would create
 * the link's target instead, writing straight through a file entry the owner put there. Any
 * non-regular entry (a symlink of any kind, a directory) is therefore reported as present,
 * naming what was found, and nothing is written.
 */
export function seedFile(target, contents, { dryRun = false } = {}) {
	const st = lstat(target);
	if (st?.isSymbolicLink()) {
		let to = "";
		try {
			to = ` -> ${fs.readlinkSync(target)}`;
		} catch {
			/* unreadable link */
		}
		return { status: SKIPPED, detail: `a symlink${to} is there — left untouched, nothing written through it` };
	}
	if (st?.isDirectory()) return { status: SKIPPED, detail: "a directory is there — left untouched" };
	if (st) return { status: UNCHANGED, detail: "already present, left untouched" };
	if (dryRun) return { status: CREATED, detail: "would create" };
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, contents);
	return { status: CREATED, detail: null };
}

export function ensureDir(target, { dryRun = false } = {}) {
	if (fs.existsSync(target)) return { status: UNCHANGED, detail: null };
	if (dryRun) return { status: CREATED, detail: "would create" };
	fs.mkdirSync(target, { recursive: true });
	return { status: CREATED, detail: null };
}

export function writeIfChanged(target, contents, { dryRun = false } = {}) {
	let current = null;
	try {
		current = fs.readFileSync(target, "utf8");
	} catch {
		/* absent */
	}
	if (current === contents) return { status: UNCHANGED, detail: null };
	if (dryRun) return { status: current === null ? CREATED : UPDATED, detail: "dry run" };
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, contents);
	return { status: current === null ? CREATED : UPDATED, detail: null };
}
