/**
 * @module packages/nana-setup/lib/install-check-config.mjs
 * @purpose Defines the independent sealed contract and tunables for the install check.
 * @inputs None.
 * @outputs Hook, environment, known-red and doctor-note contracts.
 * @effects none
 * @errors None.
 */
// Contract values: Claude Code hooks/runtime matrix, read 2026-10-12; installer timeout in settings.mjs.
export const HOOKS = [
  { label: "hook objective", shortLabel: "objective", event: "SessionStart", matcher: "startup", script: "nana-objective.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook adoption", shortLabel: "adoption", event: "SessionStart", matcher: "startup", script: "nana-adoption.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook shared memory", shortLabel: "shared memory", event: "SessionStart", matcher: "startup", script: "nana-shared-memory.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook verifier pipe", shortLabel: "verifier pipe", event: "PreToolUse", matcher: { darwin: "Bash", linux: "Bash", win32: "Bash|PowerShell" }, tools: { darwin: ["Bash"], linux: ["Bash"], win32: ["Bash", "PowerShell"] }, script: "verifier-pipe.mjs", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
  { label: "hook knowledge pull", shortLabel: "knowledge pull", event: "UserPromptSubmit", matcher: null, script: "nana-knowledge.ts", timeout: 5, form: { darwin: "shell", linux: "shell", win32: "exec" } },
];
// Contract value: documented command-hook fields, excluding fields which alter dispatch, read 2026-10-12.
export const ALLOWED_HOOK_KEYS = ["type", "command", "args", "timeout", "statusMessage"];
// Contract values: environment readers in nana-pack, nana-knowledge and nana-setup, audited 2026-10-12.
export const OVERRIDE_ENV = ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_ROLE", "NANA_SETUP_PLATFORM", "NANA_TEST_TEMP_ROOTS", "NANA_HANDOFF"];
// Provenance: Windows install-check run 38393751564 after main merge; every hook passed, 2026-10-13.
export const KNOWN_RED = {
  darwin: [],
  win32: [],
};
// Contract values: doctor.mjs informational rows; the win32 additions reflect its documented skips.
export const DOCTOR_NOTES = {
  darwin: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
  linux: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
  win32: ["pi agent dir", "pi mcp.json", "desk service", "release status", "PATH pi-review", "PATH pi-worker", "PATH nana-land", "PATH nana-setup", "skill requirements", "skill nana-standards"],
};
// Hook input samples and report budget are contract values from Claude Code docs, read 2026-10-12.
export const SAMPLE_INPUTS = {
  session: { source: "startup", transcript_path: "", cwd: "" },
  prompt: "How does nana install-check validate this fixture?",
  verifier: { bashHit: "npm test | tail -1 && git commit -m done", bashMiss: "git status", powershellHit: "npm test | Select-Object -Last 5; git commit -m x" },
  maxOutput: 10000,
};
// Chosen 2026-10-12: bound network and doctor subprocesses within the 20-minute CI job.
export const SPAWN_TIMEOUT_MS = { install: 300000, pi: 300000, list: 60000, session: 60000, hook: 5000, doctor: 120000, git: 30000 };
