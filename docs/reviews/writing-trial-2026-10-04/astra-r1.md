## Ranked findings

### MUST 1 — Installation can silently displace existing pi instructions

**Files:** `packages/nana-setup/lib/steps.mjs:121–135`; `packages/nana-setup/lib/doctor.mjs:246–251`

The installer checks only `AGENTS.md`. Pi selects the first usable file from `AGENTS.override.md`, `AGENTS.md`, `AGENTS.MD`, `CLAUDE.md`, `CLAUDE.MD` in each directory.

**Executed evidence, installed pi 1.0.2:**
- With user-scope `CLAUDE.md` present, pi initially loaded its instructions. Installation created `AGENTS.md`; pi then loaded only the writing rule. The old file survived, but its instructions disappeared from context.
- With user-scope `AGENTS.override.md` present, pi did **not** load the writing rule. Doctor nevertheless reported ✓.

**Smallest fix:** Check upstream’s context-file precedence before installing and diagnosing. Report foreign effective instructions without displacing them; detect an override that hides the rule. Amend R-373/R-375 and add both regression tests.

### MUST 2 — The verdict check produces false success

**File:** `packages/nana-pack/lib/writing-check.mjs:102–105`

`upper.includes(w)` matches substrings, not verdict words. Missing text also passes.

**Executed evidence:**
- `I reopened the investigation today.` → `verdict=yes`, because “reopened” contains “OPEN”.
- Empty input → `verdict=yes`.
- `1. DONE. I checked the first file.` → `verdict=no`, because the first “sentence” is `1.`.
- A heading followed by `DONE.` also fails.

These errors directly corrupt the trial’s verdict-first share.

**Smallest fix:** Match complete verdict words/phrases in the first prose sentence, handle Markdown prefixes, and reject or explicitly exclude empty reports. Add positive and negative fixtures through the CLI.

### MUST 3 — The sentence measure changes with formatting, not writing quality

**Files:** `packages/nana-pack/lib/writing-check.mjs:29–57`; `packages/nana-setup/claude/rules/nana-writing.md:30–32`

Every physical newline ends a sentence. Markdown syntax contributes words and sentences. Code masking protects punctuation only; subsequent checks still receive the original code text.

**Executed evidence:**
- One 26-word sentence, wrapped into two 13-word lines, produced `sentences=2 over=0`.
- The rule’s decision-point sentence contains **27 words**. Its wrapping makes R-376 pass. Joining that paragraph produces a length finding.
- A table separator, `| --- | --- |`, counts as a five-word sentence.
- Fenced code produced passive and banned findings; each triple-backtick fence produced an identifier finding for two backticks.
- Unfolding ordinary continuation lines in `land-ruling.md` changed its result from **5/124 over-cap chunks (4.0%)** to **21/72 (29.2%)**.

The ruling explicitly chose newline splitting. This is therefore a **design defect requiring Fable’s amendment**, not an unauthorized implementation deviation. It makes the proposed 10% sentence target unreliable.

**Smallest fix:** Join soft-wrapped prose within paragraphs and list items; exclude headings, table separators and fenced code from prose counts. Keep the expressly accepted abbreviation limitation. Pin formatting-equivalent fixtures before collecting the baseline.

### MUST 4 — The sealed-value contract is not implemented

**Files:** `packages/nana-pack/lib/writing-config.mjs:16–47`; `packages/nana-pack/tests/writing-check.test.mjs:55–60`

The named values have configuration homes and provenance, but only `SENTENCE_CAP` has an explicit seal. Even that value appears in two assertions rather than one.

**Executed mutations in disposable copies:**

| Mutation | Checker test exit |
|---|---:|
| `MIN_SENTENCE_WORDS`: 3 → 4 | 0 |
| Verdict list reduced to `["LANDED"]` | 0 |
| Exception list reduced to `["need"]` | 0 |
| Added `"test"` to banned words | 0 |
| Sentence cap: 25 → 24 | 2 — two assertions failed |

**Smallest fix:** Add exactly one seal assertion per exported policy value, including regex source/flags and lists. Other tests should import the values instead of duplicating them.

### MUST 5 — Several `implemented` rows lack clause-pinning evidence

**Files:** `REQUIREMENTS.md:358–364,483–484,539`; `packages/nana-pack/tests/writing-check.test.mjs:40–108`; `packages/nana-setup/tests/writing-rule.test.mjs:37–84`

All 14 reviewed rows have one `shall` and recognizable EARS forms. Marker presence is green; clause coverage is not.

**Executed mutations:** All four changes below left the checker tests green:

| Row | Broken clause |
|---|---|
| R-743 | Forced every CLI finding’s line number to `1` |
| R-746 | Reported only the first banned occurrence per line |
| R-747/R-748 | Made the CLI ignore `--report` |
| R-749 | Removed the CLI’s summary output entirely |

Additional gaps:
- R-373 cites a symlink-only test for a row that also promises a Windows copy. Running that test with `NANA_SETUP_PLATFORM=win32` fails.
- R-374/R-375 tests do not assert the promised remediation text.
- R-301’s new writing-rule citation passes. Its existing “four hooks” claim still cites a loop covering only three; the adoption hook remains separately untested under R-357.

**Smallest fix:** Add CLI-level assertions for the missing clauses and a Windows-copy fixture. Assert remediation content. Until then, split or downgrade the unpinned clauses rather than marking the whole rows implemented.

### SHOULD 1 — Passive findings need calibration and an explicit limitation

**Files:** `packages/nana-pack/lib/writing-config.mjs:18–30`; `packages/nana-pack/lib/writing-check.mjs:67–82`

I labelled 12 passive sentences and 12 non-passive sentences containing “is” or “was”: ten active progressives and two copular descriptions.

