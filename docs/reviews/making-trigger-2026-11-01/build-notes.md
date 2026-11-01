# Making trigger — build 1 technical record

## Scope

FEAT-040, SUB-024, R-3290–R-3312, A-093. The objective served is carrying learning into subsequent work. No session-end hook, installer wiring, doctor row, real transcript read, real profile read, real opt-in, model call or real making run was used.

## Implementation

- `bin/nana-memory.mjs`: injected enable/make/status command boundary.
- `scripts/memory-run.mjs`: real CLI adapter using the unchanged `createRunner`.
- `lib/memory-run.mjs`: source sweep, repository lock, machine-wide reserve/settle ledger, short local clone lock, health and detached starter.
- `lib/memory-store.mjs`: immutable project area, normalized-claim/unit merge, saved-record precedence and evidence fallback.
- `lib/memory-run-config.mjs`: fifteen row-tagged seals, shared classifier/profile bounds imported rather than copied.
- The authorized helpers were exported or moved exactly as named. `profile-guards.mjs` computes the checkout relative to its own file. No other private helper moved.
- `memory-shaping.mjs` accepts injected units, caps and reservation callbacks; failed calls stay pending and completed malformed calls finish once. The manual shaper retains its existing output/accounting contract.
- `profile-sync.mjs` exposes local/fetch/push phases and a zero-wait lock option; network work and model work stay outside the maker's clone-lock holds.
- `nana-land.mjs` wraps its existing recorded result, calls only an injected starter, and catches its failure. The CLI alone supplies the real starter.

## Precedent departures and reasons

1. A small `scripts/memory-run.mjs` adapter supplies the unchanged shaper runner. Directly importing that script-layer runner into a package failed the existing layer check. The package CLI delegates to the adapter rather than moving or copying the runner.
2. A lane-triggered review sweep drains its exact lane first and then immutable git-local remembered land requests. It does not treat every other main review folder as that trigger's source. This reconciles the mandatory `memory` versus `memory-shaper` isolation case with retrying earlier busy/capped lands. A make/status invocation without a lane scans all eligible main review folders. Trigger requests are recorded before the run-lock attempt, so busy lands remain discoverable. This is an extra machine-local source registry beyond the plan's seen-only derivation.
3. A busy run retains counts-only health in the clone's git directory rather than writing a synchronized run file while another writer owns the clone. Successful local write phases also retain the planned immutable synchronized run file. The plan's every-run file clause and no-write-on-clone-contention clause otherwise conflict.
4. The JSON run-lock release adapts the existing `releaseLaneLock` reader to check both pid and the run's nonce. Its acquisition/staleness logic is new, as the plan permits; the detached starter follows the knowledge hook pattern but does not import its private `spawnBuild`.

## Existing tests edited

Only `packages/nana-pack/tests/requirements-tree.test.mjs` changed: the R-288 real-ledger heading count and the R-1158 CRLF real-ledger count move from 72 to 73 for SUB-024. No assertion was weakened and no test was deleted. The other precedent test files remain unchanged.

## Wrong code and checks

- `wrong-first.txt`: the no-op command/store/starter and missing making policy fail all eight must-meets and all fifteen seals: 0 pass, 23 fail, exit 1.
- `deferred-review-wrong.txt`: the added cross-land review case fails before the request registry implementation, exit 1.
- `touched-tests.txt`: 11 files, 189 checks, exit 0 before the later request-registry extension.
- `memory-tree-tests.txt`: current must-meets, seals and tree checks, 121 checks, exit 0.
- `synthetic-e2e.txt`: enable/make/status against a temporary home/profile clone/local bare remote: sent 2, done 3, pending 0, tokens 100, records 3; exit 0.
- `install-check.txt`: exit 1 only on `pi post-edit` / `write-error`, the brief's known builder-environment exception. Every other install rehearsal check passed.
- The first locked full suite had 246 passing files and one failing file, exit 1: the generated requirement outline and two real-heading counts needed the new subgroup. The outline was regenerated and both affected existing assertions updated; the targeted tree checks now pass.

## Known-bug context touched

The model maker is now the automatic path, but this does not claim improved scored recall or precision or change the frozen prompt. New project evidence copies address transcript expiry for these newly made records only; old records are not backfilled. No other listed known bug was fixed. In particular, the colon-bearing seat pointer, profile show/sync role refusal, remote privacy recheck and Windows Claude CLI startup remain out of scope. Exact normalized merge does not catch reworded duplicates; upkeep remains necessary. The brief prohibits editing the known-bug files, so this residual is recorded here rather than there.

## Open questions / not done

- Should a lane-triggered sweep read every other dated main review folder even when no land request for it was observed? This build chooses the mandatory exact-lane isolation case and remembered earlier lands; no-lane make/status can discover the remaining folders.
- The next lane owns SessionEnd, install wiring, doctor and the real Claude-parent Windows survival check.
- Final mutation/full-suite/seat-check/CI evidence follows in this folder after the implementation commit. No independent model review was launched; the builder is prohibited from starting sessions or subagents.
