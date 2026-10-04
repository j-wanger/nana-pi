# Review brief — pi 1.0 adoption lane (subagent floor, nana reviewer, doctor), reviewer: gpt-6-astra

Roles: `docs/reviews/pi-1.0-2026-10-04/ROLES.md` (Sonnet built it; you review; Fable rules on landing).
Worktree `~/nana-pi-wt/pi-1.0`, branch `feat/pi-1.0`, base `main` (`c0a7849`). Review `git diff main..HEAD` in full.

Read first, in this order (main checkout, `/Users/jwang/nana-pi/docs/reviews/pi-1.0-2026-10-04/`):
`architecture-ruling.md` (the contract), `subagent-diagnosis.md` (read the **Seat addendum** at the end: the
real cause was a shell-less builtin `reviewer` pulling the parent in for git/test output), `compat-audit.md`.
Ground truth for third-party behaviour (read-only, unpacked): `/private/tmp/claude-501/-Users-jwang-nana-pi/d9b1da6b-127d-44aa-bb69-ac17bcf2615f/scratchpad/pkgs/pi-subagents-0.75.0/package`
(src/, docs/, agents/, CHANGELOG.md) and `…/pkgs/earendil-works-pi-coding-agent-1.0.2/package`.

## What the change claims
1. `nana-setup install` seeds `<agent dir>/extensions/subagent/config.json` = `{asyncByDefault, forceTopLevelAsync, maxSubagentDepth:1}` only when absent, never rewrites it; `doctor` reads ✗ naming the key when it is missing, unparseable, or a load-bearing key is wrong.
2. It seeds `<agent dir>/agents/reviewer.md`, a nana-owned reviewer that shadows pi-subagents' builtin by name, adds `bash` for read-only evidence, and stops asking the parent for evidence.
3. `doctor` reads ✗ when installed pi-subagents is below 0.75.0, and `!` when an `mcp.json` server has no `exposure` while codemode auto-enable is not off.
4. Rows R-360–R-365 are `implemented`, each pinned by named tests.

## Attack these — each with evidence from source or an executed command
- **Does the seeded reviewer actually load and shadow the builtin in pi-subagents 0.75.0?** Trace agent discovery in src: the user-scope agents directory it scans (is it `<agent dir>/agents/`?), the precedence rule, and the frontmatter parser. The worker moved the nana marker from the file's first line to the first BODY line because the parser needs `---` at byte 0. Prove or disprove that the seeded file parses, keeps `name`/`description`, and wins over the builtin. If you can, run it: load pi-subagents' agent discovery against a temp agent dir holding the seed.
- **`maxSubagentDepth: 1`**: confirm from src that depth 1 still lets the PARENT launch children and blocks only children launching children. If depth 1 blocks the parent too, the whole fix is dead. This is the ruling's own most-likely-wrong claim.
- **The reviewer prompt**: `tools` drops `contact_supervisor`, but the body still talks about it. Is that coherent, and does the runtime inject `contact_supervisor` anyway? The body's opening paragraph (shadowing, ruling, gate doctrine) becomes part of the child's system prompt (`systemPromptMode: replace`). Does that matter?
- **Seed-if-absent vs. the floor**: a user who already has a config.json without the keys never gets them from install. Does doctor's ✗ and its fix text close that, without ever rewriting the file? Is the reviewer seed's "unmarked" ✗ right for a user's own reviewer.md?
- **Version check**: where does doctor read the pi-subagents version from, and is that where `pi install npm:pi-subagents@0.75.0` puts it (user scope; and the active agent dir under `PI_CODING_AGENT_DIR`)? What does doctor say on a machine with no pi-subagents at all?
- **Scope**: `readme-check.config.json` changed but was NOT on the build allowlist. Rule on it. The three test-file fixes (`desk-service`, `skills-and-standards`, `win32-degrade` seeding pi-subagents in their throwaway homes) were added by the seat: check that they weaken nothing.
- **Rows**: each row is EARS with ONE `shall`. For each `implemented` row, name the clause each cited test pins. A row is the weakest of its clauses.
- **Tests**: do they assert the invariant (behaviour), or mirror the implementation?

## Verdict format
Findings ranked, each: severity (MUST / SHOULD / NOTE), file:line, evidence (command + output or source line), smallest fix.
Then one line: `VERDICT: LAND` or `VERDICT: BLOCK`, and a score out of 10.
