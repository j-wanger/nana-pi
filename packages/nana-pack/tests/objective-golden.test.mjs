import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
// Golden corpus (lane T2a): for every case, the Claude Code hook's stdout and the pi
// extension's injected text are BYTE-IDENTICAL once the hook's leading "[nana:objective]"
// tag line is removed — nothing else is normalised. The hook runs for real (bash, through
// a symlink the way nana-setup installs it, node on PATH); the pi side drives the real
// registered handlers. Each case also pins what the text must say, so "identical" can
// never pass by both sides printing the same wrong thing (or nothing).
// Run: node --experimental-strip-types <this file>

let fails = 0;
const check = (n, ok, extra) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) { fails++; if (extra) console.log(extra); } };

const here = path.dirname(fileURLToPath(import.meta.url));
const hookSrc = path.resolve(here, "../../nana-setup/claude/hooks/nana-objective.sh");
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "objective-golden-")));
const origHome = process.env.HOME;
const ext = (await import(new URL("../extensions/nana-objective.ts", import.meta.url).href)).default;

const OBJ = (s) => `**Objective (since 2026-09-28):** ${s}`;
const PRI = (s) => `**Current priority (since 2026-09-28):** ${s}`;
const UMBRELLA = `# Objective and current priority\n\n*preamble*\n\n${OBJ("build products with agents.")}\n\n${PRI("make nana-pi coherent.")}\n\n## Rules\n\n- a rule\n`;
const PRODUCT = `# Objective — widget\n\n${OBJ("ship the widget.")}\n\n${PRI("the walking skeleton.")}\n\n## Rules\n\n- product rule\n`;
const HEAD = "## Objective and current priority (nana)";
const CHARGE = "Every session must be able to say which of these lines its spend serves. If it cannot, say so to the user before spending.";

let n = 0;
/**
 * A fresh world: HOME with nana-pack.json, the umbrella at ~/loop/OBJECTIVE.md, a product at ~/work/widget.
 * config:false = a FRESH MACHINE: no nana-pack.json at all, so the umbrella is the default
 * ~/.pi/agent/nana-objective.md. projectFile: undefined = key absent; any other value is written as-is.
 */
function world(opts = {}) {
	const { umbrella = UMBRELLA, enabled, config = true } = opts;
	// NOT a destructuring default: an explicit { projectFile: undefined } must mean "key absent".
	const projectFile = "projectFile" in opts ? opts.projectFile : "OBJECTIVE.md";
	const home = path.join(scratch, `h${++n}`);
	const loop = path.join(home, "loop");
	const product = path.join(home, "work", "widget");
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	fs.mkdirSync(loop, { recursive: true });
	fs.mkdirSync(product, { recursive: true });
	fs.mkdirSync(path.join(home, "elsewhere"), { recursive: true });
	const umbrellaFile = config ? path.join(loop, "OBJECTIVE.md") : path.join(home, ".pi", "agent", "nana-objective.md");
	if (umbrella !== null) fs.writeFileSync(umbrellaFile, umbrella);
	const objective = { path: umbrellaFile, ...(projectFile === undefined ? {} : { projectFile }), ...(enabled === undefined ? {} : { enabled }) };
	if (config) fs.writeFileSync(path.join(home, ".pi", "agent", "nana-pack.json"), JSON.stringify({ journal: { enabled: false }, objective }));
	// installed the way nana-setup does it: ~/.claude/hooks/nana-objective.sh -> repo
	fs.mkdirSync(path.join(home, ".claude", "hooks"), { recursive: true });
	fs.symlinkSync(hookSrc, path.join(home, ".claude", "hooks", "nana-objective.sh"));
	return { home, loop, product, umbrellaFile, productFile: path.join(product, "OBJECTIVE.md") };
}

