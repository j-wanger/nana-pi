// Seat acceptance for lane install-check (frozen; written before the build; run on macOS from the
// worktree root):  node docs/reviews/install-check-2026-10-12/acceptance.mjs
// It runs the lane's own command like a user and reads its output lines. Line format (pinned in build
// brief 1): each item prints one line that STARTS with `PASS `, `FAIL ` or `XFAIL ` followed by its label.
// Cases (a)-(e) are CHANGE §5's; (f) and (g) were probes, run and recorded in the plan.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const root = process.cwd();
const CMD = path.join(root, "packages/nana-setup/bin/install-check.mjs");
let bad = 0, n = 0;
const out = (title, got, want) => {
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got)} (want ${JSON.stringify(want)})`}`);
};
const LABELS = ["install", "pi-subagents", "pi list nana-pack", "pi list nana-knowledge", "pi session", "hook set",
  "hook objective", "hook adoption", "hook shared memory", "hook verifier pipe (Bash)", "hook knowledge pull", "doctor"];
const cleanEnv = () => {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (/^(NANA_|PI_CODING_AGENT_DIR$|CLAUDE_CONFIG_DIR$|npm_config_)/i.test(k)) delete e[k];
  return e;
};
const runCheck = (cwd, env) => spawnSync(process.execPath, [path.join(cwd, "packages/nana-setup/bin/install-check.mjs")], { cwd, env, encoding: "utf8", timeout: 20 * 60 * 1000 });
const lineFor = (text, label) => text.split("\n").find((l) => new RegExp(`^(PASS|FAIL|XFAIL) ${label.replace(/[()]/g, "\\$&")}(\\b|$| —)`).test(l)) ?? "";

// (b) snapshot of the real home before anything runs
const H = os.homedir();
const watched = [".claude/settings.json", ".claude/hooks", ".claude/projects", ".claude/nana-memory", ".pi/agent/settings.json", ".pi/agent/npm", ".pi/agent/nana-objective.md", ".pi/agent/nana-pack.json", ".pi/agent/nana-journal.jsonl", ".local/bin", ".pi/agent/nana-knowledge"].map((p) => path.join(H, p));
const snap = () => {
  const lines = [];
  const walk = (p, depth) => {
    let st; try { st = fs.lstatSync(p); } catch { lines.push(`${p} absent`); return; }
    lines.push(`${p} ${st.size} ${st.mtimeMs}`);
    if (st.isDirectory() && depth < 3) for (const e of fs.readdirSync(p).sort()) walk(path.join(p, e), depth + 1);
  };
  for (const w of watched) walk(w, 0);
  return lines.join("\n");
};
const before = snap();

