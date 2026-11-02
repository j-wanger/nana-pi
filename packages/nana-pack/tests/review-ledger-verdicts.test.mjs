/**
 * @module packages/nana-pack/tests/review-ledger-verdicts.test.mjs
 * @purpose Pins the per-item review ledger's verdict reading, kept review texts, redirect refusal and shape check through REAL processes
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/review-ledger.mjs, bin/review-round.mjs, a stub `pi` on PATH, and temp git repositories under a temp HOME, all set up by review-ledger-fixture.mjs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, git repositories, worktrees, ledger files), process (spawns the review CLIs, the stub pi, git, and icacls on Windows)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Run: node packages/nana-pack/tests/review-ledger-verdicts.test.mjs
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { UNREAD_VERDICT_CONDITIONS, VERDICT_LOOKALIKE_FOLD } from "../lib/verdict-config.mjs";
import { tmp, outs, PI_REVIEW, LEDGER_CLI, mod, home, agent, tallyFile, auditFile, freshHome, env, jsonl, roundsOf, storedTextFile, check, repo, A, B, plain, out, piReview, ledgerRun, ledgerKeep, finish } from "./review-ledger-fixture.mjs";

{
	freshHome("verdict-position"); A.at(0);
	const run = (item, text) => {
		const result = ledgerRun(["--item", item], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		const last = jsonl(tallyFile).at(-1);
		return (result.status === 0 || result.status === 1) && last?.item === item ? last.verdict : `exit:${result.status}`;
	};
	const accepted = [
		["plain", "VERDICT: LAND\nnotes", "LAND"],
		["bare-score", "VERDICT: LAND 9/10\nnotes", "LAND"],
		["paren-score", "VERDICT: LAND (9/10)\nnotes", "LAND"],
		["dash-score", "VERDICT: LAND — 9/10\nnotes", "LAND"],
		["bom", "\uFEFFVERDICT: LAND\nnotes", "LAND"],
		["agree", "VERDICT: LAND 9/10\nnotes\nVERDICT: LAND", "LAND"],
		["identical-plain-first-final", "VERDICT: LAND\nbody\nVERDICT: LAND", "LAND"],
		["single-marked-final", "body\n# VERDICT: LAND", "LAND"],
		["middle-verdict-ignored", "notes\nVERDICT: SEND-BACK\nVERDICT: LAND", "LAND"],
		["crlf", "VERDICT: LAND\r\nnotes\r\n", "LAND"],
		["tab", "VERDICT: LAND\t", "LAND"],
		["no-final-newline", "VERDICT: LAND\nnotes", "LAND"],
		["final-bare-score", "body\nVERDICT: LAND 9/10", "LAND"],
		["misspelled-epsilon", "VERDICT: LAND\nΕERDICT: SEND-BACK", "LAND"],
	];
	let acceptedOk = true;
	for (const [item, text, expected] of accepted) acceptedOk &&= run(`position-${item}`, text) === expected;
	// req: R-969
	check("complete extracts plain first-line verdicts, supported scores, BOM and line endings", acceptedOk);
	const refused = [
		["quoted", "`VERDICT: LAND`\nnotes"],
		["marked", "# VERDICT: LAND\nnotes"],
		["quoted-agreeing-final", "`VERDICT: LAND`\nbody\nVERDICT: LAND"],
		["hash-agreeing-final", "# VERDICT: LAND\nbody\nVERDICT: LAND"],
		["indented-agreeing-final", "  VERDICT: LAND\nbody\nVERDICT: LAND"],
		["bold-agreeing-final", "**VERDICT: LAND**\nbody\nVERDICT: LAND"],
		["identical-hash-first-final", "# VERDICT: LAND\nbody\n# VERDICT: LAND"],
		["identical-quoted-first-final", "`VERDICT: LAND`\nbody\n`VERDICT: LAND`"],
		["identical-indented-first-final", "  VERDICT: LAND\nbody\n  VERDICT: LAND"],
		["identical-bold-first-final", "**VERDICT: LAND**\nbody\n**VERDICT: LAND**"],
		["correction", "VERDICT: LAND\nThe verdict is SEND-BACK."],
		["disagree", "VERDICT: SEND-BACK 4/10 — blockers remain\nnotes\nVERDICT: LAND"],
		["malformed-before-final", "VERDICT: SEND-BACK!\nnotes\nVERDICT: LAND"],
		["invisible-other-line", "VERDICT: LAND\nV\u200BERDICT: SEND-BACK"],
		["bounded-token", "VERDICT: LAND\nXVERDICT: SEND-BACK"],
		["zwsp-first-conflict", "V\u200BERDICT: SEND-BACK\nnotes\nVERDICT: LAND"],
		["greek-first-conflict", "VΕRDICT: SEND-BACK\nnotes\nVERDICT: LAND"],
		["cyrillic-first-conflict", "VЕRDICT: SEND-BACK\nnotes\nVERDICT: LAND"],
		["lowercase-first-conflict", "verdict: send-back\nnotes\nVERDICT: LAND"],
		["fullwidth-later", "VERDICT: LAND\nＶＥＲＤＩＣＴ: SEND-BACK"],
		["fullwidth-first-conflict", "ＶＥＲＤＩＣＴ: SEND-BACK\nnotes\nVERDICT: LAND"],
		["mathematical-bold-later", "VERDICT: LAND\n𝐕𝐄𝐑𝐃𝐈𝐂𝐓: SEND-BACK"],
		["cgj-later", "VERDICT: LAND\nV\u034FERDICT: SEND-BACK"],
		["lunate-sigma-first-conflict", "VERDI\u03F9T: SEND-BACK\nnotes\nVERDICT: LAND"],
		["lunate-sigma-later-conflict", "VERDICT: LAND\nVERDI\u03F9T: SEND-BACK"],
		["mathematical-greek-epsilon-later", "VERDICT: LAND\nV𝚬RDICT: SEND-BACK"],
		["mathematical-greek-epsilon-first-conflict", "V𝚬RDICT: SEND-BACK\nnotes\nVERDICT: LAND"],
	];
	const refusedFailures = [];
	for (const [item, text] of refused) {
		const got = run(`position-${item}`, text);
		if (got !== null) refusedFailures.push(`${item}: ${got}`);
	}
	// req: R-969 R-1010
	check("complete refuses marks, corrections, conflicting verdicts, invisible characters and bounded-token lookalikes", refusedFailures.length === 0, refusedFailures.join(", "));
	const canon = (text) => text.replace(/\p{Default_Ignorable_Code_Point}/gu, "")
		.replace(/[\s\S]/gu, (char) => VERDICT_LOOKALIKE_FOLD[char] ?? char)
		.normalize("NFKC")
		.replace(/\p{Default_Ignorable_Code_Point}/gu, "")
		.replace(/[\s\S]/gu, (char) => VERDICT_LOOKALIKE_FOLD[char] ?? char)
		.toLowerCase();
	const tableInvariant = Object.entries(VERDICT_LOOKALIKE_FOLD)
		.every(([key, target]) => canon(key) === target.toLowerCase());
	// req: R-969 R-1010
	check("every configured verdict look-alike canonicalizes to its target", tableInvariant,
		Object.entries(VERDICT_LOOKALIKE_FOLD).filter(([key, target]) => canon(key) !== target.toLowerCase()).map(([key, target]) => `${key}→${target}: ${canon(key)}`).join(", "));
}

{
	freshHome("unread-ledger"); A.at(0);
	const unreadText = "**VERDICT: LAND**\r\n\r\nbody\r\nVERDICT: LAND\r\n";
	const unread = ledgerRun(["--item", "unread-ledger"], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(unreadText)})`] });
	const unreadRow = jsonl(tallyFile).at(-1);
	const readable = ledgerRun(["--item", "readable-ledger"], { cmd: [process.execPath, "-e", "process.stdout.write('notes\\nVERDICT: LAND')"] });
	// req: R-1620
	check("review-ledger run exits 1 when the recorded verdict is empty and 0 when it is a word",
		unread.status === 1 && !/verdict recorded/.test(unread.stderr) && roundsOf("unread-ledger").length === 1 && unreadRow?.item === "unread-ledger" && unreadRow?.verdict === null &&
		readable.status === 0 && /verdict recorded/.test(readable.stderr) && !/verdict unread/.test(readable.stderr),
		JSON.stringify({ unread: { status: unread.status, stderr: unread.stderr }, readable: { status: readable.status, stderr: readable.stderr }, tally: jsonl(tallyFile).slice(-2) }));
}

{
	freshHome("unread-pi"); A.at(0);
	const unreadText = "**VERDICT: LAND**\r\n\r\nbody\r\nVERDICT: LAND\r\n";
	const unread = piReview(["--item", "unread-pi", "--out", out()], { stub: "plain-review", extra: unreadText });
	const readable = piReview(["--item", "readable-pi", "--out", out()]);
	// req: R-1621
	check("pi-review exits 1 without its success line when the recorded verdict is empty",
		unread.status === 1 && !/SUCCESS/.test(unread.stderr) && roundsOf("unread-pi").length === 1 && roundsOf("unread-pi")[0]?.verdict === null &&
		readable.status === 0 && /SUCCESS/.test(readable.stderr),
		JSON.stringify({ unread: { status: unread.status, stderr: unread.stderr }, readable: { status: readable.status, stderr: readable.stderr }, tally: jsonl(tallyFile) }));
}

{
	freshHome("unread-detail"); A.at(0);
	const C = UNREAD_VERDICT_CONDITIONS;
	const cases = [
		["conflict", "**VERDICT: LAND**\r\n\r\nbody\r\nVERDICT: LAND\r\n", 4, "VERDICT: LAND", C.FIRST_LINE_CONFLICT, 1, "**VERDICT: LAND**"],
		["final-grammar", "notes\n\nVERDICT: LAND!\t", 3, "VERDICT: LAND!\t", C.FINAL_LINE_GRAMMAR, null, null],
		["first-grammar", "`VERDICT: LAND`\nnotes\n", 1, "`VERDICT: LAND`", C.FIRST_LINE_GRAMMAR, null, null],
		["later-mention", "VERDICT: LAND\n\nThe verdict holds.", 1, "VERDICT: LAND", C.LATER_MENTION, 3, "The verdict holds."],
	];
	const failures = [];
	for (const [name, text, selectedLine, selectedText, condition, triggerLine, triggerText] of cases) {
		const result = ledgerRun(["--item", `unread-${name}`], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		const notes = result.stderr.split(/\r?\n/).filter((line) => line.includes("verdict unread"));
		const note = notes[0] ?? "";
		const ok = result.status === 1 && notes.length === 1 && note.includes(`selected line ${selectedLine} ${JSON.stringify(selectedText)} — ${condition}`) &&
			(triggerLine === null || note.includes(`; line ${triggerLine} ${JSON.stringify(triggerText)}`)) && !result.stdout.includes("verdict unread");
		if (!ok) failures.push({ name, status: result.status, stderr: result.stderr, stdout: result.stdout });
	}
	const pi = piReview(["--item", "unread-detail-pi", "--out", out()], { stub: "plain-review", extra: cases[0][1] });
	const piNotes = pi.stderr.split(/\r?\n/).filter((line) => line.includes("verdict unread"));
	if (!(pi.status === 1 && piNotes.length === 1 && piNotes[0].includes(`selected line 4 "VERDICT: LAND" — ${C.FIRST_LINE_CONFLICT}; line 1 "**VERDICT: LAND**"`) && !pi.stdout.includes("verdict unread"))) {
		failures.push({ name: "pi-review", status: pi.status, stderr: pi.stderr, stdout: pi.stdout });
	}
	// req: R-1622
	check("an empty verdict prints one stderr line naming the selected line, its condition and the conflicting line", failures.length === 0, JSON.stringify(failures));
}

{
	freshHome("unread-rounds-left");
	const CAP = mod.REVIEW_ROUND_CAP;
	const roundsRepo = repo("unread-rounds-left-repo", CAP + 1);
	const failures = [];
	for (let i = 0; i < CAP + 1; i++) {
		roundsRepo.at(i);
		const extra = i === CAP ? ["--over-cap", "final confirmation"] : [];
		const result = ledgerRun(["--item", "unread-rounds-left", ...extra], { cwd: roundsRepo.d, cmd: [process.execPath, "-e", "process.stdout.write('notes\\n\\nVERDICT: LAND!\\t')"] });
		const expected = `${Math.max(0, CAP - (i + 1))} of ${CAP} rounds remain for the item`;
		if (!(result.status === 1 && result.stderr.includes("nana-land will refuse this revision for good") &&
			result.stderr.includes("make a new commit and review it") && result.stderr.includes(expected) && result.stderr.includes("review kept at "))) {
			failures.push({ i, expected, status: result.status, stderr: result.stderr });
		}
	}
	A.at(0);
	const pi = piReview(["--item", "unread-rounds-left-pi", "--out", out()], { stub: "plain-review", extra: "notes\n\nVERDICT: LAND!\t" });
	if (!(pi.status === 1 && pi.stderr.includes("nana-land will refuse this revision for good") &&
		pi.stderr.includes("make a new commit and review it") && pi.stderr.includes(`${CAP - 1} of ${CAP} rounds remain for the item`) &&
		pi.stderr.includes("review kept at "))) {
		failures.push({ i: "pi-review", status: pi.status, stderr: pi.stderr });
	}
	// req: R-1623
	check("the empty-verdict line says nana-land refuses the revision and counts the rounds left", failures.length === 0, JSON.stringify(failures));
}

{
	freshHome("verdict-ordinal"); A.at(0);
	const first = [];
	for (const [role, model] of [["sol", "model-a"], ["astra", "model-b"], ["sol", "model-c"]]) {
		const admitted = mod.admit(["--item", "ordinal", "--role", role], { home, cwd: A.d, launcher: "test", model });
		const completed = mod.complete(admitted.res, `VERDICT: ${role === "astra" ? "SEND-BACK" : "LAND"}`, { home });
		first.push({ admitted, completed });
	}
	A.at(1);
	const second = mod.admit(["--item", "ordinal", "--role", "reviewer"], { home, cwd: A.d, launcher: "test", model: "model-d" });
	const secondComplete = mod.complete(second.res, "VERDICT: LAND", { home });
	const rows = jsonl(tallyFile).filter((r) => r.item === "ordinal");
	// req: R-1008
	check("complete appends every verdict at v2 and returns the revision ordinal",
		first.every((x) => x.admitted.ok && x.completed.ok && x.completed.round === 1) && second.ok && secondComplete.ok && secondComplete.round === 2 && rows.length === 4 &&
		rows.every((r) => r.v === 2 && r.item === "ordinal" && r.role && r.model) && rows.slice(0, 3).every((r) => r.revision === A.shas[0]) && rows[3].revision === A.shas[1]);
}

{
	freshHome("report-verdicts"); A.at(0);
	let completed = true;
	for (const verdict of ["LAND", "SEND-BACK"]) {
		const admitted = mod.admit(["--item", "report-two", "--role", "reviewer"], { home, cwd: A.d, launcher: "test", model: "model-report" });
		completed &&= admitted.ok && mod.complete(admitted.res, `VERDICT: ${verdict}`, { home }).ok;
	}
	const report = spawnSync(process.execPath, [LEDGER_CLI, "report", "--item", "report-two", "--repo", A.d], { cwd: A.d, env: env(), encoding: "utf8" });
	const lines = report.stdout.trim().split(/\r?\n/);
	// req: R-970
	check("report prints one line per verdict on a revision", completed && report.status === 0 && lines.length === 2 && lines.every((line) => line.includes("report-two") && line.includes("model-report")) && lines[0].includes("LAND") && lines[1].includes("SEND-BACK"), report.stderr || report.stdout);
}

{
	freshHome("kept-text"); A.at(0);
	const raw = "\uFEFFReview café\r\n\r\nVERDICT: LAND\r\n \t\r\n";
	const first = ledgerRun(["--item", "kept-text", "--role", "ledger"], {
		cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(raw)})`],
	});
	const secondRaw = "Second captured review\nVERDICT: LAND\n";
	const second = piReview(["--item", "kept-text", "--role", "pi", "--out", out()], { stub: "plain-review", extra: secondRaw });
	const rows = jsonl(tallyFile).filter((r) => r.item === "kept-text");
	const rawBytes = Buffer.from(raw, "utf8");
	const secondBytes = Buffer.from(secondRaw, "utf8");
	const rawHash = createHash("sha256").update(rawBytes).digest("hex");
	const secondHash = createHash("sha256").update(secondBytes).digest("hex");
	const rawFile = storedTextFile(home, rawHash);
	const secondFile = storedTextFile(home, secondHash);

	const tmpMissing = path.join(tmp, "missing-system-temp");
	const missingOut = path.join(outs, "missing-temp-output.md");
	const tempText = "temp-independent\nVERDICT: LAND";
	const tempHash = createHash("sha256").update(Buffer.from(tempText, "utf8")).digest("hex");
	const admitted = mod.admit(["--item", "kept-without-system-temp", "--out", missingOut], { home, cwd: A.d, launcher: "test" });
	const oldTemps = { TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, TMP: process.env.TMP };
	process.env.TMPDIR = tmpMissing; process.env.TEMP = tmpMissing; process.env.TMP = tmpMissing;
	const tempComplete = mod.complete(admitted.res, missingOut, { home, text: tempText });
	for (const [name, value] of Object.entries(oldTemps)) value === undefined ? delete process.env[name] : process.env[name] = value;
	const tempRow = jsonl(tallyFile).find((r) => r.item === "kept-without-system-temp");
	const tempFile = storedTextFile(home, tempHash);

	// req: R-2568
	check("R-2568: a recorded round keeps its review text by hash beside the tally",
		first.status === 0 && second.status === 0 && rows.length === 2 && roundsOf("kept-text").length === 1 &&
		mod.REVIEW_TEXT_STORE_NAME === "review-ledger.texts" && path.basename(mod.ledgerPaths(home).texts) === mod.REVIEW_TEXT_STORE_NAME &&
		mod.REVIEW_TEXT_EXTENSION === ".md" && mod.REVIEW_TEXT_HASH === "sha256" && mod.REVIEW_TEXT_HASH_HEX_CHARS === 64 &&
		rows[0]?.text?.sha256 === rawHash && rows[0]?.text?.bytes === rawBytes.length && /^[0-9a-f]{64}$/.test(rows[0]?.text?.sha256 ?? "") &&
		rows[1]?.text?.sha256 === secondHash && rows[1]?.text?.bytes === secondBytes.length &&
		rawFile && fs.existsSync(rawFile) && fs.readFileSync(rawFile).equals(rawBytes) &&
		secondFile && fs.existsSync(secondFile) && fs.readFileSync(secondFile).equals(secondBytes) &&
		!fs.existsSync(tmpMissing) && typeof tempComplete.ok === "boolean" && tempRow?.text?.sha256 === tempHash &&
		tempFile && fs.existsSync(tempFile) && fs.readFileSync(tempFile, "utf8") === tempText,
		JSON.stringify({ first: first.stderr, second: second.stderr, rows, tempComplete, tempRow, store: mod.ledgerPaths(home).texts }));
}

{
	freshHome("rename-retry-codes"); A.at(0);
	let allCodes = true;
	for (const code of ["EPERM", "EBUSY", "EACCES"]) {
		const item = `rename-retry-${code.toLowerCase()}`;
		const text = `${code} captured review\nVERDICT: LAND\n`;
		const bytes = Buffer.from(text, "utf8");
		const hash = createHash("sha256").update(bytes).digest("hex");
		const admitted = mod.admit(["--item", item, "--role", "ledger"], { home, cwd: A.d, launcher: "test" });
		let renameCalls = 0;
		const rename = (from, to) => {
			renameCalls++;
			if (renameCalls === 1) throw Object.assign(new Error(code), { code });
			fs.renameSync(from, to);
		};
		const completed = mod.complete(admitted.res, out(), { home, text, rename });
		const row = jsonl(tallyFile).find((entry) => entry.item === item);
		const stored = storedTextFile(home, hash);
		allCodes &&= admitted.ok && completed.ok && renameCalls === 2 && row?.text?.sha256 === hash
			&& stored && fs.existsSync(stored) && fs.readFileSync(stored).equals(bytes);
	}
	// req: R-2660
	check("R-2660: a kept review text whose first rename fails with EPERM, EBUSY or EACCES is still kept and its round recorded, on every platform", allCodes);
}

{
	freshHome("captured-text-wins"); A.at(0);
	const captured = "Captured bytes\r\nVERDICT: LAND";
	const capturedBytes = Buffer.from(captured, "utf8");
	const capturedHash = createHash("sha256").update(capturedBytes).digest("hex");
	const missingOut = path.join(outs, "deleted-before-complete.md");
	const missingAdmission = mod.admit(["--item", "captured-missing", "--out", missingOut], { home, cwd: A.d, launcher: "test" });
	const missing = mod.complete(missingAdmission.res, missingOut, { home, text: captured });
	const differentOut = path.join(outs, "different-before-complete.md");
	fs.writeFileSync(differentOut, "Other review\nVERDICT: SEND-BACK\n");
	const differentAdmission = mod.admit(["--item", "captured-different", "--out", differentOut], { home, cwd: A.d, launcher: "test" });
	const different = mod.complete(differentAdmission.res, differentOut, { home, text: captured });
	const rows = jsonl(tallyFile).filter((r) => r.item.startsWith("captured-"));
	const kept = storedTextFile(home, capturedHash);
	// req: R-2569
	check("R-2569: a missing or different output file at record time still records and keeps the captured verdict",
		missing.ok === true && different.ok === true && missing.verdict === "LAND" && different.verdict === "LAND" &&
		rows.length === 2 && rows.every((r) => r.verdict === "LAND" && r.text?.sha256 === capturedHash && r.text?.bytes === capturedBytes.length) &&
		kept && fs.existsSync(kept) && fs.readFileSync(kept).equals(capturedBytes),
		JSON.stringify({ missing, different, rows, kept }));
}

{
	freshHome("store-write-failure"); A.at(0);
	const outputPath = path.join(outs, "store-write-failure-output.md");
	const admitted = mod.admit(["--item", "store-write-failure", "--out", outputPath], { home, cwd: A.d, launcher: "test" });
	const storePath = path.join(agent, "review-ledger.texts");
	fs.writeFileSync(storePath, "not a folder");
	const completed = mod.complete(admitted.res, outputPath, { home, text: "review\nVERDICT: LAND" });
	// req: R-2575
	check("R-2575: a failed store write records no round",
		admitted.ok === true && completed.ok === false && completed.message.includes(outputPath) && jsonl(tallyFile).length === 0 && jsonl(auditFile).length === 0,
		JSON.stringify({ completed, tally: jsonl(tallyFile), audit: jsonl(auditFile) }));
}

{
	freshHome("keep-item-scope");
	const keepTextOne = "first kept text\r\nVERDICT: LAND\r\n";
	const keepTextTwo = "second kept text \t\nVERDICT: LAND";
	const otherItemText = "other item\nVERDICT: LAND\n";
	const otherRepoText = "other repo\nVERDICT: LAND\n";
	A.at(0);
	const first = ledgerRun(["--item", "keep-target", "--role", "SoL"], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(keepTextOne)})`] });
	A.at(1);
	const second = ledgerRun(["--item", "keep-target", "--role", "ASTRA"], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(keepTextTwo)})`] });
	const otherItem = ledgerRun(["--item", "other-item", "--role", "sol"], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(otherItemText)})`] });
	B.at(0);
	const otherRepo = ledgerRun(["--item", "keep-target", "--role", "sol"], { cwd: B.d, cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(otherRepoText)})`] });
	const into = path.join(tmp, "kept-lane-folder");
	const kept = ledgerKeep(["--item", "keep-target", "--into", into, "--repo", A.d], B.d);
	const hashOne = createHash("sha256").update(Buffer.from(keepTextOne)).digest("hex");
	const hashTwo = createHash("sha256").update(Buffer.from(keepTextTwo)).digest("hex");
	const names = [`r1-sol-${hashOne.slice(0, 8)}.md`, `r2-astra-${hashTwo.slice(0, 8)}.md`].sort();
	const wroteExpected = names.every((name) => fs.existsSync(path.join(into, name)));
	const beforeTimes = wroteExpected ? Object.fromEntries(names.map((name) => {
		const file = path.join(into, name); fs.utimesSync(file, new Date(1_000), new Date(1_000)); return [name, fs.statSync(file).mtimeMs];
	})) : {};
	const again = ledgerKeep(["--item", "keep-target", "--into", into, "--repo", A.d], B.d);
	const afterTimes = wroteExpected ? Object.fromEntries(names.map((name) => [name, fs.statSync(path.join(into, name)).mtimeMs])) : {};
	const legacy = { v: 2, kind: "round", repo: mod.repoKeyOf(A.d), item: "legacy-no-text", revision: A.shas[0], role: "old", verdict: "LAND" };
	fs.appendFileSync(tallyFile, `${JSON.stringify(legacy)}\n`);
	// R-2573's empty case exits 1 because repository A commits no ledger; R-2913 owns the no-text exit rule.
	const empty = ledgerKeep(["--item", "legacy-no-text", "--into", path.join(tmp, "legacy-kept"), "--repo", A.d], A.d);
	// req: R-2573
	check("R-2573: keep writes each kept review text of the item into the lane folder",
		first.status === 0 && second.status === 0 && otherItem.status === 0 && otherRepo.status === 0 && kept.status === 0 && again.status === 0 &&
		mod.KEEP_NAME_HASH_CHARS === 8 && wroteExpected && JSON.stringify(fs.readdirSync(into).sort()) === JSON.stringify(names) &&
		fs.readFileSync(path.join(into, names[0]), "utf8") === keepTextOne && fs.readFileSync(path.join(into, names[1]), "utf8") === keepTextTwo &&
		JSON.stringify(afterTimes) === JSON.stringify(beforeTimes) && empty.status === 1 && /no kept text/i.test(empty.stderr),
		JSON.stringify({ kept: kept.stderr, again: again.stderr, empty: empty.stderr, names: fs.existsSync(into) ? fs.readdirSync(into) : [] }));
}

{
	freshHome("keep-conflict");
	const texts = ["first conflict fixture\nVERDICT: LAND\n", "last conflict fixture\nVERDICT: LAND\n"];
	for (const [i, text] of texts.entries()) {
		A.at(i);
		const result = ledgerRun(["--item", "keep-conflict", "--role", `role${i + 1}`], { cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		if (result.status !== 0) throw new Error(result.stderr);
	}
	const rows = jsonl(tallyFile).filter((row) => row.item === "keep-conflict");
	const names = rows.map((row, index) => `r${index + 1}-role${index + 1}-${row.text.sha256.slice(0, 8)}.md`);
	const into = path.join(tmp, "kept-conflict-folder"); fs.mkdirSync(into);
	const differing = Buffer.from("different bytes\r\nwith trailing tab\t");
	fs.writeFileSync(path.join(into, names.at(-1)), differing);
	const kept = ledgerKeep(["--item", "keep-conflict", "--into", into, "--repo", A.d], A.d);
	// req: R-2574
	check("R-2574: keep refuses a differing file and writes nothing",
		kept.status === 1 && /different bytes|differs|refus/i.test(kept.stderr) && !fs.existsSync(path.join(into, names[0])) &&
		fs.readFileSync(path.join(into, names.at(-1))).equals(differing) && fs.readdirSync(into).length === 1,
		JSON.stringify({ stderr: kept.stderr, files: fs.readdirSync(into) }));
}

// Repo A as the original file left it for this block: detached at its first commit.
A.at(0);
// 4. regular stdout/stderr redirection into either tracked or untracked reviewed files refuses admission
{
	freshHome("redirect");
	let redirectsRefused = true;
	for (const [kind, target, stdioSlot] of [["tracked stdout", path.join(A.d, "f"), 1], ["untracked stderr", path.join(A.d, "redirect.log"), 2]]) {
		if (kind.includes("untracked")) fs.writeFileSync(target, "untouched");
		const invoked = path.join(tmp, `${kind.replaceAll(" ", "-")}.invoked`);
		const before = fs.readFileSync(target);
		for (const [launcher, args] of [["pi-review", [PI_REVIEW, "--item", `redirect-${kind}`]], ["review-ledger", [LEDGER_CLI, "run", "--item", `redirect-ledger-${kind}`]]]) {
			const fd = fs.openSync(target, "r+");
			const stdio = ["ignore", "pipe", "pipe"]; stdio[stdioSlot] = fd;
			const childCommand = launcher === "review-ledger"
				? [process.execPath, "-e", `require('fs').writeFileSync(${JSON.stringify(invoked)}, 'started'); console.log('VERDICT: LAND')`]
				: ["-p", "x"];
			const r = spawnSync(process.execPath, [...args, "--out", out(), "--", ...childCommand],
				{ cwd: A.d, env: env({ STUB: "verdict", INVOKED: invoked }), encoding: "utf8", stdio });
			fs.closeSync(fd);
			const msg = stdioSlot === 2 ? fs.readFileSync(target, "utf8") : (r.stderr || "");
			redirectsRefused &&= r.status === 1 && msg.includes(`redirect the review log outside the reviewed tree (${path.basename(target)})`) &&
				!fs.existsSync(invoked) && (stdioSlot === 2 || fs.readFileSync(target).equals(before));
		}
	}
	// req: R-620 R-3455
	check("tracked stdout and untracked stderr redirects into the reviewed tree are refused through both launchers", redirectsRefused);
}

// 5. reject incomplete review-shaped outputs through both launch paths
{
	freshHome("shape");
	const rejected = ["I am still finding the relevant files; will continue.", "Context limit reached before I could land on a verdict.", "verdict: LAND", "xVERDICT: LAND"];
	const accepted = "--- VERDICT: LAND";
	let piRejects = true, ledgerRejects = true, piAccepts = true, ledgerAccepts = true;
	for (const [i, text] of rejected.entries()) {
		const pi = piReview(["--item", `shape-pi-${i}`, "--out", out()], { stub: "plain-review", cwd: A.d, extra: text });
		piRejects &&= pi.status === 1 && /FAILED/.test(pi.stderr);
		const via = ledgerRun(["--item", `shape-ledger-${i}`], { cwd: A.d,
			cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(text)})`] });
		ledgerRejects &&= via.status === 1 && /no verdict/.test(via.stderr);
	}
	const piAllowed = piReview(["--item", "shape-pi-allowed", "--out", out()], { stub: "plain-review", cwd: A.d, extra: accepted });
	piAccepts &&= piAllowed.status === 0;
	const ledgerAllowed = ledgerRun(["--item", "shape-ledger-allowed"], { cwd: A.d,
		cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify(accepted)})`] });
	ledgerAccepts &&= ledgerAllowed.status === 0;
	const prefixed = ledgerRun(["--item", "shape-prefixed-verdict"], { cwd: A.d,
		cmd: [process.execPath, "-e", `process.stdout.write(${JSON.stringify("- VERDICT: BLOCK")})`] });
	// req: R-969
	check("prefixed verdict accepted by shape predicate is extracted into the recorded round",
		prefixed.status === 0 && roundsOf("shape-prefixed-verdict")[0]?.verdict === "BLOCK", JSON.stringify(roundsOf("shape-prefixed-verdict")));
	// req: R-701
	check("pi-review enforces the case-sensitive verdict line boundary", piRejects && piAccepts);
	// req: R-701
	check("review-ledger enforces the case-sensitive verdict line boundary", ledgerRejects && ledgerAccepts);
}

finish();
