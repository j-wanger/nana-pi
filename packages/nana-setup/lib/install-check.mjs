/**
 * @module packages/nana-setup/lib/install-check.mjs
 * @purpose Implements pure install-check contracts and the isolated subprocess runner.
 * @inputs Sealed configuration, process environment, platform, clock and spawn function.
 * @outputs Child results, item judgments and environment construction.
 * @effects process
 * @errors Child failures become item results; invalid hook shapes are reported as failures.
 */
import fs from "node:fs";
import path from "node:path";
import { ALLOWED_HOOK_KEYS, DOCTOR_NOTES, HOOKS, KNOWN_RED, OVERRIDE_ENV, SAMPLE_INPUTS, SPAWN_TIMEOUT_MS } from "./install-check-config.mjs";
import { PI_SUBAGENTS_FLOOR } from "./doctor.mjs";
import { findPi, winCommand } from "../../nana-pack/lib/win-command.mjs";
import { projectKey } from "./project-key.mjs";

export function buildEnvironment(source, home, platformName = process.platform) {
  const env = {};
  for (const [key, value] of Object.entries(source ?? {})) {
    if (OVERRIDE_ENV.some((name) => key.toLowerCase() === name.toLowerCase())) continue;
    if (key.toLowerCase().startsWith("npm_config_")) continue;
    env[key] = value;
  }
  env.HOME = home;
  env.USERPROFILE = home;
  env.TMPDIR = path.join(home, "tmp");
  env.TEMP = path.join(home, "tmp");
  env.TMP = path.join(home, "tmp");
  env.npm_config_cache = path.join(home, ".npm");
  return env;
}

function matches(matcher, tool) {
  if (matcher === undefined || matcher === null || matcher === "" || matcher === "*") return true;
  if (/^[A-Za-z0-9_\- ,|]+$/.test(matcher)) return matcher.split(/[|,]/).map((s) => s.trim()).includes(tool);
  try { return new RegExp(matcher).test(tool); } catch { return false; }
}

export function mapHookEntries(groups, platformName) {
  const found = [];
  const failures = [];
  const all = [];
  for (const row of groups ?? []) {
    for (const entry of row.group?.hooks ?? []) all.push({ event: row.event, matcher: row.group?.matcher, entry });
  }
  const expectedHooks = HOOKS.filter((hook) => !hook.platforms || hook.platforms.includes(platformName));
  const used = new Set();
  for (const expected of expectedHooks) {
    const hit = all.find((x, index) => !used.has(index) && x.event === expected.event &&
      (expected.event === "SessionStart" ? matches(x.matcher, "startup") : expected.event === "UserPromptSubmit" ? x.matcher === undefined : matches(x.matcher, expected.tool)) &&
      (String(x.entry.command ?? "").includes(expected.script) || (Array.isArray(x.entry.args) && x.entry.args.some((a) => String(a).includes(expected.script)))));
    if (!hit) { failures.push({ item: expected.label, code: "missing-entry" }); continue; }
    const index = all.indexOf(hit); used.add(index);
    const e = hit.entry;
    const form = Array.isArray(e.args) ? "exec" : "shell";
    if (form !== expected.form[platformName]) failures.push({ item: expected.label, code: "wrong-form" });
    if (e.type !== "command" || typeof e.command !== "string" || e.timeout !== expected.timeout ||
        (e.args !== undefined && (!Array.isArray(e.args) || e.args.some((arg) => typeof arg !== "string"))) ||
        Object.keys(e).some((k) => !ALLOWED_HOOK_KEYS.includes(k))) failures.push({ item: expected.label, code: "bad-shape" });
    found.push({ expected, ...hit });
  }
  if (all.length !== expectedHooks.length || used.size !== expectedHooks.length)
    failures.push({ item: "hook set", code: all.length < expectedHooks.length ? "missing-entry" : "extra-entry" });
  return { entries: found, failures };
}

export function hookInvocation(entry, platformName, gitBash = null) {
  if (Array.isArray(entry.args)) return { command: entry.command, args: entry.args, shell: false };
  if (platformName === "win32") return { command: gitBash, args: ["-c", entry.command], shell: false };
  return { command: "/bin/sh", args: ["-c", entry.command], shell: false };
}

export function formatResultLine(item, result, reason = "", knownRed = null) {
  const prefix = `${result.status} ${item}`;
  if (result.status === "PASS") return prefix;
  const detail = String(reason || "required condition was not observed").replace(/\s+/g, " ").trim().slice(0, 200);
  const owner = result.status === "XFAIL" && knownRed?.owner && knownRed?.expires
    ? ` (known red, ${knownRed.owner}, until ${knownRed.expires})` : "";
  return `${prefix} — ${result.code}: ${detail}${owner}`;
}

