/**
 * @module packages/nana-pack/tests/nana-roster-set.test.mjs
 * @purpose Pin `nana-roster set`: slot replacement, every other member kept, every malformed
 *  input and on-disk file refused, the pi-model-shell guard, the atomic rename, the symlink
 *  case and the backup it leaves.
 * @inputs nana-roster.mjs's resolveRoster/orderedRoster/formatRosterLines, lib/roster-set.mjs's
 *  setRosterSlot, worker-config.mjs's PI_MODEL_SHELL_ENV/SLOT_NULL_TOKENS/DEFAULT_THINKING_TOKEN/
 *  CLAUDE_CODE_RUNTIME, and spawned nana-roster.mjs CLI runs under a temp HOME
 * @outputs named PASS/FAIL checks
 * @effects disk (temp fixtures), process (spawns the roster CLI)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "nana-roster.mjs");
const { resolveRoster, orderedRoster, formatRosterLines } = await import(new URL("../bin/nana-roster.mjs", import.meta.url).href);
const { setRosterSlot } = await import(new URL("../lib/roster-set.mjs", import.meta.url).href);
const { PI_MODEL_SHELL_ENV, SLOT_NULL_TOKENS, DEFAULT_THINKING_TOKEN, CLAUDE_CODE_RUNTIME } = await import(new URL("../bin/worker-config.mjs", import.meta.url).href);

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };

const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-roster-set-")));
let agentCount = 0;
const freshAgentDir = (label) => { const d = path.join(temp, `agent-${++agentCount}-${label}`); fs.mkdirSync(d, { recursive: true }); return d; };
const entry = (provider, model, thinking) => ({ provider, model, thinking });
const sampleRoster = () => ({
	scout: entry("example-gateway", "gpt-6-luna", "medium"),
	builder: entry("example-gateway", "roster-model", "low"),
	largerBuilder: null,
	reviewer: entry("example-gateway", "gpt-5.6-sol", null),
	land: null,
});
const writeRosterRaw = (dir, bytes) => { const f = path.join(dir, "nana-pack.json"); fs.writeFileSync(f, bytes); return f; };
const writeRoster = (dir, roster) => writeRosterRaw(dir, JSON.stringify({ roster }));
/** A spawn env with a fresh HOME/USERPROFILE/PI_CODING_AGENT_DIR and no pi-model-shell marker. */
const cleanEnv = (dir, extra = {}) => {
	const e = { ...process.env, HOME: dir, USERPROFILE: dir, PI_CODING_AGENT_DIR: dir, ...extra };
	delete e[PI_MODEL_SHELL_ENV];
	return e;
};
const runSet = (dir, args, extraEnv = {}) => spawnSync(process.execPath, [cli, "set", ...args], { encoding: "utf8", env: cleanEnv(dir, extraEnv) });
const runPlain = (dir, extraEnv = {}) => spawnSync(process.execPath, [cli], { encoding: "utf8", env: cleanEnv(dir, extraEnv) });
/** The tokens `nana-roster` would print for one slot, same shape as the "was:" line's value. */
const previousTokensFor = (roster, slot) => formatRosterLines(roster, "x").find((l) => l.startsWith(`${slot}: `)).slice(slot.length + 2);
const captureState = (file) => {
	try {
		const st = fs.lstatSync(file);
		if (st.isDirectory()) return { type: "dir" };
		if (st.isSymbolicLink()) return { type: "link", target: fs.readlinkSync(file) };
		return { type: "file", bytes: fs.readFileSync(file) };
	} catch {
		return { type: "absent" };
	}
};
const statesEqual = (a, b) => a.type === b.type && (a.type !== "file" || a.bytes.equals(b.bytes)) && (a.type !== "link" || a.target === b.target);

