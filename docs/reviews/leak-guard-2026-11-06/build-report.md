# Leak guard build record

## Scope and files

- Feature: FEAT-041; branch: `feat/leak-guard`.
- Requirements first: added R-3748–R-3756 as planned, then tagged tests, then code; statuses changed only after green tests.
- Scanner: `packages/nana-pack/lib/leak-scan.mjs`, `lib/leak-scan-config.mjs` and `bin/leak-scan.mjs`.
- Integration: `packages/nana-pack/bin/pi-worker.mjs`, `lib/build-records.mjs`, `prompts/builder-preamble.md`.
- Identity API: `scripts/identity-scan.mjs` now exports its existing `validateConfig`; existing `countIdentityWords` and `scanTree` callers retain their names and behavior.
- Guidance: `packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-pack/README.md`.
- Tests: `packages/nana-pack/tests/leak-scan.test.mjs` adds only M1–M8 and the per-file cap seal.
- Generated files: `docs/code-map.md`, `docs/requirements-tree.md`; configuration: `code-map.config.json`.
- Evidence: this directory's text files, with machine roots normalized and trailing whitespace trimmed.

`buildEndRecord` adds an optional `leaks` input/output field. Its worker caller supplies it; its hard-stop watcher caller omits it and retains its existing output. The build-report and product-report readers need no code change; their touched suites pass.

## Existing test edits

1. `packages/nana-setup/tests/seat-rule.test.mjs`: add the exact push bullet to RULES; the previous exhaustive bullet inventory became false.
2. `packages/nana-pack/tests/build-records.test.mjs`: locate the build-record line by its existing prefix, rather than assuming it is the last stderr line.
3. `packages/nana-pack/tests/context-anatomy.test.mjs`: preserve the checkout layout, scanner and digest config in copied-worker fixtures; the new static dependency otherwise cannot resolve.

No test was deleted. The credential-strip and templates-render preamble assertions required no edits.

## Wrong-code pairs

`wrong-code.txt` records all nine cases failing against initial wrong code (empty scan, no-op CLI, missing guidance/integration, leaked metadata in report output, zero cap).

`mutations.txt` records nine subsequent code mutants, each exiting 1 with its named case red:

| Case / row | Wrong code rejected |
|---|---|
| M1 / R-3748 | Omit the preamble sentence |
| M2 / R-3749 | Use scanTree with the changed-file list, bleeding outside allowlist entries |
| M3 / R-3750 | Read worktree bytes instead of tip blobs |
| M4 / R-3751 | Omit the msys path form |
| M5 / R-3752 | Carry matched blob content in identity hits |
| M6 / R-3753 | Return clean exit status despite hits or skips |
| M7 / R-3754 | Replace the lane scan with an empty result |
| M8 / R-3755 | Change report lines when the optional leaks field exists |
| Seal / R-3756 | Set the per-file cap to zero |

Every mutation restored the original source in a finally block. No assertion was inverted. Test fixtures use tmpDir under the OS temp root. Cases are awaited with a per-case limit; child commands have their own limits. Fixtures include CRLF, trailing spaces/tabs and no final newline.

## Commands and exits

- `node scripts/code-map.mjs --impact packages/nana-pack/bin/pi-worker.mjs packages/nana-pack/lib/build-records.mjs scripts/identity-scan.mjs`: 0; `impact.txt`.
- Initial `node packages/nana-pack/tests/leak-scan.test.mjs`: 1 against wrong code; `wrong-code.txt`.
- Corrected `node packages/nana-pack/tests/leak-scan.test.mjs`: 0; nine checks; `green.txt`.
- Temporary mutation driver: 0; nine of nine mutants rejected; `mutations.txt`.
- Initial committed-tip gate: 1; it correctly skipped the 1,229,982-byte requirements ledger under the initial 1 MiB cap.
- Cap revision: R-3756 changed first to 4194304 bytes; its updated seal failed against the old config (exit 1, `cap-retune-red.txt`). Only then was the config changed. The larger cap admits the real ledger while retaining the same over-cap refusal contract.
- Initial touched runner: 1; stale copied-worker fixtures and last-line assertion; `touched-initial.txt`.
- Intermediate touched runner: 1 only because the generated map needed refreshing after fixture edits.
- `node scripts/code-map.mjs --write`: 0; `map.txt`.
- `node scripts/requirements-tree.mjs --write`: 0; `tree.txt`.
- `node scripts/readme-check.mjs`: 0; `readme.txt`.
- `PATH=/usr/bin:/bin:/usr/sbin:/sbin <node> packages/nana-pack/tests/templates-render.test.mjs`: 0; 36 pass, 13 skip; `templates.txt`. Restricted PATH keeps render toolchains unavailable rather than allowing the existing suite's root-level package-manager probe.
- Final filtered runner: `node scripts/test.mjs leak-scan.test identity-scan.test build-records.test build-report.test worker-lane.test worker-claude.test builder-context.test context-anatomy.test seat-rule.test credential-strip.test requirements-trace.test requirements-tree.test code-map.test readme-check.test product-report.test lane-watcher.test main-ci.test`: 0; `touched-tests.txt`.
- Final runner summary: **17 files: 17 PASS, 0 FAIL, 0 SKIP, 0 WARN; checks: 496 pass, 0 fail, 3 skip.**
- `git diff --check`: 0.

## Precedent and limits

All named tracked precedent files were read before implementation, including both known-bug files and the two build-record readers. The scanner imports the existing counting and validation functions, not scanTree. The CLI and worker share diagnostic rendering. Scan failures use fixed unavailable reasons rather than copying error messages that can contain matched text or machine paths.

One map departure is deliberate: `scripts/identity-scan.mjs` is classified in the package layer because the brief requires a package library to import its shared pure API. No broad layer exemption or copied tokenizer was added.

No named known bug was fixed. FEAT-032's tokenizer and encoding misses remain. FEAT-028's older committed logs remain untouched. The new gate is a seat-chained rule, not a hook. JSON-escaped Windows paths were not added. Hard-stop watcher records still omit the optional scan, as documented.

The full suite is delegated to CI under AGENTS.md. No push, CI read, model session, subagent or stored-credential access occurred. The local install rehearsal was not run: it starts real model turns, which this builder is forbidden to start. The seat must run it before land. Native Windows execution remains for hosted CI; injected win32 path forms passed locally. Render-specific template cases skipped because toolchains were deliberately unavailable.
