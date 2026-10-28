# lane-class · seat check at 51e3b35d (build 5), 2026-10-28

Build 5 answers review round 1's MUST: install code and the gate policy files are hop sources now.

## Side by side with build 4

Over all 448 mapped modules and hook files, run alone with `--files` against main's graph: 441 lines identical, 7 changed. The 7 are exactly the modules the reviewer named, each now naming a nana-setup or gate importer:

- `pi-watchdog.mjs`: install, imported by `nana-setup/lib/pi-invocation.mjs`.
- `worker-config.mjs`: install, imported by `pi-dependencies.mjs`.
- `json-text.mjs` and `release-status.mjs`: install, imported by `doctor.mjs`.
- `objective-path.mjs`: install, imported by `paths.mjs`.
- `rename-retry.mjs`: install, imported by `project.mjs`.
- `real-path.mjs`: gate, imported by `gate-rm-inside.ts`.

The land-record lanes print the same class as at build 4. The builder's report labels its first row "artifact-readers install"; that row is review-texts-durable, and artifact-readers prints ordinary as before.

## Every past lane with a recorded class

A seat workflow collected 239 past lanes from their review folders, main's reflog and the land records. Each lane got its base, tip, changed files and the class the seat recorded at the time; 193 carry a class. The script ran over each lane's files against main's current graph, which is an approximation for old lanes.

- Build 4 disagreed with the recorded class on 29 of 193 lanes.
- Seven judges read each of the 29 lanes' changes against AGENTS.md's words, not the seat's label or the script's line.
- Build 5 disagrees with the judged or recorded class on 15 lanes, and none is an under-call:
  - 12 are lanes the judges call ordinary that print install. They changed only the install-check instrument, the README rehearsal or the project command. The script counts all of nana-setup's bin and lib as install; the definition names install, uninstall and doctor. These cost extra review, not missed review, and are a FEAT-029 known bug.
  - roster-set prints hook through the roster-notice extension's import of `nana-roster.mjs`; one judge called it ordinary, another called silent-main-guard, the same path, ambiguous.
  - review-ledger-run-win-launch prints ordinary; the judge called it ambiguous, because `review-ledger run` is not one of the four tools AGENTS.md names.

| Lane | Recorded | Judged | Build 4 | Build 5 | Deciding file |
|---|---|---|---|---|---|
| install-check-builder | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/install-check.mjs` |
| win-leg-flakes | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/install-check.mjs` |
| review-texts-durable | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/state-manifest.mjs` |
| pi-cmd-launch | ordinary | install-hook-gate | install-hook-gate | install-hook-gate | `packages/nana-pack/extensions/nana-post-edit.ts` |
| process | ordinary | install-hook-gate | install-hook-gate | install-hook-gate | `packages/nana-pack/bin/pi-review.mjs` |
| fresh-install | ordinary | install-hook-gate | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/steps.mjs` |
| seat-guide | ordinary | install-hook-gate | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/steps.mjs` |
| install-check-review-launch | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/install-check.mjs` |
| lift | install-hook-gate | ordinary | ordinary | ordinary | `scripts/requirements-lift.mjs` |
| parallel-runner | install-hook-gate | ordinary | ordinary | ordinary | `scripts/test.mjs` |
| realpath-strict-fallback | install-hook-gate | install-hook-gate | ordinary | install-hook-gate | `packages/nana-pack/lib/real-path.mjs` |
| regroup-shares | install-hook-gate | ordinary | ordinary | ordinary | `scripts/requirements-lift.mjs` |
| install-check-turn-edit-powershell | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/install-check.mjs` |
| pi-seat-live-turn | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/install-check-turn.mjs` |
| project-check-quiet | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/bin/nana-setup.mjs` |
| project-odd-seeds | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/project.mjs` |
| readme-install | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/readme-rehearsal.mjs` |
| watchdog-exit | install-hook-gate | install-hook-gate | ordinary | install-hook-gate | `packages/nana-pack/bin/pi-watchdog.mjs` |
| review-ledger-run-win-launch | install-hook-gate | ambiguous | ordinary | ordinary | `packages/nana-pack/bin/review-ledger.mjs` |
| runtime-map | install-hook-gate | ordinary | ordinary | ordinary | `scripts/test.mjs` |
| win-leg-blocking | install-hook-gate | ordinary | ordinary | ordinary | `scripts/test.mjs` |
| win-watchdog-cpu-read | install-hook-gate | install-hook-gate | ordinary | install-hook-gate | `packages/nana-pack/bin/pi-watchdog.mjs` |
| claude-code-builder-parity | install-hook-gate | install-hook-gate | ordinary | install-hook-gate | `packages/nana-pack/bin/pi-watchdog.mjs` |
| lane-temp-cleanup | install-hook-gate | ordinary | ordinary | ordinary | `packages/nana-pack/bin/pi-worker.mjs` |
| readme-windows-checklist | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/readme-rehearsal.mjs` |
| roster-set | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-pack/bin/nana-roster.mjs` |
| silent-main-guard | ordinary | ambiguous | install-hook-gate | install-hook-gate | `packages/nana-pack/bin/nana-roster.mjs` |
| trust-finds-pi | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/bin/nana-setup.mjs` |
| win-project-files | ordinary | ordinary | install-hook-gate | install-hook-gate | `packages/nana-setup/lib/project.mjs` |

The judges also found the old labels wrong in both directions. Four lanes recorded ordinary changed a pi extension, pi-review or install steps, and six recorded "gate" under the older small, format or gate words changed no gate, hook, install code or tool.

## Rails

All exit 0 at 51e3b35d: map, README, trace, tree, known bugs, identity scan, `lane-class.test.mjs` and `build-records.test.mjs`. No escape was lost. The builder's locked full suite: 228 files, 226 pass, 2 skip.
