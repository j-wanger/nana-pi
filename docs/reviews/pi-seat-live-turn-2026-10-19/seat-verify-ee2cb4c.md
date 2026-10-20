# Seat checks — pi-seat-live-turn builds 1 and 2, tip ee2cb4c (2026-10-19)

- CI run 39344704047 on draft pull request #83 (ee2cb4c9, build 2; GitHub's merge commit `353008c5` onto c827fcf8):
  macOS `167 files: 165 PASS, 0 FAIL, 2 SKIP` (7,670 checks pass, 0 fail, 25 skip); Ubuntu `167 files: 165 PASS, 0
  FAIL, 2 SKIP` (7,615 pass, 0 fail, 43 skip); Windows `167 files: 150 PASS, 0 FAIL, 17 SKIP` (6,610 pass, 0 fail, 78
  skip; `ci-windows-run-1.log`). The skips are main's declared ones: hooks-win32-exec and study-tasks off Windows, the
  16 desk files and study-tasks on it. None of main's known failures showed (Ubuntu GP1/GP2, the PR merge-commit R-291
  total).
- The lane's file on every leg: install-check.test.mjs passes 114. The Windows leg prints each new check by title:
  the four `pi turn` checks (R-1790 to R-1793), the `pi session` check (R-1794), the adoption check (R-1795), the
  fixture check (R-1796) and the pin, all PASS.
- Both CI install-check jobs succeed and print `PASS pi turn`. macOS prints 15 items, all PASS: install, pi-subagents,
  pi list nana-pack, pi list nana-knowledge, pi session, pi turn, hook set, roster notice, shared memory, verifier pipe
  (Bash), knowledge pull, adoption, objective, doctor, readme checklist. Windows prints 15 items, all PASS: the same
  without readme checklist and with verifier pipe (PowerShell) (`ci-windows-install-check-run-1.log`). This is the first
  CI proof that one real pi print-mode turn in a fresh install shows the objective, rulings, writing and knowledge
  injections in the model request and nana-gate's block on a scripted bash call, on macOS and on Windows. The `pi turn`
  line follows the `pi session` line by 0.77 s on macOS and 1.66 s on Windows, inside the sealed 60 s turn timeout. So
  the adversary's claim most likely wrong, that pi's loader resolves the fixture's root `@earendil-works/pi-ai` import
  on CI's Windows leg, held: no `Failed to load extension` line, and the turn passed. The knowledge pull's 2 s budget
  also held on the cold Windows runner.
- The seat's real install check on macOS (`node packages/nana-setup/bin/install-check.mjs`):
  - On build 1 (0a88cbea): `FAIL pi turn — exit: exit status 1`, every other item PASS. The record file was written.
    The seat reproduced it by hand in the retained home. The prompt and the run token reached pi as two positional
    arguments. pi took the second as another message, the fixture provider had no third answer queued (`No more faux
    responses queued` on stderr), and pi exited 1. With one joined argument the same command exits 0. The mocked unit
    tests could not see this: they stub pi and the record. The seat sent it back as `build-brief-2.md`.
  - On build 2 (ee2cb4c9): all 15 items PASS, including `PASS pi turn`.
- The builder's reports (a pi gpt-5.6-sol builder through pi-worker; the seat did not re-run the tries):
  - Build 1 (0a88cbea): R-1790 to R-1796 implemented; install-check.test.mjs 114 PASS; every must-meet check red under
    the builder's wrong code: worker environment, dropped prompt, direct win32 spawn, knowledge looked for in the system
    prompt, rulings judged by tag, ignored exit status, skipped stderr scan, a single stale prefix, and the fixture
    registered in a package manifest. The report as relayed to the seat names no separate try for R-1792 (isError,
    toolName, any tool text) or R-1794 (letter case, notify only, a bare parse, no cap), which the brief listed; it says
    every must-meet check turned red.
  - Build 2 (ee2cb4c9): one joined prompt argument; a non-zero exit's FAIL detail now names the last stderr line,
    bounded by R-1070's 200-character cap. R-1790 is reworded to pin exactly one prompt argument holding the prompt and
    the run token, and its check is red on the split form. The R-1791 check, also cited by R-1070, is red when the
    stderr line is left out of the detail.
- The seat on ee2cb4c: `node scripts/requirements-trace.mjs` reads 1,432 rows, 0 off form, exit 0; `npm run map:check`
  reads 0 problems; `npm run readme:check` reads 710 claims, 0 problems. R-1790 to R-1796 read `implemented`.
- The setup README's install-check section dropped one sentence: a Windows green result is not a substitute for the
  owner's Windows machine rehearsal. Build brief 1 said to add no owner name; the build removed the sentence instead
  of rewording it. The final reviewer judges whether a true limit was lost.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle. The plan's
  known limits go to HANDOFF as carried lines.
- Main has moved since the lane branched: main is `f0d6da24` (knowledge-pull-fail-open-pin landed). A merge of main and
  a confirmation round follow before the land. Then, by the owner's 2026-10-12 rule, the seat runs the macOS install
  check on the landing tip, and reads CI's Windows install-check leg on the reviewed tip.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on ee2cb4c):

  ```
  tree movement c827fcf..ee2cb4c: 7 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-1790 new (implemented)
    R-1791 new (implemented)
    R-1792 new (implemented)
    R-1793 new (implemented)
    R-1794 new (implemented)
    R-1795 new (implemented)
    R-1796 new (implemented)
  ```

  R-1070's text is unchanged; its evidence gains the R-1791 check.
