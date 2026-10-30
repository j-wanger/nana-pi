VERDICT: DONE

# hive-render · build 3 technical record

Feature: FEAT-039. Branch: feat/hive-render. This build serves the discovery priority: the owner can inspect the real product structure and its decisions.

## Commits and files

- `7e6300d5`: merge `origin/main` (`d36b6af2`) and swap Pages to the real audit. Its parents retain both lanes. README conflict resolved as a union; `docs/code-map.md` and `docs/requirements-tree.md` regenerated. Incoming HANDOFF and session changes were accepted unchanged, not authored here.
- Follow-up commit, named in the final response: combine the artifact's reader paths, include directory-ending slashes in code-name formatting, and record verification. It follows the green locked full suite below. Final-tip checks and hosted CI are reported in the final response rather than predicted here.

| Item | Files | Change |
|---|---|---|
| Swap | `.github/workflows/pages.yml`, `scripts/hive-page.mjs` | Derive `$RUNNER_TEMP/components.json` before the hive step; pass `--data`; import `checkComponentData` and refuse its first problem before staging output. Identity scan stays before upload. |
| Real-data presentation | `apps/hive/main.mjs`, `apps/hive/index.html` | Pack measured labels around overlays and each other, retaining leaders anchored to structures. Voice switches redraw label placement even with motion off. Existing rail already scrolls internally. |
| Technical card | `apps/hive/text-layer.mjs`, `apps/hive/index.html` | Safe DOM code names, monospace face, unbreakable segments and explicit slash break opportunities. Directory-ending slashes stay inside code. |
| Contracts and documentation | `REQUIREMENTS.md`, `README.md`, `apps/hive/README.md`, generated maps | Add the swap row and artifact reader; explain real Pages data and the fixture local default. |
| Tests | `packages/nana-pack/tests/hive-page.test.mjs`, `packages/nana-pack/tests/pages-workflow.test.mjs` | Two swap cases; two necessary existing-case adaptations below. |
| Requested notes | `docs/known-bugs/FEAT-039.md` | Append exactly the four lines supplied in build brief 3. No existing bug was rewritten or fixed. |
| Evidence | This report, `build3-mutation-*.txt`, `build3-audit-output.txt`, `build3-suite-record.json` | Red mutation output, audit diagnostics and the complete per-file green suite record. Screenshots remain outside git. |

The original layout, architecture builders, palette, camera helper, voice tabs, one-card layout and phone picker remain. `apps/hive/layout.mjs` needed no change: it already places the real 15 workflow and eight governance components without overlapping bounds.

## Every row, claim and test changed

- **R-3139** is the only new or modified requirement row authored in build 3. It is `implemented`, with backticked evidence for both swap cases below. No requirement status from build 2 changed.
- A-086 gains `scripts/hive-page.mjs` as a code reader beside its existing audit reader. There was no A-086 park line to remove.
- Main's R-3100–R-3110 and audit artifact were merged unchanged. No IDs outside the brief's allocation were authored.

| Test | Change | Wrong code → correct code |
|---|---|---|
| `pages-workflow.test.mjs::R-3139: Pages derives the real audit before passing it to the hive` | New tagged synchronous case: audit/data step order and no ignored failure. | Fixture-only workflow fails (exit 1); real audit pipeline passes (exit 0). |
| `hive-page.test.mjs::R-3139: builder refuses contract problems by their first name before creating output` | New tagged awaited case, 20-second case limit. Invalid project, empty components, unknown status, traversal part and negative activity each fail by the validator's first problem with no output directory. | Name/version-only acceptance fails (exit 1); complete imported validation passes (exit 0). |
| `hive-page.test.mjs::R-3130: builder copies exact app bytes and supplied data and refuses incompatible input atomically` | Existing generic error assertion became false after importing the validator; expect its named contract/version problem. Exact-copy and atomicity checks remain. | No separate new test or mutation claimed. |
| `hive-page.test.mjs::R-3126: rail order and active cards retain the complete component story` | Existing paragraph text-node equality became false with inline code children; aggregate descendant text instead. All story, voice, order and active-card checks remain. | No separate new test or mutation claimed. |

Each new case ran red against the existing obvious wrong implementation before implementation. Later code-only mutations reproduced both failures independently; their complete output is committed. Assertions were not inverted. No other new test or new sealed tunable was added. There is no new line-by-line text reader. Suite fixtures stay in OS temp folders; no suite case imports, runs or copies a seat script.

