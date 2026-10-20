/**
 * @module packages/nana-setup/lib/copy-record.mjs
 * @purpose Track the last bytes Windows install wrote to each managed copy so unchanged copies refresh without backups.
 * @inputs An absolute record path; its regular-file JSON object; managed target paths and source bytes; { dryRun }.
 * @outputs openCopyRecord(file) returning { unedited(target), remember(target, bytes), save(o) }; save rows labelled copy record.
 * @effects disk (reads regular targets and the record; save writes the record through writeIfChanged).
 * @errors Record read, parse and shape failures become an empty record; save catches every error and returns one SKIPPED row.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { SKIPPED, writeIfChanged } from "./fsops.mjs";

/** chosen: sha256 gives a standard fixed-size content identity; collision forgery is outside the threat model. */
export const COPY_RECORD_HASH = "sha256";

function digest(bytes) {
	return createHash(COPY_RECORD_HASH).update(bytes).digest("hex");
}

function emptyOrParsed(file) {
	try {
		const stat = fs.lstatSync(file);
		if (!stat.isFile() || stat.isSymbolicLink()) return {};
		const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") return {};
		if (!Object.entries(parsed).every(([target, hash]) => path.isAbsolute(target) && typeof hash === "string" && /^[0-9a-f]{64}$/u.test(hash))) return {};
		return parsed;
	} catch {
		return {};
	}
}

function skippedRow(file, cause = "") {
	const suffix = cause ? ` (${cause})` : "";
	return [{
		label: "copy record",
		status: SKIPPED,
		detail: `${file} was not saved${suffix}; the next update backs up each changed copy`,
	}];
}

export function openCopyRecord(file) {
	const earlier = emptyOrParsed(file);
	const remembered = {};
	return {
		unedited(target) {
			try {
				const stat = fs.lstatSync(target);
				return stat.isFile() && !stat.isSymbolicLink() && earlier[target] === digest(fs.readFileSync(target));
			} catch {
				return false;
			}
		},
		remember(target, bytes) {
			remembered[target] = digest(bytes);
		},
		save(o = {}) {
			if (o.dryRun || Object.keys(remembered).length === 0) return [];
			try {
				const entries = Object.fromEntries(Object.entries({ ...earlier, ...remembered }).sort(([left], [right]) => left.localeCompare(right)));
				const result = writeIfChanged(file, `${JSON.stringify(entries, null, 2)}\n`);
				if (result.status === SKIPPED) return skippedRow(file, result.detail);
				return [{ label: "copy record", ...result }];
			} catch (error) {
				return skippedRow(file, error?.message ?? String(error));
			}
		},
	};
}
