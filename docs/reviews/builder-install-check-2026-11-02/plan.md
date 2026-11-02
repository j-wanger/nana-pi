# Plan — builder-install-check

## Purpose

A fix that restores agreed behaviour. The agreed behaviour is R-1071: install-check removes caller overrides, so its sandboxed machine does not inherit the caller's session state. Twice on 2026-11-02 on the Mac, a pi-worker builder ran `node packages/nana-setup/bin/install-check.mjs` and got exit 1 at its "pi post-edit" check, so it reported PARTIAL. The two runs were builder-drop build 4 and knowledge-busy build 9. The seat's own run of the same command on the same tip passed, 23/23. The seat's goal: find which builder-environment difference fails the check, and either make the check correct in a builder's environment or have it report "not applicable" by name.

**Cause, found on the laptop by code reading and confirmed by an in-process probe:**

- pi-worker gives every builder child `NANA_WORKTREE_ROOT=<lane worktree>` (`pi-worker.mjs:399,402`).
- install-check's `buildEnvironment` (`install-check.mjs:20-34`) removes the sealed `OVERRIDE_ENV` names (`install-check-config.mjs:30`): `NANA_ROLE`, `NANA_HANDOFF`, `PI_CODING_AGENT_DIR` and others. `NANA_WORKTREE_ROOT` is not on that list, so it reaches install-check's own pi turn.
- That turn's gate (`nana-gate.ts`, `laneWriteHit`, around 247-258) then blocks any write outside the lane worktree and the temp roots. The sandbox's temp root is `<home>/tmp`, because install-check redirects `TMPDIR`, `TEMP` and `TMP`. The fixture project is `<home>/project` (`install-check.mjs:337`), outside both.
- The post-edit fixture write is blocked, so `judgePiPostEdit` reports `write-error`.
- Probe (`wtroot-probe.mjs`, in the seat's scratch, not committed): the real gate with the sandbox's HOME and TMP layout. Without `NANA_WORKTREE_ROOT`, the write to `<home>/project/install-check-post-edit.txt` is allowed. With it set to a worktree, it is "BLOCKED: nana-gate: lane write boundary blocked … target is outside NANA_WORKTREE_ROOT and temporary directories".
- Not yet reproduced: the full install-check run inside a pi-worker session. The owner's one-build-at-a-time rule holds this laptop to one heavy run, and the probe isolates the mechanism. The build reproduces end to end only if memory allows; see Must-meet.

So the fix is to make the check correct in a builder's environment, not to mark it "not applicable". The sandbox is a fresh machine and must not inherit the caller's lane boundary.

## Design

1. Add `NANA_WORKTREE_ROOT` to `OVERRIDE_ENV`, with its provenance on the existing contract comment.
2. Audit every variable pi-worker and pi-review set for a child: `NANA_ROLE`, `NANA_WORKTREE_ROOT`, `NANA_HANDOFF`, the credential strip (`GIT_CONFIG_*`, `GIT_ASKPASS`, `SSH_ASKPASS`, `GIT_TERMINAL_PROMPT`, `GCM_INTERACTIVE`), and `CLAUDE_BUILDER_CHILD_ENV`. Each is either on `OVERRIDE_ENV` or left in place on purpose.
   - The credential strip stays: the sandbox needs no credentials, and keeping the strip is safer.
   - `CLAUDE_CODE_DISABLE_AUTO_MEMORY` stays: it is harmless to the sandbox's Claude hook checks, which run hooks directly.
   - Record the audit as a comment beside `OVERRIDE_ENV`.

## Assumptions

- A1: The Mac failures had this cause. The Mac's `write-error` detail line was not kept. If the seat's builder logs show a different code (`missing-check-line`, `missing-exit`), this plan's cause is incomplete. Question for the seat: send the failing detail line if it was kept.
- A2: Nothing else in install-check relies on `NANA_WORKTREE_ROOT`. A grep finds no consumer outside the gate.

## Open choices

None.

## Questions for the owner

None.

## Feature

Feature: FEAT-013 · Install and connect harness runtimes

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-setup/lib/install-check-config.mjs,packages/nana-setup/tests/install-check.test.mjs,REQUIREMENTS.md` prints `install: packages/nana-setup/lib/install-check-config.mjs — nana-setup library`. So this is the install ladder: the land reviewer, the seat's wrong-code pairs, one independent check, and the macOS install check before the land (owner, 2026-10-12).

## Threat model

In scope: honest variation in the caller's environment. That covers a pi-worker builder, a pi-review reviewer, a Claude builder, a seat, and Windows key casing. Out: a caller that deliberately sets other variables to defeat the sandbox. That is a residual.

## Precedent

- `packages/nana-setup/lib/install-check-config.mjs`: `OVERRIDE_ENV` and its contract comment.
- `packages/nana-setup/lib/install-check.mjs`: `buildEnvironment` and `judgePiPostEdit`.
- `packages/nana-setup/tests/install-check.test.mjs`: the R-1071 checks (78-97) and the `OVERRIDE_ENV` seal (92-93).
- `packages/nana-pack/extensions/nana-gate.ts`: `laneWriteHit`. Read only.
- `packages/nana-pack/bin/pi-worker.mjs` (399-402) and `packages/nana-pack/bin/worker-config.mjs` (`CLAUDE_BUILDER_CHILD_ENV`): the variables a builder child gets. Read only.

## Outside precedent

none: a one-name environment fix inside this repository's own sandbox.

## Must-meet

Rows R-3713 to R-3715 (FEAT-013); R-1071's seal evidence is amended.

- M1 (R-3713): the sandbox environment never carries a lane boundary. `buildEnvironment` given `NANA_WORKTREE_ROOT` in any case (`nana_worktree_root` on win32) returns no such key.
- M2 (R-3714): install-check's post-edit fixture write passes under a leaked lane boundary.
  - The real gate runs in-process with the environment `buildEnvironment` returns for a source that holds `NANA_WORKTREE_ROOT=<some worktree>`, in a sandbox laid out like install-check's: `<home>/project` and `<home>/tmp`.
  - It allows a `write` to `<home>/project/install-check-post-edit.txt`.
  - The same call with the variable added back is blocked. That pair is the wrong-code proof.
- M3 (R-3715): every builder-child variable is decided. A check reads the names pi-worker sets for a builder child, plus `CLAUDE_BUILDER_CHILD_ENV`, and asserts each is either in `OVERRIDE_ENV` or in a sealed kept list beside it. A new pi-worker variable then fails the check until someone decides it. Export the names pi-worker sets from `worker-config.mjs` if they are not already a named constant; this is a departure under the standing authorization.

Expected existing-test edits: the `OVERRIDE_ENV` seal (`install-check.test.mjs:92-93`), whose length becomes 10.

Seat checks:
- `install-check.test.mjs`, `worker-lane.test.mjs` and `test-runner.test.mjs`.
- The map, readme, trace, tree and known-bugs checks, and the identity scan.
- Seat wrong-code pairs: drop the new override, and drop a kept-list entry.
- If memory allows after slot 1's build: `node packages/nana-setup/bin/install-check.mjs` run once here with `NANA_WORKTREE_ROOT` set, and its "pi post-edit" line recorded. The macOS run before the land is the seat's.

## Seat confirmation (2026-11-02)

The seat read both Mac builder failures, and both match this plan's cause. knowledge-busy `build-9-report.md` line 51: "pi post-edit failed with `write-error: write tool result is marked as an error`" (18 checks passed before it). builder-drop `ci-harness-checks.txt` line 67: "FAIL pi post-edit — write-error: write tool result is marked as an error". A1 holds.

## Revision 2 (after `plan-attack.md`: 2 MUST, 2 SHOULD, all taken)

These changes override the sections above wherever they differ.

- **M3, replaced (attack 1).** The builder child's environment additions move into one exported, frozen definition in `packages/nana-pack/bin/worker-config.mjs`, for example a `builderChildEnv(cwd)` function or a constant of names plus values. pi-worker builds both its pi and Claude builder child environments from it (`pi-worker.mjs:397-402`, including `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS`), so the audit reads what the launcher really uses. M3 then asserts that every name in that definition, plus `CLAUDE_BUILDER_CHILD_ENV` and every name `credentialStripEnv` adds (the numbered `GIT_CONFIG_KEY_n`/`GIT_CONFIG_VALUE_n` family matched as a pattern), is either in `OVERRIDE_ENV` or in a sealed `KEPT_CALLER_ENV` list beside it in `install-check-config.mjs`. Wrong-code: adding a real variable to the definition without classifying it fails M3. pi-review's `NANA_REVIEW_ROOT` and the watchdog's additions go in the audit table only (see below), as "no affected consumer found, not tested under a full reviewer environment".
- **M2, made portable (attack 2) and extended (attack 3).**
  - The fixture places the sandbox home the way install-check does, under `os.tmpdir()`. The test computes the gate's accepted temp roots (`acceptedTempRoots` in `gate-temp-roots.ts`) for that environment.
  - Where `<home>/project` lies outside every accepted root (win32, and macOS `/var/folders`), the leaked-boundary call must be blocked and the sanitized call allowed.
  - Where it lies inside one (Linux `/tmp`), both calls are allowed and the test says so, while M1 still proves the variable is removed.
  - M2 goes past the gate. It writes the file, runs the real `nana-post-edit` handler with install-check's post-edit config, and passes the record to `judgePiPostEdit`. The sanitized environment must be judged passed. A leaked, non-exempt boundary must be judged `write-error`. It starts no pi session and no full install.
- **Audit table (attack 4).** A compact table goes in the plan's lane folder (`env-audit.md`), with one row per variable family: family, set by, consumer in install-check, decision, and tested or not.
  - Credential resets: kept. The review git steps set their own identity, and the README rehearsal clones locally.
  - Nested worker boundary: install-check's own pi-worker step sets its own.
  - `PI_SESSION_ID` and `PI_SESSION_FILE`: runtime metadata, `profile-config.mjs:25-28`.
  - `NANA_REVIEW_ROOT` and watchdog state.
  The table separates "tested under the full builder environment" from "no affected consumer found".
- **Lane class** stays install. pi-worker and worker-config also change, which the builder reports.
