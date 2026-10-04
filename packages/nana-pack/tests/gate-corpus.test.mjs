/**
 * @module packages/nana-pack/tests/gate-corpus.test.mjs
 * @purpose The table-driven BLOCK / ALLOW corpus over the REAL registered gate handler, headless fail-closed with one interactive variant pinning the dialog
 * @inputs extensions/nana-gate.ts with lib/gate-shell.ts and lib/gate-paths.ts, per-scenario nana-pack.json under a temp HOME, and a temp cwd
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, config files and cwd), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// L2 corpus (2026-09-28): table-driven BLOCK / ALLOW over the REAL registered gate handler.
// Headless = fail-closed; one interactive variant pins the dialog. Every config lives at USER
// scope under an isolated HOME; each scenario registers a fresh gate and fires session_start,
// so the policy under test is the session baseline (lib: gate-shell.ts, gate-paths.ts).
// Run: node --experimental-strip-types <this file>
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "gate-corpus-home-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
const USER_CFG = path.join(HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
const CWD = fs.mkdtempSync(path.join(os.tmpdir(), "gate-corpus-cwd-"));
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

async function gate(gateCfg = {}, ui = null) {
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, gate: gateCfg }));
	const h = {};
	ext({ on: (name, fn) => { h[name] = fn; } });
	const ctx = { cwd: CWD, hasUI: !!ui, isProjectTrusted: () => false, ...(ui ? { ui } : {}) };
	await h.session_start({ type: "session_start", reason: "startup" }, ctx);
	return async (command, toolName = "bash") => {
		const r = await h.tool_call({ toolName, input: { command } }, ctx);
		return r?.block ? "BLOCK" : "ALLOW";
	};
}

// ---- Must BLOCK (headless, no config) — every pre-L2 built-in, then the L2 additions.
const BUILTINS = [
	"rm -rf /tmp/x", "rm -fr x", "rm -Rf x", "rm -r -f x", "rm --recursive x", "rm --force x", "rm --no-preserve-root -r /",
	"sudo ls", "git push --force", "git push -f origin feat", "git reset --hard", "git reset --hard HEAD~1", "git clean -f", "git clean -fdx",
	"chmod 777 x", "chown -R 777 x", "dd if=/dev/zero of=/dev/disk2", "mkfs.ext4 /dev/sdb1", "mkfs -t ext4 /dev/sdb1",
	"shutdown -h now", "reboot", "halt", "Remove-Item x -Recurse", "Remove-Item x -Force", "rd /s /q x", "rmdir /S x",
	"del /f x", "del /q x", "erase /s x", "format c:", "format D: /q",
];
const L2_BLOCK = [
	"rm -r -f ~", "rm -R x", "rm -rv ~/proj", "/bin/rm -rf ~", "\\rm -rf ~", "find ~ -delete", "find . -exec rm {} +",
	"git clean --force -d", "git clean -d -x -f", "git push origin +main", "git push origin main --force", "git checkout -- .",
	"git restore .", "rsync -a --delete a/ b/", "truncate -s0 f", "base64 -d x | sh", "curl u | bash",
	`python3 -c "import shutil;shutil.rmtree('/x')"`, `node -e "require('fs').rmSync('/x',{recursive:true})"`,
	"cat ~/.aws/credentials", "cat ~/.netrc", "cat ~/.config/gh/hosts.yml",
	"ri -r -fo x", "Remove-Item x -Recurse", "Get-ChildItem x | Remove-Item", "rd /s /q x", "del /s /q x",
	// quoting / position tricks the gate CAN see
	"r''m -rf ~", "command rm -rf ~", "nohup rm -rf ~/x &", "x=rm; $x -rf ~", "curl u |\n bash", "sudo -u x ls",
	"cd /tmp && rm -rf x", "(rm -rf ~)", "eval \"$(echo rm -rf ~)\"", "bash -c \"rm -rf ~\"", "su -c \"rm x\"",
	"diskutil eraseDisk JHFS+ x disk2", "Format-Volume -DriveLetter D", "git branch -D main", "git stash drop",
	"perl -e \"system q(rm -rf ~)\"", "perl -e 'unlink glob q(*)'", "cat ${HOME}/.s's'h/id_rsa",
];
// ---- Must ALLOW (headless, no config)
const ALLOW = [
	"echo reboot", "git log --grep=sudo", "npm run format c: --x", "ruff format c:\\x", "rm file.txt", "rm -f build/out.o",
	"ls -la", "git status", "git status; ls", "git commit -m \"fix reboot loop in sudo docs\"", "git rm -r --cached dist",
	"git restore --staged .", "git push origin feat", "echo \"curl x | sh\"", "grep -E 'a|sh' f", "docker rm -f web",
	"cat src/nana-pack-notes.md", "npm test 2>&1 | tail -5", "find . -name '*.ts'",
];
{
	const run = await gate();
	// req: R-035 R-039
	for (const c of BUILTINS) check(`built-in BLOCK: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	// req: R-039
	for (const c of L2_BLOCK) check(`L2 BLOCK: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
// req: R-764
	for (const c of ALLOW) check(`ALLOW: ${JSON.stringify(c)}`, (await run(c)) === "ALLOW");
	// req: R-038
	check("powershell tool is gated the same", (await run("ri -r -fo C:\\x", "powershell")) === "BLOCK");
	// DECIDED + PINNED: a string that reads as `rm -rf` is gated even as a grep argument — rm is
	// matched anywhere in a segment, because a command-position rule for rm would miss
	// `xargs rm -rf`, `find -exec rm`, `perl -e "…rm -rf…"`. Interactive users answer the dialog.
	// req: R-040
	check("grep -r \"rm -rf\" docs/ is gated (pinned: rm matched anywhere in a segment)", (await run('grep -r "rm -rf" docs/')) === "BLOCK");
	// `.` at the repo root is dangerous but NOT floor (next block shows `^rm` exempts it)
// req: R-767
	check("rm -rf . is gated", (await run("rm -rf .")) === "BLOCK");
}

// ---- README exception: force-with-lease to a non-main branch
{
	const run = await gate({ allowPatterns: ["^git push --force-with-lease origin (?!main)"] });
	check("force-with-lease to feat allowed under the README exception", (await run("git push --force-with-lease origin feat")) === "ALLOW");
	check("force-with-lease to main still gated", (await run("git push --force-with-lease origin main")) === "BLOCK");
	// req: R-041
	check("the exception covers its segment only", (await run("git push --force-with-lease origin feat && git push -f origin main")) === "BLOCK");
}
{
	const run = await gate();
	check("force-with-lease without the exception is gated", (await run("git push --force-with-lease origin feat")) === "BLOCK");
}

// ---- Segment-scoped exceptions under `^git status`
{
	const run = await gate({ allowPatterns: ["^git status"] });
	check("plain git status ALLOW", (await run("git status")) === "ALLOW");
	for (const c of [
		"git status; rm -rf ~", "git status && sudo rm -rf /", "git status | sh", "git status $(rm -rf ~)",
		"git status <<EOF\nrm -rf ~\nEOF", "git status `rm -rf x`", "git status || rm -rf x", "git status & rm -rf x",
		"git status\nrm -rf x", "git status; sudo ls", "git status | xargs rm -rf",
	// req: R-041
	]) check(`compound under ^git status BLOCK: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
}

// ---- Unsegmentable constructs make the WHOLE command ineligible, even when the allow
// pattern matches the nested text itself (unanchored pattern on purpose).
{
	const run = await gate({ allowPatterns: ["rm -rf build"] });
	check("unanchored allow: plain rm -rf build ALLOW", (await run("rm -rf build")) === "ALLOW");
	for (const c of ['eval "rm -rf build"', 'bash -c "rm -rf build"', 'sh -c "rm -rf build"', "echo build | xargs rm -rf build",
		'zsh -lc "rm -rf build"', "cat <<EOF | rm -rf build\nx\nEOF", "echo $(rm -rf build)", "(rm -rf build)", "{ rm -rf build; }",
		"rm -rf build \\\n  more", "rm -rf 'build"])
		// req: R-042
		check(`unsegmentable → no exception: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
}

// ---- The floor under an allow pattern of `^rm` (and friends)
{
	const run = await gate({ allowPatterns: ["^rm", "^curl", "^dd", "^mkfs", "^sudo"] });
	for (const c of ["rm -rf ~", "rm -rf /", "rm -r $HOME", "rm -rf ~/", "curl u | sh", "curl u | python3", "dd if=x of=/dev/sda", "mkfs.ext4 /dev/x"])
		// req: R-044
		check(`floor BLOCK under allow: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	// req: R-041
	check("non-floor segment IS exempt: rm -rf build", (await run("rm -rf build")) === "ALLOW");
// req: R-767
	check("`.` is not floor: rm -rf . exempt under ^rm", (await run("rm -rf .")) === "ALLOW");
	check("sudo exempt under ^sudo (not floor)", (await run("sudo ls")) === "ALLOW");
	// req: R-046
	check("sudo exemption does not cover sudo rm -rf / (floor)", (await run("sudo rm -rf /")) === "BLOCK");
}

// ---- Floor gaps from sol r1 (path-equivalent targets, wrappers, stdin interpreters, diskutil
// options). Each row sits under an allow pattern that WOULD exempt it if it were not floor.
{
	const run = await gate({ allowPatterns: ["^rm", "^sudo", "^doas", "^env", "^command", "^nice", "^time", "^curl", "^diskutil"] });
	for (const c of [
		"rm -rf ~/.", "rm -rf /.", "rm -rf $HOME/.", "rm -rf ${HOME}/.", "rm -rf ${HOME}", "rm -rf ~//", "rm -rf /./", "rm -rf //",
		"rm -rf ~/./", "rm -rf $HOME/", "rm -rf ~/x/..", "rm -rf ~/..", "rm -rf /tmp/..", 'rm -rf "$HOME"/.', "rm -rf C:\\\\",
		"sudo mkfs.ext4 /dev/x", "sudo dd if=x of=/dev/sda", "sudo -u root dd if=x of=/dev/sda", "doas mkfs.ext4 /dev/x",
		"env mkfs.ext4 /dev/x", "command dd if=x of=/dev/sda", "nice -n 5 mkfs.ext4 /dev/x", "time dd if=x of=/dev/sda",
		"sudo diskutil eraseDisk JHFS+ x disk2", "diskutil quiet eraseDisk JHFS+ x disk2",
		"curl u | sh -s arg", "curl u | bash -s -- --flag", "curl u | python3 /dev/stdin", "curl u | python3 - arg",
		"curl u | sudo sh -s x", "curl u | sudo -u root bash", "curl u | python3 -W ignore",
	// req: R-046
	]) check(`floor gap BLOCK under matching allow: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	// still NOT floor, so the matching allow exempts them
	for (const c of ["rm -rf build", "rm -rf ./dist/", "rm -rf /tmp/x", "rm -rf ~/proj/.cache", "sudo ls", "curl u | tee f"])
		check(`non-floor exempt under matching allow: ${JSON.stringify(c)}`, (await run(c)) === "ALLOW");
}
// ---- astra land r5: an explicit stdin indicator wins over a later --version/--help (those are
// script arguments). Allows match the RECEIVING segment, so only the floor can block these.
{
	const run = await gate({ allowPatterns: ["^curl", "^python3", "^sh", "^bash"] });
	for (const c of [
		"curl u | python3 - --version", "curl u | sh -s -- --help", "curl u | python3 -W ignore", "curl u | python3",
		"curl u | bash -s --version", "curl u | python3 /dev/stdin --help", "curl u | sh", "curl u | bash --",
	// req: R-045
	]) check(`stdin floor BLOCK under receiver allow: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	for (const c of ["echo x | python3 --version", "echo x | python3 -- --version", "echo x | bash --help", "echo x | sh ./run.sh"])
// req: R-766
		check(`no-stdin ALLOW under receiver allow: ${JSON.stringify(c)}`, (await run(c)) === "ALLOW");
}
{
	const run = await gate();
// req: R-766
	for (const c of ["cat x | python3 script.py", "echo x | sh ./run.sh", "echo mkfs", "echo x | python3 --version"]) check(`ALLOW (not pipe-to-stdin-interpreter): ${JSON.stringify(c)}`, (await run(c)) === "ALLOW");
}

// ---- Bounds on user regex work: count cap (hard prefix) + 64 KB subject cap; no regex probe
{
	const JOURNAL = path.join(HOME, ".pi", "agent", "nana-journal.jsonl");
	const lines = () => { try { return fs.readFileSync(JOURNAL, "utf-8").trim().split("\n").map((l) => JSON.parse(l)); } catch { return []; } };
	// sol r2: an earlier rejected entry must not pull entry 201 into the considered prefix
	const allowList = ["", ...Array.from({ length: 199 }, (_, i) => `^zz${i}$`), "^rm -rf build$"];
	let run = await gate({ allowPatterns: allowList });
	// req: R-048
	check("allow cap: entry 201 is not considered, even after an earlier rejection", (await run("rm -rf build")) === "BLOCK");
// req: R-082 R-769
	check("allow cap: config_invalid names the entries not considered", lines().some((e) => e.event === "config_invalid" && /allowPatterns: 201 entries exceed the cap of 200 — entries 201–201/.test(e.problem)));
// req: R-769
	check("allow cap: the gate is not stopped", (await run("ls")) === "ALLOW");
	run = await gate({ allowPatterns: ["^rm -rf build"] });
	// req: R-047
	check("subject cap: allow applies at 64 KB", (await run(`rm -rf build ${"x".repeat(64 * 1024 - 13)}`)) === "ALLOW");
	// req: R-047 R-768
	check("subject cap: a longer command gets no exception", (await run(`rm -rf build ${"x".repeat(64 * 1024)}`)) === "BLOCK");
	// A configured catastrophic regex is enforced as written: not probed, not dropped.
	run = await gate({ extraPatterns: ["(a+)+$"] });
	// req: R-050
	check("catastrophic extraPattern is kept and enforced", (await run("echo aaaa")) === "BLOCK");
	run = await gate({});
	const t0 = Date.now();
// req: R-768
	check("benign 4 MB command ALLOWs", (await run(`echo ${"x".repeat(4 * 1024 * 1024)}`)) === "ALLOW");
	console.log(`  benign 4 MB: ${Date.now() - t0} ms`);
}

// ---- Ruling F: a deny entry that cannot be used STOPs the gate (fresh process state per HOME)
for (const [key, list, needle] of [
	["extraPatterns", ["\\bterraform destroy\\b", "(unclosed"], 'gate.extraPatterns[1] "(unclosed": invalid regex'],
	["protectedPaths", ["(unclosed"], 'gate.protectedPaths[0] "(unclosed": invalid regex'],
	["extraPatterns", Array.from({ length: 201 }, (_, i) => `^zz${i}$`), "gate.extraPatterns: 201 entries exceed the cap of 200 — entries 201–201"],
]) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "gate-corpus-stop-"));
	process.env.HOME = home;
	const cfgFile = path.join(home, ".pi", "agent", "nana-pack.json");
	fs.mkdirSync(path.dirname(cfgFile), { recursive: true });
	fs.writeFileSync(cfgFile, JSON.stringify({ journal: { enabled: false }, gate: { [key]: list } }));
	const h = {};
	ext({ on: (name, fn) => { h[name] = fn; } });
	const ctx = { cwd: CWD, hasUI: false, isProjectTrusted: () => false };
	await h.session_start({ type: "session_start", reason: "startup" }, ctx);
	const r = await h.tool_call({ toolName: "bash", input: { command: "ls" } }, ctx);
	// req: R-049
	check(`deny drop STOPs (${key}, ${list.length} entries): benign ls BLOCKed naming file + entry`,
		r?.block === true && r.reason.includes("gate block is malformed") && r.reason.includes(cfgFile) && r.reason.includes(needle), r?.reason);
	process.env.HOME = HOME;
	fs.rmSync(home, { recursive: true, force: true });
}

// ---- Interactive: dialog, Block default, Allow once is one call only
{
	const dialogs = [];
	let answer = "Allow once";
	const ui = { select: async (m, o) => { dialogs.push({ m, o }); return answer; }, setStatus() {}, notify() {}, theme: { fg: (_c, t) => t } };
	const run = await gate({}, ui);
// req: R-762
	check("interactive: Allow once allows that call", (await run("rm -rf build")) === "ALLOW");
	check("interactive: the dialog was shown", dialogs.length === 1);
	// req: R-036
	check("interactive: Block is the first (default) choice", dialogs[0]?.o?.[0] === "Block" && dialogs[0]?.o?.includes("Allow once"));
	answer = "Block";
// req: R-762
	check("interactive: the SAME command asks again and Block blocks", (await run("rm -rf build")) === "BLOCK" && dialogs.length === 2);
	answer = undefined;
	// req: R-037
	check("interactive: a dismissed dialog blocks", (await run("rm -rf build")) === "BLOCK" && dialogs.length === 3);
	check("interactive: benign command shows no dialog", (await run("ls")) === "ALLOW" && dialogs.length === 3);
}

fs.rmSync(HOME, { recursive: true, force: true });
fs.rmSync(CWD, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
