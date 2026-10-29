VERDICT: DONE

# hive-render · build 4 technical record

Feature: FEAT-039. Branch: feat/hive-render. This work serves the shared toolkit's product experience: the owner can see the product's structure and decisions together.

## Commit and files

The final response names the commit, its finished CI run and last-commit checks. This record accompanies that commit rather than predicting its hash.

| Item | Files | Change |
|---|---|---|
| Full-bleed scene | `apps/hive/camera.mjs`, `apps/hive/main.mjs` | Derive a close overview from the workflow campus's projected depth; remove the overlay-avoidance camera offset; crop portrait details; view governance inward across the campus. |
| Frosted overlays | `apps/hive/index.html` | Lower the rail and card's background opacity; blur the underlying scene, including Safari's prefixed backdrop filter. Retain fixed full-screen stage and floating phone card. |
| Recognisable structures | `apps/hive/assets/hive.mjs` | Extend the existing injected-THREE builder with component-specific machines and civic forms, including open-ended hopper geometry. Keep ancestor picking, data cells, bees and statuses. Extend ground beyond the view instead of retaining the visible display plinth. |
| Generated map | `docs/code-map.md` | Regenerate the camera module's purpose entry. |
| Verification | This record and `build4-suite-record.json` | Record the visual decisions and the locked suite's complete per-file results. Screenshots stay outside git. |

### Component silhouettes

| Component | Form |
|---|---|
| Compass | Tall mast, compass rose, cardinal arms and direction needle |
| Queue | Roller conveyor with separate waiting trays and intake gantry |
| Library | Five dark, open archive stacks with books and shelves |
| Drafting table | Inclined drawing board, parallel rule and overhead arm |
| Workshop | Existing production decks and lattice crane |
| Tool belt | Circular carousel with upright socket tools and wrench heads |
| Eyes | Twin optical barrels, dark lenses and swivel mount |
| Notice board | Public display on two legs, with pinned ruled sheets |
| Setup | Open funnel feeding a single cylindrical machine |
| Release route | Raised dispatch ramp, packages and exit portal |
| Desk | Open floor of desks, monitors and chairs; unfinished roof frame |
| Lab | Unequal reaction vessels, exposed pipes and incomplete gantry |
| Stage | Cylinder core inside an unclosed signing cage |
| Key cabinet | Existing empty foundation and survey stakes; no invented cabinet |
| Night shift | Existing empty foundation and survey stakes; no invented orchestration machinery |
| Rulings | Colonnaded rotunda with faceted dome |
| Review ladder | Five ascending open halls |
| Land gate | Existing twin checkpoint cores, open passage and raised barrier |
| Requirement contract | Three upright ledger leaves, ruled rows and binding rails |
| Code map | Wire globe with connected module nodes |
| Command gate | Twin checkpoint cores with a closed portcullis |
| Identity scan | Scanning aperture, suspended read head and travelling sheet |
| Writing rule | Writing platen, roller, ruled paper and keys |

The two absent components intentionally share the empty-foundation vocabulary rather than pretend to be finished machines. The two gates share a gatehouse vocabulary but have different barriers. Library stays dark; partial components stay visibly open frames. Layout and all 23 component identities remain unchanged.

## Rows, tests and mutation pairs

- **Requirement diff: none.** The brief explicitly requires build 3's rows, evidence and tests to remain unchanged. No new ID allocation was supplied or used.
- **Every row changed: none.** R-3120–R-3134 and R-3139 keep their implemented status and backticked `file::title` evidence. No artifact declaration changes.
- **Every test changed or added: none.** No assertion, title, marker or fixture was modified. No new sealed tunable or line-oriented text reader was introduced.
- **Mutation pairs: none required or claimed.** This brief names visual corrections, not new must-meet test cases. The two visual wrong-code comparisons are build 3's offset/fitted overview versus the full-bleed view, and its repeated deck forms versus the role-specific structures. Those are screenshot comparisons, not automated mutation proofs.
- Existing touched tests: `hive-assets.test.mjs` (3), `hive-page.test.mjs` (11), `pages-workflow.test.mjs` (4), and `first-look.test.mjs` (5), all exit 0 before the full suite.

