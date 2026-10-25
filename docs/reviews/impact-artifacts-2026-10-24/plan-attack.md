# impact-artifacts plan attack (adversary, main 86c628b9, 2026-10-24)

Counts: MUST 4 · SHOULD 4 · NOTE 10

Read: the must-meet draft, design report section B, `block.mjs`, `scripts/code-map.mjs`, `scripts/deliverables.mjs`, `scripts/requirements-tree.mjs`, the template generator, `runtime-map.test.mjs`, `code-map.test.mjs`, `scripts/product-report.mjs`, `code-map.config.json`, and the land-records worktree's ledger.

Run, all read-only, with scratch scripts under `scratchpad/attack/`:
- `code-map.mjs --check`: 431 modules, 0 problems.
- the prototype on four files;
- one-liners over `parseLedger`, `artifactRegistry`, `artifactReads`, `deliverableClaims`, `isModulePath`, `isIgnored`, `repoGraph` and `parseRelativeImports`;
- a fixture ledger parsed in-process;
- the warning replica with a dynamic import, in three endings.

Not run, so inferred: the suite, any change to the shim, the Windows leg, and R-1278 with the block in place.

---

## 1. MUST: the plan names no seam, so the threat-model cases cannot be tested with fixtures

**Evidence.**
- `runCodeMap` (runtime-map.test.mjs:141-144) spawns the real shim with `cwd: REPO`.
- The shim fixes its root from `import.meta.url` (scripts/code-map.mjs:36-39).
- The only override the shim reads is `NANA_RUNTIME_MAP_FILE`, for runtime data.
- So every spawned run reads this checkout's real REQUIREMENTS.md and real graph.

The live ledger cannot supply these cases:
- It has 0 retired entries and 0 Reads lines naming a non-live ID. R-2730 (REQUIREMENTS.md:2232) keeps them off main.
- R-2823's "unreadable ledger" needs an edit to the repo.
- A live-ledger test is also coupled to other lanes' ledger edits. land-records is about to add A-082.

The copied-shim route (MM9, :511-532) would also have to copy the whole static chain behind `deliverables.mjs`:
- `requirements-moved`, `requirements-tree` and `requirements-trace` with the template `.ts`;
- `brief-precedent` and four config modules;
- `apps/bench/lib/checkers.mjs` and `fixture.mjs`;
- three record configs.

That route breaks on any new import in the chain.

**The fixture route works today.** A 20-line fixture REQUIREMENTS.md parses in-process with `artifactRegistry` and `artifactReads` (scratch `attack/fixture-ledger.mjs`). It needs a `## CAP-01` heading with `Kind: product`, two `### FEAT-` spans, and one row table for `ledgerReadProblem`. `repoGraph(root)` builds on any root with a `code-map.config.json`, as `relationRoot` does (runtime-map.test.mjs:218-250).

**The default loader must also run somewhere real.** A path-built specifier gives no map edge, and it would fail only on Windows. Rerun results from `parseRelativeImports`:
- `import("./deliverables.mjs")` and `import(new URL("./deliverables.mjs", import.meta.url).href)` both give an edge.
- `import(spec)` and `import(pathToFileURL(resolve(root, "scripts/deliverables.mjs")).href)` give none.

On Windows, `import()` of a bare `C:\…` path fails with an unsupported-scheme error (*inferred*; Node behaviour, not run here). The caught import would turn that into a note on the Windows leg only. No draft test would notice, unless one runs the default loader and asserts that no note is printed.

**Replacement text.** Add to Seat decisions, after "Caught dynamic load":

> - **Seam.** The block is one exported async function in the shim, `artifactBlock(root, argv, { load })`, beside `runtimeBlock`. It reads `REQUIREMENTS.md` under `root`, builds one graph from `root`, resolves the arguments with the shim's own `resolveImpactPaths`, and gets the parse modules from `load`. The default `load` is the caught `import("./requirements-tree.mjs")` and `import("./deliverables.mjs")`, written as literal relative specifiers so the map shows both edges and Windows resolves them. The import runs only inside this function, never at module top, because `scripts/requirement-rows.mjs`, `scripts/blast-radius.mjs` and `scripts/template-acceptance.mjs` import the shim. The CLI tail awaits it between `main` and the runtime block and keeps its synchronous `process.exit` (finding 9).

