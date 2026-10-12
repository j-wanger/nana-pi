#!/usr/bin/env node
/**
 * @module packages/nana-setup/bin/install-check.mjs
 * @purpose Runs the isolated install-and-hooks rehearsal and prints its pinned item report.
 * @inputs Checkout, platform, clock and operating-system process launcher.
 * @outputs Resolved executable paths and one verdict line per measured item.
 * @effects disk, process, network
 * @errors Exits nonzero when any reported item is FAIL.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { buildEnvironment, classifyResult, formatResultLine, hookFailureReason, mapHookEntries, parsePiList, hookInvocation } from "../lib/install-check.mjs";
import { DOCTOR_NOTES, HOOKS, KNOWN_RED, SAMPLE_INPUTS, SPAWN_TIMEOUT_MS } from "../lib/install-check-config.mjs";
import { PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { findPi, winCommand } from "../../nana-pack/lib/win-command.mjs";
import { projectKey } from "../lib/project-key.mjs";

const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const platformName = process.platform;
const home = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "nana-install-check-")));
const tmp = path.join(home, "tmp");
fs.mkdirSync(tmp); fs.mkdirSync(path.join(home, ".npm"));
const project = path.join(home, "project");
const notes = path.join(home, "notes");
fs.mkdirSync(project, { recursive: true }); fs.mkdirSync(path.join(notes, "docs"), { recursive: true });
const token = `installcheck_${Date.now().toString(36)}`;
const env = buildEnvironment(process.env, home, platformName);
const outcomes = new Map();
let failed = false;
const resolveOnPath = (name) => {
  for (const dir of String(env.PATH ?? "").split(path.delimiter)) {
    const candidate = path.join(dir, name);
    try { if (fs.statSync(candidate).isFile() && fs.accessSync(candidate, fs.constants.X_OK) === undefined) return fs.realpathSync(candidate); } catch {}
  }
  return name;
};
const emit = (label, code, passed, detail = "") => {
  const knownRed = (KNOWN_RED[platformName] ?? []).find((entry) => entry.item === label);
  const result = classifyResult(label, code, passed, KNOWN_RED[platformName] ?? [], new Date());
  const reason = detail || (code === "missing-entry" ? `required entry or marker missing for ${label}` : `observed ${code ?? "failure"} while checking ${label}`);
  const line = formatResultLine(label, result, reason, knownRed);
  console.log(line);
  outcomes.set(label, result.status);
  if (result.status === "FAIL") failed = true;
};
const spawnOne = (command, args, options = {}) => {
  const started = performance.now();
  const result = spawnSync(command, args, { ...options, encoding: "utf8", timeout: options.timeout ?? SPAWN_TIMEOUT_MS.pi, cwd: options.cwd ?? root, input: options.input, env: options.env ?? env, windowsHide: true });
  result.durationMs = Math.round(performance.now() - started);
  return result;
};
const processReason = (result) => result.error?.code === "ETIMEDOUT"
  ? `timed out after ${result.durationMs} ms`
  : `exit status ${result.status ?? "unknown"}${result.signal ? ` (signal ${result.signal})` : ""}${result.stderr?.trim() ? `; last stderr: ${result.stderr.trim().split(/\r?\n/).at(-1)}` : ""}`;
const ok = (r) => !r.error && r.status === 0;
const git = (folder) => { fs.mkdirSync(path.join(folder, ".git"), { recursive: true }); return spawnOne("git", ["init", "--quiet", folder], { cwd: folder, timeout: SPAWN_TIMEOUT_MS.git }); };
let pi = "pi";
if (platformName === "win32") {
  const found = findPi({ env, cwd: root });
  if (found) pi = found;
}
const nodePath = process.execPath;
let bash = null;
if (platformName === "win32") {
  for (const dir of String(env.PATH ?? "").split(path.delimiter)) {
    const gitExe = path.join(dir, "git.exe");
    if (fs.existsSync(gitExe)) {
      const candidates = [path.resolve(dir, "..", "bin", "bash.exe"), path.resolve(dir, "..", "..", "bin", "bash.exe")];
      bash = candidates.find((candidate) => fs.existsSync(candidate)) ?? bash;
    }
  }
  if (bash) console.log(`Git Bash: ${bash}`);
}
pi = platformName === "win32" ? pi : resolveOnPath("pi");
console.log(`pi: ${path.resolve(pi)}`);
console.log(`node: ${nodePath}`);

try {
  let r1 = git(notes); let r2 = git(project);
  fs.writeFileSync(path.join(notes, "docs", "install-check.md"), `# ${token}\nfixture evidence\n`);
  fs.writeFileSync(path.join(home, ".claude-placeholder"), "");
  let installEnv = { ...env, HOME: home, USERPROFILE: home };
  const install = spawnOne(process.execPath, [path.join(root, "packages/nana-setup/bin/nana-setup.mjs"), "install"], { cwd: root, env: installEnv, timeout: SPAWN_TIMEOUT_MS.install });
  emit("install", install.error?.code === "ETIMEDOUT" ? "timeout" : "exit", ok(install), processReason(install));
  if (ok(install)) {
    const objective = path.join(home, ".pi", "agent", "nana-objective.md");
    fs.writeFileSync(objective, `**Objective (since 2026-10-12):** ${token}.\n\n**Current priority (since 2026-10-12):** install-check ${token}.\n`);
    const memory = path.join(home, ".claude", "nana-memory", "shared", "MEMORY.md");
    fs.appendFileSync(memory, `\n- [${token}] install-check fixture memory.\n`);
    env.PATH = `${path.join(home, ".local", "bin")}${path.delimiter}${env.PATH ?? ""}`;
  }

  const piRun = (args, timeout = SPAWN_TIMEOUT_MS.pi, extra = {}) => {
    if (platformName !== "win32") return spawnOne(pi, args, { cwd: project, timeout, env: { ...env, ...extra } });
    const invocation = winCommand(pi, args, { comspec: env.ComSpec });
    if (invocation.refused) return { status: 1, stderr: invocation.refused };
    return spawnOne(invocation.command, invocation.args, { ...invocation.options, cwd: project, timeout, env: { ...env, ...extra } });
  };
  const sub = piRun(["install", `npm:pi-subagents@${PI_SUBAGENTS_FLOOR}`], SPAWN_TIMEOUT_MS.pi);
  emit("pi-subagents", sub.error?.code === "ETIMEDOUT" ? "timeout" : "exit", ok(sub), processReason(sub));
  const listed = piRun(["list"], SPAWN_TIMEOUT_MS.list);
  const parsed = parsePiList(listed.stdout ?? "", root, platformName);
  emit("pi list nana-pack", "missing-entry", ok(listed) && parsed.pack);
  emit("pi list nana-knowledge", "missing-entry", ok(listed) && parsed.knowledge);

  const sessionArgs = ["--mode", "rpc", "--no-session"];
  const sessionLaunch = platformName === "win32" ? winCommand(pi, sessionArgs, { comspec: env.ComSpec }) : { command: pi, args: sessionArgs, options: {} };
  const session = sessionLaunch.refused ? { status: 1, stderr: sessionLaunch.refused } : spawnOne(sessionLaunch.command, sessionLaunch.args, { ...sessionLaunch.options, cwd: project, timeout: SPAWN_TIMEOUT_MS.session, env: { ...env, NANA_TEST_TEMP_ROOTS: "" }, input: '{"type":"get_commands"}\n' });
  const sessionOutput = `${session.stdout ?? ""}${session.stderr ?? ""}`;
  let journal = "";
  try { journal = fs.readFileSync(path.join(home, ".pi", "agent", "nana-journal.jsonl"), "utf8"); } catch {}
  const piSessionOk = ok(session) && sessionOutput.includes("reload-runtime") && journal.includes('"event":"directory_unadopted"') && journal.includes(project);
  const sessionReason = session.error?.code === "ETIMEDOUT" ? processReason(session)
    : !ok(session) ? processReason(session)
      : !sessionOutput.includes("reload-runtime") ? "reload-runtime not in get_commands output"
        : !journal.includes('"event":"directory_unadopted"') || !journal.includes(project) ? `journal has no directory_unadopted for ${project}`
          : "required pi session condition was not observed";
  emit("pi session", session.error?.code === "ETIMEDOUT" ? "timeout" : "no-output", piSessionOk, sessionReason);

  const settingsPath = path.join(home, ".claude", "settings.json");
  let settings;
  try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); } catch { settings = {}; }
  const groups = [];
  for (const [event, rows] of Object.entries(settings.hooks ?? {})) for (const group of rows) groups.push({ event, group });
  const mapped = mapHookEntries(groups, platformName);
  const hookSetOk = mapped.failures.length === 0;
  const firstHookFailure = mapped.failures[0];
  emit("hook set", firstHookFailure?.code ?? "missing-entry", hookSetOk, firstHookFailure ? `${firstHookFailure.item}: ${firstHookFailure.code}` : "all sealed hook entries were observed");

  const sessionDir = path.join(home, ".claude", "projects", projectKey(project));
  fs.mkdirSync(sessionDir, { recursive: true });
  const transcript = path.join(sessionDir, `${token}.jsonl`);
  fs.writeFileSync(transcript, "");
  const sample = { ...SAMPLE_INPUTS.session, source: "startup", transcript_path: transcript, cwd: project };
  const expectedHooks = HOOKS.filter((hook) => !hook.platforms || hook.platforms.includes(platformName));
  for (const expected of expectedHooks) {
    const mappedEntry = mapped.entries.find((candidate) => candidate.expected.label === expected.label);
    const structuralFailure = mapped.failures.find((failure) => failure.item === expected.label);
    if (!mappedEntry) {
      emit(expected.label, structuralFailure?.code ?? "missing-entry", false);
      continue;
    }
    const { entry } = mappedEntry;
    let stdin = "";
    if (expected.event === "SessionStart") stdin = JSON.stringify(sample);
    else if (expected.event === "UserPromptSubmit") stdin = JSON.stringify({ prompt: `${SAMPLE_INPUTS.prompt} ${token}`, cwd: project });
    else stdin = JSON.stringify(expected.tool === "PowerShell" ? { hook_event_name: "PreToolUse", tool_name: "PowerShell", tool_input: { command: SAMPLE_INPUTS.verifier.powershellHit } } : { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: SAMPLE_INPUTS.verifier.bashHit } });
    const inv = hookInvocation(entry, platformName, bash);
    const result = spawnOne(inv.command, inv.args, { cwd: project, timeout: expected.timeout * 1000, input: stdin, env: { ...env, CLAUDE_PROJECT_DIR: project, NANA_TEST_TEMP_ROOTS: "" } });
    let outputOk = !structuralFailure && ok(result) && (result.stdout ?? "").length <= SAMPLE_INPUTS.maxOutput;
    if (expected.shortLabel === "objective") outputOk = outputOk && result.stdout.startsWith("[nana:objective]") && result.stdout.includes(token) && !result.stdout.includes("OBJECTIVE UNAVAILABLE");
    if (expected.shortLabel === "adoption") outputOk = outputOk && result.stdout.includes(project) && !result.stdout.includes("ADOPTION UNAVAILABLE");
    if (expected.shortLabel === "shared memory") {
      const link = path.join(sessionDir, "memory", "shared");
      let target = null; try { target = fs.realpathSync(link); } catch {}
      outputOk = outputOk && result.stdout.includes("[nana:shared-memory]") && result.stdout.includes(`- [${token}]`) && target === fs.realpathSync(path.join(home, ".claude", "nana-memory", "shared"));
    }
    if (expected.shortLabel === "knowledge pull") outputOk = outputOk && result.stdout.includes("[nana:knowledge]") && result.stdout.includes("install-check.md");
    let missOutput = "not-run";
    if (expected.shortLabel === "verifier pipe") {
      const missInput = expected.tool === "PowerShell" ? { hook_event_name: "PreToolUse", tool_name: "PowerShell", tool_input: { command: "git status" } } : { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: SAMPLE_INPUTS.verifier.bashMiss } };
      const miss = spawnOne(inv.command, inv.args, { cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(missInput), env: { ...env, CLAUDE_PROJECT_DIR: project } });
      missOutput = miss.stdout ?? "";
      const outputLines = (result.stdout ?? "").trim().split(/\r?\n/).filter(Boolean);
      let validHit = false;
      if (outputLines.length === 1) {
        try {
          const parsed = JSON.parse(outputLines[0]).hookSpecificOutput;
          validHit = parsed?.hookEventName === "PreToolUse" && parsed?.permissionDecision === "ask";
        } catch {}
      }
      outputOk = outputOk && validHit && ok(miss) && (miss.stdout ?? "") === "";
    }
    let failureDetail = "";
    if (!outputOk) {
      if (result.error?.code === "ETIMEDOUT") failureDetail = processReason(result);
      else if (!ok(result)) failureDetail = processReason(result);
      else if (expected.shortLabel === "objective" && !result.stdout.startsWith("[nana:objective]")) failureDetail = "no [nana:objective] line";
      else if (expected.shortLabel === "knowledge pull" && !result.stdout.includes("[nana:knowledge]")) failureDetail = "no [nana:knowledge] block";
      else if (structuralFailure) failureDetail = hookFailureReason(entry, expected, structuralFailure.code, platformName);
      else if (expected.shortLabel === "verifier pipe") failureDetail = `hit=${JSON.stringify(result.stdout)} miss=${JSON.stringify(missOutput)}`;
      else failureDetail = "required hook output or fixture condition was not observed";
    }
    const failureCode = result.error?.code === "ETIMEDOUT" ? "timeout" : outputOk ? null : (structuralFailure?.code ?? (!result.stdout ? "no-output" : "unexpected"));
    emit(expected.label, failureCode, outputOk, failureDetail);
  }
  const doctor = spawnOne(process.execPath, [path.join(root, "packages/nana-setup/bin/nana-setup.mjs"), "doctor"], { cwd: project, timeout: SPAWN_TIMEOUT_MS.doctor });
  const notesAllowed = DOCTOR_NOTES[platformName] ?? [];
  const unexpectedNote = (doctor.stdout ?? "").split(/\r?\n/).find((line) => line.includes("·") && !notesAllowed.some((n) => line.includes(n)));
  const doctorDetail = unexpectedNote ? unexpectedNote.replace(/\s+/g, " ").trim() : !ok(doctor) ? processReason(doctor) : "doctor completed without an unexpected note row";
  emit("doctor", unexpectedNote ? "note-row" : doctor.error?.code === "ETIMEDOUT" ? "timeout" : "exit", ok(doctor) && !unexpectedNote, doctorDetail);
  if (!failed) fs.rmSync(home, { recursive: true, force: true });
  else console.error(`install-check home retained: ${home}`);
} catch (error) {
  emit("install", "unexpected", false, error.message);
}
process.exitCode = failed ? 1 : 0;