{
	const CASES = [
		["absent file, builder explicit level", null, "builder", ["example-gateway", "gpt-7", "high"], entry("example-gateway", "gpt-7", "high")],
		["file roster, builder explicit level", sampleRoster(), "builder", ["example-gateway", "gpt-9", "medium"], entry("example-gateway", "gpt-9", "medium")],
		["builder default thinking", sampleRoster(), "builder", ["example-gateway", "gpt-9", DEFAULT_THINKING_TOKEN], entry("example-gateway", "gpt-9", null)],
		["largerBuilder claude-code", sampleRoster(), "largerBuilder", [CLAUDE_CODE_RUNTIME, "sonnet"], { runtime: CLAUDE_CODE_RUNTIME, model: "sonnet" }],
		["scout null token", sampleRoster(), "scout", [SLOT_NULL_TOKENS.scout], null],
		["land null token", sampleRoster(), "land", [SLOT_NULL_TOKENS.land], null],
		["largerBuilder null token", { ...sampleRoster(), largerBuilder: entry("example-gateway", "x", "low") }, "largerBuilder", [SLOT_NULL_TOKENS.largerBuilder], null],
		["pasted printed line with its colon", sampleRoster(), "builder:", ["example-gateway", "gpt-7", "high"], entry("example-gateway", "gpt-7", "high")],
	];
	const results = CASES.map(([label, base, slotArg, tokens, expectedValue], idx) => {
		const dir = freshAgentDir(`r1400-${idx}`);
		if (base !== null) writeRoster(dir, base);
		const normalizedSlot = slotArg.replace(/:$/, "");
		const previousRoster = base ?? { scout: null, builder: entry("openai-codex", "gpt-6-luna", "high"), largerBuilder: null, reviewer: entry("openai-codex", "gpt-5.6-sol", null), land: entry("openai-codex", "gpt-6-astra", null) };
		const expectedPrevious = previousTokensFor(previousRoster, normalizedSlot);
		const setRun = runSet(dir, [slotArg, ...tokens]);
		const plainRun = runPlain(dir);
		const resolved = resolveRoster(dir);
		const expectedRoster = orderedRoster({ ...previousRoster, [normalizedSlot]: expectedValue });
		const pass = setRun.status === 0 && plainRun.status === 0 &&
			setRun.stdout === plainRun.stdout &&
			resolved.ok && JSON.stringify(orderedRoster(resolved.roster)) === JSON.stringify(expectedRoster) &&
			setRun.stderr === `nana-roster: ${normalizedSlot} was: ${expectedPrevious}\n`;
		return [label, pass, { setRun, plainRun, resolved, expectedRoster }];
	});
	// req: R-1400
	check("R-1400: set given a printed line's tokens replaces only that slot and prints the new roster and the old line, from an absent file and from a file roster",
		results.every(([, pass]) => pass), JSON.stringify(results.filter(([, pass]) => !pass)));
}

