# scrub-contracts · must-meet (seat and plan adversary, 2026-10-21)

Feature: FEAT-032 · Keep instructions and documentation accurate

Class: install, hook or gate (a pi extension's prompt heading, the SessionStart producer's text, rules and templates that nana-setup installs or renders, the frontier and product-report readers). Ladder: the final reviewer from another model family, the land reviewer, the seat's wrong-code pairs, one independent check, the macOS install check before the land, and the Windows CI leg. Threat model: honest variation in scope — a seat or builder types the owner's name, a CI log prints a test title, a fixture copies a local path, other projects on this machine keep the old HANDOFF heading and old shipped text until they reinstall, a Windows rule copy reads stale until reinstall; deliberate forgery out (homoglyphs, zero-width splits, encoded names, a description that identifies without naming).

Rulings: the public repo carries no owner name and nothing about the owner's work (2026-10-16); the scrub covers the current files only, with no history rewrite (2026-10-21). The planner's draft (`plan-draft.md`) and the plan adversary's attack (`plan-attack.md`) are the inputs; neither holds an identifier, and neither may this lane's corpus. This file uses `<first>` for the owner's first name and `<acr>` for the work acronym.

## What changes for the user

The repo stops naming its owner in every current file outside the records, which lane B (scrub-records) cleans next. The two contract strings that carried the name — the HANDOFF asks heading and the writing rule's title — become role words, and every reader accepts any "Open for …" heading, so other projects' HANDOFFs keep working. A suite scan fails any tracked file that brings an identity word back.

## Seat decisions (not the owner's call; each is reversible)

