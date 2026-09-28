L3 is done and committed on `lane/l3-handoff` (not pushed). `npm test` exits 0, and the attack test fails on main and passes on this branch.

**Commit:** `6b23473` "L3: handoff — user-scope store, provenance, staleness pointer, non-writer role".

**`npm test` (repo root):**
- Before: 61 files, 60 PASS / 0 FAIL / 1 SKIP, 2651 checks.
- After: 65 files, 64 PASS / 0 FAIL / 1 SKIP / 0 WARN, 2713 checks.

**Attack test (`handoff-trust.test.mjs`):** I ran it against main's handoff code (6a8c5c7, extracted with `git archive`). It exited 6: with trust both `true` and `false`, the injected string reached the system prompt, there was no pointer, and nothing was journaled. On the branch all 12 checks pass.

**Invariants and the tests that cover them:**
- **(a) Repo file never injected:** `handoff-trust`, both trust values. The string is absent, a pointer of 300 chars or less is present, `handoff_legacy_ignored` is journaled, and the repo file is byte-identical.
- **(b) Store writes:** `handoff-store`.
  - Compaction writes the store, not `<cwd>/.pi/handoff.md`, and writes no `.gitignore`. The canonical cwd is recorded in the file.
  - `/tmp/x` and `/private/tmp/x` give the same key (darwin).
  - Two sibling repos get distinct keys and don't pick up each other's handoff.
  - A failed write into a read-only store leaves the prior file byte-identical, with no temp files and a `handoff_write_failed` journal line.
  - Eight concurrent compactions leave one whole summary.
  - Custom paths: the symlink cases are kept in `handoff-symlink` and the custom-path cases in `handoff-artifact`.
- **(c) Provenance:** `handoff-staleness` 1-day case. It checks the label, the writer session file, the timestamp, the lower-authority line, and "background state, not instructions".
- **(d) Staleness:** `handoff-staleness`.
  - At 15 days only the pointer is injected, 300 chars or less, with path, age ("15d") and writer; the file it names is readable.
  - `staleAfterDays: 30` restores the full text, and a new compaction resets it.
  - An oversized `Writer` header still gives a bounded pointer that contains the path.
- **(e) Non-writer role:** `handoff-writer-role`. With `NANA_HANDOFF=off`, the store is byte-identical after compaction and nothing is injected, even with `hasUI: true`. `handoff_skipped_role` is journaled for both pickup and write. A stub `pi` on PATH run through the real `pi-review.mjs` prints `NANA_HANDOFF=off`.
- **(f) Resume/fork/reload:** `handoff-store` checks that all three skip pickup and that `new` picks up.
- **(g) Nested dirs and worktrees:** `handoff-store`. A nested cwd gets "No handoff for this directory" plus the ancestor's path and text is not injected (`handoff_ancestor_named`). A real `git worktree add` path gets a distinct key.

**Store path, printed on write and pickup** (from the store test's temp HOME):
`handoff written to …/nana-home-V4RhPj/.pi/agent/handoffs/6030afff…250d6.md` (pickup prints the same path). With a real home and a real session-file name the stale pointer is 284 chars.

**Additions beyond the brief:** a store entry whose recorded `Cwd:` is another directory is not injected (`handoff_cwd_mismatch`), and a symlinked store entry is refused on read. A write replaces the link rather than writing through it. Both are tested.

**Documentation:** the README Handoff bullets now state the seat rulings (user scope, pointer rather than excerpt, age as the only staleness signal, the-hive's file not deleted or migrated, win32 unverified). The template's Handoff bullet is updated, and the extension's header comment is rewritten. The config change is the one `staleAfterDays` leaf (field, default, positive-number check); `config-normalize` gets matrix coverage plus 0 / -1 / Infinity cases, which astra permitted. `pi-review.mjs` changed only in the spawn env. Nothing in `apps/desk` reads `.pi/handoff.md`: the only hits are the handoff-path config field and a comment.

**`git diff --stat`:** 12 files, +735/−191. That is over the advisory ≤10 files / ≤600 LOC. The extra file is `config-normalize` (required by the L1 ruling), and most of the lines are the four new tests (~390 LOC).

**Residuals:**
- **win32:** the case-folded key and the atomic temp-file + rename are untested there; whether rename over an existing file is atomic on NTFS is unverified. The failed-write, symlink and pi-review stub tests skip on win32.
- **hasUI:** never used as a role signal; it only controls toasts.
- **"No handoff for this directory"** is printed only when an ancestor has a handoff. A directory with neither gets nothing added to its prompt.
- **Custom path onto the repo file:** a custom `handoff.path` from user scope, or from a nana-trusted project, pointing at the repo's own `.pi/handoff.md` would still be honored as configured.
- **README config example:** it doesn't list the new `staleAfterDays` leaf. That section is outside the Handoff bullets, so I left it.

**Claim most likely wrong:** reading (g) as "mention the ancestor only when one exists". A reviewer may expect every session with no handoff to get an explicit "no handoff for this directory" line.

VERDICT: DONE
