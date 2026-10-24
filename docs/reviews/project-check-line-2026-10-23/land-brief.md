# Review — project-check-line (session start names every failing file row of an adopted project), 2026-10-23 (the land reviewer)

Feature: FEAT-014 · Create or adopt a project workspace

Class: hook (the SessionStart stale-copy producer's output and the nana-rulings extension's output change; the hook entry, its wiring and both callers' code are unchanged). Threat model: honest variation in scope (adopted projects with and without working-region markers; other repositories with an AGENTS.md that mentions nana; odd entries at a seed path — a folder, a dangling or live link, a FIFO, a file in place of `docs`; a BOM; invalid UTF-8; an unreadable or over-cap AGENTS.md; roots holding `"`, `$`, a backtick or `%`; linked worktrees, submodules, nana-pi checkouts, dismissed roots and no repository; reviewer and worker roles; macOS, Linux and Windows); deliberate forgery out (a repository crafted to look adopted, link targets written to inject text, a hand-forged dismissal).

Review `git diff bd7f0f75..HEAD` on `feat/project-check-line`. Main is bd7f0f75 (report-at-land, landed). The lane's commits: 4481d00c (plan of record), 91ea70fe (build 1, the lane), 4c36d93e (pairs and independent check), abc52bfe (merge of main, clean), a51dd9de (notes), a4f4d7d5 (local install check), and the final commit with these briefs.

The plan of record is `docs/reviews/project-check-line-2026-10-23/must-meet.md`: the seat's decisions on the attack (S1 to S7 added as fixtures: R-2623's one changed last-line assertion, AGENTS.md absent with CLAUDE.md odd, the bounded fatal BOM-kept decode, the lstat objective arm, both spans' no-path fallback, an invalid UTF-8 marked file, the check's AGENTS.md read error; and N6, N8, N9, N12), rows R-2760 to R-2765, R-2624 and R-2628 retired, and the known limits. `plan-draft.md` (the measured table over 19 home repositories, labelled P1 to P10 and N1 to N8) and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 34 of 34 red at 91ea70fe (`seat-mutate-output-91ea70fe.txt`), 33 by exactly their named titles; the extra red is a naming slip on pair 7, not a test gap.
- The independent check at 91ea70fe (`independent-check-91ea70fe.md`): `project --check` byte-identical between main and the lane on all 19 home repositories, stdout and stderr, and on 17 of 18 odd-entry fixtures (the mode-000 case rejects the same way, two stack frames different); P1 to P5 keep their exact lines, P6 to P10 each gain one line naming the sessions README, and N1 to N8 and the nana-pi checkout stay silent; the line's own fix on a copy of P6 created exactly that file and cleared the line; the producer started no child process in 57 calls. No MUST, no SHOULD; its four notes are FEAT-014 lines.
- The local macOS install check passed 18 of 18 at a51dd9de (`install-check-a51dd9de.txt`). The builder's report of a failing post-edit item came from load; main passed 18 of 18 when the machine was quiet.
- The seat's diff check finds no removed escaped `\n`. Session titles: 0 missing. Build 1's locked full suite: 217 PASS, 0 FAIL, 2 SKIP. After the merge, map:check, readme:check, the trace and the tree check are green; `nana-writing HANDOFF.md` finds no long sentence.
- The named move: checkProject's file-row closures and row blocks, `seedEntry`, `lstat`, `today`, `CLAUDE_IMPORT` and `PLACEHOLDER_RE` into `packages/nana-setup/lib/project-rows.mjs`, imported or re-exported back by project.mjs.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement bd7f0f7..a4f4d7d: 9 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-327 Made by/Read by lines changed
  R-2624 implemented -> retired; text changed
  R-2628 implemented -> retired; text changed
  R-2760 new (implemented)
  R-2761 new (implemented)
  R-2762 new (implemented)
  R-2763 new (implemented)
  R-2764 new (implemented)
  R-2765 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all, as the land reviewer: is this change safe to put on main for both seats — can the producer slow, hang or break a session start, print text read from an entry, or nag a repository the owner never adopted, and does doctor, install or the adopt skills' closing check behave as before?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
