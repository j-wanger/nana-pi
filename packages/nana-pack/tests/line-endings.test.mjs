/**
 * @module packages/nana-pack/tests/line-endings.test.mjs
 * @purpose Pin that this repository's `.gitattributes` checks out every text file as LF, whatever the cloning machine's `core.autocrlf` is (R-1320).
 * @inputs this checkout, cloned locally into a temp folder with `core.autocrlf=true`
 * @outputs PASS/FAIL lines on stdout, a non-zero exit when any check fails
 * @effects disk (a local git clone under the OS temp directory, removed on process exit)
 * @errors a FAIL line naming the file that still carries a CR byte
 */
// R-1320's own rehearsal, run as a suite check rather than only by hand: a clone made with
// core.autocrlf=true — Git for Windows' installer default — must still give LF text files,
// because `.gitattributes`' `eol=lf` normalizes the checkout regardless of that setting. The
// clone writes nothing back into this checkout; it is a throwaway copy under the OS temp
// directory, removed when this process exits (tmp-dir.mjs).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

// ── R-1320 ───────────────────────────────────────────────────────────────────────────────────────
{
	const dest = path.join(tmpDir(path.join(os.tmpdir(), "line-endings-clone-")), "clone");
	execFileSync(
		"git",
		["clone", "-q", "--local", "--no-hardlinks", "-c", "core.autocrlf=true", REPO, dest],
		{ stdio: "ignore" },
	);

	const FILES = ["AGENTS.md", ".github/workflows/ci.yml", "docs/requirements-tree.md"];
	const withCr = FILES.filter((f) => readFileSync(path.join(dest, f), "utf8").includes("\r"));
	const attrs = readFileSync(path.join(dest, ".gitattributes"), "utf8");
	const keepsFixturesLine = attrs.includes("packages/nana-setup/tests/fixtures/retired/** -whitespace");
	// req: R-1320
	check("R-1320: a clone made with core.autocrlf=true checks out AGENTS.md, the CI workflow and the requirements tree with LF line endings", withCr.length === 0 && keepsFixturesLine, JSON.stringify({ withCr, keepsFixturesLine, attrs }));
}

process.exitCode = fails ? 1 : 0;