**Results:** TP 7, FN 5, FP 2, TN 10 — **77.8% precision, 58.3% recall** on this small diagnostic set.

Misses included:
- “The message was sent by Jake.”
- “The task is done by Jake.”
- “The evidence is needed by Jake.”
- “The build was carefully tested by Jake.”
- “The rule is read by every worker.”

False positives included “Jake is green with envy” and “The desk was wooden.” The real handoff also flags “the rail are green.”

**Smallest fix:** Call these *passive candidates*, document the measured limitation, and retain the labelled fixtures. Reconsider the prefix exception that exempts genuine passives such as “is needed.” That change needs a contract/test revision.

### SHOULD 2 — Trial aggregation and stopping remain manual

**Files:** `packages/nana-pack/lib/writing-check.mjs:160–173`; `packages/nana-pack/README.md:239–268`; `docs/reviews/writing-trial-2026-10-04/design-ruling.md:153–169`

`over/sentences` is computable. The summary cannot provide a verdict-first **share** across files: it retains only the first non-null verdict.

**Executed evidence:** One passing report followed by one failing report produced a combined `verdict=yes`.

There is no checked-report counter, landing-date record or lost-detail counter. Manual collection is consistent with the ruling, but the README does not explain the procedure.

**Smallest fix:** Document one invocation per report and a simple seat-maintained tally: reports checked, verdict passes, over-cap counts, landing date and lost-detail complaints. State the stop condition there: day 14 or 20 reports, whichever comes first; stop earlier after two lost-detail complaints.

### SHOULD 3 — Foreign-file refusal follows the ruling but overstates installation failure

**File:** `packages/nana-setup/lib/steps.mjs:137–155`

A foreign `AGENTS.md` causes exit 1, including during dry-run. However, installation **continues through the other steps**; it does not abort the whole install.

**Executed evidence:** Foreign regular files, dangling links and links into another repository stayed untouched. The CLI exited 1 while still creating other configuration files.

**Smallest fix:** Fable should reconsider whether an optional style trial warrants an installation failure. At minimum, explain partial success and offer a preservation-first integration procedure, rather than implying that replacing existing user instructions is the remedy. This behavior matches R-374 today; it is not a worker deviation.

## Notes and verification

### NOTE — Pi delivery otherwise works, including reviewer and worker sessions

**Files:** `packages/nana-setup/claude/rules/nana-writing.md:3–5`; installed pi `dist/core/resource-loader.js:115–190,460–466`

I executed pi 1.0.2’s `DefaultResourceLoader` with project trust both false and true. It read the symlinked user rule in both cases. Project instructions, including a project `AGENTS.override.md`, **add another context layer**; they do not replace the user layer.

This is not unconditional “every session”: user-directory overrides and explicit context disabling remain exceptions.

Neither pack runner disables context loading, so `pi-review` and `pi-worker` inherit the rule. The explicit exclusion of reviews and worker reports makes that acceptable provisionally: exact paths remain appropriate in those technical records. Monitor the first post-install review corpus as the ruling requires.

### NOTE — R-376’s citation is mechanically valid, but proves less than the prose implies

**File:** `REQUIREMENTS.md:485`

The cited test exists, runs the real checker and passes with zero findings in normal, non-report mode. That is valid evidence for the literal row. Using non-report mode is appropriate; the rule is not itself a Jake-facing report.

The wording deviations are reasonable for Fable to ratify. However, the evidence does **not** establish compliance with the human sentence cap: the 27-word sentence escapes through wrapping. Keep the test citation; move the deviation ruling into the review record and shorten that sentence when fixing the measure.

### NOTE — Installer safety checks passed within the exercised scope

**Files:** `packages/nana-setup/lib/steps.mjs:121–158`; `packages/nana-setup/lib/doctor.mjs:246–251`

- Dry-run created no writing-rule target.
- Foreign files and links remained unchanged.
- Simulated win32 installation created a byte-identical regular copy; the second run was unchanged.
- A before/after filesystem snapshot around doctor matched, including contents, links, modes and mtimes.
- Native Windows execution was not performed.

### NOTE — Full diff includes main’s later acceptance work, not branch-authored deletion

**Files:** `HANDOFF.md:52`; `docs/reviews/pi-1.0-2026-10-04/acceptance.md:1` on main

I read all of `git diff main..HEAD`. Main is now `64a3297`; the merge base remains the brief’s `5ef596a`.

The apparent acceptance-record deletions and handoff rollback disappear in `git diff main...HEAD`: they are main-only work since the branch point. Preserve them during integration; do not apply the two-dot diff as a replacement patch.

## Executed check results

| Check | Result |
|---|---|
| Checker tests | 11 passed |
| Writing-rule tests | 8 passed |
| Installer tests | 75 passed |
| Requirement rail | 533 rows; 459 implemented/traced |
| `map:check` | 167 modules; zero problems |
| `readme:check` | Exit 1: five missing worktree paths |
| Full `npm test` | **89 PASS, 1 FAIL, 1 SKIP** across 91 files; 5,415 checks passed |

The sole failing test file was `readme-check.test.mjs`. Its missing paths are the same worktree dependency artifacts recorded in the previous land ruling, not new writing-lane claims.

Real-text runs:
- `HANDOFF.md`: 129 counted chunks, 52 over cap, 15 passive candidates, one banned occurrence.
- `land-ruling.md`: 124 chunks, five over cap, eight passive candidates.
- Seat-style fixtures exposed the verdict and formatting failures above. Versions and dotted paths stayed intact; abbreviations split early as documented.

No repository changes were made.

**VERDICT: BLOCK — 6/10.**
