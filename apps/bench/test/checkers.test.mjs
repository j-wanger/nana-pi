// Every checker type, positive and negative, plus the grader-error boundary. Checkers decide the
// study's success metric, so a checker that passes when it should fail silently invents a result,
// and an oracle outage recorded as a wrong answer silently invents a different one.
// Run: node apps/bench/test/checkers.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CHECKER_TYPES, globMatch, hashTree, liveKeyOf, runCheck, stripComments } from "../lib/checkers.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bench-checkers-"));
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "bench-checkers-fx-"));
fs.writeFileSync(path.join(dir, "hello.txt"), "alpha beta\n");
fs.writeFileSync(path.join(dir, "ok.mjs"), "process.exit(0);\n");
fs.writeFileSync(path.join(dir, "bad.mjs"), "console.error('boom'); process.exit(3);\n");
fs.writeFileSync(path.join(fixture, "src.mjs"), "export const guarded = false;\n");
fs.writeFileSync(path.join(dir, "src.mjs"), "export const guarded = true;\n");
// a test that only passes when src.mjs is the FIXED version
fs.writeFileSync(path.join(dir, "guard.test.mjs"), 'import { guarded } from "./src.mjs";\nprocess.exit(guarded ? 0 : 1);\n');
const at = (finalText, extra = {}) => ({ finalText, dir, fixtureDir: fixture, ...extra });

