#!/usr/bin/env node
// Seat wrong-code pairs for lane win-lock-fix-command (install, hook or gate lane), written by the seat 2026-10-20 on
// the build tip 74606671, on the shared runner. Each pair puts one lane site back to today's main behaviour or to the
// obvious wrong form (build-brief-1.md "Wrong code to try" 1-15, plus the lock name, the lock folder, steps' holder
// read and two doctor wording claims from plan-attack.md and the seat's probes). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-lock-fix-command-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SL = "packages/nana-setup/lib/settings-lock.mjs";
const ST = "packages/nana-setup/lib/steps.mjs";
const DR = "packages/nana-setup/lib/doctor.mjs";
const SMT = "packages/nana-setup/tests/settings-merge.test.mjs";
const SLT = "packages/nana-setup/tests/settings-lock.test.mjs";
const IT = "packages/nana-setup/tests/install.test.mjs";
const WDT = "packages/nana-setup/tests/win32-degrade.test.mjs";
const R2080 = "R-2080: a held settings lock stops install printing the lock path, the recorded pid, its age and each removal command alone on its line under its shell";
const R2081 = "R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file";
const R2084 = "R-2084: while the settings lock exists, doctor marks a settings lock row ✗ naming the lock, its pid and age, and every removal command install prints";
const R2085 = "R-2085: while the settings lock exists, doctor's last line lists settings lock among the rows to fix by hand, on a fresh home and on an installed one";
const HEALTHY = "doctor prints no ✗ after install";
const HEALTHY_WIN32 = "win32 doctor prints no ✗";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS; the forced-win32 halves of R-2080 and R-2084 stand in for the Windows output shape, and R-2082 and R-2083 print SKIP here, so no pair names them",
	"(b) the PowerShell line's typographic-quote doubling (build-brief-1 wrong code 16: double only U+0027) has no pair: only R-2083 reads it, and R-2083 runs only on the Windows leg",
	"(c) M22 (doctor's label after its command) and M23 (doctor's row drops the 'if no nana-setup is running' caveat) change wording R-2084 does not read; each names R-2084 and is expected to survive, which says no must-meet check pins that claim",
];

const R2084_CAVEAT = "R-2084: doctor's settings lock row, on a fresh and an installed home, says to remove the lock only if no nana-setup is running"; // build 3 (cdccc250)
const R2084_ORDER = "R-2084: on win32 doctor's settings lock row puts each shell label before its command and ends on a command"; // build 3 (cdccc250)

