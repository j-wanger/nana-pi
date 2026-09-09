# tool-profiles-2026-09-08 — summary

Runs recorded: **132**. Generated 2026-09-09T07:41:01.969Z.

**Success** = the deterministic checker passed AND pi exited 0 AND the stream reached `agent_settled` with no dangling tool calls.
**Denominator** = decided runs only: grader errors, harness errors and blocked runs are reported but never counted as model failures.
**Spend** = the run's own tokens PLUS any nested LLM tokens an extension reported, counted once. No run was ever retried.
**$** = pi's own `calculateCost` output (public `@earendil-works/pi-ai` root export), summed. A cell shows **unknown** when any of its runs carried spend nothing could measure or price; the `≥` figure beside it is the priced part, an explicit LOWER BOUND, never a total.

## Family `code` — 8 shared task(s)

| profile | success | median of task medians | total of task medians | total $ (unknown ⇒ observed ≥) | wall median (s) | cold/warm | retries | nested unknown | tool mix |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| lean-code | 24/24 (100%) | 5297 | 126231 | $0.42299 | 10.88 | 7/17 | 0 | 0 | bash:19 grep:16 read:12 edit:6 find:3 write:3 ls:2 |
| lean-code-hinted | 24/24 (100%) | 5434 | 156760 | $0.45855 | 13.06 | 9/15 | 0 | 0 | bash:19 grep:17 read:14 edit:6 find:5 ls:3 write:3 |
| pi-defaults | 24/24 (100%) | 3731 | 121962 | $0.372496 | 10.78 | 14/10 | 0 | 0 | bash:44 read:14 edit:6 write:3 |
| research | 24/24 (100%) | 12209 | 202531 | $0.398122 | 12.71 | 0/24 | 0 | 0 | bash:28 grep:15 read:13 edit:6 find:5 write:3 ls:1 |

Per-task successes (the decision rule reads these):

| profile | code-bugfix | code-callsites | code-define-large | code-define-small | code-exports | code-glob-count | code-guard | code-imports |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| lean-code | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| lean-code-hinted | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| pi-defaults | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| research | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |

## Family `research` — 6 shared task(s)

| profile | success | median of task medians | total of task medians | total $ (unknown ⇒ observed ≥) | wall median (s) | cold/warm | retries | nested unknown | tool mix |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| lean-code | 18/18 (100%) | 3171.5 | 21814 | $0.11035 | 10.59 | 12/6 | 0 | 0 | bash:17 |
| research | 18/18 (100%) | 14866 | 121301 | unknown (observed ≥ $0.286038) | 10.83 | 1/17 | 0 | 3 | fetch_content:11 bash:9 get_search_content:1 |

Per-task successes (the decision rule reads these):

| profile | res-doc-phrase | res-first-version-with-dep | res-npm-latest | res-npm-pinned-license | res-npm-pinned-shasum | res-npm-version-count |
|---|---:|---:|---:|---:|---:|---:|
| lean-code | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| research | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |

## Per task × profile

