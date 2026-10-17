/**
 * @module packages/nana-setup/tests/project-working-region.test.mjs
 * @purpose Pins marker-owned AGENTS refresh and region-only checking without touching bytes outside the region.
 * @inputs project helpers, the shared working section, and temporary project folders.
 * @outputs PASS/FAIL lines and a nonzero exit when an assertion fails.
 * @effects disk (temporary project fixtures only).
 * @errors failed assertions produce a nonzero exit.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { agentsStub, checkProject, refreshWorkingRegion, WORKING_BEGIN, WORKING_END, SHARED_DIR } from "../lib/project.mjs";

const root = tmpDir(path.join(os.tmpdir(), "nana-region-"));
// Raw, checkout-native bytes: on an autocrlf=true clone this is CRLF, matching what
// `agentsStub()` itself reads (it calls the same `readShared` with no normalization).
const sharedRaw = fs.readFileSync(path.join(SHARED_DIR, "working-under-nana-pi.md"), "utf8");
// Normalized to LF regardless of the checkout's own line endings, for every fixture below built
// from a pure-LF AGENTS.md body: the product detects LF from THAT body and writes the canonical
// section back as LF too, so the expectation must be LF-normalized independent of how this repo's
// OWN files were checked out. (A CRLF `sharedRaw` fed straight into :26's `.replace(/\n/g, "\r\n")`
// would also double up to \r\r\n.)
const shared = sharedRaw.replace(/\r\n/g, "\n");
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const skip = (name, why) => console.log(`SKIP ${name} (${why})`);
let fails = 0;
const make = (body) => { const dir = path.join(root, `p${fs.readdirSync(root).length}`); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, "AGENTS.md"), body); return dir; };

{
	const prefix = "outside-before\r\n";
	const suffix = "outside-after\r\n";
	const stale = `${prefix}${WORKING_BEGIN}\r\nstale\r\n${WORKING_END}\r\n${suffix}`;
	const dir = make(stale);
	const expected = `${prefix}${WORKING_BEGIN}\r\n${shared.replace(/\n/g, "\r\n")}${WORKING_END}\r\n${suffix}`;
	const refresh = refreshWorkingRegion(dir);
	const result = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
	// req: R-334
	// req: R-986
	check("refresh changes only the marked bytes and retains CRLF surrounding bytes", refresh.status === "created" && result === expected, result);
	// req: R-989
	check("check accepts the refreshed region", (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region")?.ok === true);
	fs.appendFileSync(path.join(dir, "AGENTS.md"), "outside mutation\n");
	// req: R-989
	check("outside edits do not change the region check", (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region")?.ok === true);
}

{
	const prefix = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("owner prose before markers\n")]);
	const original = Buffer.concat([prefix, Buffer.from(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`)]);
	const dir = make(original.toString("utf8"));
	const expected = Buffer.concat([prefix, Buffer.from(`${WORKING_BEGIN}\n${shared}${WORKING_END}\n`)]);
	const result = refreshWorkingRegion(dir);
	// req: R-986
	check("BOM and prose before markers remain byte-identical after refresh", result.status === "created" && fs.readFileSync(path.join(dir, "AGENTS.md")).equals(expected));
}

{
	const dir = make(`${WORKING_BEGIN}\n${shared}${WORKING_END}\n`);
	const matchingBefore = fs.readFileSync(path.join(dir, "AGENTS.md"));
	const result = refreshWorkingRegion(dir);
	// req: R-986
	check("matching region is unchanged byte-for-byte", result.status === "unchanged" && fs.readFileSync(path.join(dir, "AGENTS.md")).equals(matchingBefore));
	fs.writeFileSync(path.join(dir, "AGENTS.md"), `${WORKING_BEGIN}\nold\n${WORKING_END}\n`);
	const before = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
	// req: R-987
	check("dry run reports without writing", refreshWorkingRegion(dir, { dryRun: true }).detail.includes("would refresh") && fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") === before);
}

{
	const dir = make(`${WORKING_BEGIN}\nold\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const before = fs.readFileSync(target);
	const mode = fs.statSync(target).mode;
	try {
		fs.chmodSync(target, 0o444);
		const dry = refreshWorkingRegion(dir, { dryRun: true });
		// req: R-987
		check("read-only dry run reports refresh and preserves bytes", dry.status === "created" && dry.detail.includes("would refresh") && fs.readFileSync(target).equals(before));
		const real = refreshWorkingRegion(dir);
		// req: R-987
		check("read-only real run reports a write problem without changing bytes", real.status === "skipped" && real.detail.includes("not writable") && fs.readFileSync(target).equals(before));
	} finally {
		fs.chmodSync(target, mode);
	}
}

{
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const invalidBytes = Buffer.concat([Buffer.from([0xff]), Buffer.from(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`)]);
	fs.writeFileSync(target, invalidBytes);
	const result = refreshWorkingRegion(dir);
	// req: R-987
	check("invalid UTF-8 outside stale region is refused without changing bytes", result.status === "skipped" && result.detail.includes("not valid UTF-8") && fs.readFileSync(target).equals(invalidBytes));
}

{
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const original = fs.readFileSync(target);
	fs.symlinkSync("AGENTS.md", path.join(dir, "CLAUDE.md"));
	const result = refreshWorkingRegion(dir, { writeTemp: () => { throw new Error("injected write failure"); } });
	const leftovers = fs.readdirSync(dir).filter((name) => name.startsWith(".AGENTS.md.nana-") && name.endsWith(".tmp"));
	// req: R-986
	check("failed staged write preserves original bytes and leaves no temp file", result.status === "skipped" && fs.readFileSync(target).equals(original) && leftovers.length === 0);
}

{
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const replacementByOwner = "owner replaced this file while staging\n";
	// The hook simulates an owner's in-place replace (unlink + rewrite) while the refresh still
	// holds its own handle on the old file. On POSIX that is reliable; on win32 the unlink or the
	// rewrite can itself hit a delete-pending file or a scanner hold, so the SIMULATION — not the
	// product's identity check — is unreliable there (Windows run 2, 2026-10-17). Record and
	// rethrow unchanged, so the product sees the same failed staging write either way.
	let hookError = null;
	const result = refreshWorkingRegion(dir, { writeTemp: (fd, content) => {
		fs.writeFileSync(fd, content, "utf8");
		try {
			fs.unlinkSync(target);
			fs.writeFileSync(target, replacementByOwner);
		} catch (error) {
			hookError = error;
			throw error;
		}
	} });
	const targetText = (() => { try { return fs.readFileSync(target, "utf8"); } catch (error) { return `<unreadable: ${error.code}>`; } })();
	if (process.platform === "win32" && hookError) {
		skip("target identity change during staging is refused", `the simulated owner-replace itself failed on Windows: ${hookError.code ?? hookError.message} — a delete-pending file or a scanner hold, not this check`);
	} else {
		// req: R-986
		check("target identity change during staging is refused", result.status === "skipped" && targetText === replacementByOwner && fs.readdirSync(dir).every((name) => !name.startsWith(".AGENTS.md.nana-") || !name.endsWith(".tmp")), `status=${result.status} detail=${JSON.stringify(result.detail)} target=${JSON.stringify(targetText)}`);
	}
}

{
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const ownerEdit = `${WORKING_BEGIN}\nowner edit made during staging\n${WORKING_END}\n`;
	const result = refreshWorkingRegion(dir, { writeTemp: (fd, content) => {
		fs.writeFileSync(fd, content, "utf8");
		fs.writeFileSync(target, ownerEdit);
	} });
	// req: R-986
	check("in-place owner edit during staging is refused and temp file removed", result.status === "skipped" && fs.readFileSync(target, "utf8") === ownerEdit && fs.readdirSync(dir).every((name) => !name.startsWith(".AGENTS.md.nana-") || !name.endsWith(".tmp")));
}

{
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const originalMode = fs.statSync(target).mode & 0o7777;
	fs.symlinkSync("AGENTS.md", path.join(dir, "CLAUDE.md"));
	const result = refreshWorkingRegion(dir);
	// req: R-986
	check("atomic refresh preserves mode and keeps CLAUDE link resolving to refreshed content", result.status === "created" && (fs.statSync(target).mode & 0o7777) === originalMode && fs.readFileSync(path.join(dir, "CLAUDE.md"), "utf8").includes(shared));
}

{
	const malformedCases = [];
	for (const [title, body] of [
		["no markers", "unmarked old instructions\n"],
		["one marker", `${WORKING_BEGIN}\nold\n`],
		["duplicates", `${WORKING_BEGIN}\n${WORKING_BEGIN}\n${WORKING_END}\n`],
		["reversed", `${WORKING_END}\n${WORKING_BEGIN}\n`],
		["markers only inside a fenced block", `\`\`\`md\n${WORKING_BEGIN}\n${WORKING_END}\n\`\`\`\n`],
		["four-backtick fence ignores three-backtick pseudo-close", `\`\`\`\`md\nstill fenced\n\`\`\`\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n\`\`\`\`\n`],
	]) {
		const dir = make(body);
		const before = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
		const result = refreshWorkingRegion(dir);
		check(`${title} markers are reported and left untouched`, result.status === "skipped" && result.detail.includes("wrap the section once") && fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") === before);
		malformedCases.push(result.status === "skipped" && result.detail.includes("wrap the section once") && fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8") === before);
		if (title === "no markers") {
			// req: R-989
			check("missing markers are a ! note", (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region")?.note === true);
		}
	}
	// req: R-987
	check("all invalid marker layouts are refused without writes", malformedCases.length === 6 && malformedCases.every(Boolean));
	const fenced = make(`\`\`\`\`md\nstill fenced\n\`\`\`\n${WORKING_BEGIN}\nstale\n${WORKING_END}\n\`\`\`\`\n`);
	const fencedBefore = fs.readFileSync(path.join(fenced, "AGENTS.md"));
	const fencedResult = refreshWorkingRegion(fenced);
	// req: R-986
	check("markers inside mismatched fenced code remain ignored", fencedResult.status === "skipped" && fs.readFileSync(path.join(fenced, "AGENTS.md")).equals(fencedBefore));
}

{
	const dir = path.join(root, "linked"); fs.mkdirSync(dir);
	const external = path.join(root, "external.md");
	const victim = `${WORKING_BEGIN}\nstale victim section\n${WORKING_END}\n`;
	fs.writeFileSync(external, victim);
	fs.symlinkSync(external, path.join(dir, "AGENTS.md"));
	const result = refreshWorkingRegion(dir);
	// req: R-987
	check("symlinked AGENTS is reported and left alone", result.status === "skipped" && result.detail.includes("symlink") && fs.readFileSync(external, "utf8") === victim);
}

{
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const external = path.join(root, "race-target.md");
	const victim = `${WORKING_BEGIN}\nstale race section\n${WORKING_END}\n`;
	fs.writeFileSync(external, victim);
	const result = refreshWorkingRegion(dir, { beforeOpen: () => { fs.unlinkSync(target); fs.symlinkSync(external, target); } });
	// `O_NOFOLLOW` is undefined on win32 (no symlink-refusing open flag there), so the open
	// FOLLOWS the swapped-in link there instead of refusing it with ELOOP — the identity
	// re-check then catches the swap and refuses with the generic "changed before it could be
	// opened" detail. Either refusal detail is correct; which one depends on the platform, not
	// on this fix.
	const refused = result.status === "skipped" && (result.detail.includes("symlinked AGENTS.md left alone") || result.detail.includes("AGENTS.md changed before it could be opened"));
	// req: R-987
	check("symlink swap after lstat is refused without changing its target", refused && fs.readFileSync(external, "utf8") === victim, result.detail);
}

{
	// sol r1 MUST: a rename retry re-tried blindly after EPERM/EBUSY, so an editor's save made
	// in the window between attempts was clobbered by the next retry. The injected `rename` seam
	// throws EPERM once — simulating that window — and writes the owner's new content before
	// throwing, the way a real editor save-and-close would land between this refresh's attempts.
	const dir = make(`${WORKING_BEGIN}\nstale\n${WORKING_END}\n`);
	const target = path.join(dir, "AGENTS.md");
	const ownerSave = "owner saved new content between rename attempts\n";
	let thrown = false;
	const result = refreshWorkingRegion(dir, { rename: (src, dest) => {
		if (!thrown) {
			thrown = true;
			fs.writeFileSync(target, ownerSave);
			const error = new Error("EPERM: operation not permitted, rename");
			error.code = "EPERM";
			throw error;
		}
		fs.renameSync(src, dest);
	} });
	const targetText = fs.readFileSync(target, "utf8");
	// req: R-986
	check("a retry does not overwrite an owner's save made between attempts", result.status === "skipped" && targetText === ownerSave && fs.readdirSync(dir).every((name) => !name.startsWith(".AGENTS.md.nana-") || !name.endsWith(".tmp")), `status=${result.status} detail=${JSON.stringify(result.detail)} target=${JSON.stringify(targetText)}`);
}

{
	const stub = agentsStub("fixture");
	// req: R-988
	check("new stub has exact delimiters", stub.includes(`${WORKING_BEGIN}\n${sharedRaw}${WORKING_END}\n`));
	const dir = make(`${WORKING_BEGIN}\nold\n${WORKING_END}\n`);
	const mismatch = (await checkProject(dir)).find((c) => c.label === "AGENTS.md working region");
	// req: R-989
	check("check fails and names the project refresh fix when region differs", mismatch?.ok === false && /differs — fix: nana-setup project /.test(mismatch.detail));
}

console.log(`${fails ? "FAIL" : "PASS"} summary: ${fails} failures`);
process.exit(fails ? 1 : 0);
