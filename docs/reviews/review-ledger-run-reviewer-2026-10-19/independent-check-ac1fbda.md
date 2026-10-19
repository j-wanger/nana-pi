# Independent check — review-ledger-run-reviewer at ac1fbda (2026-10-19)

VERDICT: HOLDS

Setup: a private clone at ac1fbdac and a base clone at 77aa31d1, both under `$P=<tmp>/review-ledger-run-reviewer-check.fd76PQ`. Every probe ran with a temp HOME under `$P`. The stub `$P/stub/pi` prints its argv, its env and `VERDICT: LAND`. I edited no repository. The real `~/.pi/agent` ledger has no rows from these probes: `grep -c fd76PQ` gave 0 and 0. Its 17:03 writes are another session's items (win-post-edit-utf8).

Must-meet tests
- `HOME=$P/home node packages/nana-pack/tests/review-ledger.test.mjs` gave 165 PASS and exit 0, including R-1720 and R-1721. HOLDS.
- `HOME=$P/home node packages/nana-pack/tests/win32-launch.test.mjs` gave 5 PASS, 8 SKIP and exit 0. R-1722 and R-1723 SKIP on macOS ("Windows leg only"). UNVERIFIED here; Windows CI must confirm them.

Probes
1. `NANA_ROLE=worker NANA_HANDOFF=on KEEP_ME=yes review-ledger.mjs run --item p1 --out … -- pi -p "a b" --model m`, with the stub first on PATH.
   - Lane: `argv=[-p a b --model m] n=4` / `role=reviewer handoff=off keep=yes` / exit 0, round 1 recorded.
   - Main: `role=worker handoff=on`.
   - HOLDS: the role is fixed, other env passes through, argv is unchanged and no `--name` is added.
2. Same command, PATH=/usr/bin:/bin, so no pi is found (macOS).
   - Lane and main both print `no verdict (exit ENOENT; 0 chars) — reservation returned, no round consumed`, exit 1, 0 reservations, no rounds file.
   - HOLDS: the POSIX failure is unchanged.
3. `node --import force-win32.mjs review-ledger.mjs run --item p3 … -- pi -p x` (process.platform forced to win32).
   - Lane: `review-ledger: pi launch refused: pi is not on PATH`, exit 1. `find $HOME -mindepth 1` lists nothing, so no ledger, reservation or `--out` was created.
   - Main: `ENOENT … mkdtemp 'undefined\temp/…'` (an artifact of the forcing).
   - HOLDS: the refusal comes before admission.
4. `NANA_ROLE=worker NANA_HANDOFF=on pi-review.mjs --out … --item p4 --stall-secs 30 -- -p x`, stub pi.
   - Lane and main give the same result: `role=reviewer handoff=off keep=yes root=<tempRoot> cwd=<tempRoot>`, `n=8`, SUCCESS round 1.
   - HOLDS: pi-review's effective child env and argv are unchanged by the REVIEWER_CHILD_ENV refactor.
5. `review-ledger run … -- $P/stub/pi -p y` (absolute path).
   - Recorded, with `role=reviewer handoff=off`.
   - `-- node -e "console.log('hello')"` gave `no verdict (exit 0; 6 chars) — reservation returned`, exit 1.
   - `check --item p1` gave `1 round(s) used … revision already counted — no new round`.
   - `report` gave `p1 | 3d5bb13bf8c9 | reviewer | m | 378ms | 1 | LAND | -`.
   - HOLDS: non-pi commands, check and report behave as on main.
6. `env -u NANA_ROLE NANA_KNOWLEDGE_HOME=$P/kh-<v> review-ledger.mjs run --item p6 … -- hookcmd.sh`, a script that pipes a UserPromptSubmit JSON into `nana-knowledge.ts hook`.
   - Lane: the knowledge home stays empty (0 files), because the hook returned at reviewer-role.
   - Main: the hook wrote `pull.log`, `sources.json` and `index.db`, with `"reason":"no-index(spawned)"`.
   - HOLDS: the knowledge pull is really off for a `review-ledger run` reviewer.
7. Mutation in a third private clone: swapped the env spread to `{ ...REVIEWER_CHILD_ENV, ...process.env }`, then re-ran review-ledger.test.mjs.
   - `FAIL review-ledger run starts its command with NANA_ROLE=reviewer and NANA_HANDOFF=off over a caller's worker role`, exit 1.
   - HOLDS: the R-1720 test kills the mutant.
8. `node packages/nana-pack/tests/immutable-review.test.mjs` gave 18 PASS, including `dirty working state is reproduced exactly…` (R-974).
   - `node scripts/code-map.mjs --check` gave `316 modules … 0 problem(s)`, exit 0.
   - `node scripts/readme-check.mjs` gave `706 claims checked; 0 problem(s)`, exit 0.
   - HOLDS.
9. From `"$P/elsewhere dir"`: `review-ledger.mjs run --item p9 --tree $P/repo --out … -- pi -p "with space"`.
   - Exit 0, `argv=[-p with space] n=2`, `cwd=…/repo`, `role=reviewer handoff=off`.
   - HOLDS: the child runs in `--tree`, and an argument with a space stays one argument.

Findings (none are MUST)
1. Known bug (stale HANDOFF at the tip). `HANDOFF.md` still says the opposite of what this change does, at line 102 and line 115:
   - line 102: "`review-ledger run` sets no reviewer role"
   - line 115: "`review-ledger run -- pi` still fails on Windows"

   The plan says the seat removes both in the reviewed change, so this must happen before the final round. No data or tool harm.
2. Known bug (coverage, already named in the plan). Off Windows, nothing tests the new `child[0] === PI_BIN_NAME` branch: piLaunch returns `pi` by name on POSIX, so R-1721 passes with or without the branch. R-1722 and R-1723 are marked `implemented` but only SKIP on macOS. They stay unverified until Windows CI run 2 passes them.
3. Residual (already named in the plan; current behaviour, not a regression). piLaunch resolves pi against the launcher's cwd, not `--tree`. This differs only for a relative PATH entry, and only on win32.

Files: plan `<worktrees>/review-ledger-run-reviewer/docs/reviews/review-ledger-run-reviewer-2026-10-19/must-meet.md`. Changed code: `packages/nana-pack/bin/review-ledger.mjs` lines 80-83 and 93, and `packages/nana-pack/bin/worker-config.mjs` line 71.
