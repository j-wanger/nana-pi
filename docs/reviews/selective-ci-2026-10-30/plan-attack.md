# selective-ci — plan attack (revision 2)

Adversary for `docs/reviews/selective-ci-2026-10-30/plan.md` at 6efbec2c. Threat model as the plan states it: honest variation in our tools' output is in scope, deliberate forgery is out.

Method: read the plan, `.github/workflows/ci.yml`, `scripts/test.mjs`, `scripts/code-map.mjs`, `scripts/code-map-launch.mjs`, `scripts/lane-class.mjs`, `packages/nana-pack/lib/lane-class-config.mjs`, `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/lib/land-ci.mjs`, `packages/nana-pack/lib/ci-records.mjs`, `packages/nana-pack/lib/frontier-summary.mjs` and its config, `packages/nana-setup/claude/rules/nana-seat.md`, `measure.mjs` and its outputs. Three probes, all outside git, not committed:

- **A4 emulation.** A scratch copy of `code-map-launch.mjs` with one added export. It evaluates every token expression in every mapped module with the existing evaluator, keeps values that carry a traced path (`v.p`), and links a module to a tracked document or a folder above one (`.` excluded). It then adds test callers through `impact` on the enriched graph. This is my reading of A4 as written. I did not add R-3179's readers.
- **Read trace.** A `--import` preload that logs every `fs.readFileSync` path, run on single test files with a temp HOME.
- **CI log read.** `gh api .../jobs/<id>/logs` for run 40992301983.

## MUST

### 1. A4 as written misses helper-mediated reads, and R-3178 pins the narrow rule. The measured figures come from a wider prototype.

Evidence:
- `packages/nana-setup/tests/fresh-machine.test.mjs:23-24`: `const read = (file) => fs.readFileSync(path.join(repo, file), "utf8"); const readme = read("README.md");`. It then pins the README's ordered checklist and its version values. The literal and the root meet only inside the arrow helper's parameter, which the evaluator does not bind outside launch calls (`code-map-launch.mjs` `launchSites` is the only place that creates `bindings`).
- `packages/nana-pack/tests/skill-claims.test.mjs:23,138`: `read("packages/nana-pack/README.md")` through the same helper shape. It asserts every `UNJUDGED_CLAIM_NOTES` entry is in the pack README.
- A4 emulation: a change to root `README.md` selects one test (`pi-install-pin`). A change to `packages/nana-pack/README.md` selects 33 tests, without `skill-claims`. A change to `docs/code-map.md` selects 0, and so do `OBJECTIVE.md` and `docs/known-bugs/FEAT-031.md` before R-3179's list.
- The read trace confirms both reads. `fresh-machine.test.mjs` reads `README.md`, and `skill-claims.test.mjs` reads `packages/nana-pack/README.md`. Both exit 0.
- `measure.mjs` `DOCRULE=edges` is not A4. It matches any module whose source contains a quoted nested document path or a prefix of one, unanchored. It also matches a root-level name when the module holds an anchor word (`REPO|ROOT|repo|...`). That rule catches both tests above. So the 9.5% share and the "no document-caused miss" figures describe a rule the plan does not specify.
- R-3178's fixture pins `tests/other.test.mjs` (names `"HANDOFF.md"` only under `mkdtempSync`) as selected by neither change. That is a precision pin. A builder who meets it the simplest way, by requiring an anchor-traced value, gets the narrow rule above. This contradicts the plan's own line "Every rule resolves doubt toward the full suite."
- The record cannot show recall. It has no document-caused failure, so a catch rate over real failures says nothing about missed readers.

Mitigation, verified: both misses are platform-independent, so the land's local macOS full suite (A8) catches them for a documents-only lane. The silent residual is a Windows-only, document-caused failure. Still, a green documents run on a tree whose full run is red on every leg is exactly the harm the plan names.

