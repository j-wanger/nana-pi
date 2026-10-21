/**
 * @module packages/nana-setup/lib/install-check-config.mjs
 * @purpose Defines the independent sealed contract and tunables for the install check.
 * @inputs None.
 * @outputs Hook, environment, retry, known-red, doctor-note and filesystem-path contracts.
 * @effects none
 * @errors None.
 */
// Contract values: Claude Code hooks/runtime matrix, read 2026-10-12; installer timeout in settings.mjs.
// Chosen 2026-10-21 (R-2480): two retries cover a transient registry or file-lock failure; 5 s lets it clear within the CI job. npm 10 and npm 8 error leads (R-2481).
export const PI_SUBAGENTS_RETRY = { attempts: 3, pauseMs: 5000, codeLeads: ["npm error code ", "npm ERR! code "] };
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
// PATH and skill rows are checks after R-1610 and R-1900.
export const DOCTOR_NOTES = {
  darwin: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
  linux: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
  win32: ["pi agent dir", "pi mcp.json", "desk service", "release status", "Claude Code hooks floor"],
};
// Hook input samples and report budget are contract values from Claude Code docs, read 2026-10-12.
export const SAMPLE_INPUTS = {
  session: { source: "startup", transcript_path: "", cwd: "" },
  prompt: "How does nana install-check validate this fixture?",
  verifier: {
    bashHit: "npm test | tail -1 && git commit -m done",
    bashMiss: "git status",
    powershellHit: "npm test | Select-Object -Last 5 && git commit -m x", // Chosen 2026-10-20: a `;` no longer asks (R-2350).
  },
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
// Contract values: nana-post-edit command matching, placeholder substitution and failure-line
// shape, read 2026-10-20. The fixture name and item are chosen to identify this live check.
export const PI_TURN_EDIT = (() => {
  const exitCode = 3; // Chosen 2026-10-20: distinct from could-not-run statuses 1, 126, 127 and 9009 (R-2000).
  return {
    item: "pi post-edit", // Contract: install-check result item (R-2002).
    tool: "write", // Contract: pi's file-writing tool, whose result nana-post-edit extends (R-2002).
    file: "install-check-post-edit.txt", // Chosen 2026-10-20: dedicated fixture file (R-2000).
    match: "install-check-post-edit\\.txt$", // Contract: only the dedicated fixture filename matches (R-2000).
    placeholder: "{file}", // Contract: nana-post-edit file placeholder, read 2026-10-20 (R-2000).
    failureLead: "- check ", // Contract: nana-post-edit failure-line lead, read 2026-10-20 (R-2002).
    exitCode,
    source: `process.stdout.write(require('fs').readFileSync(process.argv[1],'utf8'));process.exitCode=${exitCode}`, // Contract: print the edited file and fail (R-2000).
    exitText: `exited ${exitCode}`, // Contract: nana-post-edit nonzero-exit wording, read 2026-10-20 (R-2002).
  };
})();
// Contract values: pi 1.0.2 cli.md and windows.md, read 2026-10-20; powershell is off by
// default and --tools replaces the active selection. The item name identifies this live check.
export const PI_TURN_POWERSHELL = {
  item: "pi powershell gate", // Contract: install-check result item (R-2004).
  tool: "powershell", // Contract: pi's Windows PowerShell tool name (R-2003, R-2004).
  platforms: ["win32"], // Contract: pi documents the tool as Windows-only (R-2003, R-2004).
  toolList: ["--tools", "read,bash,edit,write,powershell"], // Contract: preserve defaults and enable powershell (R-2003).
};
// Contract values: pi-review.mjs, review-round.mjs and review-standard.md, read 2026-10-20;
// fixture-only names and folders are chosen to isolate this deterministic live review.
export const PI_REVIEW = (() => {
  const fixture = "packages/nana-setup/lib/install-check-review.mjs"; // Chosen: setup-owned fixture outside registered extension folders (R-2076).
  const provider = "nana-install-check-review-fixture"; // Chosen: distinct from the turn fixture provider (R-2071, R-2072).
  const model = "nana-install-check-review"; // Chosen: distinct from the turn fixture model (R-2071, R-2072).
  const verdict = "LAND"; // Contract: the accepted review verdict (R-2073, R-2074).
  return {
    fixture,
    provider,
    model,
    args: ["--offline", "-e", fixture, "--provider", provider, "--model", model, "--no-session", "-p"], // Contract: deterministic offline pi invocation (R-2071, R-2072).
    launcherArgs: ["--retries", "0"], // Chosen: one deterministic attempt exposes a flaky launch (R-2071, R-2072).
    runs: {
      default: [{ label: "pi-review", item: "install-check-review", form: "path" }], // Contract: one path launch off Windows (R-2071, R-2073).
      win32: [{ label: "pi-review (cmd)", item: "install-check-review-cmd", form: "cmd" }, { label: "pi-review (sh)", item: "install-check-review-sh", form: "sh" }], // Contract: cmd then Git Bash, with separate ledger items (R-2072, R-2073).
    },
    repoFolder: "review-repo", // Chosen: dedicated repository in the temporary home (R-2070).
    outFolder: "review-out", // Chosen: review output stays outside the reviewed repository (R-2071, R-2072).
    fixtureFile: "review-fixture.txt", // Chosen: one sealed committed fixture (R-2070).
    fixtureText: "nana install check review fixture\n", // Chosen: deterministic committed fixture content (R-2070).
    commitMessage: "Add install check review fixture", // Chosen: deterministic fixture commit message (R-2070).
    gitOptions: ["-c", "user.name=Nana Install Check", "-c", "user.email=nana-install-check@example.invalid", "-c", "commit.gpgsign=false"], // Chosen: supply identity and disable inherited signing (R-2070).
    prompt: "Review the install check fixture", // Chosen: shell-neutral plain words (R-2071, R-2072).
    answer: "The install check fixture meets the review brief.", // Chosen: deterministic faux-model answer (R-2073).
    verdict,
    verdictLine: `VERDICT: ${verdict}`, // Contract: review-standard.md final-line shape (R-2073).
    record: ".nana-install-check-review.json", // Chosen: isolated fixture observation record (R-2075).
    tally: [".pi", "agent", "review-ledger.rounds.jsonl"], // Contract: review-round.mjs user-home tally (R-2074).
    standard: "packages/nana-pack/prompts/review-standard.md", // Contract: pi-review.mjs appended review standard (R-2075).
    role: "reviewer", // Contract: pi-review.mjs child role (R-2075).
  };
})();
// Probe 2026-10-19: RPC output with pi-subagents was 21,699 bytes and placed a widget after
// byte 20,970. The unavailable word is chosen to cover nana's explicit degraded-state notices.
export const PI_SESSION = { unavailableWord: "unavailable", maxOutput: 100000 };
// Chosen 2026-10-12: bound network and doctor subprocesses within the 20-minute CI job.
// Probe 2026-10-19: the offline faux turn took 0.66 s; 60 s leaves cold Windows runner headroom.
// Chosen 2026-10-20: review gets 180 s, above one 75 s stall bound plus its 15 s poll (R-2073).
export const SPAWN_TIMEOUT_MS = { install: 300000, pi: 300000, list: 60000, session: 60000, turn: 60000, review: 180000, hook: 5000, doctor: 120000, git: 30000 };
// Contract values: the macOS and Windows fresh-machine checklist rehearsal grammar and sandbox shape
// (R-1540 to R-1546, R-1853 to R-1855), chosen 2026-10-19 to run each checklist as written.
export const README_REHEARSAL = {
  item: "readme checklist", // contract: the install-check result-line item name (R-1540)
  readme: "README.md", // contract: the rehearsed document, read from the repo root (R-1540)
  heading: { darwin: "### Fresh machine (macOS), in order", win32: "### Fresh machine (Windows), in order" }, // contract 2026-10-19: each platform's root README checklist heading (R-1540, R-1853)
  platforms: ["darwin", "win32"], // chosen 2026-10-19: only platforms with a root README checklist run the rehearsal (R-1540, R-1853)
  home: "readme-home", // chosen 2026-10-19: a folder distinct from the install-check home, never reused (R-1540)
  npmPrefix: ".npm-global", // chosen 2026-10-19: stands in for step 1's writable global npm prefix (R-1542)
  npmPrefixBin: { darwin: "bin", win32: "" }, // contract 2026-10-19: npm global launchers live under prefix/bin on macOS and the prefix itself on Windows (R-1542, R-1855)
  binOnPath: { darwin: false, win32: true }, // chosen 2026-10-19: Windows step 5 cannot edit the user Path during a hermetic rehearsal (R-1855)
  shell: { darwin: "/bin/zsh", win32: "cmd.exe" }, // contract 2026-10-19: the shells named by the two checklist paths (R-1542, R-1854)
  shellArgs: { darwin: ["-l", "-c"], win32: ["/d", "/v:off", "/s", "/c"] }, // contract 2026-10-19: login zsh and verbatim cmd invocation arguments (R-1542, R-1854)
  commandLeads: ["Run", "then"], // contract: the README's own command grammar (R-1541)
  expectLead: "expect", // contract: the README's own expectation grammar (R-1541)
  droppedEnv: ["ZDOTDIR"], // chosen 2026-10-19: a caller's ZDOTDIR would redirect the rehearsal's login shell away from its home (R-1542)
  answers: [{ prefix: "nana-setup trust ", append: "--yes" }], // chosen 2026-10-19: no terminal is present to answer the trust prompt (R-1543)
  stepTimeoutMs: 300000, // chosen 2026-10-19: bounds one step, including step 2's network pi install, within the CI job (R-1545)
  maxOutput: 1000000, // chosen 2026-10-19: step 8's doctor output runs 7.5-7.9 KB today; headroom beyond the 10,001-character hook cap (R-1544)
};
