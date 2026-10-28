/**
 * @module packages/nana-pack/tests/frontier-golden.test.mjs
 * @purpose Pin byte parity between the frontier producer and pi extension for every session-start reason.
 * @inputs The real frontier extension and CLI plus disposable full, seed, CRLF, unreadable, missing and worker-role worlds.
 * @outputs One aggregate PASS/FAIL check for section parity, silence and rereading after an edit.
 * @effects disk (temporary fixtures), process (runs the frontier producer CLI).
 * @errors Failed parity or a child timeout sets a nonzero exit code.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import frontierExtension from "../extensions/nana-frontier-summary.ts";
import { FRONTIER_SECTION, FRONTIER_TAG } from "../lib/frontier-summary-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { GH_COMMAND_ENV } from "../lib/suite-records-config.mjs";

delete process.env.NANA_ROLE;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const CLI = path.join(ROOT, "packages/nana-pack/bin/nana-frontier-summary.mjs");
const CASE_LIMIT_MS = 8_000;
const TODAY = "2026-10-22";
const TEST_HOME = tmpDir(path.join(os.tmpdir(), "frontier-golden-home-"));
let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", `${title}${ok || !detail ? "" : ` — ${detail}`}`);
	if (!ok) failures++;
};
const world = (name, text, { unreadable = false } = {}) => {
	const root = tmpDir(path.join(os.tmpdir(), `${name}-`));
	fs.mkdirSync(path.join(root, ".git"));
	if (text !== null) fs.writeFileSync(path.join(root, "HANDOFF.md"), unreadable ? Buffer.from([0xff, 0xfe, 0x23, 0]) : text);
	return root;
};
const cliBlock = (cwd, env) => {
	const result = spawnSync(process.execPath, [CLI, "--cwd", cwd], { encoding: "utf8", timeout: CASE_LIMIT_MS, env: { ...process.env, HOME: TEST_HOME, USERPROFILE: TEST_HOME, ...env } });
	if (result.status !== 0 || result.signal) return { error: { status: result.status, signal: result.signal, stderr: result.stderr } };
	if (result.stdout === "") return { block: undefined };
	return { block: result.stdout.startsWith(`${FRONTIER_TAG}\n`) ? result.stdout.slice(FRONTIER_TAG.length + 1) : result.stdout };
};
const handlers = (env) => {
	const registered = {};
	frontierExtension({ on: (name, fn) => { registered[name] = fn; } }, { today: TODAY, env });
	return registered;
};
const inject = async (registered, cwd, reason) => {
	const ctx = { cwd };
	await registered.session_start({ reason }, ctx);
	const event = { systemPromptOptions: { sections: {} } };
	await registered.before_agent_start(event, ctx);
	return event.systemPromptOptions.sections[FRONTIER_SECTION];
};
const withLimit = async (label, task) => {
	let timer;
	try {
		return await Promise.race([task(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS); })]);
	} finally { clearTimeout(timer); }
};

const fakeGh = path.join(TEST_HOME, "gh.mjs");
fs.writeFileSync(fakeGh, `process.stdout.write(JSON.stringify([{number:1,title:"Issue ask",labels:[{name:"ask"}],author:{login:"example"},createdAt:"2026-10-01T00:00:00Z"}]));`);
const worlds = [
	{ name: "issues", cwd: world("frontier-golden-issues", "## Next\nLocal pointer.\n## Open for the owner\nhttps://github.com/example/project/issues\n"), env: { [GH_COMMAND_ENV]: JSON.stringify([process.execPath, fakeGh]) } },
	{ name: "full", cwd: world("frontier-golden-full", "## Next\n1. **Build the path.** body\n## Open for the owner\n- **[blocking, since 2026-10-01] Choose now.** body\n"), env: {} },
	{ name: "seed", cwd: world("frontier-golden-seed", "## Where things stand\n\n## Next\n- Fill this in.\n\n## Open\n- Fill this in.\n"), env: {} },
	{ name: "CRLF", cwd: world("frontier-golden-crlf", "## Next\r\n- Windows line\r\n"), env: {} },
	{ name: "unreadable", cwd: world("frontier-golden-unreadable", "x", { unreadable: true }), env: {} },
	{ name: "missing", cwd: world("frontier-golden-missing", null), env: {} },
	{ name: "worker", cwd: world("frontier-golden-worker", "## Next\n- hidden\n"), env: { NANA_ROLE: "worker" } },
];
const reasons = ["startup", "new", "resume", "fork", "reload"];
const details = [];
let ok = true;
for (const item of worlds) {
	const expected = cliBlock(item.cwd, item.env);
	if (expected.error) { ok = false; details.push(`${item.name}: ${JSON.stringify(expected.error)}`); continue; }
	for (const reason of reasons) {
		const actual = await withLimit(`${item.name}/${reason}`, () => inject(handlers(item.env), item.cwd, reason));
		if (actual !== expected.block) { ok = false; details.push(`${item.name}/${reason}: ${JSON.stringify({ expected: expected.block, actual })}`); }
	}
}
const editWorld = world("frontier-golden-edit", "## Next\n- Before edit\n");
const editHandlers = handlers({});
const before = await withLimit("edit before", () => inject(editHandlers, editWorld, "startup"));
fs.writeFileSync(path.join(editWorld, "HANDOFF.md"), "## Next\n- After edit\n");
const after = await withLimit("edit after", () => inject(editHandlers, editWorld, "reload"));
if (!before?.includes("Before edit") || before.includes("After edit") || !after?.includes("After edit") || after.includes("Before edit")) {
	ok = false; details.push(`edit: ${JSON.stringify({ before, after })}`);
}

// req: R-2612
check("R-2612: the pi section equals the Claude hook's frontier block minus its tag line for every session start reason, and is re-read after an edit", ok, details.join(" | "));

if (failures) process.exitCode = 1;
