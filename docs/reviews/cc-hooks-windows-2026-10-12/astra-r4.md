## Review — 97/100

Reviewed `7e6ce39..29d638f`, including the round-three delta. The named production findings are closed. One session-record correction remains; no additional production-code blocker found.

## MUST

None.

## SHOULD

### 1. Correct the session’s “final code tip” evidence

**File:** `docs/sessions/2026-10.md:21`

The Windows paragraph still calls run `38342945583` the final-code run and reports 69 pipe-guard checks. Build 6 supersedes that evidence.

`REQUIREMENTS.md:686,776–777` correctly cites run `38347800159`, Windows job `115133128863`, on code commit `be22c5a`. The supplied final-run evidence reports 84 pipe-guard checks.

**Smallest fix:** label the existing paragraph’s results as build-5 evidence, then name the build-6 run and its confirmed results. Do not silently attribute the prior run’s doctor count to the newer run.

This is documentation-only.

## NOTE

### Round-three findings are closed

- **Lexer boundary:** `packages/nana-pack/lib/pipe-guard.mjs:148–152` now includes the cited boundary union. Both scanners use this predicate. The closing-quote reproduction is pinned at `packages/nana-pack/tests/pipe-guard.test.mjs:115` and through `decideHook` at `packages/nana-setup/tests/verifier-pipe.test.mjs:93`. Both pass.
- **Skipped skills:** `REQUIREMENTS.md:912` now cites the four-skill assertion; `packages/nana-setup/tests/retired-artifacts.test.mjs:320–321` carries R-937. The assertion checks each named skill’s skip row.
- **Windows evidence:** the three Windows-only rows now identify the last production-code commit’s run and retain their explicit Windows-leg-only qualification.

### Earlier findings remain closed

- `packages/nana-setup/lib/settings.mjs:370` rejects both different and missing status messages.
- `settings.mjs:443` preserves main’s matcher-independent knowledge-entry repair.
- `settings.mjs:410–411` restricts exec-form ownership to repository-suffixed targets.
- `packages/nana-setup/lib/doctor.mjs:386–405` checks expected placement and every recognized target under the event.
- Windows execution tests use each installed timeout, check the seeded memory line, and reject multiple non-empty verifier response lines.

I independently compared POSIX desired output and 18 status-message/matcher merge combinations against `7e6ce39` loaded from this checkout’s Git history. They matched.

### Contract and scope

All **25 changed requirement sentences** contain exactly one `shall`. The cited assertions cover entry shape, checkout targets, matcher, dialect dispatch, doctor negatives, repair, preservation, floor reporting and execution outputs. R-387 and R-936 remain retired; R-1052 remains withdrawn.

The three Support lines match byte-for-byte. The shared runtime region matches its template; `CLAUDE.md` remains a symlink to `AGENTS.md`.

Since round three, the only production change is the comment-boundary correction. Other changes are its tests, evidence references, mutation anchors and review/session records.

### Residuals and acceptance

`HANDOFF.md:41` correctly retains the real-Claude-dispatch limitation and the tokenizer differential-test follow-up. The latter remains useful hardening, not completed evidence.

`docs/reviews/cc-hooks-windows-2026-10-12/owner-windows-check.md:8–80` provides setup capture, install/doctor, fixture preflight, a throwaway project, an exec-form probe, a same-command pipeline/commit check and cleanup. Actual Claude Code routing and latency remain the owner's acceptance check.

The committed build-6 mutation record reports **37/37 red**, with no anchor misses. I did not run the mutation runner. This confirms the seeded regressions, not exhaustive PowerShell correctness.

### Checks run

| Check | Result |
|---|---:|
| Pipe guard | 84 pass |
| Settings merge | 213 pass |
| Verifier hook | 29 pass |
| Forced-win32 degradation | 87 pass |
| Retired artifacts | 47 pass |
| Test-title verification | 0 gaps |
| Template rendering / requirements tree | Passed |
| Map / README checks | 0 problems |

The isolated acceptance rerun passed all 58 non-baseline checks; its remaining check requires an external main checkout. The separate Git-history comparison above supplied local baseline verification.

Windows CI and the 137-file locked suite remain supplied evidence; I did not independently rerun them. Checkout unchanged.

VERDICT: LAND-WITH-FIXES
