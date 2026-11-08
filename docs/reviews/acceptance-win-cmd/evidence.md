# acceptance-win-cmd evidence

Feature: FEAT-033. Branch: feat/acceptance-win-cmd.

## Changes

- R-3870: scripts/template-acceptance.mjs imports findOnPath and winCommand from the precedent module. Exported defaultRun accepts platform, lookup and spawn seams; Windows shims use the safe launcher and refusals become spawn-style errors.
- R-3871: exported textOf retains both output streams and appends spawn error code and message.
- Existing production callers retain their signatures and need no edits. Repository searches covered scripts and packages.
- Existing tests edited: the spaced/percent-path CLI cases in template-acceptance.test.mjs and template-release.test.mjs now copy the new Windows helper dependencies into their temporary checkouts. Assertions are unchanged.
- Generated docs/code-map.md and docs/requirements-tree.md updated.
- No precedent departures, sealed tunables, or listed known-bug fixes.

## Wrong-code pairs

The two tagged tests were written first. For the baseline run, defaultRun retained its old direct-spawn behavior with an injected spawn and exported name; textOf retained its old expression with an exported name. Neither assertion was inverted.

- R-3870: old direct spawn failed the injected win32 cmd lookup comparison; fixed code passes, including bat, executable, missing lookup, refusal and non-Windows cases.
- R-3871: old textOf failed the error-code/message assertion; fixed code passes ENOENT, EINVAL and ETIMEDOUT cases.
- `node packages/nana-pack/tests/template-acceptance.test.mjs`: baseline exit 1; both new test titles failed. See wrong-code.log.

## Checks before commit

- `node scripts/test.mjs template-acceptance.test data-pack.test`: exit 0; 2 files PASS, 22 checks pass. See touched-tests.log. An earlier attempt hit the external 200-second command limit; the complete retry used a longer limit.
- `node scripts/test.mjs template-release.test`: exit 0; 5 checks pass after the fixture dependency update.
- `npm run map`: exit 0.
- `npm run map:check`: exit 0.
- `npm run req:tree`: exit 0.
- `npm run readme:check`: exit 0.
- `node scripts/requirements-trace.mjs`: exit 0.
- `npm run template:accept`: exit 0 on macOS. Native renders use the immutable HEAD template ref and temporary projects.

CI covers the full suite under AGENTS.md; no local full-suite run, push, CI read, or real Windows session was performed. The final report records seat checks repeated on the committed tip.
