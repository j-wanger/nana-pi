## Critic

Independent pass over `packs.json` against the checkout at 860785c2. Scripts: `work/critic_req.py` (retire-only rows, output `work/critic_only.json`), `work/critic_sel.mjs` (module-pack reach through the code map).

### (a) Core capability with no land guard

| # | Finding | Evidence | Correction |
|---|---|---|---|
| A1 | The reviewer this machine actually uses has no land guard. | `nana-roster`: `reviewer: claude-code opus`. `claude-review.test` is main only (5 cases retire-split). Land's only reviewer file, `review-standard`, drives `pi-review` with a fake pi. | Split `claude-review.test`'s launch and refusal cases into land (whole file is 21 s mac / 38 s win, so split, not move). |
| A2 | HANDOFF and known-bug repo-content contracts leave every lane's PR. | `handoff-issues` R-2977 ("real HANDOFF Next and Open sections are pointer-only", the AGENTS.md suite rule) is main. `frontier` R-2473/R-2504 and `known-bugs` R-2505 + `checkKnownBugs({root: REPO})` are module, but HANDOFF.md and `docs/known-bugs/**` are not watch globs. Every lane edits both. A bad line lands, then reds main and blocks the next land. | Move those real-repo cases to land (each file is under 6 s; the cases are sub-second), or add `HANDOFF.md` and `docs/known-bugs/**` to the watch globs. |
| A3 | The * extraction gap is a sequencing bug, not one land of exposure. | Leak scan, identity tree scan, builder refusal, objective smoke, template AGENTS section and win32 launch reach land only through splits not yet extracted. | Make the extraction part of the lane that switches `ci.yml`; do not switch CI first. |

### (b) Retire file that is the only pin of a surviving row or a real regression

| # | File | Evidence | Correction |
|---|---|---|---|
| B1 | `pipe-guard-pwsh-oracle` (+ `pwsh-oracle.mjs`) | Not setup-retire machinery: `extensions/nana-gate.ts:385` calls `verifierPipeReason(subject, "powershell")` for the pi gate. Only pin of R-1730..R-1739 (PowerShell lexer rules). Only regression for `7ca1eafb fix(gate): preserve words after leading PowerShell escapes` and `3327c1cd`. | main (Windows leg runs the oracle; 2.7 s win). |
| B2 | `retired-artifacts` | `lib/retired.mjs` runs on every install, doctor and uninstall (imported by steps, doctor, uninstall, settings). Fix commits `fc6ac33d` (Windows retired skill copy reruns), `cfcddf4c`. The setup-retire lane will itself add the retired hooks to this manifest. Only pin of R-661..R-669 and R-804 (preserve unknown artifacts; unlink only links into the repo hooks dir). | module whole (selected by `lib/retired.mjs`), not a 3-row split. |
| B3 | `project-dismiss` | `nana-setup project --not-a-project` is live (`lib/project.mjs` NOT_A_PROJECT; `nana-adoption` reads the marker). Only pin of R-340; 2 fix commits. | module. |
| B4 | `review-ledger` R-623, `review-ledger-launch` R-700 | These pin the pi-review / pi-worker watchdog (signal reaping, stall kill), not ledger paperwork. No other file carries them. The main split is conditional on "nana-land keeps reading the ledger". | Make those cases unconditional main, or move them into `watchdog-exit`. |
| B5 | `gate-status` | Gate status line and R-776 "IF setStatus throws THEN every decision shall be unchanged": a gate fail-safe. Only pins of R-071/072/775/776. 0.2 s. | module (selected by `nana-gate.ts`). |
| B6 | `gate-config-robustness` | Fold is right: `config-handlers-malformed` already asserts "gate still blocks rm -rf headless" under null patterns. But R-070/R-774 markers exist only in the retired file. | Move the two markers in the fold lane. |
| B7 | Systemic | The trace rail (`requirements-trace.ts:520`) fails "'implemented' but no test carries req:". Retire-pack files leave 425 implemented rows with no surviving marker (`work/critic_only.json`). Section 3 does not say so. | Each retiring lane flips its rows to `retired` (or moves markers) in the same change; add it to section 3. |
| B8 | Cascade breaks in kept files | `windows-skip-lines` R-1954 reads `post-edit-hardening.test.mjs` as text. `hooks-win32-exec` (main) imports the retire helper `knowledge-state.mjs`. `code-map-launch` expectations name `review-ledger.test` edges. None is selected by the deletion. | The retiring lane edits these in the same change. |

### (c) Module-pack selection that never fires

| # | Finding | Evidence | Correction |
|---|---|---|---|
| C1 | e2e files can never be selected, and never run today. | `code-map.config.json` ignores `**/*.e2e.mjs`; `scripts/test.mjs` `excluded()` drops `.e2e.mjs` from collection; `tests.json` has no timing for any e2e. Affects `stage-page.e2e`, `stage-render-edge.e2e` (module) and `stage-chain.e2e` (release). | A `manual` pack (desk hand checks), and drop their cases from module and release counts. Retired e2e files save 0 s. |
| C2 | Section 4's graph calls do not return what it assumes. | `untracedTests(graph)` returns `{untraced: 21, total: 289}`, counts, not a list. `repoGraph()` has no launch links (`linkRepo` is private). Measured: on `repoGraph()` alone, `origin-rule`, `linked-launch`, `review-test-waits`, `claude-config-dir`, `doctor-quiet`, `project-odd-seeds` and `pi-install.test` have no reach. With `addLaunchLinks(graph, collectModules(...))` and `blindReach(graph)` all of them fire. | Specify `addLaunchLinks` + `blindReach`, not `untracedTests`. |
| C3 | `windows-skip-lines` fires only when it changes itself. | It reads eight test files as text: no import edge, no watch glob. | Watch its eight files, or retire it along with R-1954 when post-edit-hardening goes. |

Claim most likely wrong: B4. The review-paperwork lane may move the watchdog proofs elsewhere first. Check that lane's diff before acting.
