# Independent check — install-dry-run-pi-packages at 30a5baf9 (2026-10-19)

VERDICT: HOLDS

Setup: a private clone at 30a5baf9, plus a main clone at d4423eff as the baseline, both under $TMPDIR. Every CLI probe ran under `env -i` with a temp HOME and no --home, so each one took the real-home path. I cleaned up afterwards. The lane worktree's HEAD is still 30a5baf9. Its only untracked files are the seat's seat-mutate files, which I did not create.

Probes (P = the private copy; L = the lane clone's packages folder):

1. `node packages/nana-setup/tests/pi-registration.test.mjs`
   Output: exit=0. PASS on R-391, R-358, R-1930, R-1931 and R-1932. The only SKIPs are the existing main-clone and Windows pi.cmd ones. Verdict: OK.
2. `env -i HOME=$H PATH=<node only> node nana-setup.mjs install --dry-run`, then the same command without `--dry-run`
   Both: `– pi packages skipped pi is not on PATH — \`npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 …\`, then re-run`, exit=0.
   HOME had 0 entries after the dry run. Verdict: OK. The dry run now gives the same row as install.
3. The same commands with a pi whose `--version` exits 2, on main and on the lane:
   - main dry: `+ pi packages created would add …` exit=0. main install: `✗ … pi --version failed: pi: broken install` exit=1.
   - lane dry: `✗ … pi --version failed: pi: broken install` exit=1. lane install: the same.
   Verdict: OK. The bug is fixed: the dry run no longer reports success where install fails.
4. A recording pi that answers `--version` with 1.0.2:
   - Dry run: `+ pi packages created would add per-package entries for …/nana-pack/extensions, …/nana-knowledge/extensions`. Summary `35 would change, 2 already in place, 1 skipped`, exit=0, HOME had 0 entries. Calls: `--version PI_CODING_AGENT_DIR=` only.
   - Install: `added per-package entries: …/nana-pack, …/nana-knowledge`, exit=0. Calls: `--version`, then `install <root> PI_CODING_AGENT_DIR=$H/.pi/agent` once for each of the two roots.
   Verdict: OK. The dry run starts no `pi install`, and install still works.
5. HOME with a pre-written `.pi/agent/settings.json`, dry run with the recording pi:
   - Both packages registered: `· pi packages unchanged all extension directories registered as $L/nana-pack`. Calls: none.
   - Only nana-pack registered: `would add per-package entries for …/nana-knowledge/extensions`. Calls: `--version` only.
   settings.json was byte-identical afterwards (cmp) in both cases. Verdict: OK.
6. The real installed pi 1.0.2 on PATH (`~/.local/bin`), temp HOME, `install --dry-run`:
   Output: `would add …`, exit=0, real 0.23 s, HOME had 0 entries. `find ~/.pi ~/.claude/{settings.json,hooks} -newer marker` shows only an unrelated pi session .jsonl from another live lane. Verdict: OK. Nothing nana owns was written.
7. `NANA_SETUP_PLATFORM=win32`, recording pi on PATH, main vs lane:
   - main dry: `would add`. main install: `skipped pi is not on PATH`.
   - lane dry and lane install: both `skipped pi is not on PATH …`, exit=0, no ✗ rows, HOME had 0 entries.
   Verdict: OK.
8. `stepPiRegister` called with injected win32/darwin settings, dry vs install, on cases beyond the tests:
   - pi.exe with a checkout path containing `!`: install `created [version,install,install]`, dry `created [version] would add`.
   - pi.cmd with a path containing `%`: both `problem exit 1 [version] pi install refused: refused character "%"`.
   - pi.cmd with a path containing a double quote: both `problem exit 1 … refused character "\""`.
   - cmd.exe missing: both `problem exit 1 pi --version could not start: spawn cmd.exe ENOENT`.
   - darwin `--version` killed by a signal: both `problem exit 1 pi --version failed: exit null`.
   Verdict: OK. The dry run and install match on every case.
9. Wrong code against the new tests, in a copy:
   - main's steps.mjs: `FAIL R-391`, `FAIL R-1930`, `FAIL R-1931`.
   - The dry-run stop in `launch` deleted: `FAIL R-1932`.
   - The stop turned off with `&& false`: exit=1, `FAIL R-1932`.
   Verdict: OK. The tests catch the regressions.
10. Neighbouring test files with a temp HOME, main vs lane:
    - install: 106/0 on both. stale-copies: 13/0 on both. agent-dir-consumers: 13/0 on both. desk-service: 46/0 on both. doctor-runtime: 21/0 on both.
    - trust.test.mjs exits 1 on both: `ERR_MODULE_NOT_FOUND …/.hermes/node/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/trust-manager.js`. That is this machine's global npm root, not the lane.
    - `npm run readme:check` exit=0. `npm run map:check` exit=0.
    - The new tests left 0 nana-dry-run-pi-* or nana-pi-dry* folders in $TMPDIR.
    Verdict: OK.
11. Other callers of the dry run: the session-start check `stale-copies.mjs` dry-runs `stepSkills` only. `install()` is called only from `nana-setup.mjs`. install-check, `scripts/` and CI never run `install --dry-run`. Verdict: OK. No other code depends on the old dry-run answer.
12. A pi whose `--version` sleeps 3 s: main dry run took 0 s, lane dry run took 3 s, exit=0. The `--version` call has no timeout. Verdict: a known bug, recorded below.

Findings:
- Known bug, not MUST. On the real home, `install --dry-run` now waits on `pi --version`, and that call has no timeout (probe 12). A pi that hangs now hangs the dry run, which main never started. Install and doctor already make the same call. Nothing is written or lost, so this is a residual for HANDOFF.
- Known bug, not MUST, and not new: the dry run's detail lists extension folders (`…/extensions`), while install's lists package roots (probe 4). Main's dry-run text did the same, and the plan keeps it on purpose.

No MUST findings. I found no data loss, no write outside the temp folders, and no broken install or hook. Nothing main does today stopped working: the old dry-run answer was wrong where install reported ✗, and that is what the lane fixes (probe 3).
