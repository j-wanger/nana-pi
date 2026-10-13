# Fact-check (repo claims) — CHANGE.md, lane `process`, main 9974218, 2026-10-13

Method: read code at main (read-only), ran read-only probes in this folder (`fc-claims.mjs`, `fc-verdict.mjs`,
re-ran `reparse.mjs` against the user ledger), counted rows and shalls. No repo edits; one accidental
`node scripts/test.mjs --help` started the suite and died on SIGPIPE after 3 files (repo `git status` clean after).

## WRONG

1. **R-1109 carries two `shall`s** ("shall define a MUST … and shall limit a confirmation round"). The trace rail
   counts whole-word `shall` per row with `EARS_ALLOWANCE = 0` (`scripts/requirements-trace.mjs:52`,
   `templates/typescript/template/tests/requirements-trace.ts:27-32`), so the row is an off-form problem line and
   `requirements-trace.test.mjs` goes red. Split it (MUST definition / delta rule) or rephrase to one shall. All
   other 16 rows count exactly one.
2. **`// req: R-719` on "review round cap is sealed at three" while R-719 "stays untested"** breaks the rail:
   `rowProblems` flags any `untested` row a marker traces ("set status to implemented",
   `requirements-trace.ts:429-432`). Also a duplicate: `review-round.test.mjs:21` already has
   `check("cap is 3", REVIEW_ROUND_CAP === 3)` (unmarked), which S10 already turns red. Either keep the old
   check unmarked and cite it in S10, or flip R-719 (it cannot: per-item is unpinned).
3. **Blank `--over-cap` never prints the standard reason.** Acceptance says round 4 "refuses free text, the
   short form and blank, each printing the standard text". A blank (or flag-shaped) value throws in `optValue`
   (`review-round.mjs:123-130`) inside `parseReview`, before `decide()`; the message is
   `review ledger: --over-cap needs a value, got "  "…` (pinned by `review-ledger.test.mjs:650-652`). The plan
   changes only `REFUSE` and the new wrong-reason path, and keeps optValue (R-720 note). Drop "blank" from the
   acceptance line or scope R-1113 to "a refusal from decide()".
4. **§3.5 vs `builder-preamble.proposed.md`.** §3.5 says the seat-script and test-deletion rules are "split onto
   two lines so each rule owns one line"; the proposed file keeps them on ONE line ("No suite test runs, imports
   or copies a seat script. Never delete a test your brief does not name."). Deleting that line reds two R-1115
   titles. (`builder-preamble.diff` is also stale: it lacks the `- ` bullets the proposed file has.)
5. **"Each mutation … turns only the named title red" is false for several pairs.**
   - Any edit to the shared file alone (R-1100–R-1105 deletions, R-1112 quote edit, S1) also reds
     R-859 "AGENTS.md marker-owned section is byte-identical to the shared file"; S9 edits `AGENTS.md`
     (land.test.mjs:503 reads AGENTS.md, not the shared file) and also reds R-859. Mutations must hit both copies.
   - R-1114 "install subsection inside the markers" reds R-859 too (or, if also put in the shared file, R-598).
   - R-1106 "move ahead of the immutable sentence": the fake pi in `immutable-review.test.mjs:24-25` writes
     `"$*"` and the test splits on `\n`; the 3-line standard before the immutable sentence pushes it off
     `observed[3]`, so S2's title (`:89`, `:108`) goes red too.
   - R-1107 "pass the path" also reds R-1106 (the child gets a path, not the text).
   - R-1110 "any-reason admission" also reds R-1113 (no refusal, nothing printed).
   - R-1111 "drop 'or a merge of current main' (only R-1111 red)" holds only if R-1112 checks a bare substring;
     a byte-for-byte (backtick-delimited) quote check — what R-1112 says — goes red too.
6. **Citation:** "pi repeats the flag and joins parts with a blank line (`cli.md:219`)". `cli.md:219-220` says only
   "Appends text or an existing file … and is repeatable". The `"\n\n"` join is
   `dist/core/agent-session.js:1243`. Behaviour claim true, cite wrong.

## GAP

7. **R-1107 "read after admit()" mutation survives the stated observables.** On a throw after `admit()`,
   pi-review's catch calls `release()` (`pi-review.mjs:199`), which only unlinks the reservation
   (`review-round.mjs:677-680`); under the cap admit writes no audit line and no tally. So "no tally, reservation
   or audit line" all hold under the mutation. The test must also assert that `~/.pi/agent/` (or
   `review-ledger.reservations/`) was not created (`withLock`→`ensureDir(p.dir)`, `admit`→`ensureDir(p.resDir)`)
   and that stderr has no "admitted as round" note.
8. **R-1107's "unreadable" clause has no test** (only missing and blank). A mutation that catches only ENOENT
   survives. Add a directory-at-path or chmod-000 case (POSIX only) or narrow the row.
9. **R-1104 has three clauses across two shared sentences; the shared text has seven sentences but §5 lists five
   deletions.** The sentence "`pi-review` gives every reviewer the review standard, so briefs state the threat
   model and lane class but not the bar" maps to no row and no pin. It also overclaims for `review-ledger run`
   reviewers, whose briefs must paste the bar (§6 item 9).
