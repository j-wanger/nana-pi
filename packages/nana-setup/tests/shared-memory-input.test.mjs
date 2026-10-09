/**
 * @module packages/nana-setup/tests/shared-memory-input.test.mjs
 * @purpose Pins the shared-memory hook's TTY guard and exact stdin byte bound.
 * @inputs an injectable stream and the shared-memory input reader.
 * @outputs PASS/FAIL checks for skipped TTY reads and bounded non-TTY reads.
 * @effects none
 * @errors failed checks set a nonzero process exit code.
 */
import { readHookInput, STDIN_CAP } from "../lib/shared-memory-input.mjs";
let failures = 0;
const check = (title, ok) => { console.log(ok ? "PASS" : "FAIL", title); if (!ok) failures++; };
let ttyRead = false;
const tty = { isTTY: true, async *[Symbol.asyncIterator]() { ttyRead = true; yield "unexpected"; } };
// req: R-872
check("TTY input is skipped without consuming stdin", await readHookInput(tty) === null && !ttyRead);
let chunksRead = 0;
const stream = { isTTY: false, async *[Symbol.asyncIterator]() { chunksRead++; yield Buffer.alloc(STDIN_CAP + 4, 0x61); chunksRead++; yield Buffer.from("extra"); } };
const bounded = await readHookInput(stream);
// req: R-872
check("non-TTY input reads exactly the named byte bound", Buffer.byteLength(bounded) === STDIN_CAP && chunksRead === 1);
if (failures) process.exitCode = 1;
