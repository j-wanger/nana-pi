# brief-reader-fixes: plan attack (adversary, 2026-10-22, main 61ac64f3)

Counts: 3 M, 8 S, 8 N.

Method: read-only against main 61ac64f3. I ran the pure reader with node and a temp HOME. I ran in-memory copies of the scanner, with no file written. I scanned the 388 tracked files under docs/reviews whose name starts `build-brief` or `sol-build-brief`, and every tracked Markdown file for headings and labels. I ran no test, no pi-worker and no brief-check. Anything I did not run is marked inferred.

Checked and holding: the plan's own Precedent section reads 15 entries, all tracked at HEAD, Feature FEAT-006, through `readBrief` plus `git --literal-pathspecs ls-tree`. Every line reference I opened matches: markdown-list-sections.mjs:40 and :49-56, brief-precedent.mjs:30-33, :43 and :79, frontier-config.mjs:26-32, brief-check.mjs:31 and :36, worker-lane.test.mjs:83, :143-181 and :183-219, frontier.test.mjs:101 with legacy.md:15-17. The 37 unindented lines directly after a list item match my count exactly. R-2616 to R-2622 are unused on main; ci-timing-records' draft uses R-2631 to R-2638.

## M (must change the plan)

### M1. D1's kind boundary ignores indentation, so a nested sub-list ends the section and later entries pass unchecked

D1 says "a list item of the other kind ends the section". It sets no indentation condition. The scanner's `LIST_ITEM` (markdown-list-sections.mjs:10) matches indented items. So a nested bullet under a numbered entry counts as "the other kind".

Measured with an in-memory copy of the scanner. The naive version is D1 as written. The indent-aware version ends the section only at an item at or left of the first entry's indentation.

| Brief text under `Precedent:` | main | D1 as written | indent-aware D1 |
|---|---|---|---|
| `1. seed — reuse:` / `   - the parser` / `2. missing.mjs` | refuses "the", "missing.mjs" | entries [seed]: **passes, N 1, missing.mjs unchecked** | refuses "the", "missing.mjs" |
| `- seed — reuse:` / `  1. the parser` / `- missing.mjs` | refuses "the", "missing.mjs" | entries [seed]: **passes, N 1** | refuses "the", "missing.mjs" |
| R-2616's two planned pass cases | refuse "Run" | pass | pass |

This is an honest shape. Of 900 no-blank-line lists in the 388 build briefs, 116 hold a nested item of the other kind. Under the naive rule all 116 would be cut, nearly all at a nested item. Under the indent-aware rule 1 would be cut (win-claude-hooks-2026-10-17/build-brief-2.md:7, a real top-level switch). None of the six tracked Precedent sections nests yet. Its use inside a Precedent list is inferred from the general brief style.

Neither planned R-2616 case can tell the two versions apart, so a builder could ship the naive one green. Main refuses this brief; the naive D1 passes it. That breaks the plan's own stakes claim that every change "refuses more".

Change:
- D1: "a list item of the other kind whose indentation is at most the first entry's ends the section; a more indented item stays an entry, read as on main."
- Add an R-2616 guard: `Precedent:\n1. seed — reuse:\n   - the parser\n2. missing.mjs\n` exits 1 and names `"missing.mjs"`.
- Add the mirror: `Precedent:\n- seed — reuse:\n  1. the parser\n- missing.mjs\n` refuses naming `"missing.mjs"`.
- Add a pair: "the kind boundary ignores indentation", turning the nested guards red.
- Add a known limit for the nested-item refusal (see S7).

### M2. The most common honest trailing mark, a colon, is still refused by name

`- seed: the reader` reads as path `seed:` on main. It is refused with `"seed:" is not tracked at HEAD; commit the file, or merge main`. That is note 3's wrong-fix message. ``- `seed`: the reader`` gives the same result, and `- seed:12: note` gives `"seed:12:"` (all measured with `readBrief`).

The colon is not in `PRECEDENT_TRAILING_PUNCTUATION` (",;.)", brief-config.mjs:16). `LINE_SUFFIX` needs digits.

Measured: I took list entries in the 388 build briefs whose first token looks like a path, after removing `**` and backticks. A trailing `:` follows 263 such entries, in 110 briefs. A trailing `,` follows 106 entries in 72 briefs, `.` 8, `;` 1. No mark follows 120. So the colon is the most frequent mark. The sealed provenance ("77 of 378 … put one of these marks") never counted it.

The six tracked Precedent sections all use ` — `. The colon's use inside a Precedent list is therefore inferred. But the plan's threat model names honest entry spellings, and this one costs one character.

