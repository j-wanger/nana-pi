The change works for a seat on either machine, and I found no MUST finding.

**Checks**
- **Old rosters still work.** I ran the roster command on this Mac's real roster with the new code. It prints the old five slot lines unchanged, then `planner: seat`, `adversary: builder` and `checker: builder`, then `lanes: 4`, then `source:`, and exits 0. `--json` adds the three new keys as null, and nothing in the repo reads that output except tests. A missing optional slot still reads as null, and the validator change only widens what it accepts.
- **`set` writes no slot nobody set.** In `packages/nana-pack/lib/roster-set.mjs:72-78`, `set` writes only the old five slots, the slots already in the file and the slot you named. The MM3 test covers the four starting shapes in the plan and checks that main's rule still accepts the result. It passes on macOS, and the Windows run shows the test catches a deliberate break of this rule. The UTF-16 roster test still passes.
- **A role launch never runs on the wrong model silently.** `pi-worker --slot` resolves the slot or its named fallback and prints one line before starting the child, for example `adversary (builder): <tokens>`, with any lineage warning on the same line.
  - Run directly against a temporary roster, a planner or scout whose line reads `seat` or `none` is refused before any temp folder exists. So are builder, reviewer and land, each naming the launcher to use instead.
  - The MM4 test confirms the child gets the exact model, thinking and tools. A Claude Code scout also gets `WebSearch` and `WebFetch`.
  - No diagnostic changes the model; the seat is told and the owner changes the slot.
- **Older checkouts.** Setting a new slot, or a Claude Code scout, makes a checkout older than this change refuse the whole roster. The plan and the README "Compatibility" paragraph say so. The owner's "defaults" answer accepted that. The README also correctly says that setting a new slot to its null token does not repair an older checkout.
- **Both seats.** On this Mac's roster, the Claude Code hook and the composed notices show the planner, adversary and checker, with no lineage warning for a Claude Code seat. A pi seat shows `lineage: adversary versus planner unverified`, as MM8 intends.
- **Lane builds after the refactor.** The shared launch code produces the same pi and Claude argv, child environment and tool list as main. The only behaviour change is that the load line is now written once the child has started, which the README and R-3215 record.
- **Tests run here on macOS, all passing:** `nana-roster`, `nana-roster-set`, `roster-notice`, `roster-notice-hook`, `seat-rule`, `worker-claude`, `worker-lane`, `context-anatomy`, `rulings`, `templates-render` and `pack-config-utf16`. MM6 skips on macOS. The Windows wrong-code run made all 9 must-meet checks fail as intended. CI on the tip was still pending when I looked; the land step checks it.
- **Review-standard harms.** The new tests write only to OS temp folders and point the agent dir at temp. No hook, install or data path breaks: the roster notice hook still prints one JSON object with the expected prefix.

**Findings (none block the land; record each in `docs/known-bugs/FEAT-041.md`)**
1. NOTE: by default the checker runs on the builder entry, so the independent check uses the same model family as the work it checks. The lineage warning only compares the checker with the reviewer, so this is never flagged. The owner chose this default; it is worth one line.
2. NOTE: a role launch without `--out` is refused with only `pi-worker: slot refused: usage` and no usage line (`pi-worker.mjs:116`).
3. NOTE: a `--brief` value starting with a single `-` passes the role checks. It is then refused by the shared lane check as `lane refused: --brief requires a value`, after the role temp folder was made; that refusal removes the folder. This is an unlikely input.
4. NOTE: in every pi seat with no planner slot, the pi widget always carries the unverified-lineage segment, which makes it longer. This is by design, and the widget-wrap known bug already covers the length.
5. NOTE: `HANDOFF.md` was in the plan's file list but is untouched. The session note is present.

VERDICT: LAND
