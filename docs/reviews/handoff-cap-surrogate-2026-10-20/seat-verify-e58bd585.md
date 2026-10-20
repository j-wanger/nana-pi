# Seat checks — handoff-cap-surrogate builds 1 and 2, tip e58bd585 (2026-10-20)

- Builds, by a Claude Sonnet 5 subagent (`build-brief-1.md`, `build-brief-2.md`, two builds):
  - Build 1, 4f686738: R-2160 joins FEAT-002 SUB-003 directly under R-189. `extensions/nana-handoff.ts` adds `head`
    to its `../lib/display.mjs` import and cuts the injected body with `head(h.body, INJECT_CAP)` in place of
    `h.body.slice(0, INJECT_CAP)`. `head` is the pack's existing pair-safe cut: the first n units, minus one when unit
    n−1 is a high surrogate. `INJECT_CAP` is now exported, under the note
    `// contract (R-189): the injected compaction summary body cap, in UTF-16 code units.`
    `handoff-artifact.test.mjs` gains the R-2160 check, which reads the cap by name (`mod.INJECT_CAP`) and never
    writes 8000. The tree is regenerated. The module header, `POINTER_CAP`, `DAY_MS` and the stalePointer trim are
    unchanged; the code map lists no exports, so it does not move.
  - Build 2, 4011c0a3, test only: the R-189 sealing check folds in a second body, 8500 ASCII units, whose injected cut
    must equal its first 8000 units, written with the literal. The emoji body's assertion, the check's title and its
    `// req: R-189` marker are unchanged, and no row or check call was added. Build 2 came from the seat's
    wrong-code pairs (M4 below), not from a review.
  - becab95a adds the pairs' table, the build-1 record and build brief 2; d9494ee6 adds the build-2 record and moves
    the table's tip to 4011c0a3. e58bd585 merges main aa5f25cd (the mutation-runner-lock-overlap land tip), which
    touches no lane file. The lane branched from main 54433844, the handoff-pins land tip. The seat's notes commit
    adds only this record, the independent check, the Windows log, the review briefs, HANDOFF and the session entry.
- CI on build 2 plus the merge, run 39406330980 on draft pull request #121 at e58bd585 (GitHub's merge commit
  bb72716b merges e58bd585 into its own ancestor aa5f25cd, so the tree tested is e58bd585's):
  - macOS 177 PASS, 0 FAIL, 2 SKIP of 179 files (7,909 checks pass).
  - Ubuntu 176 PASS, 0 FAIL, 3 SKIP of 179 files (7,848 checks pass). The macOS and Ubuntu numbers are the seat's
    reading of the run; no log is kept here.
  - Windows `179 files: 162 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6845 pass, 0 fail, 107 skip`
    (`ci-windows-e58bd585.log`). The 17 skipped files are main's declared set (16 desk files and the bench's
    study-tasks). handoff-artifact `9 pass`, both cap checks by title:
    ```
    PASS cap: a 9012-unit body is injected raw as its first 8000 UTF-16 code units, after the Source and Provenance lines
    PASS cap: a body cut between the two halves of a surrogate pair is injected ending before that pair
    ```
    Against handoff-pins' Windows run, handoff-artifact gains exactly one pass (8 to 9). Neighbours: handoff-store
    `48 pass, 2 skip`; handoff-staleness `46 pass, 4 skip`; handoff-symlink 15; handoff-trust 53;
    handoff-writer-role 9; handoff-asks 5; display-surfaces 181; product-report 71; requirements-tree 93.
  - install-check: macOS and Windows pass.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds e58bd585's
    tree.
  - The run on build 1 (4f686738), 39405084080, was cancelled as superseded; only its install checks finished, both
    passing (independent check, probe 9).
