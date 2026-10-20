# Seat checks — win-pi-launch-orphan builds 1 and 2, tip ee6b3b6c, merged with main 5ef07f7f at 39c0db9f (2026-10-20)

- Plan, probe and builds. The lane branched from main 72abe19a. The plan is 113b0ef5 (`must-meet.md`,
  `plan-attack.md`: one adversary, AMEND; `build-brief-1.md`).
  - The seat's Windows probe ran before any build (8fe32abd: `win-orphan-probe.mjs`, its output
    `win-orphan-probe-output.txt` beside it). It ran on a scratch windows-latest CI job, run 39437686060 on b056a853
    (the plan tip plus the probe and a Windows-only CI step). Last line: `BRANCH 1`. Under today's Command Prompt
    route, a kill of install ended the relay and cmd.exe within 50 to 65 ms, and pi and its child were still alive
    5 s later (phases A and A2); a kill of the relay alone left them alive too (phase D). Under the direct Node route,
    relay, pi and child all ended within about 51 ms (phases B, B2 and C). So design (a) was built and R-2303 kept.
  - Build 1 is c0856720, by a pi gpt-5.6-sol builder through pi-worker. New `packages/nana-setup/lib/pi-invocation.mjs`
    exports `piInvocation(pi, args, { win32, env, cwd, exists, isFile, readText })`: off win32 it starts pi by name,
    as main does; on win32 it calls pi-watchdog's `piLaunch` (imported, not moved) and, when pi's npm package
    resolves, returns `<running node> <entry> <args>` with empty options; any piLaunch refusal falls back to
    `winCommand` with ComSpec read in any key case, never surfacing piLaunch's reason. `stepPiRegister`
    (`lib/steps.mjs`) and doctor's pi block (`lib/doctor.mjs`) both call it and take `isFile` and `readText` beside
    `exists`; doctor's inline ComSpec block is gone. `bounded-spawn.mjs` and its relay are unchanged. Rows R-2300 to
    R-2303 are new (R-2300 and R-2303 `untested` behind `req-candidate` markers in build 1); R-1034, R-1035 and R-1690
    are reworded to cover only the ComSpec route. The setup README's Windows lookup paragraph, Idempotence and Known
    limits change with it. 8419dcc3 adds the seat's pairs on c0856720.
  - Build 2 is ee6b3b6c (`build-brief-2.md`, 8da038b9), by the same builder. It changes only the two `req-candidate`
    markers to `// req: R-2300` and `// req: R-2303`, those two rows to `implemented` with `; Windows-leg-only`
    evidence, and the README Known limits sentence that said both stay untested.
  - 39c0db9f merges main 5ef07f7f (the objective-path-shapes land tip). In this lane's code files it touched only
    objective-path code in `doctor.mjs` and `steps.mjs`, not the pi launch lines. After 39c0db9f the seat's notes
    commit adds only this record, the independent check, the Windows log, the two review briefs, HANDOFF and the
    session entry.