Fix:
1. Specify the link rule as at least the prototype's. Any string literal equal to a tracked document's repository path, or to a folder above one, links its module. A root-level document name links when the module also holds a repository-root anchor. A traced path value links too. Say explicitly whether `.` counts as a folder (it should not, or every anchored module selects for every document).
2. Replace R-3178's negative pin with recall pins:
   - a helper `const read = (f) => readFileSync(join(ROOT, f))` plus `read("README.md")` selects for `README.md`;
   - a nested literal passed to a helper selects;
   - a library function with an injected `root` parameter and a literal `"docs/x.md"`, reached by a test, selects.

   If a precision pin stays, word it as "may be absent", not "shall not be selected".
3. Add a recorded measurement, a seat check after build 1. Run the suite once with a read-trace preload set through `NODE_OPTIONS`, so children inherit it. List every (test, tracked document) read that the built selector would not select for that document. Fix or declare each one before the final round. The scratch preload took seconds per file. It must cover `readFileSync`, `readFile`, `promises.readFile` and `createReadStream`.

### 2. R-3179's lister detection misses the repository's real listers, and the house style makes that the common case.

Evidence:
- R-3179 flags a module that lists "under a traced repository root". It names `git ls-files` with `cwd: ROOT`, or `readdirSync`, `readdir` or `globSync` on that root.
- `scripts/identity-scan.mjs:89`: `execFileSync("git", ["-C", root, "ls-files", "-z"])`. Here `root` is a parameter and the root travels in `-C`, not in `cwd`.
- `scripts/known-bugs.mjs:44`: `fs.readdirSync(directory, ...)`, with `directory` a parameter.
- `scripts/component-audit.mjs:190`: `invoke(gitRunner, root, ["ls-tree", "-r", "-z", "--name-only", "HEAD"])`. That is an injected runner and `ls-tree`, not `ls-files`.
- `nana-standards.md` requires file roots to be injected at the module boundary. So a future reader will usually take `root` as a parameter, and the guard as specified will stay silent. The 14 seeds come from `measure.mjs`'s hand list (`REPO_WALKERS`), not from the rule. Today's set is covered only by hand.

Fix:
- Detection should not depend on tracing the listed root. Flag any non-test mapped module that calls `readdirSync`, `readdir`, `opendir`, `opendirSync`, `globSync` or `fs.promises.readdir`, or launches or passes to a runner `git` with `ls-files`, `ls-tree`, `grep`, `archive` or `--name-only`.
- The module then needs either a `repoReaders` entry or a `repoReadersExempt` entry with a reason, such as "lists only its own temp folder".
- Pin the three real shapes: a parameter root, `-C <param>`, and an injected runner with `ls-tree`.
- Re-run `measure.mjs` with the declared list the rule forces, not the hand list. The 9.5% share may grow.

### 3. The gate list leaves out the file that defines a document.

Evidence:
- R-3185 adds only `.github/workflows/ci.yml`, `scripts/ci-select.mjs` and `scripts/test.mjs`, with the reason "CI verdict nana-land reads".
- `scripts/lane-class.mjs` hops to `gate` only from tool roots whose reason ends in " tool" (`toolRoots` filter `/ tool$/`). The hop also needs every non-test caller to be a tool root.
- So `scripts/ci-select-config.mjs` (R-3186's sealed document patterns) and `packages/nana-pack/lib/test-runner-config.mjs` (O2's list flag) class as `ordinary`. A later lane that widens the patterns, for example to count `packages/*/skills/**` as documents, would get one reviewer. That is the most direct way to create silent misses.
- The owner's decision says the CI files join the gate list.

Fix:
- Add `scripts/ci-select-config.mjs` and `packages/nana-pack/lib/test-runner-config.mjs` to R-3185, each with its pin.
- Or end the reason in " tool" ("CI selection tool") so direct imports hop, and pin that `--files scripts/ci-select-config.mjs` prints `gate`.
- `code-map.config.json` (`repoReaders`) and `scripts/code-map-launch.mjs` also decide selection. Classing them gate would make every map change heavy, so the plan should state that choice either way.

### 4. A3's document patterns contradict R-3180 and sweep in shipped, pinned and generated files.

