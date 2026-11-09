Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix
Serves: roadmap step 4 (records move): confirmation round on review 1's fixes.

# Review brief 2: records-move — confirmation round

Review 1 sent back one MUST (the land-pack test froze the records against every tracked file's live text) and S1 (the recent rule missed merge-only changes). Review only `git diff 6ac24e64..HEAD` (commit dfaeaf15): the live-repo assertion is gone and the fixture tests moved to the module pack; the recent rule uses first-parent merge history and ten folders were restored; R-3928–R-3930 reworded; S2 and S3 recorded as known bugs. Evidence: `docs/plan/records-move-review1-evidence.md`.

Question: can any lane that does not touch the records check or its config now fail because of this lane? Are the ten restored folders byte-identical to 5722fc03? Threat model: honest drift; forgery out.