/** noProjectDir: CLAUDE_PROJECT_DIR unset — the hook runs IN cwd and must fall back to $PWD. */
function runHook(w, cwd, { noProjectDir = false } = {}) {
	const env = { HOME: w.home, PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin` };
	if (!noProjectDir) env.CLAUDE_PROJECT_DIR = cwd;
	const r = spawnSync("bash", [path.join(w.home, ".claude", "hooks", "nana-objective.sh")], {
		cwd: noProjectDir ? cwd : w.home,
		env,
		encoding: "utf-8",
		timeout: 10000,
	});
	return { status: r.status, out: r.stdout ?? "" };
}

async function runPi(w, cwd) {
	process.env.HOME = w.home;
	try {
		const h = {};
		ext({ on: (name, fn) => { h[name] = fn; } });
		const ctx = { cwd, hasUI: false, isProjectTrusted: () => false };
		await h.session_start({ reason: "startup" }, ctx);
		const r = await h.before_agent_start({ systemPrompt: "BASE" }, ctx);
		return r === undefined ? null : r.systemPrompt;
	} finally {
		process.env.HOME = origHome;
	}
}

/** The one comparison: hook stdout minus its tag line === pi's injected block. */
async function golden(label, w, cwd, expect, hookOpts) {
	const hook = runHook(w, cwd, hookOpts);
	const pi = await runPi(w, cwd);
	check(`${label}: hook exits 0`, hook.status === 0, hook.out);
	let hookText = null;
	if (hook.out !== "") {
		check(`${label}: hook stdout starts with exactly one tag line`, hook.out.startsWith("[nana:objective]\n") && hook.out.endsWith("\n"), hook.out);
		hookText = hook.out.replace(/^\[nana:objective\]\n/, "").replace(/\n$/, "");
	}
	let piText = null;
	if (pi !== null) {
		check(`${label}: pi keeps the base prompt, then one blank line`, pi.startsWith("BASE\n\n"), pi);
		piText = pi.slice("BASE\n\n".length);
	}
	check(`${label}: BYTE-IDENTICAL hook vs pi`, hookText === piText, `--- hook\n${hookText}\n--- pi\n${piText}`);
	expect(hookText ?? "", pi === null);
	return hookText;
}

// 1. umbrella governs (no product file anywhere up the tree)
{
	const w = world();
	const t = await golden("umbrella governs", w, path.join(w.home, "elsewhere"), () => {});
	check("umbrella governs: exact text", t === [HEAD, `governing: ${w.umbrellaFile}\n${OBJ("build products with agents.")}\n\n${PRI("make nana-pi coherent.")}`, CHARGE].join("\n\n"), t);
}

// 2. product governs: product lines, then the program objective AND current priority, labelled, with precedence
{
	const w = world();
	fs.writeFileSync(w.productFile, PRODUCT);
	const t = await golden("product governs", w, w.product, () => {});
	check("product governs: exact text", t === [
		HEAD,
		`governing: ${w.productFile}\n${OBJ("ship the widget.")}\n\n${PRI("the walking skeleton.")}`,
		`program objective: ${OBJ("build products with agents.")}\nprogram current priority: ${PRI("make nana-pi coherent.")}`,
		`Precedence: the lines from ${w.productFile} govern this session's work; the program lines (${w.umbrellaFile}) say what the toolkit is for.`,
		CHARGE,
	].join("\n\n"), t);
}

// 3. nested cwd under a product
{
	const w = world();
	fs.writeFileSync(w.productFile, PRODUCT);
	const deep = path.join(w.product, "src", "a", "b");
	fs.mkdirSync(deep, { recursive: true });
	await golden("nested cwd", w, deep, (t) => {
		check("nested cwd: the ancestor product governs", t.includes(`governing: ${w.productFile}\n`));
		check("nested cwd: program priority shown", t.includes(`program current priority: ${PRI("make nana-pi coherent.")}`));
	});
}

// 4. the umbrella IS the nearest file: no duplicate program block
{
	const w = world();
	await golden("umbrella is the hit", w, w.loop, (t) => {
		check("umbrella is the hit: governs", t.includes(`governing: ${w.umbrellaFile}\n`));
		check("umbrella is the hit: no duplicate program block", !t.includes("program objective") && !t.includes("Precedence:"));
	});
}

// 5. missing file: the SAME named marker in both runtimes (the hook used to be silent)
{
	const w = world({ umbrella: null });
	const t = await golden("missing file", w, path.join(w.home, "elsewhere"), () => {});
	check("missing file: exact marker", t === `${HEAD}\n\nOBJECTIVE UNAVAILABLE: file not found (${w.umbrellaFile}). Tell the user before spending.`, t);
}

// 6. unreadable file (mode 000 when not root; a directory otherwise)
{
	const w = world();
	if (process.getuid?.() === 0) { fs.rmSync(w.umbrellaFile); fs.mkdirSync(w.umbrellaFile); } else fs.chmodSync(w.umbrellaFile, 0o000);
	await golden("unreadable file", w, path.join(w.home, "elsewhere"), (t) => {
		check("unreadable file: named marker", t.includes(`OBJECTIVE UNAVAILABLE: unreadable (${w.umbrellaFile})`), t);
	});
	fs.chmodSync(w.umbrellaFile, 0o644);
}

// 7. unreadable PRODUCT file: refused out loud, the umbrella governs
{
	const w = world();
	fs.writeFileSync(w.productFile, PRODUCT);
	fs.chmodSync(w.productFile, 0o000);
	await golden("unreadable product file", w, w.product, (t) => {
		if (process.getuid?.() !== 0) check("unreadable product: refusal printed", t.includes(`(ignored ${w.productFile}: unreadable — the program file governs)`), t);
		check("unreadable product: never crashes into silence", t.startsWith(HEAD));
	});
	fs.chmodSync(w.productFile, 0o644);
}

