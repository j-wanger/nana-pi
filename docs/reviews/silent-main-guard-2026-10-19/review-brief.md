# Review — silent-main-guard (five commands run the same through a linked checkout folder), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links (rows also in FEAT-029 · Navigate code and investigate
impact, FEAT-039 · See the product and its decisions in one report and FEAT-006 · Launch builders with execution limits)

Review `git diff 713d6aa..HEAD` on `feat/silent-main-guard` (the lane last merged main at `713d6aa`; `git merge-base
HEAD main` is `713d6aa`; main has since moved to `a1d07f6`, so a merge and a confirmation round follow before the
land). The plan of record is `docs/reviews/silent-main-guard-2026-10-19/must-meet.md` (rows R-1630 to R-1636, R-1635
unused), with `plan-attack.md` and `build-brief-1.md` beside it. The seat's record `seat-verify-a65e53d.md` holds CI,
the Windows log beside it.

Tree movement (`requirements-moved --root . --base main` at a65e53d; the seat's notes commit changes no row):

```
tree movement 713d6aa..a65e53d: 6 rows in 4 features
FEAT-006 · Launch builders with execution limits
  R-1634 new (implemented)
  R-1636 new (implemented)
FEAT-028 · Maintain requirement identity and trace links
  R-1630 new (implemented)
  R-1631 new (implemented)
FEAT-029 · Navigate code and investigate impact
  R-1632 new (implemented)
FEAT-039 · See the product and its decisions in one report
  R-1633 new (implemented)
```

Judge whether the tree movement report, the tree checker, the candidate rows list, the product report and the roster
command now exit and print the same through a symlinked or junctioned checkout folder as by the checkout's real path,
on macOS, Linux and Windows; whether importing the roster module stays safe for its three importers; and whether the
test writes only inside temp folders and removes its link without a recursive removal walking through it into the
checkout.

Threat model: honest variation in our tools' output and the OS in scope (the macOS `/var` and `/tmp` links, a checkout
reached through a symlink, Windows junctions and 8.3 temp names); deliberate forgery out. Lane class: ordinary — five
one-line guard changes, one test-helper export, tests and rows; no installer, hook, extension, gate-policy or land and
review tool file.

Check: (1) the must-meet checks are not vacuous: each fails on the old guard, and the printed-something condition stops
a pass where both runs print nothing; (2) each command's real-path behaviour is unchanged, and importing any of the
five with `argv[1]` naming another file or no file neither runs its main nor throws; (3) no test writes outside the
temp folders it owns, and no recursive removal walks through the link into the checkout (`tmpDirUnmanaged` is the
builder's one named deviation, made for R-917's source check); (4) nothing else changed: no argument parsing, no
README edit, and the regenerated tree and map match the rows; (5) HANDOFF and the session entry are true, including
the dropped Tree residual sentence and the four new residual lines; (6) any MUST.
