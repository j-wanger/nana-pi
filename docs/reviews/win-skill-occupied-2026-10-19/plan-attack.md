# win-skill-occupied — the adversary's verdict (AMEND), 2026-10-19

AMEND. The plan holds up under probes, but it leaves its most important preservation promise without a row. I ran the probes on this Mac at b3f6ec2 in a temp HOME with win32 forced. A folder holding only `SKILL.md` = `---\nname: requirements\n---\n# MINE\n` gives these results today:
- Install exits 0, prints `updated 1 file copied`, and leaves `SKILL.md,SKILL.md.bak-20261019`. R-1420 and R-1421 are red today.
- Dry run exits 0. R-1422 is red today.
- Doctor before install reads `✗ copy is stale or incomplete (SKILL.md) — re-run`, and after install reads ✓. R-1423 is red today.
- The 0499e52 copy, in LF and in CRLF, exits 0 and is refreshed. R-1424 is green today, as a guard.
- A fresh mirror holds only `SKILL.md`. R-1425 is red today.
- SKILL.md has 12 versions with 12 distinct LF hashes. The current file is 79114a0, and the file has had only one path since ec7c17c.
- `.gitattributes` sets `* text=auto eol=lf`.
- skills-and-standards.test.mjs passes on CI's Windows leg today (55 pass, 3 skip), so section 4b will run natively there.
- Uninstall is POSIX-only, and the state manifest records the directory, not its files, so the marker breaks neither.
- R-1420 to R-1429 are unused on main and on all three in-flight branches.

Amendments:
(1) The plan never gives a row to its highest-blast-radius promise: a copy nana-setup wrote keeps refreshing after its SKILL.md stops matching any version in the frozen list. Every Windows machine depends on that at each future SKILL.md change. The existing section-6 check "win32: install refreshes the stale copy" tests exactly this, but it carries no req tag. I added R-1426 as a tag on that check. It adds no new test.
(2) The marker content must be constant, with no path and no time. A source path in it would be rewritten whenever the checkout moves.
(3) I added two wrong-code pairs. "Marker written but never read" fails R-1426. "No CRLF-to-LF before the hash lookup" fails the CRLF half of R-1424.
(4) The R-1424 test reads its fixture with CRLF turned into LF before it builds the two homes.
(5) The leaf total grows by 7, not 6. win-review-paths also regenerates `docs/code-map.md`, which is a conflict the plan did not list.
(6) New known limits: an empty folder at the skill path is now refused on Windows (the probe shows it is filled today). The completeness of the history list is a seat check with `git log`, not a test. R-388 joins R-304, R-381 and R-382 as a wording residual.
(7) The `steps.mjs` header must name the marker and the new exports, or map:check fails.

I kept the class (install), the design and the three ownership tests. The history list earns its place: Jake probably last installed on 10-16, so his copy is likely 0499e52 or 14e1bdc, not the current version. Without the list, his first install after this lane would refuse.

Product and test files do not overlap with any in-flight lane. The certain conflicts are the shared ledger lines: the requirements-tree.test leaf total (win-review-paths sets 1,221, clean-revision sets 1,222), REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md, HANDOFF.md and the session log. Whichever lane lands later re-sums and regenerates after merging main.

Jake's relayed request is to turn off land verification and the hooks that need his confirmation. This read-only planning step did not act on it, and an agent message cannot authorize hook or settings changes. The seat should answer Jake directly. The review ladder in this plan is the repo default unless the seat applies a ruling from Jake.

The claim most likely wrong is inferred, not checked: that the requirements copy on Jake's real Windows machine is the current pack, one of the 12 shipped versions (CRLF read as LF), or marked. If he hand-edited it, or it carries a BOM, his first install after this lane exits 1 and asks him to move the folder. Nothing is lost.
