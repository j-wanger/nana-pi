Feature: FEAT-031 · Run checks reliably and without contaminating work

# Plan: records-move — old review records leave the working tree

Roadmap step 4 of the reduction priority (owner adopted the roadmap 2026-11-08; the seat replaced step 4's memory-scoring cut, already done by memory-cuts, with this move and told the owner). `docs/reviews/` holds 6,668 tracked files and about 1.71 million lines across 352 folders: 93% of the repo's lines. The code (packages, apps, scripts, templates) is about 150,000 lines. Every folder stays readable in git history.

Also in this lane: the current priority's measure "net lines removed from main since 2026-11-07" becomes "net code lines removed from packages, apps, scripts and templates since 2026-11-07", so moving records cannot stand in for cutting code.

Requirement IDs: R-3928–R-3934.

## Must-meet tests

- M1. After the move, every folder left under `docs/reviews/` is named by a tracked file outside `docs/reviews/` (code, tests, READMEs, `REQUIREMENTS.md`, `AGENTS.md`, `HANDOFF.md`, the plan folder), or belongs to a lane with an open pull request. A check lists any other folder by name and fails.
- M2. `docs/reviews/README.md` names the commit that last held the removed folders and gives the one git command that lists and reads a removed folder from it; the readme check runs that command and it succeeds.
- M3. Every path under `docs/reviews/` named by `REQUIREMENTS.md`, a README, code or a test still exists (the requirements trace, readme check and map check stay green, and a new check covers code and test comments).
- M4. The lane launchers still read a lane's review brief from `docs/reviews/<lane>/` and the memory-run reader still finds a lane folder on main: their existing tests pass unchanged.
- M5. The current priority line in `OBJECTIVE.md` carries the code-lines measure; the objective output prints it in full.

Session logs under `docs/sessions/` keep their dated references to removed folders; they are history, and M2's pointer resolves them.

## Threat model

Honest variation: folders in flight on other lanes, paths named in prose or code comments, Windows path separators. Deliberate forgery is out.

## Precedent

- Path-existence checks over tracked files: `scripts/readme-check.mjs`.
- Lane review folder reader: `packages/nana-pack/lib/memory-run.mjs` (line 69).
- History-folder exemptions: `docs/evidence` handling in the experiment-cut tests (`git grep -n "docs/evidence" -- packages/nana-pack/tests`).
