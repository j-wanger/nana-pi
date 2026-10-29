# Plan attack: component-audit (2026-10-29)

Memory claims checked against code and this machine, 2026-10-29.

## MUST

M1. Statuses are opinions, and a test pins one. R-3105 asserts `library` is not `sound`, so the lane that fixes memory must edit a test to pass. The check proves a citation exists, not that the status follows. Fix: define statuses by checkable rules. `sound`: cited features have no violated or planned row and the component has no known-bug line. `partial`: at least one such anchor. `gap`: a named need, an ask, no covering row. `absent`: no parts. Every non-`sound` status cites one anchor (known-bug file, non-implemented row, or a measured fact in the ask). Drop "memory not sound" from R-3105.

M2. The hand source rots silently. Paths and IDs are checked; a status or gap sentence stays plausible after its code changes. Fix: the hand source (not the contract) carries `auditedAt` per component. `--check` names each component whose parts have more than a chosen number of commits since then.

M3. The contract cannot change during the two builds. The byte-identical trick works mechanically: `nana-land` is ff-only, so the second lane merges main, identical add/add merges clean, and a byte difference conflicts there. But A10 invites the audit builder to reshape, and it is the likeliest to need a field. The plan has no path for that except a conflict and unplanned hive rework. Fix, either: (a) land contract, fixture and `checkComponentData` first as a tiny lane both branch from, which also lets hive-render validate for real before the swap; or (b) freeze v1 for both builds, and send any needed change to a follow-up lane that bumps `version`.

M4. Memory claim 1, and claim 3's framing, are wrong today. The shared index holds 80 entries in about 16,700 characters against the 9,000 budget. The hook prints all 80 with every description cut; its fold line reads "80 of 80 entries shortened". It is not "printed whole", and cutting is current, not a future at about 125 entries (that is when whole entries start dropping, R-2343). Fix: the gap sentence says descriptions are already cut; the seat adds the measured line under A7.

## Other memory claims

- Claims 2, 4, 8 and claim 3's mechanism are correct. New entries are appended; the index tail holds the 10-28 entries.
- Claim 5 holds inside nana-pi. This machine also runs a separate MCP memory server (in `~/.claude.json`, outside the repo) with consolidate, contradict, prune and verify tools. The ask should name it as prior art or rule it out of scope.
- Claim 6 is incomplete. A Claude Code builder has auto-memory off on purpose (R-2654, `CLAUDE_BUILDER_CHILD_ENV`), so part of "never reaches a builder" is a decision. Inferred: `claude-review` runs `claude -p` without memory isolation, so a Claude Code reviewer likely gets the shared index while a pi reviewer does not.
- Claim 7 confirmed: the live `sources.json` has 13 roots plus discovery, and the index holds no path under `~/.claude`. It understates the seed (literal roots, private wikis); harmless.

## SHOULD

S1. Coverage is unchecked, so gaps can hide in code no component claims. Fix: `--check` prints each code-map module outside every `parts`, with a count in the report.

S2. Rows are wider than the need. R-3105 and R-3107 seal eight governance ids, but the list is editorial; under A10 a merge forces a test edit. Fix: assert at least one `governance` component with tracked parts.

S3. The swap is unbriefed work for whichever lane lands second. If the audit lands second, it edits `scripts/hive-page.mjs`, `pages.yml` and the pages-workflow test, none planned or pinned here. Fix: give the swap to hive-render always (it owns the Pages step), or to a third small lane, with one row.

S4. A-086's maker (a Pages step) and reader (the hive) may not exist when this lane lands. Fix: the first lander names `--out` as maker and its test as reader, or parks the line.

S5. Asks after LAND fit the rulings: they bar repo writes and edits, and an issue is neither. But a scan failure found after LAND needs a new lane to fix. Fix: R-3106's test pipes `--asks` through `identity-scan.mjs` and expects exit 0. Separately, the plan's two owner questions go out as one `optional` ask before the build, per the seat rule; the plan is silent.

## NOTE

N1. R-3101 accepts a retired row as evidence; fail on `retired`.

N2. Replace the reviewer hash check with a one-line sha256 test.

N3. A folder part such as `packages/nana-setup/` makes `recentCommits` read as always busy. Say so in the README.

## Summary

4 MUST, 5 SHOULD, 3 NOTE. Top MUST: statuses are hand opinions, and R-3105 pins memory's verdict as a test; define statuses by checkable evidence rules.
