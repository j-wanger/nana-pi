## MUST

1. **The suite trusts forged stamps.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:51-56,92-96,123-125`  
   R-1023–R-1025 compare citations and ratings only with values stored in the same assessment. A store can falsify row status, ownership, fingerprints, purpose, or feature status and still pass. It can also omit an assessment or use an unknown rating. The planned 38 assessments omit new FEAT-039 entirely.  
   **Smallest fix:** add a row requiring the suite to reconstruct each full stamped commit with `git show`, then verify the exact row set, own/shared classification, statuses, fingerprints, purpose, and feature status. Define the rating enum and required fields. Either require one assessment per reportable feature or require missing assessments to render as missing and produce packets.

2. **A row moving home can remain falsely current.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:51-52,119-122`  
   R-1020 stores own/shared classification, but R-1021 compares only the row set and fingerprints. If a row moves from feature A to B while A starts sharing it, A retains the same ID, text, and status. Its assessment remains current despite the ownership change.  
   **Smallest fix:** make an own/shared classification change a stale condition and name it as changed. Add mutations in both directions.

3. **The report drops the substance of each decision.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:49,83-86`  
   R-1018 and the parser return kind, date, and title, but not the ask body. Real titles such as “Background subagents” do not contain the question Jake must decide. The body does.  
   **Smallest fix:** include the complete ask body in R-1018 and the shared parser result. Render it through the protected text path.

4. **Malformed asks can disappear silently, and parsing remains duplicated.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:83-86`  
   `packages/nana-pack/bin/nana-frontier.mjs:81-96,134-135`  
   The plan says frontier imports only the tag pattern. The report therefore needs separate section and entry parsing. The plan also does not define what happens when a list entry lacks a parseable title or tag. R-1018 promises every ask, so silently dropping one violates the row.  
   **Smallest fix:** make the shared library return every Open-for-Jake entry with parsed fields or named parse errors. Have frontier consume that shared entry parser while retaining its wall-clock validation. Make the report refuse malformed entries before writing output.

5. **The refresh mechanism has no requirement.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:32-36,76-77,97-98`  
   Evidence packets are central to making the report repeatable rather than a one-time artifact, but no row specifies that they exist or what they contain. They can be omitted while every proposed row passes.  
   **Smallest fix:** add one row requiring a packet for every stale or missing assessment, containing the current feature metadata, own/shared rows, current assessment, and stale differences. Pin deterministic packet output.

6. **R-1024 cannot independently prove its ID clause.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:55,144`  
   Every capability, feature, subgroup, and requirement ID contains an ASCII digit. Therefore the digit check catches every ID. A deleted ID-specific check still passes the proposed mutation test.  
   **Smallest fix:** remove the redundant ID clause and ID-check mutation. Keep the ASCII-digit prohibition as the enforceable contract.

7. **R-1013 lacks a test design that cannot pass through hardcoding.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:44,115-118,129-130`  
   The plan specifies only the two-run test. That proves byte stability, but not the full hash, `%cI` date, clean/dirty distinction, explicit untracked-file policy, or fail-closed git errors.  
   **Smallest fix:** inject the repository root and git runner, or use isolated temporary repositories. Pin clean, tracked-dirty, untracked-dirty, and git-error cases against independently obtained expected values.

## SHOULD

1. **Define the assessment schema and prose boundary explicitly.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:54-56,92-96`  
   “Assessment prose” does not identify which fields are checked, whether unknown fields are rejected, or whether nested future fields are included.  
   **Smallest fix:** document an exact closed schema and recursively test every declared prose field.

2. **Give the template a concrete path and ownership.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:87-91,99-104`  
   “The page template” is not a file declaration. Embedding it in the large report module and storing it under documentation have different map and test consequences.  
   **Smallest fix:** name the template path in scope and state whether it is imported, read from disk, or embedded.

3. **Pin both halves of the HTML-safety contract separately.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:50,89-91,145-146`  
   Escaping `<` protects the JSON script container. DOM text-node insertion protects rendering. One static assertion can pass while the other half is broken.  
   **Smallest fix:** test that hostile source leaves exactly one parseable data script, then exercise the renderer with an injected document and prove it uses text nodes rather than an HTML sink.

4. **Clarify that computed “status” excludes assessment ratings.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:26-27,92-96`  
   The outcome says every status is computed, while maturity ratings are stored.  
   **Smallest fix:** change the outcome to “every ledger status” or explicitly distinguish ledger statuses from assessment ratings.

5. **Resolve the open share decision before build admission.**  
   `docs/reviews/product-report-2026-10-11/CHANGE.md:63-67,138`  
   The feature cannot be built to its declared tree shape until Jake decides checkpoint 1b.  
   **Smallest fix:** record the decision before handing the plan to a builder.

## NOTE

- The revised rows each contain exactly one literal `shall`, satisfying G-013’s syntactic rule.
- The whole-ledger normalization before `parseLedger` addresses the measured CRLF and trailing-whitespace empty-parse failure.
- Plain code-unit sorting, full hashes, `%cI`, explicit untracked handling, and `GIT_OPTIONAL_LOCKS=0` adequately bound report-byte determinism.
- The layer direction is correct: the report script may import the pack library, while frontier cannot import from `scripts/`.
- The planned real-ledger total of 1,039 is correct for the current fifteen-row delta.

**Score: 6/10.** The shape is sound, but stamp authenticity, ownership staleness, ask completeness, and refresh packets remain contract gaps.

VERDICT: SEND-BACK
