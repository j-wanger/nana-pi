# issues-home · build 2 technical record

VERDICT: PARTIAL

Implementation and local verification are complete. The seat must add the plan's FEAT-039 known-bug line; builder scope forbids that folder. Hosted CI will be reported separately after the source commit.

## Commit and scope

Commit subject: `feat: read opted-in GitHub issues at session start` on `feat/issues-home`.

Rows R-2970–R-2979 are implemented with backticked test-title evidence. R-2978 belongs to FEAT-028 as the plan explicitly directs. A-084 registers the manual issue set and its code reader in FEAT-002. No HANDOFF, known-bug file, session archive, desk source, other lane or main checkout was edited.

### Must-meets (titles verbatim)

| Item | Row | Test file | Test title |
|---|---|---|---|
| 1 · opt-in | R-2970 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2970: only list-free issue pointers opt in and legacy bytes stay unchanged |
| 2 · query/filter | R-2971 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2971: one pinned gh call filters author and labels and warns at the cap |
| 3 · block | R-2972 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2972: issue titles appear once within caps with blocking then next then asks |
| 4 · failure | R-2973 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2973: issue failures name cause time and URL without losing Next or check |
| 5 · end-to-end bound | R-2974 | packages/nana-setup/tests/hook-deadlines.test.mjs | R-2974: late-start objective hook keeps Next timeout and check lines when gh hangs |
| 6 · roles | R-2975 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2975: worker and reviewer paths never invoke gh |
| 7 · name check | R-2976 | packages/nana-pack/tests/identity-scan.test.mjs | R-2976: stdin scan prints only hit indices and counts with clean hit and bad-use exits |
| 8 · migration | R-2977 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2977: real HANDOFF Next and Open sections are pointer-only |
| 9 · maintained artifact | R-2978 | packages/nana-pack/tests/handoff-issues.test.mjs | R-2978: GitHub issue artifacts require the sealed location shape and register this issue set |

### Sealed tunables

All definitions are in `packages/nana-pack/lib/frontier-summary-config.mjs`; each has its own R-2979 test in `handoff-issues.test.mjs`.

- `ISSUES_READ_LIMIT_MS = 1500` — `chosen 2026-10-28 (R-2979): 1.6 times the 0.90 s warm maximum across 15 calls per CI OS in run 40693949252; covers cold macOS/Linux (1.31/1.27 s), not cold Windows (6.39 s).`
  - Test: `R-2979: seal issue read limit at 1500 ms`.
- `ISSUES_WRITE_RESERVE_MS = 250` — `chosen 2026-10-28 (R-2979): reserve for rendering and writing after gh, within the measured launcher's 2,500 ms cap.`
  - Test: `R-2979: seal issue write reserve at 250 ms`.
- `ISSUES_FETCH_CAP = 100` — `chosen 2026-10-28 (R-2979): three times the migrated set of 30 open issues, rounded up.`
  - Test: `R-2979: seal issue fetch cap at 100`.

### Files by item

- Shared gh moves: `packages/nana-pack/lib/gh-runner.mjs`, `packages/nana-pack/lib/ci-records.mjs`, `packages/nana-pack/bin/nana-land.mjs`, `scripts/ci-records.mjs`. `firstLine` has one definition, exported from gh-runner and imported back into ci-records. Both `ghDefault` and `ghEnvironment` are re-exported from nana-land. ci-records still supplies `CI_READ_TIMEOUT_MS` and `GH_OUTPUT_MAX_BYTES`.
- Items 1–6: `packages/nana-pack/lib/handoff-issues.mjs`, `packages/nana-pack/lib/frontier-summary.mjs`, `packages/nana-pack/lib/frontier-summary-config.mjs`, `packages/nana-pack/lib/markdown-list-sections.mjs`, `packages/nana-pack/bin/nana-frontier-summary.mjs`, `packages/nana-setup/lib/hook-producer.mjs`; tests listed above plus the golden test. The unchanged pi extension consumes the updated shared library.
- Item 7: `scripts/identity-scan.mjs`, its existing test, root README command contract.
- Item 8: new static test only; seat commit already supplied the correct HANDOFF.
- Item 9: `scripts/deliverables.mjs`, `REQUIREMENTS.md`, the new artifact case and the existing sealed-class case.
- Rule/contract updates: `AGENTS.md`, `templates/_shared/working-under-nana-pi.md`, `packages/nana-setup/claude/rules/nana-soul.md`, `packages/nana-pack/README.md`, `README.md`.
- Generated views: `docs/code-map.md`, `docs/requirements-tree.md`.
- Evidence: this folder's `wrong-code.txt`, `mutations.txt`, `targeted.txt`, `targeted-suite.txt`, `deadlines.txt`, `map.txt`, `map-check.txt`, `readme-check.txt`, `trace.txt`, `tree.txt`, `known-bugs.txt`, install-check logs and exact session-start captures.