export function hookFailureReason(entry, expected, code, platformName) {
  if (code === "wrong-form") return `dispatch form is ${Array.isArray(entry.args) ? "exec" : "shell"}, expected ${expected.form[platformName]}`;
  return `${expected.label}: ${code}`;
}

export function classifyResult(item, code, passed, knownRed, now = new Date()) {
  const match = (knownRed ?? []).find((x) => x.item === item);
  if (passed) return { status: match ? "FAIL" : "PASS", code: match ? "unexpected-pass" : null };
  const date = now.toISOString().slice(0, 10);
  if (match && match.code === code && date < match.expires) return { status: "XFAIL", code };
  return { status: "FAIL", code: code ?? "unexpected" };
}

export function parsePiList(output, checkout, platformName = process.platform) {
  const norm = (v) => comparablePath(String(v).trim(), platformName);
  const lines = String(output).replace(/\u001b\[[0-9;]*m/g, "").split(/\r?\n/);
  const parse = (pkg) => {
    const expected = norm(path.join(checkout, "packages", pkg));
    const idx = lines.findLastIndex((line, i) => i > 0 && /^\s/.test(line) && norm(line.trim()) === expected);
    if (idx < 0) return false;
    const header = lines[idx - 1].trim();
    return !header.includes("(filtered)") && (header.includes(pkg) || header.startsWith("../../") || header.startsWith("npm:"));
  };
  return { pack: parse("nana-pack"), knowledge: parse("nana-knowledge") };
}

export function spawnChild(spawn, command, args, options, env) {
  return spawn(command, args, { ...options, env });
}

function comparablePath(value, platformName) {
  let resolved;
  try { resolved = fs.realpathSync.native(value); } catch { resolved = path.resolve(value); }
  return platformName === "win32" ? resolved.toLowerCase() : resolved;
}

export function journalHasUnadopted(text, project, platformName = process.platform) {
  const expected = comparablePath(project, platformName);
  return String(text).split(/\r?\n/).some((line) => {
    try {
      const event = JSON.parse(line);
      return event?.event === "directory_unadopted" && typeof event.cwd === "string" && comparablePath(event.cwd, platformName) === expected;
    } catch { return false; }
  });
}

export async function runInstallCheck({ root, home, platformName, env, spawn, exists, now = () => new Date(), out = () => {} }) {
  const lines = [];
  const emitLine = (line) => { lines.push(line); out(line); };
  const childEnv = buildEnvironment(env, home, platformName);
  if (platformName !== "win32") childEnv.PATH = `${path.join(home, ".local", "bin")}${path.delimiter}${childEnv.PATH ?? ""}`;
  const project = path.join(home, "project");
  childEnv.CLAUDE_PROJECT_DIR = project;
  const notes = path.join(home, "notes");
  fs.mkdirSync(path.join(home, "tmp"), { recursive: true });
  fs.mkdirSync(path.join(home, ".npm"), { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  fs.mkdirSync(path.join(notes, "docs"), { recursive: true });
  const token = `installcheck_${now().getTime().toString(36)}`;
  const invoke = async (command, args, options = {}) =>
    spawn(command, args, { cwd: root, ...options, env: childEnv });
  const git = (folder) => invoke("git", ["init", "--quiet", folder], { cwd: folder, timeout: SPAWN_TIMEOUT_MS.git });
  const resolveOnPath = (name) => {
    for (const dir of String(childEnv.PATH ?? "").split(path.delimiter)) {
      const candidate = path.join(dir, name);
      try { if (fs.statSync(candidate).isFile() && fs.accessSync(candidate, fs.constants.X_OK) === undefined) return fs.realpathSync(candidate); } catch {}
    }
    return name;
  };
  const gitInit1 = await git(notes);
  const gitInit2 = await git(project);
  const gitRootOkay = gitInit1.status === 0 && gitInit2.status === 0;
  fs.writeFileSync(path.join(notes, "docs", "install-check.md"), `# ${token}\nfixture evidence\n`);
  const nodePath = process.execPath;
  let pi = platformName === "win32" ? (findPi({ env: childEnv, cwd: root, exists }) ?? "pi") : resolveOnPath("pi");
  let bash = null;
  if (platformName === "win32") {
    for (const dir of String(childEnv.PATH ?? "").split(path.delimiter)) {
      const gitExe = path.join(dir, "git.exe");
      const lookedUp = await invoke(gitExe, ["--version"]);
      if (lookedUp.error || lookedUp.status !== 0) continue;
      const candidates = [path.resolve(dir, "..", "bin", "bash.exe"), path.resolve(dir, "..", "..", "bin", "bash.exe")];
      bash = candidates.find((candidate) => fs.existsSync(candidate)) ?? bash;
    }
    emitLine(`Git Bash: ${bash ?? "not found"}`);
  }
  emitLine(`pi: ${path.resolve(pi)}`);
  emitLine(`node: ${nodePath}`);
  let failed = false;
  const report = (item, code, passed, detail = "") => {
    const list = KNOWN_RED[platformName] ?? [];
    const result = classifyResult(item, code, passed, list, now());
    const reason = detail || `observed ${code ?? "failure"} while checking ${item}`;
    emitLine(formatResultLine(item, result, reason, list.find((entry) => entry.item === item)));
    if (result.status === "FAIL") failed = true;
  };
  const okay = (r) => !r?.error && r?.status === 0;
  const reason = (r) => r?.error?.code === "ETIMEDOUT" ? `timed out after ${r.ms ?? 0} ms` : `exit status ${r?.status ?? "unknown"}${r?.signal ? ` (signal ${r.signal})` : ""}${r?.stderr?.trim() ? `; last stderr: ${r.stderr.trim().split(/\r?\n/).at(-1)}` : ""}`;
  const install = await invoke(process.execPath, [path.join(root, "packages/nana-setup/bin/nana-setup.mjs"), "install"], { cwd: root, timeout: SPAWN_TIMEOUT_MS.install });
  report("install", install.error?.code === "ETIMEDOUT" ? "timeout" : "exit", okay(install) && gitRootOkay, okay(install) ? (gitRootOkay ? "" : "fixture git init failed") : reason(install));
  if (okay(install)) {
    fs.writeFileSync(path.join(home, ".pi", "agent", "nana-objective.md"), `**Objective (since 2026-10-12):** ${token}.\n\n**Current priority (since 2026-10-12):** install-check ${token}.\n`);
    const memory = path.join(home, ".claude", "nana-memory", "shared", "MEMORY.md");
    fs.appendFileSync(memory, `\n- [${token}] install-check fixture memory.\n`);
  }
  const piRun = async (args, timeout = SPAWN_TIMEOUT_MS.pi) => {
    if (platformName !== "win32") return invoke(pi, args, { cwd: project, timeout });
    const launch = winCommand(pi, args, { comspec: childEnv.ComSpec });
    return launch.refused ? { status: 1, stderr: launch.refused } : invoke(launch.command, launch.args, { ...launch.options, cwd: project, timeout });
  };
  const sub = await piRun(["install", `npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`]);
  report("pi-subagents", sub.error?.code === "ETIMEDOUT" ? "timeout" : "exit", okay(sub), okay(sub) ? "" : reason(sub));
  const listed = await piRun(["list"], SPAWN_TIMEOUT_MS.list);
  const parsed = parsePiList(listed.stdout ?? "", root, platformName);
  report("pi list nana-pack", "missing-entry", okay(listed) && parsed.pack);
  report("pi list nana-knowledge", "missing-entry", okay(listed) && parsed.knowledge);
  const sessionArgs = ["--mode", "rpc", "--no-session"];
  const sessionLaunch = platformName === "win32" ? winCommand(pi, sessionArgs, { comspec: childEnv.ComSpec }) : { command: pi, args: sessionArgs, options: {} };
  const session = sessionLaunch.refused ? { status: 1, stderr: sessionLaunch.refused } : await invoke(sessionLaunch.command, sessionLaunch.args, { ...sessionLaunch.options, cwd: project, timeout: SPAWN_TIMEOUT_MS.session, input: '{"type":"get_commands"}\n' });
  let journal = "";
  try { journal = fs.readFileSync(path.join(home, ".pi/agent/nana-journal.jsonl"), "utf8"); } catch {}
  const sessionOutput = `${session.stdout ?? ""}${session.stderr ?? ""}`;
  const sessionOkay = okay(session) && sessionOutput.includes("reload-runtime") && journalHasUnadopted(journal, project, platformName);
  report("pi session", session.error?.code === "ETIMEDOUT" ? "timeout" : "no-output", sessionOkay, !okay(session) ? reason(session) : !sessionOutput.includes("reload-runtime") ? "reload-runtime not in get_commands output" : !journalHasUnadopted(journal, project, platformName) ? `journal has no directory_unadopted for ${project}` : "");
  const settingsPath = path.join(home, ".claude", "settings.json");
  let settings = {}; try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); } catch {}
  const groups = Object.entries(settings.hooks ?? {}).flatMap(([event, rows]) => rows.map((group) => ({ event, group })));
  const mapped = mapHookEntries(groups, platformName);
  const firstFailure = mapped.failures[0];
  report("hook set", firstFailure?.code ?? "missing-entry", mapped.failures.length === 0, firstFailure ? `${firstFailure.item}: ${firstFailure.code}` : "");
  const sessionDir = path.join(home, ".claude", "projects", projectKey(project));
  fs.mkdirSync(sessionDir, { recursive: true });
  const transcript = path.join(sessionDir, `${token}.jsonl`); fs.writeFileSync(transcript, "");
  const sample = { ...SAMPLE_INPUTS.session, source: "startup", transcript_path: transcript, cwd: project };
  for (const expected of HOOKS.filter((hook) => !hook.platforms || hook.platforms.includes(platformName))) {
    const mappedEntry = mapped.entries.find((candidate) => candidate.expected.label === expected.label);
    const structural = mapped.failures.find((failure) => failure.item === expected.label);
    if (!mappedEntry) { report(expected.label, structural?.code ?? "missing-entry", false); continue; }
    const entry = mappedEntry.entry;
    const input = expected.event === "SessionStart" ? sample : expected.event === "UserPromptSubmit"
      ? { prompt: `${SAMPLE_INPUTS.prompt} ${token}`, cwd: project }
      : { hook_event_name: "PreToolUse", tool_name: expected.tool, tool_input: { command: expected.tool === "PowerShell" ? SAMPLE_INPUTS.verifier.powershellHit : SAMPLE_INPUTS.verifier.bashHit } };
    const invocation = hookInvocation(entry, platformName, bash);
    const result = await invoke(invocation.command, invocation.args, { cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(input) });
    const stdout = result.stdout ?? "";
    let passed = !structural && okay(result) && stdout.length <= SAMPLE_INPUTS.maxOutput;
    if (expected.shortLabel === "objective") passed &&= stdout.startsWith("[nana:objective]") && stdout.includes(token) && !stdout.includes("OBJECTIVE UNAVAILABLE");
    if (expected.shortLabel === "adoption") passed &&= stdout.includes(project) && !stdout.includes("ADOPTION UNAVAILABLE");
    if (expected.shortLabel === "shared memory") {
      const link = path.join(sessionDir, "memory/shared"); let target = null; try { target = fs.realpathSync(link); } catch {}
      let memoryTarget = null; try { memoryTarget = fs.realpathSync(path.join(home, ".claude/nana-memory/shared")); } catch {}
      passed &&= stdout.includes("[nana:shared-memory]") && stdout.includes(`- [${token}]`) && target === memoryTarget;
    }
    if (expected.shortLabel === "knowledge pull") passed &&= stdout.includes("[nana:knowledge]") && stdout.includes("install-check.md");
    let miss = null;
    if (expected.shortLabel === "verifier pipe") {
      const missInput = { hook_event_name: "PreToolUse", tool_name: expected.tool, tool_input: { command: expected.tool === "PowerShell" ? "git status" : SAMPLE_INPUTS.verifier.bashMiss } };
      miss = await invoke(invocation.command, invocation.args, { cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(missInput) });
      const outputLines = stdout.trim().split(/\r?\n/).filter(Boolean); let valid = false;
      if (outputLines.length === 1) try { const payload = JSON.parse(outputLines[0]).hookSpecificOutput; valid = payload?.hookEventName === "PreToolUse" && payload?.permissionDecision === "ask"; } catch {}
      passed &&= valid && okay(miss) && (miss.stdout ?? "") === "";
    }
    let code = result.error?.code === "ETIMEDOUT" ? "timeout" : passed ? null : structural?.code ?? (!stdout ? "no-output" : "unexpected");
    let detail = "";
    if (!passed) detail = !okay(result) ? reason(result) : structural ? hookFailureReason(entry, expected, structural.code, platformName) : expected.shortLabel === "verifier pipe" ? `hit=${JSON.stringify(stdout)} miss=${JSON.stringify(miss?.stdout ?? "")}` : "required hook output or fixture condition was not observed";
    report(expected.label, code, passed, detail);
  }
  const doctor = await invoke(process.execPath, [path.join(root, "packages/nana-setup/bin/nana-setup.mjs"), "doctor"], { cwd: project, timeout: SPAWN_TIMEOUT_MS.doctor });
  const unexpected = (doctor.stdout ?? "").split(/\r?\n/).find((line) => line.includes("·") && !(DOCTOR_NOTES[platformName] ?? []).some((note) => line.includes(note)));
  report("doctor", unexpected ? "note-row" : doctor.error?.code === "ETIMEDOUT" ? "timeout" : "exit", okay(doctor) && !unexpected, unexpected ? unexpected : okay(doctor) ? "" : reason(doctor));
  return { lines, exitCode: failed ? 1 : 0 };
}
