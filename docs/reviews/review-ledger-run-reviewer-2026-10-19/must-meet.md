# review-ledger-run-reviewer: `review-ledger run` starts its review command as a reviewer

Feature: FEAT-007 · Review a specific revision independently

**Feature.** `review-ledger run` starts its review command with `NANA_ROLE=reviewer` and `NANA_HANDOFF=off`, as pi-review does, so no knowledge pull or handoff reaches it; a command whose first word is `pi` starts the way pi-review starts pi, so `review-ledger run -- pi …` records a round on Windows too.

**Class: install, hook or gate** (a land and review tool: `bin/review-ledger.mjs`, plus a one-line `bin/pi-review.mjs` change). Ladder: roster reviewer, land reviewer (seat-land.md when the roster prints `land: seat`), seat wrong-code pairs and mutation run, one independent check. Windows CI run 1 on the tests-only commit, run 2 on the fix.
**Threat model.** In scope: honest variation in platform (macOS, Linux, Windows), pi install layout (npm global shim, `.exe`, refused layouts such as Volta) and the caller's environment (a builder's `NANA_ROLE=worker`, a stray `NANA_HANDOFF`). Out: deliberate forgery. `NANA_ROLE=reviewer` stays a context-isolation convenience, not a boundary.

## What is wrong today (main 713d6aa)
1. `bin/review-ledger.mjs:85` spawns `child[0]` by name with the caller's environment unchanged. The knowledge hook is off only for `NANA_ROLE` reviewer or worker (`packages/nana-knowledge/lib/hook.ts:159`), so a `review-ledger run` reviewer gets the pull unless the seat sets the role by hand, and one launched by a builder inherits `worker`. pi-review sets the role (`pi-review.mjs:209`); its watchdog sets `NANA_HANDOFF=off` (`pi-watchdog.mjs:177`).
2. On Windows, Node's spawn by name finds only `pi.com`/`pi.exe`, so an npm-installed `pi.cmd` gives `no verdict (exit ENOENT…)` (inferred from Node's documented lookup; HANDOFF records it). pi-review and pi-worker already start pi through `piLaunch` (R-1125).

## Design
- `bin/worker-config.mjs`: one sealed value `REVIEWER_CHILD_ENV = Object.freeze({ NANA_ROLE: 'reviewer', NANA_HANDOFF: 'off' })`, provenance `// contract: R-1720, R-974`. R-1720's check is its pin.
- `bin/review-ledger.mjs`: when `child[0] === PI_BIN_NAME`, resolve `piLaunch(child.slice(1), { cwd: process.cwd() })` BEFORE `admit`; a `{refused}` dies with `pi launch refused: <reason>`, nothing reserved or started. Any other command keeps `{command: child[0], args: child.slice(1)}`. Spawn with `env: { ...process.env, ...REVIEWER_CHILD_ENV }`.
- `bin/pi-review.mjs`: `childEnv: { ...REVIEWER_CHILD_ENV, NANA_REVIEW_ROOT: tempRoot }` so the contract is defined once (effective env unchanged; R-974 and R-139 keep pinning it).
- `lib/win-command.mjs` and `bin/pi-watchdog.mjs` are not touched. On macOS and Linux `piLaunch` returns `pi` by name with argv unchanged: today's start.
- Adversary probe (temp clone of 713d6aa, temp HOME): the design is 12 changed lines in two files; refusing before admission creates no ledger folder at all.

