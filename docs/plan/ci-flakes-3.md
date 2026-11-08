# Plan: ci-flakes-3

Feature: FEAT-031 · Run checks reliably and without contaminating work

## Purpose

The owner, 2026-11-07: "Do 2 … as well" (fix the remaining flaky tests). Two more cases failed, then passed on re-run, in unrelated lanes or on main, on 2026-11-07 and 11-08:

- `packages/nana-pack/tests/worker-claude.test.mjs` R-2694 "off Windows, SIGTERM sent to pi-worker while its trust check, Claude settings read or HEAD read hangs ends it before any temp file or lane lock exists". It failed on the macOS or Linux leg of lane CI runs 42445916333 and 42449374856.
- `packages/nana-knowledge/tests/build-busy.test.mjs` M2 (R-3591) "ten stale hook pulls and background builds survive read-write churn". It failed on main's Windows run 42509102509 with `noPull=1 … reason=budget`.

Each blocked a land or turned main red.

## Assumptions

- A1. Each case keeps proving its requirement. A fix replaces a timing or ordering assumption with a deterministic signal. It never deletes the assertion or widens a margin without measured provenance.
- A2. The seat exports the failing logs to the builder (`docs/plan/ci-flakes-3/` holds none; the brief points to them).
- A3. One reviewer plus CI. Windows runs on main after the land.

## Open choices

- O1. The builder picks the deterministic signal per case.

## Questions for the owner

None.

## Threat model

Honest variation in runner speed, signal delivery timing and file-system timing. Forgery out.

## Precedent

- `packages/nana-pack/tests/worker-claude.test.mjs`: the R-2694 case.
- `packages/nana-knowledge/tests/build-busy.test.mjs`: the M2 case.
- `packages/nana-setup/tests/pi-launch-limits.test.mjs`: how ci-flakes-2 replaced timing with process identity.

## Outside precedent

none: in-house test fixes.

## Must-meet

- M1 (R-2694). The case passes or fails only on whether pi-worker ends on SIGTERM before any temp file or lane lock exists while each start-up read hangs. The builder names the cause of the two failures from the logs, and the fix addresses it. A pi-worker that ignores SIGTERM during a hanging read still fails.
- M2 (R-3591). The case passes or fails only on whether each stale hook pull returns pointers and background builds complete under churn. A slow runner within the stated limit does not fail it, and a pull that returns nothing does.
- M3 (no lost proof). Each changed case still fails against a wrong implementation, with a mutation pair per case in the build report.
- M4 (adversary 1: the read really hangs). On macOS and Linux, SIGTERM is sent only after read-specific readiness for each of the three start-up reads. Each run pins `{code: null, signal: "SIGTERM"}`, zero builder calls, an empty temp directory and no lock. Moving the no-op signal listener before each read makes that subcase fail.
- M5 (adversary 2: no budget widening). M2's fix keeps the production budget and deadline. If the hook pull path still has a runtime caller after memory-cuts, ten fresh installed-CLI processes on Windows each return their block and complete their rebuild, without retrying missed pulls, and a timing seam proves an exhausted budget returns no pointers. If the hook pull has no runtime caller after memory-cuts cut the automatic pull, the builder shows that by a caller search and retires the case with its row instead of fixing it.
- M6 (adversary 3: real churn). If M2 survives, every run requires acknowledged read-write cycles that overlap the pull and rebuild window, an advanced `built_at`, and no build lock left before the deadline. A churn process that only throws fails, and so does a builder that advances metadata and then hangs while holding its lock.
