# Load-log output bound fix

VERDICT: DONE

Branch: `feat/load-log`. The worker report supplies the final commit SHA.

## Changes

- `REQUIREMENTS.md`: extend existing R-3732 with the sealed 1 MiB stdout bound and overflow status; clarify R-3726's checked-field-only result. No new IDs or shares.
- `packages/nana-pack/bin/worker-config.mjs`: define `PI_CONTEXT_OUTPUT_MAX_BYTES` beside the deadline, with chosen-value provenance.
- `packages/nana-pack/lib/pi-context-load.mjs`: count raw bytes before retaining chunks; destroy stdout and reuse the existing child-kill path on overflow; parse only bounded bytes; reconstruct checked result fields.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: add exactly the requested overflow test and cap pin. Extend the existing R-3726 test with the requested assertion that child extras disappear at both levels. No existing assertion changed or test removed.
- `docs/code-map.md`: regenerate changed test launch line references.
- Evidence: `r3-evidence.log`, `r3-impact.log`, `r3-lane-class.log` beside this report.

## Wrong-code / right-code pairs

All commands use `node packages/nana-pack/tests/context-anatomy.test.mjs` with the named `CONTEXT_CASE` filter.

| Case filter | Wrong code and exit | Correct code and exit |
|---|---|---|
| `R-3732: context measurement output` | Cap defined as 2,097,152 bytes: 1 | Cap defined as 1,048,576 bytes: 0 |
| `R-3732: oversized` | Original unbounded stdout accumulation: 1; launcher exhausts its 64 MiB heap | Bounded accumulation: 0; both launchers deliver, retain the brief, report output too large, and kill measurement |
| `R-3726:` (added assertion) | Original `finish(result)`: 1; top-level signal/content and per-part content/extra survive | Reconstructed result: 0; only checked fields survive |

The overflow fixture writes toward 128 MiB directly to the metadata channel with partial-write and EAGAIN handling. Only launcher subprocesses receive the 64 MiB heap limit. Fixtures live under the OS temporary directory. Every case is awaited under the existing per-case limit. No assertion was inverted.

## Verification

- `node scripts/test.mjs context-anatomy outcome-meter worker-lane win32-launch`: exit 0.
- Summary: `4 files: 4 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 123 pass, 0 fail, 8 skip`.
- `node scripts/code-map.mjs`: exit 0.
- `node scripts/code-map.mjs --check`: exit 0.
- `node scripts/requirements-trace.mjs`: exit 0.
- `node scripts/requirements-tree.mjs --root .`: exit 0.
- `node scripts/readme-check.mjs`: exit 0.
- `node scripts/lane-class.mjs --root . --files <changed code, test and ledger paths>`: exit 0; exact invocation and classification appear in lane-class evidence and worker execution.
- `git diff --check`: exit 0.

Writing check: `nana-writing --report` exited 0. Its verdict-format, sentence-length, passive-voice and identifier notices remain because this is the brief-required technical worker record, exempt from owner-facing prose rules.

Precedent departures: none. The existing process-stop helper and deadline pattern are reused; no helper is copied.

Known bugs: no listed residual is fixed or changed by this patch.

Not done: full suite (AGENTS.md delegates it to CI), native Windows execution (eight existing platform skips), CI reads, pushes, model sessions, issue changes, or protected-file edits. No additional seat checks were named in this fix brief.