## Wrong-code pairs

`wrong-code.txt` retains build 1's baseline failures and build 2's corrected baseline. The initial static migration and existing role exclusion were already correct. The initial legacy oracle needed canonical macOS paths and the checker's actual word counts; appending a pointer paragraph changes the checker word count even when list asks keep the project opted out. That oracle was corrected before implementation.

`mutations.txt` retains full output for 11 code mutations. Every wrong run exited 1 with the named row failing; every restored run exited 0. No assertion was inverted.

| Row | Wrong code |
|---|---|
| R-2970 | Ignore list entries when detecting opt-in |
| R-2971 | Omit `github.com/` from the repository argument |
| R-2972 | Remove issue-number deduplication |
| R-2973 | Suppress the failure line |
| R-2974 | Do not subtract elapsed producer time |
| R-2975 | Remove the role early return |
| R-2976 | Ignore stdin mode |
| R-2978 | Accept every GitHub-issue location |
| R-2979/read | Retune 1500 to 1600 |
| R-2979/reserve | Retune 250 to 251 |
| R-2979/cap | Retune 100 to 101 |

R-2974 also checks the exact runner timeout below the cap, at the cap and with no time left, using an injected process clock. The real late-start hook case remains the end-to-end check on every OS. New text-parsing cases include CRLF, trailing spaces/tabs and no final newline.

No mutation of R-2977 was attempted: its subject is the real HANDOFF, which this builder may not edit. R-2975's baseline was already green because the role check predates this lane; its destructive pair was run after integration. These are the two wrong-first exceptions.

## Commands and exit codes

