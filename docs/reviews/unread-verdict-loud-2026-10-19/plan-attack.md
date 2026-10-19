# unread-verdict-loud — plan attack (one adversary)

Verdict: AMEND

The plan holds up. I amended it in three places: one row contradiction, one module header and one piece of duplicated counting.

Probes ran on a temp clone of main f29827a with a temp HOME.
- Today, review-ledger run exits 0 and records a null verdict for all four planned shapes. It does the same for a fifth: a first line with no label and "VERDICT LAND" last.
- pi-review on the bold CRLF shape prints SUCCESS, exits 0 and records null. So R-1620 and R-1621 are red today.
- The strings "verdict unread", "nana-land will refuse" and "rounds remain" do not exist anywhere in the package. So R-1622 and R-1623 are red today.
- I patched a clone to exit 1 on a null verdict and ran nine test files one at a time. Exactly the plan's six checks failed: three R-969/R-1010 corpus checks, R-621/R-705 tree-scope, R-729 cwd and R-139 in handoff-writer-role. land, immutable-review, path-spelling, watchdog-exit, review-standard, review-round and win32-launch stayed green.
- Windows runs a subset of these checks. Its only win32-specific code is the fake pi body, which prints a readable verdict. R-139 is skipped on POSIX-less platforms. So the retarget set is complete for every platform.
- nana-land refuses only a named revision whose record is not LAND, before the suite runs. A HANDOFF residual records nine empty records in an owner project. The lane is worth building.

Amendments:
1. **R-1390 contradicts R-1621.** R-1390 says that when pi exits 0 with review-shaped output, pi-review exits 0. After this lane, an empty verdict on review-shaped output exits 1. The brief now narrows R-1390's text. Its test is unchanged and stays green, because its stub prints "VERDICT: LAND".
2. **verdict-config gets a second table.** Its @purpose now covers both tables in one sentence. The condition texts are wording, so their provenance is "chosen" and no seal test is needed.
3. **Rounds left reuses decide().** complete() calls decide(p, held, held.revision, undefined, false) after the append. There is no second counting rule. Wrong-code W15 is added for a count taken before the append.

Also added: a known limit for snapshot reviews, where nana-land refuses the snapshot's HEAD commit. The empty-output condition is still unpinned.

Lane class gate is right. All probes stayed in the temp folder.
