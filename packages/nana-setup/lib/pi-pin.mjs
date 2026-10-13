/**
 * @module packages/nana-setup/lib/pi-pin.mjs
 * @purpose Read the root CI pi version and cutoff and format a safe install hint.
 * @inputs Checkout root and workflow text.
 * @outputs CI_WORKFLOW, parsePiPin, readPiPin and pinPiInstall.
 * @effects disk (readPiPin only)
 * @errors Missing or malformed workflow data returns null; file read errors return null.
 */
import fs from "node:fs";
import path from "node:path";

export const CI_WORKFLOW = [".github", "workflows", "ci.yml"];

export function parsePiPin(text) {
	if (typeof text !== "string") return null;
	const lines = text.split(/\r?\n/);
	const versionLine = lines.find((line) => /^  PI_VERSION: (\S+)$/.test(line));
	const beforeLine = lines.find((line) => /^  PI_BEFORE: "([^"]*)"$/.test(line));
	const version = versionLine?.match(/^  PI_VERSION: (\S+)$/)?.[1];
	const before = beforeLine?.match(/^  PI_BEFORE: "([^"]*)"$/)?.[1];
	if (!version || !before || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(before)) return null;
	const date = new Date(before);
	if (Number.isNaN(date.valueOf()) || date.toISOString().replace(".000Z", "Z") !== before) return null;
	return { version, before };
}

export function readPiPin(root) {
	try {
		return parsePiPin(fs.readFileSync(path.join(root, ...CI_WORKFLOW), "utf8"));
	} catch {
		return null;
	}
}

export function pinPiInstall(command, pin) {
	return pin?.version && pin?.before
		? `${command}@${pin.version} --before=${pin.before}`
		: `${command}@<version> --before=<cutoff>`;
}
