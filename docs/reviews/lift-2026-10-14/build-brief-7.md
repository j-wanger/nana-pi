# Lane lift — build brief 7 (2026-10-15 · feat/lift · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Final review round 1 at `e1cc11d`: sol SEND-BACK (`sol-r1.md`, two MUSTs), astra SEND-BACK
(`astra-r1.md`, one MUST, three SHOULDs). Fix all of these; build briefs 1–6's rules all hold (touched test files only,
in the foreground, each tool call under 5 minutes; commit after each item). Each item gets a test, red first, under the
row named, with the title given.

1. **`--verify` compares bytes, not decoded text (sol MUST 1).** `scripts/requirements-lift.mjs:1014` decodes HEAD's blob
   and `:1053` compares strings, so a HEAD row whose UTF-8 bytes became `0xE9` passes when the base row held a literal
   U+FFFD. Read HEAD's ledger with the buffer reader, refuse it when its bytes are not valid UTF-8 (named, as for the
   input), and compare the applied output's bytes with HEAD's bytes. `// req: R-1168`:
   `R-1168: --verify refuses a HEAD ledger whose bytes differ from the applied output's, including an invalid UTF-8 byte that decodes like the base`
2. **The worktree scan covers the grouping file and staged removals (sol MUST 2; astra SHOULDs 2 and 4).** Today
   (`:957-966`, `:817-820`) only the ledger is scanned in every worktree, and a worktree that has staged the ledger's
   removal is skipped. Scan the `--mapping` file's root-relative path in every worktree too, and count a path that HEAD
   tracks but the index or working tree has removed as dirty, naming that worktree. `// req: R-1164`:
   `R-1164: --write refuses when another worktree has an uncommitted change to the grouping file, or has staged the ledger's removal, naming that worktree`
3. **Shares are refused in every ledger form (astra MUST).** In a tree-form ledger an `Also applies:` line falls inside
   a heading's replaceable field block (`:175-177`, `:225`, `:667-669`; proof `:110-112`), so a grouping that omits
   `also_applies` drops the share silently while `--write` and `--verify` exit 0. R-1167 and HANDOFF say a ledger with
   shares is refused: refuse any `Also applies:` line anywhere — flat or tree-form, in the dry run, `--emit-mapping`,
   `--write` and `--verify` (base and HEAD blobs). `// req: R-1167`, using astra's repro (a passing two-feature tree
   whose second feature carries `Also applies: R-001`):
   `R-1167: a tree-form ledger with an Also applies line in a feature's field block is refused, in every mode, never silently dropped`
4. **Never a crash (sol SHOULD; astra SHOULD 3).** A cross-prefix range such as `R-001–G-002` passes shape validation and
   throws in `expandRowIds`; `--verify` with no operand throws on `undefined.startsWith`. Refuse the range in shape
   validation with a named reason (exit 1), and treat a missing `--verify` operand as a usage error (exit 2).
   `// req: R-1167`:
   `R-1167: a cross-prefix row range and a --verify with no revision are refused by name, never a crash`

Do not change any row's text; add the new titles to the cited rows' evidence. Do not touch `CHANGE.md`, the seat's
files in this folder, `HANDOFF.md` or `docs/sessions/` — the seat corrects the notes' grouping-file sentence.

## Done
The touched test files green; `node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1` → 136/136;
`node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `npm run -s readme:check`. Commit, push.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output.
