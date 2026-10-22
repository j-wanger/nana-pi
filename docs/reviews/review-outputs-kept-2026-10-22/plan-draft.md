# review-outputs-kept: plan draft (planner, 2026-10-22, main 09e38e7d)

Feature: FEAT-007 · Review a specific revision independently. Class: install, hook or gate (changes review-round, review-ledger, pi-review, nana-land).
Stakes: high blast, partly irreversible. Every review and every land passes through `complete()` and `runLand()`, and a text we fail to keep is gone for good.

## What the code does today (read, not inferred)

- The ledger lives in the user's home, `~/.pi/agent/` (`ledgerPaths`), on purpose. It is not in the git common dir. Files: the tally `review-ledger.rounds.jsonl`, which is never rotated, and the audit `review-ledger.jsonl` (+`.1`), which rotates past 1 MiB and keeps one older copy.
- The tally line (v2) has no output path and no hash. Only the audit line records `out`, exactly as the launcher typed it (8 records hold a relative path).
- From the tally, nana-land reads only `v===2`, `revision`/`head`, `item`, `verdict` and `unverified`. It reads no out path, no hash and no audit. review-timeline joins tally to audit on {repo,item,revision,role,endedAt} to find `out` (the known bugs: "file gone", "log rotated away").
- `complete(res, out)` re-reads the verdict from the `out` path. If that file is missing, `readVerdict` parses the path string itself, so the round is recorded with an empty verdict, which nana-land refuses for good.
- An ignored in-tree `--out` leaves the revision unchanged. A non-ignored one warns. A tracked one is refused.
- (c) cannot work. `merge --ff-only` only moves the ref, and nana-land requires `refs/heads/main === tip` afterwards. Any commit added after the merge would reach main uncovered by a review, which the land rules forbid.

## The audit's number, corrected (real ledger, read-only, 2026-10-22 ~11:30Z)

- nana-pi tally v2 rounds: 416 (the audit's "406", grown since). Joined to audit `out`: 117 point at deleted files (the audit's "about 100").
- The other 299 are not safe either. 279 sit in `$TMPDIR/nana-seat-scratch` (macOS T folder). 20 sit in this session's scratchpad. **None of the 416 point at durable storage.** Inferred: macOS cleans T files left unopened for about 3 days, and the scratchpad dies with the session.
- Whole audit log, all repos: 1126 verdict records, 779 already missing. nana-pi: 698 records, 366 missing, 35 at an existing `docs/reviews/` path.
- 380 review texts are committed under `docs/reviews/` today, all copied by hand. No record names them.
- Size of the 347 surviving outputs: median 4.3 KB, p95 8.5 KB, max 17.8 KB. Volume: about 51 reviews a day on average, 185 on the busiest day.

## Design (recommended): (a) keep the text at record time, plus a keep command for the lane folder