Change the rows heading line to:

> ## Must-meet rows (FEAT-029; tests in `packages/nana-pack/tests/runtime-map.test.mjs` unless noted. R-2820, R-2821 and R-2823's read, parse and load cases call `artifactBlock` in-process on a fixture root built like `relationRoot`: a `code-map.config.json`, four probe modules and a fixture REQUIREMENTS.md. R-2822 runs the real command on this checkout through `runCodeMap`.)

Add to R-2822's row text, after "then the runtime block": "and, in this checkout, no `artifact note:` line". Add the red case: "the default loader failing (a non-literal or path-built specifier) and the block replaced by a note".

---

## 2. MUST: no row pins the argument forms, so an absolute path can silently show nothing

**Evidence.**
- Ledger paths are repo-relative POSIX.
- The generator turns each argument into the repo-relative forward-slash path it prints (template code-map.mjs:858-863). The shim repeats this in `resolveImpactPaths` (scripts/code-map.mjs:56-62).
- An absolute argument, or a native-separator one on Windows, reaches the ledger only through that resolution.
- The draft lists "relative, absolute or backslash path" in its threat model. No row, test or red case uses one.

A block keyed on `argv` passes every draft test that names files as `scripts/test.mjs`. It would print `none` for `/Users/.../scripts/test.mjs`. Agents pass absolute paths routinely, so this is a realistic wrong result.

**Edges of the resolution** (read, *inferred* on Windows):
- In-process on a fixture root, a relative backslash argument only resolves when the cwd is that root. `resolve(a)` uses `process.cwd()`, and the fallback returns the raw argument.
- So the test should name the file by its absolute native path, `path.join(fixtureRoot, "probe", "w.mjs")`. On the Windows leg that form carries a drive letter and backslashes, which gives the missing Windows case without a platform branch.
- A backslash on macOS is a legal filename character, so it correctly stays unmapped there. R-1361 pins only "the platform's own folder separator".

**Replacement text** for R-2820's opening:

