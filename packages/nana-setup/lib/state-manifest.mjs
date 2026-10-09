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

/** Returns exactly one manifest record for every named store. */
export function stateRows(layout) {
  const p = path.join;
  const rows = [];
  const add = (store, cls, owner, kind, value, restore, from = source) => rows.push({ store, class: cls, owner, kind, path: value, source: from, restore });
  const durable = (store, owner, kind, value, restore = "restore from the private state archive", from) => add(store, "durable", owner, kind, value, restore, from ?? modules.user);
  const rebuild = (store, value, kind = "link", owner = "nana-setup", restore = "re-run nana-setup install") => add(store, "rebuildable", owner, kind, value, restore, modules.setup);
  const secret = (store, owner, kind, value, from) => add(store, "secret", owner, kind, value, "sign in again or carry by hand; never archive", from);
  const disp = (store, value, kind = "file", owner = "nana-setup") => add(store, "disposable", owner, kind, value, "recreated as needed", modules.setup);

  durable("private rule", "user", "file", p(layout.rulesDir, "nana-personal.md"));
  durable("shared memory", "claude-code", "dir", layout.sharedMemoryDir, "restore archive; SessionStart recreates project shared links", modules.claude);
  durable("project memories", "claude-code", "dir-pattern", p(layout.projectsDir, "*", "memory"), "restore archive; SessionStart recreates shared links", modules.claude);
  const ledger = ledgerPaths(layout.base);
  durable("review ledger tally", "nana-pack", "file", ledger.tally, undefined, modules.pack);
  durable("review ledger audit", "nana-pack", "file", ledger.audit, undefined, modules.pack);
  durable("review ledger rotated", "nana-pack", "file", ledger.rotated, undefined, modules.pack);
  durable("pi pack config", "nana-setup", "settings-entry", layout.piPackConfig, undefined, modules.setup);
  durable("pi objective", "nana-setup", "file", layout.piObjective, undefined, modules.setup);
  durable("pi settings", "pi", "settings", layout.piSettings, undefined, modules.pi);
  durable("knowledge sources", "user", "file", p(layout.knowledgeHome, "sources.json"), undefined, modules.knowledge);
  durable("knowledge pull log", "nana-knowledge", "file", p(layout.knowledgeHome, "pull.log"), undefined, modules.knowledge);
  rebuild("knowledge home", layout.knowledgeHome, "dir", "nana-knowledge", "re-run knowledge build", modules.knowledge);
  rebuild("pi-subagents package manifest", layout.piSubagentsPackage, "file", "pi", "run pi install npm:pi-subagents@0.75.0", modules.pi);
  durable("nana apps", "user", "dir", p(layout.piHome, "apps"));
  durable("nana share", "user", "dir", p(layout.base, ".local", "share", "nana"));

  for (const name of ["nana-objective.md", "extensions/subagent/config.json", "agents/reviewer.md"]) {
    const absolute = name === "nana-objective.md" ? layout.piObjective : p(layout.piHome, name);
    // pi objective is durable above, and subagent config/reviewer are rebuildable below.
    if (name !== "nana-objective.md") rebuild(name, absolute, "file", "nana-setup");
  }
  for (const name of ["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh", "verifier-pipe.mjs"]) rebuild(`hook ${name}`, p(layout.hooksDir, name));
  for (const name of ["nana-soul.md", "nana-standards.md", "nana-writing.md"]) rebuild(`rule link ${name}`, p(layout.rulesDir, name));
  for (const name of ["requirements", "spec", "py-lint", "py-review", "py-test"]) rebuild(`skill link ${name}`, p(layout.skillsDir, name), "link");
  for (const name of ["pi-review", "pi-worker", "nana-land", "nana-setup"]) rebuild(`bin link ${name}`, p(layout.binDir, name));
  rebuild("desk plist", layout.plistPath, "plist", "nana-setup", "re-run nana-setup install --desk");
  rebuild("pi-subagents package", p(layout.piHome, "npm"), "dir", "pi", "run pi install npm:pi-subagents@0.75.0");
  rebuild("knowledge index", p(layout.knowledgeHome, "index.db"), "file", "nana-knowledge", "run nana-knowledge build", modules.knowledge);
  rebuild("project memory shared links", p(layout.projectsDir, "*", "memory", "shared"), "link", "claude-code", "SessionStart recreates links", modules.claude);

  add("project trust", "re-ratified", "user", "file", p(layout.piHome, "trust.json"), "run nana-setup trust for each repository", modules.pi);
  for (const key of ["tally", "audit", "rotated", "lock", "resDir"]) {
    if (["tally", "audit", "rotated"].includes(key)) continue;
    disp(key === "lock" ? "review ledger lock" : "review ledger reservations", ledger[key], key === "lock" ? "file" : "dir", "nana-pack");
  }
  disp("suite lock", p(layout.base, ".nana", "suite.lock"), "file", "test runner");
  disp("knowledge shown", p(layout.knowledgeHome, "shown"), "dir", "nana-knowledge");
  disp("knowledge build lock", p(layout.knowledgeHome, "build.lock"), "file", "nana-knowledge");
  disp("desk log", layout.deskLog);
  disp("MCP cache", p(layout.piHome, "mcp-cache.json"));
  disp("handoffs", p(layout.base, ".pi", "agent", "handoffs"), "dir", "pi");
  disp("nana journal", p(layout.base, ".pi", "agent", "nana-journal.jsonl"), "file", "nana-pack");

  for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json"]) secret(name, "pi", "file", p(layout.piHome, name), modules.pi);
  secret("Claude credentials", "claude-code", "file", p(layout.claudeHome, ".credentials.json"), modules.claude);
  secret("Claude settings", "claude-code", "settings", layout.claudeSettings, modules.claude);
  secret("Claude login", "claude-code", "file", p(layout.base, ".claude.json"), modules.claude);
  secret("pi sessions", "pi", "dir", p(layout.base, ".pi", "agent", "sessions"), modules.pi);
  secret("Claude transcripts", "claude-code", "dir-pattern", p(layout.projectsDir, "*", "*.jsonl"), modules.claude);
  secret("pi bench agent", "user", "dir", p(layout.base, ".pi", "bench-agent"), modules.pi);
  secret("desk stage keys", "desk", "dir", p(layout.base, ".pi", "agent", "nana-desk", "stage-keys"), modules.desk);
  rebuild("LaunchAgents directory", layout.launchAgentsDir, "dir", "nana-setup", "re-run nana-setup install --desk");
  return rows;
}
