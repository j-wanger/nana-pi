# Fix brief 5 — Windows child context

## Result

PARTIAL: corrected a Windows-only fixture metadata overwrite and added readable M5 diagnostics. All named local checks pass. The exported Windows log omits the assertion values, so it does not establish that the metadata overwrite caused that specific failure. Native Windows confirmation remains for the seat; no CI was started or read.

## Changes and rows

- `packages/nana-pack/tests/child-context.test.mjs`: `writeFakePi` overwrote the fixture's explicit ESM package metadata with CommonJS-compatible metadata on Windows only. Call that shared helper before writing the final package metadata, on every platform. Keep the CLI explicitly CommonJS (`cli.cjs`) and the section loader explicitly ESM. M5 now checks that fixture invariant and prints the launcher, part, actual value and expected value for every assertion. The shared launcher assertion also prints status, signal and launch-error code.
- `docs/code-map.md`: regenerate changed launch line references.
- Existing row R-3919 remains unchanged: no runtime contract, requirement ID or tunable changed. No tests were added, deleted or renamed. The only existing test edited is child-context, including its fixture and launch assertion.
- No production code changed. Section counts use the exact composed strings' `.length` in `promptSectionParts`; the compared captured values also use `.length`. No newline normalization or CRLF-specific count defect was found. Rulings are skipped for these roles, so their source-file line endings cannot explain a nonzero delivered rulings count.

## Mutation pair

M5 fixture metadata pair: move `writeFakePi` after final package metadata, reproducing the old Windows ordering on macOS. M5 exits 1 with `pi-worker section loader module format: actual=undefined expected=module`. Restore the correct order: all six child-context cases pass, exit 0. Assertions were not inverted.

An earlier probe reproduced the overwritten metadata without the new invariant assertion and still passed on local Node 22.22.2. Disabling module detection made the launcher fail, but that is not evidence about the Windows runner's settings. Neither probe proves the original Windows failure's cause.

## Memory curation

No change. The failing case injects its proposers into `runCurate`; it does not invoke pi-worker, builder prompts or extension discovery. Recursive traversal of literal local static and dynamic imports from `memory-curation.test.mjs` reached 39 modules; none appears in `git diff main --name-only`. Its fixture also supplies a spawn function that throws on unexpected process launch. The test passes locally, including the named bad-model case. The case has a 120-second deadline; the reported 390 seconds is the whole file's runtime, not evidence that this case hit that deadline. The Windows failure's underlying cause remains unmeasured, outside this lane's changed call graph.

## Validation

Full output: `docs/reviews/child-context/windows-fix.log`. All exit codes below were read separately.

| Command | Exit |
| --- | --- |
| `node packages/nana-pack/tests/child-context.test.mjs` | 0 |
| `node packages/nana-pack/tests/memory-curation.test.mjs` | 0 |
| `npm test -- --pack=land,module --changed-from=main --jobs=4` | 0 |
| `node scripts/requirements-trace.mjs` | 0 |
| `npm run -s map:check` | 0 |
| `npm run -s readme:check` | 0 |

Selected summary: 189 files: 189 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 4504 pass, 0 fail, 14 skip.

The initial selected run exited 1 solely because the generated map still held old launch line references; code-map-land and page-retire reported that drift. Regeneration and the next run resolved it. The full suite was not run: AGENTS.md assigns it to CI. No test file was added or deleted, so the test-runner registration check was not required.

## Scope and remaining work

No Precedent section was supplied for this fix card; the fixture still imports the existing shared `writeFakePi` helper rather than copying it. No precedent departures. Read the entire FEAT-013 known-bug file; none of its entries was fixed, deleted or changed. In particular, the existing probe trust and shared-deadline limits remain untouched. No removed or renamed sentence, path or filename needs caller migration; searched tests for the retained M5 title, fixture version, helper invocation and file name.

The seat must run the revised M5 on native Windows. If it still fails, its first assertion line now identifies the failed part and values. No push, model session, subagent, credential lookup or GitHub action was performed.
