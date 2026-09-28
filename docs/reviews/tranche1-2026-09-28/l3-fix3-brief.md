# Worker brief — L3 fix round 3 (Opus 5.5). Implemented under the round cap (sol r1–r3 all used); astra rules on the land next.

Worktree `~/nana-pi-wt/l3`, branch `lane/l3-handoff` (HEAD `ff0c6a1`). Read `l3-sol-r3.md`.

## The one blocking defect (sol r3 HIGH)
`resolvablePath` (`nana-handoff.ts:76-89`) emits a path verbatim, but pi's resolver **normalizes Unicode spaces to ASCII space**, and `stalePointer` (`:180`) rewrites tab/CR/LF to spaces to keep the pointer one line. So for a path containing NBSP, other Unicode spaces, tab, CR or LF, the emitted text does not resolve to the real file — worse, it can resolve to an **ASCII-space decoy** that exists. sol proved each case through the installed `resolveToCwd`.

Only an owner-configured custom `handoff.path` can contain such characters (the default store path is `~/.pi/agent/handoffs/<sha256>.md`), so this is narrow — but the pointer's entire value is that it addresses the file, and we must not print a locator that silently points elsewhere.

**Required contract:**
- Detect any character in the emitted path that pi's resolver rewrites (the Unicode-space class the resolver folds) or that cannot survive a one-line pointer (tab, CR, LF).
- When present: do NOT claim readability. Emit the absolute path with those characters made explicit (e.g. percent- or `\u`-escaped, your choice — say which) and append a short marker such as `— path contains characters the read tool rewrites; copy it from this line`. Never emit a form that would resolve to a different existing file.
- When absent: today's behavior is unchanged.
- The README's "one read away" wording gets the same caveat.

**Tests** (extend `handoff-staleness.test.mjs`): for NBSP, a narrow no-break space, tab, CR and LF in a custom `handoff.path` — assert the pointer does NOT emit a string that `resolveToCwd` maps to a different existing file (create the ASCII-space decoy and assert it is never what the emitted path resolves to), and that the marker is present. Keep the existing resolvable cases passing.

## Also (cheap, from sol's CARRY)
- Pin the relative-custom-`handoff.path` semantics you found: it resolves against the **process** cwd, not the session cwd. One test asserting the pointer shows the file actually read, and one README line stating it.

## NOT
No other changes. No new mechanisms. Do not weaken an assertion. `--max-budget-usd 10`.

## doneWhen
`npm test` exits 0; the five special-character cases pass with decoys present.

## Report (≤20 lines)
Commit · the escape form you chose and the marker text · the five cases with what each emits · the relative-path pin · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
