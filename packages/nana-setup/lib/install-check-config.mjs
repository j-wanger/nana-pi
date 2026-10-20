/**
 * @module packages/nana-setup/lib/install-check-config.mjs
 * @purpose Defines the independent sealed contract and tunables for the install check.
 * @inputs None.
 * @outputs Hook, environment, known-red, doctor-note and filesystem-path contracts.
 * @effects none
 * @errors None.
 */
// Contract values: Claude Code hooks/runtime matrix, read 2026-10-12; installer timeout in settings.mjs.
export const HOOKS = [
  { label: "hook objective", shortLabel: "objective", event: "SessionStart", matcher: "startup", script: "nana-objective.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook adoption", shortLabel: "adoption", event: "SessionStart", matcher: "startup", script: "nana-adoption.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook shared memory", shortLabel: "shared memory", event: "SessionStart", matcher: "startup", script: "nana-shared-memory.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook roster notice", shortLabel: "roster notice", event: "SessionStart", matcher: "startup", script: "nana-roster-notice.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook verifier pipe", shortLabel: "verifier pipe", event: "PreToolUse", matcher: { darwin: "Bash", linux: "Bash", win32: "Bash|PowerShell" }, tools: { darwin: ["Bash"], linux: ["Bash"], win32: ["Bash", "PowerShell"] }, script: "verifier-pipe.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook knowledge pull", shortLabel: "knowledge pull", event: "UserPromptSubmit", matcher: null, script: "nana-knowledge.ts", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
];
// contract: R-1209 — independent of nana-pack's roster-notice-config.mjs (the install check's
// own sealed contract), so a notice-config change cannot silently loosen what the check accepts.
export const ROSTER_NOTICE_PREFIX = "nana active · roster";
export const ROSTER_NOTICE_UNAVAILABLE_PREFIX = "nana active · roster notice unavailable (";
// Contract value: documented command-hook fields, excluding fields which alter dispatch, read 2026-10-12.
export const ALLOWED_HOOK_KEYS = ["type", "command", "args", "timeout", "statusMessage"];
// Contract values: environment readers in nana-pack, nana-knowledge and nana-setup, audited 2026-10-12.
export const OVERRIDE_ENV = ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_ROLE", "NANA_SETUP_PLATFORM", "NANA_TEST_TEMP_ROOTS", "NANA_HANDOFF"];
// Contract path: nana-knowledge/lib/paths.ts, read 2026-10-13.
export const PULL_LOG_PATH = [".pi", "agent", "nana-knowledge", "pull.log"];
// Provenance: Windows install-check run 38393751564 after main merge; every hook passed, 2026-10-13.
export const KNOWN_RED = {
  darwin: [],
  win32: [],
};
// Contract values: doctor.mjs informational rows; win32 hook-file rows removed by R-1861, 2026-10-19; floor from R-1060;
// PATH rows are checks after R-1610, while the four pi-only skill skips remain notes (R-937).
export const DOCTOR_NOTES = {
  darwin: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
  linux: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
  win32: ["pi agent dir", "pi mcp.json", "desk service", "release status", "Claude Code hooks floor", "skill spec", "skill py-lint", "skill py-review", "skill py-test"],
};
// Hook input samples and report budget are contract values from Claude Code docs, read 2026-10-12.
export const SAMPLE_INPUTS = {
  session: { source: "startup", transcript_path: "", cwd: "" },
  prompt: "How does nana install-check validate this fixture?",
  verifier: { bashHit: "npm test | tail -1 && git commit -m done", bashMiss: "git status", powershellHit: "npm test | Select-Object -Last 5; git commit -m x" },
  maxOutput: 10000,
};
// Probe 2026-10-19: a live offline faux turn observed these prompt sections, knowledge pointer,
// tool result and extension-error spelling. Provider/model names are chosen fixture-only names.
export const PI_TURN = {
  item: "pi turn",
  fixture: "packages/nana-setup/lib/install-check-turn.mjs",
  provider: "nana-install-check-fixture",
  model: "nana-install-check-turn",
  args: ["--offline", "-e", "packages/nana-setup/lib/install-check-turn.mjs", "--provider", "nana-install-check-fixture", "--model", "nana-install-check-turn", "--no-session", "-p"],
  tool: "bash",
  record: ".nana-install-check-turn.json",
  noteFile: "install-check.md",
  rulingsHeading: "## Standing rulings (nana)",
  writingTag: "<nana-writing>",
  knowledgeMarker: "[nana:knowledge]",
  gateBlockPrefix: "nana-gate: verifier pipe blocked (headless fail-closed):",
  extensionErrorPrefix: "Extension error (",
};
// Probe 2026-10-19: RPC output with pi-subagents was 21,699 bytes and placed a widget after
// byte 20,970. The unavailable word is chosen to cover nana's explicit degraded-state notices.
export const PI_SESSION = { unavailableWord: "unavailable", maxOutput: 100000 };
// Chosen 2026-10-12: bound network and doctor subprocesses within the 20-minute CI job.
// Probe 2026-10-19: the offline faux turn took 0.66 s; 60 s leaves cold Windows runner headroom.
export const SPAWN_TIMEOUT_MS = { install: 300000, pi: 300000, list: 60000, session: 60000, turn: 60000, hook: 5000, doctor: 120000, git: 30000 };
// Contract values: the macOS fresh-machine checklist's rehearsal grammar and sandbox shape (R-1540 to R-1546),
// each chosen 2026-10-19 to run the root README's checklist as written, in a second temporary home.
export const README_REHEARSAL = {
  item: "readme checklist", // contract: the install-check result-line item name (R-1540)
  readme: "README.md", // contract: the rehearsed document, read from the repo root (R-1540)
  heading: "### Fresh machine (macOS), in order", // contract: the checklist section this rehearses (R-1540)
  platforms: ["darwin"], // chosen 2026-10-19: the README carries only a macOS checklist (R-1540)
  home: "readme-home", // chosen 2026-10-19: a folder distinct from the install-check home, never reused (R-1540)
  npmPrefix: ".npm-global", // chosen 2026-10-19: stands in for step 1's writable global npm prefix (R-1542)
  shell: "/bin/zsh", // contract: macOS's default login shell (R-1542)
  shellArgs: ["-l", "-c"], // contract: a login shell reads the profile files the checklist assumes (R-1542)
  commandLeads: ["Run", "then"], // contract: the README's own command grammar (R-1541)
  expectLead: "expect", // contract: the README's own expectation grammar (R-1541)
  droppedEnv: ["ZDOTDIR"], // chosen 2026-10-19: a caller's ZDOTDIR would redirect the rehearsal's login shell away from its home (R-1542)
  answers: [{ prefix: "nana-setup trust ", append: "--yes" }], // chosen 2026-10-19: no terminal is present to answer the trust prompt (R-1543)
  stepTimeoutMs: 300000, // chosen 2026-10-19: bounds one step, including step 2's network pi install, within the CI job (R-1545)
  maxOutput: 1000000, // chosen 2026-10-19: step 8's doctor output runs 7.5-7.9 KB today; headroom beyond the 10,001-character hook cap (R-1544)
};