// 8. symlinked OBJECTIVE.md in a product: refused, umbrella governs, refusal printed, target never shown
{
	const w = world();
	const secret = path.join(w.product, "id_rsa");
	fs.writeFileSync(secret, "SUPERSECRET\n");
	fs.symlinkSync(secret, w.productFile);
	await golden("symlinked OBJECTIVE.md", w, w.product, (t) => {
		check("symlink: target never shown", !t.includes("SUPERSECRET"));
		check("symlink: refusal printed", t.includes(`(ignored ${w.productFile}: reached through a symlink — the program file governs)`), t);
		check("symlink: umbrella governs", t.includes(`governing: ${w.umbrellaFile}\n`));
	});
}

// 9. cwd that is itself a symlink to the product: same walk, same text
{
	const w = world();
	fs.writeFileSync(w.productFile, PRODUCT);
	const link = path.join(w.home, "wlink");
	fs.symlinkSync(w.product, link);
	await golden("symlinked cwd", w, link, (t) => {
		check("symlinked cwd: product governs via the link path", t.includes(`governing: ${path.join(link, "OBJECTIVE.md")}\n`), t);
	});
}

// 10. objective.projectFile absent / null / false: NOT "off" — OBJECTIVE.md is still found (walk-up is the default)
for (const [label, projectFile] of [["absent", undefined], ["null", null], ["false", false]]) {
	const w = world({ projectFile });
	fs.writeFileSync(w.productFile, PRODUCT);
	await golden(`projectFile ${label}`, w, w.product, (t) => {
		check(`projectFile ${label}: OBJECTIVE.md still found, product governs`,
			t.includes(`governing: ${w.productFile}\n${OBJ("ship the widget.")}`) && t.includes(`program current priority: ${PRI("make nana-pi coherent.")}`), t);
	});
}

// 11. objective.projectFile names a DIFFERENT filename: that name wins, even over an OBJECTIVE.md beside it
{
	const w = world({ projectFile: "WIDGET-OBJECTIVE.md" });
	const custom = path.join(w.product, "WIDGET-OBJECTIVE.md");
	fs.writeFileSync(custom, PRODUCT);
	fs.writeFileSync(w.productFile, `${OBJ("the WRONG file.")}\n`);
	await golden("projectFile custom name", w, w.product, (t) => {
		check("projectFile custom: that name governs", t.includes(`governing: ${custom}\n${OBJ("ship the widget.")}`) && t.includes("program current priority"), t);
		check("projectFile custom: the default-named file beside it is not used", !t.includes("the WRONG file."), t);
	});
}

// 12. no **Current priority line
{
	const w = world();
	fs.writeFileSync(w.productFile, `${OBJ("ship the widget.")}\n\nno priority here\n`);
	await golden("no current priority", w, w.product, (t) => {
		check("no priority: named placeholder", t.includes(`${OBJ("ship the widget.")}\n\n(no **Current priority line in this file)`), t);
	});
}

// 13. no **Objective line at all: shown as written, flagged
{
	const w = world({ umbrella: "just some prose\n" });
	await golden("no objective line", w, path.join(w.home, "elsewhere"), (t) => {
		check("no objective line: flagged + shown", t.includes("(no **Objective line in this file — shown as written)\njust some prose"), t);
	});
}

// 14. oversized file (objective paragraph > 4000 chars): capped, visibly
{
	const w = world();
	fs.writeFileSync(w.productFile, `${OBJ("x".repeat(9000))}\n\n${PRI("p")}\n`);
	await golden("oversized file", w, w.product, (t) => {
		check("oversized: truncation announced", t.includes("(truncated at 4000 chars)"));
		check("oversized: bounded", t.length < 12100);
	});
}

// 15. the 4000-char boundary exactly: not truncated at 4000, truncated at 4001
for (const extra of [0, 1]) {
	const w = world();
	const obj = OBJ("");
	const pri = PRI("").trimEnd(); // the renderer trims the trailing space
	const fill = 4000 - obj.length - 2 - pri.length + extra;
	fs.writeFileSync(w.productFile, `${obj}${"y".repeat(fill)}\n\n${pri}\n`);
	await golden(`boundary +${extra}`, w, w.product, (t) => {
		check(`boundary +${extra}: truncation ${extra ? "announced" : "absent"}`, t.includes("(truncated at 4000 chars)") === !!extra);
	});
}

// 16. CRLF file: normalised, identical, no stray \r
{
	const w = world();
	fs.writeFileSync(w.productFile, PRODUCT.replace(/\n/g, "\r\n"));
	await golden("CRLF", w, w.product, (t) => {
		check("CRLF: no carriage return survives", !t.includes("\r"));
		check("CRLF: product lines shown", t.includes(`${OBJ("ship the widget.")}\n\n${PRI("the walking skeleton.")}`));
	});
}

