// Zero-dep unit test for the two pure pieces behind the live-feel surfaces
// (2026-09-16): the composer activity line's verb derivation, and the skill
// expansion parser that turns pi's echoed `<skill …>` block back into the
// `/skill:name args` the user typed.
//
// desk-client.mjs touches `document` only inside function bodies, so Node can
// import it as-is — no DOM, no browser, no Playwright.
// Run: node apps/desk/test/live-feel.test.mjs   (exit 0 = all PASS)
import { activityVerb, toolActivity, parseSkillMessage, skillLabel, matchesUserEcho } from "../public/desk-client.mjs";

let fails = 0;
const check = (name, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", name, extra);
	if (!ok) fails++;
};
const eq = (name, got, want) => check(name, got === want, got === want ? "" : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);

// ── activity verbs ─────────────────────────────────────────────────────────
const ame = (a) => ({ type: "message_update", assistantMessageEvent: a });

eq("agent_start", activityVerb({ type: "agent_start" }), "Starting…");
eq("thinking_start", activityVerb(ame({ type: "thinking_start" })), "Thinking…");
eq("thinking_delta", activityVerb(ame({ type: "thinking_delta", delta: "x" })), "Thinking…");
eq("text_start", activityVerb(ame({ type: "text_start" })), "Writing…");
eq("text_delta", activityVerb(ame({ type: "text_delta", delta: "x" })), "Writing…");
eq("toolcall_start names the tool", activityVerb(ame({ type: "toolcall_start", toolName: "read", id: "t1" })), "Calling read…");
eq("toolcall_start with no name", activityVerb(ame({ type: "toolcall_start" })), "Calling tool…");
eq("thinking_end says nothing new", activityVerb(ame({ type: "thinking_end" })), null);
eq("text_end says nothing new", activityVerb(ame({ type: "text_end" })), null);
eq("a message_update with no inner event", activityVerb({ type: "message_update" }), null);
eq("tool_execution_end → back to thinking", activityVerb({ type: "tool_execution_end", toolName: "read" }), "Thinking…");
eq("compaction_start", activityVerb({ type: "compaction_start", reason: "auto" }), "Compacting context…");
eq("auto_retry_start", activityVerb({ type: "auto_retry_start", attempt: 2, maxAttempts: 5 }), "Retrying (2/5)…");
eq("agent_settled is the caller's business", activityVerb({ type: "agent_settled" }), null);
eq("an unknown event", activityVerb({ type: "who_knows" }), null);
eq("a missing event", activityVerb(undefined), null);

// tool_execution_start, through the same arg-key heuristics the tool cards use
eq("read", activityVerb({ type: "tool_execution_start", toolName: "read", args: { path: "/a/b/notes.md" } }), "Reading notes.md…");
eq("read, windows path", toolActivity("read", { path: "C:\\\\src\\\\app.js" }), "Reading app.js…");
eq("read, file_path key", toolActivity("read", { file_path: "/a/b/c.txt" }), "Reading c.txt…");
eq("read, no path at all", toolActivity("read", {}), "Reading…");
eq("edit", toolActivity("edit", { file_path: "/x/y/app.js" }), "Editing app.js…");
eq("write", toolActivity("write", { path: "/x/y/new.txt" }), "Writing new.txt…");
eq("bash", toolActivity("bash", { command: "npm test" }), "Running: npm test…");
eq(
	"bash, long command is cut at 60",
	toolActivity("bash", { command: "x".repeat(200) }),
	`Running: ${"x".repeat(60)}…`,
);
eq("grep", toolActivity("grep", { pattern: "foo" }), "Searching…");
eq("find", toolActivity("find", { pattern: "*.js" }), "Searching…");
eq("ls", toolActivity("ls", { path: "/tmp" }), "Searching…");
eq("subagent", toolActivity("subagent", { agent: "reviewer" }), "Delegating…");
eq("anything else", toolActivity("nana_stage_put", { id: "b1" }), "Running nana_stage_put…");
eq("the event's `input` key is read too", activityVerb({ type: "tool_execution_start", toolName: "bash", input: { command: "ls -la" } }), "Running: ls -la…");

