# Build 2 — tip verification follow-up

This record supersedes the timing-margin paragraph in `build2-notes.md`. It does not replace the frame/spec judgement there.

## Closures

1. The visible return loop, centred chapter places and unannotated packet strips remain as recorded in build 2.
2. The gate-to-customs zoom now has measured margin below the existing 0.12 relative camera-step limit. Broad road framing stays unchanged. Non-opening single-lot stops retain a sealed 1.4 fitting-distance allowance; today that applies to customs. The main place remains centred, and its complete bounds still fit.

## Requirement, test, code order

Amended R-3174 first to state the allowance. Extended its existing `R-3174: request journey frames fourteen narrated chapters` test to pin 1.4 and compare the actual single-lot pose distance to the imported camera fit at both widths. No new test was added.

`build2-wrong-closeup.txt` records exit 1 against the absent allowance. The production change then adds `NARRATION.closeupPadding` in `apps/hive/config.mjs` and applies it in `apps/hive/tour.mjs`. `build2-margin-city.txt` records exit 0, all 19 checks. The README states the allowance. No other row changed in this follow-up.

## Measurement boundary departure

The unmodified gesture CLI can read the previous frame after same-document hash navigation. Its ready attribute survives the hash change. On the first pushed tip it failed its street-pixel check twice; this was not a street-material failure.

`build2-tip-readiness-probe.txt` records the exact state at the failed read:

```text
PIXEL_READ_STATE {"hash":"#overview","chapter":"workshop","stage":"5","target":"5","ready":"webgl","pose":"{\"target\":[61.117,4.65,5.859],\"position\":[61.117,748.878,1100.312]}"}
```

The probe imports the existing exported gesture `main`; it wraps only the pixel-read call to report the page state in that same call. It does not change the assertions, page, camera, materials or route.

To measure the intended chapter, `/tmp/city-loop-2-gesture-guard.mjs` imports that same `main` and the shared Playwright resolver. It wraps `browser.newPage` so `page.goto` also awaits `data-hive-chapter` matching the requested hash. All checker cases and assertions remain the original ones. This is an external measurement-boundary departure, like the already documented 390 px capture wrapper. The repository's gesture checker and ready-mark implementation are unchanged; no suite test imports the wrapper.

With that boundary guarded, a 17.9 ms frame exposed a separate actual camera-step peak: 0.135274 on the gate-to-customs transition. `build2-tip-guard-step.txt` retains it. The 1.4 single-lot allowance addresses that peak rather than changing the threshold, clock, scroll rate or assertion.

## Final guarded measurement before the follow-up commit

`build2-margin-gesture.txt`: exit 0, **gesture checks: 26 passed, 0 failed**.

| Width / input | Original before p95 ms | Corrected after p95 ms | Corrected max relative step | Reversals / stage reversals |
|---|---:|---:|---:|---|
| 1280 / ticks | 10.0 | 9.9 | 0.0355 | 0 / 0 |
| 1280 / smooth | 10.0 | 10.2 | 0.0906 | 0 / 0 |
| 390 / ticks | 16.7 | 16.8 | 0.0633 | 0 / 0 |
| 390 / smooth | 10.3 | 16.7 | 0.0692 | 0 / 0 |

Every p95 remains below 20 ms. Settling is exact, with no long task, reversal, idle drift, geometry allocation or shadow rebuild. First-use packet buffer uploads remain disclosed in the original record.

## Precedent, scope and open question

The fit still imports `focus` and preserves the precedent's target and orbit pose. No helper was copied or moved. No plan flow, narration, material, window, return ribbon, packet, gesture binding or protected file changed in this follow-up.

Open question for the seat: should a later checker-only change make same-document ready waiting chapter-aware? The external guard proves the current rendered page, but the unmodified CLI retains that measurement race. This builder did not broaden the product fix into that checker change or post a GitHub issue.

The first follow-up locked run passed all 8765 assertions but exited 1 because its redirected log was already staged. The runner correctly reported that tracked file changing during the run. `build2-full-suite-followup-failed.txt` retains that command error. The corrected foreground run writes to the OS temp directory; its completed output is copied into the reviewed record only afterward.

Corrected foreground locked suite: exit 0. Full output: `build2-full-suite-followup.txt`.

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8765 pass, 0 fail, 44 skip · 612.1s**

The final response reports the follow-up tip's named checks and finished CI. Captures for chapters 07, 08, 12, 13 and the visits remain the same rendered geometry and poses; the final tip is captured again outside git before reporting.