// 17. product governs, umbrella missing: the program line says so, the product still governs
{
	const w = world({ umbrella: null });
	fs.writeFileSync(w.productFile, PRODUCT);
	await golden("umbrella missing under product", w, w.product, (t) => {
		check("umbrella missing: named program marker", t.includes(`program objective: unavailable (file not found: ${w.umbrellaFile})`), t);
		check("umbrella missing: product governs", t.includes("ship the widget"));
	});
}

// 18. disabled: both runtimes print nothing
{
	const w = world({ enabled: false });
	await golden("disabled", w, w.product, (t, piNull) => {
		check("disabled: nothing printed or injected", t === "" && piNull);
	});
}

// 19. FRESH MACHINE (no nana-pack.json at all) + product repo, cwd a subdirectory:
// the product's lines govern. This is the case T2a r1 regressed (it printed UNAVAILABLE).
{
	const w = world({ config: false, umbrella: null });
	fs.writeFileSync(w.productFile, PRODUCT);
	const sub = path.join(w.product, "sub");
	fs.mkdirSync(sub);
	check("fresh machine: there really is no nana-pack.json", !fs.existsSync(path.join(w.home, ".pi", "agent", "nana-pack.json")));
	const t = await golden("FRESH MACHINE, no config: product governs", w, sub, () => {});
	check("FRESH MACHINE, no config: product governs — exact text", t === [
		HEAD,
		`governing: ${w.productFile}\n${OBJ("ship the widget.")}\n\n${PRI("the walking skeleton.")}`,
		`program objective: unavailable (file not found: ${w.umbrellaFile})`,
		`Precedence: the lines from ${w.productFile} govern this session's work; the program lines (${w.umbrellaFile}) say what the toolkit is for.`,
		CHARGE,
	].join("\n\n"), t);
	check("FRESH MACHINE, no config: no UNAVAILABLE marker", !t.includes("OBJECTIVE UNAVAILABLE"), t);
}

// 20. FRESH MACHINE + product + the default umbrella present: product governs, program lines shown
{
	const w = world({ config: false });
	fs.writeFileSync(w.productFile, PRODUCT);
	await golden("FRESH MACHINE, no config, umbrella present: product governs", w, w.product, (t) => {
		check("FRESH MACHINE + umbrella: product governs", t.includes(`governing: ${w.productFile}\n`), t);
		check("FRESH MACHINE + umbrella: program lines labelled",
			t.includes(`program objective: ${OBJ("build products with agents.")}\nprogram current priority: ${PRI("make nana-pi coherent.")}`), t);
	});
}

// 21. FRESH MACHINE, no OBJECTIVE.md anywhere up the tree, default umbrella exists: umbrella governs
{
	const w = world({ config: false });
	const t = await golden("FRESH MACHINE, no config, no product: umbrella governs", w, path.join(w.home, "elsewhere"), () => {});
	check("FRESH MACHINE, no product: umbrella exact text",
		t === [HEAD, `governing: ${w.umbrellaFile}\n${OBJ("build products with agents.")}\n\n${PRI("make nana-pi coherent.")}`, CHARGE].join("\n\n"), t);
}

// 22. FRESH MACHINE, nothing at all: the named marker
{
	const w = world({ config: false, umbrella: null });
	const t = await golden("FRESH MACHINE, no config, nothing: marker", w, path.join(w.home, "elsewhere"), () => {});
	check("FRESH MACHINE, nothing: exact marker", t === `${HEAD}\n\nOBJECTIVE UNAVAILABLE: file not found (${w.umbrellaFile}). Tell the user before spending.`, t);
}

// 23. CLAUDE_PROJECT_DIR UNSET: the hook falls back to $PWD (its process cwd) and the walk still resolves
{
	const w = world({ config: false, umbrella: null });
	fs.writeFileSync(w.productFile, PRODUCT);
	const sub = path.join(w.product, "sub");
	fs.mkdirSync(sub);
	await golden("CLAUDE_PROJECT_DIR unset", w, sub, (t) => {
		check("CLAUDE_PROJECT_DIR unset: walk-up from the process cwd finds the product", t.includes(`governing: ${w.productFile}\n${OBJ("ship the widget.")}`), t);
	}, { noProjectDir: true });
	// control: the hook really did NOT get the answer from CLAUDE_PROJECT_DIR — run from elsewhere, it must not find the product
	const ctl = runHook(w, path.join(w.home, "elsewhere"), { noProjectDir: true });
	check("CLAUDE_PROJECT_DIR unset: control — from a cwd outside the product, the product is not found",
		ctl.status === 0 && ctl.out.includes("OBJECTIVE UNAVAILABLE") && !ctl.out.includes("ship the widget"), ctl.out);
}

fs.rmSync(scratch, { recursive: true, force: true });
process.exit(fails);
