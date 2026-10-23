# Review — claude-code-builder-parity (pi-worker starts a Claude Code larger-lane builder itself), 2026-10-23 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: gate (pi-worker's lane launch and pi-watchdog's `runOnce`, which every pi-review round also runs; no hook, extension or nana-setup file changes). Threat model: honest variation in rosters (any of the four Claude Code models in `largerBuilder`), in how claude is installed (a POSIX symlink to a native binary, a Windows `claude.exe`, an npm `claude.cmd`), in user settings (bypass or default permission mode, user MCP servers and hooks, a proxy, CA, key or login helper in `env` or as helper keys, a missing, unreadable, malformed or non-object settings file, `CLAUDE_CONFIG_DIR` set or not), in briefs (inside or outside the worktree, holding `"`, `%`, `!`, CRLF or no final newline, with or without a `Feature:` line and a known-bug file), in machine state (claude missing, logged out or exiting non-zero, a held lane lock, a long quiet tool run, Ctrl-C or SIGTERM) and in Windows 8.3 and differently cased paths; deliberate forgery out (a builder that reaches outside its tools through Bash or unsets its env, a seat that starts an Agent-tool subagent by hand, a brief, roster or prompt file edited mid-launch).

Review `git diff 5c47155f..HEAD` on `feat/claude-code-builder-parity`. Main is 5c47155f (ci-timing-records, just landed). The lane branched from 16c902c2 (build-records) and merged main twice: c4076461 (session-start-frontier and park-deliverables) and 32572eeb (ci-timing-records; FEAT-007 known bugs kept from both sides, the code map and tree outline regenerated). The rest of each merge diff is the landed lanes, already reviewed there. The lane's own commits: 8cff0d1b (plan of record), ef39406b (build 1, the feature), 328bb44e (pairs, Windows findings F1 and F2, build brief 2), f8bdd255 (build 2, the Windows `.cmd` launch and R-2647's native path), 32c8e039 (pairs, findings F3 and F4, the smoke and independent check kept, FEAT-006 and FEAT-007 known bugs, build brief 3), 032080a2 (build 3, R-2647's oracle), 506b7298 (pairs at 032080a2), c322a290 (notes), and the final commit with this review's two briefs.

The plan of record is `docs/reviews/claude-code-builder-parity-2026-10-22/must-meet.md`: the seat's decisions, rows R-2646 to R-2655 with R-2652 in FEAT-014, the tunables, the wrong-code pairs and the known limits, amended on 2026-10-23 by its "Settings carry" section (R-2655, R-2664, R-2665). The owner approved retiring the subagent route on 2026-10-23, with one constraint: a builder must still log in and reach the model on a machine whose Claude Code settings hold its proxy. `plan-draft.md`, `plan-attack.md`, `proxy-measure.md`, `proxy-docs.md` and `proxy-verdict.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 35 red at 032080a2, 20 by exactly their named titles and 15 with an unnamed red as well (`seat-mutate-output-032080a2.txt`). p12 runs only on Windows; it and build 2's two Windows pairs (pi-worker leaves a cmd.exe Claude launch detached; the watchdog ignores a launch's detached option) are red on the windows-latest runner at f8bdd255 (`seat-win-pairs-f8bdd255.txt`). That run's baseline failed only R-2647, finding F3, which build 3 fixed.
- Windows findings, measured on a scratch CI branch: F1, a detached cmd.exe lost the `.cmd` claude's output (the cause is inferred, the fix measured); F2, R-2647 expected the 8.3 short path; F3, R-2647's known-bug bytes differ after git's CRLF checkout in the fixture worktree. Pair finding F4: under p9 the test file threw before R-2647.
- The seat's smoke at ef39406b (`seat-smoke-ef39406b.md`): a fake-endpoint capture of the real claude binary's request, settings file and permission mode, and two real haiku builds.
- The independent check at ef39406b (`independent-check-ef39406b.md`): no material problem. Its notes are FEAT-006 known bugs, among them a review-only option in lane mode leaving the carried settings file in the temp folder, and a builder's running Bash command outliving the ceiling, as for pi.
- The seat's per-build diff check finds no removed line holding an escaped `\n`, `\r` or `\t` that the build did not keep. Session titles: 0 missing. Build 3's locked full suite: `215 files: 213 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, readme:check, the trace and the tree check are green, and the HANDOFF writing check finds no long sentence.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 5c47155..32572ee: 15 rows in 2 features
FEAT-006 · Launch builders with execution limits
  R-1124 text changed
  R-1191 implemented -> retired; text changed
  R-2646 new (implemented)
  R-2647 new (implemented)
  R-2648 new (implemented)
  R-2649 new (implemented)
  R-2650 new (implemented)
  R-2651 new (implemented)
  R-2653 new (implemented)
  R-2654 new (implemented)
  R-2655 new (implemented)
  R-2664 new (implemented)
  R-2665 new (implemented)
FEAT-014 · Create or adopt a project workspace
  R-1193 implemented -> retired; text changed
  R-2652 new (implemented); also applies: FEAT-006
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included (R-2650 and R-2647 run there with a fake `claude.cmd`). The seat lands only on green.

Ask above all: does a Claude Code builder started this way get the builder's rules, brief and known bugs, stay inside pi-worker's lock, ceiling and signals, and still log in where the user's own settings hold the login or proxy, without the carry leaking any other user setting or any value into output? And is the pi builder's launch, and every pi-review round through `runOnce`, unchanged?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
