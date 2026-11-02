# Plan — seat-anatomy-roster-notice (revision 2, after `plan-attack.md`)

## Purpose

A fix that restores agreed behaviour. R-3640 says anatomy attributes commandless additional context to its hook's kind. The seat-anatomy round 1 review (both reviewer files in `docs/reviews/seat-anatomy-2026-11-02/`) found the roster notice's text arrives in a commandless `hook_additional_context` entry and always counts as `hook-other`. Build 4 added "preceding same-event hook" attribution, but the regenerated `seat-counts.md` still shows roster-notice 0 and hook-other 8,145. The seat's request: attribute that entry to the roster-notice kind by the public hook label or the hook group, never by transcript text; regenerate the counts.

Real shape (content-free dump the Mac seat ran on its own transcripts, 2026-11-02, six windows, all alike):

- The commandless entry: `type=hook_additional_context`, `hookName="SessionStart"` (no `:startup`/`:clear`/`:compact` suffix), `hookEvent=SessionStart`, keys `content,hookEvent,hookName,toolUseID,type`, about 207 chars, a `toolUseID` that differs from the group's.
- It follows the LAST hook_success of the group, which is "nana: objective + current priority", never the roster notice.
- The roster notice's own hook_success has `content` of length 0 and `stdout` of 282 or 504 chars. The hook prints JSON with `hookSpecificOutput.additionalContext` (`nana-roster-notice.mjs:59-63`); Claude Code moves that context into the separate commandless entry. The other nana SessionStart hooks print plain text.
- So the build 4 rule never fires on real data: the invocation ids differ, and if they matched it would pick objective.

## Design

1. A context producer is a SessionStart hook whose public label (imported from `desiredHooks`) resolves to a kind listed in one new sealed policy field, `SEAT_POLICY.contextHooks`, holding `['roster-notice']`. Provenance: contract, `nana-roster-notice.mjs:59-63`, the only nana SessionStart hook that emits `additionalContext`. Output lengths play no part (attack 2).
2. Attribution runs in the per-window post-pass, after the whole start window is collected (attack 4). For each commandless SessionStart `hook_additional_context` part in a window: the candidates are the window's `hook_success` parts from context producers. Exactly one candidate kind gives that kind. None gives `hook-other`. Two or more different producer kinds give `hook-other` plus one `hook-correlation` ambiguity. The part's spans are re-segmented under the new kind.
3. The build 4 preceding-hook rule is removed for commandless entries (attack 1). Commandless context never takes a kind by adjacency or by matching invocation ids.
4. Dedupe (R-3643) compares an attributed commandless part only with its resolved producer's own success part, never with another hook's content (attack 3). The envelope check reads the producer's `hookSpecificOutput.additionalContext` as well as the top-level `additionalContext`. A matching producer removes the duplicate once; otherwise the part stays.
5. A window closed before the commandless entry arrives (assistant work, an owner turn) starts a new `unknown` segment. That segment has no producer, so the entry stays `hook-other`. Correlation never reaches back across a closed window.

## Assumptions

- A1: The roster notice stays the only nana SessionStart hook that emits `additionalContext`. A new one is added to `contextHooks` by the lane that adds it; until then its context counts as hook-other, never as roster-notice.
- A2: A foreign (non-nana) hook that emits additionalContext in the same window is not a producer. Its context and the roster notice's are then indistinguishable, so with a foreign JSON hook present the roster notice's entry may still count as roster-notice. The threat model accepts this residual; the window has no shape that separates them without text.
- A3: The roster notice's `stdout` (the JSON envelope) is not model-visible payload and stays uncounted, as today. Its `systemMessage` copy arrives as `hook_system_message`, which stays out of scope.
- A4: The counts regeneration needs the Mac's transcripts. The Mac seat runs baseline (main) and candidate (lane tip) on one frozen copy of the input. It records both revisions, the invocation, the counts-only denominators and the output file's checksum, and sends back the sanitized `docs/reviews/seat-anatomy-2026-11-02/seat-counts.md` plus that record. The windows sub-seat commits both, and the final review covers that commit.

## Open choices

- O1: How the post-pass renames a part (re-push versus mutate name and spans). Builder decides and reports.

## Questions for the owner

None.

## Feature

Feature: FEAT-042 · Measure what each role's context is for

