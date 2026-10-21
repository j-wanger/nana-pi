# Plan attack: owner-identity scrub (main 906fbb56)

Probe: `git archive` copy in scratch `scrub-adv/`, temp HOME. Placeholders: `<first>`, `<acr>` (work acronym), `<reg-A>`/`<reg-B>` (regulators).

## MUST

**M1. Four heading matchers, not one (D3, R-2515).** `nana-frontier.mjs` reads the asks section four ways: `splitOpenFor<First>` (open-tag), `inSection(i, "open for <first>")` at :122 (misplaced-landed) and :125 (overdue-date), and `LIVE_SECTION_NAMES` + `isNamed` (section-order, read-window). Probe (untagged entry, overdue date, LANDED marker): old heading 3 findings; renamed heading 0; a wrong build prefixing only `handoff-asks.mjs` 1 (open-tag). The plan's R-2515 passes it while two checks drop silently. Fix: one exported matcher in `frontier-config.mjs` (`LIVE_SECTION_NAMES` carries "Open for"). Every reader imports it. R-2515 asserts all five check kinds under two names.

**M2. A label-only re-key changes the study and still exits 0 (D2a, R-2517).** The match caches are keyed by `lane|sha(prompt)`. `currentMatches` filters by key and never throws (catch-ledger.mjs:130-133). Probe (scrubbed tranches, labels re-keyed by report name): `build` exits 0; same_as 58 to 35, covers 66 to 52; results.json, table.md, ledger.jsonl differ. Re-keying matches by lane also revives superseded records: hints shown 241 to 482. Main reproduces all 15 study files byte for byte. Fix: map old key to new key by running `labelJobs`/`matchJobs` on both corpora, over all five caches. R-2517 compares bytes, and reads no git history (CI clones are shallow).

**M3. Census misses.**
- camelCase `splitOpenFor<First>`: 9 uses in 6 files. snake_case `user_<first>_…` and `<first>_prompts`: 9 uses in 6 files. Work-acronym snake names (`…_<acr>_desk…`): 3. A `\b` regex misses all of them.
- A tracked file name: `docs/reviews/cc-hooks-windows-2026-10-12/<first>-windows-check.md`. 15 references in 10 files cite it, one of them `acceptance.mjs`. A content scan never sees it.
- Work domain without the acronym: the lift test fixture (requirements-lift.test.mjs:590-597) has a glossary row for a `<reg-A>` report, a reporting body and a cash-threshold row. Two lift verify records copy it. The design doc lane-brief-template-2026-09-28.md:53 names `<reg-B>` and its report type, which reveals the country. 49 bare-acronym uses in 18 files sit in descriptions such as "`<acr>` investigation desk … case record, alert list", which a token swap leaves readable.
- Location: writing-trial-extractor.mjs:52 seals an IANA zone that names the owner's region, and one record repeats it.

Fix: add these to the census. Lane B renames the file and its references. Neutral glossary rows keep the four-column test. Paraphrase the design-doc line. Keep the zone (the recorded trial uses it) as a known limit. The proof lists every acronym line for a human pass.

**M4. R-2512 accepts a wrong tokenizer.** Measured on main: a non-alphanumeric split (6,928 hits) misses camelCase; a `\W` split (6,916) misses snake_case; a camel-and-digit split (7,012) adds 72 false hits from one random CI id (`d<Acr>8C`). Fix: split on `[^A-Za-z0-9]`. Split camelCase only inside all-letter tokens. Scan each path as well as the content. R-2512 covers camel, snake, path, file name and CRLF forms, plus one negative mixed-alphanumeric id.

**M5. R-2513 tests one direction.** The title says "one more". A `>` comparison passes it. Fix: test one more, one fewer, and two words swapped at the same total.

**M6. R-2511 can scan a subtree.** scripts/test.mjs:458 sets cwd to the package folder, so a bare `git ls-files` lists only `packages/nana-pack`. Fix: the scan takes its root from `git rev-parse --show-toplevel`. The test asserts that the scanned count equals the root's tracked count (3,643 today).

**M7. Two digests go unverified after lane B.** The kept files hold only the first name (5 files) and the acronym (3 files). Neither the login nor the surname appears in any kept file. A wrong digest for either (trailing newline, wrong case) stays green forever, because R-2512 tests an injected word, not the shipped digests. Fix: R-2511's red evidence records per-word counts on main with the committed config, and all four must be nonzero. One seal test then pins the four digests and names R-2511.

**M8. The frontier golden turns self-confirming.** frontier.test.mjs:43 says it was "captured from the unmodified frontier CLI before the shared splitter change". Scrubbing `handoff-current-2026-10-11.md` changes `words=1663`, so regenerating the golden from the new CLI proves nothing. Fix: transform the golden with the replacement table and the computed word delta, the same proof that covers the fixtures. Add new-heading cases as new entries.

**M9. R-2518 has no mechanical pin.** "Byte-pinned" is free text. Fix: each entry names its pin (fixture manifest, retired-fingerprints key, skill-copy-history hash, or an `apps/desk/` path); the test recomputes it.

## SHOULD

