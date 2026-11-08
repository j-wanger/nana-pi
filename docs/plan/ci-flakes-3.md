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
