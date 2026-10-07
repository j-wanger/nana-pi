/**
 * @module packages/nana-pack/tests/handoff-artifact.test.mjs
 * @purpose Pins the continuity path — compaction writes the handoff artifact to the user-scope store and the next fresh session picks it up, told to update it in place
 * @inputs extensions/nana-handoff.ts, a nana-pack.json and the handoff store under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, config file, handoff store), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
// Continuity property: compaction writes the handoff artifact and the next fresh
// session picks it up, told to update it in place. L3 moved the artifact out of the
// repo into the user-scope store (~/.pi/agent/handoffs/<sha256(canonical cwd)>.md), so
// the three .gitignore checks (sibling .pi/.gitignore management) and "prompt forbids
// deletion" are GONE with their reason: nothing in the repo can be tidied away anymore,
// and a repo-writable .pi/handoff.md is never injected (tests/handoff-trust.test.mjs).
// Run: node --experimental-strip-types <this file>
const mod = await import(new URL("../extensions/nana-handoff.ts", import.meta.url).href);
const ext = mod.default;
let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

const handlers = {};
ext({ on: (name, fn) => { handlers[name] = fn; } });

const td = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-"));
fs.mkdirSync(path.join(td, ".pi"));
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false } }));
const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true };

const store = mod.storePathFor(fs.realpathSync.native(td));
await handlers.session_compact({ compactionEntry: { summary: "frontier: the state of play" }, reason: "manual" }, ctx);
// req: R-108
check("handoff written (to the user-scope store)", fs.readFileSync(store, "utf-8").includes("frontier: the state of play"));
await handlers.session_compact({ compactionEntry: { summary: "second compaction" }, reason: "auto" }, ctx);

await handlers.session_start({ reason: "startup" }, ctx);
const promptEvent = { systemPromptOptions: { sections: {} } };
await handlers.before_agent_start(promptEvent, ctx);
const handoffSection = promptEvent.systemPromptOptions.sections["nana-handoff"] ?? "";
check("pickup injects handoff", handoffSection.includes("second compaction"));
// req: R-828
check("prompt says update in place", handoffSection.includes(`update ${store} in place`));

// custom handoff.path: the prompt must name THAT file (pi-review MAJOR
// 2026-09-03), and no .gitignore appears next to it — its git semantics are
// the owner's (custom paths are honored from user scope; L3 invariant b)
const handlers2 = {};
ext({ on: (name, fn) => { handlers2[name] = fn; } });
const td2 = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-custom-"));
const custom = path.join(td2, "STATE", "HANDOFF.md");
fs.mkdirSync(path.join(td2, ".pi"));
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, handoff: { path: custom } }));
const ctx2 = { cwd: td2, hasUI: false, isProjectTrusted: () => true };
await handlers2.session_compact({ compactionEntry: { summary: "custom-path state" }, reason: "manual" }, ctx2);
check("custom path: handoff written", fs.readFileSync(custom, "utf-8").includes("custom-path state"));
// req: R-796
check("custom path: no .gitignore beside it", !fs.existsSync(path.join(td2, "STATE", ".gitignore")));
await handlers2.session_start({ reason: "startup" }, ctx2);
const event2 = { systemPromptOptions: { sections: {} } };
await handlers2.before_agent_start(event2, ctx2);
const handoffSection2 = event2.systemPromptOptions.sections["nana-handoff"] ?? "";
// req: R-142 R-828
check("custom path: prompt names the configured file", handoffSection2.includes(`update ${path.join("STATE", "HANDOFF.md")} in place`));
// req: R-142
check("custom path: prompt never says .pi/handoff.md", !handoffSection2.includes(".pi/handoff.md"));

fs.rmSync(td, { recursive: true, force: true });
fs.rmSync(td2, { recursive: true, force: true });
process.exit(fails);