10. **Contract not declared where consumers read it.** The plan edits pack README only at `:127-131`, `:231`
    (over-cap). Nothing adds the review-standard file or the new exit-1 refusal to the pack README, or to
    pi-review's six-tag header (`@inputs` and `@errors`, `pi-review.mjs:2-14`). The `@errors` line currently
    lists only admission, stall and record failures (CLAUDE.md rule: "Contract changes are declared where the
    consumer reads them").
11. **"Each watchdog attempt sees the standard once"** is unpinned. The R-1106 test runs `--retries 0`
    (`immutable-review.test.mjs:81`). A per-attempt append survives it. Low risk: `runOnce` copies `piArgs`
    (`pi-watchdog.mjs:104`).
12. **No-inline-tunables.** The `'../prompts/review-standard.md'` path inlined in pi-review follows the pi-worker
    precedent (`pi-worker.mjs:92`), but the house rule lists paths as tunables. Name it, or record the exemption.

## UNVERIFIED (not checked or only partly checked)

13. "68 build briefs in 13 lanes re-paste rules 7–18": 13 lanes confirmed. My loose filename filter found 79
    build-brief files, so 68 was not reproduced.
14. §3.7 timings (725/880/580/746 s), "four files take 53%", "seven desk tests probe a port and bind later": I did
    not re-measure them. `ic-suite-sorted.txt` shows review-ledger at 199.6 s, consistent with the 137–200 s claim.
15. "README step 8 then ends at `all good`" stays INFERRED, as CHANGE marks it. `restore.test.mjs:157` pins it
    only for a restored home.

## CONFIRMED (spot list)

- IDs R-1100–R-1119 are free on main and on every local and remote branch. The highest ID is R-1092.
  `REQUIREMENTS.md` has 1,088 rows, retired ones included. So 1,088+17=1,105 and 1,088+15=1,103 hold.
  Retiring R-720 does not change the count. `requirements-tree.test.mjs:38,52,53` hold the 1,088 literal.
- Placement anchors are correct:
  - R-683 sits in SUB-019.
  - R-974 sits in SUB-008.
  - R-720 sits in SUB-007.
  - R-981 sits in FEAT-008.
  - R-628 sits in FEAT-006.
  - R-951 sits in SUB-011.
- `pi-review.mjs:177` is the only `--append-system-prompt`.
- `review-round.mjs:113-116` is `roundCapVerdict`.
- `REFUSE` is at `review-round.mjs:556-557`.
- `admit()` writes the override audit line before the reservation, at `:570-575`.
  So a refusal placed right after `decide()` spends nothing.
- Both launchers call `admit()`: `review-ledger.mjs:79` and `pi-review.mjs:168`.
- `resource-loader.js:100-114` returns a missing path as literal text and gives no warning, on pi 1.0.2.
- `review-ledger.test.mjs:614,654-659,978,1003-1013` and `nana-agent-loop/app/tests/review-round.test.ts:42` are as described.
- Pack README `:127-131` and `:231` both say `"<what changed>"`.
- Ledger counts reproduced exactly:
  - over-cap reasons: nana-pi 79 (64 free text, 10 short form, 5 standard), yokai-world 16 (all short form), trading-zone 17 (all standard);
  - empty verdicts: 19/172, 7/137 and 8/169;
  - recorded LAND-WITH-FIXES: nana-pi 18, yokai-world 41.
- `verdictWord` behaves as §3.3 says:
  - it reads a last-line LAND, a LAND with a score, and SEND-BACK;
  - it accepts an identical first and last line;
  - it returns null for a yokai LAND-WITH-FIXES first line against a SEND-BACK last line;
  - "verdict" in the review body is harmless when the verdict is on the last line.
- `reviewShaped` accepts a last-line VERDICT.
- The proposed shared text plus the item-1 sentence passes the checkout path, command and flag checks of
  `judgeClaims`.
- Word counts are 133 and 159. The preamble has 33 lines.
- The preamble has stayed at 18 lines since `df6372f` (10-08).
- `eb937f8` (10-10) added the standard reason to the shared file.
- `AGENTS.md` carries its markers at lines 68 and 97, and `CLAUDE.md` is a symlink to `AGENTS.md`.
- The checkout has no `OBJECTIVE.md`.
- `template:accept` renders under `mkdtemp`.
- Doctor's trust `!` row is at `lib/doctor.mjs:451-457`, and `NOT verified` with exit 1 is at `nana-setup.mjs:332-335`.
- `nana-setup trust` prompts `[y/N]` and takes `--yes`.
- `.pi/nana-pack.json` is tracked.
- Install-check runs doctor with `cwd: project` (`lib/install-check.mjs:295`).
- `scripts/test.mjs` has 419 lines, its serial loop at `:350-399`, and 138 files.
- Port 4391 is at `origin-rule.test.mjs:17`.
- The time bounds are at:
  - `hook.test.mjs:200` and `:339`;
  - `test-locked.test.mjs:103`;
  - `bounded-read.test.mjs:37`.
- Land and CI gates are at `nana-land.mjs:104-106` and `ci.yml:70`.
- The tests named in S1–S9 exist and assert what is claimed. S10 also turns `cap is 3` red.
- `~/.local/bin/pi-review` is a symlink into the main checkout, so `import.meta.url` resolves to the real `bin/`.
- The 10-12 install-check ruling is item 5 of `feedback_lane_process_2026_10_11.md`.
