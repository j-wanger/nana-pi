1. **MUST — Step 1.3 breaks the bare-path compatibility promised by M3.**

   It runs whenever the first token lacks backticks—not just when that token is prose.

   **Evidence:** `docs/reviews/build-records-2026-10-22/build-brief-1.md:12` starts with `apps/bench/lib/usage.mjs` but mentions moving helpers into backticked `packages/nana-pack/lib/pi-usage.mjs`. The plan selects the destination instead of the precedent. Both exist at HEAD, so this silently passes.

   Worse, line 11 starts with `packages/nana-pack/bin/review-round.mjs` and mentions backticked `repoKeyOf`. The plan now refuses this accepted bullet. A2’s claim that non-path spans “were refused before too” is false for bare-path-first entries.

   **Fix:** Resolve precedence explicitly: preserve an identifiable bare-path subject before searching prose for spans, or declare the compatibility break. Add literal fixtures containing a bare subject followed by both a tracked secondary path and a non-path span. M3’s current minimum corpus need not contain either.

2. **MUST — The must-meets leave central selection and diagnostic behavior unproved.**

   **Evidence:** Plan M1 kills main’s first-token parser. M3’s bare examples kill a “first backtick only, no fallback” parser. However, neither establishes precedence when multiple spans occur. M2 can pass with a parser that skips an invalid first span and accepts a later tracked span.

   The diagnostic cap also has no chosen value, unit, or ellipsis accounting. “Capped” and “sealed” cannot pin one observable result yet. `brief-precedent.mjs:30` removes bold markers before parsing; quoting that normalized string would not quote the original bullet.

   **Fix:** Add these cases within the named must-meets:
   - tracked first span followed by untracked span: select the first;
   - invalid first span followed by tracked span: refuse;
   - prose with no span: refuse;
   - bold, wrapped refusal: retain a defined original-text representation;
   - fixed cap, counting unit, and exact boundary/ellipsis expectations.

   State the rows as observable selection and refusal behavior, not assertions that a helper or constant exists.

3. **SHOULD — Bare-folder fallback preserves a demonstrated prose false positive.**

   **Evidence:** A temporary brief containing `- scripts and tests provide the precedent` passed the real `brief-check.mjs` with exit 0 and `1 checked at HEAD bfde4ae2`. A pure probe likewise accepted `- docs describe it`.

   `trackedAtHead` deliberately accepts directories (`brief-precedent.mjs:65–68`); the existing R-2580 fixture explicitly accepts bare `tracked` (`worker-lane.test.mjs:198`). Thus this is pre-existing, not introduced here, but A1 preserves more than historical file-path compatibility.

   **Fix:** Make the ambiguity an explicit seat decision. Either require backticks or a trailing slash for directory subjects, updating the existing contract/test, or document this accepted residual. Do not claim all pathless prose is refused.

4. **SHOULD — Define the Markdown boundary cases rather than claiming broad honest-variation coverage.**

   **Evidence:** Scanner probes produced:
   - wrapped CRLF bullet → one joined entry;
   - nested sub-bullet → a separate entry, not part of its parent;
   - double-backtick span → delimiters retained in `entryText`;
   - space-containing path and URL → complete text retained before normalization.

   These follow `markdown-list-sections.mjs:58–76` and `brief-precedent.mjs:21–22`. M1 covers wrapping and bold, but not delimiter width, spaces, or nested-entry semantics. A naïve single-backtick regex can mishandle double backticks.

   **Fix:** Specify supported code-span delimiters, whole-span handling for spaces, URL refusal, and whether every nested item independently needs a precedent. Add cases under M1/M2/M3; preserve R-2616’s marker-kind boundary rather than accidentally absorbing sub-bullets.

5. **SHOULD — Include the actual downstream consumers and document the changed contract.**

   **Evidence:** Only worker and brief-check enforce launch refusal (`pi-worker.mjs:177–184`, `brief-check.mjs:42–51`). Pi-review uses the Feature line to identify its brief (`pi-review.mjs:227`); both reviewers obtain precedent-dependent digest selection through `known-bug-digest.mjs:24–25`. Neither refuses a review for an invalid Precedent.

   Another consumer is missing from the plan: `apps/bench/lib/anatomy-sessions.mjs:135–136` supplies parsed paths to pull classification; `anatomy-pulls.mjs:34` labels matching reads as precedent. Finding 1 therefore changes measured context attribution, not merely validation. Digest selection can also change when old bare subjects disappear.

   **Fix:** Add these consumers to the impact forecast and focused checks. Update the reader-facing contract in `packages/nana-pack/README.md:747`. Keep the lane ordinary: the classifier probe with all planned files printed `ordinary`, with reviewer reach reported separately.

**Counts: 2 MUST, 3 SHOULD.**
