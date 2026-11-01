# anatomy-labeller — build 1

Part 1 implemented: R-3390–R-3398, FEAT-042, artifact A-098. Lane class: ordinary.
This spend serves the current priority: measure builder context so later changes follow evidence.

## Files and rows

- `REQUIREMENTS.md`: nine implemented rows with backticked test evidence; CAP-08 gains R-3390 and its maker/reader; FEAT-042 registers A-098.
- `apps/bench/test/anatomy-labels.test.mjs`: seven must-meet cases and twelve individual seals, all synthetic, awaited and bounded. No existing test changed or deleted.
- `apps/bench/lib/anatomy-labels.mjs`: blind distinct-text keys, seeded batches, reply validation, private durable append, fingerprinted resume, usage accounting and failure stop.
- `apps/bench/lib/anatomy-config.mjs`: definitions-derived sealed prompt and label choices with provenance.
- `apps/bench/lib/anatomy-measures.mjs`: export the existing `normalize`; the label module imports it, without copying it.
- `apps/bench/lib/anatomy.mjs`: label arguments, shared private-folder guard, runner injection and fixed diagnostics.
- `apps/bench/anatomy.mjs`: import the existing runner at the bin boundary with explicit model, effort and shared dollar-cap overrides.
- `apps/bench/README.md`: paid label dependency, commands, private-store contract, caps and resume; existing readers remain rule-based.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated.
- This folder's text outputs preserve the counts-only evidence.

## Red → green pairs

Requirement diff preceded the tagged tests, which preceded code. The existing implementation (no label command or label constants) was the obvious wrong implementation.

`node apps/bench/test/anatomy-labels.test.mjs`: exit 1, all 19 checks red (`wrong-first.txt`).
After implementation, the same command: exit 0, 19/19 green (`labels-tests.txt`).
This pair covers R-3390–R-3398 and each new seal; assertions were not inverted. No separate mutation campaign was run in this ordinary lane.

The kill case exits a synthetic child during call 2 and checks that call 1's rows survive. Resume also exercises CRLF, trailing spaces/tabs, a complete final row without a newline, and a torn tail.

## Commands and exit codes

- `npm run map:impact -- apps/bench/anatomy.mjs apps/bench/lib/anatomy-config.mjs apps/bench/lib/anatomy-measures.mjs apps/bench/lib/anatomy.mjs`: 0, before module edits.
- `node scripts/test.mjs apps/bench/test/anatomy`: 0, 28 passing checks (`touched-tests.txt`).
- `npm run test:locked`: 0, foreground with the machine-wide lock (`full-suite.txt`).
- Suite summary: **253 files: 251 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8926 pass, 0 fail, 44 skip · 697.9s**.
- `npm run map`: 0; `npm run req:tree`: 0.
- `npm run map:check`: 0; `npm run readme:check`: 0; `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --root .`: 0. Before the build commit it reports the new reader as not yet tracked at HEAD; repeat on the commit.
- `node scripts/known-bugs.mjs --root .`: 0.
- `node scripts/identity-scan.mjs --root .`: 0.
- `node scripts/lane-class.mjs --root . --files <plan's Part 1 paths>`: 0, `ordinary`.
- Synthetic fake-runner demonstration: exit 0 for both capped label and resume (`synthetic-counts.txt`). First run: 43 distinct, 40 labelled, 3 unsent, 1 call. Resume: 43 labelled, 0 unsent, 1 call. Final store: 43 rows. No keys or unit text printed.

An initial path-filtered run overlapped map regeneration and correctly rejected the changed tracked maps. All its test cases passed; the non-overlapping rerun and locked full suite passed. An initial README check rejected a backticked generated filename as a missing source path; the prose now names the generated file without making that claim.

## Precedent and departures

Read every file named in the brief's Precedent before design.

- Followed memory shaping's injected runner, object-root schema, local ids, whole-batch validation, fenced-reply tolerance and counts-only output. Imported the existing `createRunner`, shared `DOLLAR_CAP`, `normalize`, `seededSample` and public `readJsonl`; no other private helper moved or copied.
- Separated measured tokens from charged tokens. Unlike memory shaping, the printed unknown-usage lower bound contains only measured tokens; the conservative unknown-call charge is printed separately. Reason: an estimate is not a measured lower bound.
- Reused `readJsonl` with repair disabled, then rewrote complete rows only when repairing the append boundary. Unlike the bench's default quarantine behavior, no quarantine sidecar is created. Reason: avoid a sidecar with weaker permissions holding private keys. Successful batches append and fsync immediately.
- Resume additionally checks effort and order seed, not just model and prompt. Reason: both affect measurement identity and already live in the manifest.
- The brief supplied the public definitions but did not paste the guide's surrounding wording. The prompt uses `DEFINITIONS` directly and registers its surrounding wording at build 1. SHA-256: `422f2aa3ad294594735a46cb05cbaee66450cef501ee7407c2b11e327fcaad52`.
- The append writer and resume storage live in the new label module rather than the CLI boundary. Reason: keep the existing CLI policy shared while keeping label state and persistence together; the library never spawns.

## Known bugs and closures

No known-bug closure claimed. The first FEAT-042 entry motivates this model replacement, but its reliability claim remains unclosed until Part 2's measurements. The rare-function, old-build/unmatched-brief and three assembly entries remain unchanged and untouched by the implementation. No known-bug file, HANDOFF or session archive was edited.

## Not done

Part 2 and all model-label readers are excluded. No real store was read; no model ran and no spend occurred. The seat owns the real-runner canary, transcript-count check, full private run and later agreement measurement. Push, draft PR and finished-tip CI (including Windows) are reported with the commit in the final response. No open implementation question remains.