Change:
- Retune `PRECEDENT_TRAILING_PUNCTUATION` to `,;.):`. Its provenance becomes "measured: 263 list entries in 110 of 388 tracked build briefs end a path-like first token with `:`; 106 in 72 with `,` (2026-10-22, the adversary)".
- Update the seal check at worker-lane.test.mjs:250-255, which pins `",;.)"`. The Tunables section changes from "None new" to "one sealed value retuned".
- Strip the run of marks before `LINE_SUFFIX`, as D4 already orders it. Then `seed:12:` becomes `seed:12`, then `seed`.
- Add a pass case for `- seed: the reader` and ``- `seed`: the reader`` (N 1 each), under R-2619 or, if the seat wants a separate row, R-2622: "WHEN a Precedent entry's path is followed by a colon, pi-worker shall check the path without it."
- Add a pair: "the colon is not stripped".

### M3. D6 breaks brief-check's match with pi-worker for the same `--brief` string

pi-worker resolves `--brief` from its cwd, which must be the worktree root (pi-worker.mjs:90, :93, :96: `path.resolve(cwd, brief)`). brief-check on main resolves it from `--tree` (brief-check.mjs:36). That is the same base by construction. So for the same `--brief` and worktree, both commands read the same file wherever brief-check runs. That is R-2585's promise: "the refusal or the launch line pi-worker prints for that brief and worktree".

D6 makes brief-check resolve from its own cwd. That keeps the match only when brief-check runs from the worktree root.

The documented use is in AGENTS.md's Larger-lanes bullet: the seat runs brief-check with `--tree <worktree>` before it starts a Claude Code subagent. The seat sits in the main checkout (inferred from this repo's seat setup). Recorded seat launches pass pi-worker a worktree-relative `docs/reviews/<lane>/…` brief 473 times. I counted this in this machine's seat transcripts and scratchpad; the next largest forms are placeholders and shell variables. A lane's brief is committed on its branch, so it is not on main until the land.

With D6, the seat's natural call from main, `--brief docs/reviews/<lane>/build-brief-1.md --tree <worktree>`, reads the main checkout's path. That path does not exist, so the call fails with `cannot read Precedent section from brief`, which names no path. The plan defers naming the path ("later"). Every recorded brief-check run so far had cwd equal to `--tree` or an absolute brief, so nothing recorded breaks today (measured). The harm is to the documented flow and to R-2585's match.

The note's own complaint was "The README does not say so".

Change:
- Flip open question 3's default to **yes**: keep the `--tree` base.
- Drop D6.
- Replace R-2621 with: "IF brief-check cannot read its brief, THEN it shall exit 1 naming the absolute path it tried and that a relative `--brief` resolves from `--tree`."
  - Precedent: brief-check.mjs:31-35, its own `brief-check:` line for an unreadable worktree.
  - The new line starts `brief-check:`, so R-2585's selected `pi-worker:` line is untouched.
  - Test: run from the fixture temp folder with `--brief passing.md --tree <lane>`. It exits 1 and stderr holds `<real lane>/passing.md`. It is red on main, because main's text names no path.
- D7 says the same in the README's brief-check paragraph.
- Pair: "brief-check refuses without the path".
- This also removes the D8 "naming the attempted path" exclusion and the matching known limit.
- If the seat keeps D6 instead, see S1.

## S (should)

### S1. If D6 stays, R-2621 cannot tell D6 from a tree-then-cwd fallback

R-2621 first asserts that `<lane>/passing.md` does not exist. So a brief-check that tries `--tree` first and falls back to the working folder also passes. That fallback silently reads one of two files. Add a case where both files exist and differ. Write a refusing brief (`Precedent:\n- missing.mjs\n`) at `<lane>/passing.md`, untracked, removed afterwards. Keep the passing brief in the temp folder. Expect exit 0 and the launch line. Add the pair "tries `--tree`, then the working folder".

### S2. D3's new text also replaces the refusal for an empty section and a reasonless `none:`

brief-precedent.mjs:78-79 is one refusal for three cases: no section, an empty section, and an entry that is `none:` with no reason. D3 calls it "the no-section refusal". If the builder edits :79 as planned, R-2578's `## Precedent\n\n## Done\n` would be told it "needs a Precedent heading". It already has one.

Change: say in D3 that only `precedent === null` gets the new text, and the other two keep today's text. R-2578's substrings hold either way.

### S3. Subtract the Markdown-link reading from D4; nothing honest writes it

Measured:
- The 388 build briefs hold 0 Markdown links.
- All 2,111 tracked review records hold 14 link-shaped matches. Only 3 are real file links, and all 3 are relative to the document's folder (writing-trial-2026-10-04/tally.md: `[after.md](after.md)`). None is relative to the repo root.
- D4 checks a target from the worktree root, so the one honest link style still gets refused.

The link branch adds two pairs (9, 10), three R-2619 cases and a known limit for a form with no measured use.

Change: drop the link clause, keep links refused by name, and carry one known-bug line. If the seat keeps it, the plan should state the 0-of-388 figure.

### S4. D2's rule as written does not produce `**Precedent**:`, and it misses the nearest precedent

