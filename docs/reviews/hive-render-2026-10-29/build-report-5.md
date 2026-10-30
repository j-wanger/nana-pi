VERDICT: DONE

# hive-render · build 5 technical record

Feature: FEAT-039. Branch: feat/hive-render. Spend serves the shared toolkit's product experience: make the product and its decisions readable together.

The final response names the merge commit, its finished CI run and the checks run on that commit. This record accompanies the commit rather than predicting its hash.

## Commit and files

Merge `origin/main` at `8da540e8984c20f707e8fba97c11e9ab2dfbe23b`, then finish the existing full-bleed scene. The merge and model ship in one commit, after a green locked full suite.

| Item | Files | Change |
|---|---|---|
| Capture merge | `scripts/first-look.mjs`, `scripts/first-look-config.mjs`, `packages/nana-pack/tests/first-look.test.mjs` | Retain main's reference manifest, copied references, spec, side-by-side HTML, viewport/full-page shots, reduced motion, ready wait and canvas probe. Retain the lane's R-3133 test and adapt its URL invocation and shot accounting. Re-export the single background definition from `apps/hive/config.mjs`; remove duplicate timeout/probe definitions produced by the automatic merge. |
| Recognizable instruments | `apps/hive/assets/hive.mjs` | Replace the compass mast with a bezel, ticked dial, pointed two-tone needle, pivot and carrying bow. Make an actual belt with sewn pouches, buckle, hammer, screwdriver and spanner. Finish the binoculars with concentric optics, glints, eyepieces, focus wheel, bridge, yoke and grounded mount. Frame a dark pinboard with pinned ruled sheets, ledge, hood and footings. Put round/conical flasks, necks, lips, measurement marks, retort stand, pipework and test-tube rack on an open laboratory bench. |
| Grounding and connections | `apps/hive/assets/hive.mjs`, `apps/hive/main.mjs` | Park recent bees on foundation aprons at their geometry-derived contact height. Only in-flight bees fly, at a larger visible scale. Connect the desk's pale frames; ground chairs, ramp supports, ledger leaves, writing machine, scanner bed, hopper and globe. Attach the scanner head; replace its diagonal scan rods with no invented physical rays. Finish the drafting lamp and crane hook. Connect only immediate orthogonal neighbours, trim walkways to foundation edges and add piers, instead of drawing through instrument centres. Derive label height from actual geometry. |
| Phone footer | `apps/hive/index.html` | Keep the scene full-screen and the existing card/rail. Put the phone's source and links on two wrapping lines over a near-opaque, blurred footer strip. |
| Merge records | `HANDOFF.md`, `docs/sessions/2026-10.md`, `docs/known-bugs/FEAT-039.md` | Accept upstream HANDOFF and session text without authoring either. Union both lanes' added known-bug lines, except the explicitly named duplicate-background bug, now closed. Retain main's removal of the older, already-fixed missing-`--out` guide line. |
| Generated and imported files | `docs/code-map.md`, `docs/requirements-tree.md`, `REQUIREMENTS.md`, `README.md`, `package.json`, main's visual-reader scripts, tests, prompt, seat rule and review corpus | Regenerate tree and map; retain main's visual-check feature without changing its implementation or tests. |
| Evidence | This record, `build5-suite-record.json`, `build5-audit-output.txt`, `build5-capture-observations.json`, `build5-install-check.txt`, `build5-install-check-inherited.txt` | Preserve the complete per-file suite results, real audit output, WebGL/footer observations and isolated install rehearsal. Screenshots remain outside git. |

## Rows, tests and mutation pairs

- **Own requirement diff: none.** This brief names visual corrections, no new must-meet test or ID range. R-3120–R-3134 and R-3139 remain implemented with their original backticked `file::title` evidence. No new tunable or text-line reader was introduced. Existing visual dimensions stay in the injected-THREE builders, as in the precedent.
- **Rows imported from main:** R-1140 changes fourteen seat rules to fifteen, updates its first-look clause and evidence titles. R-3140–R-3148 are added, implemented with main's backticked evidence. No other requirement row changed relative to build 4.
- **Own test edit:** only `R-3133: hive URL capture waits for drawing, reduces motion and names empty or timed-out canvases` in `packages/nana-pack/tests/first-look.test.mjs`. Main's URL mode requires explicit external `--out`, creates one page per width, and takes both full-page and viewport shots. The test now supplies an external output beside a temporary repo, records widths on `newPage`, expects eight shots and four motion/pixel events, and allows the second shot to follow the first. Its title, marker, error cases and ordinary desk capture stay intact.
- **Tests imported from main:** first-look's R-3142, R-3143 and R-3148; visual-reader's R-3144–R-3148; seat-rule's R-3140 and R-3141, updated fifteen-rule count, and removed superseded first-look wording case. Those are upstream changes, not new tests authored here. No unrelated test was deleted.
- **Mutation pairs: none newly required or claimed.** There is no newly authored test in this build. The first capture is the visual wrong-code baseline: build 4's mast/carousel, airborne specks, bare poles and obscured footer. Its replacement is judged in the final capture below; that is a visual comparison, not automated mutation proof.

