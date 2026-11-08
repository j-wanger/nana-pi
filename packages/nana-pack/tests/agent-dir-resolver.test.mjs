/**
 * @module packages/nana-pack/tests/agent-dir-resolver.test.mjs
 * @purpose Run extracted core contract guards on every land.
 * @inputs Real modules and isolated fixtures.
 * @outputs Original requirement-tagged PASS/FAIL checks.
 * @effects disk (temporary fixtures), process (bounded fixture children).
 * @errors Failed checks exit nonzero.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra); if (!ok) fails++; };
// ── exactly ONE implementation of the resolver in the repo ──
{
	const hits = spawnSync("git", ["grep", "-n", "-E", "PI_CODING_AGENT_DIR;?$|process\\.env\\.PI_CODING_AGENT_DIR", "--", "*.ts", "*.mjs", "*.js", ":!**/tests/**", ":!**/test/**"], { cwd: REPO, encoding: "utf-8" }).stdout.trim().split("\n").filter(Boolean);
	const files = [...new Set(hits.map((h) => h.split(":")[0]))];
	const allowed = new Set(["packages/nana-pack/lib/agent-dir.mjs"]);
	// req: R-190
	check("PI_CODING_AGENT_DIR is resolved only by agent-dir.mjs", files.every((f) => allowed.has(f)), hits.join("\n"));
}


if (fails) process.exitCode = 1;
