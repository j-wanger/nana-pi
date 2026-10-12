## MUST

1. **R-1027 can still pass without reading the historical ledger.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:62,158-159,171-175`  
   The proposed mutation changes one real stamp. An implementation can compare against hardcoded data reconstructed from `c4332ec`, or call `git show` while ignoring its output. The missing-commit behavior is declared but not pinned.  
   **Smallest fix:** test in a temporary repository with two different ledger commits. Stamp the first while the second is checked out, spy on the injected runner, and require `git show <full-hash>:REQUIREMENTS.md`. Also test an unknown commit and require a named suite failure.

2. **The closed schema leaves identity, uniqueness, and most field types open.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:63,106-116`  
   Only prose types and the maturity enum are specified. Two authentic assessments for one feature can pass. Duplicate stamped rows can also pass through set-based comparisons. Commit, date, identifiers, statuses, hashes, provenance, and required fields have no declared types or formats.  
   **Smallest fix:** define the schema recursively. Require exact keys and types, full commit hashes, valid IDs, status and mark enums, SHA-256 format, unique feature IDs, and unique row IDs within each stamp. Add duplicate-feature and duplicate-row mutations.

3. **R-1023 describes data that the declared schema no longer contains.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:58,106-111`  
   The revised `gaps`, `risks`, and `decisions` fields are lists of strings. They have no row citations. A row in `stamp.rows` cannot be “outside the rows it was stamped against”; it defines that set, while R-1027 already verifies the complete set.  
   **Smallest fix:** either remove R-1023, or restore structured row citations on assessment claims and require every cited row to belong to the verified stamp.

4. **The shared HANDOFF parser does not yet preserve frontier behavior by construction.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:66,95-99`  
   `packages/nana-pack/bin/nana-frontier.mjs:81-96,134-135`  
   Frontier currently accepts a case-insensitive tag anywhere in an entry, including continuation lines, and extracts no title. The report needs a stricter title/body grammar. One parser returning a title error can therefore add frontier findings, while an arbitrary title fallback can make R-1031 vacuous. Existing tests assert selected findings, not unchanged output.  
   **Smallest fix:** make the shared layer return every raw entry plus independently parsed tag and title results. Frontier must apply only its existing tag/date rules. The report must enforce a documented title/body grammar. Add golden before-and-after frontier fixtures, including a valid tag with an invalid title and a continuation-line tag.

5. **The approved share line omits tree contracts the report directly consumes.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:73-78,83-94`  
   The report uses row homes, purposes, heading uniqueness, nesting, and empty proposed or retired features through `checkTree`. Those contracts are R-287–R-290 and R-294, yet the share line names only R-292 and R-293 from that group. A change to an omitted row can alter report interpretation without triggering the required re-read.  
   **Smallest fix:** add R-287–R-290 and R-294 to the share proposal, then obtain Jake’s approval for the expanded tree change. R-291 need not be shared because the report does not consume the committed outline.

6. **A feature with planned work may still be rated solid.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:60`  
   `REQUIREMENTS.md:1613`  
   R-1025 rejects `solid` only for untested or violated own rows. The ledger currently has a planned row, and planned means the behavior is not built. A future solid assessment can therefore overstate maturity while passing the suite.  
   **Smallest fix:** include `planned` in R-1025 and its mutation test.

## SHOULD

1. **Make packet-directory ownership explicit.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:65,88,117-118`  
   “One packet per” does not say whether obsolete files are removed. Reusing a directory can leave a packet for a feature that is now current, and writing packets inside the repository can make the next report dirty.  
   **Smallest fix:** require an empty target, or atomically replace the directory with exactly the current packet set. Document a gitignored or external default location.

2. **Declare the full-history dependency where users run the suite.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:112-116,158-159`  
   CI has full history, and `c4332ec` exists and parses cleanly. A shallow clone or source archive lacks that commit and will now fail the whole suite by design.  
   **Smallest fix:** document that assessment validation requires the stamped commits, and ensure the missing-object diagnostic names the commit and recommends fetching history.

3. **Pin packet structure, not only packet content.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:65,117-118`  
   R-1030 can pass with an inconvenient prose dump that technically contains every field but cannot reliably drive the candidate-writing loop.  
   **Smallest fix:** declare a versioned JSON packet shape and test it against the assessment schema expected from the refresh brief.

## NOTE

- The historical commit `c4332ecb9b9d22d45083fb52b9631c5f1b41fa67` exists in this clone. The current tree parser reads its ledger with zero structural problems.
- CI already uses full-history checkout, so the historical check is feasible there.
- The revised count is correct: one new heading and twenty rows move the real-ledger literals from 67 to 68 headings and from 1,024 to 1,044 rows.
- The round-one fixes for ownership staleness, full ask bodies, HTML safety, R-1013 isolation, missing assessments, and the concrete template path are materially sound.
- The plan is close, but historical authenticity, schema identity, parser compatibility, and tree dependency declarations still need contract-level fixes.

**Score: 7/10.**

VERDICT: SEND-BACK
