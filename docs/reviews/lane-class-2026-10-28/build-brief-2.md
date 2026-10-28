Feature: FEAT-029 · Navigate code and investigate impact

Lane lane-class. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Build 1 stopped after 13 minutes: pi-worker's watchdog killed it at 75 seconds of flat CPU while its locked full suite ran as a separate command with output sent to a file. Its work is uncommitted in this worktree: changes to AGENTS.md, REQUIREMENTS.md, docs/code-map.md, the pack README, pi-worker.mjs, build-records.test.mjs and blast-radius.mjs, and three new files, `scripts/lane-class.mjs`, `packages/nana-pack/lib/lane-class-config.mjs` and `packages/nana-pack/tests/lane-class.test.mjs`. Read them, check them against the plan, and finish the lane from there.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

Everything else stands as build brief 1 says: the plan of record is `docs/reviews/lane-class-2026-10-28/plan.md` with `plan-attack.md` beside it; build must-meet 1 to 7, the sealed-list pin and the "Also in this change" items; rows R-2960 to R-2969; the same done-when checks and the same report.

## Precedent

- `scripts/blast-radius.mjs:295-322`: the changed set, a merge-base diff plus untracked files. It is lifted into one exported function that both scripts import, per the 2026-10-22 second-caller ruling.
  - `scripts/blast-radius.mjs:105-140` (`blastModel`) keeps only mapped modules. The class check matches raw paths first and uses the map only for hops.
- `scripts/code-map.mjs:45, :54`: the `impact` re-export and `repoGraph`, for the import hop.
- `packages/nana-pack/lib/blast-radius-config.mjs`: a sealed config module with provenance. The sealed list follows its form.
- `packages/nana-pack/lib/review-movement.mjs:16-31` and `packages/nana-pack/lib/review-movement-config.mjs:18`: a pack lib that runs a `scripts/` CLI as a child process. It runs only when the tree carries the file at HEAD, under a sealed timeout. pi-worker's call follows it, timeout included.
- `packages/nana-pack/bin/pi-worker.mjs:339, :385`: `buildEndLine`, after which the class line prints.
- `packages/nana-setup/lib/hook-producer.mjs:30-47` and `packages/nana-setup/lib/settings.mjs:194-233`: the launch tables. They are read for the launched-CLI list and its provenance, and not edited. They name four launched CLIs today, `packages/nana-setup/bin/stale-copies.mjs` among them.
- `code-map.config.json:44`: the layers. Nothing in a package may import from `scripts/`, so pi-worker spawns the class script as a child process and never imports it, as review-movement does.
- `packages/nana-knowledge/extensions/nana-knowledge.ts:57`: an extension that launches a CLI with `execFile`. That is why launched CLIs are hop starts.
- `packages/nana-pack/extensions/nana-gate.ts:51-58`: the gate extension imports the gate libraries directly. The sealed list still names the five `packages/nana-pack/lib/gate-*.ts` files as gate policy.
- `packages/nana-pack/tests/build-records.test.mjs:312-313`: the R-2602 check on pi-worker's last stderr line.
- `AGENTS.md:94`: the class definition the list encodes.
