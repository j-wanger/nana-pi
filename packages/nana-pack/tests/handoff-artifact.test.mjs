import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Continuity property: the handoff artifact survives tidy agents. Compaction
// must (a) write .pi/handoff.md, (b) git-ignore exactly that file (appending,
// never clobbering, an existing .pi/.gitignore — .pi/ itself stays committable),
// and (c) the injected pickup prompt must tell agents to update, never delete
// (an agent deleted the "stray untracked file" on 2026-09-03).
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href)).default;
let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; } });

const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-"));
fs.mkdirSync(path.join(td, ".pi"));
fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({ journal: { enabled: false } }));
fs.writeFileSync(path.join(td, ".pi", ".gitignore"), "scratch/\n");
const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true };

await handlers.session_compact({ compactionEntry: { summary: "frontier: the state of play" }, reason: "manual" }, ctx);
check("handoff.md written", fs.readFileSync(path.join(td, ".pi", "handoff.md"), "utf-8").includes("frontier: the state of play"));
const gi = fs.readFileSync(path.join(td, ".pi", ".gitignore"), "utf-8");
check("gitignore covers handoff.md", gi.split("\n").includes("handoff.md"));
check("gitignore append preserves existing entries", gi.includes("scratch/"));
await handlers.session_compact({ compactionEntry: { summary: "second compaction" }, reason: "auto" }, ctx);
check("gitignore not duplicated", fs.readFileSync(path.join(td, ".pi", ".gitignore"), "utf-8").split("\n").filter((l) => l === "handoff.md").length === 1);

await handlers.session_start({ reason: "startup" }, ctx);
const r = await handlers.before_agent_start({ systemPrompt: "BASE" }, ctx);
check("pickup injects handoff", r?.systemPrompt.includes("second compaction"));
check("prompt says update in place", r?.systemPrompt.includes("update .pi/handoff.md in place"));
check("prompt forbids deletion", r?.systemPrompt.includes("Never delete"));

// custom handoff.path: the prompt must name THAT file (pi-review MAJOR
// 2026-09-03), and no .gitignore appears next to it — its git semantics are
// the owner's
const handlers2 = {};
ext({ on: (name, fn) => { handlers2[name] = fn; } });
const td2 = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-custom-"));
const custom = path.join(td2, "STATE", "HANDOFF.md");
fs.mkdirSync(path.join(td2, ".pi"));
fs.writeFileSync(path.join(td2, ".pi", "nana-pack.json"), JSON.stringify({ journal: { enabled: false }, handoff: { path: custom } }));
const ctx2 = { cwd: td2, hasUI: false, isProjectTrusted: () => true };
await handlers2.session_compact({ compactionEntry: { summary: "custom-path state" }, reason: "manual" }, ctx2);
check("custom path: handoff written", fs.readFileSync(custom, "utf-8").includes("custom-path state"));
check("custom path: no .gitignore beside it", !fs.existsSync(path.join(td2, "STATE", ".gitignore")));
await handlers2.session_start({ reason: "startup" }, ctx2);
const r2 = await handlers2.before_agent_start({ systemPrompt: "BASE" }, ctx2);
check("custom path: prompt names the configured file", r2?.systemPrompt.includes(`update ${path.join("STATE", "HANDOFF.md")} in place`));
check("custom path: prompt never says .pi/handoff.md", !r2?.systemPrompt.includes(".pi/handoff.md"));

fs.rmSync(td, { recursive: true, force: true });
fs.rmSync(td2, { recursive: true, force: true });
process.exit(fails);
