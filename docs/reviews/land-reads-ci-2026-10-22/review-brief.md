# Review — land-reads-ci (nana-land waits for its tip's GitHub CI), 2026-10-22 (the final reviewer)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Class: gate (it changes `nana-land`, a land tool; no nana-setup file and no hook, so the local install check does not apply). Threat model: honest variation in our tools' output. Every GitHub run status and conclusion, re-run attempts, several runs for one SHA (pull request and push), several workflows (two may share a name), an empty list for an unpushed tip; gh missing, signed out, offline, behind a refused proxy, timing out, printing an error body or coloured output; GH_HOST and GH_REPO set elsewhere; origin URLs in https, scp and ssh forms, with or without `.git` or a trailing slash, a non-GitHub host, no origin; a tip that adds, edits or deletes workflows. Deliberate forgery out (a forged API response or a malicious gh on PATH).

Review `git diff b5b5f8c2..HEAD` on `feat/land-reads-ci`. Main is b5b5f8c2 (brief-reader-fixes). The lane branched from 61ac64f3 and merged main once at f2f3365f; the only conflict was the generated tree outline, which the seat regenerated with the code map. The lane's own commits: 5fe4dc05 (plan), 3d2953dc (build 1, the feature), 0cb153fc (the seat's pairs), 9a2f9705 (the independent check, Amendment 1, build brief 2), 7019e48b (build 2, Amendment 1), f16e6ac4 (pairs again), the merge, bb1dea86 (notes) and the final commit with this review's two briefs.

The plan of record is `docs/reviews/land-reads-ci-2026-10-22/must-meet.md`: decisions D1 to D12, rows R-2586 to R-2592, R-1070's reader line, the tunables and the known limits, plus Amendment 1 in `build-brief-2.md` (A1: gh's colour forced off and GH_FORCE_TTY dropped from its environment; A2: the re-run remedy names `--repo <owner>/<repo>`). `plan-draft.md` and `plan-attack.md` (M 4, S 5, N 12) are its inputs. D12 records the owner's two questions with the defaults taken: every lane waits for its tip's whole CI run, and nothing lands during a GitHub outage.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 19 red at 7019e48b (`seat-mutate-output-7019e48b.txt`); 17 were red at 3d2953dc. p18 and p19 cover Amendment 1; p4 was re-anchored to build 2's call.
- The seat's per-build diff check finds no removed line holding an escaped `\\n`, `\\r` or `\\t`, at either build.
- The independent check (`independent-check-3d2953dc.md`): one material problem (coloured gh output), fixed by build 2 under Amendment 1. Its other notes are FEAT-008 known bugs.
- Session titles: 0 missing. Build 2's locked full suite: `208 files: 206 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, req:tree, readme:check and the trace are green, and `land.test.mjs` passes 66 of 66.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b5b5f8c..bb1dea8: 8 rows in 2 features
FEAT-008 · Integrate and clean up reviewed changes
  R-2586 new (implemented)
  R-2587 new (implemented)
  R-2588 new (implemented)
  R-2589 new (implemented)
  R-2590 new (implemented)
  R-2591 new (implemented)
  R-2592 new (implemented)
FEAT-015 · Diagnose the active environment
  R-1070 Made by/Read by lines changed
```

CI runs on the draft PR at the reviewed tip, the Windows leg included; the PR's earlier tips ran no CI because the branch conflicted with main. The seat lands only on green, with this worktree's own `nana-land.mjs` (D11), so the land's own CI read is the first real one.
