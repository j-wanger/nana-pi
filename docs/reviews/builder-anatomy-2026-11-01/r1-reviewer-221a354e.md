I'm sending this back for one MUST: the sampler ignores its seed for most of the sample, so the recorded agreement figures describe a few builds rather than the whole set of recorded builds.

## MUST

**The sample is not seeded after the minimum picks** (`apps/bench/lib/anatomy-measures.mjs:79`, with `apps/bench/lib/catch-stats.mjs:33`)

- **The cause.** `drawSample` fills each rule-tier group by calling `seededSample(ids, units.length, seed)`. That helper's last step, `.slice(0, k).sort()`, sorts its result alphabetically. With `k` set to every unit, it hands back every id in alphabetical order, not in seed order. The round-robin loop then takes the first ids alphabetically from each tier. The comment above `drawSample` says "seed order is imported", but it isn't.
- **What the seed controls.** Only the minimum picks, about 25 of 150 units (2 per function and 1 per tier). The other ~125 are the lowest unit ids. Build ids are random UUIDs from `pi-worker`, and these sort before every `older-N` id. So the sample comes from whichever few recorded builds have the lowest UUIDs. The 446 older builds (74% of the 600) enter almost only through the minimum picks.
- **The probe.** I ran 600 synthetic builds (154 UUID ids, 446 `older-N`) with mixed tiers. Seeds `builder-anatomy-2026-11-01` and `seed-two` shared 142 of 150 units. The sample covered 35 of the 600 builds, and only 6 units came from older builds. With all units in one tier, both seeds drew from the same 5 builds.
- **The consequence.** The seat's corpus has this shape, so the recorded figures describe a handful of builds:
  - κ 0.82 between the labellers, and "the ten functions sort cleanly".
  - Rules against the consensus at 0.31.
  - Precedent at 0.27, and its merge-or-split proposal for the owner.

  These figures are quoted in `HANDOFF.md`, the session entry, `anatomy-counts.md` and `docs/known-bugs/FEAT-042.md`. The next lane, the model labeller, would check itself with this same sampler.
- **The test misses it.** The R-3276 test checks only that the same seed draws the same units. It still passes when the seed is ignored, so it doesn't pin what T7 intends: a draw that the seed decides.
- **Fix.**
  1. Order each tier group by `sha256(seed|id)` without the final sort.
  2. Add a test that two seeds draw different units beyond the minimum picks, and that a tier group spans builds.
  3. Draw a new sample. Then re-run the labellers, or mark the κ figures as coming from a non-random sample.

## What holds

- **No unit text printed.** Every printer outputs counts, a fixed vocabulary, safe part names (an unknown part becomes `extra-section`), duplicate ids, build id, lane, model and the final verdict word. Errors print fixed reasons or `ids differ: N`. Git output is captured, and none of the imported helpers print. `anatomy-counts.md` holds counts only.
- **Checkout refusal.** All three writers use `privateFolder` with `refuseCheckout`. It resolves the nearest existing ancestor and walks up looking for `.git`, which also catches worktrees. A final-component symlink is refused. Files are created exclusively with owner-only mode, and the test pins this for all three writers.
- **Blind sheet.** Each row holds only `{id, text}`. The id carries build, attempt, part index and span index, but no part name, heading or rule.
- **Kappa.** `agree` uses the imported `cohensKappa`, and the test checks the result equals it.
- **Assembly.** Dropping or staging a function left every other span byte-identical in my probe, apart from the empty-heading case below.
- **Tests.** `node apps/bench/test/anatomy.test.mjs` passes 9/9 locally. `nana-writing HANDOFF.md` is clean.

## SHOULD / NOTE (known-bug lines)

- **SHOULD:** `assemble` writes every attempt's parts in one numbered sequence, and `parts.json` has no attempt field. A slice-2 replay of a two-attempt build can't tell attempt 1's parts from attempt 2's.
- **NOTE:** Any `--drop` removes a heading with no units under it at all, even when nothing under it was dropped; `removedUnits` stays 0. My probe used a trailing `## Empty` and dropped `tools`.
- **NOTE:** Dropping table rows leaves the table's header and delimiter rows behind, because both count as separators.
- **NOTE:** Staged units are joined with no separator. When a part's last unit has no trailing newline, it runs into the next staged unit.

VERDICT: SEND-BACK