- **D1 · Replacement words: `owner`.** Prose says "the owner"; identifiers say `owner`/`Owner` with no space; machine paths become `/Users/example` or `C:\Users\example` (precedent: `retired-artifacts.test.mjs:87`); provenance says "(the owner, <date>)". The HANDOFF asks heading becomes "Open for the owner"; the writing rule's title becomes "Writing for the owner", and pi's prompt heading follows.
- **D3 · One heading matcher: `prefix`.** `packages/nana-pack/lib/frontier-config.mjs` exports one matcher for the asks heading: a heading whose text starts with "Open for" followed by a space. Every reader imports it: `nana-frontier.mjs`'s four reads (the open-tag split, the misplaced-landed and overdue-date `inSection` reads, and the section-order and read-window checks through `LIVE_SECTION_NAMES`), `handoff-asks.mjs`, `product-report.mjs` and the HANDOFF writing check's slicer. "Open formats" and a bare "Open" stay unread. The camelCase export that carries the name is renamed.
- **D4 · Two lanes: `two`.** Lane A (this lane) changes code, tests, rows, shipped text, live docs (HANDOFF and the known-bug files, by the seat) and adds the scan. Every record file that still carries an identity word — `docs/reviews/`, `docs/sessions/`, `research/`, `apps/bench/studies/`, the product report's assessments, the design docs under `docs/` — is allowlisted with its pinned per-word counts, so no record can gain a name while lane B waits. Lane B scrubs the records, re-keys the catch-ledger study, renames the record file named after the owner, and empties those entries. Lane B builds alone, after this lane lands (attack S5).
- **D5 · The guard hashes its words: `hash`.** `identity-scan.config.json` at the repo root holds sha256 digests of four lowercased words: the first name, the login name, the surname and the work acronym. The adversary suggested two more from commit metadata (the legal first name and the machine name); the seat leaves them out, because the legal first name is a three-letter calendar token that would match every date in the committed logs. A pasted `git log` is a known limit. It replaces R-1415's plaintext word list in the rulings test.
- **The tokenizer.** Split on `[^A-Za-z0-9]`; split camelCase only inside all-letter tokens, so a mixed id such as `d<Acr>8C` never matches (attack M4); scan each tracked path as well as its content; hash only tokens of an identity word's length (attack S9). The scan takes its root from `git rev-parse --show-toplevel`, never the test's cwd (attack M6).
- **Allowlist entries carry a pin.** Each entry names its path, its per-word counts and its reason: `record` (lane B removes it), `byte-pinned` with the pin it rests on (the bench fixture manifest, a retired-fingerprints key, a skill-copy-history hash), or `frozen-desk` for a path under `apps/desk/`. Lane B adds R-2518, which recomputes each pin.
- **D6 · The frozen desk: `exempt`.** Its two comments stay; the desk freeze is the owner's ruling. Allowlisted as `frozen-desk`.
- **D7 · Personal projects: `keep`.** About fifteen personal project names stay; they are neither the name nor work. An Open line asks the owner, with the real count.
- **Census additions (attack M3).** The camelCase and snake_case forms (`splitOpenFor<First>`, `user_<first>_…`, `<first>_prompts`, `…_<acr>_desk…`) are renamed in lane A. The lift test fixture's glossary rows that describe the work domain without the acronym become neutral rows that keep the test's four columns. The extractor's sealed time zone stays (the recorded trial uses it): a known limit.
- **The frontier golden (attack M8).** `frontier-baseline.json` is transformed with the replacement table and the computed word delta, never regenerated from the new CLI; new-heading cases are added as new entries.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2511 | The identity scan shall report every tracked file whose path or content carries an identity word outside the allowlist. | `packages/nana-pack/tests/identity-scan.test.mjs::no tracked file outside the allowlist carries an identity word` |
| R-2512 | WHEN an identity word appears in any case, as a possessive, path segment, hyphen, snake_case or camelCase part, or file name, the identity scan shall report it. | `packages/nana-pack/tests/identity-scan.test.mjs::the scan finds identity words in every written form` |
| R-2513 | IF an allowlisted file's count for any identity word differs from its entry, THEN the identity scan shall report that file. | `packages/nana-pack/tests/identity-scan.test.mjs::an allowlisted file with one more, one fewer or swapped identity words is reported` |
| R-2514 | WHEN a HANDOFF heading starts with "Open for" and a space, the product report shall list that section's entries as asks. | `packages/nana-pack/tests/product-report.test.mjs::an Open for heading with any name is read as the asks section` |
| R-2515 | WHEN a HANDOFF heading starts with "Open for" and a space, the frontier report shall apply its open-tag, misplaced-landed, overdue-date, section-order and read-window checks to that section. | `packages/nana-pack/tests/frontier.test.mjs::an Open for heading with any name gets every live-section check` |
| R-2516 | WHEN a transcript attaches the shipped writing rule under any "Writing for" title, the trial extractor shall count that session as rule-attached. | `packages/nana-pack/tests/writing-trial-extractor.test.mjs::a rule attached under any Writing for title counts as attached` |

A seal test, `seal: identity word digests` in `identity-scan.test.mjs`, pins the four digests and cites R-2511.

