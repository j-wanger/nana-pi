/**
 * @module docs/reviews/precedent-line-parse-2026-11-02/corpus.mjs
 * @purpose Audit main's literal brief corpus against the old and revised shared parsers.
 * @inputs Git main tree and shared parser exports.
 * @outputs JSON lines with every bullet and counts by kind.
 * @effects process (git reads)
 * @errors Git failures abort the audit.
 */
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import * as path from "node:path";
import { readBrief, checkPrecedent, entryText } from "../../../packages/nana-pack/lib/brief-precedent.mjs";
import { scanListSections } from "../../../packages/nana-pack/lib/markdown-list-sections.mjs";
const git = (...args) => execFileSync("git", args, { encoding: "utf8", timeout: 30000, maxBuffer: 32 * 1024 * 1024 });
const modulePath = "packages/nana-pack/lib/brief-precedent.mjs";
const oldSource = git("show", `main:${modulePath}`).replace(/from "(\.\/[^\"]+)"/g, (_, relative) => `from ${JSON.stringify(pathToFileURL(path.resolve(path.dirname(modulePath), relative)).href)}`);
const old = await import(`data:text/javascript;base64,${Buffer.from(oldSource).toString("base64")}`);
const tracked = git("ls-tree", "-rz", "--name-only", "main").split("\0").filter(Boolean);
const files = tracked.filter((file) => file.startsWith("docs/reviews/") && /[^/]*(?:brief|plan)[^/]*\.md$/.test(file));
const counts = {};
const changedOutcomes = [];
const directions = { acceptedToRefused: 0, refusedToAccepted: 0 };
const changedExtensionless = [];
let sections = 0;
for (const file of files) {
	const text = git("show", `main:${file}`);
	const before = old.readBrief(text).precedent;
	if (!before) continue;
	sections++;
	const after = readBrief(text).precedent;
	const raw = scanListSections(text, { headingMatches: () => true, label: ["Precedent:", "**Precedent:**", "**Precedent**:"] }).flatMap((section) => section.entries);
	for (let index = 0; index < before.length; index++) {
		const prior = before[index], next = after[index];
		const bullet = entryText(raw.find((entry) => entry.line === prior.line));
		const clean = bullet.replaceAll("**", "");
		const first = prior.value;
		const kind = prior.kind.includes("none") ? "none" : clean.startsWith("`") ? "backticked-first" : first.includes("/") || /^[\w.-]+\.[A-Za-z0-9]+$/.test(first) ? "bare-path-first" : clean.includes("`") ? "prose-with-span" : "bare-word";
		const oldPass = old.checkPrecedent([prior], tracked).length === 0;
		const newPass = checkPrecedent([next], tracked).length === 0;
		const changedValue = prior.value !== next.value;
		const record = { file, line: prior.line, kind, bullet, oldValue: prior.value, newValue: next.value, oldPass, newPass };
		console.log(JSON.stringify(record));
		const count = counts[kind] ??= { bullets: 0, changedValues: 0, changedOutcomes: 0, acceptedToRefused: 0, refusedToAccepted: 0 };
		count.bullets++; count.changedValues += Number(changedValue); count.changedOutcomes += Number(oldPass !== newPass);
		if (oldPass !== newPass) {
			changedOutcomes.push(record);
			const direction = oldPass ? "acceptedToRefused" : "refusedToAccepted";
			count[direction]++; directions[direction]++;
		}
		if (kind === "prose-with-span" && changedValue) changedExtensionless.push(record);
	}
}
console.log("SUMMARY", JSON.stringify({ sections, directions, counts }));
console.log("CHANGED OUTCOMES", JSON.stringify(changedOutcomes));
console.log("CHANGED EXTENSIONLESS FIRST WORD SELECTIONS", JSON.stringify(changedExtensionless));
if (directions.acceptedToRefused !== 0 || counts["bare-path-first"]?.changedOutcomes !== 0) process.exitCode = 1;
