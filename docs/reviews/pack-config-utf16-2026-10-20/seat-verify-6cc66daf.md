# Seat checks — pack-config-utf16 builds 1 and 2, tip 6cc66daf (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (two builds); the lane branched from main a112fd30, with the
  plan at 2d6826c3:
  - Build 1 is one commit, db2e4c1b (`build-brief-1.md`). `packages/nana-pack/lib/json-text.mjs` gains
    `parseJsonBytes`: a buffer that starts FF FE decodes whole, mark included, as UTF-16LE; one that starts FE FF is
    copied, `swap16`'d and decoded as UTF-16LE; an odd byte count after either mark throws a SyntaxError first;
    anything else decodes as UTF-8. The text then goes through `parseJsonText`, which removes exactly one U+FEFF. The
    two marks are contract constants (`// Contract (R-2230, R-2236)`). Seven readers switch to it and drop their own
    decoding and mark strip: `config.ts` `readConfigFile`, `adoption.mjs` `adoptionSettings`, `nana-roster.mjs`
    `readRosterFile`/`resolveRoster`, `roster-set.mjs`, `doctor.mjs` `piPackConfigState`, `steps.mjs`
    `readPiPackConfig` and `project.mjs`'s `.pi/nana-pack.json` parse. The pi settings.json readers keep
    `parseJsonText`. The pack README gains a Config encodings bullet, names marked UTF-16 in the roster's
    byte-order-mark sentence and says `set` rewrites the file as UTF-8. REQUIREMENTS.md gains R-2230 to R-2237 in
    FEAT-015 after R-1586. The new `pack-config-utf16.test.mjs` holds R-2230, R-2231, R-2232, R-2236 and R-2237;
    `adoption-reader.test.mjs` R-2235, `doctor-detail.test.mjs` R-2233 and `project.test.mjs` R-2234. Build 1 left
    R-2237 `untested` behind a `req-candidate` marker; off Windows it printed a SKIP line and then a vacuous PASS.
  - 961f76d1 merges main c203f485 (the handoff-cap-surrogate land tip) into db2e4c1b, with no conflict. 73089d88 adds
    the seat's pairs.
  - CI run 39414266878 at 961f76d1 printed `PASS R-2237: …` on the Windows leg. Build 2 (`build-brief-2.md`, tests and
    row only) is 58e2da48: R-2237's marker reads `// req: R-2237` and its row `implemented`, and off Windows the check
    is now a real skip with no PASS line. eafa54d0 adds the pairs on build 2.
  - 2d2ba429 merges main 0305bc8d; 69f0a82e merges main 1207b69e. main's checkout-spelling-converge changed
    `linkSkill` in `steps.mjs` and this lane changed `readPiPackConfig` there; git merged the file cleanly, and both
    merges conflicted only in the generated code map and tree, which the seat regenerated. 6cc66daf adds the pairs on
    the merged tip. After it, the seat's notes commit adds only this record, the independent check, the Windows log,
    the two review briefs, HANDOFF and the session entry.
- CI run 39418143889 on draft pull request #128 at 2d2ba429 (build 2 plus the seat's merge of main 0305bc8d; GitHub's
  merge commit 47d7a5f6 merges 2d2ba429 into its own ancestor 0305bc8d, so the tree tested is 2d2ba429's); all five
  jobs succeeded:
  - macOS `187 files: 185 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7943 pass, 0 fail, 30 skip`; pack-config-utf16
    `4 pass, 1 skip`, adoption-reader `45 pass`, doctor-detail `72 pass`, project `124 pass`.
  - Ubuntu `187 files: 184 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7882 pass, 0 fail, 48 skip`; pack-config-utf16
    `4 pass, 1 skip`, adoption-reader `45 pass`, doctor-detail `72 pass`, project `124 pass`.
  - Windows `187 files: 170 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6874 pass, 0 fail, 111 skip`
    (`ci-windows-2d2ba429.log`). The 17 skipped files are main's declared set (16 desk files and bench's
    study-tasks). pack-config-utf16 `5 pass`, including
    `PASS R-2237: on Windows, a nana-pack.json written by Windows PowerShell's Out-File and > turns the objective off`;
    adoption-reader `43 pass, 2 skip`, doctor-detail `68 pass, 1 skip`, project `124 pass`. R-2237 is the row only
    the Windows leg can prove: Windows PowerShell 5.1's `Out-File` and `>` write FF FE there, and the objective
    producer prints nothing for both files. That settles the plan's claim most likely wrong.
  - install-check: macOS and Windows success.
  - None of main's known failures showed (Ubuntu's path spelling, fixed on main at ca27d86; a pull request run's R-291
    leaf-total merge artifact, which cannot arise here because GitHub's merge commit holds 2d2ba429's tree).
  - CI has not run on 69f0a82e or 6cc66daf. The merge of main 1207b69e brought checkout-spelling-converge,
    gate-rm-bare-repo and install-link-race, each green on all three legs on its own run; the land runs the locked
    suite on the reviewed tip.
