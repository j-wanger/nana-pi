// Argv rendering + profile validation. The argv IS the experiment: if a flag is wrong the
// study measures something other than what it registered, so every flag is pinned here.
// Run: node apps/bench/test/argv.test.mjs   (exit 0 = all PASS)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ISOLATION_FLAGS, renderRun, validateProfile } from "../lib/profiles.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const study = JSON.parse(fs.readFileSync(path.join(here, "../studies/tool-profiles-2026-09-08/study.json"), "utf8"));
const P = (n) => study.profiles.find((p) => p.name === n);
const studyDir = path.join(here, "../studies/tool-profiles-2026-09-08");
const ctx = { prompt: "find X", sessionDir: "/tmp/s", studyDir };

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const throws = (fn) => {
	try {
		fn();
		return null;
	} catch (e) {
		return e.message;
	}
};

// 1. profile A renders the documented default tool set, nothing more
const a = renderRun(P("pi-defaults"), study, ctx);
check("A: exact argv", JSON.stringify(a.argv) === JSON.stringify([
	"--mode", "json",
	"--provider", "openai-codex", "--model", "gpt-5.6-sol",
	"--thinking", "medium",
	"--tools", "read,bash,edit,write",
	...ISOLATION_FLAGS,
	"--", "find X",
]), a.argv.join(" "));
check("A: not blocked", a.blocked === null);
check("A: session dir redirected off ~/.pi/agent", a.env.PI_CODING_AGENT_SESSION_DIR === "/tmp/s");
check("A: no PI_CODING_AGENT_DIR unless the runner supplies one", a.env.PI_CODING_AGENT_DIR === undefined);
check("A: study env is applied", a.env.PI_OFFLINE === "1");
const withDir = renderRun(P("pi-defaults"), study, { ...ctx, agentDir: "/tmp/bench-agent" });
check("A: PI_CODING_AGENT_DIR is set when the runner prepares one (env-vars.md:81)", withDir.env.PI_CODING_AGENT_DIR === "/tmp/bench-agent");
check("A: loads NO extension, so the sidecar does not ride along", !a.argv.includes("-e"));

// 2. B adds exactly grep/find/ls and no prompt text
const b = renderRun(P("lean-code"), study, ctx);
check("B: tools allowlist", b.argv[b.argv.indexOf("--tools") + 1] === "read,grep,find,ls,edit,write,bash");
check("B: no --append-system-prompt", !b.argv.includes("--append-system-prompt"));

// 3. B' is B plus one appended line — the ONLY difference
const bh = renderRun(P("lean-code-hinted"), study, ctx);
const strip = (v) => {
	const i = v.indexOf("--append-system-prompt");
	return i < 0 ? v : [...v.slice(0, i), ...v.slice(i + 2)];
};
check("B': differs from B only by the appended prompt", JSON.stringify(strip(bh.argv)) === JSON.stringify(b.argv));
check("B': carries the brief's exact line", bh.argv[bh.argv.indexOf("--append-system-prompt") + 1] === "Prefer grep/find/ls over bash rg/find/ls; use bash for tests, git, builds");

// 4. C loads the extension AFTER --no-extensions (usage.md:233-236) and allowlists its tools
const c = renderRun(P("research"), study, ctx);
check("C: -e comes after --no-extensions", c.argv.indexOf("--no-extensions") < c.argv.indexOf("-e"));
check("C: extension tools are in the allowlist", ["web_search", "source_check", "fetch_content", "get_search_content"].every((t) => c.argv[c.argv.indexOf("--tools") + 1].split(",").includes(t)));
check("C: requiresEnv is empty, so no key is demanded", (P("research").requiresEnv ?? []).length === 0);
check("C: not blocked — the pinned extension and the sidecar are both on disk", c.blocked === null, c.blocked ?? "");
// The bench sidecar rides along ONLY where an extension can make nested LLM calls. It registers
// no tools and adds no prompt text, so it cannot shift the comparison.
const eArgs = c.argv.filter((a2, i) => c.argv[i - 1] === "-e");
check("C: exactly two -e entries (pi-web-access + the bench sidecar)", eArgs.length === 2, eArgs.join(" "));
check("C: the sidecar is the LAST extension loaded", /bench-nested-usage\.ts$/.test(eArgs[1]), eArgs[1]);
check("C: the sidecar contributes no tool names to the allowlist", c.argv[c.argv.indexOf("--tools") + 1].split(",").length === P("research").tools.length);
check("C: runs BOTH families (astra BLOCK A)", JSON.stringify(P("research").families) === JSON.stringify(["code", "research"]));
check("B: no sidecar, because B loads no extension", !b.argv.includes("-e"));

// 5. a missing / placeholder extension path blocks the run instead of silently degrading
const placeholder = { ...P("research"), extensions: [{ path: "<PI_WEB_ACCESS_ENTRY>", tools: P("research").extensions[0].tools }] };
check("placeholder entry → needs-entry", /^needs-entry/.test(renderRun(placeholder, study, ctx).blocked ?? ""));
const missing = { ...P("research"), extensions: [{ path: "/nope/does-not-exist.ts", tools: P("research").extensions[0].tools }] };
check("missing entry path → needs-entry", /^needs-entry/.test(renderRun(missing, study, ctx).blocked ?? ""));
const keyed = { ...P("lean-code"), requiresEnv: ["PI_BENCH_NO_SUCH_KEY_12345"] };
check("declared-but-unset env → needs-key", /^needs-key/.test(renderRun(keyed, study, ctx).blocked ?? ""));

// 6. validation catches the traps that would silently ruin a study
check("rejects an extension tool missing from --tools", (throws(() => validateProfile({ name: "x", tools: ["read"], extensions: [{ path: "/tmp/x.ts", tools: ["web_search"] }] })) ?? "").includes("missing from the --tools allowlist"));
check("rejects an unknown tool name", (throws(() => validateProfile({ name: "x", tools: ["reed"] })) ?? "").includes("neither a built-in"));
check("rejects a bad thinking level", (throws(() => validateProfile({ name: "x", tools: ["read"], thinking: "ultra" })) ?? "").includes("thinking must be"));
check("rejects duplicate tools", (throws(() => validateProfile({ name: "x", tools: ["read", "read"] })) ?? "").includes("duplicate"));
check("rejects an empty tool list", throws(() => validateProfile({ name: "x", tools: [] })) !== null);

// 7. every profile in the shipped study is valid
for (const p of study.profiles) check(`study profile "${p.name}" validates`, throws(() => validateProfile(p)) === null, throws(() => validateProfile(p)) ?? "");

// A relative extension path resolves against the STUDY dir, never the process cwd
// (the child runs inside a throwaway fixture copy).
{
	const relProfile = { ...P("research"), extensions: P("research").extensions.map((e) => ({ ...e, path: "../../.ext/pi-web-access/node_modules/pi-web-access/index.ts" })) };
	const r = renderRun(relProfile, study, { ...ctx, studyDir: "/tmp/nana-bench/studies/s1" });
	const i = r.argv.indexOf("-e");
	check("relative -e path is made absolute against studyDir", i >= 0 && r.argv[i + 1] === "/tmp/nana-bench/.ext/pi-web-access/node_modules/pi-web-access/index.ts", r.argv[i + 1]);
}

process.exit(fails ? 1 : 0);
