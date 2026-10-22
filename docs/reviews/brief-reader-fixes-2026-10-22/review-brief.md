# Review — brief-reader-fixes (the Precedent check reads the forms seats write; brief-check names its brief path), 2026-10-22 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary (two pack libs, one check command, their config and tests, the pack README, notes; pi-worker's source, nana-setup, hooks, extensions, the gate, pi-review, review-round, review-ledger and nana-land are untouched). Threat model: honest variation in the seat's own brief — a second label or a numbered step list straight after the Precedent list with no blank line; a bold label line; a path in bold, with backticks, or followed by a colon or several marks; a prose heading such as "Precedent audit" above the real section; nested sub-items under an entry; a relative brief path given to brief-check. Deliberate forgery is out: a brief built to hide a bad entry passes it unchecked; the reader proves a parse, not intent.

Review `git diff 61ac64f3..HEAD` on `feat/brief-reader-fixes`. Main is 61ac64f3 (precedent-first). The lane's commits: da74cf3f (plan), a4e0c45f (build 1, the code), 6f4e02a1 (notes), and the final commit with this brief.

The plan of record is `docs/reviews/brief-reader-fixes-2026-10-22/must-meet.md`: decisions D1 to D7, six rows (R-2616 to R-2621), the retuned tunable, the known limits; `plan-draft.md` and `plan-attack.md` (M 3, S 8, N 8) are its inputs. D1 is a deliberate loosening, stated there: a numbered list right after a bulleted plain-label list is now read as a separate list, as Markdown renders it.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 17 red at a4e0c45f, 14 by exactly their named titles (`seat-mutate-output-a4e0c45f.txt`). p3 (the kind boundary also on heading sections) turns the frontier checker's untagged-ask check red, the heading reading R-878 pins. p9 (every `*` stripped) turns R-2579 red; R-2619's `*.mjs` guard did not catch it alone.
- Builder departure: build 1 wrote the plan's known limits into `docs/known-bugs/FEAT-006.md`, which the brief left to the seat. The lines match the plan's known limits, so the seat kept them.
- Session titles: 0 missing. The builder's locked full suite: `206 PASS, 0 FAIL, 2 SKIP`. After the notes, known-bugs, writing-check, frontier, handoff-staleness and writing-rule tests pass, and the tree checker reports 0 problems.
- Notes: the five precedent-first final-review notes (four fixed here, the fifth now named by brief-check's refusal and the README); the seat's re-check of both 2026-10-22 audits, whose unrecorded gaps are now known-bug lines in ten features or Next lines; HANDOFF trimmed from 4,132 to 1,390 words under the owner's "Seat prunes to budget" (the Landed lines moved verbatim into the session entry; every ask shortened, none dropped).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 61ac64f..a4e0c45: 6 rows in 1 features
FEAT-006 · Launch builders with execution limits
  R-2616 new (implemented)
  R-2617 new (implemented)
  R-2618 new (implemented)
  R-2619 new (implemented)
  R-2620 new (implemented)
  R-2621 new (implemented)
```

CI runs on the draft PR at the reviewed tip, the Windows leg included. The seat lands only on green.