"A trimmed line equal to the label after one wrapping `**…**` is removed" covers `**Precedent:**`. It does not cover `**Precedent**:`, which ends in `:`, not `**`.

Change: name the exact accepted set, built from `PRECEDENT_SECTION`: `Precedent:`, `**Precedent:**`, `**Precedent**:`. Add to Precedent:
- packages/nana-pack/lib/review-findings.mjs — `BARE_MUST_BOLD_RE` (:18), a whole line holding only a bold config word, built with `new RegExp` from the config value; and `isLabel` (:23), a bold text ending in `:` read as a label.

### S5. R-2616's row is wider than its tests

The row says "follows … with no blank line between". Both pass cases put a label line (`Steps:`, `Then:`) between the lists. Add `Precedent:\n- seed\n1. Run the next step\n`, which passes with N 1. It is red on main, which names "Run".

### S6. D4 promises `**` removal before the `none:` check, but no case pins it

D4 says `**` goes "before the none check". If a builder strips it after the check, `- **none:** no earlier code` becomes path `none:` and is refused. No planned case catches that. Add `Precedent:\n- **none:** no earlier code exists\n` (N 1) to R-2619, with the pair "bold removed after the none check". Otherwise drop the promise and list the limit.

### S7. Two known limits are missing

1. With M1's rule, a nested sub-list item is still read as an entry and refused by its first word. Main does this too (measured: `"the"`), and 116 of 900 brief lists nest. Write it as one line.
2. A `## Precedent:` heading reads as no section, because `isNamed` accepts only whitespace, `(` or `—` after the name (frontier-config.mjs:31). Measured with `readBrief`: no section. D3's new refusal then tells that seat it needs "a Precedent heading". The repo holds 0 colon headings in build briefs, so list it rather than fix it.

### S8. The stakes sentence overclaims

"Every change below is either a new honest form that now reads correctly, or a narrowing that refuses more." Three parts of the plan contradict it:
- D1 drops the items after a top-level kind switch unchecked. The plan's own second known limit says so, and M1 shows a worse case.
- D4's run strip turns `- tracked/..` from refused on main (as `"tracked/."`) into a pass of folder `tracked/`, because the run eats both dots. The main side is measured; the D4 side is inferred from D4's stated order (see N4).
- D6 changes which file is read.

Change: restate the stakes to name D1 as a deliberate loosening, with Markdown's rendering as the reason.

## N (note)

- **N1.** D1 departs from CommonMark. In CommonMark, a change of bullet character (`-` to `*`) or of ordered delimiter (`.` to `)`) also starts a new list. D1 keeps those together, and the R-2616 guard pins it. That is a sound fail-closed choice. But "read as Markdown renders it" (D1) and "a change of bullet character keeps the list whole" should say this is a departure. Pair 4 is the CommonMark-faithful version.
- **N2.** The pair-runner precedent is packages/nana-pack/lib/mutation-runner.mjs (`runMutations`). docs/reviews/precedent-first-2026-10-22/seat-mutate.mjs is the per-lane pairs-file shape over it. Name both. "Copy" here means a new pairs file, not a second runner.
- **N3.** Run-stripping has no measured case. 0 path-like first tokens in the 388 build briefs end in two or more of `,;.)`. The reviewer's `path:93-100).` is hypothetical. It is cheap, so keep it, but call it "chosen", not measured.
- **N4.** Fix for the `..` in S8: run the `..` segment check on the value before the mark strip as well as after it. Then a `..` the strip ate stays refused. It is out of the threat model, since no honest brief writes `x/..`, so this is optional.
- **N5.** Two things the plan fixes have no measured use, though both fixes are cheap:
  - the bold label: 0 lines holding only `**Precedent:**` or `**Precedent**:` in all tracked Markdown;
  - the prose heading: 0 headings titled Precedent plus a word.
  The two tracked Precedent headings are the bracketed ones the plan names.
- **N6.** Lane class ordinary is confirmed.
  - markdown-list-sections.mjs reaches nana-frontier and scripts/product-report.mjs through handoff-asks, on the heading path only.
  - No Claude Code hook under packages/nana-setup/claude/hooks and no pi extension imports a changed module (git grep). The only hits are bench study fixtures.
  - nana-setup puts pi-worker on PATH (packages/nana-setup/lib/steps.mjs:85, :91), but its source is unchanged.
- **N7.** Measurement delta, not material. Over the 388 files, I count 691 indented non-list lines directly after a list item, against the plan's 657 over 378. The 37 unindented lines match exactly. The difference is the file set and the method.
- **N8.** Pair budget. M1 adds 1 pair and M2 adds 1. M3 replaces pair 14 with one, and S6 adds 1. If S3 drops pairs 9 and 10, the total is 15, inside the 8-to-15 range. Every new case uses `runBriefText` and the existing fixture (tracked `seed`, `tracked/nested.mjs`), so Windows and CRLF need no new fixture. The worker-lane file already runs CRLF and BOM through the same path.