Green locked full-suite summary (exit 0):

`238 files: 236 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8719 pass, 0 fail, 44 skip · 575.9s`

## Real-data captures and spec judgement

Screenshot folder:

`/var/folders/lg/h9m6nvvd2_9d7s3hyjvdlqxr0000gn/T/nana-hive-build4-UIv8NR/`

Each of `round1/`, `round2/` and `final/` holds twelve principal captures at 380 × 1000 and 1280 × 1000: overview, Library in all three voices, Review ladder and Key cabinet. Each also holds 46 chapter captures in `structures/`, twelve three-column sheets in `comparisons/`, the real `component-audit --out` JSON, audit output, and browser observations. All three capture commands exit 0. No fourth visual round was run.

The sheets place build 4, build 3 and the reference side by side. The original build 3 screenshot folder cited in its report no longer exists. `build3-recaptured/` therefore recreates the app from `c6fc662f`, with exactly the same real audit snapshot as round 1; `provenance.txt` records that substitution. `reference/` is a read-only-source copy of the supplied frames. Nothing was written into `/private/tmp/nana-3dmk-ref/`.

Captures use local `hive-page` publication, real audit data, WebGL, reduced motion and `?still`. Each principal capture records one visible card, viewport-width scrollWidth, full-viewport stage dimensions, translucent computed backgrounds and a 12px card backdrop blur. No page errors occurred. The chapter gallery includes every one of the 23 real components at both widths.

| Spec line | Round 1 | Round 2 | Final (round 3) | One reason for the final judgement |
|---|---|---|---|---|
| 1 · Scene is the page | FAIL | FAIL | PASS | Overview fills both widths beneath the glass overlays; inward governance framing also replaces the empty-ground phone backdrop. |
| 2 · Detailed, legible model | FAIL | PASS | PASS | The open hopper, optical barrels, mast, stacks, globe, desks and halls have different readable silhouettes, with cast shadows and depth. |
| 3 · Restrained monochrome | PASS | PASS | PASS | Existing white/grey/ink materials remain; no saturated status blobs were added. |
| 4 · Deliberate typography | PASS | PASS | PASS | Existing small-caps labels, leaders, voice tabs and technical code-name wrapping remain distinct from body text. |
| 5 · One frosted overlay | PASS | PASS | PASS | One fixed card shows blurred structures through it; longer text scrolls inside that card. |
| 6 · Same designed object at 380 px | PASS | PASS | PASS | The full-screen scene continues behind a compact header, chapter picker and single floating card, without document-width overflow. |

Round 1 exposed a capped hopper that read as a plate and too much empty ground behind perimeter detail stops. Round 2 opened the hopper and enlarged portrait details, but perimeter chapters still looked outward into empty ground. The final round looks inward from the ring and retains campus structures behind the header. These are builder visual judgements, not the independent visual judge or a pixel-equivalence claim.

## Precedent and departures

All four named precedents were read completely before designing.

| Precedent | Followed | Departure and reason |
|---|---|---|
| `apps/hive/assets/hive.mjs` | Retain its injected THREE namespace, local box/beam/fence primitives, shared materials, component ancestors, foundations, cells, bees and governance ring. | Add drum/hoop primitives and component-ID branches because a kind-only branch made 23 near-copies. Replace the finite floor plinth with continuous ground. |
| `apps/hive/layout.mjs` | Retain build 3's deterministic centre/ring placement and bounds unchanged. | None. |
| `apps/hive/camera.mjs` | Import and retain `focus` unchanged for bounds-framed stops and fallback. Reuse its configuration and pose shape. | Export a separate projected-depth `overview` because a sphere-fit view leaves large margins. Browser portrait views crop the fit-all pose; governance headings face inward to keep the campus behind them. |
| `apps/hive/index.html` | Retain the fixed stage, rail, single active card, voice controls and phone chapter picker. | Make rail/card visibly translucent and add prefixed blur support because the previous panels read as opaque. |

