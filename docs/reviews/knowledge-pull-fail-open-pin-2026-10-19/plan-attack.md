# knowledge-pull-fail-open-pin — plan attack (one adversary)

Verdict: AMEND

AMEND, small. The plan's core claims hold under my own probes: a temp clone at main 02f1c139, a temp HOME, macOS, Node 22.22.2, with drafts written from the plan, not the seat's drafts.

Results:
- Baseline: 36 and 96 PASS. With the drafts: 38 and 98 PASS. Both files also pass through the test runner with a path filter.
- After the flip, the trace exits 0. The tree regenerates with no diff. The map check and the readme check are green.
- Wrong code: W1, W2, W3, W4, W6 and W7 each turn red on the check the plan names. W4 fails R-895 and then crashes the file at check 5.
- H1 reds only the seal check. H2, H3 and H4 red the boundary check.
- P1 and P2 were not re-probed. They are trivially red on the existing check-2 and check-4 asserts.
- A new variant, W10, also goes red. In it the default export calls makePull({ timeoutMs: 60000 }). Only the handler-level late case catches this, and a makePull-level test would not. That justifies the copy-the-extension design against the simpler alternative.
- The lane is not done already. The knowledge-refresh-pin must-meet explicitly cut R-228, R-234, R-895 and R-896 into a residual.

Amendments:
1. Case order changes to missing first (no stub written yet), then control, non-zero, silent, whitespace, and late last. That way no stub file is deleted right after a kill. The plan had named that step as a Windows risk.
2. The test writes {"type":"module"} as the copy tree's package.json. This mirrors the real package and removes reliance on module-type detection for the copied .ts files.
3. The feature sentence says "past the handler's deadline", not "the 2 s deadline". The late case pins a deadline under 10 s, and TIMEOUT_MS 9000 would stay green. This is recorded as a known limit.
4. W10 is added to the wrong-code list.
5. The R-228 spawn uses NODE_NO_WARNINGS=1 and fresh session ids. Stderr was empty even without the switch on 22.22.2, but the switch is cheap insurance.
6. The builder confirms that extensions/, lib/ and bin/ show no diff before committing.

The lane class is right: ordinary. The lane changes tests, rows and the map only, which matches the knowledge-refresh-pin precedent.

Files the build will touch:
- packages/nana-knowledge/tests/extension.test.mjs
- packages/nana-knowledge/tests/hook.test.mjs
- REQUIREMENTS.md
- docs/code-map.md

Conflicts:
- I checked each in-flight branch against its merge base with main: mutation-runner-win-prune, pi-settings-bom, post-edit-win-survivors, pwsh-lexer-oracle, stale-copies-hooks, trust-finds-pi, win-path-commands and adopt-structure-markers.
- None touches packages/nana-knowledge or these four rows.
- Their REQUIREMENTS.md hunks start at lines 605 to 1755. This lane's rows sit at lines 283 and 299 to 301.
- Every one of those branches changes docs/requirements-tree.md. This lane does not.
- The code map moves in every lane, so the builder regenerates it after merging main.
- No wait.

Most likely wrong: that the new extension block is green on the Windows leg. It is inferred, not run. The remaining exposure is the control stub finishing inside the 2 s deadline on a loaded Windows runner. That would be a flake, not a product bug. The existing real-CLI pulls in checks 1 to 4 already pass the same deadline there.
