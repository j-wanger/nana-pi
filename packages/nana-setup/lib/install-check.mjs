/**
 * @module packages/nana-setup/lib/install-check.mjs
 * @purpose Implements pure install-check contracts and the isolated subprocess runner.
 * @inputs Sealed configuration, process environment, platform, clock and spawn function.
 * @outputs Child results, item judgments, environment construction and failure diagnostics.
 * @effects disk, process
 * @errors Child failures become item results; invalid hook shapes are reported as failures.
 */
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { ALLOWED_HOOK_KEYS, DOCTOR_NOTES, HOOKS, KNOWN_RED, OVERRIDE_ENV, PULL_LOG_PATH, SAMPLE_INPUTS, SPAWN_TIMEOUT_MS } from "./install-check-config.mjs";
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
  let malformedGroup = false;
  for (const row of groups ?? []) {
    const group = row?.group;
    if (!group || typeof group !== "object" || !Array.isArray(group.hooks) || (group.matcher !== undefined && typeof group.matcher !== "string")) { malformedGroup = true; continue; }
    for (const entry of group.hooks) all.push({ event: row.event, matcher: group.matcher, entry });
  }
  const expectedHooks = HOOKS.filter((hook) => !hook.platforms || hook.platforms.includes(platformName));
  const labelsFor = (hook) => hook.tools?.[platformName].map((tool) => `${hook.label} (${tool})`) ?? [hook.label];
  const used = new Set();
  for (const expected of expectedHooks) {
    const hitIndex = all.findIndex((x, index) => !used.has(index) && x.event === expected.event &&
      (String(x.entry?.command ?? "").includes(expected.script) || (Array.isArray(x.entry?.args) && x.entry.args.some((a) => String(a).includes(expected.script)))));
    if (hitIndex < 0) { for (const item of labelsFor(expected)) failures.push({ item, code: "missing-entry" }); continue; }
    used.add(hitIndex);
    const hit = all[hitIndex];
    const e = hit.entry;
    const form = !e || typeof e !== "object" ? "invalid" : e.args === undefined ? "shell" : e.command === "node" && Array.isArray(e.args) ? "exec" : "invalid";
    if (form !== expected.form[platformName]) for (const item of labelsFor(expected)) failures.push({ item, code: "wrong-form" });
    if (!e || typeof e !== "object" || Array.isArray(e) || e.type !== "command" || typeof e.command !== "string" || e.timeout !== expected.timeout ||
        (e.args !== undefined && (!Array.isArray(e.args) || e.args.some((arg) => typeof arg !== "string"))) ||
        Object.keys(e).some((k) => !ALLOWED_HOOK_KEYS.includes(k))) for (const item of labelsFor(expected)) failures.push({ item, code: "bad-shape" });
    const requiredTools = expected.tools?.[platformName] ?? (expected.event === "SessionStart" ? ["startup"] : []);
    if (expected.event === "UserPromptSubmit" && hit.matcher !== undefined) failures.push({ item: expected.label, code: "bad-matcher" });
    for (const tool of requiredTools) if (!matches(hit.matcher, tool)) {
      const item = expected.tools ? `${expected.label} (${tool})` : expected.label;
      failures.push({ item, code: "bad-matcher" });
    }
    found.push({ expected, ...hit });
  }
  if (malformedGroup || all.length !== expectedHooks.length || used.size !== expectedHooks.length)
    failures.push({ item: "hook set", code: all.length < expectedHooks.length ? "missing-entry" : "extra-entry" });
  return { entries: found, failures };
}

export function findGitBash(pathEntries, exists = fs.existsSync) {
  for (const entry of pathEntries ?? []) {
    const normalized = String(entry).replaceAll("/", "\\").replace(/\\+$/, "");
    const gitRoot = normalized.replace(/\\mingw64\\bin$/i, "").replace(/\\(?:cmd|bin)$/i, "");
    if (gitRoot === normalized || !exists(`${normalized}\\git.exe`)) continue;
    const candidate = `${gitRoot}\\bin\\bash.exe`;
    if (exists(candidate)) return candidate;
  }
  return null;
}

export function hookInvocation(entry, platformName, gitBash = null) {
  if (Array.isArray(entry.args)) return { command: entry.command, args: entry.args, shell: false };
  if (platformName === "win32") return { command: gitBash, args: ["-c", entry.command], shell: false };
  return { command: "/bin/sh", args: ["-c", entry.command], shell: false };
}

