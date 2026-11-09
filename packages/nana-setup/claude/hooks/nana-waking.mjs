/**
 * @module packages/nana-setup/claude/hooks/nana-waking.mjs
 * @purpose Apply advisory waking checks to Claude Code seat hooks.
 * @inputs Hook stdin and project environment.
 * @outputs A block or deny JSON object, or nothing.
 * @effects disk (records and transcript), process (git)
 * @errors All failures exit 0 silently.
 */
process.stdout.on("error", () => {});
try {
 const [{ readFileSync }, { openLanes }, { wakingDecision }] = await Promise.all([
  import("node:fs"),
  import("../../../nana-pack/lib/open-lanes.mjs"),
  import("../../../nana-pack/lib/waking-guards.mjs"),
 ]);
 const payload = JSON.parse(readFileSync(0, "utf8"));
 const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
 const decision = wakingDecision(payload, {
  role: process.env.NANA_ROLE,
  lanes: () => openLanes({ root }),
  readTranscript: file => readFileSync(file, "utf8"),
 });
 if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
} catch {}
