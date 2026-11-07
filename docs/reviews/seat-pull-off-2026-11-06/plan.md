# Plan: seat-pull-off (2026-11-06)

Lane: `seat-pull-off`, worktree `~/nana-pi-wt/seat-pull-off`, branch `feat/seat-pull-off` from main. Lane class: `install` (scripts/lane-class.mjs: nana-setup library), so it gets the full ladder and the local install check.

## Purpose
Agreed reading: the owner, 2026-11-06, took the seat's recommendation on #342: drop the seat's per-prompt knowledge lookup and keep the search command. Evidence (seat-measured, approximate): in Claude Code seat sessions with a matching transcript, 17 of 871 suggested files were opened later (about 2%). The hook also fires on cross-session messages. This retires the 10-09 arrangement that the seat keeps its pull until a re-measure.

## Assumptions
- A1: scope is the Claude Code seat's UserPromptSubmit hook only, because that's what was measured. pi's `before_agent_start` extension (R-233) stays: its 686 pi entries couldn't be matched to transcripts, so no measure covers it. A known-bug line records that pi seat sessions still pull, because their 686 entries are unmatched, not measured useful. So "kept" doesn't read as "validated".
- A2: the index, sources.json, build and `nana-knowledge query` / search stay unchanged. Doctor's index and sources rows stay, since search still needs them.
- A3: an existing install keeps the hook until the owner runs `nana-setup install`. Install then removes it, and doctor names it until then.

## Open choices
- O1 (builder): whether the retired knowledge entry joins `removeRetiredContextHook`'s exact-match list or gets its own function beside it. Either way it uses that function's match rules: only installer-shaped entries, both shell and win32 exec forms, foreign entries kept.

## Questions for the owner
None.

Feature: the builder reads the tree and picks the feature that owns the Claude Code knowledge hook (the installer's hooks feature or the knowledge pull feature), and names it in the report.

## Threat model
Honest variation is in scope: shell-form and exec-form entries, a quoted path with spaces, a foreign UserPromptSubmit entry beside ours, a settings.json with no hooks, a win32 checkout. Deliberate forgery of settings entries is out.

## Precedent
- `packages/nana-setup/lib/settings.mjs` — `removeRetiredContextHook` (line 295) is the pattern for removing an exact retired entry. `desiredHooks` (around line 217) drops the knowledge entry, and `installerKnowledgeTarget` keeps matching it for removal.
- `packages/nana-setup/lib/doctor.mjs` — `retiredSettingsCommands` (line 60) and its FAIL row (line 475): a still-wired knowledge hook is reported the same way.
- `packages/nana-setup/lib/hook-health.mjs` — drops the "UserPromptSubmit knowledge pull" wanted row.
- `packages/nana-setup/lib/install-check.mjs` — drops the Claude Code "hook knowledge pull" expectation (line 520). The pi-turn knowledge checks stay (A1).
- `packages/nana-setup/tests/retired-artifacts.test.mjs` — the pattern for deregistration tests in isolated homes.
- `templates/_shared/working-under-nana-pi.md` — the runtime table's Claude Code "Knowledge pull" cell becomes the search command only. Regenerate the copies its generator owns.

## Outside precedent
none: the change removes one of our own hooks. I looked at Claude Code's hook docs only for the settings shape, which is unchanged.

## Must-meet
1. R-3739: install writes no UserPromptSubmit knowledge entry on POSIX or win32. Every other nana hook is written as today.
2. R-3740: install removes an existing installer-shaped knowledge entry, in shell and in exec form, including a quoted path with spaces, and keeps a foreign UserPromptSubmit entry byte for byte.
3. R-3741: doctor reports a still-wired knowledge hook as a retired hook (FAIL), naming the command and the fix `nana-setup install`, and no longer reports its absence. FAIL is safe: the seat grep found no launcher or preflight that gates on doctor. The install check runs doctor only on a fresh install, which has no retired entry.
4. R-3742: uninstall on a machine that still has the entry removes it, as today.
5. R-3743: the install check no longer expects the Claude Code knowledge hook. Its pi-turn knowledge checks are unchanged.
6. R-3745: inside one UserPromptSubmit matcher group, install removes only the knowledge command and keeps sibling commands byte for byte. It drops the group only when it's left empty. Today's removeRetiredContextHook leaves empty groups, so pin the behaviour either way.
7. R-3746: the nana-knowledge README's hook section says the Claude Code hook is retired (the 2% measurement, #342) and points to `nana-knowledge query`, so a manual setup doesn't re-add it.
8. R-3744: `nana-knowledge query` still returns results from the index after install (search unchanged).
Requirement rows that describe the Claude Code pull hook become `retired`, with this lane named.

## Build notes
- Requirements first, then tagged tests, then code.
- After the land, the laptop seat runs doctor on its real settings.json (no knowledge hook wired) and expects no knowledge-hook row and no FAIL.
- The seat runs `node packages/nana-setup/bin/install-check.mjs` locally on macOS before the land (owner, 2026-10-12).