**Amendment after round 1 (the land reviewer's MUST, 2026-10-21).** The fifth rubric rule of the trial extractor stopped matching archived reports that name the owner (main's decision golden scored [5, 5, 3]; the tip's scored [4, 4, 3] on the same input). Build 4 adds:

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2521 | WHEN a decision block names the owner by the first identity word or by a role word, the trial extractor shall count the block's fifth rubric part as present. | `packages/nana-pack/tests/writing-trial-extractor.test.mjs::a decision naming the owner by name or by role scores its fifth part` |

Its seal, `seal: the extractor's owner word digest`, pins `OWNER_WORD_DIGESTS` to the scan config's first digest. R-2517 to R-2520 stay reserved for lane B.

### What each test does, and why it is red on main

- **R-2511.** Runs from the package folder, as the suite does. Asserts the scanned file count equals `git ls-files` at the repo root (3,643 at 906fbb56) and zero findings. Red on main: recorded per-word counts at 906fbb56 with the committed config, all four nonzero (this also proves the four digests, attack M7).
- **R-2512.** A temp git tree with a made-up word's digest injected through the scan's config parameter. Seven forms are found: upper case, a possessive, a path segment, a hyphenated name, a snake_case part, a camelCase part, and a file name; a CRLF file is read the same. A mixed-alphanumeric id holding the word is not found. Red on main: the module is absent.
- **R-2513.** Three mutations of one allowlisted file — one more, one fewer, and two words swapped at the same total — are each reported (attack M5). Red on main: absent.
- **R-2514.** Two made-up names after "Open for" are read as the asks section; "## Open formats" and a bare "## Open" are not (attack S2). Red on main: 0 asks under "Open for the owner" (measured).
- **R-2515.** One fixture holding an untagged entry, an overdue date and a misplaced LANDED marker, under two names: the finding kinds are identical, and all five check kinds appear (attack M1). Red on main: the renamed heading gives 0 findings, and a build that changes only `handoff-asks.mjs` gives 1 (measured).
- **R-2516.** Builds the attachment from the shipped rule file's own bytes, plus a copy retitled with a made-up name; both count as attached (attack S3). Red on main: the extractor matches the old exact title (inferred, not run).

### Existing rows this lane changes (text only)

R-751 (the writing heading), R-682, R-875, R-877, R-878, R-2470, R-2471, R-1018, R-1030, R-1415 (its plaintext list moves to the scan's digests), FEAT-039's Purpose and the desk features' frozen Status lines (the frozen status text carries the name; the seat rewrites them to "the owner" without changing the freeze). Each keeps its ID and status.

## Tunables

- `IDENTITY_WORD_HASHES` — contract: the 2026-10-16 ruling; the four words from this census, 2026-10-21; sealed by the seal test.
- `IDENTITY_ALLOWLIST` — chosen; each entry carries its path, counts, reason and pin.
- The tokenizer rule — chosen: catches every census form and no mixed id (attack M4).
- `OPEN_SECTION_PREFIX = "Open for "` — contract (R-2514, R-2515). `OPEN_SECTION_NAME = "Open for the owner"` — chosen.
- The writing title prefix "Writing for" — contract (R-2516); the prompt heading — contract (R-751).

## Known limits (carried to the feature files)

- History keeps every occurrence, by ruling. Every past and future commit's author carries the owner's legal name and machine name; changing the git author setting is the owner's call (an Open line).
- The legal first name and the machine name are not hashed (a calendar token would flood the logs); a pasted `git log` would pass the scan.
- The handle stays in the repository address, which installs depend on.
- Short-word digests can be reversed with a dictionary; they hide the words from casual reading only.
- The scan catches words, not descriptions; the work domain described in other words passes.
- The extractor's sealed time zone names the owner's region; the recorded trial uses it.
- Under the prefix matcher, another project on this machine whose heading reads "Open for <first>: …" goes from 0 asks to 2 malformed ones (attack S1); a stray "Open for review" heading would read as asks.
- Other projects keep the old shipped text, and `nana-setup project --check` reports their AGENTS.md region as differing, until they rerun `nana-setup project`.
- A Windows rule copy reads stale until the next install, through the normal copy-record path.
- Any lane in flight when this lands fails the scan at its own land and must scrub before its final round (attack S5); none is in flight now.

## Seat steps

- Three build sessions with the larger builder: (1) the scan, its config and allowlist generator, R-2512, R-2513 and the seal; (2) the one heading matcher, the writing title, R-2514, R-2515 and R-2516; (3) the scrub of every non-record file the scan reports, the frontier golden transform, then R-2511 green. Between sessions 2 and 3 the seat renames HANDOFF's heading and scrubs HANDOFF and the known-bug files (the builder may not edit them).
- Push and open a draft PR after session 2 for the Windows leg; the macOS install check before the land.
- Wrong-code pairs for M1 (one reader left on the old name), M4 (a camel split on mixed ids), M5 (a one-sided count check), M6 (a cwd-relative file list) and S2 (no space after "Open for").
- Reviews: Opus as the final reviewer, astra as the land reviewer, on the exact tip. Reserve R-2511 to R-2520 while both lanes are open.
