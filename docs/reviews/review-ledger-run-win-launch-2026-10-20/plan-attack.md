# review-ledger-run-win-launch — plan attack (one adversary)

Verdict: AMEND

AMEND: the plan holds, but one row was wider than its design and the brief left out a regeneration step. Probes ran in a temp clone of main a112fd30 with a temp HOME, made-up names and no background processes; the temp folder has been removed.

1. R-2250's design did not keep its promise for a mistyped command.
   - The row promises a `cannot start` line on stderr and in --out whenever review-ledger run cannot start its command.
   - The design only handled a synchronous spawn throw and a refusal.
   - Probe on main: `run … -- nana-absent-reviewer-xyz` printed `no verdict (exit ENOENT; 0 chars)`, exited 1 and left an empty --out. So on macOS and Linux a mistyped reviewer name would still break the row.
   - Fix: the spawn's `error` event also calls cannotStart. review-ledger never kills or messages its child, so that event means the command did not start.
   - Prototype: `cannot start nana-absent-reviewer-xyz: ENOENT`, exit 1, the reason in --out, no reservation left. A node reviewer still recorded its round.
   - The R-2250 test now makes two runs: an empty command and a missing one. Both are red today (probed).
   - New wrong-code pair W4: the error event still ends as `no verdict`.
2. The R-1723 check grows a condition on --out, which is wider than R-1723's row. Its marker becomes `// req: R-1723 R-2250`. Multi-ID markers already exist in that file.
3. The brief left out `npm run req:tree` and the file docs/requirements-tree.md. Every sibling lane regenerates it, so it is added to the brief and the file list.
4. The plan cited HANDOFF residuals by line number. Those numbers have already drifted by one on main, so the plan now names each residual by its topic.
5. The R-2251 check now compares command and args, not the whole object, so a harmless `options: {}` cannot fail it. The R-2252 check now spells out the literal cmd.exe line.
6. A known limit is added. Today libuv looks for a bare name in the reviewed tree's folder first. findOnPath searches PATH only, so a program sitting in the tree no longer starts (inferred from libuv's search_path).

Confirmed by probe or read:
- On main, `-- ""` prints a raw ERR_INVALID_ARG_VALUE stack, exits 1, writes no --out and leaves the reservation until the next admission prunes it.
- A prototype resolver under injected win32 gave the plan's expected output for every case in R-2251 to R-2253. That includes `""` resolving to `not on PATH` on win32.
- Moving the refusal after admission still meets R-1723's existing test: its stderr pattern matches and the reservations are unchanged after release.
- Lane class is correct: review-ledger is a land and review tool.
- R-2254 (Windows only) is needed. On macOS the wiring cannot be seen. Only R-2254 and R-1722 on Windows catch W10 and W11.

Conflicts: none.
- mutation-runner-takeover-race and notify-lifecycle-pins have landed (main a112fd30).
- No in-flight or slate lane touches review-ledger.mjs, win32-launch.test.mjs, win-command.mjs, pi-watchdog.mjs or the new files.
- Two in-flight lanes edit the pack README, at lines ~105 and ~782. This lane edits ~185-189, ~275 and ~342, so there is no overlap.
- REQUIREMENTS.md, the code map and the requirements tree are shared by every lane: merge main, then regenerate.

Seat note: the seat's wrong-code table under docs/reviews must not spell a pi launch as a literal spawn("pi" text.

Most likely wrong: R-2254 passing on its first Windows CI run. It needs npm's cmd-shim text, started through winCommand's `cmd.exe /d /v:off /s /c` line from a folder with a space, to hand node the `&` and parentheses argument and the piped multi-line stdin unchanged. Nobody has run that check on Windows yet.