- The seat's wrong-code pairs (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one shard): 19 of
  19 red, 0 survived, each exactly on its named titles, on all three tips: 961f76d1
  (`seat-mutate-output-961f76d1.txt`, commit 73089d88), build 2 58e2da48 (`seat-mutate-output-58e2da48.txt`, commit
  eafa54d0) and the merged tip 69f0a82e (`seat-mutate-output-69f0a82e.txt`, commit 6cc66daf). The baseline reads
  pack-config-utf16 5 PASS on 961f76d1, which counts build 1's vacuous R-2237 PASS, and 4 PASS on 58e2da48 and
  69f0a82e; adoption-reader 45, doctor-detail 72 and project 124 PASS on all three.
  - Each reader reverted to main's decode turns its row red: C1 (`config.ts`) R-2230 and R-2231; A1 (adoption)
    R-2235; N1 (nana-roster) and S1 (roster-set) R-2232; D1 (doctor) R-2233; T1 (steps) and P1 (project) R-2234.
  - The decoder's wrong versions: J1 (an odd count after the LE mark allowed), J2 and J3 (the LE or BE mark sliced off
    before decoding), J4 and J5 (TextDecoder with its default ignoreBOM for LE or BE) and J9 (a NUL byte with no mark
    read as UTF-16LE) turn R-2236 red. J6 (every leading U+FEFF stripped) turns R-2236 and the existing two-marks
    check red. J7 (BE decoded with no swap) and J8 (no BE branch) turn R-2230 red. J10 (the UTF-8 path keeps its one
    mark) turns five existing checks red, four of them UTF-8 byte-order-mark checks, and J11 (UTF-8 through
    TextDecoder's defaults) the existing two-marks check. K1 (the two marks swapped) turns R-2230, R-2231 and R-2232
    red.
  - Declared without a pair, before the run: (a) R-2237 prints SKIP off Windows, so no pair names it; (b) dropping the
    BE odd-count check alone is an equivalent version, because `swap16` throws a RangeError on an odd length and every
    reader's catch takes it as it takes the SyntaxError; (c) no pair for `nana-pack.json.bak`: roster-set's
    `copyFileSync` is unchanged, and a one-off probe saw `set` write UTF-8 from a UTF-16LE file and leave `.bak`
    byte-identical to the FF FE original (R-1407 pins `.bak` bytes for UTF-8 only); (d) install's objective seed is
    reached through T1, since `readPiPackConfig` is the lane's only `steps.mjs` change; (e) N1 leaves the new import
    in place, unused.
- Independent check (`independent-check-6cc66daf.md`, filed under this tip's name): it ran on 961f76d1 in a private
  clone beside main c203f485, with a temp home. HOLDS, no MUST and no new known bug, over nine probes plus the
  must-meet and neighbouring files.
  - Must-meet files on the lane: pack-config-utf16 5/0 (R-2237 SKIP on macOS; that count includes build 1's vacuous
    PASS, which build 2 removed), adoption-reader 45/0, doctor-detail 72/0, project 124/0. project needed npm's prefix
    set by hand under the temp home, HANDOFF's existing bom-pack-config residual. Ten neighbouring files passed at 0
    failing; the code-map check read 0 problems and the readme check 720 claims, 0 problems.
  - The gate on a UTF-16LE or UTF-16BE file shaped as PowerShell 5.1 writes it (CRLF, four-space indent) blocks
    `terraform destroy` and a non-ASCII pattern by pattern and allows `ls`, as for UTF-8; main stops all three as a
    malformed gate block (probe 1). A broken UTF-16 file (one stray byte, or no mark) still stops every gated tool, so
    the lane does not fail open (probe 2); forced win32 with pi's PowerShell tool behaves the same (probe 3).
  - Twelve UTF-8 and edge inputs through nana-objective, `nana-roster --json` and the roster-notice hook gave
    byte-identical output on main and the lane. The one difference: a file holding only FF FE is still refused, now
    with "Unexpected end of JSON input" (probe 4). Doctor's rows differ from main's only for UTF-16 inputs (probe 5).
  - `nana-roster set` on a UTF-16LE and a UTF-16BE file: exit 0, `.bak` byte-equal to the original, the new file
    UTF-8, mode 600 kept, an emoji note round-trips (probe 6). The objective hook prints 0 bytes for a UTF-16BE user
    file with the objective off, where main printed 1985 bytes and the config-failure line; a project file still
    cannot turn the objective off (probe 7). Install's objective seed no longer plans a stray seed for a UTF-16LE file
    (probe 8). The roster-notice hook prints the roster for a UTF-16BE file, where main refused it (probe 9).
  - Its notes and how each was settled: R-2237 did not run on macOS; the Windows CI leg passed it at 961f76d1 and
    again at 2d2ba429. The frozen desk still reads a UTF-16 file as unreadable; its save path warns and keeps a backup
    before it writes, so no data is lost (the plan's known limit 2): a HANDOFF residual. A UTF-16 file has half the
    room under the 1 MiB bounded-read cap, which no realistic config nears: a HANDOFF residual. Its process slip, a
    61-byte probe file it wrote in the temp folder and deleted at once, touched nothing of the lane. The worktree
    stayed clean at 961f76d1.
- The plan's other known limits: a UTF-16 pi settings.json stays unreadable to pi and to doctor (a HANDOFF residual);
  PowerShell 5.1's `Set-Content` default, the ANSI code page, still turns non-ASCII characters into replacement marks
  (a HANDOFF residual); a refusal or gate stop for a still-unparseable UTF-16 file quotes parser text, as on main (the
  existing win-config-json-path residual already says so, unchanged); the rows' place in FEAT-015 is the owner's call
  (the existing byte-order-mark rows item in HANDOFF's open questions for the owner now names this lane); nobody has
  seen the owner's file (the bom-pack-config UTF-16 residual is reworded to keep that). `install-check.mjs` reads only
  the file it seeds itself and is unchanged; that is not carried, since no user reads a config through it.
- HANDOFF: one Landed line. The bom-pack-config residual "a nana config file saved as UTF-16 stays unreadable
  everywhere, pi included" drops its fixed half and keeps that nobody has seen the owner's file. Four new residuals
  name this lane: pi's own settings file in UTF-16, the desk, the ANSI code page and the 1 MiB room. The seat items
  from other lanes are in the session entry; their HANDOFF edits reword four lines (the mutation-runner leftover race,
  the native-lookup review output, the rm walk's `.git` rule, and the checkout-spelling-converge Landed line) and add
  five (the notify test helper, install's PATH-step throw, the rm-inside comment, the pack README's git wording, the
  setup README's convergence bullet).
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2230 to R-2237 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row changed since
  6cc66daf): `node scripts/requirements-trace.mjs` reads `requirements: 1619 total (1382 implemented · 1 planned · 37
  retired · 193 untested · 6 violated); 1382 traced by tests` and `ears: 0 rows off form (allowance 0)`; `npm run
  map:check` reads 353 modules, 0 problems; `npm run readme:check` reads 723 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 1207b69e):
  ```
  tree movement 1207b69..6cc66da: 8 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-2230 new (implemented)
    R-2231 new (implemented)
    R-2232 new (implemented)
    R-2233 new (implemented)
    R-2234 new (implemented)
    R-2235 new (implemented)
    R-2236 new (implemented)
    R-2237 new (implemented)
  ```
  CAP-04 moves from 489 to 497 rows and FEAT-015 from 128 to 136. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at 2d2ba429) and the local
  macOS install check, which runs before the land.
- Main moved under this lane twice after the first merge: CI ran on 2d2ba429 (build 2 plus main 0305bc8d); the seat
  then merged main 1207b69e at 69f0a82e. Main is still 1207b69e, the merge base and the review base.
