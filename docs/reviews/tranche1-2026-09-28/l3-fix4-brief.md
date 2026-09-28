# Worker brief — L3 fix round 4 (Opus 5.5). Astra land MUSTs. Implemented under the cap; astra re-rules next. No further sol round.

Worktree `~/nana-pi-wt/l3`, branch `lane/l3-handoff` (HEAD `e1d87fe`). Read `l3-astra-land.md`.

## MUST 1 — a custom path can smuggle the repo file back in, defeating Jake's binding rule
`extensions/nana-handoff.ts:266-281`: an owner-configured absolute `handoff.path` of `<repo>/.pi/handoff.md` is read and injected — right after the warning that says a repo file was NOT injected — and compaction then overwrites that repo file (`:359-378`). Jake's ruling is binding: **a repo `.pi/handoff.md` is never injected, never migrated, never deleted.** You disclosed this in r1 as a residual; astra is right that a residual cannot silently amend a binding rule.

**Required contract:** the legacy exclusion applies by path SHAPE, whatever the configuration says. A resolved handoff path whose final two segments are `.pi/handoff.md` (any directory, not just the session cwd) is a legacy repo file:
- never injected — the session gets the same one-line "not injected, repo-writable" pointer it gets today for the cwd's own legacy file;
- never written by compaction — the write is refused and journaled (`handoff_legacy_write_refused`), leaving the file byte-identical;
- the refusal is stated once per session, naming the configured path so the owner understands why their setting is not honored.
This holds for a custom path from user scope AND from a nana-trusted project scope.

**Tests** (extend `handoff-trust.test.mjs`): custom `handoff.path` = `<repo>/.pi/handoff.md` containing an injection string, from user scope and from trusted project scope → the string is absent from the system prompt, the pointer is present, the journal names the refusal, and the repo file is byte-identical after a compaction attempt. Keep every existing case passing.

## MUST 2 — a broken store must not read as an unadopted directory (the L5 seam)
`:101-105` maps **every** ENOENT to `{kind:"missing"}`, but a dangling store symlink, or a dangling `handoffs/` parent link, also raises ENOENT. `:277` then journals `handoff_missing`, which lane L5 will read as "this directory is unadopted" — exactly the misclassification sol and astra both warned about.

**Required:** distinguish genuine absence from a dangling entry or dangling parent. Before classifying an ENOENT as `missing`, check with `lstat` whether the path (or its parent) exists as a link that does not resolve; if so return `{kind:"error", reason}` and journal `handoff_pickup_failed`, never `handoff_missing`. Legitimate symlink support stays (the default-store symlink refusal remains subtracted — do NOT restore it). Pin both broken-store cases: a dangling store-file symlink and a dangling `handoffs/` directory symlink, each asserting an error journal and **no** `handoff_missing`.

## Also (astra low-cost)
- Migration wording: "handoff lives in the user-scope store" can read as "your text was moved". Change the repo-file pointer and README to say the repo file was **left unchanged here, not migrated**, and that future summaries are written to the store.
- Record in the README that an escaped pointer omits age and writer by design (pointer-specific exception; provenance still lives in the artifact).

## NOT
No restoration of the default-store symlink refusal. No other behavior changes. No gate edits. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; the two MUST test groups pass; `handoff-trust.test.mjs` still fails against main's extension.

## Report (≤20 lines)
Commit · the custom-path refusal reproduced before/after · the two dangling-link cases with their journal lines · the wording changes · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