## Real audit and screenshots

Screenshot folder: `/private/tmp/nana-hive-build5-JaZ8zo/`

- `round1/`: merged capture tooling on build 4's model; visible `RENDERER: WEBGL` at 380 px.
- `round2/`: finished instruments, grounded recent bees, connected frames and readable footer; twenty WebGL overview/detail frames in `details/`.
- `final/`: third and final round, after trimming crossing walkways and deriving label anchors from actual geometry. `manifest.json`, `side-by-side.html`, copied spec/references and 380/1280 viewport/full-page frames come from the required `npm run first-look` command. `details/` contains twenty further WebGL frames: overview and nine component stops at both widths.

No pixel fallback occurred in these captures. The final 380 shot visibly says `RENDERER: WEBGL`. The detail observations also record `webgl` for every frame and a document width of 380 for every phone frame. Both footer lines occupy x=20 through x=360, with y=959–971 and y=973–985; the footer background has alpha 0.93. No reference source file was written. All five supplied reference frames were inspected.

The audit was generated with `component-audit --out` from the merged real source and ledger, then passed to `hive-page --data`. The same audit snapshot was used in all three rounds so activity changes would not obscure the visual comparison.

| Spec line | Round 1 | Round 2 | Final | One reason for the final judgement against the reference frames |
|---|---|---|---|---|
| 1 · Scene is the page | PASS | PASS | PASS | The architectural scene fills both viewports behind the rail/card, preserving the reference's overlaid composition. |
| 2 · Detailed, legible model | FAIL | FAIL | PASS | The dial/needle, pocketed belt/tools, binocular optics, pinned board and flask bench read without their labels; footings and short supported links replace stray poles and crossings. |
| 3 · Restrained monochrome | PASS | PASS | PASS | White/light-grey forms retain ink detailing and cast shadows, without saturated status blobs. |
| 4 · Deliberate typography | PASS | FAIL | PASS | Small-caps labels now anchor at actual object heights; the chapter hierarchy stays distinct from short body text. |
| 5 · One frosted card or rail | PASS | PASS | PASS | One active frosted story card sits over the scene, not stacked data cards. |
| 6 · Same designed object at 380 px | FAIL | PASS | PASS | The full-screen scene, compact picker and one card remain; both footer lines now fit over a protective strip rather than disappear into geometry. |

Round 2 failed line 2 because centre-to-centre walkways still intersected instruments. It failed line 4 because the old constant-height labels pointed above shortened instruments. Round 3 fixes both. These are builder judgements, not the seat's independent visual-reader verdict. No fourth round was run.

## Precedent and departures

All four named precedents were read completely before designing.

| Precedent | Followed | Departure and reason |
|---|---|---|
| `apps/hive/assets/hive.mjs` | Keep injected THREE, local box/beam/drum/hoop/fence primitives, shared materials, component ancestors, data-derived cells/activity, empty absent foundations and governance ring. | Replace the five weak metaphors with finished instruments. Add geometry-derived rest heights and label anchors; recent bees now rest rather than hover. Connect or ground incomplete parts and trim walkways to prevent arbitrary crossings. These departures address the judge's specific failures. |
| `apps/hive/config.mjs` | Import/re-export its single sealed `HIVE_BACKGROUND`; leave all sealed values unchanged. | None. |
| `apps/hive/index.html` | Preserve the edge-to-edge scene, one frosted card, rail, voices and phone chapter picker. | Add a two-line protective phone-footer strip because geometry hid the previous line. The story card remains translucent. |
| `scripts/first-look.mjs` | Preserve the hive ready wait, reduced motion, canvas check and bounded errors, using main's reference-capable URL path and shared resolver. | Retire the duplicated lane URL implementation in favour of main's per-width reference capture. An explicit external output and eight before/after images replace the old implicit output/four-image test expectations. Product and desk paths remain unchanged. |

No precedent helper was copied or moved. Main's existing exported `outsideRepo` is imported from `scripts/reader-common.mjs`, not copied. No private precedent helper was needed across module boundaries. No dependency was installed.