- CI run 39441915006 on draft pull request #139 at c0856720 (build 1). GitHub's merge commit 8a8f3bcf merges c0856720
  into its own ancestor 72abe19a, so the tree tested is c0856720's. All five jobs succeeded (release skipped):
  - macOS `190 files: 188 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7964 pass, 0 fail, 33 skip`; pi-launch-limits
    `15 pass, 2 skip` (R-2300 and R-2303 skip off Windows).
  - Ubuntu `190 files: 187 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7903 pass, 0 fail, 52 skip`; pi-launch-limits
    `15 pass, 2 skip`.
  - Windows `190 files: 172 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6891 pass, 0 fail, 112 skip`
    (`ci-windows-c0856720.log`). The 18 skipped files are main's declared set: 16 desk files, bench's study-tasks and
    checkout-converge (POSIX only). pi-launch-limits `12 pass, 5 skip`, with its lane lines:
    ```
    PASS R-2301: on win32, install, its dry run and doctor start an npm pi.cmd's package entry with the running Node, its limit, install's agent folder and a checkout path holding % and ! unchanged, never through ComSpec
    PASS R-2302: on win32, a pi.cmd with no npm package beside it, another package there, or the package's entry missing still runs through ComSpec in install, its dry run and doctor
    PASS R-2300: on Windows, a kill of install alone ends the npm pi launch it waits on within the parent check and the signal grace
    PASS R-2303: on Windows, a kill of the pi launch relay alone ends the npm pi it runs and pi's child within the parent check and the signal grace
    ```
    The five skips are R-2026, R-2027, R-2130, R-2131 and R-2133, each with its Windows reason, as on main.
    pi-registration `75 pass, 2 skip`, doctor-runtime `9 pass, 2 skip`, win-command `93 pass`, win32-launch
    `15 pass`, win32-degrade `87 pass, 1 skip`, install-check.test `129 pass`: R-1034, R-1035 and R-1690 stay green on
    their ComSpec fixtures.
  - install-check: macOS and Windows success. The Windows job installed npm pi 1.0.2 (`pi: C:\npm\prefix\pi.cmd`)
    and printed `PASS install`, `PASS pi list nana-pack`, `PASS pi list nana-knowledge` and `PASS doctor`; install
    and doctor exit 1 on any ✗ row, so pi packages and doctor's pi executable read ✓. That is the plan's seat check
    before land. The job prints no launch route; by the layout (npm's global pi.cmd with its package beside it), it
    took the direct route (inferred).
  - None of main's known failures showed (Ubuntu's path spelling, fixed on main at ca27d86; a pull request run's
    R-291 leaf-total merge artifact).
  - CI has not run on ee6b3b6c or 39c0db9f. Build 2 changes two markers, two rows and one README sentence; the merge
    brings objective-path-shapes, green on all three legs on its own run. The land runs the locked suite on the
    reviewed tip, and the local macOS install check runs before the land.
