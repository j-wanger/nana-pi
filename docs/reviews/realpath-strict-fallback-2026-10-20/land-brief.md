# Review — realpath-strict-fallback (a strict real-path lookup falls back to Node's JavaScript lookup when the native one fails, so doctor, the stale-copy line, uninstall and the land and review tools work on such a volume), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment (uninstall's row under FEAT-018)

Review `git diff c7f582ad..HEAD` on `feat/realpath-strict-fallback`. The lane branched from main `54433844`; the seat
merged main `aa5f25cd` at `9c16aca1` and main `c7f582ad` at `6cbd0f76`, so `git merge-base HEAD main` is `c7f582ad`.
Main has since moved to `a112fd30` (notify-lifecycle-pins and mutation-runner-takeover-race landed; neither touches
`real-path.mjs`, the lane's tests or the setup README), so the land needs a merge of main, a regenerated code map and
tree, and a confirmation round on the merged tip. The plan of record is
`docs/reviews/realpath-strict-fallback-2026-10-20/must-meet.md`: rows R-2180 to R-2184 (block R-2180 to R-2189).
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds (`dd684f3f`;
`f38af41b`, tests and row text only). The seat's record is `seat-verify-6cbd0f76.md`: CI run 39408045115 at 6cbd0f76,
0 failing files on macOS, Ubuntu and Windows, with R-2180 to R-2183 passing natively on Windows
(`ci-windows-6cbd0f76.log` beside it); the macOS wrong-code pairs in POSIX form and forced win32 (`seat-mutate.mjs`; 5
of 5 red on 9c16aca1 and on f38af41b); and the independent check (`independent-check-6cbd0f76.md`: HOLDS, no MUST,
seven probes, run on build 1, 9c16aca1). The final reviewer's brief is `review-brief.md`. The local macOS install
check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement c7f582a..6cbd0f7: 5 rows in 2 features
FEAT-015 · Diagnose the active environment
  R-2180 new (implemented)
  R-2181 new (implemented)
  R-2182 new (implemented)
  R-2183 new (implemented)
FEAT-018 · Update or remove managed components safely
  R-2184 new (implemented)
```

The code under review: `realPath`'s catch in `packages/nana-pack/lib/real-path.mjs`. On a native error other than a
missing file it now tries `fs.realpathSync(abs)` with or without `mustExist`; before, `mustExist` rethrew at once. No
nana-setup code changes, so every strict compare inherits the fallback: `linkOk` (the stale-copy producer, shared with
pi's rulings extension), `skillLinkState`, `knowledgeHookHealthy`, the win32 hook-health rows, uninstall's `repoReal`,
preflight and per-link removal targets, install's retired-hook compares, and the path compares in `bin/nana-land.mjs`,
`bin/review-round.mjs` and `bin/pi-review.mjs`. `nana-setup install`, doctor and uninstall run these over the owner's
real home; the Claude Code adoption hook and pi's rulings extension run the stale-copy check at every session start.

Judge whether the lane fails open: nana-land landing without a verified LAND, or past a non-LAND verdict, or on a
worktree spelled another way; uninstall taking a link outside the checkout for one of its own and unlinking an
owner's link; install or doctor taking a foreign link or hook entry for this checkout's; or the stale-copy line going
silent while a copy is stale. The independent check probed nana-land under the injected failure and found it
fail-closed (P3, P4), and a real uninstall under the failure matched its control (P6). One case is inferred, not run:
on a failing volume pi-review compares git's `--show-toplevel` spelling with the typed `--out` spelling (lines 74 and
171 to 175), so a case-variant `--out` inside the tree could read as outside it and skip the redirect into the temp
checkout, where main refuses to start; judge whether that lets a review's own output change its revision. Judge whether
the lane leaves a harm the review standard lists: data lost or corrupted in the home, a broken install or hook, or a
test writing outside the temp folders it owns. Judge whether anything main does today stopped working: realPath's
results where the native lookup works (P1: 13 paths, loose and strict, 0 differences), the gate (P2), install, doctor,
uninstall, the land and review tools, and the existing test files, on any of the three CI legs. The plan's known limits
that HANDOFF records (typed-spelling compares on a failing volume, so a second spelling of the checkout reads as another
checkout and two spellings make two review items; no RAM disk or cloud-drive run; three tools still on the native
lookup only; no check of install's own compares; one injected code) are known limits unless the review standard lists
them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows, including a
volume where Node's native path lookup fails and its JavaScript lookup works, which the tests inject); deliberate
forgery is out. Lane class: install, hook or gate — the pack's real-path function sits behind nana-setup install,
doctor and uninstall, the session-start stale-copy producer, a pi extension's dependency, and the land and review
tools.

Check: (1) no fail-open, the pi-review out-path case judged against the standard; (2) no listed harm; (3) nothing main
does today stopped working, on any of the three CI legs; (4) HANDOFF and the session entry are true; (5) any MUST.

## Base note (the seat, after this brief was written)

Since `c93b3d7e`, the seat merged main `c203f485` (the handoff-cap-surrogate land tip, after notify-lifecycle-pins and mutation-runner-takeover-race) into the lane at `a17813f7`, regenerating the code map and the requirements tree. Review this lane's own change as `git diff main...HEAD` (three dots: against the merge base) and the merge as `git show --remerge-diff a17813f7` if your git supports it. This merge is the one the seat record asks for, so this round covers the merged tip; no separate confirmation round is planned.