No precedent helper was copied or moved. No private helper was needed from another file. `main.mjs` imports both camera functions from their existing home. No dependency was added or installed.

## Commands and exit codes

| Command | Exit / evidence |
|---|---|
| `npm run map:impact -- apps/hive/assets/hive.mjs apps/hive/camera.mjs` | 0; inspected before edits. |
| `npm run map:impact -- apps/hive/main.mjs` | 0; inspected before edits. |
| `node packages/nana-pack/tests/hive-assets.test.mjs` | 0, 3 checks. |
| `node packages/nana-pack/tests/hive-page.test.mjs` | 0, 11 checks. |
| `node packages/nana-pack/tests/pages-workflow.test.mjs` | 0, 4 checks. |
| `node packages/nana-pack/tests/first-look.test.mjs` | 0, 5 checks. |
| `node /private/tmp/hive-build4-capture.mjs round1` | 0; fresh temporary output folder. |
| `SHOTS=<folder> node /private/tmp/hive-build4-capture.mjs round2` | 0. |
| `SHOTS=<folder> node /private/tmp/hive-build4-capture.mjs final` | 0. |
| `npm run map:check` before regeneration | 1; purpose entry stale, fixed by regeneration. |
| `npm run map` | 0; 490 modules. |
| `npm run map:check` after regeneration | 0; zero problems. |
| `git diff --check` | 0. |
| `node scripts/lane-class.mjs --root . --files <changed paths>` | 0; ordinary. |
| `npm run test:locked` | 0; plain foreground run, default machine lock and output on screen. Full per-file results are in `build4-suite-record.json`; summary above. |
| `npm run readme:check` | 0; 883 claims, zero problems. |
| `node scripts/requirements-trace.mjs` | 0; 2181 total rows, 1936 implemented and traced, zero EARS problems. |
| `node scripts/requirements-tree.mjs --root .` | 0; zero problems, 39 features. |
| `node scripts/known-bugs.mjs --root .` | 0; `summary names=0 sizes=0`. |
| `node scripts/identity-scan.mjs` | 0; zero findings. |
| `nana-writing --report` | 0, report-only diagnostics; required technical-record formatting stays for the reason below. |
| Last-commit map, README, trace, tree, known-bugs and identity checks | Final response supplies the actual results after committing. |
| Push and finished CI | Final response supplies the new tip's actual run URL and conclusion. |

Sealed SHA-256 values, unchanged:

- `docs/components/contract.json`: `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`
- `docs/components/fixture.json`: `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`

## Closed findings

- Replaced the floating overview plate with a full-bleed campus behind the rail and card.
- Made both reading overlays visibly frosted rather than opaque.
- Replaced repeated generic structures with role-specific machines and civic forms.
- Opened the hopper after the first capture exposed its plate-like cap.
- Turned perimeter detail views inward after the first two captures exposed empty ground behind the hall.

## Not done / retained limits

- No supplied known-bug implementation was changed. No HANDOFF, known-bug file or session archive was edited.
- No contract, fixture, data audit, real-data publication swap, vendored bytes, desk, or product-report implementation was changed.
- The shared contract/fixture hash limitation remains: this build verifies hashes directly, not through a new test.
- No independent model session, subagent, visual-reader invocation, land or main deployment occurred. The brief says the new visual judge is on another lane; this work supplies manual spec judgements and comparison sheets for it.
- No GitHub issue was created, edited, commented on or closed. No new open question was introduced.
- Worker reports are technical records, excluded from owner-prose rules. `nana-writing --report` ran (exit 0). Its verdict-format, passive-voice, identifier and length diagnostics remain because this brief requires a technical report with paths, IDs and command evidence.
