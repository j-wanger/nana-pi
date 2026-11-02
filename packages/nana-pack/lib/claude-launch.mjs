/**
 * @module packages/nana-pack/lib/claude-launch.mjs
 * @purpose Resolve native Windows Claude executables or supported npm shims without a shell.
 * @inputs Child argv, Windows PATH environment and injected filesystem probes.
 * @outputs {command, args} for a direct launch, or a named {refused} result.
 * @effects disk (PATH and npm package metadata probes).
 * @errors Lookup and package-shape failures return named refusals.
 */
import * as path from "node:path";
import { readFileSync, statSync } from "node:fs";
import { defaultExists, findOnPath } from "./win-command.mjs";
import { NPM_DIRS } from "../bin/worker-config.mjs";
import { CLAUDE_BIN_EXTENSION_REFUSAL, CLAUDE_BIN_NAME, CLAUDE_NPM_REFUSAL, CLAUDE_PACKAGE } from "./claude-launch-config.mjs";

const defaultIsFile = (file) => { try { return statSync(file).isFile(); } catch { return false; } };
const defaultReadText = (file) => readFileSync(file, "utf8");

/** Find native binaries globally before considering any npm cmd shim, then resolve its package bin. */
export function claudeCommand(args, { platform = process.platform, env = process.env, cwd = process.cwd(), exists = defaultExists, isFile = defaultIsFile, readText = defaultReadText } = {}) {
 if (platform !== "win32") return { command: "claude", args };
 const native = findOnPath(CLAUDE_BIN_NAME, { env, cwd, exists, allowedExtensions: [".com", ".exe"] });
 if (native) return { command: native, args };
 const shim = findOnPath(CLAUDE_BIN_NAME, { env, cwd, exists, allowedExtensions: [".cmd", ".bat"] });
 if (!shim) return { refused: "Claude is not on PATH" };
 const win = path.win32;
 const shimDir = win.dirname(shim);
 const parts = shimDir.split(/[\\/]/).filter(Boolean).slice(-2).map((part) => part.toLowerCase());
 const local = parts.length === 2 && parts[0] === NPM_DIRS[0] && parts[1] === NPM_DIRS[1];
 const packageRoot = local ? win.dirname(shimDir) : win.join(shimDir, NPM_DIRS[0]);
 const packageDir = win.join(packageRoot, ...CLAUDE_PACKAGE.split("/"));
 const packageJsonPath = win.join(packageDir, "package.json");
 let source;
 try { source = readText(packageJsonPath); } catch { return { refused: `Claude shim has no npm package at ${packageDir}; ${CLAUDE_NPM_REFUSAL}` }; }
 let manifest;
 try { manifest = JSON.parse(source); } catch { return { refused: `${packageJsonPath} is not valid JSON` }; }
 if (!manifest || typeof manifest !== "object" || manifest.name !== CLAUDE_PACKAGE) return { refused: `${packageJsonPath} is not the ${CLAUDE_PACKAGE} package` };
 const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin && typeof manifest.bin === "object" ? manifest.bin[CLAUDE_BIN_NAME] : undefined;
 if (typeof bin !== "string" || !bin) return { refused: `${CLAUDE_PACKAGE} at ${packageDir} declares no ${CLAUDE_BIN_NAME} bin` };
 const entry = win.resolve(packageDir, bin);
 const relative = win.relative(packageDir, entry);
 if (relative.startsWith("..") || win.isAbsolute(relative)) return { refused: `Claude bin ${bin} resolves outside ${packageDir}` };
 if (win.extname(entry).toLowerCase() !== ".exe") return { refused: CLAUDE_BIN_EXTENSION_REFUSAL };
 if (!isFile(entry)) return { refused: `Claude entry ${entry} is not a file` };
 return { command: entry, args };
}
