#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/brief-check.mjs
 * @purpose Check a lane brief's precedent and known-bug context without starting a builder.
 * @inputs argv (--brief <file> --tree <worktree>), the brief, and the worktree HEAD.
 * @outputs The same precedent refusal or launch line pi-worker emits for that brief and worktree.
 * @effects disk (reads paths), process (runs git and writes stderr)
 * @errors Exit 1 on invalid arguments, unreadable paths, or a refused brief; otherwise exit 0.
 */
import { realpathSync } from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { checkBriefForLaunch } from "../lib/brief-precedent.mjs";

const USAGE = "usage: brief-check.mjs --brief <file> --tree <worktree>\n";
const args = process.argv.slice(2);
const values = new Map();
let invalid = args.length !== 4;
for (let index = 0; index < args.length; index += 2) {
	const flag = args[index];
	const value = args[index + 1];
	if ((flag !== "--brief" && flag !== "--tree") || !value || value.startsWith("-") || values.has(flag)) invalid = true;
	else values.set(flag, value);
}
if (invalid || !values.has("--brief") || !values.has("--tree")) {
	process.stderr.write(USAGE);
	process.exit(1);
}

let worktreeRoot;
try { worktreeRoot = realpathSync(path.resolve(values.get("--tree"))); }
catch {
	process.stderr.write("brief-check: worktree does not exist or is unreadable\n");
	process.exit(1);
}
const briefPath = path.resolve(worktreeRoot, values.get("--brief"));
const result = checkBriefForLaunch({
	briefPath,
	worktreeRoot,
	gitRunner: (gitArgs, options = {}) => execFileSync("git", gitArgs, {
		cwd: worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options,
	}),
});
process.stderr.write(`${result.line}\n`);
process.exit(result.ok ? 0 : 1);
