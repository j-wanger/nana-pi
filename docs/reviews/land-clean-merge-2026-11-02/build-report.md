VERDICT: PARTIAL

## Commits and scope

- `54480dcca28886364a36e915ae31d3e0c6716261` — clean-merge implementation, requirement diff, tagged tests, shared guidance and initial evidence; commit exit 0.
- `cc39e206a337e79f905deb81b9b9e9c4f265f543` — supported Git settings and pre-fast-forward race assertions; commit exit 0.
- The evidence-only commit containing this report records the final mutation judgment and adjacent-reader checks. The final worker report names its full SHA.

Files:
- `packages/nana-pack/bin/nana-land.mjs`: supported merge-tree construction, attribute guard, two-sided proof-path guard, commit-tree, tip-only CI proof and re-read, existing in-lock checks and fast-forward to the landed commit. Land record fields and stages stay unchanged.
- `packages/nana-pack/lib/land-config.mjs`: sealed merge message, output prefix, reasons, remedy, ten-path display cap and supported Git settings.
- `packages/nana-pack/tests/land-clean-merge.test.mjs`, `land-clean-merge-race.test.mjs`: M1–M9 and seal; shared temporary fixtures in `land-fixtures.mjs`.
- `packages/nana-pack/tests/land.test.mjs`: the single pre-existing non-fast-forward case now refuses for absent applicable CI, without running the suite. Its title changed to “non-fast-forward source tip without CI refuses before running the suite”. No other pre-existing test was edited or removed.
- `templates/_shared/working-under-nana-pi.md`, rendered `AGENTS.md`, `packages/nana-pack/README.md`, `packages/nana-pack/rules/nana-rulings.md`: exemption, limits and stop-on-red guidance. The replacement ruling precedes the unchanged final lanes ruling.
- `REQUIREMENTS.md`, generated `docs/code-map.md`, generated `docs/requirements-tree.md`, and evidence in this folder.

Rows: R-975, R-977, R-1002, R-981 and R-3432 changed first. R-3688–R-3697 were added as planned, then marked implemented only after their tagged cases passed. No other new IDs were allocated.

## Wrong code and mutation pairs

`red-clean-merge.txt` and `red-race.txt` retain the runs against unchanged main code: exits 1 and 1, respectively. Every new case failed. Paths in captured diagnostics were replaced with `<worktree>` before publication.

`red-git-settings.txt` (exit 1) records a concrete content-loss result: an honest `merge.default=keep` setting silently dropped main's last-hunk edit. The strengthened M2 and seal failed before the supported-settings fix.

The first nine-pair judgment is in `mutation-first.txt`: 8/9 red, one survived. Removing the captured-main check still refused at git's later ff-only attempt. M7 now also requires the observed races to refuse before invoking ff-only, matching the immediate-recheck contract. The final table adds the demonstrated Git-settings pair.

`seat-mutate.mjs` uses the shared mutation runner. `mutation-record.txt` judges code commit `cc39e206a337e79f905deb81b9b9e9c4f265f543`:

1. Treat conflict as clean → M4 red.
2. Accept malformed merge-tree output → M3 red.
3. Skip merge attribute check → M3 red.
4. Check lane proof paths only → M5 red.
5. Skip CI re-read → M7 red.
6. Exempt lane-authored merges → M6 red.
7. Fast-forward tip rather than merge → M1, M2, M3 and M8 red.
8. Drop captured-main in-lock recheck → M7 red.
9. Query CI for the generated merge → M1 red.
10. Honor a custom default driver / disabled rename detection → M2 red.

