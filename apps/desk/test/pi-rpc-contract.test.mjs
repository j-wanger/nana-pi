/**
 * @module apps/desk/test/pi-rpc-contract.test.mjs
 * @purpose Drive installed pi RPC without model credentials and pin desk-consumed records.
 * @inputs The desk pi resolver, installed pi executable and a throwaway extension.
 * @outputs PASS/FAIL lines and a nonzero exit when the installed RPC contract drifts.
 * @effects disk (isolated HOME, session directory and extension), process (spawns and stops pi).
 * @errors Fails when resolution, startup, RPC records or bounded shutdown do not match.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

const STARTUP_BOUND_MS = 30_000; // chosen: generous bound for a cold installed-pi startup without credentials.
const RECORD_BOUND_MS = 15_000; // chosen: generous bound for each local RPC exchange.
const SHUTDOWN_BOUND_MS = 5_000; // chosen: grace before force-killing a wedged RPC child.
const root = tmpDir(path.join(os.tmpdir(), "desk-pi-rpc-"));
const home = path.join(root, "home");
const sessions = path.join(root, "sessions");
fs.mkdirSync(home, { recursive: true });
fs.mkdirSync(sessions, { recursive: true });
const piBin = resolvePiBin();
const piPackage = resolvePiPackage(piBin);
const extension = path.join(root, "contract.ts");
fs.writeFileSync(extension, `
export default function (pi) {
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setStatus("contract", "ready");
    setTimeout(async () => {
      const choice = await ctx.ui.select("Pick one", ["alpha", "beta"]);
      ctx.ui.setStatus("contract", "chose:" + choice);
    }, 0);
  });
}
`);

let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(ok ? "PASS" : "FAIL", name, detail);
  if (!ok) failed++;
};
let child;
let stdout = "";
let stderr = "";
let pending = [];
let waiters = [];
let sequence = 0;
function acceptLine(line) {
  if (!line) return;
  let record;
  try { record = JSON.parse(line); } catch { stderr += `Invalid RPC JSON line: ${line}\n`; return; }
  pending.push(record);
  for (const waiter of [...waiters]) waiter();
}
function ingest(chunk) {
  stdout += chunk.toString();
  let newline;
  while ((newline = stdout.indexOf("\n")) !== -1) {
    const line = stdout.slice(0, newline);
    stdout = stdout.slice(newline + 1);
    acceptLine(line);
  }
}
async function nextRecord(predicate, boundMs, label) {
  const deadline = Date.now() + boundMs;
  while (true) {
    const index = pending.findIndex(predicate);
    if (index !== -1) return pending.splice(index, 1)[0];
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(`${label}: pi exited early (${child.exitCode ?? child.signalCode}): ${stderr}`);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error(`${label}: exceeded ${boundMs}ms; stderr=${stderr}; pending=${JSON.stringify(pending)}; stdout-tail=${stdout.slice(-2000)}`);
    await new Promise((resolve, reject) => {
      let timer;
      const wake = () => { clearTimeout(timer); waiters = waiters.filter((item) => item !== wake); resolve(); };
      timer = setTimeout(() => { waiters = waiters.filter((item) => item !== wake); reject(new Error(`${label}: exceeded ${boundMs}ms; exit=${child.exitCode ?? child.signalCode}; stderr=${stderr}; pending=${JSON.stringify(pending)}; stdout-tail=${stdout.slice(-2000)}`)); }, remaining);
      waiters.push(wake);
    });
  }
}
async function send(record) {
  if (!child.stdin.write(`${JSON.stringify(record)}\n`)) await new Promise((resolve) => child.stdin.once("drain", resolve));
}
async function stop() {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  let timer;
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => { timer = setTimeout(resolve, SHUTDOWN_BOUND_MS); }),
  ]);
  clearTimeout(timer);
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

try {
  // req: R-689
  check("resolver selected the installed pi package", Boolean(piPackage.root), piPackage.root);
  child = spawn(piBin, ["--mode", "rpc", "--offline", "-ne", "-ns", "-np", "-nc", "-e", extension, "--session-dir", sessions], {
    cwd: root,
    env: { ...process.env, HOME: home, USERPROFILE: home, PI_SKIP_VERSION_CHECK: "1", NANA_KNOWLEDGE_HOME: path.join(root, "knowledge") },
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stdout.on("data", ingest);
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  const started = Date.now();
  const ready = await nextRecord((r) => r.type === "extension_ui_request" && r.method === "setStatus" && r.statusKey === "contract" && r.statusText === "ready", STARTUP_BOUND_MS, "startup status");
  console.log(`PROBE installed pi RPC started without credentials in ${Date.now() - started}ms (${piBin}; ${piPackage.root})`);
  // req: R-689
  check("session_start emits the ready status", ready.statusKey === "contract" && ready.statusText === "ready");

  const select = await nextRecord((r) => r.type === "extension_ui_request" && r.method === "select", RECORD_BOUND_MS, "select request");
  // req: R-689
  check("select request has id, title and options", typeof select.id === "string" && select.title === "Pick one" && Array.isArray(select.options) && select.options.join(",") === "alpha,beta", JSON.stringify(select));
  await send({ type: "extension_ui_response", id: select.id, value: "alpha" });
  const chosen = await nextRecord((r) => r.type === "extension_ui_request" && r.method === "setStatus" && r.statusText === "chose:alpha", RECORD_BOUND_MS, "select round trip status");
  // req: R-689
  check("extension_ui_response completes the select round trip", chosen.statusKey === "contract" && chosen.statusText === "chose:alpha", JSON.stringify(chosen));

  const requestId = `req-${++sequence}`;
  await send({ id: requestId, type: "get_state" });
  const response = await nextRecord((r) => r.type === "response" && r.id === requestId, RECORD_BOUND_MS, "get_state response");
  // req: R-689
  check("get_state response envelope has type, id, command, success and data", response.type === "response" && response.id === requestId && response.command === "get_state" && response.success === true && response.data && typeof response.data === "object", JSON.stringify(response));
  // req: R-689
  check("get_state data includes the session id", typeof response.data?.sessionId === "string" && response.data.sessionId.length > 0, JSON.stringify(response.data));
  // req: R-689
  check("get_state data includes the desk-read sessionFile", typeof response.data?.sessionFile === "string" && response.data.sessionFile.startsWith(sessions + path.sep), JSON.stringify(response.data));
  // req: R-689
  check("select request uses the extension UI envelope", select.type === "extension_ui_request" && typeof select.id === "string" && select.method === "select");
  // req: R-689
  check("status request fields match the desk-consumed shape", ready.type === "extension_ui_request" && ready.method === "setStatus" && ready.statusKey === "contract" && ready.statusText === "ready");
} catch (error) {
  // req: R-689
  check("installed pi RPC contract completes", false, error?.stack ?? String(error));
} finally {
  await stop();

}
if (failed) process.exitCode = 1;
