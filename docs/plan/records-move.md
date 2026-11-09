Feature: FEAT-031 · Run checks reliably and without contaminating work

# Plan: records-move — old review records leave the working tree

Roadmap step 4 of the reduction priority (owner adopted the roadmap 2026-11-08; the seat replaced step 4's memory-scoring cut, already done by memory-cuts, with this move and told the owner). `docs/reviews/` holds 6,668 tracked files and about 1.71 million lines across 352 folders: 93% of the repo's lines. The code (packages, apps, scripts, templates) is about 150,000 lines. Every folder stays readable in git history.

Also in this lane: the current priority's measure "net lines removed from main since 2026-11-07" becomes "net code lines removed from packages, apps, scripts and templates since 2026-11-07", so moving records cannot stand in for cutting code.

Requirement IDs: R-3928–R-3934.

## Must-meet tests

- M1. Before deleting, the lane derives the protected folder set: every `docs/reviews/<folder>` named by a tracked file outside `docs/reviews/` and `docs/sessions/`, counting full paths, a folder name alone, brace forms such as `tranche{1,2}-2026-09-28` expanded, and a folder named only through a file basename that exists in exactly one folder. Folders last changed on or after 2026-11-01 are also protected (they may hold pending memory inputs, R-3293). A check fails when a protected folder is missing, and fails when an unprotected folder remains that is not a lane with an open pull request.
- M2. Protected folders keep every tracked file byte for byte: the check compares the tree's blob ids for those folders against the commit before the move.
- M3. `docs/reviews/README.md` names the commit that last held the removed folders and gives the one git command that lists and reads a removed folder from it; the readme check runs that command and it succeeds.
- M4. The memory-run reader returns the same pending evidence keys, with readable evidence, before and after the move, on a fixture with two eligible landed lanes including an earlier pending one; the lane launchers still read a brief from `docs/reviews/<lane>/`.
- M5. The current priority line in `OBJECTIVE.md` carries the code-lines measure; the objective output prints it in full.

Changed after the adversary (2026-11-08): M1 now protects folders named anywhere outside the records, including basename and brace forms, plus recent folders; M2 keeps protected folders whole; M4 pins pending memory inputs.

Session logs under `docs/sessions/` keep their dated references to removed folders; they are history, and M2's pointer resolves them.

## Threat model

Honest variation: folders in flight on other lanes, paths named in prose or code comments, Windows path separators. Deliberate forgery is out.

## Precedent

- Path-existence checks over tracked files: `scripts/readme-check.mjs`.
- Lane review folder reader: `packages/nana-pack/lib/memory-run.mjs` (line 69).
