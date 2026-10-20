# Build brief 2 — config-advice-fixes (the seat, 2026-10-20)

Build 1 is `d22ad0b5`. The seat's wrong-code pairs gave 13/14 red and the independent check HOLDS. One pair survived:
M14 rewords `MANUAL_JSON_ADVICE` ("Repair the JSON by hand." → "Fix the file.") and every check stays green. Build 1
rightly changed the R-1971 and R-1972 checks to import the name instead of retyping the sentence, but now no check
holds the sentence itself, though its comment calls it a contract value and the pack README bullet quotes it.

Do this, and nothing else:
1. In `packages/nana-pack/tests/objective-golden.test.mjs`, add one check that pins the sealed sentence:
   `MANUAL_JSON_ADVICE === "Repair the JSON by hand."`, with `// req: R-1971` directly above its `check("…` line and a
   title that names the contract (for example "R-1971: the manual repair advice is sealed as the README quotes it").
   This is the only place the literal may appear in tests (the one-test-per-sealed-value rule); every other assertion
   keeps importing the name.
2. Do the same for `FORWARD_SLASH_ADVICE` only if no check already holds its exact text (R-2092 pins its meaning;
   say which check holds the exact text, or add one pin under R-2092).
3. Check that M14's wrong code (the reworded manual sentence) now turns your new check red, in a temp copy or the
   worktree, then revert.
4. Run `node packages/nana-pack/tests/objective-golden.test.mjs`, `node packages/nana-setup/tests/doctor-detail.test.mjs`,
   `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`. All exit 0.
5. Commit with explicit paths. Single test files only; no full suite; no push; no pull request; never edit
   HANDOFF.md or docs/sessions/.

Report (at most 6 lines): VERDICT, commit, the new check title(s), M14's result, and the files committed.