The brief's specific merge instructions were treated as exceptions to the generic no-edit rule for protected notes: upstream HANDOFF/session content was accepted verbatim, and the known-bug conflict was unioned with only the specifically requested background-copy line removed. Main also carries its already-completed removal of the older missing-`--out` guide bug. No other known-bug implementation was changed here. The shared contract/fixture hash-check limitation remains; hashes were checked directly, not by adding a test.

## Commands and exit codes

| Command | Exit / result |
|---|---|
| `git fetch origin` | 0. |
| `git merge --no-commit origin/main` | 1 initially; named conflicts resolved, both capture behaviours retained, generated files regenerated. |
| `node scripts/code-map.mjs --impact <affected modules>` | 0; read before changes, including `main.mjs`. |
| `node packages/nana-pack/tests/first-look.test.mjs` | 0; 8 checks after conflict resolution. |
| `npm test -- hive-assets hive-page pages-workflow first-look outside-reader visual-reader` | 0; 6 files, 38 checks. |
| `node scripts/component-audit.mjs --out <external components.json>` | 0; full output in `build5-audit-output.txt`. |
| `node scripts/hive-page.mjs --serve --data <external components.json>` | 0 setup; loopback server supplied the first round. |
| `node scripts/hive-page.mjs --out <external site> --data <external components.json>` | 0 for both subsequent publications. |
| `npm run first-look -- --page url --after <served URL> --hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/hive-render-2026-10-29/replicate-art-spec.md --out <external round folder>` | 0 in all three rounds. |
| `node <external capture-details.mjs> <external details folder>` | 0 in rounds 2 and 3; 20 WebGL frames each. |
| `npm run -s req:tree` | 0; 2190 rows, 39 features, zero problems. |
| `node scripts/code-map.mjs --write` | 0; 494 modules. |
| `npm run test:locked` | 0; plain foreground command, default machine-wide lock, complete output on screen. Per-file record in `build5-suite-record.json`. |
| `npm run map:check` | 0; 494 modules, zero problems. |
| `npm run readme:check` | 0; 895 claims, zero problems. |
| `node scripts/requirements-trace.mjs` | 0; 2190 rows, 1945 implemented and traced; zero EARS problems. |
| `node scripts/requirements-tree.mjs --root .` | 0; zero problems. |
| `node scripts/known-bugs.mjs --root .` | 0; `summary names=0 sizes=0`. |
| `node scripts/identity-scan.mjs` | 0; zero findings after replacing personal install-log path prefixes with placeholders. The first scan of those two raw logs exited 1; no product code or scan policy changed. |
| `git diff --check` | 0 after removing the merged config's extra EOF blank line. |
| `node packages/nana-setup/bin/install-check.mjs` | 1 under the worker's inherited lane boundary, which rejected the rehearsal's temporary fixture write. No source change. |
| `env -u NANA_WORKTREE_ROOT -u NANA_ROLE -u NANA_HANDOFF node packages/nana-setup/bin/install-check.mjs` | 0 after isolating the rehearsal from worker-only ambient controls; all items PASS. Its scripted local fixture provider makes no external model call. |
| `nana-writing --report` | 0; technical-record diagnostics retained because this brief requires paths, IDs, tables and command evidence. |
| `node scripts/lane-class.mjs --root . --files <own changed source paths>` | 0; ordinary. |
| Last-commit checks, push, finished CI | Actual results in the final response; no CI conclusion is predicted here. |

Green locked full-suite summary:

`239 files: 237 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8728 pass, 0 fail, 44 skip · 573.9s`

Unchanged sealed SHA-256:

- `docs/components/contract.json`: `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`
- `docs/components/fixture.json`: `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`

## Closed findings

- Unified the capture paths while retaining the lane's readiness/error regression test and main's reference mode.
- Removed the duplicated background literal and its specifically named known-bug line.
- Grounded recent-activity specks and connected, supported or removed stray structural rods.
- Replaced the five label-dependent metaphors with recognizable finished objects.
- Stopped walkways from cutting through objects and anchored labels at measured object heights.
- Made the phone's footer source and links readable over scene geometry.

## Not done / retained limits

- No independent model session, delegated subagent, visual-reader invocation, land or deployment was started. Only the install-check's scripted local fixture rehearsal ran; the seat runs the visual judge after this build.
- No contract, fixture, audit implementation, vendored renderer, desk implementation or product-report implementation was changed.
- The full-suite record describes the pre-commit merged working tree, as required by the green-before-commit rule; the final response reports checks and CI for the committed tip.
- No GitHub issue was created, edited, commented on or closed. No new owner question was introduced.
- Worker reports are technical records, exempt from owner-prose rules. The required writing check is run; mandated IDs, paths, command tables and technical sentence lengths remain for that reason.
