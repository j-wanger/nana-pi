VERDICT: DONE

## Build 3 scope

R-3183 remains `implemented` with its original tagged evidence title.
Only cancelled-run handling from the third brief changes.
The final session report supplies the commit, push and finished new-tip CI result.
This record describes local evidence, not a separate claim that CI has finished.

## Files and row

- `REQUIREMENTS.md`: extend only R-3183 with non-cancelled selection, skipped count and clean all-cancelled handling.
- `packages/nana-pack/lib/main-ci.mjs`: extend the existing filtered, descending main push list; select the newest finished non-cancelled run, count newer cancelled runs and return before reading records or posting when all finished runs are cancelled.
- `packages/nana-pack/tests/main-ci.test.mjs`: add the two requested cases inside the existing R-3183 declaration; retain its title, marker and all prior assertions.
- `packages/nana-pack/README.md`: state non-cancelled selection, skipped count, all-cancelled exit 0 and no posting for cancelled runs.
- `docs/code-map.md`: regenerate the changed module purpose.
- This folder: `builder-cancelled-pair.txt`, `builder-checks-build-3.txt`, `builder-suite-build-3.txt` and this report retain evidence.

## Added cases and edited tests

Both new cases run under the existing R-3183 test:

1. An unordered page has two newer cancelled pushes, an older non-cancelled red push and an even older cancelled push. Select and download only the non-cancelled run, print exactly two skipped newer cancellations and post only for the selected run.
2. Every finished main push in the page is cancelled, with a newer successful PR run present. Print one named all-cancelled line, return 0, do not scan, download, read jobs/artifacts or invoke issue operations.

No existing assertion became false or needed changing.
No other test declaration was edited, added or deleted.
Cases remain synchronous and use the precedent's injected gh and OS temporary fixture root.
No text line reader, asynchronous harness, sealed tunable or seat-script test was added.

## Wrong-code pair

Command: `node packages/nana-pack/tests/main-ci.test.mjs`.

| Implementation | Exit |
|---|---:|
| Original filter, before implementation | 1 |
| Correct implementation | 0 |
| Drop the skip: select `finished[0]` | 1 |
| Restore the non-cancelled filter | 0 |

Both wrong runs selected cancelled run 50 instead of run 20 and posted once on the all-cancelled page.
The combined assertion reports both mismatches, so both cases execute before failure.
The mutation changes code, not assertions.
Complete output is in `builder-cancelled-pair.txt`.

## Local commands and exits

| Command | Exit | Result |
|---|---:|---|
| `npm run map:impact -- packages/nana-pack/lib/main-ci.mjs` | 0 | Read the affected callers and callees before editing |
| `node scripts/code-map.mjs --write` | 0 | 500 modules |
| `npm run test:locked` | 0 | Foreground, machine-wide lock, no filter or extra arguments |
| `npm run map:check` | 0 | 500 modules, zero problems |
| `npm run readme:check` | 0 | 904 claims, zero problems |
| `node scripts/requirements-trace.mjs` | 0 | 2210 rows, zero problems, zero off-form rows |
| `node packages/nana-pack/tests/requirements-trace.test.mjs` | 0 | 61 passed, zero failed |
| `node scripts/requirements-tree.mjs` | 0 | 2210 rows, 39 features, zero problems |
| `node scripts/known-bugs.mjs --root .` | 0 | `summary names=0 sizes=0` |

The final session report gives identity-scan, whitespace and last-commit check exits.
Full output is retained in the named evidence files, with local paths replaced and trailing whitespace removed.
`nana-writing --report` exits 0 with advisory findings on the required verdict prefix, technical paths, passive candidates and one long technical sentence.
Those findings remain because this is a worker technical record, outside the owner-prose rule, and the brief requires exact identifiers and verdict spelling.

```text
241 files: 239 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8745 pass, 0 fail, 44 skip · 589.4s
```

The classifier prints `ordinary` for these narrow fix paths, with frontier entry points listed under `also reaches`.
The brief's gate classification still governs this build; no classifier rule changes.

## Precedent and departures

Read both precedent files completely before designing: `packages/nana-pack/lib/main-ci.mjs` and `packages/nana-pack/tests/main-ci.test.mjs`.
Extend their existing main-push filter, ordering, named-line output and early-return style.
Reuse the existing fixture, injected gh boundary and R-3183 assertion pattern.
Keep `readCiRecords`, `finalFiles` and command construction imported and unchanged.
No helper was copied, moved or exposed.
No departures from the Precedent.

## Not done and known-bug context

- Leave both other independent-check findings alone: missing local commits can still produce unexplained red; file-path title deduplication remains untested.
- No other listed known bug is fixed or touched.
- No install check was run; the brief reserves it for the seat.
- No HANDOFF, known-bug file or session archive was edited.
- No GitHub issue was created, edited, commented on or closed.
- No model session or subagent was started.
- No reviewer or land was run; those remain seat work.
- The Windows R-3104 timeout rule applies if new-tip CI hits that known flake; the final session report records any required rerun.
