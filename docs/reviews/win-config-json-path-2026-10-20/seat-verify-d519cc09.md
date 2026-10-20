# Seat checks — win-config-json-path builds 1 and 2, tip d519cc09 (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker:
  - Build 1 (`build-brief-1.md`): 82ed4542 on main 6bc2f727, after the plan commit 07024984. Rows R-1970 and R-1971
    at the end of FEAT-001, R-1972 after R-1586 in FEAT-015 (block R-1970 to R-1979). `lib/json-text.mjs` gains
    `jsonErrorPlace`, which reads only V8's trailing `(line L column C)` through the contract constant
    `JSON_ERROR_PLACE`, and `CONFIG_FAILURE_PREFIX`. `lib/config.ts`'s `readConfigFile` records the failure from its
    one existing read (the BOM strip now through `parseJsonText`); `loadConfig` and `loadUserObjective` add
    `configFailure: {file, line, column}` to the objective settings, so the hook and the extension are not edited.
    `lib/objective.ts` puts one line right after the heading, also beside an UNAVAILABLE marker and in the
    internal-error block. `lib/doctor.mjs` reads the file once through a local `piPackConfigState` and no longer
    imports `readPiPackConfig`. README Windows step 7 gains the forward-slash sentence and a `~/` example; the pack
    README gains one objective-contract bullet. Three checks: fresh-machine (R-1970), objective-golden (R-1971, three
    fixtures through both runtimes, each with R-018's BYTE-IDENTICAL check), doctor-detail (R-1972).
  - Build 2 (`build-brief-2.md`): 2abae182, merged with main cdf4b098 at d519cc09. `jsonParseFailure` classifies V8's
    bad escaped character and bad control character errors as `forward-slash` and every other parse error as
    `manual`; `configFailureDetail` is the one renderer the objective line and doctor share. The two sentences read
    "Write objective.path with forward slashes because JSON reads a single backslash as an escape." and "Repair the
    JSON by hand." R-1971 and R-1972 now name the error-kind repair, and their fixtures add a bad control character
    and a trailing comma (five each). New rows: R-1973 (a broken config beside an unreadable objective file prints
    both the config line and the UNAVAILABLE marker, with no file text; M17) and R-1974 (doctor keeps main's
    `missing or unparseable: <path>` detail for a missing file and for a folder at the path; M23).
  - After d519cc09, 124ef8d1 adds only the seat's updated pair table and its output, and the seat's notes commit adds
    only this record, the independent check, the Windows log, the two review briefs, HANDOFF and the session entry.
    No code or test changed in the lane after d519cc09. This record does not restate the builder's reports; the pairs
    below re-judge the checks.
- CI run 39375725358 on draft pull request #104 (d519cc09; GitHub's merge commit 11cbedae merges d519cc09 into its
  own ancestor cdf4b098, so the tree tested is d519cc09's):
  - macOS `174 files: 172 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7811 pass, 0 fail, 27 skip`; objective-golden
    `1262 pass`, doctor-detail `70 pass`, fresh-machine `9 pass`.
  - Ubuntu `174 files: 172 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7756 pass, 0 fail, 45 skip`; the same three counts.
  - Windows `174 files: 157 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6747 pass, 0 fail, 103 skip`
    (`ci-windows-d519cc09.log`). The 17 skipped files are main's declared set. objective-golden `1008 pass, 6 skip`;
    doctor-detail `66 pass, 1 skip` (the macOS-only desk service check); fresh-machine `9 pass`; config-normalize
    `23 pass`; objective-injection `69 pass`. The lane's five checks pass natively by title, and the six new
    `unparseable config …: BYTE-IDENTICAL hook vs pi` checks pass beside them:
    ```
    PASS unparseable user nana-pack.json: both runtimes keep the objective and add one line with the error-kind repair, never file text
    PASS unparseable user nana-pack.json and unreadable objective: both runtimes print the config line and UNAVAILABLE marker without file text
    PASS doctor names an unparseable nana-pack.json's file and the error-kind repair, never the file's text
    PASS doctor keeps missing-or-unparseable detail for a missing or unreadable nana-pack.json
    PASS Windows step 7 shows a nana-pack.json example that parses as JSON and whose objective.path resolves inside the home folder alike in the pack and in doctor
    ```
  - install-check: macOS and Windows success. The workflow sets Node 22 on all three legs; Windows ran v22.23.3.
  - Build 1's CI run (82ed4542) was cancelled when build 2 superseded it, so it gave no result.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, and
    Windows main reads 0 FAIL from 4be0b79 (both in the lane's base); no R-291 merge artifact arises, since GitHub's
    merge commit holds d519cc09's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, Node 22.22.2, one
  shard (declared (a): the Linux and Windows legs are CI's):
  - On 82ed4542 (`seat-mutate-output-82ed4542.txt`, committed in 7445837e): 20 of 23 red, each by exactly its named
    titles; 3 survived. M17 (the line dropped beside an UNAVAILABLE marker), M18 (the line dropped from
    `produceObjective`'s internal-error block) and M23 (doctor reports a missing or unreadable file as unparseable)
    named no title, as declared (b), and turned nothing red. Build brief 2 sent M17 and M23 back and kept M18 a
    declared limit.
  - On d519cc0 (`seat-mutate-output-d519cc0.txt`, committed in 124ef8d1): 24 of 25 red, each by exactly its named
    titles, 0 with an unnamed red; 1 survived, M18, declared (b): no check forces the internal-error block. M17 now
    turns R-1973 red and M23 turns R-1974 red. The new M24 (build 1's form: the forward-slash advice for every parse
    error) and M25 (the manual repair for every parse error, a bad escape included) each turn R-1971 and R-1972 red.
    The brief's W1 to W8 sit in the table as M2 to M6, M9, M11, M12, M20 and M21. Baselines: fresh-machine 9,
    objective-golden 1262, doctor-detail 70, each 0 FAIL.
  - Declared, no pair: (c) the plan's dropped folder-at-path read in the runtimes (the adversary's amendment removed
    it; R-1974 covers doctor's folder case); (d) the pack README's new objective-contract bullet, prose no check reads.
- Independent check (`independent-check-82ed4542.md`): it ran on build 1, 82ed4542, not on d519cc09. A private clone
  with a temp home, main 6bc2f727 cloned beside it, Node 22.22.2: HOLDS, no MUST, nine probes plus the single-file runs
  (objective-golden 1249 PASS, doctor-detail 69 PASS, fresh-machine passes; ten regression files 0 FAIL; code map and
  readme check 0 problems; the clone stayed clean). The backslash fixture with `enabled:false` prints the line at line
  2, column 48 and keeps the objective lines, with no file text (P1). Four valid configs give hook output
  byte-identical to main (P2). An unquoted path, an empty file, truncated JSON, a BOM with CRLF and a trailing comma
  each give one line, with or without a place, and never file text; `null` and a folder give no line, as on main (P3).
  `loadConfig` and `loadUserObjective` add `configFailure` only for the user file; the gate stop reason is unchanged,
  and a bad project file adds nothing (P4). Doctor names the file and the place for a backslash file and keeps main's
  text for valid, missing, folder and `null` files (P5). README step 7's example reads ✓ in doctor under darwin and
  win32 and in the hook (P6). 3,000-character lines, a 1,002-character path and a path holding a newline stay under the
  cap, escaped, with one **Objective line (P7). With `PI_CODING_AGENT_DIR` set, the hook and doctor name the active
  file, and doctor keeps its note row for the default-folder file (P8). The install dry run's output matches main's and
  changes no file (P9). Its findings and how each was settled:
  1. Known bug, not MUST: the repair sentence always gave the forward-slash advice, in the objective line and in
     doctor. That advice is wrong for an empty file, a trailing comma or truncated JSON (P3). Fixed in build 2,
     2abae182: the forward-slash advice only for a bad escaped or bad control character, else "Repair the JSON by
     hand.". R-1971's and R-1972's widened fixtures and the pairs M24 and M25 pin it. The independent check did not
     re-run on build 2; the pairs and CI cover that change. Carried to HANDOFF as a build-1-only line.
  2. Unverified: Node 24's message format. It stays a HANDOFF residual. CI runs Node 22 on all three legs; the plan's
     adversary saw the same bad-escape message and place suffix on Node 24.22.0.
  It exercised no Windows host; CI's Windows leg ran the lane's five checks natively at d519cc09.
- Seat observations on d519cc09, for the reviewers (the seat fixes nothing here):
  - The pack README's new objective-contract bullet still says the line "tells the owner to write `objective.path`
    with forward slashes". Since build 2 only a bad escaped or control character gets that advice; every other parse
    error gets "Repair the JSON by hand." No check reads that prose (declared (d)). Carried to HANDOFF.
  - objective-golden and doctor-detail type the two advice sentences out as literals; `json-text.mjs` does not export
    them. A rewording turns both checks red, which is loud. Not carried.
- The plan's known limits, each a HANDOFF residual: V8 gives no place for an unexpected token or an empty file; the
  place and the error-kind split rest on V8's message wording; the gate stop prefix "gate block is malformed" was out
  of scope, and the stop, pi's config warning and the journal still quote up to 120 characters of V8's message, which
  for an unexpected token is file text; the adoption hook still falls back silently, and an unreadable user config
  (a folder, a permission error) gets no config line; a pasted path whose escapes are all valid JSON, such as
  `D:\temp\new`, parses into a wrong path; the producer expands `~/` only, not `~\`; while the config does not parse,
  doctor's pi objective file row judges the default file. The plan's "doctor's summary still says to run install"
  belonged to doctor-fix-line, now on main (see the merge note below). The plan's last limit closes HANDOFF's
  readme-windows-checklist review line on step 7's backslash, and the seat removes it.
- HANDOFF: one Landed line. The readme-windows-checklist review residual on step 7 closes and is removed. Ten new
  carried residuals, each naming this lane: the place missing for some errors; Node's message wording; the gate stop's
  quoted message; the adoption hook and an unreadable config; a path of valid escapes; `~\`; doctor's objective file
  row; M18's unpinned internal-error block; the independent check on build 1 only, with the pairs on macOS only; the
  pack README bullet. Three more lines carry doctor-fix-line's review notes (below).
- Seat items from other lanes. doctor-fix-line landed on main at 8466795b after this lane's base; its HANDOFF lines
  reach this lane at the merge of main.
  - Opus r1 LAND on 8466795b, NOTEs: (1) a SetupError whose message starts with an empty line makes `refusal` an empty
    string, and doctor then crashes in `dryRunRows.filter` on undefined; no such message exists today, and the fix is
    a check on `refusal !== undefined`. New carried line. (2) Doctor's knowledge check creates `index.db-wal` and
    `index.db-shm` beside `index.db`, on main too; R-1995's fresh home has no `index.db`, so its check cannot see it.
    New carried line. (3) D1 and D3 survive. Main's HANDOFF already carries both, so no line here. (4) R-1990 and
    R-1995 pass on main's code; only the wrong-code pairs guard them. New carried line.
  - Fable r1 LAND 9/10 on 8466795b: SHOULDs 1 and 2 (bug B: the line trusts install's prediction; probes P5, P9 and
    P10 add a `.pi/agent` path saved as a file). Main's HANDOFF already carries it ("it trusts install's dry run …
    A rules, pi or shared memory folder saved as a file is another"), so no line here. NOTE 3: the dry run's
    `pi --version` has no time limit. Main's HANDOFF already carries it (install-dry-run-pi-packages: "That check has
    no time limit … Install and doctor make the same call"); the seat's input names a pi-probe-timeout lane for it. No
    line here. NOTE 4 is Opus's empty-refusal note.
- Rows: R-1970 to R-1974 read `implemented` in REQUIREMENTS.md: R-1970, R-1971 and R-1973 at the end of FEAT-001;
  R-1972 and R-1974 after R-1586 in FEAT-015. The seat helper's run at 124ef8d1: `node scripts/requirements-trace.mjs`
  reads `requirements: 1517 total (1251 implemented · 1 planned · 34 retired · 226 untested · 5 violated); 1251 traced
  by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 333 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base cdf4b098): `cdf4b09..124ef8d:
  5 rows in 2 features`. FEAT-001 · Keep goals and priorities in view: R-1970, R-1971 and R-1973 new (implemented).
  FEAT-015 · Diagnose the active environment: R-1972 and R-1974 new (implemented). CAP-01 moves from 185 to 188 rows
  and FEAT-001 from 32 to 35; CAP-04 from 416 to 418 and FEAT-015 from 96 to 98.
- Not in this record: a locked full-suite run (CI's three legs ran the whole suite) and the local macOS install check,
  which runs before the land.
- Merge note: main was cdf4b098 when the lane last merged it, its merge base. Main has since moved to 8466795b
  (doctor-fix-line landed), so the land needs a merge of main and a confirmation round on the merged tip. Main changed
  `packages/nana-setup/lib/doctor.mjs` (the `@outputs` header line this lane also edits, an `installLabel` argument on
  `add`, and install labels on three rows; not the pi nana-pack.json row), `bin/nana-setup.mjs`, the setup README,
  HANDOFF, the session archive, REQUIREMENTS.md, the tree and the code map. After that merge, main's doctor-fix-line
  residual that lists "a nana config file that does not parse" among ✗ lines naming no fix goes stale, since this
  lane's row names the repair. That is inferred from the code; nobody ran it on a merged tree.
