# Seat checks — pwsh-lexer-oracle builds 1 and 2, tip c78c6e7 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker. Per the builder's reports, not re-run by the seat except where
  this record says so:
  - Build 1 (`build-brief-1.md`; f742f2cc and 1afceda9, docs 5150888f and 983da287, plus merges of main): one
    token-start scanner replaces `startsPowerShellComment`, `matchPowerShellParen` and `liveTextPowerShell`. New named
    export `powerShellSpans`; new `lib/pwsh-lexer-config.mjs`; oracle helper `tests/pwsh-oracle.mjs` and test
    `tests/pipe-guard-pwsh-oracle.test.mjs` over a seeded 1,500-command corpus. Rows R-1730 to R-1736 implemented.
    One existing `pipe-guard.test.mjs` case edited as must-meet names: `$#` is one bare word, expected flipped to false,
    retitled. The builder's 10 wrong-code tries turned R-1731 to R-1736 red as named. The brief asked the builder to
    push and open the draft pull request (#70).
  - Build 2 (`build-brief-2.md`, 7ca1eafb): fixed the independent check's F1. A backtick escape that is not a line
    continuation now clears the token start, so a `#` or `<#` right after an escaped character at a word's start stays
    in the word, as PowerShell's tokens show (pwsh 7.6.7). Two new R-1733 cases, "leading escape before line comment
    marker" and "leading escape before block comment marker", were red before the fix. The corpus gained the atom
    `` `a#b ``, a word that starts with a backtick escape: 115 occurrences in 110 of 1,500 commands (the seat recounted
    with `generatePowerShellCorpus()` at d23be1ea: 115 and 110). The builder's wrong-code tries: build 1's form fails
    both new cases and the oracle; clearing the token start after a line continuation too passed every file, so no
    existing case catches it (a carried residual).
  - c78c6e79 merges main f497c5ad (the stale-copies-hooks land tip). After it, a0ae01aa and d23be1ea add only the
    seat's pair files in this folder. No code or test changed after 7ca1eafb except through that merge.
- CI run 39338404113 on draft pull request #70 (c78c6e79; GitHub's merge onto f497c5ad, merge commit 5f6a49f1):
  - macOS `167 files: 165 PASS, 0 FAIL, 2 SKIP`, 7,684 checks pass.
  - Ubuntu `167 files: 165 PASS, 0 FAIL, 2 SKIP`, 7,629 checks pass.
  - Windows `167 files: 150 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6625 pass, 0 fail, 79 skip`
    (`ci-windows-run-3.log`). pipe-guard-pwsh-oracle `24 pass`, its oracle lines:
    ```
    PASS oracle: pwsh reports the lexer's comment and string spans for every generated command
    PASS oracle: powershell reports the lexer's comment and string spans for every generated command
    PASS oracle: on win32 a Windows PowerShell that does not start fails the run instead of skipping
    PASS oracle: a parse error or a missing result fails the comparison and names the command
    ```
  - The oracle lines PASS for pwsh on every leg and for Windows PowerShell on the Windows leg. install-check: macOS
    and Windows success. None of main's known failures showed.
  - The plan adversary's claim most likely wrong, that Windows PowerShell 5.1 tokenizes the corpus as pwsh 7.6 does,
    held: the powershell oracle line passes on the Windows leg, and the pairs run below names 5.1.26100.33438.
  - Build 1's run 39332622508 (92c3e751) also passed on all legs; R-1730's evidence cell names it. The builder's
    committed logs `ci-*-run-1.log` and `ci-*-run-2.log` are two downloads of one earlier run, on b4a0ffd0 (GitHub's
    merge e52e6fa0), not of run 39332622508.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, Node 22.22.2. This Mac
  has no PowerShell, so the oracle check prints SKIP here and no macOS pair names it.
  - 983da287 (`seat-mutate-output-983da287.txt`, committed in a8b637cb), one shard: 21 of 21 red, each by exactly its
    named titles. Baselines: the oracle file 22 PASS, pipe-guard 84 PASS.
  - c78c6e79 (`seat-mutate-output-c78c6e7.txt`, committed in d23be1ea), five shards: 22 of 22 red, 19 by exactly their
    named titles and 3 with an extra unnamed red, 0 survived. M3 and M10 also turn both new leading-escape cases red;
    M4 turns the block-comment one red. Baselines: the oracle file 24 PASS, pipe-guard 84 PASS. M10's anchor follows
    build 2's fix. The new pair M22 puts back build 1's form and turns both new leading-escape cases red.
  - Oracle-only pairs (`seat-mutate-ci.mjs` W1 to W3, run through `win-pairs.mjs`): each keeps every deterministic
    check green. They ran in place on a scratch CI branch, seatmut/pwsh-lexer-oracle (7bc43c8a: c78c6e79 plus the
    helper and a CI job that runs only this table; run 39338540305; never merged). Ubuntu, pwsh 7.6.6: 3 of 3 red.
    Windows, pwsh 7.6.6 and Windows PowerShell 5.1: 3 of 3 red, each by both oracle titles
    (`seat-mutate-ci-output-c78c6e7.txt`, committed in a0ae01aa). W1, a here-string opener only at an ASCII quote: 2
    corpus commands differ. W2, ’ dropped from the single-quote set: 69 differ. W3, only an ASCII quote doubling as
    an escape: 265 differ.
  - Declared, no pair (DECLARED (d)): no deterministic check and no generated command catches these wrong forms.
    Every `)` ends a word (main's rule); a lone CR after a here-string opener or before its closer; ‚ (U+201A) dropped
    from the single-quote set; a typographic here-string closer matched only in ASCII; Windows PowerShell's required
    flag; its not-on-PATH throw on win32; dropping it from the oracle shell list. With build 2's untested try above,
    these are carried residuals for the oracle's corpus. DECLARED (e): a mid-word quoted part reported as a span, and
    a dropped span sort, change only the generated corpus's spans, so only the oracle judges them.
- Independent check (`independent-check-c78c6e7.md`). It ran on build 1 (983da287), not on c78c6e7: a private
  clone, a temp HOME and TMPDIR for every probe, pwsh 7.6.7 (osx-arm64), and main's guard from 22ccd849 side by side.
  Expected values came from pwsh's own tokens. VERDICT FINDINGS, no MUST, 12 probes.
  - Held: the must-meet and existing tests; the live oracle found 0 disagreements over the 1,500 corpus commands; the
    code map and readme checks read 0 problems. The Claude Code hook end to end asks for a piped test run before a
    commit and stays silent with no pipe. A 1,000,000-character here-string asks in 65 ms (main 39 ms). Probe 7: the
    lane drops a false prompt main gives, for a typographic here-string.
  - The wider generated comparison (probe 9): 6,000 seeded commands over a wider alphabet (backticks, `@(`, type
    literals, member access, `-m:`, `2>&1`, operators). Of 4,893 parse-clean commands, pwsh asks on 4,777. Missed
    asks: lane 15, main 24. False asks: lane 9, main 17. Span disagreements: 569, all in the documented gaps (member
    access, operators, `@(`). Main asks and the lane does not on 8, all F1's cause. These numbers are build 1's,
    before F1's fix; nobody re-ran the comparison on c78c6e7.
  - Findings and how each was settled:
    1. F1, known bug (SHOULD), a fail-open this lane introduced. A backtick escape that is not a line continuation
       kept the token start, so in `` `a#c `` a following `#` opened a comment and hid a pipe main flags. Probe 12,
       ``Add-Content CHANGELOG.md `## 1.2.0; npm test | Select-Object -Last 3; git commit -am v1.2.0``: pwsh ask,
       lane null, main ask. Fixed in build 2 (7ca1eafb), with two R-1733 cases red before the fix and the new corpus
       atom. Seat pair M22 turns both cases red on c78c6e79, and the oracle passes on all three legs of run
       39338404113.
    2. F2, known bug (NOTE), contrived input. About 5,000 nested parentheses overflow the scanner's stack with a
       RangeError; at 1,000 the lane asks. The Claude Code hook turns the throw into an abstention with a stderr note,
       so it fails open there; pi's nana-gate blocks on a handler error. No honest command nests that deep. A carried
       residual.
  - Build 2's change had no independent probe. CI's oracle on three legs, the two new cases and M22 cover it.
- The plan adversary's side note, that the builder and its reviewer were both gpt-5.6-sol: the final and land
  reviewers are Claude Opus 5.5 and Claude Fable 5.1 through review-ledger, a lineage other than the builder's.
- Rows: R-1730 to R-1736 read `implemented` in REQUIREMENTS.md. The seat helper's re-run on d23be1ea plus these
  notes: `node scripts/requirements-trace.mjs` reads `requirements: 1417 total (1131 implemented · 1 planned · 26
  retired · 254 untested · 5 violated); 1131 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run
  map:check` reads 323 modules, 0 problems; `npm run readme:check` reads 709 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base f497c5ad): 7 rows in FEAT-010,
  R-1730 to R-1736 new (implemented).
- HANDOFF: one Landed line. The Claude Code hooks on Windows residual drops its last two sentences, because they
  named this lane's hardening step. New carried residuals, each naming this lane: the plan's known limits 1 to 5; F2;
  the wrong forms no check catches (DECLARED (d) plus build 2's line-continuation try).
- Install check: the lane class needs the local macOS install check before nana-land; the seat runs it before the
  land. CI's install check passes on macOS and Windows.
- Main was f497c5ad when CI ran, the lane's merge base. Main has since moved to 9d09376e, through the pi-settings-bom
  land (3903015b) and the post-edit-win-survivors land, and this lane has not merged it. A merge of main before the
  land needs its own accepted review coverage.

## Round 1 and build 3 (the seat, after the final reviewers' first round on b92f3185)

- Opus round 1: SEND-BACK, one MUST (M1): a here-string glued to an assignment (`$msg=@'`, `$m+=@'`) hid a later pipe
  that main and PowerShell's own tokens flag; a commit message with an apostrophe in the body is the realistic input.
  S1: a nested variable index glued to a comment with a quote kept a word where PowerShell starts a comment.
- Fable round 1: LAND 8/10 with one SHOULD (F1): a `#` glued to a second index, an array subexpression or a method call
  with arguments, followed by an odd quote, hid a pipe main flags (seeded fuzz over three seeds, 118 to 132 such cases
  each); F2: the nesting depth that overflows the stack is machine-dependent (3,000 on this Mac, not 5,000); F3: R-1730's
  evidence cell named build 1's run.
- Build 3 (`build-brief-3.md`, commit 3327c1cd, a pi gpt-5.6-sol builder): a line-final here-string opener glued to a
  whitespace-free variable assignment opens a here-string (command-mode `a=@'` stays a word, as PowerShell has it);
  a second or nested index's `]` and any closed `( … )` end the token, so a glued `#` starts a comment. New rows R-1737,
  R-1738 and R-1739; every new case was red on b92f3185 and its expected value came from pwsh 7.6.7's tokens; the corpus
  gained one command for each class; the local oracle passed. The seat checked one more shape against pwsh 7.6.7: in
  `Write-Output a(b)#c | x` PowerShell reads `RParen` then `Comment`, so treating any closed `( … )` as a token end
  matches PowerShell and opens no new gap.
- The seat's macOS pairs on build 3's merged tip 37d2e67: 25/25 red (19 exactly their named titles, 6 with an extra
  unnamed red), 0 survived; new pairs M23 to M25 put back build 2's rules for R-1737 to R-1739 and each turns its new
  cases red; M5's and M18's anchors follow build 3's code (commit f9959fa8, `seat-mutate-output-37d2e67.txt`). The
  oracle-only CI pairs (W1 to W3) ran on c78c6e7; build 3 did not change quote handling, so they were not rerun.
- HANDOFF: the member-access residual now names only bare member access (and hash table and type literals); the stack
  depth reads "a few thousand (3,000 on this Mac)"; the Landed line names round 1's four misses and build 3.
