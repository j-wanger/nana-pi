# setup-tail review 1 fixes

## Scope and rows

- R-3885: include pack launchers in the no-automatic-checks claim scan.
- R-3892: pin Windows manual-command quoting with injected platform and runner; retain the rendered-project checks.
- R-3887: M3 skips unavailable uvx unless the existing required-tools switch is set.
- R-3156: record the project JSON-helper loss and the remaining removed doctor-floor imports.
- No new rows or sealed tunables.

## Files and closures

- `packages/nana-setup/tests/setup-tail.test.mjs`: closes MUST M8 quoting and SHOULD 4 optional tools; widens M1 for SHOULD 2.
- `packages/nana-pack/bin/pi-worker.mjs`: closes SHOULD 2 by naming ignored project gate configuration, not retired checks.
- `packages/nana-setup/README.md`: closes SHOULD 1's three stale starter descriptions.
- `packages/nana-pack/tests/code-map-launch.test.mjs`: closes the named CI edge failure.
- `REQUIREMENTS.md`: narrows the changed contracts and adds Windows argv evidence.

Existing test edits: M1 includes pack bin files and the retired notice spelling; M3/M8 skip missing tools; M8 uses the injected launch helper; the harness awaits and counts skips. R-3156 adds named losses. Worker-lane's existing trust assertions pin only the notice prefix, so need no edit.

## Wrong-code pairs

1. New `M8 Windows: manual command argv preserves embedded quotes` against the original unwrapped argv without verbatim options: exit 1, 8 pass / 1 fail. Correct quoted argv plus verbatim options: exit 0, 9 setup-tail checks pass.
2. Widened M1 against the original worker notice: exit 1, M1 fails. Reworded notice: M1 passes.
3. Existing R-3156 without the named loss: exit 1, reports the project-to-json-text edge. Added loss: that edge passes; the check then exposes removed doctor-floor imports. Recording those losses makes all 12 map-launch checks pass.

The failing assertions stayed unchanged; the old launch and notice were the wrong implementations.

## Precedent

Read both precedent files completely. Followed `win-command.mjs`'s quoted, verbatim cmd launch. Its `winCommand` handles executable/shim argv, not already-authored shell text, so the local test helper builds the requested shell invocation instead of misusing or copying that function. Followed the launch-map test's existing named-loss entries and floor-removal loop.

Scope departure: extended that existing floor-removal loop to the ten other setup tests whose removed imports the same R-3156 check exposed. These imports were already removed before this revision; no product code changed for them.

## Validation

`checks.log` contains the complete touched-test, map, tree, README and local macOS install-check output. Each command exits 0. Touched tests: 3 files, 89 checks pass. README: 846 claims, zero problems. Map and tree generators changed no tracked output.

`missing-tools.log` records PATH-injected unavailable uvx/uv/pnpm probes: optional mode exits 0 with 7 pass and 2 skips; required mode exits 1 with exactly M3/M8 failing. Fixtures and unavailable-tool executables live under `$TMPDIR`.

The root AGENTS says CI covers the full suite; no local full-suite run, push or CI read. Native Windows was unavailable; the new test pins injected win32 argv and options.

Read all of `docs/known-bugs/FEAT-013.md`; none of its recorded bugs is changed by this revision. No known-bug file, HANDOFF or session archive was edited. SHOULD 3's copier floor remains for the seat.
