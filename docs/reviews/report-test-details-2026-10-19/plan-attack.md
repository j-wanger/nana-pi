# Adversary verdict — report-test-details (2026-10-19)

Verdict: AMEND

The plan is sound and worth building, and its measured claims check out. I re-ran each one read-only: 147 PASS and 2 SKIP; 76 files unchanged and 73 changed; the same five all-SKIP implemented rows; 2,683 local citations across 151 files, all on disk; 286 rows cite no test, none of them implemented. The plan's cited-test rule agrees with the TypeScript rail's isLocal on every nana-pi citation. The class is right: ordinary. No in-flight lane touches its files.

I made four amendments, each backed by a probe in a temp clone at 0f2e0ca with a temp HOME.

(1) The renderer ships as source, through String(renderInto) in the page. The plan says to "reuse NOT_COUNTED" and to use a named GitHub constant. I put a module-scope name inside renderInto as a probe. All 57 of today's checks stayed green, but the written page threw "ReferenceError: WHITESPACE is not defined". The existing render helpers and the hashchange bootstrap both call the live closure, so nothing catches this. Fix: every new check now renders the page that generateReport wrote, with the renderer pulled from the HTML and evaluated in a fresh vm context. Text and hrefs move into the model.

(2) The plan's injected runtime-data path skips the real lookup. I called dataPath with the report's own runner and it threw "TypeError: r.stdout.trim is not a function". The plan catches that error as "no runtime data", so the real page would show "No recorded run" everywhere while the tests stayed green. Fix: drop the new option. Tests write the data at the fixture's own .git/nana/runtime-map.json, and R-1512 also builds from a linked worktree. That catches the unwrapped runner, dataPath(process.cwd()), and path.join(root, ".git/...").

(3) R-1511 had a WHERE clause with an "otherwise" inside it, which is not clean EARS. I rewrote it as a single "shall ... only when" row. It now also requires target=_blank with rel noopener, because the reader uses the hosted claude.ai copy. That need is inferred: I did not try a link inside the artifact frame.

(4) Smaller fixes:
- NOT_COUNTED lives in runtime-map-config.mjs, not runtime-map.mjs.
- violated rows need tests too (R-1017's "no undefined" check).
- The renderer must still handle the model with no features that R-1019's text-node check renders.
- R-1012's amended text must keep "byte-identical product reports." because the hostile check edits it.
- R-1513's test must also assert no mark when nothing changed, and R-1515's must assert the no-test line is absent where a test is cited. Without those, an "always" mutation passes.
- The builder must never run npm run map:measure: it runs the full suite and rewrites the clone's shared data.
- The worktree fixture needs `* -text` in .gitattributes. Windows CI checks out with autocrlf, and product-report.test passes 57/57 on Windows today.

Red today: the written page's FEAT-039 detail renders 6 links and 0 li when evaluated in a fresh vm, and a fresh clone has no runtime data.

Claim most likely wrong: that a plain link fails inside claude.ai's artifact frame, so new-tab links are needed there. It is inferred, not tried. The plan's own caveat also stands: the per-file label covers only this clone's platform.

Files the build touches, unchanged from the plan:
- <repo>/scripts/product-report.mjs
- <repo>/scripts/product-report/template.html
- <repo>/packages/nana-pack/tests/product-report.test.mjs
- <repo>/REQUIREMENTS.md
- <repo>/docs/requirements-tree.md
- <repo>/packages/nana-pack/tests/requirements-tree.test.mjs
- <repo>/docs/code-map.md
- <repo>/README.md

The seat writes the review corpus, HANDOFF and session notes, all in the lane worktree. Conflicts are text-only on shared files: REQUIREMENTS.md, the leaf total, the two generated files and README. Resolve them on merge; no lane needs waiting for. The amended texts were also drafted in the scratchpad at <tmp> and bb.md.