export function formatResultLine(item, result, reason = "", knownRed = null) {
  const prefix = `${result.status} ${item}`;
  if (result.status === "PASS") return prefix;
  const unexpectedPass = result.code === "unexpected-pass" && knownRed?.owner && knownRed?.expires
    ? `listed as known red (${knownRed.code}, ${knownRed.owner}, until ${knownRed.expires}) but passed` : null;
  const detail = String(unexpectedPass || reason || "required condition was not observed").replace(/\s+/g, " ").trim().slice(0, 200);
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

export function createSpawnAdapter(childSpawn, { now = () => performance.now() } = {}) {
  return (command, args, options = {}) => new Promise((resolve) => {
    const started = now();
    let stdout = ""; let stderr = ""; let settled = false; let timedOut = false;
    const cap = (current, chunk) => (current + chunk.toString()).slice(0, 10001);
    let child; let timer;
    const finish = (result) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      resolve({ ...result, stdout, stderr, ms: Math.round(now() - started) });
    };
    try {
      child = childSpawn(command, args, { cwd: options.cwd, env: options.env, windowsHide: true, windowsVerbatimArguments: options.windowsVerbatimArguments, stdio: ["pipe", "pipe", "pipe"] });
      child.stdout.on("data", (chunk) => { stdout = cap(stdout, chunk); });
      child.stderr.on("data", (chunk) => { stderr = cap(stderr, chunk); });
      timer = setTimeout(() => { timedOut = true; child.kill(); }, options.timeout ?? SPAWN_TIMEOUT_MS.pi);
      child.on("error", (error) => finish({ status: null, signal: null, error }));
      child.on("close", (status, signal) => finish(timedOut
        ? { status: null, signal, error: Object.assign(new Error("child timed out"), { code: "ETIMEDOUT" }) }
        : { status, signal, error: null }));
      if (options.input) child.stdin.end(options.input); else child.stdin.end();
    } catch (error) { finish({ status: null, signal: null, error }); }
  });
}

export function spawnChild(spawn, command, args, options, env) {
  return spawn(command, args, { ...options, env });
}

