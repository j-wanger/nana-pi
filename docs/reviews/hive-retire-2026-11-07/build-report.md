# Retirement build record

## Result

Completed M1–M8 on `feat/hive-retire`. The final response supplies the committed tip and its repeated seat-check results. Logs here record the green pre-commit run; machine paths are normalized to repository-relative paths, `~` and `$TMPDIR`.

## Files and requirements

- `REQUIREMENTS.md`: adds R-3775–R-3782 in M-order, with eight implemented test citations. Retires R-3121–R-3134, R-3139, R-3171–R-3175, R-3177 and R-3187. Preserves already-retired R-3120, R-3170 and R-3176, every ID and historical evidence.
- Artifact claims: A-087 remains registered as retired, without a live reader. A-085 retains its workflow maker and person reader. A-086 retains its audit reader, without the removed publisher. No surviving deliverable Made-by/Read-by claim required a change.
- Removes `apps/hive/`, its vendored renderer, `scripts/hive-page.mjs`, `scripts/hive-page-config.mjs`, `scripts/hive-gesture-check.mjs`, three hive test files and their city-control fixture: 32 tracked files, 84,460 lines.
- `.github/workflows/pages.yml`: removes the preview-only audit output, preview build and preview identity scan. Retains product build → product identity scan → site upload → main-only deploy.
- `scripts/first-look.mjs` and `scripts/first-look-config.mjs`: remove the preview flag, renderer wait, canvas probe and app import. Product, URL comparison, reference and desk captures remain.
- `README.md`, `code-map.config.json`, `readme-check.config.json`: remove preview claims and roots. Regenerates `docs/code-map.md` and `docs/requirements-tree.md`.
- `packages/nana-pack/tests/preview-retirement.test.mjs`: exactly eight new must-meet cases, requirement-tagged, awaited under per-case limits. Fixtures live only in OS temporary directories; browser and issue reads are injected. The spec fixture includes CRLF, trailing space/tab and no final newline.

## Existing test edits

Only removal-induced false claims changed:

1. `first-look.test.mjs`: removes the retired R-3133 case, including its duplicate desk assertion; R-3781 now checks desk capture.
2. `pages-workflow.test.mjs`: removes retired R-3131 and R-3139 cases.
3. `readme-check.test.mjs`: expects seven checked READMEs instead of eight, without the removed app README.
4. `code-map-launch.test.mjs`: records the retired preview edges in its fixed historical graph comparison, without literal live references to removed paths.

## Wrong-code → green pairs

All assertions stayed positive; mutations broke code or artifact data, never assertions.

| Row | Wrong implementation / red evidence | Green evidence |
|---|---|---|
| R-3775 | Original app still present; baseline.log, exit 1 | tests.log, PASS |
| R-3776 | Original workflow publishes preview; baseline.log, exit 1 | tests.log, PASS |
| R-3777 | Inject a required city-plan existence check into buildAudit; audit-red.log, exit 1 | Mutation restored; corrected two-component fixture passes in tests.log |
| R-3778 | Original roots/map remain stale after test addition; baseline.log, exit 1 | Regenerated map/tree and honest statuses; tests.log, PASS |
| R-3779 | Original first-look retains preview option; baseline.log, exit 1 | tests.log, PASS |
| R-3780 | Original Pages retains preview-only audit step; baseline.log, exit 1 | tests.log, PASS |
| R-3781 | Original first-look accepts preview flag and launches capture; baseline.log, exit 1 | tests.log, PASS; rejected options launch no browser |
| R-3782 | Restore A-087's live registry entry; artifact-red.log, exit 1 | Retirement restored; tests.log, PASS |

Initial baseline failures for R-3777 and R-3782 exposed fixture/assertion errors, not product defects. They are not claimed as mutation proof. The separate corrected mutation runs provide their red halves. `resume-red.log`, `green-draft.log` and `trace-draft.log` retain intermediate failures honestly.

## Commands and exit codes

- Before mapped edits: `npm run map:impact -- scripts/first-look.mjs scripts/hive-page.mjs scripts/hive-gesture-check.mjs scripts/component-audit.mjs`, exit 0 (inherited draft record).
- Baseline: `node packages/nana-pack/tests/preview-retirement.test.mjs`, exit 1.
- Corrected M3 mutation: same command with `R-3777`, exit 1.
- Corrected M8 mutation: same command with `R-3782`, exit 1 (inherited draft record).
- Scoped `git rm -r -q -- <paths>`, exit 0.
- `npm run map`, exit 0; `map.log`.
- `npm run map:check`, exit 0; `map-check.log`.
- `npm run req:tree`, exit 0; `tree.log`.
- `npm run readme:check`, exit 0; `readme.log`.
- `node scripts/component-audit.mjs --check`, exit 0; `audit.log`.
- `node scripts/requirements-trace.mjs`, exit 0; `trace.log`.
- `node scripts/test.mjs preview-retirement first-look pages-workflow readme-check code-map component-audit outside-reader visual-reader test-runner requirements-trace`, exit 0; `tests.log`.
- Filtered summary: **12 files: 12 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 236 pass, 0 fail, 0 skip**. Includes both test-runner files required after test-file addition/deletion.
- Final reference scan, exit 0; `reference-scan.log`. Checks every removed tracked path against all live tracked content, excluding the seat's history/retired-record exemptions. Also checks removed README/known-bug prose lines and sentences against test files and fixtures. No surviving pins.
- `git diff --check`, exit 0.

## Readers and precedent

- The audit already has no city dependency. The rejected coupling lived in the publisher and deleted city tests; `scripts/component-audit.mjs` therefore remains unchanged. R-3777 proves a second valid component needs no city plan.
- The product report does not consume the Pages component-audit output. Its only publish reader was the removed publisher; the suite still checks the audit.
- The gesture checker has no surviving reader. Its app dependencies and first-look wait leave together. Repository-wide caller searches found no surviving callers of the removed exports.
- No proposed cut was kept for a reader. The shared component contract and frozen fixture stay because the surviving audit and its tests use them.
- Followed the publisher, workflow, first-look and audit precedents. `docs/plan/one-reviewer.md` is absent (ENOENT); followed the brief's explicit retirement contract instead. This is the only precedent departure.

## Known-bug closures by retirement

Read the complete FEAT-039 known-bug file and its deletion diff. Deleted only these 19 preview-specific lines; every other line remains byte-identical:

1. Preview capture accepted pixel fallback.
2. Clipped cabinet and release-route labels.
3. Preview failure stopped product deployment.
4. Preview identity scan covered data only.
5. Preserved drawing buffer cost.
6. Unclaimed preview modules in the audit.
7. Software-renderer frame cost.
8. Blank embedded city page.
9. Temporary-branch city previews.
10. R-3171 audit/city drift coupling.
11. Missing layout override console error.
12. Unscanned city narration.
13. Stale city source comment.
14. Regex-only flow evidence.
15. Unreadable return-road names.
16. Overlarge selection bounds.
17. Gesture sampling before readiness.
18. Landing claims wider than the roads.
19. Ribbon test pinned implementation constants.

The visual-reader fixture bug mentioning a historical preview answer stays because that reader survives.

## Not done

CI owns the full suite under AGENTS.md; only path-filtered tests ran locally. No real browser, issue fetch, model session, credential access, GitHub write, CI read or push occurred. Windows execution remains for CI. Review and push belong to the seat. No owner question remains.
