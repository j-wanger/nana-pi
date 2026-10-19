VERDICT: AMEND

## Decision
Keep the HEAD-seeded tree design, but replace environment-variable alternates with an alternates file.
S fixes both checkout bugs, but the simple implementation violates staging independence.
A corrected S needs a HEAD-seeded scratch index too; my prototype was slower than the design.
Dirty-tree EOL distinctions alone do **not** justify rejecting S: nana-land accepts only plain shas.

## Probe evidence
All writes ran under a fresh `mktemp -d "$TMPDIR/clean-adversary.XXXXXX"` folder, with temporary HOME.
Repositories and the real ledger remained untouched.
Below, `$P` is `<tmp>/clean-adversary.ZhaGDQ`.
Commands ran from `$P`, with `HOME="$P/home"`.

- `bash mm3.sh <repo>/packages/nana-pack/bin`
  → `admitted … +snap:7e3313…`; `nana-land 1 refused: no verified version-2 LAND`.
- `bash mm3.sh "$P/pack/bin"` — corrected S, combined CRLF/lost-exec linked checkout, in-tree output.
  → `admitted … 1288a8c598fc`; `nana-land 0 push command: git push`.
- `bash mm3.sh "$P/design-pack/bin"` — supplied tree-design prototype.
  → `admitted … eabce1484df6`; `nana-land 0 push command: git push`.
- `bash mm5.sh "$P/pack/bin"` — corrected S, edited CRLF file, untracked file, staged executable addition.
  → `SUCCESS`; `tally … +snap:1439a667 LAND verified`.
- `node cases.mjs`
  → `exec old=snap S=plain`; `CRLF "base\r\n" S=plain`.
  → `rm cached status "D  f\n?? f\n" S=plain`; `stage edit stable true`.
  → `dirty EOL distinct true`; `untracked snap true`; `corrupt refused true`; `sub dirty distinct true`.
- `node extra.mjs`
  → `naive status S rm-cached CRLF snap design plain`.
  This counterexample changes only staging; status-based S sends normalized checkout bytes into today's raw hash.
- `node cases.mjs` — five derivations each on a fresh no-hardlinks nana-pi clone.
  → old: `205,198,196,196,192` ms; corrected S: `782,809,810,807,849`; design: `540,541,536,537,535`.
  Medians: 196 / 809 / 537 ms. Design adds 341 ms per derivation, approximately 1.36 seconds for four.
  These measure prototypes, not an optimized lower bound for S.
- `node mm6.mjs "$P/pack/bin/review-round.mjs"`
  → `snap repo unchanged: true`.
- `node extra.mjs` — modified design using `objects/info/alternates`, repository name containing space, colon, semicolon and quote.
  → `alternates file colon semicolon space quote: plain`.
  This proves macOS behavior only; it does not establish Windows drive-path behavior.

## Fix
1. Define revision content as what `git add -A` records over HEAD, plus recursive nested-repository records.
2. Seed a fresh scratch index with `read-tree HEAD`; never copy the real index.
3. Read the real index before the scratch operations, preserving corrupt-index refusal.
4. Write new objects exclusively into a scratch object directory.
5. Borrow existing objects through `$scratch/objects/info/alternates`, **not** a delimiter-separated environment variable.
6. Resolve the actual repository object directory, including linked worktrees; write its absolute Git-compatible path as one line.
7. On Windows use forward slashes. Explicitly handle or refuse newline-bearing object-directory paths rather than misparse them.
8. Run `add -A`, excluding nested repositories; restore excluded output paths to HEAD afterward.
9. Derive exclusion matches through win-review-paths’ canonical matching, then use Git-listed spellings for literal pathspecs.
10. Retain recursive dirty/new repository records; compare the resulting tree with HEAD.
11. Always remove scratch resources in `finally`; preserve Git’s refusal diagnostics.
12. Do not change pi-review’s raw copying or reproduction equality check. The combined end-to-end probes pass both designs.

## Sites
- `packages/nana-pack/bin/review-round.mjs`: `workingState`, `gitOut` environment support, imports, constants and module contract.
- `packages/nana-pack/tests/{review-ledger,immutable-review,land}.test.mjs`: tests below.
- `packages/nana-pack/tests/win32-launch.test.mjs`: commit `f` with `update-index --chmod=+x`; correct the misleading index comment.
- `REQUIREMENTS.md`, pack README, generated code map, HANDOFF and session record.
- Build only after win-review-paths lands. Preserve its canonical root and output matching.
- No production changes to `pi-review.mjs`, `nana-land.mjs` or `review-ledger.mjs`.

