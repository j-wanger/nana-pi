/**
 * @module packages/nana-pack/lib/win-command.mjs
 * @purpose Resolve and safely launch supported Windows commands, and conservatively identify absent cmd.exe commands.
 * @inputs command names, argument arrays, injected environment/cwd/existence and optional ComSpec.
 * @outputs absolute lookup paths, spawnSync argument records/refusals, or a missing-command predicate.
 * @effects disk
 * @errors refusals are returned as values; lookup errors mean absent.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { DEFAULT_PATHEXT, INTERNAL_COMMANDS, PI_EXTENSIONS } from "./win-command-config.mjs";

function envValue(env, key) {
  const found = Object.keys(env ?? {}).find((item) => item.toLowerCase() === key.toLowerCase());
  return found === undefined ? undefined : env[found];
}
function defaultExists(file) {
  try { return !fs.lstatSync(file).isDirectory(); } catch { return false; }
}
function extensions(env) {
  return String(envValue(env, "PATHEXT") ?? DEFAULT_PATHEXT).split(";").map((e) => e.trim()).filter((e) => PI_EXTENSIONS.includes(e.toLowerCase()));
}
function winAbsolute(file, cwd) {
  return path.win32.resolve(cwd || process.cwd(), file);
}

export function findOnPath(name, { env = process.env, cwd = process.cwd(), searchCwd = false, exists = defaultExists } = {}) {
  const pathValue = envValue(env, "PATH") ?? "";
  const dirs = String(pathValue).split(";").map((dir) => dir.trim().replace(/^"|"$/g, "")).filter(Boolean);
  if (searchCwd && cwd) dirs.unshift(cwd);
  const pats = extensions(env);
  const nameExt = path.win32.extname(name);
  const candidates = nameExt && pats.some((e) => e.toLowerCase() === nameExt.toLowerCase())
    ? [name]
    : [...pats.map((ext) => `${name}${ext.toLowerCase()}`), ...(nameExt ? [name] : [])];
  for (const dir of dirs) for (const candidate of candidates) {
    const full = winAbsolute(path.win32.join(dir, candidate), cwd);
    if (exists(full)) return full;
  }
  return null;
}

const refusedChars = [["\"", "double quote"], ["%", "%"], ["!", "!"], ["\r", "carriage return"], ["\n", "line feed"], ["\0", "NUL"]];
export function winCommand(file, args, { comspec } = {}) {
  const ext = path.win32.extname(file).toLowerCase();
  if (ext === ".exe" || ext === ".com") return { command: file, args, options: {} };
  if (ext !== ".cmd" && ext !== ".bat") return { refused: `unsupported extension ${ext || "(none)"}` };
  for (const value of [file, ...args]) for (const [char, label] of refusedChars) {
    if (value.includes(char)) return { refused: `refused character ${JSON.stringify(char)} (${label})` };
  }
  for (const value of args) if (value.endsWith("\\")) return { refused: 'refused trailing backslash "\\\\"' };
  const line = [file, ...args].map((arg) => `"${arg}"`).join(" ");
  return { command: comspec ?? "cmd.exe", args: ["/d", "/v:off", "/s", "/c", `"${line}"`], options: { windowsVerbatimArguments: true } };
}

function internal(word) {
  const folded = word.toLowerCase();
  return INTERNAL_COMMANDS.some((name) => folded === name || ["/", "\\", ".", ":"].some((sep) => folded.startsWith(name + sep)));
}
export function cmdCouldNotRun(command, { env = process.env, cwd = process.cwd(), exists = defaultExists } = {}) {
  const word = String(command).replace(/^[ \t]*/, "").split(/[ \t]/, 1)[0];
  if (!word || !/^[A-Za-z0-9_.\\/:\-]+$/.test(word) || internal(word)) return false;
  const hasSeparator = /[\\/:]/.test(word);
  const candidates = [word, ...extensions(env).map((ext) => `${word}${ext}`)];
  if (hasSeparator) {
    return !candidates.some((candidate) => exists(winAbsolute(candidate, cwd)));
  }
  if (candidates.some((candidate) => exists(winAbsolute(candidate, cwd)))) return false;
  return findOnPath(word, { env, cwd, exists }) === null;
}