## Must-meet (rows in FEAT-007 · SUB-008, after R-974)
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-1720 | WHEN review-ledger run starts its review command, review-ledger run shall give that command NANA_ROLE=reviewer and NANA_HANDOFF=off, replacing any value of either in the caller's environment. | `packages/nana-pack/tests/review-ledger.test.mjs::review-ledger run starts its command with NANA_ROLE=reviewer and NANA_HANDOFF=off over a caller's worker role` | Every leg. Probed: with the check added, the file on today's code gave 160 PASS + this FAIL (the child saw `role=worker handoff=on`); on the prototype 161 PASS, exit 0. |
| R-1721 | WHEN the review command's first word is `pi`, review-ledger run shall start the pi that PATH resolves and record its review-shaped output as a round. | `packages/nana-pack/tests/review-ledger.test.mjs::review-ledger run -- pi starts pi and records its round` | Windows leg only (inferred: spawn by name gives ENOENT; the file's win32 fake `pi.cmd` is a placeholder that prints nothing, so a cmd.exe route also fails). PASS on macOS today (probed); it guards the POSIX start against a win32-only resolver. |
| R-1722 | WHERE the platform is win32, WHEN the review command's first word is `pi` and PATH resolves pi to an npm `pi.cmd` shim, review-ledger run shall start that npm package's `pi` bin entry with the running Node and hand it the review arguments unchanged. | `packages/nana-pack/tests/win32-launch.test.mjs::Windows: review-ledger run -- pi starts the npm-installed pi entry with node and the arguments unchanged` | Windows leg, inferred (same ENOENT). SKIP elsewhere: an npm `.cmd` shim exists only on Windows; R-1721 covers macOS and Linux. |
| R-1723 | WHERE the platform is win32, IF the review command's first word is `pi` and pi's launch is refused, THEN review-ledger run shall exit 1 naming `pi launch refused` and the refusal's reason, with no pi started and no round or reservation left. | `packages/nana-pack/tests/win32-launch.test.mjs::Windows: review-ledger run -- pi with a pi.cmd that has no npm package starts nothing and consumes no round` | Windows leg: review-ledger.mjs holds no `pi launch refused` text (read); today it exits 1 with `no verdict (exit ENOENT…)`. SKIP elsewhere: `piLaunch` refuses only on win32. |

## Test shapes
- R-1720 (review-ledger.test.mjs, right after the R-971 check): `ledgerRun(["--item", "ledger-role"], { outFile, extraEnv: { NANA_ROLE: "worker", NANA_HANDOFF: "on" }, cmd: [process.execPath, "-e", "console.log('role=' + process.env.NANA_ROLE + ' handoff=' + process.env.NANA_HANDOFF); console.log('VERDICT: LAND')"] })`. Assert exit 0 and the `--out` text matches `/^role=reviewer handoff=off\r?$/m`.
- R-1721 (next): `ledgerRun(["--item", "ledger-pi"], { cmd: ["pi", "-p", "x"] })` against the file's stub pi (sh on POSIX, `writeFakePi` on win32; default mode prints `VERDICT: LAND`). Assert exit 0 and `roundsOf("ledger-pi").length === 1`.
- R-1722 (win32-launch.test.mjs Windows section, after "Windows: a refused launch writes its reason to --out"): clear `record`; run `review-ledger.mjs run --item winledger --tree <reviewTree> --out <temp>/ledger-out.md -- pi ...rawArgs` with `cwd: temp`, `env`. Assert exit 0, one record, `execPath` and `entry` equal `process.execPath` and `installedEntry` (case-folded), `ppid` is the run's pid, and `argv` deep-equals `rawArgs` (nothing appended).
- R-1723 (next): list `<temp>/.pi/agent/review-ledger.reservations` (empty if absent); clear `record`; run item `winledger-refused` the same way with `-- pi -p x` under `voltaEnv`. Assert exit 1, stderr matches `/pi launch refused: pi at .* is not an npm global install/`, `readRecord()` is empty, no `kind:"round"` row for the item in `<temp>/.pi/agent/review-ledger.rounds.jsonl`, and the reservations listing is unchanged.
- Add both Windows titles to `WINDOWS_TITLES`; name review-ledger.mjs in the file header's @inputs and @effects.

## Known limits
- On Windows any command other than the exact first word `pi` still starts by name: a `.exe`/`.com` (a natively installed `claude.exe`, inferred) starts; an npm `claude.cmd` gives ENOENT; `PI`, `pi.cmd` or a path takes no pi launch. A `.cmd` typed by path throws EINVAL inside the spawn promise: a stack trace, and the reservation stays until stale (today's behaviour; Node's post-CVE-2024-27980 rule, inferred).
- `piLaunch` resolves against the launcher's cwd, not `--tree`; the two differ only for a relative PATH entry.
- For a `claude -p` reviewer the pull is off only because Claude Code runs its hooks with its own environment (its hooks documentation; not probed).
- Both variables pass to every descendant of the review command, as with pi-review (pack README "Non-writer role").
- review-ledger run still injects no review standard, has no stall watchdog and appends no `--name`; a refused launch is not retried.
- R-1722 and R-1723 run only on the Windows CI leg. They read `implemented` from commit 2 because the trace rail refuses a marked `planned` row; the seat confirms them on Windows CI run 2 before the final review.
- The seat drops the two HANDOFF residuals (role; Windows `pi`) in the reviewed change; its by-hand `NANA_ROLE` in its review wrapper becomes redundant.

## Claim most likely wrong
R-1721 to R-1723 fail on the Windows leg today and pass after the fix. Inferred from Node's .com/.exe-only search and the HANDOFF residual; the Windows assertions are written blind on macOS and first run on Windows CI.