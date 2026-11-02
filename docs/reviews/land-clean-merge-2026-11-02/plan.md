Plan revision 2 — takes plan-attack.md (pi adversary: 3 MUST, 5 SHOULD, 1 NOTE). The seat took every MUST and SHOULD as written and the NOTE's policy-limit fixture. Q1, Q2 and Q3 defaults stand; regeneration of generated files is the next lane, land-regenerate-generated.

# Plan — lane land-clean-merge

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/bin/nana-land.mjs,packages/nana-pack/lib/land-config.mjs,packages/nana-pack/lib/land-ci.mjs,packages/nana-pack/tests/land-clean-merge.test.mjs,packages/nana-pack/tests/land-clean-merge-race.test.mjs,packages/nana-pack/tests/land.test.mjs,packages/nana-pack/tests/land-merge.test.mjs,packages/nana-pack/tests/rulings.test.mjs,packages/nana-pack/README.md,AGENTS.md,templates/_shared/working-under-nana-pi.md,packages/nana-pack/rules/nana-rulings.md,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md,docs/known-bugs/FEAT-008.md,docs/sessions/2026-10.md`, main 68a616bc):

`gate: packages/nana-pack/bin/nana-land.mjs — land tool`

Ladder: roster reviewer, land reviewer (or seat-land.md when the roster prints `land: seat`), the seat's wrong-code pairs, one independent check. The file list changes no `packages/nana-setup/` file and no hook, so the 2026-10-12 macOS install check does not apply (attack finding 9; confirmed by the line above). The lane does not touch `packages/nana-setup/claude/rules/nana-seat.md` on purpose, for the same reason.

## Purpose

The owner, 2026-11-02, verbatim: "no conflict lane merge needs no CI".

Agreed reading: when every reviewer accepted a lane tip and that tip's CI passed, and main has since moved, `nana-land` merges current main into the accepted tip itself. If git's merge has no conflict and the merge stays inside the supported semantics below, it lands that merge with no new CI run and no new review. A conflicting or unsupported merge refuses as today, and the lane goes back through a merge build.

Why: overnight, each land moved main and `nana-land` refused every other accepted lane ("main is not an ancestor of the source tip; fast-forward is impossible"). Each lane then did a merge build, a new ~30-minute CI run and a confirmation review. Lanes ran CI 4 to 25 times each.

Measurement (attack finding 4 — these are upper bounds, not delivered savings):

- Replay command, per lane merge build `m` on main's history: `git merge-tree --write-tree --name-only --no-messages $m^1 $m^2` (exit 0 clean, 1 conflict). The loop and its raw output are kept in the seat's scratchpad as `merge-measure.txt` (all history, 316 builds) and `recent.txt` (since 2026-10-27, 44 builds); the builder copies both into the lane folder as `merge-replay.txt` with the command line at the top.
- Since 2026-10-27: at most 14 of 44 historical merge builds would have been avoided under textual eligibility. How many of those 14 tips also had CI that stands in for the suite (A3) is unmeasured. 8 of 44 under the stricter no-shared-file reading.
- 12 more conflicted only in `docs/code-map.md` / `docs/requirements-tree.md`. 26 of 44 is a candidate upper bound for the next lane, unproven until a regeneration replay.
- In 10 of the 14 clean cases the builder's merge commit had git's merged tree exactly; the other 4 added only logs and known-bug lines. Equal trees show the merge build changed no content. They do not show the build and its review added no validation; the lane gives that validation up by policy (Q1).

## Assumptions

- **A1 — How the merge is made.** `git merge-tree --write-tree <tip> <capturedMain>`, run in the main checkout with `-c merge.renormalize=false`. Then `git commit-tree <tree> -p <tip> -p <capturedMain> -m <sealed message>`, and the existing in-lock `git merge --ff-only <M>`. No working tree is touched before the ff. Needs git ≥ 2.40 for `check-attr --source` (A2). Local git is 2.50.1; hosted runners are newer (inferred). An older git refuses by name.
- **A2 — Supported merge semantics (attack finding 2).** The merge path accepts only git's built-in three-way text merge with rename detection, as `merge-tree` does it by default. It refuses, naming the path and the reason, when any of these holds:
  1. Any `.gitattributes` file differs between the merge base, the tip and captured main.
  2. A path changed on both sides since the merge base carries a `merge` attribute (a driver, `union`, `binary` or `-merge`) in either parent, read with `git check-attr --source <commit> merge -- <paths>`. This keeps a configured driver from silently dropping one side.
  3. `merge-tree` exits other than 0 or 1, or prints output that is not one 40- or 64-hex tree id line, followed on exit 1 by conflicted names. Empty, truncated or extra output refuses as a git failure, never as clean or conflict.
  Renormalisation is off, so `core.autocrlf` and `text` settings do not change the merge. Rename/edit and same-file edits in separate hunks are supported. The README states these limits.
- **A3 — Eligibility.** The merge path runs only when all of these hold:
  - Main is not an ancestor of the tip.
  - Every existing review check passes on the tip, as today (R-976, R-1002, R-1004, R-1006, R-1011).
  - CI applies and the tip's newest runs all passed (R-2586–R-2591, still read for the tip's SHA only).
  - That CI stands in for the suite (R-3430).
  When CI does not apply, or cannot stand in, the merge path refuses; it never runs a local suite on the tip.
- **A4 — Proof-defining paths on either side (attack finding 1).** With `--no-renames`, `nana-land` lists the lane's contribution (`git diff --name-only <merge-base> <tip>`) and what main brings in (`git diff --name-only <tip> <M>`). If either list names a `SUITE_FALLBACK_PATHS` entry, the merge path refuses with a sealed reason naming the side. This covers a change, a delete, or a rename that only main made, since the tip's CI evidence then came from another runner or workflow. The fast-forward path keeps R-3432 unchanged.
- **A5 — Only nana-land's own merge is exempt.** The uncovered-commit check (R-1002) runs on the tip against captured main, unchanged. The one commit exempt from review is the one `nana-land` creates in the same run. A merge a builder made in the lane is a lane commit and needs a review as today. Review coverage of M is a policy decision by ruling, not evidence that any reviewer saw M (attack finding 5).
- **A6 — Order and records.** The merge-tree call, the attribute check and the proof-path check run before the CI read, so a conflict costs no gh call. A refusal after `commit-tree` leaves an unreferenced commit object for gc. Land-record stages and fields are unchanged. No test pins which stage a refusal records (finding 9).
- **A7 — CI is re-read once before the lock (attack finding 6).** On the merge path only, `nana-land` re-reads the tip's run list just before taking the ledger lock. It does not wait. It refuses if the judged newest run id or attempt per workflow changed, or if any newest run is no longer completed and successful. This narrows the snapshot; it does not make it continuous. A run that starts after that read is not seen; the README says so. The fast-forward path keeps its read-once limit (existing known bug).
- **A8 — Cooperating writers (attack finding 7).** Two lands that use the same review-ledger home serialise through the ledger lock. Inside it, the existing rechecks run: captured main still equals HEAD, the main checkout is on main and clean, and the source tip is unchanged. The second of two lands that captured the same main refuses, and a rerun merges the new main. A land under another ledger home, or a hand operation on the main checkout, does not share the lock. The existing undefended instant between the final check and the ff stays documented (R-981 README sentence); the lane adds no new lock.
- **A9 — After the land (attack finding 8).** `nana-land` never pushes; it prints the push command. Exposure runs from the land until someone pushes main and main's push run reports. That can be longer than one CI run, and several lands may stack on a broken merge before anyone sees it. The Linux suite leg is `continue-on-error`, so a Linux-only break leaves main's run green. Only the macOS and Windows legs block. The shared Land checklist says: when main's push run for a landed SHA is red, land nothing else until the urgent fix lands. The seat's main CI check already reads main's newest push run. Nobody waits for each main run before the next land.
- **A10 — Parent order.** First parent the accepted tip, second captured main, matching today's merge builds.
- **A11 — PR and cleanup.** After the push, GitHub marks the lane's pull request merged, because its head is contained in main. `nana-land cleanup` works unchanged.
- **A12 — CI event (attack finding 6).** This repository's `ci` workflow runs on `pull_request` and on push to main only. A lane tip's judged run is therefore normally a pull-request run, which tests the tip merged with main as of its trigger. `judgeRuns` accepts any event, so nana-land itself does not assume this; the plan claims it only for this repository's workflow.
- **A13 — Help text.** `nana-land` has no help text beyond its usage error. The module header `@purpose` changes and `docs/code-map.md` is regenerated.
- **A14 — Sessions log.** A union rule for `docs/sessions/*.md` is out of scope (8 of 30 recent conflicts). The seat posts it as a `next` issue if wanted.

## Open choices

- **O1 — Sealed words** (builder, in `packages/nana-pack/lib/land-config.mjs` with provenance): the merge commit message, the success line prefix (proposed `merged main:`), and refusal reasons for conflict, unsupported semantics, git failure, no CI, unproven suite, proof path changed (naming lane or main), and CI changed at the re-read. Each refusal names what to do next: "merge main into the lane, then review and CI that tip". Only the success prefix and the documentation sentences are reader interfaces worth exact pins.
- **O2 — Name cap.** Cap the named conflict paths at a declared count.
- **O3 — Local suite on the merge.** Not taken (A3).
- **O4 — Gate on main's push run inside nana-land.** Not taken (A9); the checklist line covers it.

## Questions for the owner

1.
Question: Does the conflict-free merge `nana-land` makes count as review-covered, so the lane needs no confirmation review round?
Default: yes (seat confirmed).
What the default gains and misses: gains the whole saving — no merge build, CI run or review; misses a semantic clash a reviewer reading the merged result might catch (M7 pins one).
Cost of a wrong guess: easy to undo — one ruling line and one check revert; landed merges stay on main and main's push CI tests them.
If answered otherwise: `nana-land` writes M to the lane branch and stops; the seat reviews M, then the land takes M without new CI.

2.
Question: Does "no conflict" mean git's textual merge alone, or also no file changed on both sides?
Default: textual merge alone, inside A2's semantics (seat confirmed).
What the default gains and misses: at most 14 of 44 recent merge builds against 8 of 44; misses a same-file or cross-file clash git merges cleanly, which main's push CI catches later.
Cost of a wrong guess: easy to undo — one added file-set comparison.
If answered otherwise: `nana-land` also refuses on any overlap between the lane's and main's changed files since the merge base.

3.
Question: Should `nana-land` regenerate the code map and requirements tree when only they conflict?
Default: no — refuse as a conflict here; regeneration is the next lane, land-regenerate-generated (seat confirmed).
What the default gains and misses: keeps tool-written content and project script runs out of this lane; misses up to 12 more of 44 recent merge builds.
Cost of a wrong guess: easy to undo — the next lane adds it.
If answered otherwise: this lane would need a bounded generator contract; the seat ruled it out.

## Feature

Feature: FEAT-008 · Integrate and clean up reviewed changes

Planned new rows (the next free IDs after R-3687; the highest ID on main and on every `origin/*` branch is R-3684, and the seat reserved through R-3687):

| Row | Must-meet |
|---|---|
| R-3688 | M1 clean merge lands without merge-tip CI or review |
| R-3689 | M2 merged content matches an independent expectation |
| R-3690 | M3 unsupported merges and git failures refuse with nothing changed |
| R-3691 | M4 conflict refuses with nothing changed and a next step |
| R-3692 | M5 eligibility: CI, suite proof and proof paths on either side |
| R-3693 | M6 only nana-land's own merge is exempt |
| R-3694 | M7 races refuse with nothing changed |
| R-3695 | M8 policy limit: a clean but broken merge lands |
| R-3696 | M9 the guidance agrees everywhere |
| R-3697 | seal test for the new sealed values |

Existing rows that change, row first: R-975 (ancestor, or the merge path), R-977 (ff of the tip or of M; main ref equals the landed commit), R-1002 (exception for nana-land's own merge, A5), R-981 (README and AGENTS describe the merge path and its limits), R-3432 (merge path refuses on a proof path from either side instead of running the local suite).

Known-bug lines in `docs/known-bugs/FEAT-008.md`:
- Rewrite "Consecutive lands sit about one CI run apart, because each later lane merges main." so only a conflicting or unsupported merge costs a merge build.
- Add the A7 snapshot limit, the A8 external-operation race, the A9 exposure window with its Linux qualification, and M8's policy limit, one line each.

## Threat model

In scope — honest variation in our tools' output:

- **Main risk: git reports a clean merge that breaks the build or drops content.** Bounds:
  1. Only a textual-clean merge inside A2's semantics lands. Custom drivers, union merges, attribute changes and malformed git output refuse.
  2. Proof-defining paths changed on either side refuse (A4), so the tip's CI evidence came from the same workflow and runner.
  3. In this repository the tip's judged run is normally a pull-request run on the tip merged with main at its trigger (A12). The untested part is main's commits since then.
  4. Main's push CI runs on M after the seat pushes. Its macOS and Windows legs block, and the template release waits for green. The Linux leg does not block (A9).
  5. The checklist stops further lands once main's push run for a landed SHA is red; the urgent fix ships alone (ruling 2026-10-11).
  Residuals: semantic breakage is accepted by policy (M8). Exposure lasts until the push and its run, and lands can stack in that window (A9).
- CI changing during the land: re-read once before the lock (A7). A run that starts later is not seen.
- Concurrency: A8's cooperating-writer guarantee and its documented limits.
- Git version and settings: refusal by name for a git without the needed commands. Renormalisation off. Rename detection follows `merge-tree` defaults; either result refuses or is checked by main's push CI.

Out of scope — deliberate forgery: a forged review ledger or CI answer, a hand-made commit posing as nana-land's merge (only the in-process commit is exempt), a tampered git.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs` — `runLandCore`: the ancestor refusal the merge path replaces; the uncovered-commit `rev-list` check (kept); the CI read and retry loop (reused for A7's re-read through the same helper, extracted within the module, not copied); `changedSuitePaths` input (A4); the locked recheck block and `git merge --ff-only`; the post-merge ref and containment checks (target M). Every git call through `git(runGit, …)`, every refusal a thrown `Error`.
- `packages/nana-pack/lib/land-ci.mjs` — `changedSuitePaths` (called twice, once per side), `judgeRuns` (A7 compares its runs), `proveCiSuite` unchanged.
- `packages/nana-pack/lib/land-config.mjs` — new sealed values beside `SUITE_CHANGED_REASON` and `SUITE_LINE_PREFIX`, with provenance comments; `SUITE_FALLBACK_PATHS` reused.
- `packages/nana-pack/lib/land-records-config.mjs` — `LAND_STAGES` unchanged.
- `packages/nana-pack/tests/land-fixtures.mjs` — `ciFixture`, `artifactGh`, `executeCi`, `reviewTip`, `gitRunner`, `commit`, `git`, imported, not copied.
- `packages/nana-pack/tests/land-ci-suite.test.mjs` — `exercise()`: CI fixture, `artifactGh`, counting suite command, end record via `readLandLedger`.
- `packages/nana-pack/tests/land.test.mjs` — "suite-time main divergence refuses before merge", "suite-time source revision change refuses before merge", "suite-time main tracked changes refuse before merge", "suite-time main branch switch refuses before merge", "uncovered integration commits are refused and named": the M6 and M7 patterns. Its "non-fast-forward source tip refuses before running the suite" case is updated to the new behaviour, not shaped around `/ancestor/i`.
- `packages/nana-pack/tests/land-merge.test.mjs` — "normalized checkout review lands its exact tip" (autocrlf fixture pattern for M3's attribute cases) and the R-981 README/AGENTS pins.
- `packages/nana-pack/tests/land-ci-read.test.mjs` — R-2592 exact-sentence pins; `packages/nana-pack/tests/rulings.test.mjs` — R-3437 rendered-equals-shared check and R-3525 last-bullet check. M9 follows them.
- `packages/nana-pack/tests/memory-run-recovery.test.mjs` — the repo's only `git commit-tree` use. No code uses `merge-tree` or `check-attr --source` yet (none: first use).
- Map search ("merge main into reviewed tip without conflict", "git merge-tree conflict check") ranked `nana-land.mjs` first, then `land-ci-records.mjs` and `release-status.mjs` (read-only, unchanged). Impact: direct callers are the land tests, `memory-run.test.mjs`, `path-spelling.test.mjs`; nana-setup links the bin by path only.

New cases go in two new files, `packages/nana-pack/tests/land-clean-merge.test.mjs` (M1–M6, M8, seal) and `packages/nana-pack/tests/land-clean-merge-race.test.mjs` (M7). `land.test.mjs` already takes 102 s locally, and R-3490 caps each land test file at 180 s on the Windows laptop.

Files where the old rule is stated, all updated:

- `templates/_shared/working-under-nana-pi.md` and `AGENTS.md`'s rendered region (byte-equal, R-3437), two bullets (attack finding 3):
  - Review ladder: "The final review must cover the exact tip that will land; every later commit needs its own accepted review coverage." becomes "The final review must cover the exact tip that will land, or the accepted tip that `nana-land` merges current main into without conflict; every later commit the lane authors needs its own accepted review coverage."
  - Land checklist: keep the R-981 and R-2592 phrases. After the CI sentence, add: "When main has moved since the accepted tip, `nana-land` merges current main into it; a merge with no conflict lands without new CI or review, and a conflicting merge refuses, so merge main in the lane and get that tip reviewed and through CI. When main's push run for a landed commit is red, land nothing else until the fix lands." Change "there are no exemptions" to "the one exemption is that conflict-free merge; there are no others".
- `packages/nana-pack/README.md` "Land helper": merge-path sentences beside "one `git merge --ff-only`" (keep that phrase and "main ref equal to the tip", add "or its merge commit"), plus A2's limits, A7's snapshot, A8's cooperating writers and the bors-ng trade in the limits paragraph.
- `packages/nana-pack/rules/nana-rulings.md`: the ruling below.
- `packages/nana-pack/bin/nana-land.mjs` header; `docs/code-map.md` and `docs/requirements-tree.md` regenerated.
- `docs/known-bugs/FEAT-008.md`: the lines under Feature.
- `nana-land` help text: none exists (A13).

Ruling. Insert it before the final `2026-11-01` lanes bullet, which R-3525's test keeps last. Remove the 2026-10-10 review ruling it replaces:

`- 2026-11-02: An independent reviewer accepts every revision that reaches main. The one exception: when nana-land merges current main into an accepted tip whose CI passed and git finds no conflict, that merge lands without new CI or review. Nobody commits to main directly. Notes go in before the final round, and nothing is written after a land.`

Seat wrong-code pairs (suggested): treat merge-tree exit 1 as clean; accept malformed merge-tree output; skip the `merge` attribute check; check proof paths on the lane side only; skip the A7 re-read; exempt any lane merge commit; ff to the tip instead of M; drop the in-lock captured-main recheck; read CI for M instead of the tip.

## Outside precedent

- bors-ng (github.com/bors-ng/bors-ng, Apache-2.0) — skip. Its "Not Rocket Science Rule" tests the exact merge before main moves; that is the cost this lane removes on purpose. The README limits paragraph names the trade.
- Public reference: GitHub branch protection's "Require branches to be up to date before merging", turned off, is this policy. `git merge-tree --write-tree` and `git check-attr --source` are git's documented commands, used, not copied.

## Must-meet

All fixtures are real git repositories under the OS temp folder, built on `land-fixtures.mjs`, with injected gh and a counting suite command. "Nothing changed" below always means: main's ref and HEAD equal their values before the run, the source tree's HEAD equals the tip, `git status --porcelain` is empty in both checkouts, and no new ref exists.

1. **M1 · R-3688 — A clean merge of a moved main lands with no merge-tip CI and no review.** Fixture: accepted tip with passing CI that stands in for the suite; after branching, main commits a different file. Pins:
   - exit 0; main's HEAD is M with parents exactly `[tip, capturedMain]`;
   - the tip is an ancestor of main;
   - every gh run-list call names `head_sha=<tip>`, and none names M;
   - the review ledger holds no round or reservation whose revision is M;
   - the suite command ran 0 times;
   - the source tree is unchanged;
   - the output has one line with the sealed merge prefix naming captured main, the tip and M;
   - the end record says `landed`.
2. **M2 · R-3689 — Merged content matches an independent expectation.** For each case, the test asserts M's files against literal expected content written in the test. It also asserts them against an ordinary `git merge --no-ff` of the same two commits in a separate scratch clone. Cases:
   - (a) the same file edited in separate hunks on each side;
   - (b) the lane renames a file while main edits it, so the edit lands at the new path;
   - (c) main adds a file while the lane edits another.
3. **M3 · R-3690 — Unsupported merges and git failures refuse with nothing changed.** Cases:
   - (a) a both-sides-changed path whose `.gitattributes` selects a custom `merge` driver configured to keep one side: refused naming the path; the driver never decides;
   - (b) `.gitattributes` changed on one side: refused;
   - (c) an injected `runGit` makes `merge-tree` exit 129, exit 0 with empty output, exit 0 with a non-hex first line, and exit 1 with no names: each refused naming `git merge-tree`.
   Every case: nothing changed, suite 0 runs.
4. **M4 · R-3691 — A conflict refuses with nothing changed and names the next step.** Both sides change `base.txt` lines in one hunk. Pins: exit 1; the refusal names `base.txt` and says to merge main into the lane, then review and CI; nothing changed; no gh run-list call names any commit but the tip; suite 0 runs.
5. **M5 · R-3692 — The merge path needs CI that stands in for a suite, with proof paths unchanged on both sides.** Each case refuses with nothing changed, suite 0 runs, and a reason naming the cause and side. Cases:
   - (a) no origin, so CI does not apply;
   - (b) CI passes but no suite record proves the suite;
   - (c) the lane changes `scripts/test.mjs`;
   - (d) only main changes `scripts/test.mjs`;
   - (e) only main deletes `.github/workflows/ci.yml`;
   - (f) only main renames `.github/workflows/ci.yml`.
   Pins the side named: lane for (c), main for (d)–(f).
6. **M6 · R-3693 — Only nana-land's own merge is exempt.** Cases:
   - (a) main moved cleanly, and the lane holds a reviewed commit followed by an unreviewed one: refused naming the unreviewed commit;
   - (b) the lane holds its own unreviewed merge of an older main: refused naming that merge.
   Both: nothing changed.
7. **M7 · R-3694 — Races refuse with nothing changed beyond the racer's own write.** Merge-path variants of the land.test.mjs suite-time cases, injected through `runGit` after the CI read:
   - (a) main gains a commit: main's ref is that commit, not M;
   - (b) the source tip moves;
   - (c) tracked dirt in main;
   - (d) main checkout switched off main;
   - (e) the A7 re-read returns a newer queued attempt;
   - (f) the A7 re-read returns a failed newest run;
   - (g) two lands capture the same main, and the first lands its merge during the second's CI read. The second refuses, and an immediate rerun lands a merge of the new main whose parents are `[tip2, M1]`.
8. **M8 · R-3695 — Policy limit: a clean but semantically broken merge lands.** The lane renames an exported function in `a.mjs`; main adds `b.mjs` calling the old name; each side's own tree imports cleanly. The land exits 0 with M as main. Running `node b.mjs` in a checkout of M fails on the missing export. The test name says this is the accepted policy limit, not a guarantee.
9. **M9 · R-3696 — The guidance agrees everywhere.** Pins:
   - in the shared source, the Review ladder and Land checklist bullets each name the conflict-free merge exemption, and neither still says "there are no exemptions" without it;
   - every sentence requiring review coverage of later commits limits it to commits the lane authors;
   - the checklist carries the stop-on-red sentence;
   - AGENTS.md's rendered region equals the shared source;
   - the pack README carries the merge-path sentence and A2's limits;
   - the rulings file carries the new 2026-11-02 line exactly once and no 2026-10-10 review line.
   The ruling's position is left to the existing R-3525 test.

Seal · R-3697 — one seal test pins each new sealed value in `land-config.mjs` by this row; every other assertion imports the names.