| family | task | profile | n | states | success | spend median | IQR | spend/success | $ median | own | nested | wall (s) | turns | cacheRead med | tool mix |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| code | code-bugfix | lean-code | 3 | ok:3 | 3/3 | 35067 | 9476.5 | 40229 | $0.097061 | 35067 | 0 | 30.61 | 6 | 19072 | bash:6 grep:5 read:3 edit:3 |
| code | code-bugfix | lean-code-hinted | 3 | ok:3 | 3/3 | 62355 | 14950.5 | 54201 | $0.145066 | 62355 | 0 | 31.51 | 8 | 36864 | bash:7 grep:6 read:3 edit:3 find:2 ls:2 |
| code | code-bugfix | pi-defaults | 3 | ok:3 | 3/3 | 41707 | 8065.5 | 45054 | $0.092328 | 41707 | 0 | 34.34 | 8 | 32384 | bash:14 read:5 edit:3 |
| code | code-bugfix | research | 3 | ok:3 | 3/3 | 51569 | 12321.5 | 59211 | $0.10877 | 51569 | 0 | 30.36 | 6 | 35584 | bash:6 grep:4 read:3 edit:3 find:2 |
| code | code-callsites | lean-code | 3 | ok:3 | 3/3 | 3366 | 135.5 | 3343 | $0.012624 | 3366 | 0 | 8.91 | 2 | 1408 | bash:2 grep:1 |
| code | code-callsites | lean-code-hinted | 3 | ok:3 | 3/3 | 3388 | 67 | 3418 | $0.020865 | 3388 | 0 | 13.5 | 2 | 0 | bash:3 |
| code | code-callsites | pi-defaults | 3 | ok:3 | 3/3 | 2542 | 851 | 3068 | $0.015125 | 2542 | 0 | 12.51 | 2 | 0 | bash:4 |
| code | code-callsites | research | 3 | ok:3 | 3/3 | 9037 | 2344 | 10432 | $0.015302 | 9037 | 0 | 12.04 | 2 | 8192 | bash:3 grep:1 |
| code | code-define-large | lean-code | 3 | ok:3 | 3/3 | 3163 | 1 | 3164 | $0.016765 | 3163 | 0 | 8.67 | 2 | 0 | grep:3 |
| code | code-define-large | lean-code-hinted | 3 | ok:3 | 3/3 | 3207 | 2 | 3207 | $0.010659 | 3207 | 0 | 8.05 | 2 | 1408 | grep:3 |
| code | code-define-large | pi-defaults | 3 | ok:3 | 3/3 | 2400 | 11.5 | 2406 | $0.01335 | 2400 | 0 | 9.04 | 2 | 0 | bash:3 |
| code | code-define-large | research | 3 | ok:3 | 3/3 | 8629 | 2 | 8629 | $0.007241 | 8629 | 0 | 8.41 | 2 | 8192 | grep:3 |
| code | code-define-small | lean-code | 3 | ok:3 | 3/3 | 5997 | 0 | 5997 | $0.030935 | 5997 | 0 | 8.21 | 2 | 0 | grep:3 |
| code | code-define-small | lean-code-hinted | 3 | ok:3 | 3/3 | 6039 | 1 | 6040 | $0.024819 | 6039 | 0 | 8.16 | 2 | 1408 | grep:3 |
| code | code-define-small | pi-defaults | 3 | ok:3 | 3/3 | 5292 | 14 | 5291 | $0.027735 | 5292 | 0 | 8.76 | 2 | 0 | bash:3 |
| code | code-define-small | research | 3 | ok:3 | 3/3 | 11463 | 11 | 11469 | $0.021401 | 11463 | 0 | 9.63 | 2 | 8192 | grep:3 |
| code | code-exports | lean-code | 3 | ok:3 | 3/3 | 3614 | 1 | 3615 | $0.012669 | 3614 | 0 | 7.84 | 2 | 1408 | read:3 |
| code | code-exports | lean-code-hinted | 3 | ok:3 | 3/3 | 3656 | 2 | 3657 | $0.019205 | 3656 | 0 | 7.48 | 2 | 0 | read:3 |
| code | code-exports | pi-defaults | 3 | ok:3 | 3/3 | 2846 | 10 | 2853 | $0.015155 | 2846 | 0 | 8.32 | 2 | 0 | read:3 |
| code | code-exports | research | 3 | ok:3 | 3/3 | 9080 | 1 | 9079 | $0.009461 | 9080 | 0 | 8.32 | 2 | 8192 | read:3 |
| code | code-glob-count | lean-code | 3 | ok:3 | 3/3 | 4763 | 5 | 4765 | $0.019604 | 4763 | 0 | 12.86 | 3 | 1408 | find:3 bash:3 |
| code | code-glob-count | lean-code-hinted | 3 | ok:3 | 3/3 | 4829 | 20 | 4838 | $0.013673 | 4829 | 0 | 12.61 | 3 | 2816 | find:3 bash:3 |
| code | code-glob-count | pi-defaults | 3 | ok:3 | 3/3 | 2334 | 1 | 2335 | $0.012745 | 2334 | 0 | 8.05 | 2 | 0 | bash:3 |
| code | code-glob-count | research | 3 | ok:3 | 3/3 | 12955 | 4 | 12957 | $0.030006 | 12955 | 0 | 13.39 | 3 | 8192 | find:3 bash:3 |
| code | code-guard | lean-code | 3 | ok:3 | 3/3 | 64430 | 6492.5 | 65580 | $0.20498 | 64430 | 0 | 49.48 | 6 | 39040 | bash:7 read:6 edit:3 write:3 ls:2 |
| code | code-guard | lean-code-hinted | 3 | ok:3 | 3/3 | 65055 | 905.5 | 65435 | $0.183306 | 65055 | 0 | 32.67 | 5 | 37632 | read:6 bash:6 edit:3 write:3 ls:1 |
| code | code-guard | pi-defaults | 3 | ok:3 | 3/3 | 60225 | 13514.5 | 66907 | $0.164403 | 60225 | 0 | 42.3 | 6 | 44288 | bash:11 read:6 edit:3 write:3 |
| code | code-guard | research | 3 | ok:3 | 3/3 | 75548 | 5001 | 72310 | $0.146496 | 75548 | 0 | 47.9 | 6 | 45312 | bash:9 read:6 edit:3 write:3 ls:1 |
| code | code-imports | lean-code | 3 | ok:3 | 3/3 | 5831 | 1057 | 5158 | $0.028352 | 5831 | 0 | 20 | 3 | 1664 | grep:4 bash:1 |
| code | code-imports | lean-code-hinted | 3 | ok:3 | 3/3 | 8231 | 2324 | 6757 | $0.040957 | 8231 | 0 | 19.69 | 4 | 0 | grep:5 read:2 |
| code | code-imports | pi-defaults | 3 | ok:3 | 3/3 | 4616 | 134 | 4619 | $0.031655 | 4616 | 0 | 19.02 | 3 | 0 | bash:6 |
| code | code-imports | research | 3 | ok:3 | 3/3 | 24250 | 5843 | 24869 | $0.059445 | 24250 | 0 | 32.58 | 5 | 16640 | bash:7 grep:4 read:1 |
| research | res-doc-phrase | lean-code | 3 | ok:3 | 3/3 | 1533 | 0.5 | 1533 | $0.007815 | 1533 | 0 | 5.73 | 1 | 0 | — |
| research | res-doc-phrase | research | 3 | ok:3 | 3/3 | 4280 | 25.5 | 4287 | $0.004598 | 4280 | 0 | 6.58 | 1 | 4096 | — |
| research | res-first-version-with-dep | lean-code | 3 | ok:3 | 3/3 | 7606 | 941.5 | 7002 | $0.032085 | 7606 | 0 | 19.4 | 3 | 2560 | bash:6 |
| research | res-first-version-with-dep | research | 3 | ok:3 | 3/3 | 36646 | 22484 | 36508 | unknown ≥$0.0847 | 36646 | 0 ⚠? | 18.14 | 3 | 23040 | bash:4 fetch_content:2 get_search_content:1 |
| research | res-npm-latest | lean-code | 3 | ok:3 | 3/3 | 3136 | 6 | 3136 | $0.01703 | 3136 | 0 | 10.75 | 2 | 0 | bash:3 |
| research | res-npm-latest | research | 3 | ok:3 | 3/3 | 20238 | 5839.5 | 16369 | unknown ≥$0.065301 | 20238 | 0 ⚠? | 10.64 | 2 | 8192 | fetch_content:3 |
| research | res-npm-pinned-license | lean-code | 3 | ok:3 | 3/3 | 3147 | 813.5 | 2641 | $0.01741 | 3147 | 0 | 9.9 | 2 | 0 | bash:2 |
| research | res-npm-pinned-license | research | 3 | ok:3 | 3/3 | 8607 | 26 | 8619 | unknown ≥$0.008591 | 8607 | 0 ⚠? | 11.02 | 2 | 8192 | bash:2 fetch_content:1 |
| research | res-npm-pinned-shasum | lean-code | 3 | ok:3 | 3/3 | 3196 | 2 | 3197 | $0.017905 | 3196 | 0 | 10.44 | 2 | 0 | bash:3 |
| research | res-npm-pinned-shasum | research | 3 | ok:3 | 3/3 | 9494 | 2 | 9494 | $0.031003 | 9494 | 0 | 10.39 | 2 | 4096 | fetch_content:3 |
| research | res-npm-version-count | lean-code | 3 | ok:3 | 3/3 | 3196 | 25 | 3185 | $0.018105 | 3196 | 0 | 10.78 | 2 | 0 | bash:3 |
| research | res-npm-version-count | research | 3 | ok:3 | 3/3 | 42036 | 16701 | 30905 | $0.091845 | 42036 | 0 | 15.72 | 3 | 26112 | bash:3 fetch_content:2 |

## `code`: ratio to baseline `pi-defaults` (median spend; Δ successes)

| task | lean-code | lean-code-hinted | research |
|---|---:|---:|---:|
| code-bugfix | 0.84× (+0) | 1.5× (+0) | 1.24× (+0) |
| code-callsites | 1.32× (+0) | 1.33× (+0) | 3.56× (+0) |
| code-define-large | 1.32× (+0) | 1.34× (+0) | 3.6× (+0) |
| code-define-small | 1.13× (+0) | 1.14× (+0) | 2.17× (+0) |
| code-exports | 1.27× (+0) | 1.28× (+0) | 3.19× (+0) |
| code-glob-count | 2.04× (+0) | 2.07× (+0) | 5.55× (+0) |
| code-guard | 1.07× (+0) | 1.08× (+0) | 1.25× (+0) |
| code-imports | 1.26× (+0) | 1.78× (+0) | 5.25× (+0) |

Apply the decision rule in `DESIGN.md` to these numbers; this file computes them and stops there.

