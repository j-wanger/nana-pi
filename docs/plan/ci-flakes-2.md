# Plan: ci-flakes-2

Feature: FEAT-041 · Shape each agent's context by role

## Purpose

The owner, 2026-11-07: "Do 2 … as well" (fix the remaining flaky tests). Two Windows cases failed on 2026-11-07 and then passed on re-run, each blocking a land or turning main red:
- `packages/nana-pack/tests/leak-scan.test.mjs` M4 (R-3751) "every platform matches given and real machine roots once", three times (runs 42389362073, 42405949067, 42413005875).
- `packages/nana-setup/tests/pi-launch-limits.test.mjs` R-2023 "every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report" (main run 42415847531, elapsed 32 s).
The third flaky case seen today, the install check's "hook memory making" timeout, goes away when the memory factory is paused in a later lane and is out of scope here.

## Assumptions

- A1. Each case keeps proving its requirement; a fix replaces a timing or ordering assumption with a deterministic signal, never deletes the assertion or widens a margin without a measured provenance.
- A2. The seat exports the failing logs to the builder (it has no GitHub access).
- A3. One reviewer plus CI. The Windows legs run on main after the land (owner, "Main only").

## Open choices

- O1. Builder picks the deterministic signal per case.

## Questions for the owner

None.

## Threat model

Honest variation in Windows runner speed, short and long path spellings, and process exit timing. Forgery out.

## Precedent

- `packages/nana-pack/tests/leak-scan.test.mjs`: the M4 case.
- `packages/nana-setup/tests/pi-launch-limits.test.mjs`: the R-2023 case.
- `packages/nana-pack/tests/context-anatomy.test.mjs`: how ci-flakes made a timing case deterministic.

## Outside precedent

none: in-house test fixes.

## Must-meet

- M1 (leak-scan M4). The case passes or fails only on whether every platform matches each given and real machine root exactly once; the builder names the cause of the three Windows failures from the logs, and the fix addresses it. A wrong matcher (a root matched twice, or not at all) still fails it.
- M2 (pi-launch-limits R-2023). The case passes or fails only on whether every process a timed-out launch started has ended when the command reports; an injected slow exit inside the allowed wait does not fail it, and a left-over child does.
- M3 (no lost proof). Each changed case still fails against a wrong implementation (a mutation pair per case, in the build report).
- M4 (adversary 1: PID reuse). With a PID reused after the original process exits, the check reports the launch's processes ended; with the original process still alive it reports not ended. Proves process identity, not PID occupancy.
- M5 (adversary 2: both Windows launch paths). The four timeout scenarios run on native Windows (main's CI) with both the npm-entry and the `.cmd` fixtures; each reports stopped with its launched processes ended, and suppressing descendant cleanup in either path fails.
