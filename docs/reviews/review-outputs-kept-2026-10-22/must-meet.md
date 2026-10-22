# review-outputs-kept · must-meet (seat, 2026-10-22, after one adversary pass)

Feature: FEAT-007 · Review a specific revision independently

Class: install, hook or gate (it changes review-round, review-ledger, pi-review and nana-land). Ladder: the final reviewer, the land reviewer (the roster's land model), the seat's wrong-code pairs, one independent check. Builder: the larger builder. Threat model: honest variation in scope — a deleted scratch folder, two worktrees sharing one ledger, Windows paths, an output file missing or empty at record time, an over-cap round, a re-run on the same revision; deliberate forgery out (anyone who can write the agent folder can forge a text and its record, as the trust model already says for the tally).

Rulings: the owner, 2026-10-22, power mode — "Review tools" is the must slate. The owner, 2026-10-22, on the final round: **store** — every review text is kept by hash beside the ledger and named in its record; every round but the final one is also committed in the lane's review folder; the land checks the kept texts and names the final ones in its report.

The planner's draft (`plan-draft.md`) holds the measurements and the code paths: 416 recorded rounds, 117 pointing at deleted files, the other 299 only in temporary folders, none durable; the tally records no output path or hash; a missing output file at record time records an empty verdict that the land refuses for good. The seat copied the 306 at-risk outputs to a lasting folder on 2026-10-22, outside this lane.

## Seat decisions

- **D1 · Keep the text at record time, beside the tally.** `complete()` takes the text the launcher captured, reads the verdict from those exact bytes, and under the ledger lock writes them to `review-ledger.texts/<sha256>.md` beside the tally (temp file, then rename; an existing file must hold equal bytes) before it appends the tally line, which gains `text: { sha256, bytes }`. A failed write records nothing (no tally or audit line, `ok:false`, the output path named; adversary M3). pi-review and review-ledger run pass the text they already hold, and it wins over the output file, which may hold other bytes (M1). The kept bytes are the UTF-8 encoding of the captured string, hashed raw (no trim, BOM strip or line-ending change; S1). The temp file sits in the store folder (S2a); on win32 the rename retries on EPERM, EBUSY and EACCES with a local copy of the setup package's retry (S2b); an existing hash-named file with other bytes is corrupt and is replaced (S2c). Store files get mode 0600 and the same regular-file and no-symlink checks as the other ledger paths; readers skip names that are not 64 hex digits plus `.md` (N4). Unverified rounds keep their text in the same locked step (N2). The store path comes from `ledgerPaths`, which ignores `PI_CODING_AGENT_DIR` on purpose (N1). Beside the tally, not the git common dir: one lock and one trust model, and a re-clone does not orphan honest records.
- **D2 · `review-ledger keep` fills the lane folder.** `keep --item <slug> --into <dir> [--repo <path>]` copies every kept text of that item in this repository into `<dir>` as `r<round>-<role>-<sha8>.md`, skips a same-named file with equal bytes, and refuses before writing anything if a name holds different bytes. It reads the ledger through `os.homedir()` like `complete()` and the land, and exits 1 when the item has no kept text (S3). It checks every name before writing any (S5); names lowercase the role before sanitising and cap its length (N3). The seat runs it with each fix commit and once before the final round, never while a review of that worktree is live (S6). The land checklist clause goes into the shared working-pattern template and the regenerated AGENTS section (S7).
- **D3 · The land checks and names the kept texts (adversary M2, M4).** For each reviewed pair the land is given, it needs at least one matching verified LAND record whose kept text exists and hashes equal, or that predates the store (no `text` field). A matching LAND record whose kept text is missing, altered or malformed is named in a note, not a refusal, as long as another matching record holds. When none holds, the land refuses, naming the item, the revision and the recovery: re-run that review on the same revision, which adds a record with a fresh kept text. This is the seat's reading of the owner's "the land refuses if a kept text is missing or altered": the tally is append-only, so refusing on every matching record would block a revision for good. The success report names the kept text of each record it relied on. It also prints one note for each kept text of a reviewed item, recorded at an earlier revision, whose git blob id is not in the tip's tree, so a missed `keep` shows at the land instead of depending on a hand step (M4). The check runs inside the lock step through a review-round export (N6).
- **D4 · The timeline reads the kept text.** review-timeline reads MUST findings from the kept text when the tally line has a hash, and falls back to the audit log's path for old lines. R-1561's and R-1562's "recorded the file" and "gone" clauses narrow to lines with no kept text (S8); the header's inputs name the store. On a kept text, a verdict disagreement can only mean the two verdict parsers drifted, and the line says so (N7).
- **D5 · No backfill.** The tally is append-only; old records stay without a hash.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2568 | WHEN a review round is recorded, the ledger shall write the UTF-8 bytes of the review text its verdict was read from to the review store beside the tally, named by their sha256, and record that sha256 and byte count in the round's tally line. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2568: a recorded round keeps its review text by hash beside the tally` |
| R-2569 | IF the launcher's output file is missing or holds other bytes when a completed review is recorded, THEN the ledger shall read the verdict from, and keep, the text the launcher captured. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2569: a missing or different output file at record time still records and keeps the captured verdict` |
| R-2570 | WHEN the folder that held a recorded sent-back review's output file has been deleted, the review timeline shall list that review's MUST findings from the kept text. | `packages/nana-pack/tests/review-timeline.test.mjs::R-2570: the timeline reads MUST findings from the kept text after the scratch folder is deleted` |
| R-2571 | IF no verified LAND record matching a reviewed pair has a kept text that exists and hashes equal, or predates the store, THEN nana-land shall refuse the land, naming the item, the revision and the re-run that recovers it. | `packages/nana-pack/tests/land.test.mjs::R-2571: the land refuses a revision whose matching LAND records all have missing or altered kept texts` |
| R-2572 | WHEN nana-land lands, its success report shall name the kept text of every LAND record it relied on. | `packages/nana-pack/tests/land.test.mjs::R-2572: a land's success report names the kept review texts` |
| R-2573 | WHEN `review-ledger keep --item <slug> --into <dir>` runs, it shall write one file into the folder for each kept text recorded for that item in the current repository, and leave a same-named file holding the same bytes unchanged. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2573: keep writes each kept review text of the item into the lane folder` |
| R-2574 | IF a file in the folder already holds different bytes under a name keep would write, THEN keep shall refuse and write no file. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2574: keep refuses a differing file and writes nothing` |
| R-2575 | IF the review store cannot be written, THEN the ledger shall record no round and report the failure naming the output path. | `packages/nana-pack/tests/review-ledger.test.mjs::R-2575: a failed store write records no round` |
| R-2576 | WHEN nana-land lands, it shall print one note for each kept text of a reviewed item, recorded at an earlier revision, whose git blob id is not in the tip's tree. | `packages/nana-pack/tests/land.test.mjs::R-2576: a land notes each earlier kept review text missing from the tip` |

### What each test does, and why it is red on main

The planner's draft lists each base test under M1 to M7 (R-2568 to R-2574); the adversary's attack (`plan-attack.md`) adds cases.
- **R-2568.** A stub reviewer prints a known text holding a byte-order mark, CRLF line endings, trailing blank lines and a non-ASCII character; the tally's sha256 equals the hash of the UTF-8 bytes and the stored file holds them. A second review with a different text on the same revision: one round, two kept texts. A run with TMPDIR, TEMP and TMP pointing at a missing folder still keeps its text. It pins sha256, 64 hex.
- **R-2569.** `complete()` with a deleted output path, then with an output file holding another review's bytes, each with a captured text ending `VERDICT: LAND`: the verdict and the kept bytes come from the captured text.
- **R-2570.** A sent-back review recorded, its folder deleted: the timeline lists its MUST lines from the kept text.
- **R-2571.** Two matching LAND records on one revision: one kept text intact and one deleted lands, with a note naming the deleted one; both deleted refuses, naming the re-run; one altered by a byte and none other refuses; a record with no `text` field lands with a note; a malformed `text` field counts as missing.
- **R-2572.** A land's success report names each relied-on kept file.
- **R-2573.** Two items in two repositories: only the named item from the named repository appears; a second run changes nothing; an item with no kept text exits 1.
- **R-2574.** The differing file sits under the last name keep would write; no file is written.
- **R-2575.** The store folder's path is a regular file: no tally or audit line, `ok:false`, the output path named.
- **R-2576.** A sent-back round's kept text missing from the tip tree gives one note; after `keep` and a commit, none.

Red on main: no store, no `text` field, the path parsed as the verdict, "review file gone" in the timeline, lands that ignore texts, an unknown `keep` subcommand, and no notes.

## Tunables (one declared place each; the ledger's names stay in `ledgerPaths`)

- `review-ledger.texts` store folder — chosen 2026-10-22: beside the tally, one lock and one trust model.
- `.md` kept extension — chosen: reviews are Markdown and open readable.
- sha256, full 64 hex — contract, R-2568; the same family as the snapshot hash. Sealed by R-2568's test.
- `KEEP_NAME_HASH_CHARS` 8 — chosen: readable and distinct within one item's records. Sealed by R-2573's test.
- No size cap — chosen, measured 2026-10-22: p95 8.5 KB, max 17.8 KB, about 0.2 to 1 MB a day.

## Known limits (carried to FEAT-007's known-bug file)

- No backfill: old records stay without a kept text; the audit log's paths rotate away.
- The final round's text lives on this machine, outside git, and is lost with the home folder, as the tally is. The store never shrinks.
- Only recorded rounds are kept; a stalled, failed, cannot-start or non-review output is not.
- LAND records written before deploy carry no hash; the land notes it.
- `keep` run after the final round leaves untracked files that make cleanup refuse a dirty worktree; run it before the final round.
- Committed copies go public, like the 380 already in lane folders; `keep` reads only this repository's item.
- Pruning the store blocks every revision whose matching LAND records all lose their texts, until those reviews re-run; the Trust model says so.
- `keep` into a worktree during a live review of it makes that review unverified; the checklist says to run it before the final round only.
- Only the CI suite's Windows leg proves the store write on Windows; the install check does not yet compare the kept text (attack S9).

## Seat steps

- Builds with the larger builder. Wrong-code pairs: the planner's nine (record without the store write; the text re-read from the output path; the hash over trimmed or BOM-stripped text; the land ignores `text`; the land checks existence but not the hash; the timeline reads the audit path first; keep overwrites a differing file; keep ignores the repository or item scope; a store under the reviewed tree) and the adversary's seven (an existing output file preferred; only the first matching LAND checked; the tally appended before the store write, or kept on a failed write; a malformed `text` treated as legacy; keep checking names as it writes; the hash after CRLF normalising; the temp file in the system temp folder).
- One independent check runs real review rounds and a real land in scratch clones with a temp agent folder.
- CI on the draft PR, the Windows leg included.
- Cross-lane: claude-review-launcher also edits `review-ledger.mjs`; whichever lands second merges main and reruns both lanes' tests.
