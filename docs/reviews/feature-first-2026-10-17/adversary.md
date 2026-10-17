# feature-first — the adversary's pass on the seat's draft (2026-10-17)

*A read-only agent attacked the draft; `must-meet.md` records the disposition.*

**Adversary verdict: the draft needs one change.** As written, a must-meet test can be empty and the lane still lands. Count against the harm list: 0.

**Harm list.** No install or hook breaks, main does not regress, and no other check fails. I grepped every test and template for the changed phrases. Only the six test files the draft lists pin them, and `project.test.mjs` compares against the file. One effect is expected and not a harm. On Windows, doctor marks three rule rows ✗ until `nana-setup install` runs again, because `doctor.mjs:79` compares bytes. The draft's known limit already covers this, as it did for every earlier rule lane.

## 1. Gaps that leave a fresh session on the old way

1. **The builder rule lives only in the preamble, and it contradicts a live rule.**
   - Only `pi-worker` reads `builder-preamble.md`. It refuses a Claude Code larger-lane builder (`pi-worker.mjs:114-117`), and `nana-seat.md:14` tells the seat not to restate the preamble in a brief.
   - So when Jake's pending Sonnet larger-lane builder is set, that builder never sees "write no other test". It follows `nana-standards.md` instead, where the "Then the tests" bullet survives.
   - Where the line does arrive, it clashes with `nana-standards.md:24-25` and requirements `SKILL.md:69-70`: one seal test per new tunable. Any feature that adds a timeout or cap forces the builder to break one of the two rules.
   - Fix: put the builder line in `nana-standards.md` under "Requirement first" too, with the seal-test exception (wording in section 3).
2. **No text says how a pi seat runs the adversary, and the only seeded pi agent asks for edge cases.**
   - `packages/nana-setup/pi/reviewer.seed.md:22` says "handles edge cases". Line 39 says "Edge cases the proposal may miss". Lines 90-91 define P1 as "should be fixed before release". A pi seat that spawns `reviewer` as its adversary gets edge cases back as must-meets. That is my inference about which agent a pi seat would pick.
   - The draft's known limit ("a machine whose reviewer seed predates this lane keeps its seed's plan section") describes a seed edit that no T-item makes. Either add the seed edit, or name the pi adversary's launcher and brief.
3. **`HANDOFF.md` still holds the old rulings.**
   - Line 18 is the 10-11 plan-review cap ("Small lanes get one plan review, gate and format lanes two"). Line 22 is the 10-13 review ruling. Both read as standing rulings, and no line supersedes them.
   - Line 89 queues a different "feature-oriented development": briefs name features, reviews read per feature.
   - nana-pi's startup reads `HANDOFF.md`, and nana-soul says "A documented past decision beats a fresh derivation". The draft keeps these lines "as history".
   - Fix: the lane's own HANDOFF entry marks lines 18 and 22 superseded on 2026-10-17 and rewrites line 89.

## 2. Draft tests or scope that are not must-meet

1. **FF5 pins two deletions the ruling never asked for.** Its "match the new list" locks in removing "Fix the class" and the line-ending (CRLF) line. Line endings are the Windows priority's live failure class (`HANDOFF.md:33`, `:66`, `:92`). Dropping the line brings more Windows send-backs, not fewer. Pin only the added line, and keep the two old lines.
2. **FF3's "byte for byte alike" half is already pinned.** R-1128 covers it at `templates-render.test.mjs:395`. Only the new phrase "in an install, hook or gate lane" is must-meet.
3. **The mutation-runner README fix cannot be done on main.** That README section exists only on `feat/mutate-runner` (commit `0c5d03c`, README lines 398-399). It is also a different feature with no test. Drop it, or sequence this lane after mutate-runner lands.

## 3. Wording that will misfire

1. **T1: "a write outside the lane's folder or the temp folder".** A reviewer will apply this to product behaviour. Install writes `~/.claude`, `nana-land` writes the main checkout, and `pi-review` writes `~/.pi/agent`. Every lane on those tools would get a MUST.
   - Rewrite: "a test, build step or seat script that writes outside the lane worktree or the OS temp folder (a product command writing where its contract says, such as install into the home folder, is not this harm)".
2. **T1: "stops the change's feature working for its user on a realistic use" and "tests that miss a clause are SHOULD or NOTE".**
   - "Realistic use" has no bound. PowerShell 5.1, a linked checkout and look-alike letters each qualify for someone.
   - A must-meet test that checks only that a file exists becomes a NOTE. The row then flips to implemented, and nothing guards the feature. Ordinary lanes have no wrong-code pairs, and the report drops "mutation pairs".
   - Rewrite: "A MUST is: a must-meet test the brief names that is missing, or still passes with the feature removed; a bug that stops the feature's main use the brief names, on a platform the brief names; or one of these harms under the threat model: data lost or corrupted, [rewritten write harm], a broken install or hook, or something main does today that the brief does not set out to change no longer working."
3. **"An install, hook or gate lane" is never defined.** The requirements skill calls the suite "the gate", so almost any lane fits. A reader could also call a `nana-land` change ordinary, which leaves the land rule with one reviewer and no wrong-code pairs.
   - Rewrite: "An install, hook or gate lane changes nana-setup install, uninstall or doctor; a Claude Code hook or pi extension; the nana-gate policy; or the land and review tools (`nana-land`, `pi-review`, `review-round`). Every other lane is ordinary."

The T4 rewrite: "Write the must-meet tests your brief names and no other new test, except the one test that pins each new sealed tunable. Edit an existing test only where your change makes it false, and list each such edit in your report."

## Proposed tests

- **NT1 (R-1108):** the review standard holds the sentence that makes a missing must-meet test, or one that passes with the feature removed, a MUST.
- **NT2 (R-1301):** `nana-standards.md` holds the builder line with the seal-test exception, so a Claude Code builder gets it. The preamble's line carries the same exception.

**Insist on:** the review standard must make a missing or empty must-meet test a MUST. It is the only check left on the tests this whole process depends on.