Lane class: `node scripts/lane-class.mjs --root . --files apps/bench/lib/anatomy-seat.mjs,apps/bench/lib/anatomy-config.mjs,apps/bench/test/anatomy-seat.test.mjs,REQUIREMENTS.md,docs/reviews/seat-anatomy-2026-11-02/seat-counts.md` prints `ordinary`.

## Threat model

In scope: honest variation in Claude Code's recorded hook shapes. That covers the commandless entry's position, a hookName without a suffix and an unrelated toolUseID. It also covers empty content with JSON stdout, more or fewer nana hooks in a group, failed hooks (`hook_non_blocking_error`) and foreign hooks. Out of scope: a transcript forged to imitate a producer. A mis-attribution there is a residual, because anatomy is a descriptive count, not a gate.

## Precedent

- `apps/bench/lib/anatomy-seat.mjs`: `hookKind` (the status-label lookup through `desiredHooks`), the `precedingHook` attribution this lane removes for commandless entries, and the per-window `windows` post-pass. That pass already correlates hook_additional_context with hook_success parts and records `hook-correlation` ambiguity. The fix extends that pass and adds no new module.
- `apps/bench/lib/anatomy-config.mjs`: `SEAT_POLICY.hooks` and `SEAT_POLICY.correlation`. `contextHooks` and the nested envelope path go here as policy, with provenance.
- `packages/nana-setup/lib/settings.mjs`: the `desiredHooks` status labels, such as "nana: roster notice". Import them; never retype them.
- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`: the JSON envelope the hook prints. Read it to confirm the contract.
- `apps/bench/test/anatomy-seat.test.mjs`: the `hook`, `attachment` and `segment` fixture helpers, and the existing R-3640, R-3641 and R-3643 tests.
- The map search for "hook additional context attribution" added `nana-roster-notice.mjs` and `settings.mjs`, both already listed above.

## Outside precedent

none: Claude Code's transcript attachment shapes are undocumented internals. The only references are the Mac dump above and the repo's own fixtures.

## Must-meet

Rows R-3682 to R-3684 (FEAT-042). Amend R-3640's text: commandless additional context takes its start window's one context producer's kind, or hook-other. Remove "preceding same-event hook".

- M1 (R-3682): commandless SessionStart context counts as the kind of its window's one context producer. Use a real-shaped fixture in this order: shared memory, roster notice (empty content, JSON stdout), adoption and objective successes. All four share one toolUseID and a `:compact` suffix. Then add a commandless entry with `hookName: "SessionStart"` and a different toolUseID. Pins: the part's name is `roster-notice`, and the report's roster-notice chars equal the context's length. Objective's chars stay unchanged and the totals are conserved. Repeat with `:startup` and `:clear` groups. Repeat once with the commandless entry before the producer's success inside the same window, to prove order does not matter.
- M2 (R-3683): the rule never guesses. Each pin is a separate case:
  - No producer in the window gives `hook-other`. Run this with the commandless entry's invocation id missing, equal to objective's, and different from it.
  - The roster notice failed (`hook_non_blocking_error`, no success) gives `hook-other`.
  - A producer in an earlier window does not attribute a later window's entry. Pin the segment count and start type: an assistant entry closes the window before the commandless entry.
  - Two producer kinds give `hook-other` and exactly one `hook-correlation` ambiguity. Use a synthetic second `contextHooks` entry injected through the policy argument, or the builder's equivalent.
- M3 (R-3684): attribution uses labels and window, never text or lengths, and dedupe stays with the producer.
  - Changing the context's text, to one naming "objective" or "shared memory", leaves the kind unchanged.
  - Swapping the roster success's label for objective's moves attribution away from roster-notice.
  - Objective content that contains the context's text does not remove the roster-notice part.
  - The roster stdout's chars are counted nowhere.

Expected existing-test edits:
- R-3640's "public hook labels and commandless attribution" test: only roster-notice attributes, and the other three kinds give hook-other.
- R-3643's objective total loses the nine `unsettled` chars to hook-other.
- R-3640's seal test gains `contextHooks`.
List each in the report.

Seat checks after the build:
- `node apps/bench/test/anatomy-seat.test.mjs`, `node apps/bench/test/anatomy.test.mjs` and `node apps/bench/test/anatomy-labels.test.mjs`.
- `packages/nana-pack/tests/test-runner.test.mjs`.
- The map, readme, trace, tree and known-bugs checks, and the identity scan.
- Then A4's regeneration on the Mac. Its roster-notice row must be non-zero. Hook-other must change by the amount the baseline-versus-candidate record explains.