Evidence:
- `git ls-files` shows `templates/_shared/docs/sessions/README.md`, the frontier seed. AGENTS.md says the templates include it and `nana-setup project` fills it. A3's "a `README.md` anywhere" makes it a document. R-3180 says `templates/` runs the full suite. The builder cannot meet both pins for this path.
- `apps/bench/studies/tool-profiles-2026-09-08/fixture/README.md` and two more fixture READMEs are content-pinned by `study.json` `pinnedSha`, which `apps/bench/test/study-tasks.test.mjs:256-264` checks. They are fixtures, not documents. The runner already treats `fixture` segments as special.
- `docs/code-map.md` is generated, and `checkRepo` compares it (`scripts/code-map.mjs` `checkRepo`; `packages/nana-pack/tests/code-map.test.mjs:36`). Its path reaches code only through `code-map.config.json` `mapPath`, so the A4 emulation selects 0 tests for it. `docs/requirements-tree.md` is generated the same way.
- `docs/components/*.json` and `docs/product-report/assessments.json` are data that code reads. They are not prose.

Fix:
- Evaluate exclusions before the document patterns. Paths under `templates/`, `apps/bench/studies/`, or with a `fixture` or `fixtures` segment run full. So do the generated files, read by name from `code-map.config.json` `mapPath` and the requirements-tree path constant.
- Under `docs/`, keep `*.md` and `docs/reviews/**`. Any other type under `docs/` runs full.
- Seal the exclusions with R-3186's patterns.
- Inferred cost: none. The replayed documents-only pushes changed `docs/reviews/**/*.md`, plus `HANDOFF.md` on one push.

## SHOULD

### 5. The main check can read the pull-request run's records instead of main's.
`nana-land` merges only by fast-forward, so main's new SHA is the reviewed PR tip's SHA. That SHA always has a `pull_request` run, possibly a documents-only one. `readCiRecords` (`packages/nana-pack/lib/ci-records.mjs:100`) lists every `ci.yml` run at the SHA. Both runs upload artifacts named `suite-record-<os>-<attempt>`. O4 says "that run's suite records", but no pin holds it.

Fix: in R-3183, filter `parsed` to the push run's id. Pin it with a fixture SHA that carries a green documents-only PR record and a red push record, and assert that the red files print.

### 6. Main-check verdict rules leave reds unreported.
- "When that run passed, it prints one green line" conflicts with A7. The Linux leg is `continue-on-error`, so a run with a red Linux leg concludes `success`. Read the records on every finished run, or drop A7's claim.
- A run can fail in install-check or release while every suite record is green. The check must then name the failed jobs, from `jobs?filter=latest`, not print "failed files: none".
- "Newest push run" while that run is unfinished prints only a waiting line, and the previous finished red stays unseen. Report the newest finished run, and note any newer unfinished one.

Pin all three.

### 7. A red main surfaces only when a session starts.
In a long seat session with several lands, nothing tells the seat that an earlier land's main run went red. "A red main does not block the next land", so more documents-only lanes can land on a red main.

Fix, one sentence in `nana-seat.md`: run the check after each land too, once that land's main run finishes. This needs no new code.

### 8. Selector diff assumptions are not pinned.
- A1 assumes the checkout is GitHub's merge commit. If `HEAD` has one parent, `HEAD^1..HEAD` is the last commit only, which is a silent miss. Pin: `HEAD` without exactly two parents gives `full`, naming the reason.
- If a PR targets a branch other than `main` (a stacked PR), `HEAD^1` is that branch. The tip `nana-land` reads then carries changes the diff never saw. Pin: `github.base_ref` other than `main` gives `full`. Pass it in as an argument.
- An empty changed set satisfies "every changed path is a document" vacuously. Pin: empty diff gives `full`.

### 9. The workflow's fail-safe must sit in the condition, not only in the selector.
R-3180 pins the selector's exit 0 with `full`. If the select step dies before writing output, from a top-level import error or a runner crash, the workflow decides. R-3182 should also pin these:
- the list reaches `npm test` only under `steps.<id>.outputs.mode == 'documents'`, so a missing or garbled output runs the full suite;
- the select step has its own `timeout-minutes` and `continue-on-error: true`, so a hang cannot hold the leg for the 90-minute job limit.

Keep one `npm test` step per OS condition (R-1313 and R-2556 parse these lines), and add the list as a conditional argument.

## NOTE

