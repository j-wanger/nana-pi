# Review round 2 — scrub-contracts (confirmation round), 2026-10-21 (the final reviewer)

Feature: FEAT-032 · Keep instructions and documentation accurate

Class: install, hook or gate. Threat model as in round 1 (`review-brief.md`): honest variation in scope, deliberate forgery out. Never write a personal name, login, surname or work acronym into your review; the identity words are hashed and you must not try to recover them; probe with made-up words and injected digests. In prose say "the owner".

This is a confirmation round. Review only `git diff 896314fe..HEAD` on `feat/scrub-contracts`: the change since round 1's tip, 896314fe. Round 1: the final reviewer said LAND; the land reviewer sent it back with one MUST. The trial extractor's fifth rubric rule (`packages/nana-pack/lib/writing-trial-extractor.mjs`, `scoreDecisions`) had moved from the owner's first name to "the owner". So main's decision golden input scored [5, 5, 3] on main and [4, 4, 3] on the tip, and the golden test passed only because its input was scrubbed.

The change since 896314fe:
- Build 4 (8d0e9363, brief `docs/reviews/scrub-contracts-2026-10-21/build-brief-4.md`): `OWNER_WORD_DIGESTS`, one sealed sha256 digest equal to `identity-scan.config.json`'s first entry; the fifth part is present when the role-word pattern matches or a token of the block, split on `[^A-Za-z0-9_]+` and lowercased, hashes to a listed digest; `scoreDecisions` takes the list as an option for tests. R-2521 (`must-meet.md`'s amendment) and its test "a decision naming the owner by name or by role scores its fifth part", and the seal "seal: the extractor's owner word digest".
- The seat's record: main's own golden input (read from 906fbb56 in memory, never written) scores [5, 5, 3] on main and on 8d0e9363. Over the real transcripts of 2026-09-20 to 2026-10-21, main's and 8d0e9363's extractor outputs are equal apart from the rubric's labels, in both modes (73 decisions); 896314fe also matched main there, so the bug showed only on the golden. The seat's pairs re-ran at 8d0e9363: 9 of 9 red, with m7 (no digest branch) and m8 (a wrong sealed digest) added (`seat-mutate.mjs`, `seat-mutate-output-8d0e9363.txt`).
- Notes: four known-bug lines, three from round 1's final review in `docs/known-bugs/FEAT-032.md` (the scan command's main-module guard through a symlinked path, R-2511's "." root, role-word swaps that read oddly) and one from the seat (the lift test's one remaining work-domain fixture row); the session entry's round 1 paragraph and corrected counts; HANDOFF's Landed line now says 9 wrong versions.

CI: run 39693035889 at e55e5926 (PR #159; the code of 8d0e9363): suite (ubuntu-latest) 203 files, 200 PASS, 0 FAIL, 3 SKIP, checks 8199 pass, 0 fail; suite (macos-latest) 203 files, 201 PASS, 0 FAIL, 2 SKIP, checks 8260 pass, 0 fail; suite (windows-latest) 203 files, 185 PASS, 0 FAIL, 18 SKIP, checks 7190 pass, 0 fail, with `writing-trial-extractor.test.mjs` 15 pass and `identity-scan.test.mjs` 4 pass on all three; install-check success on macOS and Windows. Since e55e5926 the seat added only one known-bug line (the lift test's one remaining work-domain fixture row, which the records lane rewrites), the session entry's CI line and count, and these briefs.

Judge whether the fix restores the old scoring for reports that name the owner, without the word in the source, and whether the change since 896314fe causes a harm the standard lists. Report:
- R-2521 and its seal are red with the obvious wrong code (the seat's m7 and m8) and green with the fix; R-698 and R-2516 stay green;
- the fifth rule matches what main's matched on old reports (case-insensitive whole word) and still matches the role words; no other rubric part changed;
- the notes since 896314fe are accurate.

Known limits already carried (do not send back for them): everything listed in round 1's brief, and the round 1 final review's findings, now known bugs in FEAT-032's file. The sealed digest is reversible with a dictionary, like the scan's own (a carried limit).

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
