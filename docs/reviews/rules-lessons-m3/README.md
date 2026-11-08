# M3 completion evidence

Requirement: R-3896, FEAT-006. No new requirement IDs.

Changed the existing partial M3 check in `packages/nana-pack/tests/templates-render.test.mjs` to read live HANDOFF as well as its seed, AGENTS and builder Scope. Added its `req:` marker and changed its title to remove the partial authorization qualifier. The check rejects the narrative sentence on all three documentation surfaces and the session-archives restriction in Scope. The Scope delimiter accepts CRLF and trailing whitespace.

The seat's existing HANDOFF change supplies the correct implementation. This lane did not edit HANDOFF, its seed, AGENTS or the preamble. R-3896 moved through untested before the expanded test ran, then to implemented after it passed. No other existing test changed. No sealed tunables, callers, runtime code or known-bug entries changed. No Precedent section was required for this fix card; the existing M3 check remains the pattern, with no departures.

## Wrong-code pair

Before marking the row implemented, copied the four surfaces to an OS temporary directory. Extracted the exact M3 check from the changed test file, bound REPO and agents to that copy, and ran it synchronously under a one-second VM limit. Restored the old HANDOFF from `a3fcc726^:HANDOFF.md` in the temporary copy only. The same check failed (exit 1), then passed with current HANDOFF (exit 0). Repeated with CRLF, trailing spaces and tabs, and no final newline. All four pairs behaved identically. See `mutation.txt`. The repository's HANDOFF was never written; assertions were never inverted.

## Commands before commit

Each command exited 0; adjacent text files contain output. Local paths in warnings were normalized to repository-relative paths.

- `node packages/nana-pack/tests/templates-render.test.mjs` — all passed; 177 PASS checks, no FAIL or SKIP.
- `node scripts/component-audit.mjs --check` — passed; stale and unclaimed notices remain report-only.
- `node scripts/requirements-trace.mjs` — passed.
- `npm run map:check` — passed.
- `npm run req:tree` — passed.
- `npm run readme:check` — passed.

CI covers the full suite under AGENTS.md. No local full-suite run, push, CI read, model session, seat-script test or install check was needed. The lane changes no setup implementation or hook. The builder report records the required checks repeated on the committed tip.
