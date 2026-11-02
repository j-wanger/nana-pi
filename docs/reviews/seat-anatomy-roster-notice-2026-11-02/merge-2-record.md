# Merge build 2

Merged origin/main at 497c58913f0af05958a9468c8870f0982765e80c into the lane's f68aa565 tip without conflicts or behavior changes.

## Preservation

Every unrelated tracked file equals origin/main, including main's deletions. Lane code, tests and earlier review records remain byte-identical to the pre-merge tip. REQUIREMENTS.md retains the R-3640 amendment and R-3682 through R-3684 alongside main's rows. No new row or test was added, no existing test was edited, and no mutation pair was needed for this merge-only build. Earlier wrong-code evidence remains in wrong-code.txt.

The session archive equals origin/main byte for byte: its entries remain whole and newest first. This lane had no separate session entry, README change or known-bug change relative to the merge base. No known bug listed in the brief was touched or fixed. No precedent departure.

Regenerated docs/code-map.md with npm run map and docs/requirements-tree.md with its --write generator. The final diff against origin/main contains only the lane's original files and these two new merge evidence files.

## Local validation

Full output and standalone exit codes: merge-2-checks.txt.

- Seat anatomy: 16/16; anatomy regression: 9/9; label regression: 30/30; each command exit 0.
- Map generator and tree generator: exit 0.
- Map check, README check, requirements trace, tree check, known-bugs check and identity scan: exit 0.
- Lane class: ordinary, exit 0.
- Preservation assertions: pass.

One invocation error is retained honestly in the log: combining tree --root with --check exited 2. The supported standalone --check passed, exit 0. Pre-commit tree output notes paths not yet present in HEAD from main's incoming commit; the post-commit check must resolve those notes. Known-bugs reports the existing FEAT-013 size note; it is report-only.

CI covers the full suite. No locked full suite, model session, private-input recount, install change or GitHub issue action was performed. Push the verified last commit and stop without reading CI.
