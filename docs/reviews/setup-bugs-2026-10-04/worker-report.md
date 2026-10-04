# setup-bugs-2026-10-04 — worker report

Worktree: `~/nana-pi-wt/setup-bugs`, branch `feat/setup-bugs`, cut from main `ae15067`.
Commits: `8fd0dca` (round 1), `0bc93eb` (round 2, astra r1 fixes below).

**Correction to round 1 (claim 1):** the claim below that Node's ESM `fs` namespace
is frozen and unreachable from outside the module is **false** — astra r1's SHOULD
finding showed `require('fs')` mutation + `node:module`'s `syncBuiltinESMExports()`
reaches it. See the astra r1 section for the corrected test and the true base
reproduction it adds. The injected-seam parameter itself stood; only the test's
explanation and its claim to be "the" reproduction were wrong.

## Claim 1 — project-key.mjs:50-56, readlinkSync uncaught

**BUG.** Reproduction: Node's ESM `import * as fs from "node:fs"` namespace is frozen
(confirmed empirically — assignment, `Object.defineProperty`, and mutating the CJS
`exports` object via `createRequire` all fail or go unobserved), so no real race or
external failure can be injected into the module's own `fs` binding. Added a 4th,
optional `readlinkSync` parameter (default: the real one, no production caller
passes it) purely as a test seam. `tests/shared-link-state.test.mjs`, pre-fix: calling
`sharedLinkState` with an injected `readlinkSync` that throws ENOENT threw past the
function — FAIL. Fix: wrapped the call in try/catch, returning `"absent"` (matching
the module's own `@errors none` contract). Row **R-377**. Mutation: reverted the
try/catch only (kept the seam) → test went red (`FAIL ... not a throw`); restored →
green.

## Claim 2 — paths.mjs:84, isRealHome vs --home

**BUG.** The doc comment (lines 82-83) says isRealHome is false "whenever a
--home/--claude-home/--pi-home override is in play," but the code only excluded
`claudeHome`/`piHome`. `resolveLayout({ home: os.homedir() })` (the literal
`--home "$HOME"` case) read `isRealHome: true` — confirmed by running it directly
pre-fix. No existing test caught this because every test uses a throwaway temp dir
for `--home`, never a value equal to the real home. Fix: added `&& !opts.home`. Row
**R-378**, `tests/paths.test.mjs`. Mutation: reverted the one token → FAIL; restored
→ PASS.

## Claim 3 — fsops.mjs:140-152, writeIfChanged symlink write-through

**BUG.** `tests/fsops.test.mjs` pre-fix: a target that is a live symlink to a file
outside the write path got overwritten through the link (`victim.txt`'s content
clobbered, status `UPDATED` not `SKIPPED`); a dangling symlink's missing target got
materialized (status `CREATED`, file now exists at the link's target) — both FAIL,
confirming the claim against the module's own documented contract ("a symlink ... in
the way is returned as SKIPPED and never written through," matching `linkFile` and
`seedFile`). Fix: added the same `lstat` guard the other two primitives use — a
symlink or directory in the way is SKIPPED, untouched. Row **R-379**. Mutation:
reverted the guard → 4 of 10 checks red (both overwrite and the two status checks);
restored → all 10 green.

## Totals

- `node scripts/requirements-trace.mjs` — exit 0, 538 rows (464 implemented, 464 traced).
- `npm run map:check` — exit 0, 172 modules, 0 problems (3 new test files added, map
  regenerated and committed).
- `npm test` (full suite, run twice) — exit 1 both times, solely from
  `packages/nana-pack/tests/readme-check.test.mjs` (5 problems: `apps/bench/.ext`
  and `node_modules` absent) — the worktree's documented environmental gap (no root
  `node_modules`, no `apps/bench/.ext`), not a regression. All other 94 files passed:
  95 files, 93 PASS / 1 FAIL / 1 SKIP, 5488 checks pass / 2 fail / 6 skip. The three
  new/touched test files (`fsops.test.mjs` 10 pass, `paths.test.mjs` 4 pass,
  `shared-link-state.test.mjs` 2 pass) were clean in both runs.

## Expect a reviewer to break