function comparablePath(value, platformName) {
  if (platformName === "win32") return path.win32.resolve(value).toLowerCase();
  try { return fs.realpathSync.native(value); } catch { return path.resolve(value); }
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
  const notes = path.join(home, "notes");
  fs.mkdirSync(path.join(home, "tmp"), { recursive: true });
  fs.mkdirSync(path.join(home, ".npm"), { recursive: true });
  fs.mkdirSync(project, { recursive: true });
  fs.mkdirSync(path.join(notes, "docs"), { recursive: true });
  const token = `installcheck_${now().getTime().toString(36)}`;
  const invoke = async (command, args, options = {}) =>
    spawn(command, args, { cwd: root, ...options, env: options.env ?? childEnv });
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
    const pathKey = Object.keys(childEnv).find((key) => key.toLowerCase() === "path");
    bash = findGitBash(String(pathKey ? childEnv[pathKey] : "").split(/[;]/), exists);
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
  const sessionEnv = { ...childEnv, NANA_TEST_TEMP_ROOTS: "" };
  const session = sessionLaunch.refused ? { status: 1, stderr: sessionLaunch.refused } : await invoke(sessionLaunch.command, sessionLaunch.args, { ...sessionLaunch.options, cwd: project, timeout: SPAWN_TIMEOUT_MS.session, input: '{"type":"get_commands"}\n', env: sessionEnv });
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
  const hookRuns = HOOKS.filter((hook) => !hook.platforms || hook.platforms.includes(platformName)).flatMap((expected) =>
    (expected.tools?.[platformName] ?? [null]).map(async (tool) => {
    const label = tool ? `${expected.label} (${tool})` : expected.label;
    const mappedEntry = mapped.entries.find((candidate) => candidate.expected.label === expected.label);
    const structural = mapped.failures.find((failure) => failure.item === label);
    if (!mappedEntry) { report(label, structural?.code ?? "missing-entry", false); return; }
    const entry = mappedEntry.entry;
    if (structural) { report(label, structural.code, false, hookFailureReason(entry, expected, structural.code, platformName)); return; }
    const input = expected.event === "SessionStart" ? sample : expected.event === "UserPromptSubmit"
      ? { prompt: `${SAMPLE_INPUTS.prompt} ${token}`, cwd: project }
      : { hook_event_name: "PreToolUse", tool_name: tool, tool_input: { command: tool === "PowerShell" ? SAMPLE_INPUTS.verifier.powershellHit : SAMPLE_INPUTS.verifier.bashHit } };
    const invocation = hookInvocation(entry, platformName, bash);
    const hookEnv = { ...childEnv, CLAUDE_PROJECT_DIR: project };
    const result = await invoke(invocation.command, invocation.args, { cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(input), env: hookEnv });
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
      const missInput = { hook_event_name: "PreToolUse", tool_name: tool, tool_input: { command: tool === "PowerShell" ? "git status" : SAMPLE_INPUTS.verifier.bashMiss } };
      miss = await invoke(invocation.command, invocation.args, { cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(missInput), env: hookEnv });
      const outputLines = stdout.trim().split(/\r?\n/).filter(Boolean); let valid = false;
      if (outputLines.length === 1) try { const payload = JSON.parse(outputLines[0]).hookSpecificOutput; valid = payload?.hookEventName === "PreToolUse" && payload?.permissionDecision === "ask"; } catch {}
      passed &&= valid && okay(miss) && (miss.stdout ?? "") === "";
    }
    let code = result.error?.code === "ETIMEDOUT" ? "timeout" : passed ? null : structural?.code ?? (!stdout ? "no-output" : "unexpected");
    let detail = "";
    if (!passed) detail = !okay(result) ? reason(result) : structural ? hookFailureReason(entry, expected, structural.code, platformName) : expected.shortLabel === "verifier pipe" ? `hit=${JSON.stringify(stdout)} miss=${JSON.stringify(miss?.stdout ?? "")}` : "required hook output or fixture condition was not observed";
    report(label, code, passed, detail);
  }));
  await Promise.all(hookRuns);
  const doctor = await invoke(process.execPath, [path.join(root, "packages/nana-setup/bin/nana-setup.mjs"), "doctor"], { cwd: project, timeout: SPAWN_TIMEOUT_MS.doctor });
  const unexpected = (doctor.stdout ?? "").split(/\r?\n/).filter((line) => line.includes("·") && !(DOCTOR_NOTES[platformName] ?? []).some((note) => line.includes(note)));
  const labels = unexpected.map((line) => line.slice(line.indexOf("·") + 1).replace(/\s+/g, " ").trim());
  let doctorDetail = labels.join("; ");
  if (doctorDetail.length > 200) {
    const kept = [];
    for (const label of labels) {
      const suffix = `… and ${labels.length - kept.length} more`;
      const candidate = [...kept, label].join("; ");
      if (`${candidate}; ${suffix}`.length <= 200) kept.push(label);
      else break;
    }
    doctorDetail = `${kept.join("; ")}${kept.length ? "; " : ""}… and ${labels.length - kept.length} more`;
  }
  report("doctor", labels.length ? "note-row" : doctor.error?.code === "ETIMEDOUT" ? "timeout" : "exit", okay(doctor) && labels.length === 0, labels.length ? doctorDetail : okay(doctor) ? "" : reason(doctor));
  if (failed) {
    const settingsPath = path.join(home, ".claude", "settings.json");
    try {
      const settingsText = fs.readFileSync(settingsPath, "utf8");
      const parsedSettings = JSON.parse(settingsText);
      emitLine(`settings hooks: ${JSON.stringify(parsedSettings.hooks ?? null)}`);
    } catch (error) {
      emitLine(`settings hooks: could not be read (${error?.code ?? error?.name ?? "Error"})`);
    }
    const pullLogPath = path.join(home, ...PULL_LOG_PATH);
    try {
      const records = fs.readFileSync(pullLogPath, "utf8").split(/\r?\n/).filter((line) => line.trim());
      emitLine(`last pull.log record: ${records.at(-1) ?? "none"}`);
    } catch (error) {
      emitLine(`last pull.log record: could not be read (${error?.code ?? error?.name ?? "Error"})`);
    }
  }
  return { lines, exitCode: failed ? 1 : 0 };
}
