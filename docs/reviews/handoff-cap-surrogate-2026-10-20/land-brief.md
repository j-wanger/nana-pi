# Review — handoff-cap-surrogate (the pi seat's injected compaction summary no longer ends on half a surrogate pair), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-002 · Resume decisions and next actions (SUB-003 · Frame recent and stale context)

Review `git diff aa5f25cd..HEAD` on `feat/handoff-cap-surrogate` (`git merge-base HEAD main` is `aa5f25cd`, the
mutation-runner-lock-overlap land tip, which the lane merged at `e58bd585`; main was `aa5f25cd` then and has since
moved to `c7f582ad` through the post-edit-timeout-name and pi-launch-followups lands, which touch no lane module or
test file and which this lane has not merged). The plan of record is
`docs/reviews/handoff-cap-surrogate-2026-10-20/must-meet.md`: one must-meet check, row R-2160, with R-189's existing
check as its partner and the cap's one seal. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and
`build-brief-2.md` are the two builds (4f686738, then 4011c0a3, test only, from the seat's pairs). The seat's record is
`seat-verify-e58bd585.md`: CI run 39406330980 at e58bd585, 0 failing files on macOS, Ubuntu and Windows
(`ci-windows-e58bd585.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 10 of 10 red on 4011c0a3, after 9 of
10 on 4f686738) and the independent check (`independent-check-e58bd585.md`: HOLDS, no MUST, 11 probes, run on
4f686738). The final reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement aa5f25c..e58bd58: 1 rows in 1 features
FEAT-002 · Resume decisions and next actions
  R-2160 new (implemented)
```

The code under review: on a fresh pi session, `nana-handoff.ts`'s `before_agent_start` handler injects the stored
compaction summary behind its Source and Provenance lines, cut to `INJECT_CAP` (8000) UTF-16 code units. The cut is
now `head(h.body, INJECT_CAP)` from `packages/nana-pack/lib/display.mjs` (unchanged), which ends one unit short when
the cap would split a surrogate pair. `INJECT_CAP` is now a named export with a contract note. The stored summary, the
store path, the write path and the stale pointer are unchanged. The test file is
`packages/nana-pack/tests/handoff-artifact.test.mjs`.

Judge whether the lane fails open: a summary dropped from the prompt, injected empty, injected longer than the cap or
cut earlier than one unit short; an extension that pi no longer loads, or whose handler now throws, so a fresh session
silently gets no handoff; or a seal that a retuned cap passes. Judge whether it leaves a harm the review standard
lists: data lost or corrupted in an owner's home (the handoff store), malformed text reaching a provider's prompt, a
broken hook, or a test writing outside the temp folders it owns or leaving them behind. Judge whether anything main
does today stopped working: a summary at or under the cap, or one whose cap does not split a pair, injected exactly as
before; the framing, authority and closing lines; the stale, ancestor and legacy pointers; the writer-role marker and the
trust and symlink refusals; and both CI install-check legs, which load the pack in a real pi.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: the cut is
pair-safe but not grapheme-safe, so a joined emoji sequence can end on its joiner (the text stays well-formed); the
stale pointer's writer trim still cuts raw and can split a pair, though the writer is the basename of pi's session
file; the knowledge index cuts titles and claims raw, with every rendered field passed through `promptText`; review
findings are cut raw for the ledger, not a prompt; `POINTER_CAP` and `DAY_MS` carry no provenance note; whether the
codex backend rejects or replaces a lone surrogate stays unmeasured, and this lane removes the lone half from this
path; the independent check ran on build 1 only, and the pairs and the check ran on macOS only, so CI is the only
Linux and Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (a model-written summary with emoji, rare
CJK or any other astral character at any position; macOS, Linux and native win32 on Node 22); deliberate forgery is
out, such as a hand-planted store file.
Lane class: install, hook or gate — the pi extension `nana-handoff.ts` (the injected compaction summary cut).

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