## Precedent and departures

All four brief precedents were read completely before design.

| Precedent | Followed | Departure and reason |
|---|---|---|
| `.github/workflows/pages.yml` | Keep product build, hive build, both scans and upload order. | Add the audit producer and data argument exactly at the planned swap boundary. |
| `scripts/hive-page.mjs` | Retain copy/stage/rename, CLI data handling and loopback server. | Replace shallow validation with the imported audit validator; errors now name its first problem. No validator was copied. |
| `apps/hive/text-layer.mjs` | Keep the pure reading model, explicit document/container and safe DOM construction. | Technical paragraphs now contain code-name spans and slash-only break opportunities instead of one body-font text node. |
| `apps/hive/layout.mjs` | Use the existing deterministic centre/ring placement unchanged. | No departure. Browser construction confirms 23 component ancestors in contract order and governance outside workflow bounds. |

No private helper was copied or moved. No desk module was changed or imported.

Two literal plan forms needed ledger-compatible spelling, without changing behaviour:

1. The proposed R-3139 sentence contained two `shall` words; the trace rejected it. The row keeps one `shall` and says “with hive-page refusing…” for the same refusal clause. The second trace run is green.
2. A separate second `Read by: A-086 · code:` line passed the tree's problem count but produced a duplicate-reader note and failed R-2730. The existing code-reader line now lists both paths comma-separated. No test was weakened.

The brief's specific instruction to append four known-bug notes was treated as the exception to its general protected-file rule. Incoming known-bug/session/HANDOFF changes were preserved as the merge union. No other protected-file editing occurred. Git rejects partial path arguments on a merge commit. I staged conflict and implementation paths explicitly before committing; the follow-up uses explicit commit paths. Both message files live under `$TMPDIR`.

## Real-data captures and art-spec judgement

Screenshot folder: `/private/tmp/nana-3dmk-ref/build3/final/`.

- Twelve images: 380 × 1000 and 1280 × 1000; overview, Library in Plain/Technical/From the work, Review ladder (governance), and Key cabinet (absent).
- Captured after the green locked suite through real `component-audit --out` and `hive-page --serve --data`, with `?still` and reduced motion. Real audit and capture both exit 0.
- Build 2's shots are copied beside them at `/private/tmp/nana-3dmk-ref/build2/`; original reference frames remain in the parent folder. `comparisons/` contains twelve three-column sheets. No screenshots or reference assets are committed.
- `browser-checks.json` records real WebGL, 23 structures, 15 workflow/eight governance, one visible card, viewport-width scrollWidth and no page errors at both widths. All 23 overview labels fit without label-label collisions at 1280. The 1280 × 800 rail measures 504 px visible / 610 px content and scrolls 106 px to chapter 23.
- Technical code-name segments use monospace and `white-space: nowrap`; slashes supply the only internal path break opportunities. Library's longer decision text remains inside the existing scrollable card, not stacked cards.

Two exploratory rounds preceded the final capture. Round 1 failed typography/label legibility because Drafting table/Review ladder and Release route/Desk overlapped. Round 2's measured placement removed both overlaps. The final post-suite capture confirms the same result. No third repair round was needed.

| Art-spec line | Verdict | One reason from the final side-by-side judgement |
|---|---|---|
| 1 · Full-page scene | PASS | Both viewport sizes remain edge-to-edge models with floating overlays, not a boxed canvas. |
| 2 · Detailed, legible depth/light/shadow | PASS | The fuller campus preserves floors, braces, cranes, civic gatehouses and cast shadows; dark Library and empty foundations remain distinct. |
| 3 · Restrained monochrome | PASS | White/grey built structures and ink/dark gaps retain build 2's palette without saturated blobs. |
| 4 · Deliberate typography | PASS | Non-overlapping monospace leaders and chapters remain readable; technical code names no longer split at hyphens in the body face. |
| 5 · One readable frosted overlay | PASS | One card stays visible; voices separate explanation, technical detail and the longer internally scrolling decision. |
| 6 · Same object at 380 px | PASS | Phone picker, full-screen architecture and one bounded card remain, without document-width overflow or a card column. |

These are visual judgements, not a claim of pixel equivalence. The reference depicts another product; only its presentation is studied.

## Commands and exit codes