- `npm run map:impact -- <affected modules>` — 0, before editing mapped code.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON packages/nana-pack/tests/handoff-issues.test.mjs` against baseline — 1; after implementation — 0 (10 checks).
- `node packages/nana-setup/tests/hook-deadlines.test.mjs` — 0; full suite and mutation-restoration runs include the strengthened exact-budget assertion (7 checks).
- `node scripts/test.mjs identity-scan frontier-golden frontier-summary ci-records land.test hook-producers product-report requirements-deliverables templates-render` — 0. `11 files: 11 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 403 pass, 0 fail, 0 skip · 260.5s`.
- Manual mutation driver in OS temp — 0; all 11 wrong/restored pairs are 1/0.
- `node packages/nana-setup/bin/install-check.mjs` — 1 initially: inherited builder `NANA_WORKTREE_ROOT` blocked the instrument's temporary write fixture, not an issue-reader failure. Retained instrument data confirmed the lane boundary as the cause.
- `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` — 0 in the ordinary seat environment, including pi post-edit and both affected hooks. No install-check source was changed. This second invocation departs from the brief's single-run wording because the required green check needed a normal seat environment.
- `npm run map` — 0; `npm run map:check` — 1 once for stale generated output, then 0 after regeneration.
- `npm run readme:check` — 0.
- `node scripts/requirements-trace.mjs` — 0; 2079 rows, 1837 implemented/traced, 0 off-form EARS rows.
- `node scripts/requirements-tree.mjs --write` — 0; 0 tree problems, 2079 rows, 39 features. Before commit, its report-only note correctly named the new reader not yet tracked at HEAD; the post-commit check is required separately.
- `node scripts/known-bugs.mjs` — 2 (required `--root` omitted); `node scripts/known-bugs.mjs --root .` — 0, names=0 sizes=0.
- `npm run test:locked` — 0, plain foreground, output on screen, one machine lock. `228 files: 226 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8593 pass, 0 fail, 44 skip · 562.9s`.
- Live working and absent-gh producer captures — both 0, not suite tests; no test called the network.
- `git diff --check` — 0 for source changes after removing two trailing spaces. After staging raw test output, `git diff --cached --check` returns 2 on stdout's trailing spaces and its final blank line; these are preserved as test evidence, not source formatting.
- `node scripts/identity-scan.mjs` after staging evidence — 1 on machine account names in captured absolute paths; paths were redacted and the final-tip scan must return 0.

Final-tip check results and the commit SHA belong in the closing worker message.

## Exact session-start blocks

The files preserve the actual producer output, including the Claude tag and final newline, except the machine-specific absolute HANDOFF path is replaced by `<lane-worktree>/HANDOFF.md`. The required identity check rejects the account name in that path. Other evidence logs likewise redact home paths or omit unrelated warning blocks containing them. This is a privacy-required departure from byte-exact public captures; titles, counters, timing, whitespace and all other lines remain as printed.

- `session-start-working.txt`: working gh, the real repository's current issue set. At capture: 3 Next items, 28 asks; no fetch-cap warning or output omission.
- `session-start-absent.txt`: command seam set to a nonexistent executable; one `cannot start gh` line with the measured 11 ms elapsed time, local Next line and frontier check preserved.

The pi section is the same block without the tag line. R-2612's existing golden case now runs both paths against the same command-seam fixture. Failure timings and the live issue set can naturally change on later reads.

## Precedent and departures

- Followed the existing renderer, prompt cleaner, title/output caps, priority selection, role guard and checker-summary function. The opted-in form displays blocking asks before Next and remaining asks, while the legacy branch remains byte-identical. This ordering difference is required by must-meet 3.
- Followed the producer's fail-open CLI and the launcher's computed limit. Only the frontier definition opts into appended `--limit-ms`; producers that do not consume it retain their argv.
- Completed exactly the five named gh moves (`firstLine`, `ghResult`, `ghFromEnvironment`, `ghEnvironment`, `ghDefault`). No additional private helper blocked a move. No helper was copied.
- Extended the existing Markdown scanner to return fence-free section bodies as well as entries. This avoids copying its private fence/heading scan just to read pointer paragraphs. This API addition was not forecast in the precedent list; must-meet 1 covers it.
- The new issues-URL parser deliberately does not call `githubRepoOf`: that helper parses repository remotes, not `/issues` pointers. The attack and plan explicitly require this difference.
- The golden test injects the shared command seam into both paths instead of changing the pi extension's API. This exercises the actual shared reader and leaves the extension unchanged.
- The Windows hook fixture uses the command-seam option from the plan rather than relocating its project. No production Windows branch was introduced.
- The identity stdin path imports no new scanner; it calls the existing exported `countIdentityWords`.
- The artifact parser keeps the existing classes, registry and sealed-shape pattern; the owner-approved seventh class is the plan's explicit FEAT-028 departure.
- No public upstream document or pi API was changed or newly relied on.

## Existing test edits

All are named by the forecast. No existing test was deleted.

- `frontier-golden.test.mjs`: extended R-2612's existing parity case with a deterministic issue world shared by both paths.
- `identity-scan.test.mjs`: added must-meet 7 to the existing file; older cases unchanged.
- `hook-deadlines.test.mjs`: retained the live producer source, reused the late-start preload, added must-meet 5 and exact-budget probes. Existing deadline assertions unchanged.
- `hooks-win32-exec.test.mjs`: injected a fake gh to prevent the inherited opted-in HANDOFF from making a network call.
- `product-report.test.mjs`: appended a well-formed ask to its temporary fixture, because the real HANDOFF is now pointer-only and the existing decisions test requires an ask.
- `requirements-deliverables.test.mjs`: updated the existing sealed class/shape list for the approved seventh class.
- `templates-render.test.mjs`: extended the existing R-682 phrase pin to cover the issues alternative and stdin scan. R-859's byte-equality assertion stayed unchanged.

`frontier-summary.test.mjs`, `hook-producers.test.mjs`, `ci-records.test.mjs`, land tests and known-bug tests needed no edits: their old assertions remain true. The new opt-in cases live only in the brief-named new test file.

## Not done and known bugs

- Seat action, not a builder edit: add one FEAT-039 known-bug line stating that the product page shows zero HANDOFF asks until page-on-pages reads issues. The report fixture now supplies its own ask; production report behavior remains unchanged.
- No listed existing FEAT-002 known bug was fixed. The renderer's previously declared quadratic fill and read/decode early-return limits remain unchanged.
- Hosted Windows verification, review, independent seat check and land are not claimed by this local build record.
- The issues and replies are public. Adopted projects retain the stale working-section notice until `nana-setup project` refreshes their AGENTS section.