1. `complete()` takes the text the launcher captured (`{ text }`). It reads the verdict from those exact bytes. Under the ledger lock, before appending the tally line, it writes them to `~/.pi/agent/review-ledger.texts/<sha256>.md` (temp file, then rename; an existing file must be a regular file with equal bytes). The tally and audit lines gain `text: { sha256, bytes }`. If the write fails, nothing is recorded (ok:false), the same as any ledger fault today. pi-review and review-ledger run pass `{ text }`, and both already hold it in memory. The path argument stays for old callers and tests.
2. `review-ledger keep --item <slug> --into <dir> [--repo <path>]` copies every kept text of that item (this repo only) into `<dir>` as `r<round>-<role>-<sha8>.md`. It sanitizes the role to `[a-z0-9._-]`, skips a file that already holds the same bytes, and refuses before writing anything if a name holds different bytes. The seat runs it into `docs/reviews/<lane>-<date>/` with each fix commit, and once before the final round.
3. Readers. review-timeline reads the kept text by hash when the tally line has one and falls back to audit `out` for old lines. nana-land checks every LAND record it relies on: when the record carries `text`, the kept file must exist and hash equal, or the land is refused. Its success report lists each such kept file (the final round's pointer).
4. Store beside the tally, not in the git common dir. One lock, one home and one trust model cover the record and its text, and they live and die together. A re-clone wipes the common dir while the home tally survives, so land would then refuse honest records. Legacy `path:` repos have no common dir.

Trade: the final round's text lives only on this machine, outside git, until someone copies it.
Rejected: (b) by hand, which is today's practice: a hand maker, 380 files, no link from the record. (c) cannot work (above). git notes on the reviewed commit: they travel on push, but they write refs and objects into the shared repo from parallel worktrees, have no commit to attach a snapshot revision to, and add a second store to keep in step with the tally.

## "Kept in the lane's review folder": what can honestly be promised (owner's call)

- Every round before the final one can sit in the folder, written by `keep` and committed with the next fix. The final round reviews the tip, so adding its text to the lane makes a new tip that needs another review, which never ends. It also breaks "after LAND, nothing more is edited".
- Honest promise: "Every review output is kept on this machine, named by hash in its ledger record. Every round but the final one is also committed in the lane's review folder. The final round's texts are named in the land report and stay in the store."
- This differs from the owner's words for the final round, so the owner decides. Default: **store**. The alternative is a sweep: the next reviewed lane runs `keep` for landed items into their old folders. That costs a commit in every next lane, mixes lanes, and leaves the last lane before a pause unswept.

## Candidate must-meet rows (EARS, one shall each; IDs from R-2542, coordinate with claude-review-launcher)

- M1. WHEN a review round is recorded, the ledger shall write the review text its verdict was read from to the review store beside the tally, named by its sha256, and record that sha256 and byte count in the round's tally line.
  Test "a recorded round keeps its review text by hash beside the tally": review-ledger run with a stub reviewer printing a known text, `--out` in a temp scratch folder. Assert the tally `text.sha256` equals sha256 of the text and the store file's bytes match. Then run a second review with a different text on the same revision: one round, two kept texts. Red on main: no `text` field and no store. This test also pins the hash contract (sha256, 64 hex).
- M2. IF the launcher's output file is missing when a completed review is recorded, THEN the ledger shall read the verdict from, and keep, the text the launcher captured.
  Test "a missing --out at record time still records and keeps the captured verdict": `complete(res, <deleted path>, { text: "…\nVERDICT: LAND" })`. Red on main: `text` is ignored, the path string is parsed, and the verdict is empty.
- M3. WHEN the folder that held a recorded sent-back review's `--out` has been deleted, the review timeline shall list that review's MUST findings from the kept text.
  Test "timeline reads MUSTs from the kept text after the scratch folder is deleted". Red on main: it prints "review file gone". R-1562's "gone" clause then narrows to lines with no kept text.
- M4. IF a LAND record that nana-land relies on carries a kept-text hash whose file is missing or hashes differently, THEN nana-land shall refuse the land, naming the item and revision.
  Test "land refuses a LAND whose kept review text is missing or altered" (delete one fixture, append a byte in another). Red on main: it lands.
- M5. WHEN nana-land lands, its success report shall name the kept text of every LAND record it relied on.
  Test "land success names the kept review texts". Red on main: no such lines. (Drop it if the owner takes the sweep.)
- M6. WHEN `review-ledger keep --item <slug> --into <dir>` runs, it shall write one file into `<dir>` for each kept text recorded for that item in the current repository and leave a same-named file holding the same bytes unchanged.
  Test "keep writes each kept review text of the item into the lane folder": two items, two repos. Only the named item from the named repo appears, and a second run changes nothing. Red on main: unknown subcommand, usage, exit 1.
- M7. IF a file in `<dir>` already holds different bytes under a name keep would write, THEN keep shall refuse and write no file.
  Test "keep refuses a differing file and writes nothing". Red on main: unknown subcommand.

## Tunables (one declared place each; ledger names stay in `ledgerPaths`)

- `review-ledger.texts` store folder. Chosen 2026-10-22: beside the tally, so one lock and one trust model cover the record and its text.
- `.md` kept extension. Chosen: reviews are markdown and open readable.
- sha256, full 64 hex. Contract value, row M1. Same family as the R-708 snapshot hash. Sealed by the M1 test.
- `KEEP_NAME_HASH_CHARS = 8`. Chosen: readable, and distinct within one item's few dozen records. Sealed by the M6 test.
- No size cap. Chosen, measured 2026-10-22: p95 8.5 KB and max 17.8 KB, about 0.2 to 1 MB a day. Revisit if a runaway output appears.

## Known limits

- No backfill. The tally is append-only and never rewritten, so old records stay dangling. The audit's `out` mapping will rotate away in any case.
- Done by the seat on 2026-10-22, outside the lane: a one-off copy of the 306 at-risk outputs the audit log names (286 in the macOS temp folder, 20 in a session scratch folder) into `~/.pi/agent/review-ledger.legacy-2026-10-22/`, with an index of original path, copy path and sha256. Nothing was moved or deleted.
- The final round's text is per machine and outside git. It is lost with the home folder, as the tally is. The store never shrinks, as the tally never does.
- Only recorded rounds are kept. A stalled, failed, cannot-start or non-review-shaped output is not kept.
- LAND records written before deploy carry no `text`. nana-land accepts them and notes "no kept text". Deploy with no review or land running (an existing README limit).
- If `keep` runs after the final round, its untracked files make `nana-land cleanup` refuse a dirty worktree. Run it only before the final round.
- Committed copies go public, like the 380 already there. `keep` reads only this repo's item, so other repos' reviews never land in nana-pi.

## Wrong-code pairs (seat runs them; each must turn a named test red)

1. `complete()` records the round but skips the store write → M1.
2. `complete()` keeps or parses the text re-read from the `out` path → M2.
3. The hash is taken over trimmed or BOM-stripped text instead of the raw bytes → M1 (bytes check).
4. nana-land ignores `text` → M4. 5. nana-land checks the file exists but not its hash → M4 (altered case).
6. The timeline still reads audit `out` first → M3. 7. keep overwrites a differing file → M7. 8. keep ignores `--repo`/item scope → M6.
9. The store path is derived from the reviewed tree (an in-tree store). Expected red: the existing "--revision <short> and --revision HEAD … (no new round)" or the two-worktree R-705 test. The seat confirms it turns red. If it does not, add one guard test.

Windows: no POSIX-only steps in tests (no chmod, no symlink creation). The Windows suite leg in CI proves the rows. The rail cannot tell which OS ran a test (an existing known bug).

## Threat model

Honest variation is in scope: a deleted scratch folder, two worktrees sharing one ledger (one store, content-addressed, under the lock), Windows paths (the record holds a hash, never a path), an output file missing or empty at record time (M2; an empty text is kept and still records the empty verdict), an over-cap round (kept like any other), and a re-run on the same revision (each record keeps its own text, one round). Deliberate forgery is out: anyone who can write `~/.pi/agent` can forge a text and its record, as the trust model already says for the tally.

## Interaction with claude-review-launcher

- That lane moves `claude-review.sh` into the product and calls `review-ledger run --out`. It gets keeping for free through `complete()` and should keep `--out` outside the reviewed tree.
- It must not write review texts into `docs/reviews/` inside the worktree itself. review-ledger run re-derives the revision in the real tree, so an in-tree write during a parallel review of the same tip voids that review as unverified.
- Both lanes touch `review-ledger.mjs` (here: the `complete()` call passes `{ text }`, plus the `keep` subcommand). Whichever lands second merges current main. Row IDs come from one counter, so claim them before either build.

## Touch list and docs

review-round.mjs (`complete`, `readVerdict` on text, `ledgerPaths`), review-ledger.mjs (`run` passes text; `keep`; header), pi-review.mjs (passes text), nana-land.mjs (check and report lines), review-timeline.mjs (+config). In the pack README: Review runner, Any other launcher, Land helper, Trust model (deleting a kept text makes land refuse), and the seat's `keep` step. In CAP-02: the kept text joins R-1008's deliverable, with new read-by lines `code: nana-land.mjs, review-timeline.mjs, review-ledger.mjs keep`. AGENTS working pattern: one clause in the land checklist ("run `review-ledger keep` into the lane folder with each fix and before the final round").