- **S1. H1 changes one other project.** Its heading is "Open for `<first>`: …". Today's boundary rejects the colon, so it yields 0 asks. Under H1 it yields 2, both malformed: 2 new open-tag findings. Its product report is unaffected (no ledger). The two other projects (9 of 9 and 3 of 3 malformed) are unchanged. Record it in Known limits.
- **S2. R-2514 has no negative case.** "## Open formats" and a bare "## Open" must stay unread. Without that test, a `/^Open for/` build passes.
- **S3. R-2516's fixture is a literal string.** Build the attachment from the shipped rule file's own bytes, so a reword that breaks `RULE_ANCHOR` fails. Use a made-up name for the second title. The extractor uses `includes`, not an exact match. The red is real but was not run.
- **S4. The replacement table needs context classes.** Prose gets "the owner". Identifiers get `owner`/`Owner` with no space. Paths get `example`. The proof shows that no space landed inside a code span or path. One word becomes two: the scrubbed HANDOFF probe showed no new over-cap sentence, but run R-2503 after the swap.
- **S5. Lanes in flight will fail the guard.** 116 of 122 lane corpora since 2026-10-18 carry identity words. Any lane still in flight when lane A lands fails the guard at its own land, and it must scrub before its final round. Build lane A with no lane that would land after it. Build lane B alone. Order: A, then B. B's planning may overlap A's build.
- **S6. File overlap with queued lanes.** Lane A edits `doctor.mjs`, `steps.mjs` and `settings-merge.test.mjs`. The linked-Claude-folder lane and the byte-order-mark lane touch the same files. Pair lane A with neither.
- **S7. Category 12 is undercounted.** The census counts 4 personal-project names; about 15 are present, with several thousand uses. D7 can stand; give the owner the real count.
- **S8. Commit metadata names two more tokens.** Every commit author carries the legal first name and the machine name. The tree holds neither today, but a pasted `git log` in a corpus would bring both in. Add both to the hash list (chosen).
- **S9. Scan cost.** Measured 5.8 s over 172 MB (1.26 M memoized tokens). Hash only tokens of an identity word's length. Windows is slower (inferred).

## NOTE

- N1. Renaming the writing title reads neither stale nor doubled. The install check keys on `<nana-writing>` (install-check-config.mjs:65). pi's section is keyed `nana-writing` (nana-writing.ts:211). Windows rule copies show stale until reinstall, through the normal copy-record path.
- N2. `checkProject` reports the AGENTS.md working region as differing in every adopted project until `nana-setup project` reruns (project.mjs:655).
- N3. Lane B leaves the runtime map stale; re-measure.
- N4. Reserve R-2511 to R-2520 in HANDOFF while both lanes are open.
- N5. A Windows-machine branch importing `splitOpenFor<First>` breaks on pull (inferred).

## AMENDED

Lane A (install, hook or gate; macOS install check; Windows leg). Suggested wrong-code pairs: M1, M4, M5, M6 and the S2 boundary.

| Row | EARS (one shall) | Test file :: title | What it does |
|---|---|---|---|
| R-2511 | The identity scan shall report every tracked file whose path or content carries an identity word outside the allowlist. | packages/nana-pack/tests/identity-scan.test.mjs :: "no tracked file outside the allowlist carries an identity word" | Runs from the package folder. Asserts that the scanned count equals the root's `git ls-files` count and that there are zero findings. The red run records per-word counts on main, all four nonzero. |
| R-2512 | WHEN an identity word appears in any case, as a possessive, path segment, hyphen, snake_case or camelCase part, or file name, the identity scan shall report it. | same :: "the scan finds identity words in every written form" | Builds a temp git tree with a made-up word's digest injected. Expects 7 forms found and a mixed-alphanumeric id not found. |
| R-2513 | IF an allowlisted file's count for any identity word differs from its entry, THEN the identity scan shall report that file. | same :: "an allowlisted file with one more, one fewer or swapped identity words is reported" | Covers three mutations of one entry, each reported. |
| R-2514 | WHEN a HANDOFF heading starts with "Open for" and a space, the product report shall list that section's entries as asks. | packages/nana-pack/tests/product-report.test.mjs :: "an Open for heading with any name is read as the asks section" | Two made-up names are read. "Open formats" and "Open" are not. |
| R-2515 | WHEN a HANDOFF heading starts with "Open for" and a space, the frontier report shall apply its open-tag, misplaced-landed, overdue-date, section-order and read-window checks to that section. | packages/nana-pack/tests/frontier.test.mjs :: "an Open for heading with any name gets every live-section check" | Runs one fixture under two names. The finding kinds are identical, and all five appear. |
| R-2516 | WHEN a transcript attaches the shipped writing rule under any "Writing for" title, the trial extractor shall count that session as rule-attached. | packages/nana-pack/tests/writing-trial-extractor.test.mjs :: "a rule attached under any Writing for title counts as attached" | Builds attachments from the shipped file's bytes, plus a copy retitled with a made-up name. Both are counted. |
| seal | (pins `IDENTITY_WORD_HASHES`, names R-2511) | same file as R-2511 :: "seal: identity word digests" | Compares the four digests. |

Lane B (ordinary; after A lands).

| Row | EARS (one shall) | Test file :: title | What it does |
|---|---|---|---|
| R-2517 | WHEN the catch-ledger build runs on the scrubbed corpus with key-exact re-keyed caches, it shall write results.json, table.md, ledger.jsonl and kappa-pairs.json byte-equal to the committed study files. | apps/bench/test/catch-ledger.test.mjs :: "build reproduces the recorded results with no model call" | Copies the study to a temp `CATCH_OUT`, removes the judge binary, runs `build`, and compares the bytes. Red: a label-only re-key (measured: exit 0, three files differ). |
| R-2518 | The identity allowlist shall hold only entries whose named pin matches the file's bytes or whose path lies in the frozen desk. | packages/nana-pack/tests/identity-scan.test.mjs :: "every allowlist entry is byte-pinned or frozen-desk" | Recomputes each manifest, fingerprint or history hash. A free-text entry fails. |

Lane B's one-time proof (no suite test): every changed line maps back under the table, and the committed study outputs equal the table applied to the recorded ones.
