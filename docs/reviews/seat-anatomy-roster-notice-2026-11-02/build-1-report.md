# Build 1 technical record

## Scope and rows

Feature FEAT-042. Amended R-3640; implemented R-3682, R-3683 and R-3684 with backticked test-title evidence. Requirements changed before tagged tests; tests ran against unchanged baseline implementation before code changed.

Baseline: `68a616bc35605e23d93955e8b40262e27115b843` (HEAD and origin/main at build start).

## Implementation

- `apps/bench/lib/anatomy-config.mjs`: sealed `contextHooks: ['roster-notice']` and nested envelope path, with contract provenance.
- `apps/bench/lib/anatomy-seat.mjs`: retain imported `desiredHooks` labels and existing `hookKind`; a producer requires a recognized public SessionStart label and configured producer kind. Failed hooks and foreign labels do not qualify.
- Remove adjacency correlation. Resolve commandless context after collecting its whole start window. Exactly one producer kind attributes; zero stays hook-other; multiple kinds stay hook-other with one ambiguity per entry. Invocation IDs do not participate.
- O1: mutate name and identity, re-segment spans with the original part prefix. This avoids changing order, phase, delivery or inheritance.
- Dedupe commandless context against successes of its resolved producer kind only. Inspect counted raw payloads and their top-level or nested JSON envelope; do not count or dedupe against stdout. A duplicate removes the additional part once.
- Existing command-bearing invocation correlation remains unchanged. Closed windows never supply candidates to later segments.
- Synthetic fixtures use the existing OS-temp fixture writer, including CRLF, trailing space/tab and no final newline. Every async test remains awaited and bounded by the existing per-case timer.

## Wrong-code pairs

`wrong-code.txt` records full runs of `node apps/bench/test/anatomy-seat.test.mjs`:

1. Baseline implementation, new tests: exit 1, 13/16 green. M1 fails `M1 resolved producer kind` (line 158); M2 fails `M2 no producer missing` (line 172); M3 fails `M3 objective overlap cannot remove roster` (line 190).
2. Baseline implementation, updated existing expectations and seal: exit 1, 9/16 green. The policy deep-equality assertion (line 329) rejects missing contextHooks and nestedEnvelope.
3. Candidate implementation, before correcting two existing expectations: exit 1, 14/16 green; all three new tests and the seal pass.
4. Candidate implementation, corrected existing expectations: exit 0, 16/16 green.

Final candidate run in `build-1-green.txt`: exit 0, 16/16 green. These pairs break the code, not assertions: baseline implementation was the obvious wrong implementation. No real transcript text was read.

## Existing-test edits and precedent departures

- R-3640 public-label test: only roster-notice attributes; objective, adoption and shared-memory commandless context remains hook-other, as planned.
- R-3640 seal: pin contextHooks and nestedEnvelope, as planned.
- R-3643 invocation/queue test: objective loses nine unsettled characters, as planned. Additional necessary changes: commandless same/json remain hook-other without a producer, so hook-other gains 17 characters overall, same has three retained occurrences, and no hook ambiguity remains. The later nine-character hook-other delivery now contributes nine repeated-delivery characters. These changes follow Design 3–4; retaining the old assertions would preserve unsupported adjacency/dedupe behavior.
- No payload-accounting fixture edit remains: script commands still classify successes, but only imported public labels qualify context producers.
- No exports, helper copies, module moves or other precedent departures. The existing post-pass, imported labels and span segmenter are reused. README has no commandless attribution sentence, so it stays unchanged.
- No listed known-bug item was touched or fixed.

## Validation

`build-1-green.txt` records four commands, each exit 0:

- `node apps/bench/test/anatomy-seat.test.mjs`: 16/16 checks passed.
- `node apps/bench/test/anatomy.test.mjs`: 9/9 checks passed.
- `node apps/bench/test/anatomy-labels.test.mjs`: 30/30 checks passed.
- `node packages/nana-pack/tests/test-runner.test.mjs`: all checks passed.

`generators.txt`: `npm run map` and `node scripts/requirements-tree.mjs --write`, each exit 0. Generated code map and requirements tree are included.

`checks.txt`: map, README, requirement trace, tree and known-bugs checks each exit 0; lane class ordinary. Machine paths in warning output are replaced with `<WORKTREE>`. After staging, `node scripts/identity-scan.mjs --root .` exited 0 with findings=0.

## Not done

A4 requires the other seat's frozen real-input counts, revision record and checksum. This builder cannot produce that evidence and did not edit seat-counts.md or access real transcripts.

The pre-existing untracked adversary-brief.md and build-brief-1.md remain untouched and uncommitted.

No push, per lane brief. No full local suite: AGENTS.md assigns it to CI; the seat must arrange CI validation. No CI run was started, waited for or read. No reviewer session was started. Installation-stale notice was reported, not repaired outside this lane's scope.