### 10. The harm at land is narrower than the plan states.
None of the 13 documents-only pushes in `measure-since.txt` was a land tip. I checked each SHA: 9 are intermediate plan, brief or notes commits now on main, and 4 sit on open or closed branches. So the saving comes from pre-build pushes. A missed failure there still meets the lane's later full run, or the local macOS suite at land.

The only path to "nobody notices before main" is a documents-only lane with a document-caused failure that appears only on Windows or Linux. Say this in the plan, because it is the trade the owner accepted.

`nana-land` does not check that `--suite` is the full suite. A8 is practice, not something the tool enforces.

### 11. Flake inference verified for one pair.
Run 40992301983, the Windows suite leg, `component-audit.test.mjs`: "R-3104 ... case exceeded 20000 ms", 10 pass and 1 fail. That is a per-case timeout, consistent with the plan's flake inference. I did not read the other four logs.

### 12. The saving is on the suite step only.
Documents-only legs still install pi, uv, pnpm and copier, and install-check runs unchanged (A5). The wall-time saving per push is below the suite-step figure. The plan already marks the minutes as inferred. Record the measured leg wall time beside the suite-step minutes on the real documents-only push.

### 13. The selector must emit only files the runner collects.
The six mapped test roots are wider than the runner's three groups. R-3181 exits 1 on an uncollected path, which fails closed but would turn a documents run red for no reason. Pin: the selection is intersected with `collect()`'s set.

### 14. Session-start line.
- The block already calls `gh` for issues, bounded by `ISSUES_READ_LIMIT_MS` 1500. The new line needs no network.
- Prefer an `existsSync` of `.github/workflows/ci.yml` plus the existing issues pointer as the condition. A new `git remote` spawn would run under the hook deadline (`hook-deadlines.test.mjs`).
- Put the line inside `renderBlock`, so it counts against `FRONTIER_OUTPUT_CAP`, and in the omitted path beside `watchLine` (`frontier-summary.mjs:129`).
- Role checks hold. `frontierSummary` returns null for launcher roles (`frontier-summary.mjs:82`). Reviewers get `NANA_ROLE=reviewer` through `REVIEWER_CHILD_ENV` (`review-ledger.mjs:168`), and builders get `worker` from `pi-worker.mjs`.

### 15. Issue title (O3).
A title with the run id or SHA posts a new issue for every red run, including flakes. Five of the nine document-run pairs in the window were inferred flakes. Suggest naming `main` and the first failing file, so a recurring flake deduplicates and a new failure posts.

### 16. Lane class and heavy checks.
- `node scripts/lane-class.mjs --root . --files <plan's list>` prints the plan's `hook` line, verified.
- `classify` returns the first `CLASS_PATHS` match in sorted path order. Once R-3185's entries exist, `.github/workflows/ci.yml` sorts first and prints `gate`. That is inferred from the code, as the plan says.
- Ladder: the land reviewer, or `seat-land.md` when the roster prints `land: seat`; the seat's wrong-code pairs; one independent check; the local macOS install check, because the lane touches `packages/nana-setup/claude/rules/nana-seat.md` and a hook producer.
- The plan names no wrong-code pairs. Suggested pairs:
  - the selector classes `packages/p/rules/r.md` as a document;
  - the workflow passes the list on `push`;
  - the runner ignores the list flag;
  - the selector returns `documents` on a git failure;
  - `nana-main-ci` posts after an identity-scan hit;
  - the main-check line renders under `NANA_ROLE=reviewer`.

### 17. Rows.
- Main's highest row is R-3160.
- The world-graph worktree holds R-3170 to R-3176, and its attack names R-3177. The shops-flows plan uses R-3161 to R-3169.
- No other worktree, plan or ledger uses R-3178 to R-3186 (grep over `~/nana-pi-wt/*/docs/reviews` and each `REQUIREMENTS.md`).
- Each must-meet maps to one row.
- The cited existing rows exist: R-597, R-686, R-1031, R-1313, R-1531, R-2556, R-2631, R-2632, R-2998, R-2999 and R-3149.
- R-3186 should seal the exclusions from finding 4 together with the patterns.

### 18. Identity scan.
`node scripts/identity-scan.mjs --root .` at 6efbec2c reports `files=4750 findings=0` and exits 0.
