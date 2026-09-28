# Worker brief — T2a fix round 2 (Opus 5.5), after sol r1 BLOCK

Worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective` (HEAD `1fac281`). Read `t2a-sol-r1.md` whole.

## SEAT RULING — narrow the injection surface structurally, whichever way the trust question is settled
sol's HIGH #1 rests on a fact the seat did not have when it framed the options for Jake: `lib/objective.ts:160-162` falls back to injecting **the first 4000 characters of the file verbatim** when it finds no `**Objective` line. That is not "an objective line states intent" — it is arbitrary attacker-authored text entering the system prompt.

**Required, regardless of how Jake rules on trust:** the producer NEVER emits raw file content. It emits only the parsed `**Objective` and `**Current priority` lines, each bounded on its own. A file with neither line yields a named marker (e.g. `no objective line found in <path>`) and nothing else from the file. This shrinks the surface from "any 4000 characters" to "one attacker-authored objective line, labelled with its path", which is the shape the trust question was actually argued about.

The trust-vs-label decision itself (sol recommends requiring nana-trust; Jake ruled label-only) is being put back to Jake with sol's new facts. **Do not implement either side of it in this round** — implement the narrowing above, which both options need, and leave the label wording as it is.

## Also fix
1. **MED #2 — the cap can erase a required line.** A long objective consumes the shared budget and the current-priority line disappears; sol reproduced this for both the product and the program pair. Budget each line independently so BOTH always survive, truncating within a line rather than dropping the next one. Also fix the 12,000-char output cap, which currently appends its marker *after* slicing so the output exceeds the cap (`lib/objective.ts:235-236`). Extend the oversized corpus case to assert both lines are present, not just that truncation was announced.
2. **MED #3 — the golden test hides real divergence.** `tests/objective-golden.test.mjs:91-92` strips the hook's terminal newline as well as the tag line; sol removed that extra normalization in a scratch copy and **25 identity checks failed**, across five cases. Fix the DIVERGENCE, not the test: make the CLI/hook and the pi path agree on the trailing newline (`bin/nana-objective.mjs:15`, hook lines 12-13 vs `extensions/nana-objective.ts:73`), then delete the extra normalization so the test compares exactly what the contract says. Also handle the NUL divergence sol found (bash command substitution strips NULs, pi preserves them): strip or reject NULs in the producer so both runtimes agree.
3. **LOW #4 — invalid UTF-8** is replacement-decoded and injected with U+FFFD; decode strictly and emit the named unavailable marker instead.
4. **LOW #5 — doctor wording.** The installed seed contains `"projectFile": "OBJECTIVE.md"`, so `lib/doctor.mjs:94-95` reports the default as "per-repo file renamed". Report a rename only when the value differs from `OBJECTIVE.md`.
5. **Residual — `lib/config.ts:488-490`** still documents `projectFile` as an owner opt-in; it is rename-only now.

## NOT
No trust gating, no label wording changes (Jake's call, pending). No new mechanisms. No edits to `~/nana-agent-loop`.

## doneWhen
`npm test` exits 0; a file with no `**Objective` line injects no file content; both lines survive an oversized file in both runtimes; the golden test compares with ONLY the tag line normalized and still passes.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 15`.

## Report (≤25 lines)
Commit · the no-Objective-line case before/after (paste what each injects) · both-lines-survive proof · the trailing-newline and NUL divergences fixed, with the extra test normalization removed · doctor output before/after · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
