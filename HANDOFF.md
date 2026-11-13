# Handoff — nana-pi frontier

*Frontier only. One line per live decision: rewrite, don't accumulate. The live sections come first, then Landed, then the Known bugs pointer.*

**`OBJECTIVE.md` holds the objective and current priority.** Both runtimes print it at session start.

## Where things stand

- **Current priority: start text into tools (the owner, 2026-11-12).** Keep each tool only where a sealed experiment shows it helps the objective. The order and measures are in `OBJECTIVE.md`.
- **Builder context (2026-11-06).** Builders get four lessons lines; fix briefs marked `Card: fix` may skip Precedent. Plans state each caller's observable contract.
- **Load log (2026-11-06).** Each builder and reviewer launch logs the context files its child loads. For Claude Code children, nana counts those files itself.
- **Seat knowledge lookup retired (2026-11-06).** Claude Code seats no longer get per-prompt knowledge pointers; `nana-knowledge query` stays. Re-run `nana-setup install` to remove the hook.
- **Leak guard (2026-11-07; hook 2026-11-10).** Setup installs a pre-push hook that scans each pushed range, including commit authors and messages. Builds warn on leaked paths.
- **Records out of the repository (2026-11-10).** Lane records go to a private folder outside the repository, never into it. Older records stay in git history; `docs/reviews/README.md` names the commits.
- **Memory factory cut (2026-11-09).** The owner chose to cut it. The owner profile store stays. Re-run `nana-setup install` on each machine to clear a stale session-end hook entry.

## Next

The live next items are the open issues labelled `next` at https://github.com/j-wanger/nana-pi/issues. Session start lists them.

## Open for the owner

The owner's open questions are the open issues labelled `ask` at https://github.com/j-wanger/nana-pi/issues. Session start lists them. The issues and the replies on them are public.

## Landed

- 2026-09-18 to 2026-10-23: moved verbatim to the October session archive, all but the newest. Git history keeps it: `git show 5667a251:docs/sessions/2026-10.md`.
- 2026-10-26: product cards show one line per deliverable; feature pages hold the claims and artifact cards; the flow lines retired.

## Known bugs

Known bugs live one line each in `docs/known-bugs/`, one file per feature, plus `docs/known-bugs/unplaced.md`.