RESULT: 10/10 red (10 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 1 shards

Command: `SEAT_MUTATE_SHARDS=1 SEAT_MUTATE_STAGGER_SECS=0 SEAT_MUTATE_OUT=docs/reviews/land-clean-merge-2026-11-02/mutation-record.txt node docs/reviews/land-clean-merge-2026-11-02/seat-mutate.mjs`; exit 0. Both baseline files passed; no missing titles, anchor misses or syntax errors.

## Commands and exit codes

All commands ran from the lane worktree. No full suite ran; AGENTS assigns the suite to CI. No real CI read or network call occurs in the new synthetic land cases. The template check uses its pre-existing disposable rendered-project toolchains.

`node packages/nana-pack/tests/<file>` (use `--experimental-strip-types` for rulings, templates-render and memory-run):

| File | Exit | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| land-clean-merge.test.mjs | 0 | 9 | 0 | 0 |
| land-clean-merge-race.test.mjs | 0 | 1 | 0 | 0 |
| land.test.mjs | 0 | 31 | 0 | 0 |
| land-merge.test.mjs | 0 | 27 | 0 | 0 |
| land-ci-read.test.mjs | 0 | 6 | 0 | 0 |
| rulings.test.mjs | 0 | 23 | 0 | 0 |
| templates-render.test.mjs | 0 | 173 | 0 | 0 |
| land-ci-suite.test.mjs | 0 | 6 | 0 | 0 |
| land-records.test.mjs | 0 | 7 | 0 | 0 |
| land-ci-records.test.mjs | 0 | 7 | 0 | 0 |
| land-ci-edge.test.mjs | 0 | 2 | 0 | 0 |
| path-spelling.test.mjs | 0 | 11 | 0 | 0 |
| memory-run.test.mjs | 0 | 8 | 0 | 0 |

Touched and adjacent checks: 13 files, 311 PASS, 0 FAIL, 0 SKIP. This is not a full-suite summary. Full individual output is in the `green-*.txt` records.

- `npm run map:impact -- packages/nana-pack/bin/nana-land.mjs packages/nana-pack/lib/land-config.mjs packages/nana-pack/lib/land-ci.mjs`: 0; full impact output is in `map-impact.txt`.
- `npm run map`: 0 after fixing the scanner's false fixture import; generated module map committed.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0; 2465 rows, 2208 implemented and traced; 0 rows off EARS form.
- `npm run req:tree`: 0, followed by `node scripts/requirements-tree.mjs --check`: 0; 0 problems, 2465 rows, 43 features.
- The brief's bare `node scripts/known-bugs.mjs` exits 2 because the CLI requires `--root`; `node scripts/known-bugs.mjs --root .`: 0.
- `node packages/nana-pack/bin/nana-writing.mjs docs/reviews/land-clean-merge-2026-11-02/session-entry.md`: 0; over=0, passive=0, banned=0.
- `node scripts/identity-scan.mjs --root .`, after staging: 0 after sanitizing captured local paths.
- `node scripts/lane-class.mjs --root . --files packages/nana-pack/bin/nana-land.mjs,packages/nana-pack/lib/land-config.mjs,packages/nana-pack/tests/land-clean-merge.test.mjs,AGENTS.md`: 0; gate, land tool.

The literal audit searched tests and checkers before limiting edits. R-981 and R-2592 pinned phrases remain true; R-3437 rendered equality and R-3525 final-bullet checks pass unchanged, as does templates-render equality. No refusal was shaped to preserve the old ancestor regex.

The supplied all-history and recent replay records were combined in `merge-replay.txt`, with the per-merge command at the top. They remain upper bounds, not delivered savings or measured eligibility. Raw trailing whitespace in replay output is preserved.

## Departures and reasons

- Added sealed `merge.default=text` and `merge.renames=true` overrides alongside the planned renormalization override. M2 demonstrated silent content loss without the text override. These enforce A2's built-in textual merge and rename semantics despite honest Git settings; they do not add a merge policy. Pair 10 catches their removal.
- `merge-tree` uses the injected raw Git runner, like the precedent's ancestor/status checks, because exit 1 carries conflict output rather than a generic git failure. Other new git operations use the existing throwing `git` wrapper.
- Added shared named fixture helpers to `land-fixtures.mjs` and imported the existing awaited, bounded `check` harness from `profile-fixture.mjs`. No private precedent helper was copied, moved or newly exported.
- M9 lives with M1–M6, M8 and the seal in `land-clean-merge.test.mjs`; the brief did not assign M9 a separate file.
- Kept the session entry and proposed known-bug text in this lane folder because the standing lane scope forbids editing session archives or `docs/known-bugs/`. This prevents a DONE verdict despite green code and checks.
- Used `--root .` for the known-bugs CLI because its parser requires that argument.

## Known-bug lines affected and limits

The whole FEAT-008 known-bug file was read. The existing consecutive-lands sentence becomes stale: only conflicting or unsupported merges now need the merge-build round trip. Its replacement is prepared in `known-bug-updates.md`, not applied to the protected file.

The existing read-once CI line remains true for fast-forwards; the merge path narrows it to one extra pre-lock snapshot. The existing “PR run tests main as of its trigger” line remains a limit: current main's later content has no pre-land validation. The existing non-blocking Linux-leg line remains true and is stated explicitly in the README. The existing post-land main-push CI window remains, and several lands can stack before it reports. The existing final-check-to-merge external-operation race remains; only cooperating same-ledger-home lands serialize. M8 proves the accepted clean-but-broken policy limit. None of these residuals is claimed closed.

## Not done

- No changes to `HANDOFF.md`, session archives, or `docs/known-bugs/`; the proposed session entry and five known-bug text changes are kept beside this report.
- No issue creation, issue edits, comments or closure; no real gh API read, credential read, model session or subagent.
- No local full-suite run, CI waiting or CI inspection. The builder pushes its final commit and stops.
- Generated-file regeneration on conflicts, a sessions union rule, exact-merge CI, additional locking and continuous CI monitoring remain out of scope.
