/**
 * @module packages/nana-pack/tests/bounded-read.test.mjs
 * @purpose Verifies the shared bounded reader refuses special files and enforces its sealed byte ceiling.
 * @inputs packages/nana-pack/lib/bounded-read.mjs and temporary filesystem entries
 * @outputs PASS/FAIL lines and a nonzero exit when a bounded-read contract is violated
 * @effects disk (temporary files and FIFO)
 * @errors a failed check is printed and makes the process exit nonzero
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { BOUNDED_READ_CAP, readBounded, readBudget } from "../lib/bounded-read.mjs";

let fails = 0;
const check = (title, ok) => { console.log(ok ? "PASS" : "FAIL", title); if (!ok) fails++; };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bounded-reader-"));
const file = path.join(dir, "data");
fs.writeFileSync(file, "hello");
// req: R-634 R-635
check("cap is sealed at one MiB and read is limited to cap plus one", BOUNDED_READ_CAP === 1024 * 1024 && readBounded(file).length === 5 && readBudget(Number.MAX_SAFE_INTEGER, BOUNDED_READ_CAP) === BOUNDED_READ_CAP + 1);
const oversized = path.join(dir, "large");
fs.writeFileSync(oversized, Buffer.alloc(BOUNDED_READ_CAP + 1));
let oversizeRejected = false;
try { readBounded(oversized); } catch { oversizeRejected = true; }
// req: R-634
check("oversized regular file is rejected", oversizeRejected);
if (process.platform !== "win32") {
 const fifo = path.join(dir, "fifo");
 const made = spawnSync("mkfifo", [fifo]);
 if (made.status === 0) {
  let fifoError;
  const start = Date.now();
  try { readBounded(fifo); } catch (error) { fifoError = error; }
  // req: R-634
  check("FIFO is rejected without blocking", fifoError?.code === "ERR_NOT_REGULAR" && Date.now() - start < 1000);
 }
}
fs.rmSync(dir, { recursive: true, force: true });
if (process.platform !== "win32") {
 const home = fs.mkdtempSync(path.join(os.tmpdir(), "bounded-config-"));
 process.env.HOME = home; process.env.USERPROFILE = home;
 const config = path.join(home, ".pi", "agent", "nana-pack.json");
 fs.mkdirSync(path.dirname(config), { recursive: true });
 const made = spawnSync("mkfifo", [config]);
 if (made.status === 0) {
  const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;
  const handlers = {}; ext({ on: (name, fn) => { handlers[name] = fn; } });
  const ctx = { cwd: dir, hasUI: false, isProjectTrusted: () => false };
  const start = Date.now();
  await handlers.session_start({ reason: "startup" }, ctx);
  const result = await handlers.tool_call({ toolName: "bash", input: { command: "ls" } }, ctx);
  // req: R-633 R-636
  check("FIFO config stops the gate promptly with a repair reason", result?.block === true && /gate block is malformed/.test(result.reason) && result.reason.includes("Recovery:") && Date.now() - start < 1000);
 }
 fs.rmSync(home, { recursive: true, force: true });
}
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
