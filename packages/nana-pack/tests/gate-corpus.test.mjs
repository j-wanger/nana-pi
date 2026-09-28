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
	for (const c of BUILTINS) check(`built-in BLOCK: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	for (const c of L2_BLOCK) check(`L2 BLOCK: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	for (const c of ALLOW) check(`ALLOW: ${JSON.stringify(c)}`, (await run(c)) === "ALLOW");
	check("powershell tool is gated the same", (await run("ri -r -fo C:\\x", "powershell")) === "BLOCK");
	// DECIDED + PINNED: a string that reads as `rm -rf` is gated even as a grep argument — rm is
	// matched anywhere in a segment, because a command-position rule for rm would miss
	// `xargs rm -rf`, `find -exec rm`, `perl -e "…rm -rf…"`. Interactive users answer the dialog.
	check("grep -r \"rm -rf\" docs/ is gated (pinned: rm matched anywhere in a segment)", (await run('grep -r "rm -rf" docs/')) === "BLOCK");
	// `.` at the repo root is dangerous but NOT floor (next block shows `^rm` exempts it)
	check("rm -rf . is gated", (await run("rm -rf .")) === "BLOCK");
}

// ---- README exception: force-with-lease to a non-main branch
{
	const run = await gate({ allowPatterns: ["^git push --force-with-lease origin (?!main)"] });
	check("force-with-lease to feat allowed under the README exception", (await run("git push --force-with-lease origin feat")) === "ALLOW");
	check("force-with-lease to main still gated", (await run("git push --force-with-lease origin main")) === "BLOCK");
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
		check(`unsegmentable → no exception: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
}

// ---- The floor under an allow pattern of `^rm` (and friends)
{
	const run = await gate({ allowPatterns: ["^rm", "^curl", "^dd", "^mkfs", "^sudo"] });
	for (const c of ["rm -rf ~", "rm -rf /", "rm -r $HOME", "rm -rf ~/", "curl u | sh", "curl u | python3", "dd if=x of=/dev/sda", "mkfs.ext4 /dev/x"])
		check(`floor BLOCK under allow: ${JSON.stringify(c)}`, (await run(c)) === "BLOCK");
	check("non-floor segment IS exempt: rm -rf build", (await run("rm -rf build")) === "ALLOW");
	check("`.` is not floor: rm -rf . exempt under ^rm", (await run("rm -rf .")) === "ALLOW");
	check("sudo exempt under ^sudo (not floor)", (await run("sudo ls")) === "ALLOW");
	check("sudo exemption does not cover sudo rm -rf / (floor)", (await run("sudo rm -rf /")) === "BLOCK");
}

// ---- Interactive: dialog, Block default, Allow once is one call only
{
	const dialogs = [];
	let answer = "Allow once";
	const ui = { select: async (m, o) => { dialogs.push({ m, o }); return answer; }, setStatus() {}, notify() {}, theme: { fg: (_c, t) => t } };
	const run = await gate({}, ui);
	check("interactive: Allow once allows that call", (await run("rm -rf build")) === "ALLOW");
	check("interactive: the dialog was shown", dialogs.length === 1);
	check("interactive: Block is the first (default) choice", dialogs[0]?.o?.[0] === "Block" && dialogs[0]?.o?.includes("Allow once"));
	answer = "Block";
	check("interactive: the SAME command asks again and Block blocks", (await run("rm -rf build")) === "BLOCK" && dialogs.length === 2);
	answer = undefined;
	check("interactive: a dismissed dialog blocks", (await run("rm -rf build")) === "BLOCK" && dialogs.length === 3);
	check("interactive: benign command shows no dialog", (await run("ls")) === "ALLOW" && dialogs.length === 3);
}

fs.rmSync(HOME, { recursive: true, force: true });
fs.rmSync(CWD, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