- The seat's wrong-code pairs on c0856720 (`seat-mutate.mjs`, the shared mutation runner, macOS, Node 22.22.2, one
  shard, merge base 72abe19a; record `seat-mutate-output-c0856720.txt`, commit 8419dcc3): baseline pi-launch-limits
  15 PASS, 0 FAIL; 12 of 12 red, each exactly on its named titles, 0 survived.
  - M1 (piInvocation always takes the ComSpec route on win32, main's route) turns R-2301 red.
  - M2 (no off-win32 gate) turns the twelve regression guards red: R-2020 to R-2027 and R-2130 to R-2133.
  - M3, M10 and M12 (piLaunch without the injected isFile and readText: in piInvocation, in stepPiRegister, in
    doctor) turn R-2301 red.
  - M4 and M5 (a piLaunch refusal, or only the entry-file refusal, returned instead of falling back) turn R-2302 red.
  - M6 (the direct route keeps windowsVerbatimArguments) and M7 (winCommand's character refusal before piLaunch)
    turn R-2301 red.
  - M8 (ComSpec read under its exact key only) turns R-2302 red.
  - M9 and M11 (install or doctor keep main's inline ComSpec block) turn R-2301 red.
  - Declared before the run: R-2300 and R-2303 skip on macOS, so no pair here names them. Build brief 1's two
    Windows-only wrong codes (the relay starts pi detached; install starts the relay detached) edit bounded-spawn,
    which the lane did not change, and did not run. Build brief 1's wrong codes 3 and 4 (the direct route drops the
    time limit or install's agent folder) get no pair: steps' spawn call sets both after piInvocation's options, a
    line the lane did not change.
  - The red half of R-2300 and R-2303 on Windows rests on the seat's probe (BRANCH 1), which ran main's route on an
    equivalent stand-in, not on a pair against the lane's code. Their green half runs the lane's code on the Windows
    leg.
  - Build 2 changed no code. A dry run of the same table on ee6b3b6c applies 12 of 12; the seat did not re-run it.
- Independent check (`independent-check-ee6b3b6c.md`, filed under this tip's name): it ran on c0856720 (build 1) in a
  private copy against main 72abe19a, with a temp HOME for every probe. HOLDS, no MUST, over nine probes.
  - Must-meet and regression files on macOS: pi-launch-limits 15 PASS, 0 FAIL (R-2300 and R-2303 SKIP);
    pi-registration 72/0, doctor-runtime 21/0, win-command 47/0, win32-degrade 88/0, worker-lane exit 0.
  - Forced win32 on main and the lane: the fallback's call lists match main except for the checkout path; R-1035
    still refuses `%` with no package. The direct route takes a bin given as a string, the `node_modules\.bin` layout
    and a `C:\a%b!c` path, which main refuses. A package entry that is a folder falls back. Real macOS dry run, doctor,
    install and a second install behave as main. A direct-route-shaped launch through the real relay hands arguments
    and environment over unchanged. code map 0 problems, readme 724 claims 0 problems. No write outside its temp
    folders.
  - Its findings and how each was settled:
    1. Known bug, inferred and not run: on Windows a kill of install, or Ctrl-C, now ends an npm pi through the job
       close with no grace. pi 1.0.2 writes its settings file with a plain write, so a kill during that write could
       cut it short. POSIX main has the same exposure after its one-second grace. The README Known limits name the
       cut-short cleanup and the lock, not the cut-short file. Recorded as a HANDOFF residual, merged with the plan's
       Ctrl-C limit.
    2. Known bug, wording: `piLaunch` also sends a `.bat` pi with the npm package beside it to the Node entry, while
       R-2301 and R-1690 say `.cmd`. npm never writes pi.bat. Recorded as a HANDOFF residual.
    3. Known bug, diagnostics: when the direct route is refused and ComSpec then refuses too, only the ComSpec reason
       shows, as on main. Recorded as a HANDOFF residual.
    4. Known bug, status honesty: the README Idempotence paragraph stated the Windows kill behaviour as fact while
       R-2300 read `untested`. Settled by build 2, ee6b3b6c: R-2300 and R-2303 passed on the Windows CI leg at
       c0856720, build 2 flipped both markers and rows, and the Known limits line now says both are implemented on
       that leg. The Idempotence sentence stays, backed by R-2300's passing check.
  - Not checkable there, both since settled by CI run 39441915006: R-2300 and R-2303 on real Windows, and the
    Windows install-check job with real npm pi 1.0.2.
- The plan's other known limits, each now a HANDOFF residual naming this lane or a rewritten line: a pi.cmd with no
  npm package beside it (pi.dev installer, pnpm, Volta) keeps the Command Prompt route, so a kill of install or of the
  relay still leaves that pi running; pi runs on the Node that runs install; a process pi starts through Command
  Prompt leaves the chain Windows ends with install; no check kills doctor alone; on macOS and Linux a kill of the
  relay alone still leaves pi running. The seat adds one: the pairs ran on macOS only.
- HANDOFF: one Landed line. Four existing lines change. The Windows pi launch line now limits the manual `pi install`
  for a `%` or `!` path to a pi with no npm package. The kill-install-alone line now says the relay died with install,
  so a pi with no npm package ran with no limit (the adversary's correction, seen in the probe), and that an npm pi
  now ends with install. The relay-overrun line and the relay-kill line each say an npm pi now ends with the relay.
  Seven new residuals name this lane.
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2300 to R-2303 read `implemented` in REQUIREMENTS.md; R-2300's and R-2303's evidence says
  Windows-leg-only. At the notes commit (no code or row changed since 39c0db9f): `node scripts/requirements-trace.mjs`
  reads `requirements: 1635 total (1398 implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1398 traced
  by tests` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 358 modules, 0 problems;
  `npm run readme:check` reads 725 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`, run at 39c0db9f):
  ```
  tree movement 5ef07f7..39c0db9: 7 rows in 1 features
  FEAT-013 · Install and connect harness runtimes
    R-1034 text changed
    R-1035 text changed
    R-1690 text changed
    R-2300 new (implemented)
    R-2301 new (implemented)
    R-2302 new (implemented)
    R-2303 new (implemented)
  ```
  CAP-04 moves from 500 to 504 rows, FEAT-013 from 189 to 193 and SUB-013 from 47 to 51.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite at c0856720), Windows-only
  pairs, and the local macOS install check, which runs before the land.
- Main moved under this lane: it branched from 72abe19a; the seat merged the objective-path-shapes land tip 5ef07f7f
  at 39c0db9f, and main has since fast-forwarded to 5ef07f7f, now the merge base and the review base.
  lane-guard-temp-root and linked-claude-folder-remedy land before this lane; their HANDOFF lines say none of this
  lane's items.