const PAIRS = [
	// settings-lock.mjs — removalCommands, POSIX line
	{ n: "M1", name: "the sh line is main's unquoted rm", edits: [
		one(SL, "command: `rm ${shq(lock)}` }", "command: `rm ${lock}` }"),
	], tests: [SMT, SLT], expectRed: [R2080, R2081] },
	{ n: "M2", name: "the sh line double-quotes the lock path", edits: [
		one(SL, "command: `rm ${shq(lock)}` }", "command: `rm \"${lock}\"` }"),
	], tests: [SMT, SLT], expectRed: [R2080, R2081] },
	{ n: "M3", name: "the sh line single-quotes the lock path without escaping its quotes", edits: [
		one(SL, "command: `rm ${shq(lock)}` }", "command: `rm '${lock}'` }"),
	], tests: [SLT], expectRed: [R2081] },
	// settings-lock.mjs — removalCommands, win32 lines
	{ n: "M4", name: "win32 returns only the Command Prompt line", edits: [
		one(SL, "{ shell: \"PowerShell\", command: `Remove-Item -LiteralPath '${powerShellPath}'` },", ""),
	], tests: [SMT, SLT], expectRed: [R2080, R2084] },
	{ n: "M5", name: "the PowerShell line double-quotes the lock path", edits: [
		one(SL, "`Remove-Item -LiteralPath '${powerShellPath}'`", "`Remove-Item -LiteralPath \"${lock}\"`"),
	], tests: [SMT], expectRed: [R2080] },
	{ n: "M6", name: "the PowerShell line uses -Path, which reads [ ] as a pattern", edits: [
		one(SL, "Remove-Item -LiteralPath", "Remove-Item -Path"),
	], tests: [SMT], expectRed: [R2080] },
	{ n: "M7", name: "the Command Prompt line leaves the lock path unquoted", edits: [
		one(SL, "command: `del \"${lock}\"` }", "command: `del ${lock}` }"),
	], tests: [SMT], expectRed: [R2080] },
	// settings-lock.mjs — lockHolder, SETTINGS_LOCK_NAME, settingsLockPath
	{ n: "M8", name: "lockHolder reads the wrong pid field", edits: [
		one(SL, "held?.pid ? `pid ${held.pid}`", "held?.id ? `pid ${held.id}`"),
	], tests: [SMT, SLT], expectRed: [R2080, R2084] },
	{ n: "M9", name: "the moved lock name drops its leading dot", edits: [
		one(SL, "\".settings.json.nana-setup.lock\"", "\"settings.json.nana-setup.lock\""),
	], tests: [SMT], expectRed: [R2080] },
	{ n: "M10", name: "settingsLockPath names the home folder instead of the Claude folder", edits: [
		one(SL, "return path.join(path.dirname(file), SETTINGS_LOCK_NAME);", "return path.join(path.dirname(path.dirname(file)), SETTINGS_LOCK_NAME);"),
	], tests: [SMT, SLT], expectRed: [R2080, R2081, R2084, R2085] },
	// steps.mjs — withSettingsLock
	{ n: "M11", name: "install's native line is main's unquoted rm", edits: [
		one(ST, "? `  ${commands[0].command}`", "? `  rm ${lock}`"),
	], tests: [SMT, SLT], expectRed: [R2080, R2081, R2084] },
	{ n: "M12", name: "install picks the commands by process.platform, ignoring NANA_SETUP_PLATFORM", edits: [
		one(ST, "const commands = removalCommands(lock, platform());", "const commands = removalCommands(lock, process.platform);"),
	], tests: [SMT, SLT], expectRed: [R2080, R2084] },
	{ n: "M13", name: "install puts each shell label on its command's line", edits: [
		one(ST, "`  in ${shell}:\\n    ${command}`", "`  in ${shell}: ${command}`"),
	], tests: [SMT, SLT], expectRed: [R2080, R2084] },
	{ n: "M14", name: "install reads the holder from the settings file, not the lock", edits: [
		one(ST, "`  written: ${lockHolder(lock)}\\n`", "`  written: ${lockHolder(file)}\\n`"),
	], tests: [SMT], expectRed: [R2080] },
	// doctor.mjs — the settings lock row
	{ n: "M15", name: "doctor has no settings lock row (main)", edits: [
		one(DR, "if (!settingsLockStat) add(OK, \"settings lock\", \"no leftover lock\");", "if (true) { /* main: no settings lock row */ }"),
	], tests: [SLT], expectRed: [R2084, R2085] },
	{ n: "M16", name: "doctor's lock row is a warning, not a ✗", edits: [
		one(DR, "add(FAIL, \"settings lock\",", "add(WARN, \"settings lock\","),
	], tests: [SLT], expectRed: [R2084, R2085] },
	{ n: "M17", name: "doctor picks the commands by process.platform, ignoring NANA_SETUP_PLATFORM", edits: [
		one(DR, "removalCommands(settingsLock, platform())", "removalCommands(settingsLock, process.platform)"),
	], tests: [SLT], expectRed: [R2084] },
	{ n: "M18", name: "doctor's row drops the holder", edits: [
		one(DR, "is left over (${lockHolder(settingsLock)})", "is left over"),
	], tests: [SLT], expectRed: [R2084] },
	{ n: "M19", name: "doctor's win32 row names only the first command", edits: [
		one(DR, "const fix = commands.length === 1", "const fix = true"),
	], tests: [SLT], expectRed: [R2084] },
	{ n: "M20", name: "doctor's row carries an installLabel the dry run creates", edits: [
		one(DR, "remove it: ${fix}`);", "remove it: ${fix}`, \"settings SessionStart objective\");"),
	], tests: [SLT], expectRed: [R2085] },
	{ n: "M21", name: "doctor lstats the Claude folder instead of the lock", edits: [
		one(DR, "const settingsLockStat = lstatSafe(settingsLock);", "const settingsLockStat = lstatSafe(path.dirname(settingsLock));"),
	], tests: [IT, WDT], expectRed: [HEALTHY, HEALTHY_WIN32] },
	{ n: "M22", name: "doctor's win32 row puts each label after its command (plan-attack amendment 2)", edits: [
		one(DR, "`in ${commands[0].shell}: ${commands[0].command} — or in ${commands[1].shell}: ${commands[1].command}`", "`${commands[0].command} (${commands[0].shell}) — or ${commands[1].command} (${commands[1].shell})`"),
	], tests: [SLT], expectRed: [R2084_ORDER] },
	{ n: "M23", name: "doctor's row calls the lock safe to delete, dropping the live-install caveat", edits: [
		one(DR, "install will not run until it is removed; if no nana-setup is running, remove it:", "it is left over from an interrupted run and safe to delete:"),
	], tests: [SLT], expectRed: [R2084_CAVEAT] },
];

process.exitCode = await runMutations({ lane: "win-lock-fix-command", self: import.meta.url, tip: "cdccc250", declared: DECLARED, pairs: PAIRS });
