# Review — gate-rm-gitbash-tmp (on Windows the gate reads Git Bash's `/tmp` and `/c/` spellings as Git for Windows mounts them), 2026-10-21 (the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Class: install, hook or gate (a pi extension and the nana-gate policy reader: `packages/nana-pack/lib/gate-rm-outside.ts` and `packages/nana-pack/extensions/nana-gate.ts`). Threat model: honest variation in scope — the Git Bash spellings an honest builder or reviewer types on native Windows (`rm -f /tmp/out.txt`, `rm /tmp/sub/*.log`, `cd /tmp && rm x`, `pushd /tmp/sub`, `/c/...`, `/C/...`), TMP and TEMP differing, unset, empty or 8.3 short names, a TMP at a drive root, the home folder or above it, a link in the temp folder leading outside, `..` climbing out of `/tmp`, lookalikes (`/tmpx`, `/tmp2`, `/cd`), PowerShell's own `/tmp`, macOS and Linux unchanged, and Linux CI where the fixture root lies under `/tmp`; deliberate forgery out (a crafted TMP or fstab, eval or base64, a race that swaps a folder for a link, a command prefix, BASH_ENV or a spawn hook). The gate is advisory by load path.

Review `git diff 28dae7c4..HEAD` on `feat/gate-rm-gitbash-tmp` (main is 28dae7c4; the lane branched from bc529014 and merged main at 4cf698ef). The plan of record is `docs/reviews/gate-rm-gitbash-tmp-2026-10-21/must-meet.md`: the verified facts, eight must-meet rows (R-2490 to R-2497) with the plan adversary's amendments, what each test does, the three contract tunables with provenance, the design and the known limits. `build-brief-1.md` to `build-brief-5.md` are the five builder sessions; build 5 is wording only, from the independent check. The seat's record: the wrong-code pairs in `seat-mutate.mjs` and `seat-mutate-output-4cf698ef.txt` (11 of 11 red on macOS at 731f5a22 and again at 4cf698ef; pair (j), nana-gate passing no platform or env, rests on the Windows leg), the independent check in `independent-check.md` (no material finding), and the Windows leg's gate lines in `ci-windows-d46693bd.txt`. The macOS install check passes locally (17 PASS). The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 28dae7c..4cf698e: 8 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-2490 new (implemented)
  R-2491 new (implemented)
  R-2492 new (implemented)
  R-2493 new (implemented)
  R-2494 new (implemented)
  R-2495 new (implemented)
  R-2496 new (implemented)
  R-2497 new (implemented)
```

CI: run 39636289893 at d46693bd (PR #156; the code of 731f5a22, before build 5's wording and the merge of main): suite (ubuntu-latest) 200 files, 197 PASS, 0 FAIL, 3 SKIP, checks 8167 pass, 0 fail; suite (macos-latest) 200 files, 198 PASS, 0 FAIL, 2 SKIP, checks 8228 pass, 0 fail; suite (windows-latest) 200 files, 182 PASS, 0 FAIL, 18 SKIP, checks 7159 pass, 0 fail; install-check success on macOS and Windows. On Windows `gate-rm-outside.test.mjs` is 16 pass, 1 skip: R-2495, R-2496 and R-2497 PASS, and the only SKIP is R-2338 ("/tmp is not a temp root on Windows"); on Linux, where the fixture root lies under /tmp, it is 14 pass, 3 skip, as on macOS. Since d46693bd the lane changed only a row's wording, the README bullet and one code comment (build 5), and merged main (win-leg-flakes, which touches no gate file); the land runs the locked suite on the merged tip.

Judge whether the feature works for the owner, whose headless Windows builders and reviewers were blocked deleting their own temp files, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code (the seat's pairs are the record) and green with it; R-2495 to R-2497 pass on the Windows leg against the real handler and Git Bash's own `cygpath`;
- no change weakens the security floor: the translation runs only inside the rm-outside reader, which adds only non-floor asks, and the translated path meets the unchanged containment rule and the shared temp-folder rule's drive-root and home exclusions;
- nothing is translated for PowerShell or off Windows, and no honest spelling now runs unasked where Git Bash would delete outside the working folder and the real temp folder (the independent check's `..`-after-a-link case is a declared known limit);
- the README's rm-outside bullet, the row texts and the code comments say what the code does;
- the HANDOFF lines (the queue line, one Landed line, four residual lines dropped, ten added) and the session entry are accurate, and so are the folded win-leg-flakes late notes (one residual line, the install-child line's export clause, and that lane's session count).

Known limits already carried (do not send back for them): other shells and a hand-edited fstab; Git Bash fixes `/tmp` once per user; the TMP-before-TEMP order rests on source and docs; a relative `..` after `cd /tmp`; other root spellings read on the working folder's drive; recursive and forced forms keep their ask; the wiring rests on the Windows leg; `..` collapsed before a link is read; the rm floor's root check and the policy-file floor do not read Git Bash spellings.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