// (a) a clean run from the worktree
out("(a) the command exists", fs.existsSync(CMD), true);
const a = fs.existsSync(CMD) ? runCheck(root, cleanEnv()) : { status: "missing", stdout: "", stderr: "" };
out("(a) exits 0", a.status, 0);
for (const label of LABELS) out(`(a) PASS line: ${label}`, lineFor(a.stdout, label).startsWith("PASS "), true);
out("(a) no XFAIL line on macOS", /^XFAIL /m.test(a.stdout), false);
out("(a) the first lines name the resolved pi and node paths", /pi[^\n]*\//.test(a.stdout.split("\n").slice(0, 6).join("\n")) && /node[^\n]*\//.test(a.stdout.split("\n").slice(0, 6).join("\n")), true);

// (b) the real home is untouched
out("(b) the real home's watched paths are unchanged", snap() === before, true);
{
  let named = false;
  try { named = fs.readdirSync(path.join(H, ".claude", "projects")).some((e) => /install-check|seat-ic/i.test(e) && fs.statSync(path.join(H, ".claude", "projects", e)).mtimeMs > Date.now() - 60 * 60 * 1000); } catch {}
  out("(b) no new ~/.claude/projects entry for the check", named, false);
}

// (c) a hostile caller environment changes nothing
{
  const empties = Object.fromEntries(["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_KNOWLEDGE_HOME", "npm_config_cache"].map((k) => [k, fs.mkdtempSync(path.join(os.tmpdir(), `seat-ic-${k}-`))]));
  const env = { ...cleanEnv(), NANA_ROLE: "worker", NANA_SETUP_PLATFORM: "win32", NANA_HANDOFF: "off", NANA_TEST_TEMP_ROOTS: "", ...empties };
  const c = fs.existsSync(CMD) ? runCheck(root, env) : { status: "missing", stdout: "" };
  out("(c) hostile environment: exits 0", c.status, 0);
  out("(c) hostile environment: every label still PASS", LABELS.every((l) => lineFor(c.stdout, l).startsWith("PASS ")), true);
  out("(c) hostile environment: the pointed-at folders stay empty", Object.values(empties).every((d) => fs.readdirSync(d).length === 0), true);
  for (const d of Object.values(empties)) fs.rmSync(d, { recursive: true, force: true });
}

// (d) sensitivity: each fault in its own scratch worktree; the check must exit non-zero and FAIL the item
{
  const faults = [
    ["the verifier entry dropped from desiredHooks", "packages/nana-setup/lib/settings.mjs", (s) => s.replace(/(verifier-pipe\.mjs)/, "verifier-pipe-DROPPED.mjs"), "hook verifier pipe (Bash)"],
    ["stepPiRegister always SKIPPED", "packages/nana-setup/lib/steps.mjs", (s) => s.replace(/export function stepPiRegister\(([^)]*)\)\s*\{/, (m) => `${m}\n\treturn [{ label: "pi packages", status: SKIPPED, detail: "seat fault" }];`), "pi list nana-pack"],
    ["the shared-memory hook's import broken", "packages/nana-setup/claude/hooks/nana-shared-memory.mjs", (s) => s.replace(/from "(\.\.\/\.\.\/lib\/[^"]+)"/, 'from "$1.BROKEN"'), "hook shared memory"],
    // anchors at main 7e6ce39: the desired knowledge command `NODE_NO_WARNINGS=1 node ${shq(knowledgeCli)} hook` (settings.mjs:172)
    ["the knowledge entry losing its hook word", "packages/nana-setup/lib/settings.mjs", (s) => s.replace("node ${shq(knowledgeCli)} hook`", "node ${shq(knowledgeCli)}`"), "hook knowledge pull"],
  ];
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
  for (const [name, file, mutate, label] of faults) {
    const wt = fs.mkdtempSync(path.join(os.tmpdir(), "seat-ic-fault-"));
    fs.rmSync(wt, { recursive: true, force: true });
    const add = spawnSync("git", ["worktree", "add", "--detach", wt, head], { cwd: root, encoding: "utf8" });
    if (add.status !== 0) { out(`(d) ${name}: scratch worktree`, add.stderr.trim(), ""); continue; }
    const fp = path.join(wt, file);
    const src = fs.readFileSync(fp, "utf8");
    const changed = mutate(src);
    if (changed === src) { out(`(d) ${name}: the fault applies`, false, true); }
    else {
      fs.writeFileSync(fp, changed);
      const r = fs.existsSync(path.join(wt, "packages/nana-setup/bin/install-check.mjs")) ? runCheck(wt, cleanEnv()) : { status: "missing", stdout: "" };
      out(`(d) ${name}: exits non-zero and FAILs "${label}"`, r.status !== 0 && lineFor(r.stdout, label).startsWith("FAIL "), true);
    }
    spawnSync("git", ["worktree", "remove", "--force", wt], { cwd: root, encoding: "utf8" });
  }
}

// (e) ci.yml shape
{
  const ci = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
  const job = /^  install-check:\n([\s\S]*?)(?=^  [a-z-]+:\n)/m.exec(ci)?.[1] ?? "";
  out("(e) an install-check job exists before suite", job.length > 0 && ci.indexOf("  install-check:") < ci.indexOf("  suite:"), true);
  out("(e) it runs on macos-latest and windows-latest", /macos-latest/.test(job) && /windows-latest/.test(job), true);
  out("(e) it has no continue-on-error", /continue-on-error/.test(job), false);
  out("(e) it runs the command exactly", /^\s*run: node packages\/nana-setup\/bin\/install-check\.mjs\s*$/m.test(job), true);
  out("(e) release needs both jobs", /needs:\s*\[\s*suite\s*,\s*install-check\s*\]/.test(ci), true);
}

console.log(`cases: ${n - bad}/${n}`);
console.log(`install-check acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