try {
	// regex
	check("regex: matches", runCheck({ type: "regex", pattern: "blocks\\.mjs\\D{0,6}53\\b" }, at("packages/nana-stage/lib/blocks.mjs:53")).pass);
	check("regex: wrong line number fails", !runCheck({ type: "regex", pattern: "blocks\\.mjs\\D{0,6}53\\b" }, at("blocks.mjs:54")).pass);
	check("regex: 7 inside 17 does not match", !runCheck({ type: "regex", pattern: "^\\s*7\\.?\\s*$" }, at("17")).pass);
	check("regex: a bad pattern is a GRADER error, not a model failure", runCheck({ type: "regex", pattern: "([" }, at("x")).graderError === true);

	// exact — whole is the DEFAULT now
	check("exact: default mode is whole", runCheck({ type: "exact", value: "7" }, at("  7 ")).pass);
	check("exact: default whole REJECTS surrounding prose", !runCheck({ type: "exact", value: "7" }, at("the answer is 7")).pass);
	check("exact: 304 does not match 1304 under whole", !runCheck({ type: "exact", value: "304" }, at("1304")).pass);
	check("exact: a trailing period is tolerated", runCheck({ type: "exact", value: "dereference" }, at("dereference.")).pass);
	check("exact: contains is opt-in", runCheck({ type: "exact", value: "BSD-3-Clause", mode: "contains" }, at("The license is BSD-3-Clause.")).pass);
	check("exact: case-insensitive by default", runCheck({ type: "exact", value: "done" }, at("DONE")).pass);
	check("exact: caseSensitive honoured", !runCheck({ type: "exact", value: "done", caseSensitive: true }, at("DONE")).pass);

	// json-path
	check("json-path: root array, exact set", runCheck({ type: "json-path", path: "$", value: ["a", "b"] }, at('["a","b"]')).pass);
	check("json-path: unordered ignores order", runCheck({ type: "json-path", path: "$", unordered: true, value: ["a", "b"] }, at('["b","a"]')).pass);
	check("json-path: over-listing FAILS", !runCheck({ type: "json-path", path: "$", unordered: true, value: ["a", "b"] }, at('["a","b","c"]')).pass);
	check("json-path: reads through a ``` fence", runCheck({ type: "json-path", path: "$", value: ["a"] }, at('Here:\n```json\n["a"]\n```')).pass);
	check("json-path: non-JSON reply fails (model failure, not grader)", (() => { const r = runCheck({ type: "json-path", path: "$", value: ["a"] }, at("just words")); return !r.pass && !r.graderError; })());

	// command
	check("command: exit 0 passes", runCheck({ type: "command", commands: [["node", "ok.mjs"]] }, at("")).pass);
	check("command: any non-zero fails", !runCheck({ type: "command", commands: [["node", "ok.mjs"], ["node", "bad.mjs"]] }, at("")).pass);
	check("command: failure detail names the command", runCheck({ type: "command", commands: [["node", "bad.mjs"]] }, at("")).detail.includes("bad.mjs"));
	check("command: a missing binary fails, does not throw", !runCheck({ type: "command", commands: [["definitely-not-a-binary-xyz"]] }, at("")).pass);

	// file, including comment-blind matching
	check("file: exists", runCheck({ type: "file", path: "hello.txt", exists: true }, at("")).pass);
	check("file: missing fails", !runCheck({ type: "file", path: "nope.txt", exists: true }, at("")).pass);
	check("file: contains", runCheck({ type: "file", path: "hello.txt", contains: "beta" }, at("")).pass);
	check("file: path escape is a GRADER error", runCheck({ type: "file", path: "../../etc/passwd", exists: true }, at("")).graderError === true);
	fs.writeFileSync(path.join(dir, "commented.mjs"), "// clampText( is only mentioned here\n/* and clampText( here */\nconst x = 1;\n");
	check("file: containsCode ignores a commented-out mention", !runCheck({ type: "file", path: "commented.mjs", containsCode: "clampText(" }, at("")).pass);
	fs.writeFileSync(path.join(dir, "real.mjs"), "// about clampText(\nclampText(1, 2, 3);\n");
	check("file: containsCode accepts a real call", runCheck({ type: "file", path: "real.mjs", containsCode: "clampText(" }, at("")).pass);
	check("stripComments removes // and /* */", stripComments("a // x\n/* y */ b").trim().replace(/\s+/g, " ") === "a b");
	check("stripComments keeps a URL's //", stripComments("const u = 'https://x';").includes("https://x"));

	// changed-paths
	const baseline = hashTree(dir);
	fs.writeFileSync(path.join(dir, "hello.txt"), "alpha beta gamma\n");
	check("changed-paths: an allowed edit passes", runCheck({ type: "changed-paths", allow: ["hello.txt"] }, at("", { baseline })).pass);
	check("changed-paths: an edit outside the allowlist FAILS", !runCheck({ type: "changed-paths", allow: ["other.txt"] }, at("", { baseline })).pass);
	check("changed-paths: names the offending file", runCheck({ type: "changed-paths", allow: [] }, at("", { baseline })).detail.includes("hello.txt"));
	fs.writeFileSync(path.join(dir, "extra.mjs"), "//\n");
	check("changed-paths: a NEW file outside the allowlist fails", !runCheck({ type: "changed-paths", allow: ["hello.txt"] }, at("", { baseline })).pass);
	check("changed-paths: glob allows a whole subtree", runCheck({ type: "changed-paths", allow: ["**"] }, at("", { baseline })).pass);
	check("changed-paths: bench-owned assets are never counted as the model's edits", runCheck({ type: "changed-paths", allow: ["hello.txt"] }, at("", { baseline, benchPaths: ["extra.mjs"] })).pass);
	check("changed-paths: protect catches a modified protected file", !runCheck({ type: "changed-paths", allow: ["**"], protect: ["hello.txt"] }, at("", { baseline })).pass);
	fs.unlinkSync(path.join(dir, "extra.mjs"));
	fs.unlinkSync(path.join(dir, "hello.txt"));
	check("changed-paths: a DELETED file is caught", !runCheck({ type: "changed-paths", allow: ["nothing"] }, at("", { baseline })).pass);
	check("changed-paths: without a baseline it is a grader error, not a pass", runCheck({ type: "changed-paths", allow: ["**"] }, at("")).graderError === true);
	check("globMatch: * stays within a segment", globMatch("a/*.mjs", "a/b.mjs") && !globMatch("a/*.mjs", "a/b/c.mjs"));
	check("globMatch: ** crosses segments", globMatch("a/**", "a/b/c.mjs"));

	// revert-and-fail
	check("revert-and-fail: a real test fails once the fix is reverted", runCheck({ type: "revert-and-fail", restore: ["src.mjs"], commands: [["node", "guard.test.mjs"]] }, at("")).pass);
	fs.writeFileSync(path.join(dir, "vacuous.test.mjs"), "process.exit(0);\n");
	check("revert-and-fail: a vacuous test that always passes is REJECTED", !runCheck({ type: "revert-and-fail", restore: ["src.mjs"], commands: [["node", "vacuous.test.mjs"]] }, at("")).pass);
	check("revert-and-fail: restoring a file the fixture lacks is a grader error", runCheck({ type: "revert-and-fail", restore: ["nope.mjs"], commands: [["node", "vacuous.test.mjs"]] }, at("")).graderError === true);

	// live-key: grader errors vs model failures
	check("live-key: key found", runCheck({ type: "live-key", argv: ["node", "-e", "console.log('KEY-42')"] }, at("KEY-42")).pass);
	check("live-key: whole matching by default rejects a superstring", !runCheck({ type: "live-key", argv: ["node", "-e", "console.log('42')"] }, at("142")).pass);
	check("live-key: a failing oracle is a GRADER error", runCheck({ type: "live-key", argv: ["node", "-e", "process.exit(1)"] }, at("anything")).graderError === true);
	check("live-key: an empty key is a GRADER error (never grades against nothing)", runCheck({ type: "live-key", argv: ["node", "-e", "process.stdout.write('')"] }, at("x")).graderError === true);
	check("live-key: schema mismatch is a GRADER error", runCheck({ type: "live-key", argv: ["node", "-e", "console.log('<html>oops')"], schema: "^[0-9.]+$" }, at("x")).graderError === true);
	check("live-key: a sentinel from `reject` is a GRADER error", runCheck({ type: "live-key", argv: ["node", "-e", "console.log('DRIFT')"], reject: "^DRIFT$" }, at("x")).graderError === true);
	check("live-key: a pinned value that drifted is a GRADER error, not a wrong answer", runCheck({ type: "live-key", expect: "abc", argv: ["node", "-e", "console.log('xyz')"] }, at("abc")).graderError === true);
	check("live-key: a pinned value that agrees grades normally", runCheck({ type: "live-key", expect: "abc", argv: ["node", "-e", "console.log('abc')"] }, at("abc")).pass);
	// the snapshot: one key per comparison block, so two arms are never graded against two fetches
	check("live-key: snapshotKey is used INSTEAD of re-fetching", runCheck({ type: "live-key", argv: ["node", "-e", "process.exit(1)"] }, at("SNAP", { snapshotKey: "SNAP" })).pass);
	check("live-key: snapshotKey still honours the pin", runCheck({ type: "live-key", expect: "abc", argv: ["node", "-e", "process.exit(1)"] }, at("SNAP", { snapshotKey: "SNAP" })).graderError === true);

	// composite
	check("all: every child must pass", runCheck({ type: "all", checks: [{ type: "exact", value: "a" }, { type: "file", path: "ok.mjs", exists: true }] }, at("a")).pass);
	check("all: one failing child fails the whole", !runCheck({ type: "all", checks: [{ type: "exact", value: "a" }, { type: "file", path: "nope", exists: true }] }, at("a")).pass);
	check("all: a grader error in any child propagates as a grader error", runCheck({ type: "all", checks: [{ type: "exact", value: "a" }, { type: "regex", pattern: "([" }] }, at("a")).graderError === true);

	check("unknown checker type is a grader error", runCheck({ type: "vibes" }, at("x")).graderError === true);
	check("no LLM-judge checker exists", !CHECKER_TYPES.some((t) => /judge|llm|model|rubric/i.test(t)), CHECKER_TYPES.join(","));
	check("liveKeyOf finds the single live key inside an `all`", liveKeyOf({ type: "all", checks: [{ type: "file" }, { type: "live-key", argv: [] }] })?.type === "live-key");
	check("liveKeyOf returns null when there is none", liveKeyOf({ type: "all", checks: [{ type: "file" }] }) === null);
} finally {
	fs.rmSync(dir, { recursive: true, force: true });
	fs.rmSync(fixture, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