> WHEN the impact command names a file, by any argument the generator resolves to a mapped or existing path (relative, `./`, absolute, or written with the platform's own separator), that a live `Artifact:` line lists as a writer, the artifact block shall print, under a heading naming the file by the same repository-relative forward-slash path the generator prints, …

Add to R-2820's test: "the writer is named by its absolute native path, so the Windows leg runs a drive-letter and backslash form". Add the red case: "the block keyed on the raw argument, so an absolute or native-separator name prints no artifact".

---

## 3. MUST: R-2821 has a red case with no row wording, and the prototype crashes on it

**Evidence.**
- `artifactReads` keeps a Reads entry whose ID has no live entry. It only adds a note (deliverables.mjs:229-236).
- In the fixture, `Reads: A-003` (retired) and `Reads: A-999` (unknown) both come back in `reads`.
- The prototype does `const e = reg.byId.get(x.id)` and then reads `e.writers` (block.mjs:22-23). That is a TypeError for A-999.
- For a retired ID, `writers` is `[]` and `reason` is `""`, so the prototype prints the entry as `manual: …`.

The draft's red case is "an unknown ID on the Reads line printed as live", but the row never says what correct output is. If the builder wraps the block in one try/catch for R-2823, the throw replaces the whole block, for every named file, with an `artifact note:` line. This is the draft's own threat-model input ("a Reads line naming an unknown ID"). It occurs in a working tree mid-edit, such as retiring an artifact before removing its Reads lines.

Precedent for the display: the product report prints `${item.id} · no live entry` (scripts/product-report.mjs:715, :765, :770).

**Replacement text** for R-2821:

> **R-2821.** WHEN the impact command names a file that a `Reads:` line lists, the artifact block shall print one `reads` line listing those artifact IDs once each in ID order, each marked `*` when none of the artifact's recorded writers is inside the file's import radius (so a `manual` artifact is always marked), and an ID with no live entry, unknown or retired, shown as `A-nnn (no live entry)` with no star. Test: `R-2821: impact lists each artifact a named file reads, stars those whose writer is outside its import radius and marks IDs with no live entry`. Red cases: an ID missing or repeated; IDs in Reads-line order instead of ID order; a writer inside the radius starred; a writer outside it unstarred; a `manual` entry unstarred; an unknown or retired ID starred, unmarked or dropped; an unknown ID throwing, or replacing the block with the artifact note.

The fixture's Reads lines must be out of ID order for the order red case to bite. Add the `(no live entry)` label to the seal.

---

## 4. MUST: R-2823's "cannot be parsed" cannot happen, and a UTF-16 ledger would print wrong `none` lines

**Evidence.**
- `parseLedger` does not throw. `parseLedger("\u0000\u0000")` and `parseLedger("hello")` both return (scratch run).
- So the row's "cannot be read or parsed" has no reachable "parsed" branch. That makes the row wider than any test.
- The repository already has the predicate for an unusable ledger. `ledgerReadProblem(text, parsed)` (scripts/requirements-tree.mjs:586-590) returns a reason for a NUL byte ("likely UTF-16 from Windows PowerShell 5.1") or for no requirement rows. The product report gates on it (scripts/product-report.mjs:603-605).
- Without it, a UTF-16 ledger parses to zero headings. The block would then print a `none` line for every named file. That is a wrong result, on a realistic Windows input inside the threat model ("a missing or unparseable REQUIREMENTS.md").

**Replacement text** for R-2823:

> **R-2823.** IF reading `REQUIREMENTS.md` under the repository root throws, or `ledgerReadProblem` names a problem with its text, or the parse modules cannot load, THEN the impact command shall print one `artifact note:` line naming the reason in place of the artifact block, keep the generator's output and exit code, and still print the runtime block. Test: `R-2823: an unreadable or unusable ledger or an unloadable parse gives one artifact note and keeps the impact output and exit code`. Red cases: a throw; a changed exit code; the runtime block missing; two note lines; no note; a NUL-byte or row-less ledger printing `none` lines instead of the note.

Test cases:
- a fixture root with no REQUIREMENTS.md. A missing file works on both platforms; do not use chmod.
- one whose ledger holds a NUL byte;
- an injected `load` that rejects.

R-1278's MM9 output (runtime-map.test.mjs:561-564) already exercises a real missing module, end to end. R-2823's test can reuse `mm9ImpactOut` and assert exactly one `artifact note:` line there at no extra cost.

Precedent to add: `scripts/requirements-tree.mjs` `ledgerReadProblem`, imported, never copied.

---

## 5. SHOULD: R-2824's red cases are wrong, and the row adds almost nothing; drop it

**Evidence**, rerun on today's ledger (scratch `attack/m1.mjs`):
- 61 distinct paths: 18 writer paths and 55 reader paths.
- 57 are mapped modules.
- One is ignored: `templates/typescript/template/scripts/readme-check.mjs`.
- Three are not module-shaped: `.github/workflows/ci.yml` and two `REQUIREMENTS-general.md.jinja`.
- So the test lands green.
- "Not module-shaped" is the negation of the generator's exported `isModulePath` (template code-map.mjs:446). `isIgnored` is at :189. Neither is re-exported by the shim. `code-map.test.mjs` would import them from the template, as it already does `parseRelativeImports` (code-map.test.mjs:27).

The red cases fail as named:
- "A writer path that is a test file": 221 test modules are mapped, because the six test roots are map roots (`code-map.config.json` roots). A test path therefore passes the row as worded.
- "An unmapped script": every tracked `scripts/*.mjs` is mapped.
- "A Reads path with a typo that git still tracks": this fails only if the other file is unmapped.

Tracked module-shaped files that are neither mapped nor ignored number 253. Every one is a `docs/reviews/<lane>/*.mjs` seat script. So R-2824 fires only when a ledger line names a review-folder script. A missing or renamed path is already caught by R-2730's tracked-at-HEAD check (deliverables.mjs:190, :241).

A path that fails to join is also benign for the block. It is never inside an import radius, so the block marks it `(no import path)` or `*`, which is true.

**Replacement text.** Delete R-2824 and its test. Replace the "No gate change" bullet with:

> - **No gate change and no key check.** The tree check and `map:check` do not change. A ledger path that is not a mapped module never joins an import radius, so the block marks it `(no import path)` or `*`, which is true. Today 57 of the 61 ledger paths are mapped, one is ignored and three are not modules.

If the seat keeps it, the red cases must become "a Reads path naming a tracked `docs/reviews/<lane>/seat-mutate.mjs`" and "the check reading only writers". The row must also say "test modules count as mapped".

---

## 6. SHOULD: the `none` line and the closing note claim more than the block reads

**Evidence.**

(a) **A file that is itself an artifact.** The block keys only on writer and reader paths. 30 live entries are class `tracked` with a file location. Several have recorded readers:
- REQUIREMENTS.md (A-030): 3
- HANDOFF.md (A-003): 3
- `templates/_shared/requirements-general.md` (A-038): 3
- the review standard (A-058): 1
- the writing rule (A-005): 2

So `--impact packages/nana-pack/prompts/review-standard.md` prints "artifacts: none recorded for …", while the ledger records its reader. This is a realistic question: who reads the file I am editing?

(b) **A shared codec.** After land-records lands, `packages/nana-pack/lib/record-ledger.mjs` appends for `build-records.mjs` (A-006) and `land-records.mjs` (A-082). It prints "none recorded". The seat's subtraction of the "one import away" line is what makes this case silent.

(c) **Deliverable lines.** The seat decision "the ledger's `Artifact:` and `Reads:` lines stay the only record" is not true today:
- Deliverable `Made by: R-nnnn · … · A-nnn` and `Read by: R-nnnn · code: …` lines also name makers and code readers. Rerun with `deliverableClaims`: 23 artifacts have such a link, and 19 of them have code readers missing from Reads lines.
- Example: R-1272's `Read by: R-1272 · code: scripts/code-map.mjs, …` (REQUIREMENTS.md:2173).
- So `--impact scripts/runtime-measure.mjs` lists only `scripts/product-report.mjs` as an A-032 reader, not the impact command itself.
- Same for A-082: land-records' `Read by: R-2811 · code: packages/nana-pack/bin/build-report.mjs, packages/nana-pack/bin/nana-land.mjs` (land-records REQUIREMENTS.md:475), while the block prints `read by: —`.

**Replacement text.** Seat decision "One record":

> - **One record shown.** The block reads only `Artifact:` writer lists and `Reads:` lines, joined to the import graph each time it runs. Deliverable `Made by:` and `Read by:` lines also name makers and code readers for 23 artifacts; this lane does not join them, and the closing note says so. Nothing goes into `docs/code-map.md` or any module header; a ledger edit never makes the map stale.

R-2822's none clause: "a named file on no `Artifact:` writer list and no `Reads:` line shall print `artifacts: no Artifact writer list or Reads line names <file>`".

R-2822's closing-note clause: "one closing note saying the block shows only `Artifact:` writer lists and other features' `Reads:` lines, and leaves out readers in the maker's own feature, deliverable `Read by:` lines, hand-run makers and a file that is itself an artifact's location".

The exact text lives in the closing label, which the seal pins, and the test imports the name. That makes it fixed enough to test: assert the label is printed exactly once.

Known limits, add:
- Naming an artifact's own file, such as REQUIREMENTS.md, HANDOFF.md or the review standard, lists none of its readers.
- A shared codec that writes for its callers, such as `record-ledger.mjs` once land-records lands, shows no artifact; the ledger names the caller.
- Deliverable `Read by:` lines are not joined. Impact on `scripts/runtime-measure.mjs` does not list `scripts/code-map.mjs` as an A-032 reader.

---

## 7. SHOULD: count, repeats and self-listing are unpinned, and live data hits all three

**Evidence** from the rerun:
- Six live paths are both a writer of an artifact and on another feature's Reads line for that same artifact:
  - A-002 and A-025: `nana-handoff.ts`;
  - A-006: `build-records.mjs`;
  - A-007: `review-round.mjs`;
  - A-022: `ci.yml`;
  - A-033: `suite-records.mjs`.
- 18 (ID, path) pairs sit on 2 to 7 features' Reads lines. For example:
  - A-021's writer `template-release.mjs` has `release-status.mjs` under FEAT-008 and FEAT-015;
  - A-025's readers include `adoption.mjs` and `nana-adoption.mjs`, twice each.

The draft leaves three choices open:
- whether "count of linked artifacts" means distinct IDs or lines;
- whether an ID the file writes is repeated on its `reads` line;
- whether the file appears in its own `read by:` list, which R-2820's "every reader path" implies.

The prototype dedups and drops the self entry (block.mjs:18, :22), so builder and reviewer can disagree.

**Replacement text.** Add to R-2820:

> The heading's count is the number of distinct artifact IDs on its `writes` and `reads` lines; an ID the file writes is not repeated on its `reads` line; the named file is not listed among its own readers; a reader path that several features' `Reads:` lines name for one artifact is listed once with those features.

Red cases: "an artifact both written and read counted twice"; "the file listed as its own reader"; "a reader path listed once per feature".

---

## 8. SHOULD: R-2820's "a retired entry listed" red case is one the obvious wrong code cannot produce

**Evidence.** A retired line is `A-nnn · name · retired: <reason>`. The registry gives it `writers: []` (deliverables.mjs:157-170; the fixture's A-003). So deleting the block's `live` filter still lists no retired entry, and that wrong-code pair survives. Only a text match on the line would list it.

A line the registry calls malformed is different. With an unknown class, such as `clone-store:`, the entry is `live: true` and keeps its writers (deliverables.mjs:166-176; the fixture's A-004). The block shows it as a writer, which is acceptable: it is what the ledger records, and R-2730 fails the suite on it.

**Replacement text.** Swap R-2820's red case "a retired entry listed" for "readers of a different artifact listed under this artifact's `read by:` line". That catches a join on the wrong key. Optionally add "the import radius taken from the union over all named files". `impact().callers` drops every named path (template code-map.mjs:633), so a second named file inside the first file's radius would be wrongly marked. The fixture needs two named files to catch it.

---

## 9. NOTE: existing consumers of the impact output stay green, given a synchronous exit

Every reader of `--impact` output, grepped across tests, scripts and tools:
- **R-1272.** runtime-map.test.mjs:172-189: `endsWith` the no-data suffix, then `startsWith(staticPart + "\n")`.
- **R-1273.** :192-194.
- **R-2534.** :285-296: `includes`.
- **R-1278.** :561-573: `includes` and status 0.
- **R-2528 and R-2529.** In-process `runtimeBlock`, untouched.
- **code-map.test.mjs.** R-861 calls `formatImpact` in-process (:224-229). R-1361 uses the template generator in a scratch copy, not the shim (:258-265).
- **templates-render.test.mjs.** Runs the rendered project's own generator.
- **skill-claims and readme-check.** Text only.
- No land, review, `test-locked`, product-report or `requirement-rows` code reads `--impact` output. `template-acceptance.mjs:96` runs the rendered project's script.

With a deterministic block placed before the runtime block, R-1272's prefix becomes "generator plus block" in both runs and stays equal (*inferred*, not run).

The ordering only holds while the shim ends with the synchronous `process.exit`. My rerun of a dynamic import of the parse chain gave:
- no warning with a synchronous exit;
- a `MODULE_TYPELESS_PACKAGE_JSON` warning on stderr with a natural end;
- the same warning with `process.exitCode = 0`.

`runCodeMap` appends stderr after stdout (:143), so R-1272 and R-1273 would turn red. They catch it, but the brief should say so up front. Finding 1's seam bullet carries it.

R-1272's test title still reads "the generator's output byte for byte, then the measured test files". Retitle it with the row wording, or the evidence cell describes the old order.

## 10. NOTE: the import chain is quiet at load, and the new map edges are allowed

- Every module in the chain has a main guard or no top-level effect: `requirements-tree.mjs:658`, `requirements-moved.mjs:306`, `requirements-trace.mjs:60`, `apps/bench/lib/fixture.mjs:146`, and `checkers.mjs` (constants only).
- My replica printed nothing but its own lines.
- The chain loads `templates/typescript/template/tests/requirements-trace.ts`. So the block depends on Node's default type stripping, from 22.18 on; CI pins `node-version: 22`. On an older Node the load fails, and R-2823 prints the note every time. Add that as a known limit.
- The literal dynamic specifiers become map edges (rerun above), so `npm run map` must be regenerated and committed.
- Both targets are `scripts/`, the same `apps` layer as the shim (`code-map.config.json` layers), so `--check` stays clean (*inferred*).
- The map's shim, `deliverables.mjs` and `requirements-tree.mjs` entries change. The shim's `@inputs`, `@purpose` and `@errors` need the ledger.

## 11. NOTE: the block builds the graph twice more than it needs to

- `resolveImpactPaths` builds its own graph (scripts/code-map.mjs:57), and the radius needs one more.
- One graph costs 60 to 150 ms (rerun: 150 ms cold, 62 ms warm). The whole run takes 0.94 s.
- Build the graph once in `artifactBlock` and pass it to the path resolution. The seam bullet says "builds one graph from `root`".

## 12. NOTE: the labels' home drifts `runtime-map-config.mjs`'s one purpose, and the seal is incomplete

- `runtime-map-config.mjs:3` declares "the runtime-map layer's tunables". Either widen that one sentence to "the runtime map and impact command's tunables", or give the labels their own config module. The labels must stay importable without the parse chain, so MM9's copied config keeps working.
- The seal names R-2820, R-2822 and R-2823, but the `reads` label and `*` belong to R-2821. Name R-2821 too.
- The seal also omits `read by:`, `(no import path)`, `*` and finding 3's `(no live entry)`. Seal them or say why not.
- `—` can follow the inline precedent at `runtime-map.mjs:143`.

## 13. NOTE: precedents to add, and no helper copy

The named precedent paths all exist. Add:
- `scripts/requirements-tree.mjs` `ledgerReadProblem` (:586) and its use at `scripts/product-report.mjs:603-605`;
- `scripts/product-report.mjs:715` for the `no live entry` display. It is already an inline literal three times there; a fourth use would be the moment to lift it into `deliverables.mjs` as a constant;
- `runtime-map.test.mjs:218-250` `relationRoot`, for an in-process block call on a fixture root;
- `scripts/requirements-moved.mjs:148-153`, for `artifactRegistry(parsed, null)` and `artifactReads(parsed, null, registry)` with no tracked set.

`resolveImpactPaths` is reused inside its own module, so nothing private moves. "No private helper moves" holds unless the `no live entry` constant is lifted; then the Precedent section names that move.

## 14. NOTE: argument edges the rows need not pin

- A named file that is not a module, such as `.github/workflows/ci.yml` (an A-034 and A-022 writer), gets radius {itself}. Its readers are all marked. That is correct, and a cheap fixture case.
- A file named twice repeats its section, as the generator repeats its own.

## 15. NOTE: glob or folder writers and A-082

- The registry keeps a glob or folder writer string as written (deliverables.mjs:168). It never equals a module path, so the block stars it or marks `(no import path)`, and a file inside the folder shows nothing.
- R-2730 fails the suite on such a writer (deliverables.mjs:190), so main cannot carry one.
- A-082 (land-records REQUIREMENTS.md:784) has one writer and no Reads line. The block shows `read by: —`; finding 6 covers why that reads wrong.

## 16. NOTE: the README clause is prose the readme check does not test

The readme check verifies named commands, paths and flags, not what the impact command prints. Keep the clause, since README.md:57-69 already lists the impact output and must stay true. Report it as written, not pinned.

## 17. NOTE: a simpler zero line was considered and not preferred

The runtime block's zero form `measured tests for <file> (0): —` (runtime-map.mjs:143) suggests `artifacts for <file> (0): —` and one less label. Finding 6's honest `none` text is preferred, because a skimming reader takes `(0): —` as "touches no artifact". Choose one and seal it.

## 18. NOTE: the class and ladder read right

The lane changes no install, hook, gate, land or review tool, and no template. The shim is not on the post-edit or land path; only `map:check` is. Ordinary class and one final reviewer fit. Pushing the draft pull request at build 1 and reading the Windows leg is the right guard, because finding 2's Windows form shows only there.
