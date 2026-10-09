/**
 * @module packages/nana-setup/lib/state-manifest.mjs
 * @purpose Defines the single classified inventory of nana state and its restoration provenance.
 * @inputs resolveLayout-shaped absolute paths and ledgerPaths(home).
 * @outputs sealed STATE_CLASSES and stateRows(layout).
 * @effects none
 * @errors none
 */
import * as path from "node:path";
import { ledgerPaths } from "../../nana-pack/bin/review-round.mjs";

/** Sealed classification vocabulary; chosen by plan 5.5 and critic S2 (2026-10-08). */
export const STATE_CLASSES = Object.freeze({
  DURABLE: "durable", REBUILDABLE: "rebuildable", RE_RATIFIED: "re-ratified", DISPOSABLE: "disposable", SECRET: "secret",
});

const source = "plan 5.5 state inventory (2026-10-08)";
const modules = {
  setup: "packages/nana-setup/lib/steps.mjs",
  pi: "pi / pi-subagents owner",
  claude: "Claude Code owner",
  pack: "packages/nana-pack/bin/review-round.mjs",
  knowledge: "packages/nana-knowledge/lib/paths.ts",
  desk: "apps/desk/lib/stage-keys.mjs",
  user: "user-created store",
};
const seedSource = `${modules.setup}; remove only while byte-equal to seed source`;

/** Returns exactly one manifest record for every named store. */
export function stateRows(layout) {
  const p = path.join;
  const rows = [];
  const add = (store, cls, owner, kind, value, restore, from = source) => rows.push({ store, class: cls, owner, kind, path: value, source: from, restore });
  const durable = (store, owner, kind, value, restore = "restore from the private state archive", from) => add(store, "durable", owner, kind, value, restore, from ?? modules.user);
  const seed = (store, value, cls = "durable") => add(store, cls, "nana-setup", "seed", value, cls === "durable" ? "restore from the private state archive" : "re-run nana-setup install", seedSource);
  const rebuild = (store, value, kind = "link", owner = "nana-setup", restore = "re-run nana-setup install", from = modules.setup) => add(store, "rebuildable", owner, kind, value, restore, from);
  const secret = (store, owner, kind, value, from) => add(store, "secret", owner, kind, value, "sign in again or carry by hand; never archive", from);
  const disp = (store, value, kind, owner, from) => add(store, "disposable", owner, kind, value, "recreated as needed", from);

  seed("private rule", p(layout.rulesDir, "nana-personal.md"));
  durable("shared memory", "user", "dir", layout.sharedMemoryDir, "restore archive; SessionStart recreates project shared links", modules.user);
  seed("shared memory seed", p(layout.sharedMemoryDir, "MEMORY.md"));
  durable("project memories", "claude-code", "dir-pattern", p(layout.projectsDir, "*", "memory"), "restore archive; SessionStart recreates shared links", modules.claude);
  const ledger = ledgerPaths(layout.base);
  durable("review ledger tally", "nana-pack", "file", ledger.tally, undefined, modules.pack);
  durable("review ledger audit", "nana-pack", "file", ledger.audit, undefined, modules.pack);
  durable("review ledger rotated", "nana-pack", "file", ledger.rotated, undefined, modules.pack);
  seed("pi pack config", layout.piPackConfig);
  seed("pi objective", layout.piObjective);
  durable("pi settings", "nana-setup", "settings-entry", layout.piSettings, "restore from the private state archive", modules.setup);
  durable("knowledge sources", "user", "file", p(layout.knowledgeHome, "sources.json"), undefined, modules.knowledge);
  durable("knowledge pull log", "nana-knowledge", "file", p(layout.knowledgeHome, "pull.log"), undefined, modules.knowledge);
  durable("nana apps", "user", "dir", p(layout.piHome, "apps"));
  durable("nana share", "user", "dir", p(layout.base, ".local", "share", "nana"));

  seed("subagent config.json", layout.subagentConfig, "rebuildable");
  seed("reviewer.md", layout.reviewerAgent, "rebuildable");
  for (const name of ["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh", "verifier-pipe.mjs"]) rebuild(`hook ${name}`, p(layout.hooksDir, name));
  for (const name of ["nana-soul.md", "nana-standards.md", "nana-writing.md"]) rebuild(`rule link ${name}`, p(layout.rulesDir, name));
  for (const name of ["requirements", "spec", "py-lint", "py-review", "py-test"]) rebuild(`skill link ${name}`, p(layout.skillsDir, name));
  for (const name of ["pi-review", "pi-worker", "nana-land", "nana-setup"]) rebuild(`bin link ${name}`, p(layout.binDir, name));
  rebuild("desk plist", layout.plistPath, "plist", "nana-setup");
  rebuild("pi-subagents package manifest", layout.piSubagentsPackage, "file", "pi", "run pi install npm:pi-subagents@0.75.0", modules.pi);
  rebuild("knowledge index", p(layout.knowledgeHome, "index.db"), "generated", "nana-knowledge", "run nana-knowledge build", modules.knowledge);
  rebuild("project memory shared links", p(layout.projectsDir, "*", "memory", "shared"), "link", "claude-code", "SessionStart recreates links", modules.claude);

  add("project trust", "re-ratified", "user", "file", p(layout.piHome, "trust.json"), "run nana-setup trust for each repository", modules.pi);
  disp("review ledger lock", ledger.lock, "file", "nana-pack", modules.pack);
  disp("review ledger reservations", ledger.resDir, "dir", "nana-pack", modules.pack);
  disp("suite lock", p(layout.base, ".nana", "suite.lock"), "file", "test runner", "scripts/test-locked.mjs");
  disp("knowledge shown", p(layout.knowledgeHome, "shown"), "dir", "nana-knowledge", modules.knowledge);
  disp("knowledge build lock", p(layout.knowledgeHome, "build.lock"), "file", "nana-knowledge", modules.knowledge);
  disp("desk log", layout.deskLog, "file", "desk", modules.desk);
  disp("MCP cache", p(layout.piHome, "mcp-cache.json"), "file", "pi", modules.pi);
  disp("handoffs", p(layout.base, ".pi", "agent", "handoffs"), "dir", "pi", modules.pi);
  disp("nana journal", p(layout.base, ".pi", "agent", "nana-journal.jsonl"), "file", "nana-pack", modules.pack);

  for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json"]) secret(name, "pi", "file", p(layout.piHome, name), modules.pi);
  secret("Claude credentials", "claude-code", "file", p(layout.claudeHome, ".credentials.json"), modules.claude);
  secret("Claude settings", "nana-setup", "settings-entry", layout.claudeSettings, modules.setup);
  secret("Claude login", "claude-code", "file", p(layout.base, ".claude.json"), modules.claude);
  secret("pi sessions", "pi", "dir", p(layout.base, ".pi", "agent", "sessions"), modules.pi);
  secret("Claude transcripts", "claude-code", "dir-pattern", p(layout.projectsDir, "*", "*.jsonl"), modules.claude);
  secret("pi bench agent", "user", "dir", p(layout.base, ".pi", "bench-agent"), modules.pi);
  secret("desk stage keys", "desk", "dir", p(layout.base, ".pi", "agent", "nana-desk", "stage-keys"), modules.desk);
  return rows;
}
