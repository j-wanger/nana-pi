# Plan attack: visual-check (2026-10-29)

Adversary on `plan.md`. Counts: 2 MUST, 4 SHOULD, 3 NOTE.

## Probe (run, not inferred)

Three cold `gpt-6-astra` runs (plan flags, reviewer env, empty cwd, 300 s alarm), seven images each: two page frames (the hive's top 1000 px at 1280 and 380), then five reference frames. Inputs and answers: seat scratchpad `probe-va/`.

- **A. Hive vs 3dmk, a pinned six-line spec**. All six lines came back FAIL with concrete reasons ("sparse pixelated dots", "stacked opaque bordered cards"). Verdict: reads as a demo.
- **B. Hive vs 3dmk, a vague five-line spec**. Lines 1 to 3 PASSED. Lines 4 and 5 FAILED. The verdict was still demo.
- **C. Positive control: reference frames given as the page, spec A.** Lines 1 to 5 PASSED. Line 6 FAILED as "an evidence gap" (no 380 frame). Verdict: holds up.

So it does not rubber-stamp on this case, and it can pass. But under A2's all-PASS bar, run C prints `visual-reader: fail`. That is the failure mode the plan does not see.

## MUST

**M1. The acceptance is one-sided, and a reader that always fails meets it.** The seat check only requires a fail on the hive. So does a FAIL-biased prompt or the A2 bar (run C). Fix: add a positive control to the seat check. Run the reference frames as the page and require `pass`; record both runs. The lane does not land unless the hive run prints fail with the demo line and the control prints pass.

**M2. The A2 bar plus desktop-only references gives a false fail on every lane.** All five 3dmk frames are 1543 px wide. Any spec line judged at 380 px therefore has no narrow-width reference. Run C marked that line FAIL. Under "every line PASS" the gate fails good pages and the seat learns to override it. Fix: give the answer format a third word, `UNJUDGED — no evidence`. Pass means no FAIL and verdict "holds up". Or require the reference set to hold a frame at each sealed width. Pin that case in R-3146's fixtures.

## SHOULD

**S1. The art spec is not pinned, and it is written after the verdict is known.** "A short art spec written from the 3dmk frames" will be written by a seat who already saw the slop. Run B shows the spec decides the per-line result: three vague lines passed the hive. Fix: put the acceptance spec text in the lane folder (text only, no third-party images, no author name) before build 1.

**S2. The reader tests style match and calls it quality.** Spec A's lines 1, 3 and 5 are 3dmk's look. A well-made page in another style would fail them, and the reader would call it a demo. Fix: the prompt says the reference sets the quality bar, and the spec sets the look.

**S3. The plan clashes with feat/hive-render's parser, not just its text.** On that branch, `--page url` *requires* `--before`, which R-3142 omits. `--hive` hard-codes the ready wait, its timeout line and reduced motion, so R-3144 adds a second ready mechanism. Url-mode `--out` there has no inside-repo refusal, which contradicts R-3143. Fix: pin the merged shape now. `--hive` keeps its own wait, and `--ready` is for other pages, or `--hive` becomes `--ready 'html[data-hive-ready]'` plus the canvas probe. `--before` is optional with `--reference`. The refusal covers all url-mode `--out`. A3: the second lane to land carries it.

**S4. The reference-URL half of R-3144 is speculative.** No reference today is a URL. 3dmk is a 7.2 MB WebGL page whose opening frame is a loader, so a fixed settle delay would capture the loader. Fix: cut URL references to a later lane and keep `--ready`. That leaves R-3144 one WHEN.

## NOTE

- **N1. Lineage.** astra caught luna's page in runs A and B, so on this sample the shared OpenAI lineage did no harm. That is one sample. Keep the default.
- **N2. Ceremony.** `side-by-side.png` is rendered only for the seat; the HTML serves. Drop it.
- **N3. Pin the verdict tokens.** R-3146 should parse the two fixed verdict phrases the prompt gives, not "says the page holds up". All three runs echoed them exactly.
