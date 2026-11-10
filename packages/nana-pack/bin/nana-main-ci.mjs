#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-main-ci.mjs
 * @purpose Run the seat's main push CI report and optional scanned issue post.
 * @inputs argv (--cwd <repository>, --post, --wait, --sha <sha>), environment and local gh credentials.
 * @outputs Per-leg CI report and a process exit code.
 * @effects disk, process and network (through mainCi).
 * @errors Invalid arguments exit 2; unavailable CI or refused posting exits 1.
 */
import { mainCi } from "../lib/main-ci.mjs";
import { waitForMainCi } from "../lib/ci-wait.mjs";
import { ghFromEnvironment } from "../lib/gh-runner.mjs";

const options = {};
try {
	const args = process.argv.slice(2);
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--cwd" && args[i + 1] && options.cwd === undefined) options.cwd = args[++i];
		else if (args[i] === "--post" && options.post === undefined) options.post = true;
		else if (args[i] === "--wait" && options.wait === undefined) options.wait = true;
		else if (args[i] === "--sha" && args[i + 1] && options.sha === undefined) options.sha = args[++i];
		else throw new Error("usage: nana-main-ci [--cwd <repository>] [--post] [--wait [--sha <sha>]]");
	}
	if (options.sha && (!options.wait || !/^[a-f0-9]{40,64}$/i.test(options.sha))) throw new Error("--sha needs --wait and a full commit SHA");
	process.exitCode = options.wait
		? (await waitForMainCi({ ...options, runGh: ghFromEnvironment(process.env), writeLine: console.log })).code
		: mainCi(options).code;
} catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
