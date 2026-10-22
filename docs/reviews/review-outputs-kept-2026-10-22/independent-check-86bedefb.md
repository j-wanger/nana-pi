# review-outputs-kept: independent check (2026-10-22)

Lane tip checked: 86bedefb ("tests: isolate kept-text review fixture"), one commit past e574397a. I cloned it into a scratch folder, S=$TMPDIR/ro-check.iwnkhv.
Every run used HOME=USERPROFILE=$S/home (store-failure run: $S/home2; real-tally copy: $S/home3). I wrote nothing to the real ~/.pi/agent, ~/.claude, nana-pi or the worktrees, and `git status` in nana-pi was still clean at the end.
RL = repo/packages/nana-pack/bin/review-ledger.mjs, NL = .../nana-land.mjs. Scratch repo `proj` (main) with worktree wt1 on feat/x, and wt2 detached.
Fake reviewer `rev.mjs <VERDICT> <tag>` prints a BOM, CRLF lines, "café", a `- MUST — ...` line on SEND-BACK, then a plain `VERDICT:` line.

## Steps (command, exit, key output)

1. SEND-BACK at A (f193ae52): `node $RL run --item lane-x --tree wt1 --role reviewer --out out/r1.md -- node rev.mjs SEND-BACK r1`. Exit 0, "admitted as round 1/3".
   The tally line has `"text":{"sha256":"1ac88c04…","bytes":80}`. The store file is mode 0600 and starts `efbbbf`. It matches the reviewer's raw stdout byte for byte (cmp, shasum). The BOM and CRLF were kept.
2. Re-run on the same revision, then delete the output: roles `second` and `third`, each with `--out` in a folder I deleted (`rm -rf`) right after the run. Exit 0 both times, "revision already counted — no new round".
   Result: 3 tally lines, 3 kept texts. `review-timeline --item lane-x` exits 0 and lists `MUST — fix the thing (r1c)` from the kept text.
   The first two texts show "(no MUST readable)" only because my early fake used `MUST:`, which the existing title parser does not read. That is not a lane defect.
3. keep, twice: `node $RL keep --item lane-x --into docs/reviews/lane-x`. Exit 0, "kept 3 review text(s)", with files `r1-reviewer-1ac88c04.md`, `r1-second-22324d19.md` and `r1-third-873ada4e.md`. The second run exits 0 and leaves the mtimes unchanged.
   `keep --item nope`: exit 1, "has no kept text". A differing file under the last name: exit 1, "holds different bytes; wrote nothing", and the folder still holds only that file.
   Later, keep into a folder holding the r1 copies (exit 0) wrote r2/r3 files and left the r1 files byte-equal. keep run from a worktree of another repository: exit 1.
4. Commit B (fix plus the kept r1 files). Two concurrent LAND rounds, from wt1 (role reviewer) and wt2 (role land), each with a 2.5 s reviewer, run in parallel: exit 0 for both.
   One run printed "1 review(s) in flight … revision already counted". The `report` shows both LAND rows at 77440785, with two distinct kept texts. No reservation was left over.
5. Commit C (keep not re-run). LAND at C: exit 0, "admitted as round 3/3", kept text 69a8bc15.
6. Real land: `node $NL merge --tree wt1 --main proj --suite true --reviewed b9797247…=lane-x`. Exit 0, main fast-forwarded to C. Output:
   `[nana-land] note: earlier kept review text 6d84d2e1….md for item lane-x is not in the tip's tree` (and the same for a8b2d01d, the two B texts never kept).
   `review text relied on: 69a8bc15….md`. The three A texts were committed in the tip, and the land gave no note for them.
7. Corruption: I reset scratch main to base and changed one byte of 69a8bc15's kept text, same length. The land exits 1:
   `refused: item lane-x at revision b979724788317d33f901d9bdfa9ca63ea8ea6694 has no matching verified LAND record with an intact kept text or a pre-store record; re-run that review on the same revision to recover it`. Main did not move.
   With the file deleted: the same refusal, exit 1.
8. Recovery: re-run the review at C, at the cap: exit 0, "admitted as round 3/3 (revision already counted — no new round)". The land then exits 0, main moves to C. Output:
   `[nana-land] note: altered kept review text 69a8bc15….md for item lane-x at revision b979…`, plus the two B notes and `review text relied on: 28ab2694….md`.
9. Same-bytes recovery: I overwrote all three C texts with junk; the land refuses, exit 1. A re-run whose output has the same bytes as 28ab2694 replaced the corrupt file (its hash checks again, no .tmp left behind). The land then exits 0 relying on 28ab2694, deduped to one line, with altered notes for the other two.
10. pi-review with a fake `pi` first on PATH (`pi-review --out out/pr.md --item lane-x --tree wt1 --role sol --retries 0 -- -p review`): exit 0, SUCCESS. The tally line shows `launcher: pi-review` and `text.sha256 553ec50a…`, and that equals the shasum of out/pr.md.
11. Failed store write (home2, store folder mode 0555): `run` exits 1 with "review written to …/out/z.md, but review ledger: EACCES … (output kept at …/out/z.md)". It wrote no tally or audit file. The reservation file stays, but its process has exited, so the next run reads "0 review(s) in flight" and records round 1 normally once the folder is writable.
12. Old tally line: in proj2 I recorded a LAND, then deleted its `text` field from the tally line. The land exits 0 with `[nana-land] note: pre-store LAND record has no kept text for item lane-old at revision 10d4fcae…`.
    With `"text":"bogus"` (malformed) the land refuses, exit 1, with the same recovery message. That is the plan's "malformed counts as missing".
13. A copy of the real tally (1105 lines, none with `text`) in home3: `review-timeline` for report-deliverables and for suite-records exits 0. suite-records r1 still lists its MUST through the audit-path fallback, and the LAND round prints the same as main's timeline. `check` exits 0 and projects round 2/3.
14. nana-pi's `.gitattributes` holds `* text=auto eol=lf`. I tested that rule on a CRLF kept text: `git hash-object <store file>` gives the same blob id as the committed (LF-normalised) copy. So step 6's "not in the tip" note does not fire falsely for CRLF reviews in this repository.

## Non-material observations (not blocking)

- `keep` skips a damaged (altered or missing) kept text without saying so. Its "kept N" count includes files already present. The land still notes damaged texts, so nothing is lost silently at the land.
- The refusal names the item, the revision and the re-run, but not which kept file is damaged. The notes name the file only on a passing land.
- A failed store write leaves its reservation file on disk until it is pruned. The dead process means it holds no round.
- Not covered here: Windows (rename retry, CRLF from a Windows reviewer) and a live review racing `keep`; the plan lists the latter as a known limit.

Verdict: no material finding