{
	const dir = freshAgentDir("r1401");
	const roster = sampleRoster();
	const otherMembers = {
		objective: { enabled: true, path: null, projectFile: "OBJECTIVE.md" },
		gate: { extraPatterns: ["*.secret"] },
		postEdit: { commands: ["echo hi"] },
		mysteryKey: { nested: [1, 2, 3] },
	};
	const fileText = `﻿${JSON.stringify({ ...otherMembers, roster }, null, 2).replace(/\n/g, "\r\n")}\r\n`;
	const file = writeRosterRaw(dir, fileText);
	const r = runSet(dir, ["builder", "example-gateway", "gpt-9", "medium"]);
	let after = null;
	try { after = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch { /* leave null on parse failure */ }
	// req: R-1401
	check("R-1401: set keeps objective, gate and every other top-level member, from a file saved with a byte-order mark and CRLF",
		r.status === 0 && after !== null &&
		JSON.stringify(after.objective) === JSON.stringify(otherMembers.objective) &&
		JSON.stringify(after.gate) === JSON.stringify(otherMembers.gate) &&
		JSON.stringify(after.postEdit) === JSON.stringify(otherMembers.postEdit) &&
		JSON.stringify(after.mysteryKey) === JSON.stringify(otherMembers.mysteryKey) &&
		after.roster.builder.provider === "example-gateway" && after.roster.builder.model === "gpt-9" && after.roster.builder.thinking === "medium",
		JSON.stringify({ status: r.status, stderr: r.stderr, after }));
}

{
	const BAD_CASES = [
		["no slot", [], null],
		["unknown slot", ["reviewr", "a", "b", "high"], "reviewr"],
		["builder two tokens", ["builder", "a", "b"], "builder"],
		["builder four tokens", ["builder", "a", "b", "high", "extra"], "builder"],
		["thinking extreme", ["builder", "a", "b", "extreme"], "thinking"],
		["builder null token", ["builder", SLOT_NULL_TOKENS.scout], "builder"],
		["land wrong null token", ["land", SLOT_NULL_TOKENS.scout], "land"],
		["reviewer claude-code", ["reviewer", CLAUDE_CODE_RUNTIME, "sonnet"], "reviewer"],
		["largerBuilder bad claude-code model", ["largerBuilder", CLAUDE_CODE_RUNTIME, "gpt-5"], "largerBuilder"],
	];
	const results = BAD_CASES.map(([label, args, name]) => {
		const dir = freshAgentDir(`r1402-${label.replace(/\W+/g, "-")}`);
		const file = writeRoster(dir, sampleRoster());
		const before = fs.readFileSync(file);
		const r = runSet(dir, args);
		const after = fs.readFileSync(file);
		const pass = r.status === 1 && r.stdout === "" && r.stderr.startsWith("nana-roster: set refused:") && (name === null || r.stderr.includes(name)) && before.equals(after);
		return [label, pass, r];
	});
	// req: R-1402
	check("R-1402: set refuses no slot, an unknown slot and each malformed entry, naming the slot or field, and changes no byte",
		results.every(([, pass]) => pass), JSON.stringify(results.filter(([, pass]) => !pass)));
}

{
	const FILE_SHAPES = [
		["invalid JSON", (f) => fs.writeFileSync(f, "{\"roster\": ")],
		["top level is an array", (f) => fs.writeFileSync(f, "[]")],
		["unknown roster slot", (f) => fs.writeFileSync(f, JSON.stringify({ roster: { ...sampleRoster(), auditor: entry("example-gateway", "gpt-6-luna", null) } }))],
		["a bad thinking value", (f) => fs.writeFileSync(f, JSON.stringify({ roster: { ...sampleRoster(), builder: entry("example-gateway", "gpt-6-luna", "extreme") } }))],
		["a valid roster padded past the 1 MiB cap", (f) => fs.writeFileSync(f, JSON.stringify({ roster: sampleRoster() }) + " ".repeat(1024 * 1024))],
		["a directory", (f) => fs.mkdirSync(f)],
		...(process.platform === "win32" ? [] : [["a dangling symlink", (f) => fs.symlinkSync(path.join(path.dirname(f), "missing-target.json"), f)]]),
	];
	const results = FILE_SHAPES.map(([label, arrange]) => {
		const dir = freshAgentDir(`r1403-${label.replace(/\W+/g, "-")}`);
		const file = path.join(dir, "nana-pack.json");
		arrange(file);
		const before = captureState(file);
		const r = runSet(dir, ["builder", "a", "b", "high"]);
		const after = captureState(file);
		const pass = r.status === 1 && r.stdout === "" && r.stderr.startsWith("nana-roster: set refused:") && statesEqual(before, after) && fs.readdirSync(dir).length === 1;
		return [label, pass, r];
	});
	if (process.platform === "win32") console.log("SKIP a dangling symlink: POSIX symlinks (win32)");
	// req: R-1403
	check("R-1403: set refuses a path the resolver refuses and leaves it unchanged",
		results.every(([, pass]) => pass), JSON.stringify(results.filter(([, pass]) => !pass)));
}

{
	const dirValid = freshAgentDir("r1404-valid");
	const fileValid = writeRoster(dirValid, sampleRoster());
	const beforeValid = fs.readFileSync(fileValid);
	const rValid = spawnSync(process.execPath, [cli, "set", "builder", "a", "b", "high"], { encoding: "utf8", env: { ...process.env, HOME: dirValid, USERPROFILE: dirValid, PI_CODING_AGENT_DIR: dirValid, PI_SESSION_ID: "abc" } });
	const afterValid = fs.readFileSync(fileValid);

	const dirMalformed = freshAgentDir("r1404-malformed");
	writeRosterRaw(dirMalformed, "{\"roster\": ");
	const rMalformed = spawnSync(process.execPath, [cli, "set", "builder", "a", "b", "high"], { encoding: "utf8", env: { ...process.env, HOME: dirMalformed, USERPROFILE: dirMalformed, PI_CODING_AGENT_DIR: dirMalformed, PI_SESSION_ID: "abc" } });

	const dirAbsent = freshAgentDir("r1404-absent");
	const rAbsent = spawnSync(process.execPath, [cli, "set", "builder", "a", "b", "high"], { encoding: "utf8", env: { ...process.env, HOME: dirAbsent, USERPROFILE: dirAbsent, PI_CODING_AGENT_DIR: dirAbsent, PI_SESSION_ID: "abc" } });

	// req: R-1404
	check("R-1404: set inside a pi model shell refuses naming PI_SESSION_ID before reading the file and writes nothing",
		rValid.status === 1 && rValid.stdout === "" && rValid.stderr.includes("PI_SESSION_ID") && beforeValid.equals(afterValid) &&
		rMalformed.status === 1 && rMalformed.stdout === "" && rMalformed.stderr.includes("PI_SESSION_ID") && !rMalformed.stderr.includes("JSON") &&
		rAbsent.status === 1 && rAbsent.stdout === "" && rAbsent.stderr.includes("PI_SESSION_ID") && !fs.existsSync(path.join(dirAbsent, "nana-pack.json")),
		JSON.stringify({ rValid, rMalformed, rAbsent }));
}

{
	const dirNormal = freshAgentDir("r1405-normal");
	writeRoster(dirNormal, sampleRoster());
	const rNormal = runSet(dirNormal, ["builder", "a", "b", "high"]);
	const entriesNormal = fs.readdirSync(dirNormal);

	const dirWrite = freshAgentDir("r1405-write-throws");
	const fileWrite = writeRoster(dirWrite, sampleRoster());
	const beforeWrite = fs.readFileSync(fileWrite);
	const rWrite = setRosterSlot(dirWrite, ["builder", "a", "b", "high"], { env: {}, writeTemp: () => { throw new Error("boom"); } });
	const afterWrite = fs.readFileSync(fileWrite);
	const entriesWrite = fs.readdirSync(dirWrite);

	const dirRename = freshAgentDir("r1405-rename-throws");
	const fileRename = writeRoster(dirRename, sampleRoster());
	const beforeRename = fs.readFileSync(fileRename);
	const rRename = setRosterSlot(dirRename, ["builder", "a", "b", "high"], { env: {}, rename: () => { throw new Error("boom2"); } });
	const afterRename = fs.readFileSync(fileRename);
	const entriesRename = fs.readdirSync(dirRename);

	const dirRecord = freshAgentDir("r1405-record");
	const fileRecord = writeRoster(dirRecord, sampleRoster());
	let recorded = null;
	const rRecord = setRosterSlot(dirRecord, ["builder", "a", "b", "high"], { env: {}, rename: (from, to) => { recorded = { from, to, text: fs.readFileSync(from, "utf8") }; fs.renameSync(from, to); } });

	// req: R-1405
	check("R-1405: set renames a temporary file from the target's folder, and a failed temporary write or rename leaves the file byte-identical with no temporary file behind",
		rNormal.status === 0 && entriesNormal.every((e) => e === "nana-pack.json" || e === "nana-pack.json.bak") &&
		rWrite.ok === false && beforeWrite.equals(afterWrite) && entriesWrite.length === 1 && entriesWrite[0] === "nana-pack.json" &&
		rRename.ok === false && beforeRename.equals(afterRename) && entriesRename.every((e) => e === "nana-pack.json" || e === "nana-pack.json.bak") &&
		rRecord.ok === true && recorded !== null && recorded.text.includes("\"model\": \"b\"") &&
		fs.realpathSync.native(path.dirname(recorded.from)) === fs.realpathSync.native(path.dirname(fileRecord)),
		JSON.stringify({ rNormal: { status: rNormal.status, entriesNormal }, rWrite, entriesWrite, rRename, entriesRename, rRecord: rRecord.ok }));
}

{
	let skip = false;
	const dir = freshAgentDir("r1406");
	const realDir = path.join(dir, "real");
	const linkDir = path.join(dir, "link");
	fs.mkdirSync(realDir, { recursive: true });
	fs.mkdirSync(linkDir, { recursive: true });
	const realFile = writeRoster(realDir, sampleRoster());
	const linkFile = path.join(linkDir, "nana-pack.json");
	try {
		fs.symlinkSync(realFile, linkFile);
	} catch {
		skip = true;
	}
	let pass = true;
	let detail = "";
	if (skip) {
		console.log("SKIP set through a symlinked nana-pack.json: symlinkSync failed (unprivileged win32 without Developer Mode)");
	} else {
		const r = runSet(linkDir, ["builder", "a", "b", "high"]);
		let linkTargetAfter = null;
		try { linkTargetAfter = fs.readlinkSync(linkFile); } catch { /* no longer a symlink: leave null */ }
		let realAfter = null;
		try { realAfter = JSON.parse(fs.readFileSync(realFile, "utf8")); } catch { /* leave null */ }
		pass = r.status === 0 && linkTargetAfter === realFile && realAfter !== null &&
			realAfter.roster.builder.provider === "a" && realAfter.roster.builder.model === "b";
		detail = JSON.stringify({ status: r.status, stderr: r.stderr, linkTargetAfter, realAfter });
	}
	// req: R-1406
	check("R-1406: set through a symlinked nana-pack.json writes the target and keeps the link", pass, detail);
}

{
	const dir = freshAgentDir("r1407");
	const roster = sampleRoster();
	const fileText = `﻿${JSON.stringify({ roster }, null, 2).replace(/\n/g, "\r\n")}\r\n`;
	const file = writeRosterRaw(dir, fileText);
	const originalBytes = fs.readFileSync(file);
	const r = runSet(dir, ["builder", "a", "b", "high"]);
	const bakPath = path.join(dir, "nana-pack.json.bak");
	const bakExists = fs.existsSync(bakPath);
	const bakBytes = bakExists ? fs.readFileSync(bakPath) : null;
	// req: R-1407
	check("R-1407: set leaves the replaced bytes in nana-pack.json.bak",
		r.status === 0 && bakExists && bakBytes.equals(originalBytes),
		JSON.stringify({ status: r.status, bakExists, originalLength: originalBytes.length, bakLength: bakBytes?.length }));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
