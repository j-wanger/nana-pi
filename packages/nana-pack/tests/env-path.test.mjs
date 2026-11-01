/**
 * @module packages/nana-pack/tests/env-path.test.mjs
 * @purpose Pins withPathPrepended and that the three pi lookup tests build their PATH through it.
 * @inputs env-path.mjs and the source text of pi-launch-limits, pi-registration and win32-launch tests.
 * @outputs PASS/FAIL checks and process exit status.
 * @effects disk (reads three test files)
 * @errors Failed checks increment the exit status.
 */
import * as fs from "node:fs";
import { withPathPrepended } from "./env-path.mjs";

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pathKeys = (env) => Object.keys(env).filter((key) => key.toUpperCase() === "PATH");

// The text of every object literal that starts from a `...process.env` spread and names a `PATH:` key.
// Brace depth ends the literal, so a template's `${}` inside it does not.
function pathSpreads(text) {
	const found = [];
	for (let at = text.indexOf("...process.env"); at !== -1; at = text.indexOf("...process.env", at + 1)) {
		let depth = 0, end = at;
		for (; end < text.length && depth >= 0; end++) depth += text[end] === "{" ? 1 : text[end] === "}" ? -1 : 0;
		if (/\bPATH\s*:/.test(text.slice(at, end))) found.push(text.slice(at, end));
	}
	return found;
}

const input = { Path: "A", other: "x" };
const before = JSON.stringify(input);
const win = withPathPrepended(input, "B", "win32");
// req: R-3452
check("withPathPrepended on win32 leaves one PATH key, B;A, keeps the rest and leaves the input unchanged",
	same(pathKeys(win), ["PATH"]) && win.PATH === "B;A" && win.other === "x" && JSON.stringify(input) === before, JSON.stringify(win));
const twice = withPathPrepended({ Path: "stale", PATH: "fresh", pAtH: "odd" }, "B", "win32");
// req: R-3452
check("withPathPrepended on win32 removes every letter-case spelling and keeps the first spelling's value, as Node does for a spawn",
	same(pathKeys(twice), ["PATH"]) && twice.PATH === "B;fresh", JSON.stringify(twice));
const linux = withPathPrepended({ Path: "keep", PATH: "A" }, "B", "linux");
// req: R-3452
check("withPathPrepended on linux replaces only PATH and keeps a distinct Path key untouched", linux.Path === "keep" && linux.PATH === "B:A" && same(pathKeys(linux).sort(), ["PATH", "Path"]), JSON.stringify(linux));

const files = ["../../nana-setup/tests/pi-launch-limits.test.mjs", "../../nana-setup/tests/pi-registration.test.mjs", "win32-launch.test.mjs"];
const spread = "const env = { ...process.env,\r\n\tHOME: `${home}`, PATH: `${bin}:${process.env.PATH}` };  \t";
const clean = "const env = withPathPrepended(process.env, bin);\r\nconst other = { ...process.env, HOME: home }";
const found = files.flatMap((file) => pathSpreads(fs.readFileSync(new URL(file, import.meta.url), "utf8")).map((text) => `${file}: ${text}`));
// req: R-3452
check("no lookup test spreads process.env with a PATH key, and the scan sees one across CRLF, trailing space and no final newline",
	pathSpreads(spread).length === 1 && pathSpreads(clean).length === 0 && found.length === 0, found.join("\n"));

process.exit(fails ? 1 : 0);
