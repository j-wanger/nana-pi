# Plan: load-log (2026-11-06)

Lane: `load-log`, worktree `~/nana-pi-wt/load-log`, branch `feat/load-log` from main `2c0a3e4a`. Ask #341 (optional, default go). Adversary pass by the laptop seat, taken in full.


## Purpose
Agreed reading: the priority's appetite line "every role the lane process runs has a named roster slot and a logged load per launch" (OBJECTIVE.md, 2026-11-02), and ask #341 (optional, default go). The audit (FINDINGS #54) found that lane builders and pi reviewers load the repo's context file (3,190 words in a nana-pi worktree), and the load log omits it. The roster slot is set on one pi-worker path only. This lane extends R-3215's load line. It changes no delivery.

## Assumptions
- A1: Only pi-runtime children are in scope: pi-worker's pi builder and role entries, and pi-review. Claude Code children (claude-review, a Claude Code builder) discover CLAUDE.md through Claude Code's own rules and exclude ancestor files (R-3219). Their part is left out and recorded as a known bug. This may be wrong if the owner wants the Mac reviewer (claude-review, 149 of 338 lines) covered now.
- A2: The log records what pi would load for the child's actual cwd and active agent dir at spawn. The file content can change during the run; that is not tracked.
- A2b: the cwd logged is the one the child pi actually runs in. For pi-review that's its temp checkout, not sourceRoot (adversary finding: the current line records sourceRoot).
- A3: pi-review has no land identity today: `--role` is a free label the seat passes. The slot is `land` when `--role land` is given, and `reviewer` otherwise. The seat passes `--role land` for land reviews, recorded in the seat guide as one line in this lane.
- A4: the agent dir passed to the loader is the one the child resolves from its own env (pi-worker spawns with a sealed env), not the parent's.

## Open choices
- O1 (decided by seat and adversary, 2026-11-07): call pi's own exported `loadProjectContextFiles({cwd, agentDir})` from the installed pi package entry (`dist/index.js`, never a `dist/core/` path). Don't mirror the walk. nana-pack lists pi as an optional peer dependency, so the global package is located at runtime.
- O2 (builder): the locator. pi-watchdog's `piLaunch` already finds the pi package dir from the pi binary on win32 (package.json name checked). Move that package-dir part into a shared nana-pack lib module, used by pi-watchdog and the new logging, and add the POSIX case: the real path of `pi` on PATH, up to the package dir, same name check. That's a private helper's second caller, so it moves rather than being copied (ruling 2026-10-22). Don't add a second `npm root -g` path.

## Questions for the owner
None.

Feature: FEAT-041 · Shape each agent's context by role

## Threat model
Honest variation in our tools' output is in scope: symlinked cwd, linked worktrees, both AGENTS.md and CLAUDE.md in one folder, an unreadable or missing file, a cwd-relative agent dir. Deliberate forgery of log lines or context files is out. A finding outside this model is a residual.

## Precedent
- `packages/nana-pack/lib/context-load-log.mjs` — contextPart and appendContextLoad. New parts use contextPart (name 'context file', source = absolute path, full = delivered = file chars).
- `packages/nana-pack/bin/pi-worker.mjs` — the role path at line 150 already sets `slot`. The lane path at line 248 copies that field from `selectedSlot`.
- `packages/nana-pack/bin/pi-review.mjs` — the onSpawn record at line 241 gains the parts and `slot`.
- `packages/nana-pack/tests/context-anatomy.test.mjs` — the R-3215/R-3216 tests are the pattern for new tests (exact part counts, default-home resolution).
- `packages/nana-pack/bin/pi-watchdog.mjs` — piLaunch's win32 package-dir locator (lines 52–80), to be moved to a shared lib and reused (O2).
- `packages/nana-setup/bin/nana-setup.mjs` — lines 508–520 dynamic-import an installed pi module at runtime: the import pattern, not the npm-root lookup.

## Outside precedent
pi coding agent (@earendil-works/pi-coding-agent, MIT), `dist/core/resource-loader.js` `loadProjectContextFiles`: adopt: called directly through the package entry.

## Must-meet
1. R-3726: delegation. With a stub pi package on the locator's path whose `loadProjectContextFiles` returns two entries (`/SENTINEL/A/AGENTS.md`, 1234 chars; `/SENTINEL/B/AGENTS.md`, 56 chars) and whose package.json version is `9.9.9-stub`, a lane-worker spawn line carries exactly those two 'context file' parts in that order, with full = delivered = the returned content length, and `piVersion: 9.9.9-stub`. The content string itself never appears in the line.
2. R-3727: real pi. Against the installed pi, a fixture folder holding both AGENTS.md and CLAUDE.md gives one part, AGENTS.md. Skipped with a stated reason where pi isn't installed.
3. R-3728: agent dir from the child's env. When the child's env points the agent dir at a temp dir containing AGENTS.md and the parent's agent dir has none, that file appears as a part.
4. R-3729: pi-review. Its line records the cwd the child pi runs in (its checkout), lists that checkout's context-file parts, and logs slot `land` for `--role land` and `reviewer` otherwise. Both cases are pinned.
5. R-3730: every pi-worker lane line carries `slot` (builder or largerBuilder) matching the selected entry. Both sizes are pinned.
6. R-3731: -nc honoured. When the child's args contain `--no-context-files` or `-nc`, the line carries one part `context files: disabled (-nc)` and no file parts. Pinned for pi-worker and for pi-review (args from config).
7. R-3732: unavailable. If pi can't be located, the export is missing, or the call throws, the line carries one part `context files: unavailable (<reason>)`, the other parts stay logged, delivery and the child's arguments stay unchanged, and the launch proceeds (extends R-3216). Fixture: a stub package with no export.

Lane class: gate: packages/nana-pack/bin/pi-review.mjs — review tool (scripts/lane-class.mjs).

## Build notes
- Requirements first: add rows R-3726 to R-3732 under FEAT-041 in REQUIREMENTS.md, then the tagged tests in `packages/nana-pack/tests/context-anatomy.test.mjs` (or a new test file beside it), then the code.
- Add one seat-guide line to `packages/nana-setup/claude/rules/nana-seat.md`: land reviews pass `--role land` to pi-review.
- Add one known-bug line to `docs/known-bugs/FEAT-041.md`: Claude Code children (claude-review, the Claude Code builder) log no context-file parts.
- Update R-3215's contract notes in the pack README where the load-line fields are listed (`slot`, `piVersion`, the new part names).
- Run the code map and README checks, and the touched tests. Commit locally. Don't push.
- Report: branch, full tip, checks run, and every departure from the Precedent list with a reason.
