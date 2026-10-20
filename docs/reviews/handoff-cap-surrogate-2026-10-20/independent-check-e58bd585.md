# Independent check — handoff-cap-surrogate at 4f686738 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at `$P=<tmp>`, checked out at 4f686738. Every run used `HOME=$P/home TMPDIR=$P/tmp` and node v22.22.2. pi is 1.0.2.

Probes
1. `node --experimental-strip-types tests/handoff-artifact.test.mjs` (lane tip)
   → `PASS cap: a 9012-unit body is injected raw as its first 8000 ...` and `PASS cap: a body cut between the two halves of a surrogate pair is injected ending before that pair`, 9 PASS, 0 FAIL, exit 0. Verdict: must-meet R-2160 holds, R-189 unchanged.
2. Ran each neighbouring test file on its own: handoff-{artifact,asks,staleness,store,symlink,trust,writer-role}, display-surfaces, writing-injection, config-handlers-malformed, apps/bench catch-ledger, and requirements-{tree,trace,unclaimed}, requirement-rows.
   → All exit 0, with 0 FAIL in each. Pass counts: 9, 5, 78, 54, 15, 53, 9, 181, 27, 99, 77, 93, 61, 6, 5. Afterwards `ls $P/tmp` shows only `node-compile-cache` and `jiti`. Verdict: nothing that main does today broke, and no test left files behind.
3. `node scripts/code-map.mjs --check`, and `requirements-moved.mjs --root . --base 54433844`
   → `0 problem(s)` with exit 0, and `FEAT-002 ... R-2160 new (implemented)`. `git status` stayed clean. Verdict: the map and the requirements tree are consistent.
4. `node --experimental-strip-types $P/probe.mjs <lane nana-handoff.ts>` runs realistic model summaries through the real session_compact → session_start → before_agent_start path:
   ```
   OK emoji spans cap (7999|8000): len=7999 wellFormed=true sectionWF=true
   OK emoji ends exactly at cap: len=8000 ... last=U+de00
   OK emoji starts at cap: len=8000
   OK rare CJK U+20000 spans cap: len=7999
   OK ZWJ family crosses cap mid-pair: len=7999 last=U+200d
   OK 4500 emoji, even offset: len=8000 / odd offset: len=7999
   OK body exactly CAP units ending in emoji: len=8000
   OK short body with emoji: len=16
   OK CRLF body spanning cap: len=7999
   lone-half summary: storeHasFFFD=true cut="before � after" wellFormed=true
   ```
   Verdict: each cut is a prefix of the trimmed body and is well-formed, and so is the whole section. A cut that does not land inside a pair is still raw and 8000 units long. The threat model says the store only holds well-formed text, and the probe confirmed it: a lone half the model writes is saved as U+FFFD.
5. Same probe against main 54433844 (separate private clone)
   → `BAD emoji spans cap: len=8000 wellFormed=false last=U+d83d`, and the same result for CJK (`U+d840`), ZWJ, odd-offset and CRLF. The non-straddling cases match the lane exactly. Verdict: main has the defect, the lane removes it, and nothing else changes.
6. Wrong-code pairs in the private clone, built from the lane tip
   - The cut reverted to `h.body.slice(0, INJECT_CAP)` with the export kept: `PASS cap: a 9012-unit...` and `FAIL cap: a body cut between...`.
   - `.slice(0, INJECT_CAP).toWellFormed()`: the same PASS and FAIL.
   - Restored afterwards with `git checkout`.
   Verdict: the new test kills both wrong versions.
7. Loaded the extension through pi 1.0.2's own loader: `discoverAndLoadExtensions([<lane nana-handoff.ts>], $P/cwd, $P/home/.pi/agent)`
   → `extensions: 1 errors: []` and `handlers: session_start,before_agent_start,session_compact`. Verdict: pi's loader accepts the new named export `INJECT_CAP` and the `head` import, so the hook still installs.
8. `find ~/.pi/agent/handoffs -newer $P/probe.mjs -type f | wc -l` → `0`. Also `git -C <repo> status --short | wc -l` → `0`. Verdict: no probe or test wrote to the real store or the real checkout.
9. `gh run view 39405084080` (lane CI on sha 4f686738)
   → `install-check (macos-latest)=success`, `install-check (windows-latest)=success`. The three suite legs were still in progress when I checked. Verdict: the Windows install passes. Windows suite results are not yet known.
10. win32: the cut (`head` in lib/display.mjs) has no platform branch. The new test reuses the R-189 fixture's `realpathSync.native(tmpDir(...))`. The CI Windows suite leg will confirm. I did not run it locally.
11. `grep "8000" packages/nana-pack/README.md`
   → "injected raw ... capped at 8000 UTF-16 code units". This stays true now that the cut can be 7999 units. Verdict: no README contract break.

Findings
- None at MUST.
- Known bug (not new, already a plan residual): the cut is pair-safe but not grapheme-safe. Probe 4's ZWJ case ends on U+200D, partway through an emoji sequence. The text is well-formed, so there is no provider harm.
- Note for the seat (not a finding): the lane worktree holds 2 untracked files, `docs/reviews/handoff-cap-surrogate-2026-10-20/seat-mutate.mjs` and `seat-mutate-output-4f686738.txt`. `nana-land` needs a clean source, so they must be committed in the reviewed change or removed before the land.

Probe scripts: `$P/probe.mjs` and `$P/load.mjs`.
