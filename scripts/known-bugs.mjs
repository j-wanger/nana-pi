/**
 * @module scripts/known-bugs.mjs
 * @purpose Check known-bug entry names against live requirements features and report files beyond one default read window.
 * @inputs a repository root, its REQUIREMENTS.md ledger when present, and its known-bugs directory
 * @outputs name findings and informational size lines; the CLI prints findings and a summary
 * @effects disk (reads the ledger and known-bug entries); process (CLI output and exit status)
 * @errors missing or unreadable inputs become name findings; malformed CLI options exit 2
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { READ_WINDOW_BYTES, READ_WINDOW_LINES } from "../packages/nana-pack/lib/frontier-config.mjs";
import { KNOWN_BUGS_DIR, UNPLACED_FILE } from "../packages/nana-pack/lib/known-bugs-config.mjs";
import { parseLedger } from "./requirements-tree.mjs";

export { KNOWN_BUGS_DIR, UNPLACED_FILE };

const FEATURE_FILE = /^(FEAT-\d{3})\.md$/;
const byName = (left, right) => left.name.localeCompare(right.name, "en");

function liveFeatures(root) {
	const ledger = path.join(root, "REQUIREMENTS.md");
	if (!fs.existsSync(ledger)) return new Set();
	const parsed = parseLedger(fs.readFileSync(ledger, "utf8"));
	return new Set(parsed.headings
		.filter((heading) => heading.id.startsWith("FEAT-") && (heading.status === "active" || heading.status?.startsWith("frozen")))
		.map((heading) => heading.id));
}

export function checkKnownBugs({ root }) {
	const absoluteRoot = path.resolve(root);
	const directory = path.join(absoluteRoot, KNOWN_BUGS_DIR);
	const nameFindings = [];
	const sizeLines = [];
	let live;
	try {
		live = liveFeatures(absoluteRoot);
	} catch (error) {
		nameFindings.push({ name: "REQUIREMENTS.md", detail: `cannot read the requirements ledger: ${error.message}` });
		live = new Set();
	}
	let entries;
	try {
		entries = fs.readdirSync(directory, { withFileTypes: true }).sort(byName);
	} catch (error) {
		return {
			nameFindings: [...nameFindings, { name: KNOWN_BUGS_DIR, detail: `cannot read the known-bugs folder: ${error.message}` }],
			sizeLines,
		};
	}
	for (const entry of entries) {
		const feature = FEATURE_FILE.exec(entry.name)?.[1];
		if (entry.name !== UNPLACED_FILE && (!feature || !live.has(feature))) {
			nameFindings.push({ name: entry.name, detail: "entry is not the unplaced file or a live feature file" });
		}
		if (!entry.isFile()) continue;
		try {
			const text = fs.readFileSync(path.join(directory, entry.name), "utf8");
			const bytes = Buffer.byteLength(text, "utf8");
			const lines = text.split(/\r\n|\r|\n/);
			const hasFinalEol = /(?:\r\n|\r|\n)$/.test(text);
			const lineCount = lines.length - (hasFinalEol ? 1 : 0);
			if (bytes > READ_WINDOW_BYTES || lineCount > READ_WINDOW_LINES) {
				sizeLines.push({ name: entry.name, bytes, lines: lineCount });
			}
		} catch (error) {
			nameFindings.push({ name: entry.name, detail: `cannot read entry: ${error.message}` });
		}
	}
	return { nameFindings, sizeLines };
}

function runCli(argv) {
	if (argv.length !== 2 || argv[0] !== "--root" || !argv[1]) {
		console.error("usage: known-bugs.mjs --root <dir>");
		return 2;
	}
	const result = checkKnownBugs({ root: argv[1] });
	for (const finding of result.nameFindings) console.log(`${finding.name}: name: ${finding.detail}`);
	for (const line of result.sizeLines) console.log(`${line.name}: size: bytes=${line.bytes} lines=${line.lines}`);
	console.log(`summary names=${result.nameFindings.length} sizes=${result.sizeLines.length}`);
	return result.nameFindings.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	process.exitCode = runCli(process.argv.slice(2));
}