| Command | Exit and result |
|---|---|
| `git fetch origin`; `git merge --no-commit origin/main` | 0; 1 for the three expected conflicts, subsequently resolved. |
| `npm run map:impact -- scripts/hive-page.mjs apps/hive/main.mjs apps/hive/text-layer.mjs apps/hive/layout.mjs` | 0; inspected callers/callees before edits. |
| `npm run -s req:tree`; `node scripts/code-map.mjs --write` | 0 each; regenerated conflicts rather than choosing one side. |
| New tagged tests against old code | Both fail; later independent code mutations each exit 1, committed output. |
| `node packages/nana-pack/tests/hive-page.test.mjs` | 0; 11 checks. |
| `node packages/nana-pack/tests/pages-workflow.test.mjs` | 0; four checks. |
| `node packages/nana-pack/tests/hive-assets.test.mjs` | 0; three checks, unchanged seals. |
| `node packages/nana-pack/tests/first-look.test.mjs` | 0; five checks, unchanged. |
| Component-audit test in a temporary clone of merged main, with candidate ledger | 0; 11 checks before merge commit. The real audit checks tracked-at-HEAD, so its new scripts become visible in this worktree only after recording the merge. |
| `npm run test:locked` (first) | 1; 8718 pass / one fail: duplicate artifact code-reader declaration, since fixed. |
| `node packages/nana-pack/tests/requirements-deliverables.test.mjs` | 0 after combining readers; 21 checks. |
| `npm run test:locked` (second) | 0; plain foreground command, output on screen, one default machine lock. Summary below. |
| `npm run map:check` | 0; 490 modules, zero problems. |
| `npm run readme:check` | Initial 1 for flags associated with the wrong adjacent script mention; separated prose, then 0, 883 claims. |
| `node scripts/requirements-trace.mjs` | Initial 1 for the plan's two-shall sentence; one-shall wording then 0, 2181 rows, 1936 traced, zero EARS problems. |
| `node scripts/requirements-tree.mjs --root .` | 0; final reader declaration yields no notes and zero problems. |
| `node scripts/known-bugs.mjs --root .` | 0; `summary names=0 sizes=0`. |
| `node scripts/identity-scan.mjs` | 0; no findings. Repeated after final commit. |
| `node scripts/component-audit.mjs --out <temp file>` | Before merge commit: 1 for new scripts not yet at HEAD; after merge commit: 0. Diagnostic stdout is committed. |
| `node /tmp/hive-build3-capture.mjs final` | 0; all required real-data captures after the green suite. Earlier exploratory captures accepted the pre-commit audit's named tracked-at-HEAD errors, not a final pass. |
| `node /tmp/hive-build3-compare.mjs` | 0; twelve comparison sheets. |

Green pre-follow-up suite summary:

`238 files: 236 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8719 pass, 0 fail, 44 skip · 574.8s`

The final response supplies the repeated last-commit suite and seat-check results. The committed suite record retains all 238 file outcomes without pasting the long run into the report.

Frozen contract SHA-256: `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`.
Frozen fixture SHA-256: `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`.

## Closed findings

- Replaced fixture-only Pages publication with the real audit and full imported validation.
- Removed the two observed label collisions and kept labels clear of reading overlays.
- Replaced mid-hyphen body-font path wrapping with monospace slash breaks.
- Combined duplicate artifact reader kinds after the full suite exposed the invalid declaration.

## Writing check

`nana-writing --report` ran on this technical record (exit 0, report-only diagnostics). Its owner-prose verdict, identifier and passive-voice findings remain because the writing rule explicitly excludes worker reports and technical records. The brief requires the first-line format, paths, row IDs and command evidence here.

## Not done / retained limits

- No independent review, merge to main or deployment was performed. Hosted CI is checked after the final push; its finished result belongs in the final response.
- No contract, fixture, vendored bytes, product report, desk, audit judgement or component-audit implementation was changed.
- The four supplied audit known bugs remain limitations, not fixes. The supplied note says 18 sound; this real source actually has 17 sound, three partial, one gap and two absent. The requested wording was preserved rather than silently correcting the audit lane's note.
- No other listed known bug was changed. In particular, first-look's product-view limits and outside-reader's product-only views remain.
- No dependency install, model session, subagent or GitHub issue creation/edit/comment/closure occurred. Open questions: none introduced.
