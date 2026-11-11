/**
 * @module packages/nana-setup/claude/hooks/nana-waking.mjs
 * @purpose Apply advisory waking and final-message writing checks to Claude Code seat hooks.
 * @inputs Hook stdin and project environment.
 * @outputs A block or deny JSON object, or nothing.
 * @effects disk (records, HANDOFF and transcript), process (git and gh), network (issues through gh)
 * @errors All failures exit 0 silently.
 */
process.stdout.on("error", () => {});
try {
 const [{ readFileSync }, { join }, { openLanes }, { wakingDecision }, { readHandoffIssues }] = await Promise.all([
  import("node:fs"),
  import("node:path"),
  import("../../../nana-pack/lib/open-lanes.mjs"),
  import("../../../nana-pack/lib/waking-guards.mjs"),
  import("../../../nana-pack/lib/handoff-issues.mjs"),
 ]);
 const payload = JSON.parse(readFileSync(0, "utf8"));
 const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
 const decision = wakingDecision(payload, {
  role: process.env.NANA_ROLE,
  lanes: () => openLanes({ root }),
  readTranscript: file => readFileSync(file, "utf8"),
  readIssues: () => readHandoffIssues({ text: readFileSync(join(root, "HANDOFF.md"), "utf8"), cwd: root }),
 });
 if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
} catch {}
