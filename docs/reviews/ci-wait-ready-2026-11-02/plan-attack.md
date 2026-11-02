1. **MUST — The classifier rejects the capacity cancellation this lane must repair.**  
   **Evidence:** `plan.md:29,79` requires every non-success job to be cancelled. `.github/workflows/ci.yml:116–118` skips `release` on every PR. A cancelled macOS job plus skipped release therefore becomes `failed`. The Linux suite also permits failure (`ci.yml:70`), while M3 forbids rerunning any observed failure.  
   **Fix:** Define success precedence, harmless skipped/neutral jobs, and advisory failures explicitly. Require at least one cancelled job and complete job evidence. Test realistic PR job lists, including skipped release and Linux failures; never turn cancellation into success.

2. **MUST — Mandatory PR readiness narrows the existing land contract incorrectly.**  
   **Evidence:** `plan.md:24–32,78` refuses before reading runs whenever no PR exists. `REQUIREMENTS.md:1175–1182` accepts successful tip runs without requiring a PR. `land-ci-read.test.mjs:58` explicitly accepts a push run. The pack supports repositories beyond this repository’s PR-only feature-branch trigger.  
   **Fix:** Apply PR readiness only where PR-triggered CI is required, or use it to diagnose absent runs rather than reject existing valid CI. Pin successful push-only CI without a PR and preserve no-CI skips.

3. **MUST — PR selection and write targeting are underspecified.**  
   **Evidence:** `plan.md:24` searches only a branch name and requests no head repository identity. Its command omits `--repo`; the rerun command at line 30 also omits it. `land-ci-read.test.mjs:74–88` deliberately sets conflicting `GH_HOST` and `GH_REPO`. Local and remote branch names can differ, and forks can reuse branch names.  
   **Fix:** Explicitly target `github.com/<owner>/<repo>` for every read and write. Resolve the remote head identity or accept an explicit PR; validate head repository, ref and SHA, and refuse ambiguity. Add wrong-environment, renamed-branch and same-name-fork fixtures.

4. **MUST — M2 can consume both retries on one stale attempt.**  
   **Evidence:** `plan.md:30,79` says rerun and poll again but specifies no transition barrier. An accepted rerun can leave subsequent reads showing the previous completed cancellation. Both rerun calls could target attempt 1, yet satisfy the asserted call count.  
   **Fix:** Track workflow/run/attempt identity and outstanding reruns. Never rerun the same observed attempt twice; wait for advancement within the deadline. Read complete, attempt-matched jobs and fail closed on partial or malformed evidence. Test repeated stale responses, failed rerun requests, pagination and independently advancing workflows.

5. **MUST — The overall timeout is not proved by M4.**  
   **Evidence:** `plan.md:81` exercises polling sleeps only. `gh-runner.mjs:21–30` has no default timeout; readiness and job/rerun calls can consume or exceed the overall budget.  
   **Fix:** Start one monotonic deadline before readiness. Bound every subprocess and sleep by the remaining budget, and prohibit calls after expiry. Extend M4 with slow readiness, job reads, rerun writes and API failures—not merely queued runs.

6. **MUST — M5 contradicts the required integration change.**  
   **Evidence:** `plan.md:82` requires existing tests to pass unedited. `land-ci-read.test.mjs:68–69` asserts exactly one pre-suite gh call; lines 79–83 return workflow JSON for every gh request and require the first request to be the runs API. Mandatory readiness necessarily breaks these fixtures.  
   **Fix:** Replace “unedited” with preservation of existing behavioural guarantees. Forecast fixture and assertion changes, allow them explicitly, and add Windows CLI tests through an injected Node fake gh. Keep requirement rows behavioural rather than treating constant placement or call syntax as the feature.

7. **SHOULD — Resolve O1 explicitly; neither R-2592 nor the metric requires polling inside land.**  
   **Evidence:** `plan.md:9` promises a shared waiter used by land, but line 43 defaults to a separate waiter. `REQUIREMENTS.md:1182` says “refuses … until,” while `land-records.mjs:48–59` measures run creation-to-update time, not time spent polling.  
   **Fix:** Record the seat’s decision and align Purpose, rows and consumer documentation. Keeping land read-only is consistent with the existing contract. For `origin/feat/land-clean-merge`, the read-only probe confirmed comparison of `workflow_id/id/run_attempt`: test that a completed pre-land rerun passes, while an attempt changing during land still refuses. Do not weaken that check.

8. **SHOULD — Separate GitHub assumptions from what fake gh can prove.**  
   **Evidence:** M2 proves invocation of `--failed`, not that cancelled jobs restart. The requested help probe could not run: `gh` remained unavailable after resetting PowerShell PATH. Likewise, `nana-land.mjs:157` queries Actions `head_sha`; the PR’s merge checkout SHA is a different concept, not evidence that this query is wrong.  
   **Fix:** Require documented CLI/API evidence for cancelled-job reruns and PR run SHA semantics before claiming validation. Model those shapes faithfully in fixtures, including UNKNOWN→MERGEABLE and UNKNOWN exhaustion. Keep the current SHA query unless evidence warrants changing it.

**Counts: 6 MUST, 2 SHOULD.**
