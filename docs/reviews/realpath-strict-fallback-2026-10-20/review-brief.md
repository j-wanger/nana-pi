# Review — realpath-strict-fallback (a strict real-path lookup falls back to Node's JavaScript lookup when the native one fails, so doctor, the stale-copy line, uninstall and the land and review tools work on such a volume), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment (uninstall's row under FEAT-018)

Review `git diff c7f582ad..HEAD` on `feat/realpath-strict-fallback`. The lane branched from main `54433844`; the seat
merged main `aa5f25cd` at `9c16aca1` and main `c7f582ad` at `6cbd0f76`, so `git merge-base HEAD main` is `c7f582ad`,
and that diff is the lane's own change. Main has since moved to `a112fd30` (notify-lifecycle-pins and
mutation-runner-takeover-race landed; neither touches `real-path.mjs`, the lane's tests or the setup README), so the
land needs a merge of main, a regenerated code map and tree, and a confirmation round on the merged tip.

The plan of record is `docs/reviews/realpath-strict-fallback-2026-10-20/must-meet.md`: five must-meet checks, rows
R-2180 to R-2184 (block R-2180 to R-2189), the design and the known limits. `plan-attack.md` holds the adversary's
AMEND. `build-brief-1.md` is build 1 (`dd684f3f`: the one code change, both test files, the READMEs and rows);
`build-brief-2.md` is build 2 (`f38af41b`, tests and row text only), which came from the seat's pairs: R-2180 now
samples a path through a link, and the rows take the must-meet text word for word. The seat's record is
`seat-verify-6cbd0f76.md`: CI run 39408045115 on draft pull request #123 at 6cbd0f76, 0 failing files on all three legs,
with R-2180 to R-2183 passing natively on Windows and R-2184 skipped there as POSIX-only (`ci-windows-6cbd0f76.log`
beside it); the wrong-code pairs (`seat-mutate.mjs`; 5 of 5 red on 9c16aca1, where M5 left R-2180 green, and 5 of 5
red on f38af41b, where M5 turns it red; macOS, POSIX and forced-win32 forms); and the independent check
(`independent-check-6cbd0f76.md`: HOLDS, no MUST, seven probes plus the must-meet files, run on build 1, 9c16aca1; its
two known bugs recorded as residuals). The local macOS install check runs before the land.

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

CAP-04 moves from 474 to 479 rows, FEAT-015 from 124 to 128 and FEAT-018 from 22 to 23.

The code under review: `realPath`'s catch in `packages/nana-pack/lib/real-path.mjs` (on a native error other than a
missing file it tries `fs.realpathSync(abs)` with or without `mustExist`, and only when that also throws does it
rethrow under `mustExist` or return `abs` without it), its header and doc comment; one sentence in
`packages/nana-pack/README.md`; one Known-limits bullet and a tests-table row in `packages/nana-setup/README.md`. No
nana-setup code changes: every strict compare inherits the fallback. The checks sit in the new
`packages/nana-pack/tests/real-path.test.mjs` (R-2180, R-2181; patches `fs.realpathSync.native` in-process) and
`packages/nana-setup/tests/realpath-fallback.test.mjs` (R-2182 to R-2184; a preload written into the temp root at run
time throws EISDIR for every native result inside the checkout).

Judge whether, when Node's native lookup fails for a reason other than a missing file and the JavaScript lookup works,
realPath returns the JavaScript lookup's result with or without `mustExist`, so doctor gives a home installed under
that failure the rows it gives with a working lookup, the stale-copy producer prints nothing, and uninstall's preview
exits 0 with the same would-unlink rows. Judge whether a path both lookups refuse still throws under `mustExist` and
comes back unchanged without it; whether realPath's results are unchanged wherever the native lookup works; and whether
nana-land and review-round stay fail-closed under the failure. Judge too whether each check would fail with its
behaviour removed: the pairs cover macOS in both forms; on Windows only CI's native passing run exists.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows, including a
volume where Node's native path lookup fails and its JavaScript lookup works, which the tests inject); deliberate
forgery is out. Lane class: install, hook or gate — the pack's real-path function sits behind nana-setup install,
doctor and uninstall, the session-start stale-copy producer, a pi extension's dependency (`linkOk`), and the land and
review tools' path compares.

Check: (1) the must-meet checks are not vacuous: each named pair turns its check red, M1 (main's catch) turns R-2180 and
R-2182 to R-2184 red, and the setup checks fail rather than skip when the preload does not fire; (2) no fail-open:
under the failure nana-land still refuses a non-LAND verdict and a worktree spelled another way, uninstall removes
nothing it did not before, and a path both lookups refuse still throws under `mustExist`; (3) nothing main does today
stopped working where the native lookup works: realPath's results, the gate, install, doctor, uninstall and the land
and review tools, on any of the three CI legs; (4) the tests write only inside the temp folders they own, restore the
patched function, and commit no fixture; (5) HANDOFF and the session entry are true, including the removed
setup-checkout-spelling residual, the kept loose-lookup residual and the seven new residuals; (6) any MUST.

## Base note (the seat, after this brief was written)

Since `c93b3d7e`, the seat merged main `c203f485` (the handoff-cap-surrogate land tip, after notify-lifecycle-pins and mutation-runner-takeover-race) into the lane at `a17813f7`, regenerating the code map and the requirements tree. Review this lane's own change as `git diff main...HEAD` (three dots: against the merge base) and the merge as `git show --remerge-diff a17813f7` if your git supports it. This merge is the one the seat record asks for, so this round covers the merged tip; no separate confirmation round is planned.