## Must-meet tests
All filenames below are under `packages/nana-pack/tests/`. Every test runs cross-platform without skips.
Use `update-index --chmod=+x` to establish committed mode; never require Windows chmod to create an executable bit.

| Row and requirement | Test file :: title | Today |
|---|---|---|
| R-1370: Under core.fileMode=false, loss of a committed executable bit alone shall retain plain HEAD. | review-ledger.test.mjs :: `lost committed exec bit retains plain HEAD` | Red |
| R-1371: A Git-produced CRLF checkout under core.autocrlf=true shall retain plain HEAD. | review-ledger.test.mjs :: `CRLF checkout retains plain HEAD` | Red |
| R-1372: A pi-review LAND on a CRLF/lost-exec linked checkout with in-tree output shall permit nana-land to merge its tip. | land.test.mjs :: `normalized checkout review lands its exact tip` | Red, probed |
| R-1373: Dirty content differing only in Git-normalized line endings or ignored execute bits shall have one snapshot revision. | review-ledger.test.mjs :: `normalized dirty copies share one snapshot` | Red |
| R-1374: A tracked edit, untracked file and staged executable addition under these settings shall reproduce and receive a verified snapshot verdict. | immutable-review.test.mjs :: `normalized dirty review reproduces exactly` | Guard |
| R-1375: Derivation in a full local repository without filters shall leave its Git metadata entries unchanged in size, mode and mtime. | review-ledger.test.mjs :: `snapshot derivation leaves git metadata unchanged` | Guard |
| R-1376: Removing a CRLF-checked-out file only from the index shall leave its revision at plain HEAD. | review-ledger.test.mjs :: `cached removal of normalized content retains plain HEAD` | Red |
| R-1377: Clean and dirty derivations in a linked worktree whose common directory contains spaces, semicolons and Unicode shall produce the expected revisions without object lookup failure. | review-ledger.test.mjs :: `scratch objects resolve a linked repository with special path characters` | Guard |

R-1373 varies LF/CRLF everywhere; executable variation is additional, not its sole Windows assertion.
R-1377 asserts plain HEAD when clean, then the same dirty snapshot as an equivalent ordinary-path fixture.

## Wrong-code pairs
- Restore today's raw implementation → R-1370, R-1371, R-1372, R-1373 and R-1376 fail.
- Copy the real index instead of seeding HEAD → R-1374 fails reproduction; R-1376 catches index dependence.
- Keep raw hashes for dirty states → R-1373 fails.
- Force autocrlf=false during add → R-1371/R-1372 fail.
- Force fileMode=true during add → R-1370/R-1372 fail on macOS; run these mutation checks there.
- Remove scratch object isolation → R-1375 fails.
- Omit the alternates file or resolve objects relative to the linked worktree incorrectly → R-1377 fails.
- Replace add -A with add -u → existing R-835 untracked assertion fails.
- Remove output restoration → existing output-exclusion and verified-verdict assertions fail.
- Remove recursive records → existing distinct-dirty-submodule assertion fails.
- Stop reading the real index → existing R-712 corrupt-index assertion fails.
- Use real-index porcelain cleanliness plus raw fallback → R-1376 fails.

## Contract amendments
**R-708:** Define clean against the HEAD-seeded Git-normalized tree plus nested-repository state, excluding review outputs.
Retain plain HEAD and null ledger snapshot when clean; retain HEAD plus full SHA-256 when dirty.
**R-709:** Narrow to independence from rendered diffs and presentation configuration.
Remove its raw-EOL, raw-mode and clean-filter distinction clauses, with a dated supersession note.
Replace the contradictory CRLF, chmod and clean-filter tests; retain the diff-presentation test.
R-710, R-712 and R-835 remain obligations, not exceptions introduced by this fix.
README must disclose filter execution and distinguish scratch-owned writes from side effects caused by configured filters.

## Limits and release gate
- Dirty snapshot identities change once; old ledger entries remain untouched. Deploy without reviews in flight.
- Normalized differences inside dirty trees no longer consume separate revisions; this exceeds the minimum land fix.
- Filters may write outside scratch or behave nondeterministically; do not promise universal `.git` immutability.
- Preserve declared limits around sparse checkouts, partial-clone fetching, ignored staged additions and submodule review refusal.
- Require the exact-tip Windows run to pass all eight tests, the strengthened executable launch test and the previously failing in-flight land test.
- **Claim most likely wrong:** Windows Git will resolve the absolute drive path in the alternates file exactly as assumed.
  R-1377 on native Windows pins that claim; macOS evidence alone is insufficient to land.
