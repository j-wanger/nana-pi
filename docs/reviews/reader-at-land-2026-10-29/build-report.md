# Reader-at-land build record

Feature: FEAT-039 · See the product and its decisions in one report

## Scope and evidence

R-3060–R-3067 are implemented. R-1140 now names fourteen guide bullets. No new share, artifact registry entry or known-bug edit was needed: the outputs are per-run temporary records, not a stable artifact location.

| Row | Test file | Exact title |
|---|---|---|
| R-3060 | packages/nana-pack/tests/outside-reader.test.mjs | R-3060: prompt orders bounded purpose, bugs, diff and both-width page views |
| R-3061 | packages/nana-pack/tests/outside-reader.test.mjs | R-3061: pi runs once cold through the sealed watchdog in an empty external cwd |
| R-3062 | packages/nana-pack/tests/outside-reader.test.mjs | R-3062: recorded honest quotes pass and an invented finding is marked |
| R-3063 | packages/nana-pack/tests/outside-reader.test.mjs | R-3063: none prints only zero findings and asks for nothing |
| R-3064 | packages/nana-pack/tests/outside-reader.test.mjs | R-3064: missing browser, model or objective degrades without a launch |
| R-3065 | packages/nana-pack/tests/outside-reader.test.mjs | R-3065: failed, empty and timed-out attempts keep only the prompt and fail in one line |
| R-3066 | packages/nana-pack/tests/outside-reader.test.mjs | R-3066: outside-reader values retain their sealed provenance |
| R-3067 | packages/nana-setup/tests/seat-rule.test.mjs | R-3067: seat guide carries the outside-reader timing, output and defect rule |

## Wrong implementation → correct implementation pairs

Before implementation, `runOutsideReader` returned 0 without doing work, `checkQuotes` returned an empty list, and the config's finding count was 4. The guide still had thirteen bullets. The tests and assertions were not inverted.

- R-3060: missing prompt → ordered, capped prompt and file URL, green.
- R-3061: zero launches → one cold watchdog call and saved answer, green.
- R-3062: zero parsed findings → four recorded findings pass; invented fifth misses, green.
- R-3063: no output → exact none line, green.
- R-3064: no degradation line → each missing capability prints one line without launching, green.
- R-3065: success/no cleanup → failure line, prompt retained, stale answer removed, green.
- R-3066: finding limit 4 → sealed limit 3 and remaining config pins, green.
- R-3067: missing bullet → exact new bullet once, green.

The first wrong-code command ran the reader test and seat test sequentially; both printed their expected failures, and the shell exited 1. Reader tests later exited 1 once because the integration fake repeated only the beginning of the recorded page under every view's cap. The fake now distributes the recorded page across views. The direct fixture assertion already passed and was unchanged.

## Sealed values and provenance

All definitions live in `scripts/outside-reader-config.mjs` and are pinned by R-3066's one check.

- MAX_FINDINGS 3: chosen, plan O3, one fewer than the one-off's padding-prone fixed four.
- READER_VIEWS landing, overview, product, decisions, issues: measured one-off render; named views validated against PRODUCT_VIEWS.
- VIEWPORT_WIDTHS imported by name from first-look (380, 1280), not redefined.
- VIEWPORT_HEIGHT 1000: chosen to follow first-look.
- VIEW_TEXT_CAP 4000 and PHONE_LANDING_TEXT_CAP 6000 characters: one-off render.mjs, 2026-10-29.
- DIFF_CAP 4000 and KNOWN_BUG_CAP 6000 characters: chosen to add 10K to the measured 29,884-character page, instead of the entire 17,378-byte bug file. The hard page maximum is 42K; prompt instructions, objective, headings and omission notice are additional.
- PROMPT_PATH packages/nana-pack/prompts/outside-reader.md: chosen beside planner.md.
- KNOWN_BUG_FEATURE FEAT-039: plan's product-page scope.
- ROSTER_SLOT_ORDER scout, land, builder: plan Q3 default, skipping non-pi entries.
- STALL_SECS Infinity: flat thinking can be healthy; worker-config's Claude builder precedent.
- RETRIES 0, MAX_SECS 600: plan A8, working one-off rerun's ceiling; one attempt only.
- POLL_SECS 15: chosen to match pi-review's parseWatchdogArgv default. The watchdog requires callers to supply it; its direct API has no default.

## Precedent and departures

All named precedent files were read. The resolver moved verbatim into the same scripts directory; first-look's behavior and tests stayed unchanged. The reader imports the watchdog, reviewer child environment, roster resolver, active agent directory, known-bug directory and first-look configuration rather than copying those helpers.

New answer format: numbered findings (`1.` or `1)`), straight or curly quotes, preamble discarded. A match on any quote passes the finding. Raw model output remains in reader.md; stdout adds the unmatched mark. Empty views or missing diffs fail with a bounded capture note rather than starting the reader.

