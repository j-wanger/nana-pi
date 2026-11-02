The round 2 MUST is closed. The change since round 2 adds no new way for a child to read a stored credential and causes no harm the review standard lists.

**Round 2 MUST: closed**
- **R-917 (`test-runner.test.mjs`):** both test files now import `tmpDir` with the exact double-quoted line the check looks for (`credential-gate.test.mjs:13`, `credential-strip.test.mjs:15`).
- **R-3211 (`context-anatomy.test.mjs:119`):** the expected claude-review settings env now includes `...credentialStripEnv(f.env)`. That is the same exported function claude-review uses to build those settings (`claude-review.mjs:104`), so no names are retyped. The comparison is still exact, so any other unexpected key would still fail it.
- **Evidence:** I ran the four touched files at b35017c5 on macOS: 72 checks pass, 0 fail. CI run 41424346701 on this tip passed every job: the suite on macOS, Ubuntu and Windows, and all four install-check jobs. The map, readme, trace, tree and known-bugs checks also pass at the tip.

**New gate forms**
- The only code change is three new patterns in `credential-gate-config.mjs:17-19`. They only add refusals, and only when `NANA_ROLE` is worker or reviewer (`nana-gate.ts:148`).
- I tested commands through the real gate:
  - **Refused as worker:** `git credential-store --file x get`, `git credential-cache get`, `gh auth status -t`, `gh auth status -t -h github.com`, `gh auth status --hostname github.com -t`, and `gh auth status && git credential-cache get`.
  - **Still allowed as worker:** `git credential-store --file x erase`, `git credential-cache exit`, `gh auth status`, `gh auth status -h github.com`, `gh auth status --active`, `git status -t`, `git log -t`, and `echo "git credential-cache get"`.
  - **No role set:** every one of these is allowed, so the existing unset-role policy is unchanged.
- The M4 test cases and the M7 pattern-list check both name the three new forms. The builder's wrong-code runs (`build-3-wrong-{store,status,cache}.txt`) show each new case fails against the old gate.

**Findings (none are MUST)**
- **SHOULD:** close variants of the new forms still get through the gate as worker:
  - `git credential-store --file=x get`
  - `git -c a=b credential-cache get`
  - `git-credential-cache get` (the dashed form; the third pattern's list has no `cache`)
  - `git credential-cache --timeout 5 get`

  The two new `git` patterns don't take the global-option prefix that patterns 1 and 2 accept. So `git -c x=y credential-store get` is refused, but the same command with `--file x` is allowed. The brief asked only for the three named forms and the gate is advisory, so this belongs as a FEAT-006 known-bug line.
- **NOTE:** the seat-pairs record in the folder (`build-3-mutate.txt`) ran at 1ac031c5, the commit before the build, not at the tip. The builder said so. The code since then is the three added patterns plus test edits, and the new cases have their own wrong-code evidence. A re-run at the tip would make the brief's "11/11 red" line exact.
- **NOTE:** the three round 2 known-bug lines are in `docs/known-bugs/FEAT-006.md` with the wording build brief 3 gave. The R-3663 and R-3667 evidence text lists the new forms.

VERDICT: LAND
