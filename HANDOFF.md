# Handoff — nana-pi frontier

*Frontier only. One line per live decision: rewrite, don't accumulate. The live sections come first, then Landed, then the Known bugs pointer.*

**`OBJECTIVE.md` holds the objective and current priority.** Both runtimes print it at session start, with the umbrella lines from `~/nana-agent-loop/OBJECTIVE.md` below.

## Where things stand

- **The desk = "nana code"** (`apps/desk`), :7317 via `com.nana.pi-desk`, plus the two dashboards (:7320 / :7321). Frozen by the owner on 2026-10-10 until the owner reopens it; its two signing-key violations stay declared limits meanwhile. The seat parked its eight deliverables on 2026-10-22; reopening the desk deletes their park lines.
- **Current priority: reduction (the owner, 2026-11-08).** Cut machinery that does not earn its cost and keep the core working. The order and measures are in `OBJECTIVE.md`. Review on 2026-11-22.
- **UI build briefs (2026-11-05).** A lane that builds a page a person looks at writes its brief from the UI brief template. The template rests on the laptop seat's experiments; the owner chose a rule only.
- **Builder context (2026-11-06).** Builders get four lessons lines; fix briefs marked `Card: fix` may skip Precedent. Plans state each caller's observable contract.
- **Load log (2026-11-06).** Each pi builder and pi reviewer launch now logs the context files pi loads, the pi version and the roster slot. Claude Code launches still log no context files.
- **Seat knowledge lookup retired (2026-11-06).** Claude Code seats no longer get per-prompt knowledge pointers; `nana-knowledge query` stays. Re-run `nana-setup install` to remove the hook.
- **Leak guard (2026-11-07).** Before every lane push the seat runs `leak-scan.mjs` chained with `&&`; builds warn on leaked paths.
- **Memory factory paused (2026-11-07).** The owner paused it and kept its code. Seat memory delivery is not building.

## Next

The live next items are the open issues labelled `next` at https://github.com/j-wanger/nana-pi/issues. Session start lists them.

## Open for the owner

The owner's open questions are the open issues labelled `ask` at https://github.com/j-wanger/nana-pi/issues. Session start lists them. The issues and the replies on them are public.

## Landed

- 2026-09-18 to 2026-10-23: moved verbatim to the October session archive (`docs/sessions/2026-10.md`), all but the newest.
- 2026-10-26: product cards show one line per deliverable; feature pages hold the claims and artifact cards; the flow lines retired.

## Known bugs

Known bugs live one line each in `docs/known-bugs/`, one file per feature, plus `docs/known-bugs/unplaced.md`. Desk known limits live in `apps/desk/README.md`.
