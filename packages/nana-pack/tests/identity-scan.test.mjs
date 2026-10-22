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
import { execFileSync, spawnSync } from "node:child_process";
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
	const root = tmpDir(path.join(os.tmpdir(), "identity-scan-refuse-"));
	execFileSync("git", ["init", "-q", root]);
	const configPath = path.join(root, "identity-scan.config.json");
	fs.copyFileSync(path.join(REPO, "identity-scan.config.json"), configPath);
	execFileSync("git", ["-C", root, "add", "identity-scan.config.json"]);
	const before = fs.readFileSync(configPath);
	const result = spawnSync(process.execPath, [path.join(REPO, "scripts/identity-scan.mjs"), "--root", root, "--write-allowlist"], { encoding: "utf8" });
	// req: R-2519
	check("the scan refuses to rewrite its allowlist", result.status === 2 && before.equals(fs.readFileSync(configPath)),
		JSON.stringify({ status: result.status, changed: !before.equals(fs.readFileSync(configPath)), stderr: result.stderr }));
	fs.rmSync(root, { recursive: true, force: true });
}

{
	const root = tmpDir(path.join(os.tmpdir(), "identity-scan-large-index-"));
	execFileSync("git", ["init", "-q", root]);
	const empty = execFileSync("git", ["-C", root, "hash-object", "-w", "--stdin"], { input: "", encoding: "utf8" }).trim();
	const paths = Array.from({ length: 9_000 }, (_, index) => `${String(index).padStart(4, "0")}-${"x".repeat(120)}.txt`);
	const indexInfo = paths.map((relative) => `100644 ${empty}\t${relative}\n`).join("");
	execFileSync("git", ["-C", root, "update-index", "--index-info"], { input: indexInfo });
	const word = "quux";
	const config = { wordDigests: [digest(word)], wordLengths: [word.length], allowlist: [] };
	let result = null;
	let error = "";
	try { result = scanTree({ root, config }); } catch (caught) { error = caught.message; }
	// req: R-2520
	check("the scan reads a tracked list over 1 MiB", result?.scannedFiles === paths.length,
		JSON.stringify({ scannedFiles: result?.scannedFiles, expectedFiles: paths.length, error }));
	fs.rmSync(root, { recursive: true, force: true });
}

{
	const config = JSON.parse(fs.readFileSync(path.join(REPO, "identity-scan.config.json"), "utf8"));
	const expectedFiles = execFileSync("git", ["-C", REPO, "ls-files", "-z"], { maxBuffer: Infinity })
		.toString("utf8").split("\0").filter(Boolean).length;
	const result = scanTree({ root: ".", config });
	// req: R-2511
	check("no tracked file outside the allowlist carries an identity word",
		result.scannedFiles === expectedFiles && result.findings.length === 0,
		JSON.stringify({ scannedFiles: result.scannedFiles, expectedFiles, findings: result.findings.map(({ path: findingPath, wordIndex }) => ({ path: findingPath, wordIndex })), command: "node scripts/identity-scan.mjs --root .", totals: result.totals }));
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
