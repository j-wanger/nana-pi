/**
 * @module packages/nana-pack/tests/review-standard.test.mjs
 * @purpose Pins the review standard's required verdict and MUST text, and pi-review's refusal before admission when the standard file is missing, not a regular file, or blank.
 * @inputs packages/nana-pack/prompts/review-standard.md, a temporary copy of bin/, lib/review-standard.mjs, lib/verdict-config.mjs, lib/win-command.mjs, lib/win-command-config.mjs, lib/real-path.mjs and prompts/, a stub pi executable (./fake-pi.mjs on win32), and a temporary git repository.
 * @outputs PASS/FAIL lines per check on stdout, and a nonzero exit when any check fails.
 * @effects disk (a pack copy, a scratch HOME and a scratch git repository under the OS temp dir), process (spawns the copied pi-review.mjs against a stub pi)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STANDARD_TEXT = fs.readFileSync(path.join(PACK, "prompts", "review-standard.md"), "utf8");

// ---------------------------------------------------------------- R-1107: the last-line verdict grammar
// req: R-1107
check("review standard asks for a last-line LAND or SEND-BACK verdict",
	STANDARD_TEXT.includes("The last line of your answer is exactly `VERDICT: LAND` when no MUST stands, or `VERDICT: SEND-BACK` when one does") &&
	STANDARD_TEXT.includes("optionally followed by a score") &&
	STANDARD_TEXT.includes("Do not use LAND-WITH-FIXES"),
	STANDARD_TEXT);

// ---------------------------------------------------------------- R-1108: the MUST definition and the confirmation-round limit
// req: R-1108
check("review standard defines a MUST and limits confirmation rounds to the delta",
	STANDARD_TEXT.includes("A MUST is one of these: a must-meet test the brief names that is missing, or that still passes with the feature removed") &&
	STANDARD_TEXT.includes("a bug that stops the feature's main use the brief names, on a platform the brief names") &&
	["data lost or corrupted", "a test, build step or seat script that writes outside the lane worktree or the OS temp folder", "a broken install or hook", "something main does today that the brief does not set out to change no longer working"]
		.every((consequence) => STANDARD_TEXT.includes(consequence)) &&
	STANDARD_TEXT.includes("A confirmation round reviews only the change since the revision the brief names as the last round, and whether the named MUSTs are closed"),
	STANDARD_TEXT);

// req: R-1108
check("R-1108: the review standard makes a missing or empty must-meet test, a broken main use on a named platform and the four listed harms a MUST, and every other finding a known bug",
	STANDARD_TEXT.includes("a must-meet test the brief names that is missing, or that still passes with the feature removed") &&
	STANDARD_TEXT.includes("a bug that stops the feature's main use the brief names, on a platform the brief names") &&
	["data lost or corrupted", "a test, build step or seat script that writes outside the lane worktree or the OS temp folder", "a broken install or hook", "something main does today that the brief does not set out to change no longer working"]
		.every((harm) => STANDARD_TEXT.includes(harm)) &&
	STANDARD_TEXT.includes("the seat records them as known bugs, fixed when someone hits one") &&
	!STANDARD_TEXT.includes("wrong output someone acts on") &&
	!STANDARD_TEXT.includes("a security or review boundary bypassed"),
	STANDARD_TEXT);

// ---------------------------------------------------------------- R-1106/R-1680-1682: refusal before admission from a pack copy
// A copy of bin/, lib/review-standard.mjs, lib/verdict-config.mjs, lib/win-command.mjs,
// lib/win-command-config.mjs, lib/real-path.mjs and prompts/ lets each variant mutate the copy's own
// review-standard.md without ever touching the real file. win32 lays the stub out as an npm
// global install (writeFakePi, ./fake-pi.mjs) since piLaunch never runs a POSIX shell script there;
// POSIX keeps the sh stub.
const MISSING_TITLE = "missing review standard is refused before admission";
const DIRECTORY_TITLE = "directory at the review standard path is refused before admission";
const BLANK_TITLE = "blank review standard is refused before admission";
{
	const scratch = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "review-standard-")));
	const pack = path.join(scratch, "pack-copy");
	for (const dir of ["bin", "prompts"]) fs.cpSync(path.join(PACK, dir), path.join(pack, dir), { recursive: true });
	fs.mkdirSync(path.join(pack, "lib"), { recursive: true });
	for (const lib of ["review-standard.mjs", "verdict-config.mjs", "win-command.mjs", "win-command-config.mjs", "real-path.mjs"]) {
		fs.copyFileSync(path.join(PACK, "lib", lib), path.join(pack, "lib", lib));
	}
	const copyBin = path.join(pack, "bin", "pi-review.mjs");
	const copyStandard = path.join(pack, "prompts", "review-standard.md");

	const stubBin = path.join(scratch, "stub-bin");
	if (process.platform === "win32") {
		writeFakePi(stubBin, `const fs = require("node:fs");
if (process.env.STUB_MARKER) fs.writeFileSync(process.env.STUB_MARKER, "");
console.log("VERDICT: LAND");
`);
	} else {
		fs.mkdirSync(stubBin);
		fs.writeFileSync(path.join(stubBin, "pi"), '#!/bin/sh\nif [ -n "$STUB_MARKER" ]; then : > "$STUB_MARKER"; fi\necho \'VERDICT: LAND\'\n');
		fs.chmodSync(path.join(stubBin, "pi"), 0o755);
	}

	const repo = path.join(scratch, "repo");
	fs.mkdirSync(repo);
	const git = (...args) => spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: repo, encoding: "utf8" });
	git("init", "-q", "-b", "main");
	fs.writeFileSync(path.join(repo, "seed.txt"), "seed\n");
	git("add", "seed.txt");
	git("commit", "-qm", "seed");

	const slugOf = (title) => title.replace(/\W+/g, "-").slice(0, 48);
	const resDir = (home) => path.join(home, ".pi", "agent", "review-ledger.reservations");
	const run = (title) => {
		const slug = slugOf(title);
		const home = path.join(scratch, `home-${slug}`);
		fs.mkdirSync(home);
		const marker = path.join(scratch, `marker-${slug}`);
		const out = path.join(scratch, `out-${slug}.md`);
		const r = spawnSync(process.execPath, [copyBin, "--item", `review-standard-${slug}`, "--out", out, "--retries", "0", "--", "-p", "review"], {
			cwd: repo,
			env: { ...process.env, HOME: home, USERPROFILE: home, PATH: `${stubBin}${path.delimiter}${process.env.PATH}`, STUB_MARKER: marker },
			encoding: "utf8",
			timeout: 30_000,
		});
		return { r, home, marker, out };
	};

	// Control: with the as-copied (real) standard in place the copy must run, start the stub and
	// create the reservation folder, so none of the refusals below could pass vacuously against a
	// launcher that always exits 1, or against a ledger kept outside this probed folder.
	const control = run("control: review standard present");
	check("control: a pack copy with the review standard present exits 0, starts the stub and creates the reservation folder",
		control.r.status === 0 && fs.existsSync(control.marker) && fs.existsSync(resDir(control.home)), control.r.stderr);

	const refused = (r, home, marker, out) =>
		r.status === 1 &&
		/review-standard\.md/.test(r.stderr ?? "") &&
		!fs.existsSync(resDir(home)) &&
		!/admitted as round/.test(r.stderr ?? "") &&
		!fs.existsSync(marker) &&
		!fs.existsSync(out);

	fs.rmSync(copyStandard, { recursive: true, force: true });
	const missing = run(MISSING_TITLE);
	// req: R-1106 R-1680
	check("missing review standard is refused before admission", refused(missing.r, missing.home, missing.marker, missing.out), missing.r.stderr);

	fs.rmSync(copyStandard, { recursive: true, force: true });
	fs.mkdirSync(copyStandard);
	const directory = run(DIRECTORY_TITLE);
	// req: R-1106 R-1681
	check("directory at the review standard path is refused before admission", refused(directory.r, directory.home, directory.marker, directory.out), directory.r.stderr);

	fs.rmSync(copyStandard, { recursive: true, force: true });
	fs.writeFileSync(copyStandard, " \r\n\t\r\n");
	const blank = run(BLANK_TITLE);
	// req: R-1106 R-1682
	check("blank review standard is refused before admission", refused(blank.r, blank.home, blank.marker, blank.out), blank.r.stderr);
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