- The seat's probe through real pi 1.0.2, with an offline faux provider (no log kept here): main injects 8000 units
  ending on 0xD83D, which is not well-formed; the lane injects 7999 units ending on `x`. ASCII, CJK,
  low-surrogate-cut and short emoji bodies give system prompts byte-identical to main's once timestamps are masked.
  The product code is the same at 4f686738, 4011c0a3 and e58bd585.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2. Each baseline read handoff-artifact 9 PASS, 0 FAIL.
  - On 4f686738 (`seat-mutate-output-4f686738.txt`, committed in becab95a): 9 of 10 red, 1 survived (M4). M4 retunes
    `INJECT_CAP` from 8000 to 8001. The R-189 seal's emoji body has a high surrogate at unit 8000, so
    `head(body, 8001)` steps back to 8000 units and the seal passes. Main's raw slice returned 8001 units and turned
    R-189 red, so the lane's cut opened this gap in the seal. Build brief 2 asked for a body with no pair at the cap.
  - On 4011c0a3 (`seat-mutate-output-4011c0a3.txt`, committed in d9494ee6, the table's tip moved to 4011c0a3): 10 of
    10 red, 0 survived, each exactly on its named titles. R-2160 turns red under M1 (the cut reverts to main's raw
    slice), M2 (`INJECT_CAP` unexported), M6 (W2, the raw cut made well-formed with U+FFFD) and M10 (W8, a pair-safe
    cut one unit long, then a raw cut back). R-189 turns red under M3 (cap 7999), M4 (cap 8001), M5 (W1, always one
    unit short) and M7 (W3, drop the last unit on any surrogate). Both turn red under M8 (W4, a code-point cut) and
    M9 (W5, drop the last unit only on a low surrogate).
  - Declared in the table: (a) the `head` import is part of the cut site, and dropping it alone throws at injection,
    so it has no pair; (b) the plan's W7 (strip lone surrogates after the raw cut) matches `head` on every
    well-formed body the store can hold, so it is equivalent and has no pair. Every pair ran on macOS only; the cut
    has no platform branch, and CI's Windows and Ubuntu legs run both checks.
- Independent check (`independent-check-e58bd585.md`): it ran on build 1, 4f686738, in a private clone with a temp
  HOME and TMPDIR, on macOS with Node 22.22.2 and pi 1.0.2. HOLDS, no MUST, over 11 probes. The lane's handoff-artifact
  reads 9 PASS (probe 1), and 15 neighbouring test files exit 0 with nothing left in the temp folder (probe 2).
  map:check reads 0 problems, and the tree shows R-2160 new and implemented (probe 3). Realistic summaries through the
  real compact, start and inject path all give well-formed cuts: a straddling emoji, rare CJK U+20000, a ZWJ family,
  an odd offset and a CRLF body cut at 7999 units; every other cut stays raw, 8000 units or the whole short body; a
  lone half the model writes is stored as U+FFFD (probe 4). Main at 54433844
  gives 8000 units ending on a lone high surrogate in each straddling case, and the same cut in every other case
  (probe 5). Its own two wrong versions each turn R-2160 red (probe 6). pi 1.0.2's own loader loads the lane's
  extension with no error and its three handlers, so the new export and import do not break the hook (probe 7).
  Nothing wrote to the real store or the real checkout (probe 8). Build 2 changed only the R-189 test, so its probes
  still describe the product; nobody re-ran it on build 2. Its findings and how each was settled:
  1. No MUST.
  2. Known bug: the cut is pair-safe but not grapheme-safe. Probe 4's ZWJ case ends on U+200D, inside an emoji
     sequence; the text is well-formed. The check calls it already a plan residual, but the plan's known limits do
     not name it. A new HANDOFF residual.
  3. Note: the worktree held two untracked seat files, `seat-mutate.mjs` and `seat-mutate-output-4f686738.txt`.
     Both were committed in becab95a, so the source is clean for the land.
  4. Its probes 9 and 10 left the suite legs to CI. The e58bd585 run settles them: 0 failing files on all three legs,
     and handoff-artifact 9 pass on Windows.
- The plan's known limits, each settled:
  - Provider behaviour (whether the codex backend rejects or replaces a lone surrogate in `instructions`) stays
    unmeasured. The lane removes the lone half from this path, so it no longer matters here, and it is not carried.
    The adversary's claim most likely wrong stands: on codex the fix may change nothing a user sees.
  - The stalePointer writer trim (`w.slice(0, keep)`) can split a pair: a HANDOFF residual.
  - `nana-post-edit.ts` MAX_OUTPUT cuts raw: owned by the post-edit-values-named lane (in flight), so no separate line.
  - The knowledge index cuts titles and claims raw, and every rendered field passes through `promptText`; R-888
    stays untested: a HANDOFF residual.
  - `review-findings.mjs` cuts at FINDING_MAX_CHARS, for the ledger, not a prompt: a HANDOFF residual.
  - `POINTER_CAP` and `DAY_MS` carry no provenance note: a HANDOFF residual.
  - The R-2160 check is a pure string check with no skip; CI ran it on all three legs.
- HANDOFF: handoff-pins' two "Handoff summary cap" residuals go, since this lane fixes both. The cut no longer leaves
  a lone half, and `INJECT_CAP` carries its provenance note.
- Rows: R-2160 reads `implemented` in REQUIREMENTS.md. The seat helper's re-run at the notes commit: `node
  scripts/requirements-trace.mjs` reads `1575 total (1335 implemented · 1 planned · 37 retired · 197 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 342 modules, 0 problems; `npm run
  readme:check` reads 720 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base
  aa5f25cd):
  ```
  tree movement aa5f25c..e58bd58: 1 rows in 1 features
  FEAT-002 · Resume decisions and next actions
    R-2160 new (implemented)
  ```
  CAP-01 moves from 192 to 193 rows, FEAT-002 from 62 to 63 and SUB-003 from 10 to 11. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land, as the plan asks.
- Main was aa5f25cd when the lane merged it at e58bd585. It is now c7f582ad, after two lands: post-edit-timeout-name
  (07f8f6f9) and pi-launch-followups (c7f582ad). Neither touches `nana-handoff.ts`, `lib/display.mjs` or
  `handoff-artifact.test.mjs`; they share HANDOFF, REQUIREMENTS.md, the tree and the session file. So the land needs a
  merge of main and a confirmation round on the merged tip.
