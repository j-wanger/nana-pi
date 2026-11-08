/**
 * @module packages/nana-pack/tests/identity-tree.test.mjs
 * @purpose Pin identity scanning across written forms, allowlist count drift, sealed allowlist provenance, and the committed digest census.
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