// ── skill expansion ────────────────────────────────────────────────────────
// Exactly what pi's `_expandSkillCommand` builds (agent-session.js).
const expand = (name, dir, body, args) => {
	const block = `<skill name="${name}" location="${dir}/SKILL.md">\nReferences are relative to ${dir}.\n\n${body}\n</skill>`;
	return args ? `${block}\n\n${args}` : block;
};

{
	const sk = parseSkillMessage(expand("loop-init", "/Users/j/.claude/skills/loop-init", "# Loop init\n\nDo the thing."));
	check("parse: a bare skill message", !!sk);
	eq("parse: name", sk?.name, "loop-init");
	eq("parse: location", sk?.location, "/Users/j/.claude/skills/loop-init/SKILL.md");
	eq("parse: no args", sk?.args, "");
	check("parse: body keeps the preamble and the file", sk?.body.startsWith("References are relative to") && sk?.body.endsWith("Do the thing."), JSON.stringify(sk?.body));
}
{
	const sk = parseSkillMessage(expand("dev-plan", "/s/dev-plan", "body here", "phase 3 please"));
	eq("parse: args ride after the block", sk?.args, "phase 3 please");
	eq("parse: args do not leak into the body", sk?.body.includes("phase 3"), false);
}
eq("parse: ordinary prompt", parseSkillMessage("just a prompt"), null);
eq("parse: the typed form is not the expanded form", parseSkillMessage("/skill:loop-init go"), null);
eq("parse: an opening line that is not the exact shape", parseSkillMessage('<skill name="x" location="y" extra="z">\nbody\n</skill>'), null);
eq("parse: a single line with no newline", parseSkillMessage('<skill name="x" location="y">'), null);
eq("parse: no closing tag", parseSkillMessage('<skill name="x" location="y">\nbody'), null);
eq("parse: junk after the close is refused", parseSkillMessage('<skill name="x" location="y">\nbody\n</skill> trailing'), null);
eq("parse: a non-string", parseSkillMessage(null), null);

eq("label: bare", skillLabel(expand("loop-init", "/s/loop-init", "b")), "/skill:loop-init");
eq("label: with args", skillLabel(expand("loop-init", "/s/loop-init", "b", "now")), "/skill:loop-init now");
eq("label: ordinary text has none", skillLabel("hello"), null);

// ── echo matching ──────────────────────────────────────────────────────────
eq("echo: ordinary prompts still match exactly", matchesUserEcho("hello", "hello"), true);
eq("echo: near-identical prompts do NOT match", matchesUserEcho("hello", "hello "), false);
eq("echo: a plain prompt never matches a different one", matchesUserEcho("a", "b"), false);
{
	const echo = expand("loop-init", "/s/loop-init", "body");
	eq("echo: typed /skill matches its expansion", matchesUserEcho("/skill:loop-init", echo), true);
	eq("echo: a different skill does not", matchesUserEcho("/skill:dev-plan", echo), false);
	eq("echo: typed args must match too", matchesUserEcho("/skill:loop-init go", echo), false);
	eq("echo: a plain prompt never claims a skill echo", matchesUserEcho("loop-init", echo), false);
}
{
	const echo = expand("dev-plan", "/s/dev-plan", "body", "phase 3");
	eq("echo: args match", matchesUserEcho("/skill:dev-plan phase 3", echo), true);
	eq("echo: pi trims the args it records", matchesUserEcho("/skill:dev-plan   phase 3  ", echo), true);
	eq("echo: different args do not match", matchesUserEcho("/skill:dev-plan phase 4", echo), false);
	eq("echo: the same skill with no args does not", matchesUserEcho("/skill:dev-plan", echo), false);
}

console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
