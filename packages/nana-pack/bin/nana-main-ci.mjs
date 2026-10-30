#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-main-ci.mjs
 * @purpose Run the seat's main push CI report and optional scanned issue post.
 * @inputs argv (--cwd <repository>, --post), environment and local gh credentials.
 * @outputs Per-leg CI report and a process exit code.
 * @effects disk, process and network (through mainCi).
 * @errors Invalid arguments exit 2; unavailable CI or refused posting exits 1.
 */
import { mainCi } from "../lib/main-ci.mjs";

const options = {};
try {
	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--cwd" && args[i + 1] && options.cwd === undefined) options.cwd = args[++i];
		else if (args[i] === "--post" && options.post === undefined) options.post = true;
		else throw new Error("usage: nana-main-ci --cwd <repository> [--post]");
	}
	process.exitCode = mainCi(options).code;
} catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