One addition to the plan's listed watchdog options was needed: explicit pollSecs, sealed at 15 seconds. The first real run exposed a busy poll loop because runWatchdog has no polling default; pi-review supplies it through its parsed options. The reader now follows that effective precedent. No shared launcher was edited. The new viewport height follows first-look rather than the one-off's two different heights; the plan requires first-look's widths, and no height-specific behavior. Watchdog progress stays on stderr as in its existing callers; the command's failure line contains no raw child text.

The tracked build brief's machine-specific scratch path failed identity-scan before the feature. It was replaced with a generic location description, not allowlisted. Fixture contents remain unchanged.

## Existing tests changed

Only `packages/nana-setup/tests/seat-rule.test.mjs`: header/comment and bullet-count title now say fourteen; RULE_14 joins RULES; one R-3067 check pins the exact bullet. RULE_1–RULE_13 remain byte-identical. `packages/nana-pack/tests/first-look.test.mjs` is unedited.

## Commands before the implementation commit

- `npm run map:impact -- scripts/first-look.mjs`: 0.
- `npm run map:impact -- packages/nana-setup/tests/seat-rule.test.mjs`: 0.
- `node packages/nana-pack/tests/outside-reader.test.mjs`: 0, seven checks.
- `node packages/nana-setup/tests/seat-rule.test.mjs`: 0, sixteen checks.
- `node packages/nana-pack/tests/first-look.test.mjs`: 0, four unchanged checks.
- `npm run map`: 0, 469 modules.
- `npm run req:tree`: 0, 2140 rows, 39 features.
- `npm run readme:check`: 0, 816 claims.
- `node scripts/requirements-trace.mjs`: 0, 1898 implemented rows traced, zero EARS violations.
- `node scripts/identity-scan.mjs`: initially 1 for the brief path; after the scrub, 0.
- Lane-class on the planned files plus the map and scrubbed brief: 0, ordinary.
- `npm run test:locked`: 0, plain foreground, full output on screen as requested.

Suite summary: `234 files: 232 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8678 pass, 0 fail, 44 skip · 560.6s`.

## Real run

After the first green locked suite, cloned implementation commit `09a373cd` into OS temporary storage, added a local main ref, and changed only the report heading `Needs you` to `Your urgent decisions`. The disposable clone committed this trial change so first-look's HEAD comparison could see it. PW_ROOT pointed at the existing main checkout, following the documented plain-clone fallback limitation. Both commands ran without injected seams and exited 0.

- `npm run first-look -- --page product --out <temporary-folder>/reader-at-land-real-look`: `first-look: saved screenshots and accessibility diff in <temporary-folder>/reader-at-land-real-look`.
- `npm run outside-reader -- --from <temporary-folder>/reader-at-land-real-look --out <temporary-folder>/reader-at-land-real-read`: `outside-reader: 1 findings, 0 quotes not found; saved in <temporary-folder>/reader-at-land-real-read`.
- The roster selected its land pi entry, openai-codex gpt-6-astra. The finding said the new urgent heading contradicted zero blocking asks. Classification: 1 new, 0 already-known, 0 noise. This is the intentionally introduced trial defect, not a defect in the lane tree.
- Full stdout/stderr, with temporary paths redacted, is in `real-run.txt`. No screenshots, generated report, prompt or raw page text from this trial entered git.
- Real-run observation: the watchdog printed `flat=…/NaN` rapidly because pollSecs was absent. It still returned the finding. The caller fix and sealed-value pin then went through red/green: R-3066 failed on undefined versus 15; after the config definition, R-3061 failed on the missing caller option; after wiring, all seven reader checks passed. No second real model run was made.

## Additional checks and limits

`node packages/nana-setup/bin/install-check.mjs` ran locally on macOS because this lane touches the seat guide. Exit 1: `FAIL pi post-edit — write-error: write tool result is marked as an error`. All other measured items passed. The sanitized output is in `install-check.txt`; the command retained its temporary home. This is outside the reader and its changes, so no install, hook or gate code was edited. The failure remains for the seat to assess before land.

The first-look resolver change touches the module associated with its existing live-issue diff, age-line noise and plain-clone fallback limits. None was fixed or widened; the real run used PW_ROOT as already documented. No known-bug file was edited.

No CI run was requested or started. Windows execution was not available locally; no new test uses a real browser or model. No issue was created, edited or commented on. HANDOFF and session archives were not edited.

The final follow-up commit adds the poll interval and its pins, plus this real-run record. It follows a second plain-foreground locked suite: exit 0, `234 files: 232 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8678 pass, 0 fail, 44 skip · 557.5s`. Required checks are repeated on that last commit, and their exit codes belong in the builder's final report.