Claim 1's fix: the injectable `readlinkSync` parameter is production-code surface
added solely to make an otherwise-unforceable failure testable. A reviewer may argue
this is scope creep beyond "the smallest fix," or may want the seam named/shaped
differently (e.g. an injectable `fs` object instead of one function) for consistency
with other modules in the package, none of which currently accept DI.

## astra r1 (BLOCK 7/10, `docs/reviews/setup-bugs-2026-10-04/astra-r1.md`) — round 2

### MUST 1 — stepDesk ignored SKIPPED and still called launchctl

**BUG, confirmed by astra.** Reproduction: a hand-built `layout` (`isRealHome: true`)
with a `launchctl` stub placed first on PATH (a fake executable logging every
invocation). A live symlinked plist and a dangling one both still drove `print` +
`bootout` + `bootstrap` and reported "reloaded" — matching astra's executed
evidence exactly. Fix: `stepDesk` now returns right after the `SKIPPED` check,
before any launchctl call, reporting `desk launchctl: skipped`. New caller-level
tests in `tests/desk-service.test.mjs` (live symlink, dangling symlink, zero
launchctl calls, target bytes unchanged, plus a regression case confirming the
ordinary path still calls launchctl). Row **R-380**. Mutation: removing the early
return turned 4 checks red (both status checks and both "zero calls" checks);
restored, all green.

### MUST 2 — R-379 promised "instead of reading ... through it" with no test pinning it

**BUG, confirmed by astra.** Astra's mutation (a caught, discarded
`fs.readFileSync(target)` inserted before the lstat guard) left all ten prior
`fsops.test.mjs` checks green. Fix (test-only; no further code change needed —
the guard already returns before any read): instrumented the REAL
`fs.readFileSync` globally for the duration of one call via `require('fs')` +
`syncBuiltinESMExports()`, and asserted no recorded call targets the link or its
destination; also asserted the link's destination path is unchanged. Reworded
**R-379** from WHERE to WHEN (it describes a runtime condition, not an optional
feature). Mutation: replayed astra's exact mutation verbatim — both new checks
went red; restored, green.

### SHOULD — shared-link-state.test.mjs's reproduction claim was wrong

**Confirmed by astra; fixed.** The file's comment claiming Node's ESM `fs` binding
is unreachable from outside the module was false, and — astra's sharper point —
the committed test never actually reproduced the bug against true base (`ae15067`):
that commit's 3-argument function ignores an unused 4th call argument and returns
`"linked"`. Added a true reproduction: wrap the real `fs.lstatSync` (via
`require('fs')` + `syncBuiltinESMExports()`) to delete the link immediately after
it returns the genuine stat, so native `readlinkSync` throws `ENOENT` with no seam
involved at all. Kept the injected-seam test too (astra ruled it reasonable,
precedented by `install.test.mjs`'s `afterTempWrite`), relabeled as the narrower
deterministic unit check it actually is. Mutation: reverting R-377's try/catch
turns both the true-reproduction and the seam test red; restored, both green.

### Totals (round 2)

- `node scripts/requirements-trace.mjs` — exit 0, 539 rows (465 implemented, 465 traced).
- `npm run map:check` — exit 0, 172 modules, 0 problems (map regenerated and committed).
- `npm test` (full suite, once) — exit 1, solely `packages/nana-pack/tests/readme-check.test.mjs`
  (5 problems: `apps/bench/.ext` and `node_modules` absent) — same known environmental
  gap as round 1, not a regression. 95 files: 93 PASS / 1 FAIL / 1 SKIP, 5507 checks
  pass / 2 fail / 6 skip. Touched files clean: `desk-service.test.mjs` 31 pass,
  `fsops.test.mjs` 14 pass, `shared-link-state.test.mjs` 4 pass, `paths.test.mjs` 4
  pass, `project-key.test.mjs` 13 pass + 1 skip.

### Expect a reviewer to break

The `syncBuiltinESMExports()` global-monkeypatch technique mutates the process-wide
`fs` binding for the duration of one synchronous call. It's restored in a `finally`
and the window is a single synchronous call with no I/O yield, but a reviewer may
still want this pattern confined to a shared test helper rather than repeated
inline in two files, to keep the blast radius of a mistake (an un-restored patch)
smaller as more tests adopt it.
