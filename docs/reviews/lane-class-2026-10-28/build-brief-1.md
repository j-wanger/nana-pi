Feature: FEAT-029 · Navigate code and investigate impact

Lane lane-class. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/lane-class, based on main at 877b123d. The plan of record is `docs/reviews/lane-class-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it for the reasons behind each must-meet. The plan has no list of allowed edits; its test forecast is a forecast, not a limit.

What the lane does, in one sentence: a script reads a lane's changed or planned files and prints whether the lane is ordinary or install, hook or gate, naming the file and why, and pi-worker prints that line at build end.

Build the plan's must-meet 1 to 7, the sealed-list pin, and its "Also in this change" items. New requirement rows take IDs R-2960 to R-2969. Take the class definition from AGENTS.md:94 and the launch tables the Precedent names; give the sealed list its provenance beside its definition.

Done when each row is `implemented` with backticked `file::title` evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check and the known-bugs check are green.

Report: each must-meet's test title; the sealed list as written; the class your script prints for this lane's own diff; the class it prints for each of the last ten landed lanes (merge-base diffs from `.git/nana/land-records.jsonl` or the commits named in `docs/reviews/lane-class-2026-10-28/plan.md` B2), with every disagreement against the seat's recorded call; each departure from the Precedent below with its reason; every existing test you changed and whether the forecast named it.

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
