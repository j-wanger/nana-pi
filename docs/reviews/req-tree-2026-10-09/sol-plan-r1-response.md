# Seat response to sol plan review r1 (SEND-BACK, 5/10)

| Finding | Verdict | Change |
|---|---|---|
| MUST 1 — proof requires equal ID sets, but four rows are added | Accepted | R-287–R-290 end FEAT-028 in `tree.json`; their Requirement text is fixed in `new_rows`; the proof allows exactly those four additions; `outline.md` FEAT-028 count updated. |
| MUST 2 — "each old prose line occurs somewhere" lets prose be altered in place, added or reordered | Accepted | `prove.mjs` now accounts for EVERY non-blank line of the new ledger in a declared order (intro with one declared edit, `fixed-text.md`, generated headings/purpose/outcome/see-also, note blocks byte-identical in order at declared destinations, tables, tail). Mutation evidence required for an in-place alteration, an extra line and a reordered pair. |
| MUST 3 — the suite lets the approved tree decay (regroup, delete, rename, empty purpose); the corpus wildcard lets the builder edit the approved inputs | Partly accepted | Accepted: R-288 requires non-empty purpose text; R-290 gets a mutation per branch; the checkpoint inputs (`CHANGE.md`, `tree.json`, `fixed-text.md`, `mapping-astra.json`, `outline.md`) are frozen and seat-owned, and `prove.mjs` reads them from the approved commit. Not accepted: pinning names, grouping and row membership in the suite against a manifest. That is a second copy of the tree: every new row would need a two-file edit, and the copy that goes stale is what this design avoids. Renames and regroupings after checkpoint 2 are legitimate owner edits, visible as diffs and read by the lane's reviewer; from increment 2 a lane brief declares the feature it touches. Recorded in CHANGE §2 "Deliberately not pinned". |
| MUST 4 — `## Open questions` → `#` makes the skill's instruction false | Accepted, by a smaller change | The heading keeps `##` and its text, under a new `# Open questions and deliberate omissions`; the skill stays true without an edit. The skill paragraph also says the G rows form one feature, since its "Part G at the end" instruction no longer describes this ledger. |
| SHOULD 5 — nothing verifies the old-section map | Accepted | `prove.mjs` checks every old heading appears once with computed row counts and homes, and the §10 note byte-identical. Package column declared, not proved. |
| SHOULD 6 — NOT list forbids the added rows | Accepted | "Any pre-existing row's …". |
| SHOULD 7 — R-290 combines two hierarchy clauses | Accepted as one generic invariant | R-290: every feature and subgroup heading sits under the level directly above its own; one mutation per branch. Saves an ID (9 left). |
| SHOULD 8 — outline names `mapping.json` | Accepted | Names `tree.json` and `mapping-astra.json`. |

Also found while running this round (not sol's): `packages/nana-pack/README.md:156` documents
`pi-review … -- --provider openai-codex -m gpt-5.6-sol`; pi rejects `-m` ("Unknown option: -m"),
which cost one failed launch (no round recorded). Out of this lane's scope; added to the confirmed
issue list for the issue-fix increment.
