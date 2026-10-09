/**
 * @module packages/nana-setup/tests/shared-memory-input.test.mjs
 * @purpose Pins the shared-memory hook's TTY guard and exact stdin byte bound.
 * @inputs an injectable stream and the shared-memory input reader.
 * @outputs PASS/FAIL checks for skipped TTY reads and bounded non-TTY reads.
 * @effects none
 * @errors failed checks set a nonzero process exit code.
 */
import { readHookInput, STDIN_CAP } from "../lib/shared-memory-input.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { projectKey } from "../lib/project-key.mjs";
let failures = 0;
const check = (title, ok) => { console.log(ok ? "PASS" : "FAIL", title); if (!ok) failures++; };
let ttyRead = false;
const tty = { isTTY: true, async *[Symbol.asyncIterator]() { ttyRead = true; yield "unexpected"; } };
// req: R-872
check("TTY input is skipped without consuming stdin", await readHookInput(tty) === null && !ttyRead);
const root = tmpDir(path.join(os.tmpdir(), "nana-shared-tty-entry-"));
const claudeHome = path.join(root, "claude");
const project = path.join(root, "product");
const shared = path.join(root, "shared");
fs.mkdirSync(project, { recursive: true });
fs.mkdirSync(path.join(shared), { recursive: true });
fs.writeFileSync(path.join(shared, "MEMORY.md"), "- [index] retained\n");
const entry = fileURLToPath(new URL("../claude/hooks/nana-shared-memory.mjs", import.meta.url));
const probe = `Object.defineProperty(process.stdin, "isTTY", { value: true }); let read = false; process.stdin[Symbol.asyncIterator] = async function* () { read = true; }; await import(${JSON.stringify(new URL(`file://${entry}`).href)}); if (read) process.exitCode = 9;`;
const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { cwd: root, encoding: "utf8", env: { PATH: process.env.PATH, HOME: root, CLAUDE_CONFIG_DIR: claudeHome, CLAUDE_PROJECT_DIR: project, NANA_SHARED_MEMORY_DIR: shared } });
const link = path.join(claudeHome, "projects", projectKey(project), "memory", "shared");
// req: R-872
check("TTY entry heals without consuming stdin", run.status === 0 && run.stdout.includes("- [index] retained") && fs.existsSync(link) && fs.lstatSync(link).isSymbolicLink());
let chunksRead = 0;
const stream = { isTTY: false, async *[Symbol.asyncIterator]() { chunksRead++; yield Buffer.alloc(STDIN_CAP + 4, 0x61); chunksRead++; yield Buffer.from("extra"); } };
const bounded = await readHookInput(stream);
// req: R-872
check("non-TTY input reads exactly the named byte bound", STDIN_CAP === 65536 && Buffer.byteLength(bounded) === STDIN_CAP && chunksRead === 1);
if (failures) process.exitCode = 1;
