/**
 * @module packages/nana-pack/tests/identity-scan.test.mjs
 * @purpose Pin identity scanning across written forms, allowlist count drift, and the committed digest census.
 * @inputs temporary git trees, injected scan configs, the committed identity scan config, and scripts/identity-scan.mjs
 * @outputs named PASS/FAIL checks and a nonzero test exit when an assertion fails
 * @effects disk (OS temporary git fixtures only); process (runs git in those fixtures)
 * @errors failed assertions are reported and cause exit 1; unexpected fixture or scan errors reject the run
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { countIdentityWords, scanTree } from "../../../scripts/identity-scan.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let fails = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) fails++;
};
const digest = (word) => createHash("sha256").update(word.toLowerCase()).digest("hex");

function gitTree(label, entries) {
	const root = tmpDir(path.join(os.tmpdir(), `identity-scan-${label}-`));
	execFileSync("git", ["init", "-q", root]);
	for (const [relative, content] of Object.entries(entries)) {
		const target = path.join(root, relative);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, content);
	}
	execFileSync("git", ["-C", root, "add", "."]);
	return root;
}

{
	const word = "quux";
	const entries = {
		"case-upper.txt": "QUUX\r\n",
		"case-possessive.txt": "quux's",
		"quux/segment.txt": "clear",
		"case-hyphen.txt": "left-quux-right",
		"case-snake.txt": "left_quux_right",
		"case-camel.txt": "leftQuuxRight",
		"file-quux.txt": "clear",
		"case-mixed.txt": "dQuux8C",
	};
	const root = gitTree("forms", entries);
	const config = { wordDigests: [digest(word)], wordLengths: [word.length], allowlist: [] };
	const result = scanTree({ root: path.join(root, "quux"), config });
	const reported = new Set(result.findings.map((finding) => finding.path));
	const expected = Object.keys(entries).filter((relative) => relative !== "case-mixed.txt");
	const lfCounts = countIdentityWords({ path: "", content: "QUUX\n", config });
	const crlfCounts = countIdentityWords({ path: "", content: "QUUX\r\n", config });
	// req: R-2512
	check("the scan finds identity words in every written form",
		expected.every((relative) => reported.has(relative)) && !reported.has("case-mixed.txt") &&
		result.scannedFiles === Object.keys(entries).length && JSON.stringify(lfCounts) === JSON.stringify(crlfCounts),
		JSON.stringify({ expected, findings: result.findings, scannedFiles: result.scannedFiles, lfCounts, crlfCounts }));
	fs.rmSync(root, { recursive: true, force: true });
}

{
	const words = ["quux", "vext"];
	const root = gitTree("allowlist", { "record.txt": "quux quux vext" });
	const config = {
		wordDigests: words.map(digest),
		wordLengths: words.map((word) => word.length),
		allowlist: [{ path: "record.txt", counts: [2, 1], reason: "record" }],
	};
	const mutations = [
		{ name: "one more", content: "quux quux quux vext", indices: [0] },
		{ name: "one fewer", content: "quux vext", indices: [0] },
		{ name: "swapped", content: "quux vext vext", indices: [0, 1] },
	].map(({ name, content, indices }) => {
		fs.writeFileSync(path.join(root, "record.txt"), content);
		const result = scanTree({ root, config });
		return {
			name,
			ok: indices.every((wordIndex) => result.findings.some((finding) => finding.path === "record.txt" && finding.wordIndex === wordIndex)),
			findings: result.findings,
		};
	});
	// req: R-2513
	check("an allowlisted file with one more, one fewer or swapped identity words is reported",
		mutations.every((mutation) => mutation.ok), JSON.stringify(mutations));
	fs.rmSync(root, { recursive: true, force: true });
}

{
	const config = JSON.parse(fs.readFileSync(path.join(REPO, "identity-scan.config.json"), "utf8"));
	const expected = [
		"cdf30c6b345276278bedc7bcedd9d5582f5b8e0c1dd858f46ef4ea231f92731d",
		"bac080aab1142c3d251ae1ecad795693dce90da3d614178ac6e2baf47d920dd0",
		"2ac81299578013795576682809a4a16d1ecca67118a797ea576c113c41786849",
		"22775a0eeeb56ca5f021663d7fa549fa699859e8561cefae37f41547ad277f9e",
	];
	// req: R-2511
	check("seal: identity word digests", JSON.stringify(config.wordDigests) === JSON.stringify(expected), JSON.stringify(config.wordDigests));
}

if (fails) process.exitCode = 1;
