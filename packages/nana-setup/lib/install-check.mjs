/**
 * @module packages/nana-setup/lib/install-check.mjs
 * @purpose Implements pure install-check contracts and the isolated subprocess runner.
 * @inputs Sealed configuration, process environment, platform, clock and spawn function.
 * @outputs Child results, item judgments and environment construction.
 * @effects process
 * @errors Child failures become item results; invalid hook shapes are reported as failures.
 */
import path from "node:path";
import { ALLOWED_HOOK_KEYS, HOOKS, OVERRIDE_ENV } from "./install-check-config.mjs";

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

export function classifyResult(item, code, passed, knownRed, now = new Date()) {
  const match = (knownRed ?? []).find((x) => x.item === item);
  if (passed) return { status: match ? "FAIL" : "PASS", code: match ? "unexpected-pass" : null };
  const date = now.toISOString().slice(0, 10);
  if (match && match.code === code && date < match.expires) return { status: "XFAIL", code };
  return { status: "FAIL", code: code ?? "unexpected" };
}

export function parsePiList(output, checkout, platformName = process.platform) {
  const norm = (v) => {
    let s = path.resolve(String(v).trim());
    if (platformName === "win32") s = s.toLowerCase();
    return s;
  };
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
