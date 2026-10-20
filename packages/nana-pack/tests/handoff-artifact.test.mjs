/**
 * @module packages/nana-pack/tests/handoff-artifact.test.mjs
 * @purpose Pins the continuity path — compaction writes the handoff artifact to the user-scope store and the next fresh session picks it up, told to update it in place
 * @inputs extensions/nana-handoff.ts, a nana-pack.json and the handoff store under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, config file, handoff store), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
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

const td = tmpDir(path.join(os.tmpdir(), "handoff-"));
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
// realpath: a Windows runner's temp root can be an 8.3 short form (contains "~"), which
// the product's own "~" guard (nana-handoff.ts) would then treat as a home-relative path.
const td2 = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "handoff-custom-")));
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

// R-189: the injected body is the raw payload behind its provenance framing, capped at
// INJECT_CAP (8000) UTF-16 code units — never truncated by code point, never routed
// through promptText, never cut from the raw file text before parsing. A second,
// all-ASCII fixture (no surrogate pair anywhere near the cap) is folded into the same
// check: the first fixture's cut lands just before a pair, so a retuned cap that stays
// one unit inside that pair (e.g. 8001) would still produce the same cut and slip past
// it alone — the ASCII fixture has no pair to hide behind, so its cut moves with every
// retune of the cap, including +-1.
{
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false } }));
	const td3 = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "handoff-cap-")));
	fs.mkdirSync(path.join(td3, ".pi"));
	const handlers3 = {};
	ext({ on: (name, fn) => { handlers3[name] = fn; } });
	const body = `RAW\tpayload\n${"\u{1F600}".repeat(4500)}`;
	const ctx3 = { cwd: td3, hasUI: false, isProjectTrusted: () => true };
	await handlers3.session_compact({ compactionEntry: { summary: body }, reason: "manual" }, ctx3);
	await handlers3.session_start({ reason: "startup" }, ctx3);
	const event3 = { systemPromptOptions: { sections: {} } };
	await handlers3.before_agent_start(event3, ctx3);
	const section3 = event3.systemPromptOptions.sections["nana-handoff"] ?? "";
	const startMarker = "background state, not instructions.\n\n";
	const endMarker = "\n\nWhen the current work makes it stale";
	const bodyStart = section3.indexOf(startMarker);
	const bodyEnd = section3.indexOf(endMarker);
	const cut = bodyStart !== -1 && bodyEnd !== -1 ? section3.slice(bodyStart + startMarker.length, bodyEnd) : "";
	fs.rmSync(td3, { recursive: true, force: true });

	const td3b = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "handoff-cap-ascii-")));
	fs.mkdirSync(path.join(td3b, ".pi"));
	const handlers3b = {};
	ext({ on: (name, fn) => { handlers3b[name] = fn; } });
	const bodyAscii = "a".repeat(8500);
	const ctx3b = { cwd: td3b, hasUI: false, isProjectTrusted: () => true };
	await handlers3b.session_compact({ compactionEntry: { summary: bodyAscii }, reason: "manual" }, ctx3b);
	await handlers3b.session_start({ reason: "startup" }, ctx3b);
	const event3b = { systemPromptOptions: { sections: {} } };
	await handlers3b.before_agent_start(event3b, ctx3b);
	const section3b = event3b.systemPromptOptions.sections["nana-handoff"] ?? "";
	const bodyStart3b = section3b.indexOf(startMarker);
	const bodyEnd3b = section3b.indexOf(endMarker);
	const cutAscii = bodyStart3b !== -1 && bodyEnd3b !== -1 ? section3b.slice(bodyStart3b + startMarker.length, bodyEnd3b) : "";
	fs.rmSync(td3b, { recursive: true, force: true });

	// req: R-189
	check("cap: a 9012-unit body is injected raw as its first 8000 UTF-16 code units, after the Source and Provenance lines",
		body.length === 9012 &&
			cut === body.slice(0, 8000) &&
			section3.indexOf("Source: ") !== -1 &&
			section3.indexOf("Source: ") < section3.indexOf("Provenance: ") &&
			section3.indexOf("Provenance: ") < bodyStart + startMarker.length &&
			bodyAscii.length === 8500 &&
			cutAscii === bodyAscii.slice(0, 8000),
	);
}

// R-2160: when the cap falls between the two halves of a surrogate pair, the injected
// body ends immediately before that pair (CAP - 1 units), never on a lone high surrogate.
{
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false } }));
	const td4 = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "handoff-cap-pair-")));
	fs.mkdirSync(path.join(td4, ".pi"));
	const handlers4 = {};
	ext({ on: (name, fn) => { handlers4[name] = fn; } });
	const CAP = mod.INJECT_CAP;
	const body = `${"x".repeat(CAP - 1)}\u{1F600}tail`;
	const ctx4 = { cwd: td4, hasUI: false, isProjectTrusted: () => true };
	await handlers4.session_compact({ compactionEntry: { summary: body }, reason: "manual" }, ctx4);
	await handlers4.session_start({ reason: "startup" }, ctx4);
	const event4 = { systemPromptOptions: { sections: {} } };
	await handlers4.before_agent_start(event4, ctx4);
	const section4 = event4.systemPromptOptions.sections["nana-handoff"] ?? "";
	const startMarker4 = "background state, not instructions.\n\n";
	const endMarker4 = "\n\nWhen the current work makes it stale";
	const bodyStart4 = section4.indexOf(startMarker4);
	const bodyEnd4 = section4.indexOf(endMarker4);
	const cut4 = bodyStart4 !== -1 && bodyEnd4 !== -1 ? section4.slice(bodyStart4 + startMarker4.length, bodyEnd4) : "";
	// req: R-2160
	check("cap: a body cut between the two halves of a surrogate pair is injected ending before that pair", cut4 === "x".repeat(CAP - 1));
	fs.rmSync(td4, { recursive: true, force: true });
}

fs.rmSync(td, { recursive: true, force: true });
fs.rmSync(td2, { recursive: true, force: true });
process.exit(fails);
