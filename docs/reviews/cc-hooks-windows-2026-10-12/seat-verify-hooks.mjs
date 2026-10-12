// Seat acceptance for lane cc-hooks-windows (frozen; written before the build). A BLACK BOX: it drives
// the real `nana-setup` CLI with the NANA_SETUP_PLATFORM seam (win32 forced on any machine), reads the
// settings.json it writes, and SPAWNS each installed hook entry exactly as exec form does (command +
// args, no shell) with sample stdin. It also calls the exported pipe-guard predicate for R-1062.
// Run from the worktree root:  node docs/reviews/cc-hooks-windows-2026-10-12/seat-verify-hooks.mjs
// Optional: SEAT_MAIN=<path to a main checkout> enables the macOS-unchanged comparison (default ~/nana-pi).
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const root = process.cwd();
const cli = path.join(root, "packages/nana-setup/bin/nana-setup.mjs");
let bad = 0, n = 0;
const out = (title, got, want) => {
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got)} (want ${JSON.stringify(want)})`}`);
};
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seat-cch-"));
const PI_SUBAGENTS_FLOOR = (() => { try { return /PI_SUBAGENTS_FLOOR\s*=\s*"([^"]+)"/.exec(fs.readFileSync(path.join(root, "packages/nana-setup/lib/doctor.mjs"), "utf8"))?.[1] ?? "0.0.0"; } catch { return "0.0.0"; } })();
function freshHome(name) {
  const td = path.join(tmp, name);
  fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
  fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
  const sub = path.join(td, ".pi", "agent", "npm", "node_modules", "pi-subagents");
  fs.mkdirSync(sub, { recursive: true });
  fs.writeFileSync(path.join(sub, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
  return td;
}
const run = (cliPath, args, env) => spawnSync(process.execPath, [cliPath, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
const settingsOf = (home) => { try { return JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8")); } catch { return {}; } };
const entries = (settings, event) => (settings.hooks?.[event] ?? []).flatMap((g) => (g.hooks ?? []).map((h) => ({ group: g, hook: h })));
const nana = (settings, event, script) => entries(settings, event).filter(({ hook }) => JSON.stringify(hook).includes(script));

// 1. Forced-win32 install into a home whose name holds a space and $ ` % ' (R-1050, R-1051, R-1053).
const home = freshHome("h space $x `y %z% o'q");
const inst = run(cli, ["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
out("win32 install exits 0", inst.status, 0);
const s = settingsOf(home);
const SPEC = [
  ["SessionStart", "nana-objective.mjs", []],
  ["SessionStart", "nana-adoption.mjs", []],
  ["SessionStart", "nana-shared-memory.mjs", []],
  ["PreToolUse", "verifier-pipe.mjs", []],
  ["UserPromptSubmit", "nana-knowledge.ts", ["hook"]],
];
const installed = {};
for (const [event, script, extra] of SPEC) {
  const found = nana(s, event, script);
  out(`win32: exactly one ${script} entry under ${event}`, found.length, 1);
  const h = found[0]?.hook ?? {};
  installed[script] = h;
  out(`win32: ${script} is exec form (command "node", args array, no shell key)`, [h.command, Array.isArray(h.args), "shell" in h], ["node", true, false]);
  const target = h.args?.[0] ?? "";
  out(`win32: ${script} args[0] is an absolute existing script inside this checkout`, path.isAbsolute(target) && fs.existsSync(target) && path.resolve(target).startsWith(root) && target.endsWith(script), true);
  out(`win32: ${script} extra args`, (h.args ?? []).slice(1), extra);
}
out("win32: verifier group matcher is Bash|PowerShell", nana(s, "PreToolUse", "verifier-pipe.mjs")[0]?.group?.matcher, "Bash|PowerShell");

// 2. A second install changes nothing (no twins).
const before = fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8");
run(cli, ["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
out("win32: a second install leaves settings.json byte-identical", fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8") === before, true);

// 3. Bug 4 (R-1056, R-1059): today's real win32 knowledge entry, pointing at a missing checkout, is replaced in place.
{
  const h2 = freshHome("stale");
  fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
  const stale = { hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "node 'C:\\gone\\checkout/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5 }] }] } };
  fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify(stale, null, 2));
  out("win32 install over a stale knowledge entry exits 0", run(cli, ["install", "--home", h2], { NANA_SETUP_PLATFORM: "win32" }).status, 0);
  const k = entries(settingsOf(h2), "UserPromptSubmit").filter(({ hook }) => JSON.stringify(hook).includes("nana-knowledge"));
  out("win32: the stale knowledge entry is replaced, not twinned", k.length, 1);
  out("win32: the replacement is exec form into this checkout", [k[0]?.hook?.command, (k[0]?.hook?.args?.[0] ?? "").startsWith(root)], ["node", true]);
}

// 4. Doctor on forced win32 (R-1055, R-1057, R-1060): the five settings rows are not ✗, and a floor note names 2.1.139.
{
  const d = run(cli, ["doctor", "--home", home], { NANA_SETUP_PLATFORM: "win32", PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH}` });
  const lines = d.stdout.split("\n");
  const row = (label) => lines.find((l) => l.includes(label)) ?? "";
  for (const label of ["settings SessionStart objective", "settings SessionStart adoption", "settings SessionStart shared-memory", "settings PreToolUse verifier pipe", "settings UserPromptSubmit knowledge pull", "node for the objective hook"]) {
    out(`doctor win32: "${label}" is ✓`, row(label).trim().startsWith("✓"), true);
  }
  out("doctor win32: a note names the Claude Code 2.1.139 floor", lines.some((l) => l.includes("2.1.139")), true);
}

// 5. Spawn each installed entry as exec form with sample stdin (R-1058, R-1063, R-1064).
const project = path.join(tmp, "proj space $x `y %z% o'q");
fs.mkdirSync(project, { recursive: true });
fs.copyFileSync(path.join(root, "templates/_shared/OBJECTIVE.md"), path.join(project, "OBJECTIVE.md"));
fs.mkdirSync(path.join(home, ".claude", "nana-memory", "shared"), { recursive: true });
fs.writeFileSync(path.join(home, ".claude", "nana-memory", "shared", "MEMORY.md"), "# shared\n\n- [Seat seeded line](x.md) — seeded by the seat\n");
const env = { ...process.env, HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: project, CLAUDE_CONFIG_DIR: path.join(home, ".claude"), NANA_KNOWLEDGE_HOME: path.join(home, ".nana-knowledge") };
const spawnEntry = (h, stdin) => {
  if (!h?.command || !Array.isArray(h.args)) return { status: "no exec-form entry", stdout: "", stderr: "" };
  return spawnSync(h.command, h.args, { shell: false, input: JSON.stringify(stdin), env, encoding: "utf8", timeout: (h.timeout ?? 10) * 1000 + 5000 });
};
// SEAT_SELFTEST=1 swaps in the exec-form entries the plan specifies, to check this script's own fixtures.
if (process.env.SEAT_SELFTEST) {
  const hk = (f) => path.join(root, "packages/nana-setup/claude/hooks", f);
  Object.assign(installed, {
    "nana-objective.mjs": { type: "command", command: "node", args: [hk("nana-objective.mjs")], timeout: 5 },
    "nana-adoption.mjs": { type: "command", command: "node", args: [hk("nana-adoption.mjs")], timeout: 5 },
    "nana-shared-memory.mjs": { type: "command", command: "node", args: [hk("nana-shared-memory.mjs")], timeout: 5 },
    "verifier-pipe.mjs": { type: "command", command: "node", args: [hk("verifier-pipe.mjs")], timeout: 5 },
    "nana-knowledge.ts": { type: "command", command: "node", args: [path.join(root, "packages/nana-knowledge/bin/nana-knowledge.ts"), "hook"], timeout: 5 },
  });
}
const session = { hook_event_name: "SessionStart", source: "startup", cwd: project, session_id: "seat" };
{
  const r = spawnEntry(installed["nana-objective.mjs"], session);
  out("exec objective: exit 0", r.status, 0);
  out("exec objective: first line starts [nana:objective], no OBJECTIVE UNAVAILABLE", r.stdout.split("\n")[0].startsWith("[nana:objective]") && !r.stdout.includes("OBJECTIVE UNAVAILABLE"), true);
}
{
  const r = spawnEntry(installed["nana-adoption.mjs"], session);
  out("exec adoption: exit 0, no ADOPTION UNAVAILABLE", [r.status, r.stdout.includes("ADOPTION UNAVAILABLE")], [0, false]);
}
{
  const r = spawnEntry(installed["nana-shared-memory.mjs"], session);
  out("exec shared memory: exit 0, header and the seeded line", [r.status, r.stdout.includes("[nana:shared-memory]"), r.stdout.includes("Seat seeded line")], [0, true, true]);
}
{
  const v = installed["verifier-pipe.mjs"];
  const ev = (tool, command) => ({ hook_event_name: "PreToolUse", tool_name: tool, tool_input: { command }, cwd: project, session_id: "seat" });
  const masked = "npm test | tail -5; git commit -m x";
  const psMasked = "npm test | Select-Object -Last 5; git commit -m x";
  const isAsk = (r) => { try { return JSON.parse(r.stdout.trim().split("\n")[0]).hookSpecificOutput?.permissionDecision === "ask"; } catch { return false; } };
  out("exec verifier: Bash masked pipe → one ask", isAsk(spawnEntry(v, ev("Bash", masked))), true);
  out("exec verifier: PowerShell masked pipe → one ask", isAsk(spawnEntry(v, ev("PowerShell", psMasked))), true);
  out("exec verifier: PowerShell plain command → empty stdout", spawnEntry(v, ev("PowerShell", "git status")).stdout, "");
  out("exec verifier: Bash plain command → empty stdout", spawnEntry(v, ev("Bash", "git status")).stdout, "");
}
{
  const r = spawnEntry(installed["nana-knowledge.ts"], { hook_event_name: "UserPromptSubmit", prompt: "hello there seat", cwd: project, session_id: "seat" });
  out("exec knowledge: exit 0, no module-resolution error", [r.status, /Cannot find module|ERR_MODULE_NOT_FOUND/.test(r.stderr)], [0, false]);
}

// 6. R-1062: the pipe guard's PowerShell lexer (the exported predicate; truthy = ask).
{
  let guard = null;
  try { guard = (await import(path.join(root, "packages/nana-pack/lib/pipe-guard.mjs"))).verifierPipeReason; } catch (e) { out("pipe-guard loads", e.message, "loaded"); }
  if (guard) {
    const P = (c) => Boolean(guard(c, "powershell"));
    const live = [
      "npm test | Select-Object -Last 5; git commit -m x",
      "\"$(npm test | Select-Object -Last 1)\"; git commit -m x",
      "@\"\n$(npm test | Select-Object -Last 1)\n\"@\ngit commit -m x",
      "Write-Output \"a`\"b\"; npm test | Select-Object -Last 1; git commit -m x",
      "Write-Output \"a\"\"b\"; npm test | Select-Object -Last 1; git commit -m x",
    ];
    const dead = [
      "Write-Output \"a`\" | b\"; git commit -m x",
      "Write-Output \"a\"\" | b\"; git commit -m x",
      "'npm test | x'; git commit -m x",
      "\"npm test | x\"; git commit -m x",
      "npm test `| x; git commit -m x",
      "# npm test | x\ngit commit -m x",
      "<# npm test | x #> git commit -m x",
      "@'\nnpm test | x\n'@\ngit commit -m x",
      "@\"\nnpm test | x\n\"@\ngit commit -m x",
      "'it''s | x'; git commit -m x",
    ];
    for (const c of live) out(`R-1062 live (ask): ${JSON.stringify(c).slice(0, 70)}`, P(c), true);
    for (const c of dead) out(`R-1062 not live (no ask): ${JSON.stringify(c).slice(0, 70)}`, P(c), false);
    out("bash dialect unchanged: npm test | tail -5; git commit → ask", Boolean(guard("npm test | tail -5; git commit -m x", "bash")), true);
  }
}

// 7. macOS unchanged (R-1061): a forced-darwin install here equals one from a main checkout, paths normalised.
{
  const mainRoot = process.env.SEAT_MAIN ?? path.join(os.homedir(), "nana-pi");
  const mainCli = path.join(mainRoot, "packages/nana-setup/bin/nana-setup.mjs");
  if (fs.existsSync(mainCli)) {
    const hA = freshHome("darwin-lane"), hB = freshHome("darwin-main");
    run(cli, ["install", "--home", hA], { NANA_SETUP_PLATFORM: "darwin" });
    run(mainCli, ["install", "--home", hB], { NANA_SETUP_PLATFORM: "darwin" });
    const norm = (t, r, h) => t.split(r).join("<ROOT>").split(h).join("<HOME>");
    const a = norm(fs.readFileSync(path.join(hA, ".claude", "settings.json"), "utf8"), root, hA);
    const b = norm(fs.readFileSync(path.join(hB, ".claude", "settings.json"), "utf8"), fs.realpathSync(mainRoot), hB);
    out(`darwin: settings.json equals main's (${mainRoot}), paths normalised`, a === b, true);
  } else out("darwin comparison: main checkout present", false, true);
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`cases: ${n - bad}/${n}`);
console.log(`seat-verify-hooks: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
